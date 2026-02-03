'use client';

import React from 'react';
import { FireIcon, ROAST_COLORS } from '../constants';
import { useRoast } from '../hooks/use-roast';
import { useRoastStore } from '../store/roast-store';
import { RoastLevel } from '../types';

const RoastForm: React.FC = () => {
  const { currentLevel, setCurrentLevel, isLoading, url, setUrl, language } =
    useRoastStore();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const displayLevel = mounted ? currentLevel : RoastLevel.NORMAL;
  const { mutate: roast } = useRoast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      roast({
        url: url.trim(),
        level: displayLevel,
        language
      });
    }
  };

  const handleLevelSelect = (l: RoastLevel) => {
    setCurrentLevel(l);
  };

  const ROAST_LEVEL_LABELS: Record<RoastLevel, string> = {
    [RoastLevel.SANTAI]: 'SANTAI',
    [RoastLevel.NORMAL]: 'NORMAL',
    [RoastLevel.PEDES]: 'PEDES'
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full container mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start"
    >
      {/* Massive URL Input Area */}
      <div className="md:col-span-7 space-y-6">
        <div className="relative group">
          <label className="block text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-4 ml-1">
            The Target Link //
          </label>
          <input
            type="url"
            required
            disabled={isLoading}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Drop a URL here..."
            className="w-full bg-transparent border-b-2 border-white/10 py-4 text-2xl md:text-4xl font-heading font-black tracking-tight focus:outline-none focus:border-white transition-all duration-500 placeholder:text-zinc-700 text-white disabled:opacity-30"
          />
          <div className="mt-4 flex gap-6 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
            <span className="hover:text-amber-500 transition-colors">
              Portfolio Site
            </span>
            <span className="hover:text-blue-500 transition-colors">
              GitHub
            </span>
            <span className="hover:text-rose-500 transition-colors">
              LinkedIn
            </span>
          </div>
        </div>

        <div className="hidden md:block pt-6">
          <div className="w-20 h-20 border-2 border-white/5 rounded-full flex items-center justify-center animate-spin-slow">
            <FireIcon className="w-6 h-6 text-gray-800" />
          </div>
        </div>
      </div>

      {/* Staggered Vertical Level Selectors */}
      <div className="md:col-span-5 space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-4">
          HOW DEEP IS THE BURN?
        </p>

        <div className="flex flex-col gap-4">
          {(Object.keys(RoastLevel) as RoastLevel[]).map((l, idx) => {
            const config = ROAST_COLORS[l];
            const isSelected = displayLevel === l;
            const desc = {
              [RoastLevel.SANTAI]: 'A polite nudge. Safe for HR.',
              [RoastLevel.NORMAL]: 'Witty. Likely to cause a rethink.',
              [RoastLevel.PEDES]: 'No ego left standing. Good luck.'
            }[l];

            return (
              <button
                key={l}
                type="button"
                disabled={isLoading}
                onClick={() => handleLevelSelect(l)}
                className={`relative group w-full p-4 text-left transition-all duration-500 border-l-4 ${
                  isSelected
                    ? `border-current bg-white/5 ${config.shadow}`
                    : 'border-white/5 hover:border-white/20'
                }`}
                style={{
                  marginLeft: `${idx * 1}rem`,
                  borderColor: isSelected ? config.color : '',
                  color: isSelected ? config.color : '#888'
                }}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-heading font-black tracking-tighter uppercase">
                    {ROAST_LEVEL_LABELS[l]}
                  </span>
                  <span className="text-[10px] font-mono opacity-50">
                    0{idx + 1}
                  </span>
                </div>
                <p
                  className={`text-[10px] font-medium uppercase mt-1 tracking-wide leading-tight ${isSelected ? 'text-white' : 'text-zinc-500'}`}
                >
                  {desc}
                </p>
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={isLoading || !url}
          className="mt-6 group relative w-full overflow-hidden bg-white text-black py-5 font-black text-xl uppercase tracking-tighter hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-20"
        >
          <div className="relative z-10 flex items-center justify-center gap-4 group-hover:gap-6 transition-all duration-500">
            {isLoading ? 'DISMANTLING...' : 'INITIATE ROAST'}
            {!isLoading && (
              <span className="text-2xl group-hover:rotate-12 transition-transform">
                →
              </span>
            )}
          </div>
          <div className="absolute inset-0 bg-current translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10"></div>
        </button>
      </div>
    </form>
  );
};

export default RoastForm;
