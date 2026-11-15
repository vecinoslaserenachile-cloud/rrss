import { useEffect, useState } from 'react';

interface UseCountUpOptions {
  target: number;
  durationMs?: number;
  decimals?: number;
  triggerKey?: string | number;
  instant?: boolean;
}

export function useCountUp({
  target,
  durationMs = 900,
  decimals = 0,
  triggerKey,
  instant = false,
}: UseCountUpOptions): number {
  const [value, setValue] = useState<number>(target);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || instant) {
      setValue(target);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Cubic ease-out for crisp executive deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      const factor = Math.pow(10, decimals);
      setValue(Math.round(current * factor) / factor);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    setValue(0);
    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [target, durationMs, decimals, triggerKey]);

  return value;
}

export function formatSpanishDecimal(value: number, decimals = 2): string {
  return value.toLocaleString('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
