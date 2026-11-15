import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_VOICES = new Set(['Kore', 'Charon', 'Puck', 'Fenrir', 'Zephyr']);

const DEFAULT_STYLE =
  'Locutor profesional chileno de nivel ejecutivo presentando un informe estratégico ante un directorio: voz humana cálida, natural, expresiva, con pausas respiratorias auténticas, énfasis en las cifras clave y tono conversacional fluido sin sonar robótico.';

// In-memory LRU-style audio cache (keyed by slideKey + voice)
const MAX_CACHE_ITEMS = 60;
const audioCache = new Map<string, Buffer>();
const inFlightRequests = new Map<string, Promise<Buffer>>();

function setCacheEntry(cacheKey: string, wavBuffer: Buffer) {
  if (audioCache.has(cacheKey)) {
    audioCache.delete(cacheKey);
  } else if (audioCache.size >= MAX_CACHE_ITEMS) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) audioCache.delete(oldestKey);
  }
  audioCache.set(cacheKey, wavBuffer);
}

function createGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function callTtsModel(
  ai: GoogleGenAI,
  model: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts',
  text: string,
  voiceName: string,
  style: string
): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text,
            speechMetadata: {
              style: style || DEFAULT_STYLE,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName,
          },
        },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new Error('Gemini TTS no devolvió datos de audio.');
  }

  return Buffer.from(base64Audio, 'base64');
}

async function synthesizeWithRetry(
  ai: GoogleGenAI,
  text: string,
  voiceName: string,
  style: string
): Promise<Buffer> {
  const models: Array<'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts'> = [
    'gemini-3.8-flash-lite-tts',
    'gemini-3.8-flash-tts',
  ];
  let lastError: unknown;

  for (const model of models) {
    for (let i = 0; i < 2; i++) {
      try {
        return await callTtsModel(ai, model, text, voiceName, style);
      } catch (err) {
        lastError = err;
        const status = (err as { status?: number })?.status;
        if (status === 400 || status === 401 || status === 403 || status === 404) {
          throw err;
        }
        // On 429 quota exceeded, switch immediately to the next TTS model instead of looping
        if (status === 429) {
          break;
        }
        if (i === 0) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Error desconocido al sintetizar audio.');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Check whether Gemini neural TTS is available on the server
  app.get('/api/tts/status', (_req, res) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const configured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
    res.json({ configured, model: 'gemini-3.8-flash-lite-tts' });
  });

  // Synthesize natural human voice narration via Gemini 3.8 Flash Lite TTS
  app.post('/api/tts', async (req, res) => {
    const ai = createGenAIClient();
    if (!ai) {
      res.status(503).json({
        error:
          'GEMINI_API_KEY no configurada en el servidor. Configúrala en Settings > Secrets.',
        code: 'MISSING_API_KEY',
      });
      return;
    }

    const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const rawKey = typeof req.body?.slideKey === 'string' ? req.body.slideKey.trim() : '';
    const rawVoice =
      typeof req.body?.voiceName === 'string' && ALLOWED_VOICES.has(req.body.voiceName)
        ? req.body.voiceName
        : 'Kore';
    const rawStyle =
      typeof req.body?.style === 'string' && req.body.style.trim()
        ? req.body.style.trim()
        : DEFAULT_STYLE;

    if (!rawText) {
      res.status(400).json({ error: 'Falta el texto a narrar.', code: 'EMPTY_TEXT' });
      return;
    }

    const cacheKey = `${rawVoice}::${rawKey || rawText.slice(0, 80)}::${rawText.length}`;

    const cached = audioCache.get(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('X-Audio-Cache', 'HIT');
      res.send(cached);
      return;
    }

    try {
      let pending = inFlightRequests.get(cacheKey);
      if (!pending) {
        pending = synthesizeWithRetry(ai, rawText, rawVoice, rawStyle);
        inFlightRequests.set(cacheKey, pending);
      }

      const wavBuffer = await pending;
      inFlightRequests.delete(cacheKey);
      setCacheEntry(cacheKey, wavBuffer);

      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('X-Audio-Cache', 'MISS');
      res.send(wavBuffer);
    } catch (err) {
      inFlightRequests.delete(cacheKey);
      const status = (err as { status?: number })?.status || 500;
      const message =
        err instanceof Error ? err.message : 'No se pudo generar la narración neural.';
      console.error('[TTS Error]', status, message);
      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: message,
        code: 'TTS_FAILED',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`La Serena Digital 2026 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
