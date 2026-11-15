import { useCallback, useEffect, useRef, useState } from 'react';

export type NarrationVoiceId = 'Kore' | 'Charon' | 'Puck';
export type AudioEngineMode = 'gemini' | 'browser' | 'loading';

export const NARRATION_VOICES: { id: NarrationVoiceId; label: string }[] = [
  { id: 'Kore', label: 'Sofía (Neural)' },
  { id: 'Charon', label: 'Martín (Neural)' },
  { id: 'Puck', label: 'Diego (Neural)' },
];

interface UseSlideNarrationOptions {
  script: string;
  slideKey: string;
  nextScript?: string;
  nextSlideKey?: string;
  onNarrationEnd?: () => void;
}

const blobUrlCache = new Map<string, string>();
const inFlightAudioFetches = new Map<string, Promise<string>>();

function getCacheKey(voice: NarrationVoiceId, slideKey: string) {
  return `${voice}::${slideKey}`;
}

async function fetchNeuralAudioUrl(
  slideKey: string,
  text: string,
  voiceName: NarrationVoiceId
): Promise<string> {
  const key = getCacheKey(voiceName, slideKey);
  const existing = blobUrlCache.get(key);
  if (existing) return existing;

  const inflight = inFlightAudioFetches.get(key);
  if (inflight) return inflight;

  const promise = (async () => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slideKey, text, voiceName }),
    });

    if (!res.ok) {
      let msg = `Error TTS (${res.status})`;
      try {
        const errJson = (await res.json()) as { error?: string; code?: string };
        if (errJson?.error) msg = errJson.error;
      } catch {
        // Ignore parse error
      }
      throw new Error(msg);
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
  const [autoNarrate, setAutoNarrate] = useState(false);
  const [rate, setRate] = useState<number>(1.0);
  const [voice, setVoice] = useState<NarrationVoiceId>('Kore');
  const [showCaption, setShowCaption] = useState(false);
  const [engineMode, setEngineMode] = useState<AudioEngineMode>('gemini');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const keepAliveRef = useRef<number | null>(null);
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

  // Load fallback browser voices asynchronously if ever needed
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

  // Create shared HTMLAudioElement once
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

  const stop = useCallback(() => {
    activeSessionRef.current += 1;

    if (keepAliveRef.current) {
      window.clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // Ignore seek reset error before load
      }
    }

    if (browserTtsSupported) {
      window.speechSynthesis.cancel();
    }

    setIsLoadingAudio(false);
    setIsSpeaking(false);
  }, [browserTtsSupported]);

  const speakWithBrowserFallback = useCallback(
    (sessionId: number, textToSpeak: string, playbackRate: number) => {
      if (!browserTtsSupported || !textToSpeak) {
        setIsSpeaking(false);
        return;
      }
      setEngineMode('browser');
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'es-CL';
      utterance.rate = playbackRate;
      utterance.pitch = 1.0;

      const best = pickBestSpanishBrowserVoice(browserVoices);
      if (best) {
        utterance.voice = best;
        utterance.lang = best.lang;
      }

      utterance.onstart = () => {
        if (activeSessionRef.current === sessionId) {
          setIsSpeaking(true);
          setShowCaption(true);
        }
      };

      utterance.onend = () => {
        if (activeSessionRef.current === sessionId) {
          if (keepAliveRef.current) {
            window.clearInterval(keepAliveRef.current);
            keepAliveRef.current = null;
          }
          setIsSpeaking(false);
          onNarrationEndRef.current?.();
        }
      };

      utterance.onerror = () => {
        if (activeSessionRef.current === sessionId) {
          if (keepAliveRef.current) {
            window.clearInterval(keepAliveRef.current);
            keepAliveRef.current = null;
          }
          setIsSpeaking(false);
        }
      };

      setIsSpeaking(true);
      setShowCaption(true);
      window.speechSynthesis.speak(utterance);

      keepAliveRef.current = window.setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);
    },
    [browserTtsSupported, browserVoices]
  );

  const speakCurrent = useCallback(
    async (customRate?: number, customVoice?: NarrationVoiceId) => {
      if (!script) return;

      stop();
      const sessionId = activeSessionRef.current;
      const targetVoice = customVoice ?? voiceRef.current;
      const targetRate = customRate ?? rateRef.current;

      setErrorNotice(null);
      setShowCaption(true);

      const cacheKey = getCacheKey(targetVoice, slideKey);
      const isCached = blobUrlCache.has(cacheKey);
      if (!isCached) {
        setIsLoadingAudio(true);
        setEngineMode('loading');
      }

      try {
        const audioUrl = await fetchNeuralAudioUrl(slideKey, script, targetVoice);
        if (activeSessionRef.current !== sessionId) return;

        // Pre-fetch next slide in background so transitions are seamless
        if (nextSlideKey && nextScript) {
          fetchNeuralAudioUrl(nextSlideKey, nextScript, targetVoice).catch(() => {});
        }

        const audio = audioRef.current;
        if (!audio) return;

        setIsLoadingAudio(false);
        setEngineMode('gemini');

        audio.src = audioUrl;
        audio.playbackRate = targetRate;

        audio.onended = () => {
          if (activeSessionRef.current === sessionId) {
            setIsSpeaking(false);
            onNarrationEndRef.current?.();
          }
        };

        audio.onerror = () => {
          if (activeSessionRef.current === sessionId) {
            setIsSpeaking(false);
            setIsLoadingAudio(false);
            speakWithBrowserFallback(sessionId, script, targetRate);
          }
        };

        setIsSpeaking(true);
        await audio.play();
      } catch (err) {
        if (activeSessionRef.current !== sessionId) return;
        setIsLoadingAudio(false);
        const msg =
          err instanceof Error
            ? err.message
            : 'Voz neural no disponible; usando voz local.';
        setErrorNotice(msg);
        speakWithBrowserFallback(sessionId, script, targetRate);
      }
    },
    [nextScript, nextSlideKey, script, slideKey, speakWithBrowserFallback, stop]
  );

  const togglePlay = useCallback(() => {
    if (isSpeaking || isLoadingAudio) {
      stop();
    } else {
      void speakCurrent();
    }
  }, [isLoadingAudio, isSpeaking, speakCurrent, stop]);

  // Automatically narrate when slideKey changes if autoNarrate is enabled
  useEffect(() => {
    if (autoNarrate) {
      const t = window.setTimeout(() => {
        void speakCurrent();
      }, 280);
      return () => {
        window.clearTimeout(t);
        stop();
      };
    } else {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideKey, autoNarrate]);

  // Cleanup on unmount
  useEffect(() => stop, [stop]);

  const cycleRate = useCallback(() => {
    const next = rate === 1.0 ? 1.12 : rate === 1.12 ? 0.94 : 1.0;
    setRate(next);
    rateRef.current = next;
    const audio = audioRef.current;
    if (audio && isSpeaking && engineMode === 'gemini') {
      audio.playbackRate = next;
    } else if (isSpeaking) {
      void speakCurrent(next);
    }
  }, [engineMode, isSpeaking, rate, speakCurrent]);

  const cycleVoice = useCallback(() => {
    const idx = NARRATION_VOICES.findIndex((v) => v.id === voice);
    const nextVoice = NARRATION_VOICES[(idx + 1) % NARRATION_VOICES.length].id;
    setVoice(nextVoice);
    voiceRef.current = nextVoice;
    if (isSpeaking || isLoadingAudio || autoNarrate) {
      void speakCurrent(undefined, nextVoice);
    }
  }, [autoNarrate, isLoadingAudio, isSpeaking, speakCurrent, voice]);

  return {
    isSupported: true,
    isSpeaking,
    isLoadingAudio,
    autoNarrate,
    setAutoNarrate,
    rate,
    cycleRate,
    voice,
    voiceLabel: NARRATION_VOICES.find((v) => v.id === voice)?.label ?? 'Sofía (Neural)',
    cycleVoice,
    engineMode,
    errorNotice,
    showCaption,
    setShowCaption,
    togglePlay,
    speakCurrent,
    stop,
    activeScript: script,
  };
}
