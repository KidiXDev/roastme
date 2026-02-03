'use client';

import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { ROAST_COLORS } from '../constants';
import { audio } from '../services/audio';
import { useRoastStore } from '../store/roast-store';
import { RoastLevel } from '../types';

const RoastResultView: React.FC = () => {
  const { result, setResult } = useRoastStore();
  const [typedText, setTypedText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [revealPhase, setRevealPhase] = useState(0);

  const config = result
    ? ROAST_COLORS[result.roastLevel]
    : ROAST_COLORS[RoastLevel.NORMAL];
  const levelLabel = result
    ? {
        [RoastLevel.SANTAI]: 'SANTAI',
        [RoastLevel.NORMAL]: 'NORMAL',
        [RoastLevel.PEDES]: 'PEDES'
      }[result.roastLevel]
    : '';

  useEffect(() => {
    if (!result) {
      setTypedText('');
      setIsDone(false);
      setRevealPhase(0);
      return;
    }
    audio.playReveal();
    const summaryTimer = setTimeout(() => setRevealPhase(1), 400);
    const contentTimer = setTimeout(() => setRevealPhase(2), 1200);
    return () => {
      clearTimeout(summaryTimer);
      clearTimeout(contentTimer);
    };
  }, [result]);

  useEffect(() => {
    if (!result || revealPhase !== 2) return;

    let i = 0;
    const interval = setInterval(() => {
      setTypedText(result.roastContent.slice(0, i));
      i++;
      if (i % 8 === 0) audio.playTick();
      if (i > result.roastContent.length) {
        clearInterval(interval);
        setIsDone(true);
        audio.playSuccess();
      }
    }, 15);
    return () => clearInterval(interval);
  }, [revealPhase, result]);

  if (!result) return null;

  const handleClose = () => {
    audio.playClick();
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-100 overflow-y-auto bg-[#050505] flex flex-col items-center py-20 px-6 md:px-16 animate-in fade-in duration-1000">
      {/* Background FX */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.07] transition-all duration-3000"
        style={{ backgroundColor: config.color, filter: 'blur(120px)' }}
      ></div>
      <div className="fixed inset-0 pointer-events-none noise opacity-20"></div>

      {/* Close Button Top Right */}
      <button
        onClick={handleClose}
        className="fixed top-8 right-8 z-110 w-12 h-12 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all group pointer-events-auto"
      >
        <span className="text-xl group-hover:rotate-90 transition-transform">
          ✕
        </span>
      </button>

      <div className="w-full max-w-[1200px] mx-auto relative z-10 flex flex-col gap-16">
        {/* Result Header */}
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-6">
            <div
              className={`px-8 py-2 font-black uppercase tracking-[0.5em] text-[10px] border-2 ${config.accentClass} animate-in slide-in-from-left duration-700`}
            >
              LEVEL: {levelLabel}
            </div>
            <div className="text-zinc-600 font-mono text-[10px] font-bold uppercase tracking-[0.4em] flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: config.color }}
              ></span>
              TIMESTAMP: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <h1
            className={`text-5xl md:text-8xl font-heading font-black leading-[0.85] tracking-[-0.08em] uppercase transition-all duration-1000 ease-out ${revealPhase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
          >
            <span
              className="block outline-text text-transparent italic opacity-50"
              style={{ WebkitTextStroke: '1px white' }}
            >
              {result.summary}
            </span>
          </h1>
        </div>

        {/* Level Visualization */}
        <div className="grid grid-cols-12 gap-1 items-end h-8">
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="bg-white/5 h-full relative overflow-hidden"
              style={{ flex: 1 }}
            >
              <div
                className={`absolute inset-0 transition-transform duration-1000 delay-${i * 20}`}
                style={{
                  backgroundColor: config.color,
                  opacity: 0.3,
                  transform: `translateY(${result.burnScore > (i / 24) * 100 ? '0' : '100%'})`
                }}
              ></div>
            </div>
          ))}
          <div className="col-span-12 flex justify-between mt-2 text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
            <span>Burn Index</span>
            <span style={{ color: config.color }}>
              {result.burnScore}% Intensity
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-16">
            <div
              className={`relative min-h-[200px] transition-all duration-1000 ${revealPhase >= 2 ? 'opacity-100' : 'opacity-0'}`}
            >
              <div className="absolute -left-8 top-0 text-zinc-800 font-black text-6xl select-none">
                &ldquo;
              </div>
              <div className="text-2xl md:text-4xl font-heading font-medium text-white leading-relaxed tracking-tight group [&>p]:mb-4 [&>p:last-child]:mb-0">
                <Markdown
                  components={{
                    strong: ({ node: _node, ...props }) => (
                      <strong className="text-white font-black" {...props} />
                    )
                  }}
                >
                  {typedText}
                </Markdown>
                {!isDone && revealPhase >= 2 && (
                  <span className="inline-block w-8 h-1 bg-white animate-pulse ml-2 align-middle"></span>
                )}
              </div>
            </div>

            {isDone && result.sources && result.sources.length > 0 && (
              <div className="space-y-8 pt-12 border-t border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <h3 className="text-[10px] font-black uppercase tracking-[0.8em] text-zinc-500">
                  Detected Vulnerabilities //
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-6 bg-white/2 hover:bg-white text-white hover:text-black transition-all duration-500 border border-white/5 hover:border-white pointer-events-auto"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-50">
                          Source_{idx + 1}
                        </span>
                        <span className="text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          ↗
                        </span>
                      </div>
                      <div className="mt-4 font-heading font-bold uppercase truncate tracking-tight">
                        {src.title || 'Unknown Fragment'}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col justify-end">
            <div className="space-y-12">
              <div
                className={`p-8 border-2 border-dashed border-white/10 transition-all duration-1000 delay-500 ${isDone ? 'opacity-100' : 'opacity-0'}`}
              >
                <div
                  className="text-[120px] font-heading font-black leading-none italic opacity-10 select-none mb-4"
                  style={{ color: config.color }}
                >
                  #{result.burnScore}
                </div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase leading-loose tracking-widest">
                  ROAST_SUCCESSFUL
                  <br />
                  EGO_DAMAGE: CRITICAL
                  <br />
                  RECOVERY: UNLIKELY
                </p>
              </div>

              <button
                onClick={handleClose}
                className={`group relative w-full py-8 px-8 bg-white text-black font-black text-2xl uppercase tracking-tighter transition-all duration-700 hover:invert pointer-events-auto ${isDone ? 'translate-y-0 opacity-100 cursor-pointer' : 'translate-y-20 opacity-0 pointer-events-none'}`}
              >
                <div className="relative z-10 flex items-center justify-between">
                  ANOTHER SACRIFICE
                  <span className="text-4xl transition-transform duration-700 group-hover:rotate-180">
                    ↺
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Bits */}
      <div className="fixed bottom-10 left-10 text-[9px] font-mono text-zinc-800 uppercase tracking-[1.5em] rotate-90 origin-bottom-left pointer-events-none">
        IDENTITY_PROCESSED_{Date.now()}
      </div>
    </div>
  );
};

export default RoastResultView;
