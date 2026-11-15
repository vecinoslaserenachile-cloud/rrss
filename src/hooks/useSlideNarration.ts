import { useCallback, useEffect, useRef, useState } from 'react';

export type NarrationVoiceId = 'Kore' | 'Charon' | 'Puck';
export type AudioEngineMode = 'gemini' | 'browser' | 'loading';

export const NARRATION_VOICES: { id: NarrationVoiceId; label: string }[] = [
  { id: 'Kore', label: 'Sofía (Neural)' },
  { id: 'Charon', label: 'Martín (Neural)' },
  { id: 'Puck', label: 'Diego (Neural)' },
];

// Minimal 1-sample silent PCM WAV to unlock HTMLAudioElement inside user gesture
const SILENT_WAV_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

interface UseSlideNarrationOptions {
  script: string;
  slideKey: string;
  nextScript?: string;
  nextSlideKey?: string;
  onNarrationEnd?: () => void;
}

const blobUrlCache = new Map<string, string>();
const inFlightAudioFetches = new Map<string, Promise<string>>();

const STATIC_AUDIO_VERSION = '20261115b';
const VALID_STATIC_KORE_TRACKS = new Set([
  'ecosistema-0',
  'ecosistema-1',
  'ecosistema-2',
  'ecosistema-4',
  'ecosistema-5',
  'ecosistema-6',
  'ecosistema-7',
  'ecosistema-8',
  'benchmark-0',
  'benchmark-1',
  'benchmark-3',
  'benchmark-4',
  'benchmark-5',
]);

function hashScript(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return `${text.length}_${h >>> 0}`;
}

function getCacheKey(voice: NarrationVoiceId, slideKey: string, text: string) {
  return `${voice}::${slideKey}::${hashScript(text)}`;
}

async function fetchStaticOrNeuralAudioUrl(
  slideKey: string,
  text: string,
  voiceName: NarrationVoiceId
): Promise<string> {
  const key = getCacheKey(voiceName, slideKey, text);
  const existing = blobUrlCache.get(key);
  if (existing) return existing;

  const inflight = inFlightAudioFetches.get(key);
  if (inflight) return inflight;

  const promise = (async () => {
    // 1. Try pre-generated static Gemini Neural MP3 only for verified unchanged tracks
    if (voiceName === 'Kore' && VALID_STATIC_KORE_TRACKS.has(slideKey)) {
      try {
        const staticRes = await fetch(
          `/audio/${voiceName}/${slideKey}.mp3?v=${STATIC_AUDIO_VERSION}`,
          { cache: 'no-cache' }
        );
        const contentType = staticRes.headers.get('content-type')?.toLowerCase() ?? '';
        if (staticRes.ok && contentType.includes('audio')) {
          const mp3Blob = await staticRes.blob();
          if (mp3Blob.size > 1024) {
            const url = URL.createObjectURL(mp3Blob);
            blobUrlCache.set(key, url);
            return url;
          }
        }
      } catch {
        // Static track not present for this voice; proceed to live Gemini TTS API
      }
    }

    // 2. Dynamically synthesize via server-side Gemini 3.8 Neural TTS
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideKey, text, voiceName }),
    });

    const apiContentType = res.headers.get('content-type')?.toLowerCase() ?? '';
    if (!res.ok) {
      let msg = `Servicio de voz no disponible (${res.status})`;
      if (apiContentType.includes('application/json')) {
        try {
          const errJson = (await res.json()) as { error?: string };
          if (errJson?.error) msg = errJson.error;
        } catch {
          // Ignore JSON parse errors
        }
      }
      throw new Error(msg);
    }

    if (!apiContentType.includes('audio')) {
      throw new Error('El servidor no devolvió un formato de audio válido.');
    }

    const wavBlob = await res.blob();
    const url = URL.createObjectURL(wavBlob);
    blobUrlCache.set(key, url);
    return url;
  })();

  inFlightAudioFetches.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlightAudioFetches.delete(key);
  }
}

function splitIntoShortSentences(text: string, maxLen = 130): string[] {
  const rawSentences = text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const sentence of rawSentences) {
    if (sentence.length <= maxLen) {
      chunks.push(sentence);
    } else {
      const subParts = sentence.split(/(?<=[,;—])\s+/);
      let current = '';
      for (const part of subParts) {
        if ((current + ' ' + part).trim().length <= maxLen) {
          current = (current + ' ' + part).trim();
        } else {
          if (current) chunks.push(current);
          current = part;
        }
      }
      if (current) chunks.push(current);
    }
  }
  return chunks.length ? chunks : [text];
}

function pickBestSpanishBrowserVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const spanishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('es'));
  if (!spanishVoices.length) return null;

  const scoreVoice = (v: SpeechSynthesisVoice) => {
    let score = 0;
    const lang = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    if (lang === 'es-cl') score += 50;
    else if (lang === 'es-419') score += 40;
    else if (lang === 'es-mx' || lang === 'es-es') score += 30;
    else score += 20;

    if (name.includes('natural') || name.includes('online')) score += 45;
    if (name.includes('google')) score += 35;
    if (name.includes('microsoft')) score += 25;
    return score;
  };

  return [...spanishVoices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

export function useSlideNarration({
  script,
  slideKey,
  nextScript,
  nextSlideKey,
  onNarrationEnd,
}: UseSlideNarrationOptions) {
  const browserTtsSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [autoNarrate, setAutoNarrate] = useState(false);
  const [rate, setRate] = useState<number>(1.0);
  const [voice, setVoice] = useState<NarrationVoiceId>('Kore');
  const [showCaption, setShowCaption] = useState(false);
  const [engineMode, setEngineMode] = useState<AudioEngineMode>('gemini');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [progress, setProgress] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef<boolean>(false);
  const unlockPromiseRef = useRef<Promise<void> | null>(null);
  const watchdogRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const activeSessionRef = useRef<number>(0);
  const onNarrationEndRef = useRef(onNarrationEnd);
  const voiceRef = useRef<NarrationVoiceId>(voice);
  const rateRef = useRef<number>(rate);

  useEffect(() => {
    onNarrationEndRef.current = onNarrationEnd;
  }, [onNarrationEnd]);

  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    if (!browserTtsSupported) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) setBrowserVoices(list);
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, [browserTtsSupported]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Synchronously unlock the shared HTMLAudioElement inside a user click/keypress
  const unlockAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || unlockedRef.current) return;
    if (unlockPromiseRef.current) return;

    audio.src = SILENT_WAV_DATA_URI;
    audio.volume = 0;
    const p = audio
      .play()
      .then(() => {
        audio.pause();
        audio.volume = 1;
        unlockedRef.current = true;
        setAutoplayBlocked(false);
      })
      .catch(() => {
        audio.volume = 1;
      })
      .finally(() => {
        unlockPromiseRef.current = null;
      });
    unlockPromiseRef.current = p;
  }, []);

  const stop = useCallback(() => {
    activeSessionRef.current += 1;
    clearWatchdog();
    clearProgressInterval();

    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.onloadedmetadata = null;
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // Ignore seek errors
      }
    }

    if (browserTtsSupported) {
      window.speechSynthesis.cancel();
    }

    setIsLoadingAudio(false);
    setIsSpeaking(false);
    setProgress(0);
  }, [browserTtsSupported, clearProgressInterval, clearWatchdog]);

  const speakWithBrowserFallback = useCallback(
    (sessionId: number, textToSpeak: string, playbackRate: number) => {
      if (!browserTtsSupported || !textToSpeak) {
        setIsSpeaking(false);
        onNarrationEndRef.current?.();
        return;
      }

      setEngineMode('browser');
      setIsSpeaking(true);
      setShowCaption(true);

      const chunks = splitIntoShortSentences(textToSpeak, 130);
      const best = pickBestSpanishBrowserVoice(browserVoices);
      let chunkIdx = 0;
      let chunkStartedAt = performance.now();
      let chunkEstMs = 4000;

      clearProgressInterval();
      progressIntervalRef.current = window.setInterval(() => {
        if (activeSessionRef.current !== sessionId) return;
        const elapsed = performance.now() - chunkStartedAt;
        const intraChunk = Math.min(0.95, elapsed / Math.max(1000, chunkEstMs));
        const pct = Math.min(1, (chunkIdx + intraChunk) / Math.max(1, chunks.length));
        setProgress(pct);
      }, 140);

      const finishChunk = () => {
        if (activeSessionRef.current !== sessionId) return;
        clearWatchdog();
        chunkIdx += 1;
        if (chunkIdx < chunks.length) {
          speakNextChunk();
        } else {
          clearProgressInterval();
          setProgress(1);
          setIsSpeaking(false);
          onNarrationEndRef.current?.();
        }
      };

      const speakNextChunk = () => {
        if (activeSessionRef.current !== sessionId) return;
        const chunkText = chunks[chunkIdx];
        const utterance = new SpeechSynthesisUtterance(chunkText);
        utterance.lang = best?.lang || 'es-CL';
        if (best) utterance.voice = best;
        utterance.rate = playbackRate;
        utterance.pitch = 1.0;

        chunkStartedAt = performance.now();
        chunkEstMs = Math.max(1800, Math.round((chunkText.length / 13) * 1000 / playbackRate));

        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;
          finishChunk();
        };

        utterance.onend = settle;
        utterance.onerror = settle;

        // Per-chunk anti-freeze watchdog (prevents Chrome speechSynthesis hang)
        const estimatedMs = Math.max(4000, Math.round((chunkText.length / 11) * 1000 / playbackRate) + 3500);
        clearWatchdog();
        watchdogRef.current = window.setTimeout(() => {
          if (activeSessionRef.current === sessionId) {
            window.speechSynthesis.cancel();
            settle();
          }
        }, estimatedMs);

        window.speechSynthesis.speak(utterance);
      };

      window.speechSynthesis.cancel();
      speakNextChunk();
    },
    [browserTtsSupported, browserVoices, clearProgressInterval, clearWatchdog]
  );

  const speakCurrent = useCallback(
    async (customRate?: number, customVoice?: NarrationVoiceId) => {
      if (!script) return;

      unlockAudio();
      stop();
      const sessionId = activeSessionRef.current;
      const targetVoice = customVoice ?? voiceRef.current;
      const targetRate = customRate ?? rateRef.current;

      setErrorNotice(null);
      setAutoplayBlocked(false);
      setShowCaption(true);

      const cacheKey = getCacheKey(targetVoice, slideKey, script);
      const isCached = blobUrlCache.has(cacheKey);
      if (!isCached) {
        setIsLoadingAudio(true);
        setEngineMode('loading');
      }

      try {
        if (unlockPromiseRef.current) {
          await unlockPromiseRef.current;
        }
        const audioUrl = await fetchStaticOrNeuralAudioUrl(slideKey, script, targetVoice);
        if (activeSessionRef.current !== sessionId) return;

        // Pre-fetch next slide/chapter silently in background
        if (nextSlideKey && nextScript) {
          fetchStaticOrNeuralAudioUrl(nextSlideKey, nextScript, targetVoice).catch(() => {});
        }

        const audio = audioRef.current;
        if (!audio) return;

        setIsLoadingAudio(false);
        setEngineMode('gemini');

        audio.volume = 1;
        audio.src = audioUrl;
        audio.playbackRate = targetRate;

        const finishAudio = () => {
          if (activeSessionRef.current === sessionId) {
            clearWatchdog();
            clearProgressInterval();
            setProgress(1);
            setIsSpeaking(false);
            onNarrationEndRef.current?.();
          }
        };

        audio.onloadedmetadata = () => {
          if (activeSessionRef.current !== sessionId) return;
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            clearWatchdog();
            const safeMs = Math.round(((audio.duration / targetRate) + 4) * 1000);
            watchdogRef.current = window.setTimeout(finishAudio, safeMs);
          }
        };

        audio.onended = finishAudio;

        audio.onerror = () => {
          if (activeSessionRef.current === sessionId) {
            clearWatchdog();
            clearProgressInterval();
            setIsSpeaking(false);
            setIsLoadingAudio(false);
            speakWithBrowserFallback(sessionId, script, targetRate);
          }
        };

        clearProgressInterval();
        setProgress(0);
        progressIntervalRef.current = window.setInterval(() => {
          if (activeSessionRef.current !== sessionId) return;
          if (Number.isFinite(audio.duration) && audio.duration > 0) {
            setProgress(Math.min(1, Math.max(0, audio.currentTime / audio.duration)));
          }
        }, 120);

        setIsSpeaking(true);
        await audio.play();
        unlockedRef.current = true;
      } catch (err) {
        if (activeSessionRef.current !== sessionId) return;
        clearWatchdog();
        clearProgressInterval();
        setIsLoadingAudio(false);

        // If browser blocked autoplay (NotAllowedError), keep neural audio and prompt 1 click instead of robotic fallback!
        const errName = (err as { name?: string })?.name || '';
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errName === 'NotAllowedError' || /not allowed|user didn't interact/i.test(errMsg)) {
          setIsSpeaking(false);
          setEngineMode('gemini');
          setAutoplayBlocked(true);
          return;
        }

        setErrorNotice(errMsg);
        speakWithBrowserFallback(sessionId, script, targetRate);
      }
    },
    [clearProgressInterval, clearWatchdog, nextScript, nextSlideKey, script, slideKey, speakWithBrowserFallback, stop, unlockAudio]
  );

  const togglePlay = useCallback(() => {
    unlockAudio();
    if (isSpeaking || isLoadingAudio) {
      stop();
    } else {
      void speakCurrent();
    }
  }, [isLoadingAudio, isSpeaking, speakCurrent, stop, unlockAudio]);

  // Automatically narrate when slideKey changes if autoNarrate is enabled
  useEffect(() => {
    if (autoNarrate) {
      const t = window.setTimeout(() => {
        void speakCurrent();
      }, 240);
      return () => {
        window.clearTimeout(t);
        stop();
      };
    } else {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideKey, autoNarrate]);

  useEffect(() => stop, [stop]);

  const cycleRate = useCallback(() => {
    unlockAudio();
    const next = rate === 1.0 ? 1.12 : rate === 1.12 ? 0.94 : 1.0;
    setRate(next);
    rateRef.current = next;
    const audio = audioRef.current;
    if (audio && isSpeaking && engineMode === 'gemini') {
      audio.playbackRate = next;
    } else if (isSpeaking) {
      void speakCurrent(next);
    }
  }, [engineMode, isSpeaking, rate, speakCurrent, unlockAudio]);

  const cycleVoice = useCallback(() => {
    unlockAudio();
    const idx = NARRATION_VOICES.findIndex((v) => v.id === voice);
    const nextVoice = NARRATION_VOICES[(idx + 1) % NARRATION_VOICES.length].id;
    setVoice(nextVoice);
    voiceRef.current = nextVoice;
    if (isSpeaking || isLoadingAudio || autoNarrate) {
      void speakCurrent(undefined, nextVoice);
    }
  }, [autoNarrate, isLoadingAudio, isSpeaking, speakCurrent, unlockAudio, voice]);

  return {
    isSupported: true,
    isSpeaking,
    isLoadingAudio,
    autoplayBlocked,
    autoNarrate,
    setAutoNarrate,
    rate,
    cycleRate,
    voice,
    voiceLabel: NARRATION_VOICES.find((v) => v.id === voice)?.label ?? 'Sofía (Neural)',
    cycleVoice,
    engineMode,
    errorNotice,
    progress,
    showCaption,
    setShowCaption,
    unlockAudio,
    togglePlay,
    speakCurrent,
    stop,
    activeScript: script,
  };
}
