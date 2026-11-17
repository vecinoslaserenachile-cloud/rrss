import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_VOICES = new Set(['Kore', 'Charon', 'Puck', 'Fenrir', 'Zephyr']);

// Edición N° 3 institutional access key & persistent audit registry
const EDICION3_ACCESS_KEYS = new Set(
  [
    process.env.EDICION3_ACCESS_KEY?.trim(),
    'CONDOMINIOS2026',
    'VLS-ED3-2026',
  ]
    .filter((v): v is string => Boolean(v))
    .map((v) => v.toUpperCase())
);
const EDICION3_LOG_FILE = path.resolve(__dirname, 'data/edicion3-access-log.json');
const EDICION3_TOKEN_SECRET =
  process.env.EDICION3_ACCESS_KEY?.trim() || 'VLS-CONDOMINIOS-2026-SESSION-SECRET';

export interface Edicion3AccessLogEntry {
  id: string;
  timestamp: string;
  visitorName: string;
  institution: string;
  role: string;
  status: 'granted' | 'denied';
  slideSlug: string;
  ip: string;
  userAgent: string;
  source: 'server';
}

function loadEdicion3Logs(): Edicion3AccessLogEntry[] {
  try {
    if (!fs.existsSync(EDICION3_LOG_FILE)) return [];
    const raw = fs.readFileSync(EDICION3_LOG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendEdicion3Log(entry: Edicion3AccessLogEntry): Edicion3AccessLogEntry[] {
  const existing = loadEdicion3Logs();
  const updated = [entry, ...existing].slice(0, 500);
  try {
    const dir = path.dirname(EDICION3_LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(EDICION3_LOG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Edicion3 Log Write Warning]', err);
  }
  return updated;
}

function signEdicion3Token(visitorName: string): string {
  const payload = `${visitorName}::${Date.now()}`;
  const sig = crypto
    .createHmac('sha256', EDICION3_TOKEN_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 24);
  return Buffer.from(`${payload}::${sig}`).toString('base64url');
}

function verifyEdicion3Token(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const parts = decoded.split('::');
    if (parts.length !== 3) return false;
    const [visitorName, ts, sig] = parts;
    const expected = crypto
      .createHmac('sha256', EDICION3_TOKEN_SECRET)
      .update(`${visitorName}::${ts}`)
      .digest('hex')
      .slice(0, 24);
    return sig === expected;
  } catch {
    return false;
  }
}

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

  // Verify access key for Edición N° 3 and record access audit entry
  app.post('/api/edicion3/verify', (req, res) => {
    const rawKey = typeof req.body?.key === 'string' ? req.body.key.trim().toUpperCase() : '';
    const visitorName =
      typeof req.body?.visitorName === 'string' && req.body.visitorName.trim()
        ? req.body.visitorName.trim().slice(0, 80)
        : 'Visitante Anónimo';
    const institution =
      typeof req.body?.institution === 'string' && req.body.institution.trim()
        ? req.body.institution.trim().slice(0, 80)
        : 'No especificada';
    const role =
      typeof req.body?.role === 'string' && req.body.role.trim()
        ? req.body.role.trim().slice(0, 60)
        : 'Consulta ejecutiva';
    const slideSlug =
      typeof req.body?.slideSlug === 'string' && req.body.slideSlug.trim()
        ? req.body.slideSlug.trim().slice(0, 48)
        : 'resumen-ejecutivo';

    const forwardedFor = req.headers['x-forwarded-for'];
    const rawIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.socket.remoteAddress || 'local';
    const userAgent = String(req.headers['user-agent'] || 'Desconocido').slice(0, 140);

    const granted = Boolean(rawKey && EDICION3_ACCESS_KEYS.has(rawKey));
    const entry: Edicion3AccessLogEntry = {
      id: `ed3-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      visitorName,
      institution,
      role,
      status: granted ? 'granted' : 'denied',
      slideSlug,
      ip: rawIp,
      userAgent,
      source: 'server',
    };

    const logs = appendEdicion3Log(entry);

    if (!granted) {
      res.status(401).json({
        ok: false,
        error: 'Clave de acceso incorrecta. Intento registrado en la bitácora.',
        entry,
      });
      return;
    }

    const sessionToken = signEdicion3Token(visitorName);
    res.json({
      ok: true,
      sessionToken,
      entry,
      logs,
    });
  });

  // Retrieve access log history for authenticated Edición N° 3 session
  app.get('/api/edicion3/logs', (req, res) => {
    const token =
      typeof req.headers['x-edicion3-token'] === 'string'
        ? req.headers['x-edicion3-token']
        : undefined;
    if (!verifyEdicion3Token(token)) {
      res.status(401).json({ error: 'Sesión no autorizada para consultar la bitácora.' });
      return;
    }
    res.json({ logs: loadEdicion3Logs() });
  });

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
