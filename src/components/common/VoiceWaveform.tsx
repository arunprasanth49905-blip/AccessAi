import React, { useEffect, useState } from 'react';
import { VoiceState } from '../../types';

interface VoiceWaveformProps {
  state: VoiceState;
  barCount?: number;
  height?: number;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  state,
  barCount = 28,
  height = 80,
}) => {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 15)
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (state === 'listening') {
      let phase = 0;
      interval = setInterval(() => {
        phase += 0.25;
        setHeights(
          Array.from({ length: barCount }, (_, i) => {
            const center = barCount / 2;
            const distFromCenter = Math.abs(i - center) / center;
            const weight = 1 - distFromCenter * 0.35;
            const harmonic = Math.sin(i * 0.5 + phase * 2) * 20 + Math.cos(i * 0.75 + phase) * 15 + 40;
            return Math.floor(Math.max(12, harmonic * weight));
          })
        );
      }, 90);
    } else if (state === 'responding') {
      let phase = 0;
      interval = setInterval(() => {
        phase += 0.3;
        setHeights(
          Array.from({ length: barCount }, (_, i) => {
            const wave = Math.sin(i * 0.4 + phase) * 32 + Math.cos(i * 0.2 + phase * 1.5) * 12 + 45;
            return Math.floor(Math.max(15, Math.min(85, wave)));
          })
        );
      }, 80);
    } else if (state === 'processing') {
      let shift = 0;
      interval = setInterval(() => {
        shift = (shift + 1) % barCount;
        setHeights(
          Array.from({ length: barCount }, (_, i) => {
            const pos = (i + shift) % barCount;
            return Math.floor(Math.sin((pos / barCount) * Math.PI) * 50 + 15);
          })
        );
      }, 70);
    } else {
      // Idle
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          const center = barCount / 2;
          const curve = Math.cos(((i - center) / center) * (Math.PI / 2.5));
          return Math.max(12, Math.floor(curve * 22));
        })
      );
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state, barCount]);

  const stateColors = {
    idle: 'bg-slate-300 dark:bg-slate-700',
    listening: 'bg-gradient-to-t from-brand-600 to-sky-400 dark:from-brand-500 dark:to-cyan-300',
    processing: 'bg-gradient-to-t from-purple-600 to-brand-500',
    responding: 'bg-gradient-to-t from-emerald-600 to-teal-400 dark:from-emerald-500 dark:to-teal-300',
  };

  return (
    <div
      className="flex items-center justify-center gap-1.5 px-4 py-2 w-full max-w-md mx-auto"
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      {heights.map((h, idx) => (
        <div
          key={idx}
          className={`w-2 sm:w-2.5 rounded-full transition-all duration-100 ${stateColors[state]}`}
          style={{
            height: `${h}%`,
            minHeight: '6px',
          }}
        />
      ))}
    </div>
  );
};
