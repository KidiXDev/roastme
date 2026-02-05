'use client';

import { useEffect, useState } from 'react';
import ErrorModal from '../components/error-modal';
import Layout from '../components/layout';
import QueryProvider from '../components/query-provider';
import RoastForm from '../components/roast-form';
import RoastResultView from '../components/roast-result';
import { ROAST_COLORS, TRANSLATIONS } from '../constants';
import { useRoastStore } from '../store/roast-store';
import { Language, RoastLevel } from '../types';

function AppContent() {
  const {
    language,
    currentLevel,
    result,
    isLoading,
    loadingText,
    setLoadingText
  } = useRoastStore();

  const [mounted, setMounted] = useState(false);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const displayLevel = mounted ? currentLevel : RoastLevel.NORMAL;
  const displayLanguage = mounted ? language : Language.EN;
  const t = TRANSLATIONS[displayLanguage];

  useEffect(() => {
    setLoadingText(t.loadingPhrases[0]);
  }, [displayLanguage, t.loadingPhrases, setLoadingText]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      let i = 0;
      // Reset fade state on start to ensure visibility
      // Use setTimeout to avoid synchronous state update warning
      const resetTimer = setTimeout(() => setFade(true), 0);

      interval = setInterval(() => {
        // 1. Fade out
        setFade(false);

        // 2. Wait for fade out, then change text and fade in
        setTimeout(() => {
          i = (i + 1) % t.loadingPhrases.length;
          setLoadingText(t.loadingPhrases[i]);
          setFade(true);
        }, 500); // Wait 500ms (matches generic transition duration)
      }, 3000); // Total cycle time

      return () => {
        clearInterval(interval);
        clearTimeout(resetTimer);
      };
    }
    return () => clearInterval(interval);
  }, [isLoading, t.loadingPhrases, setLoadingText]);

  return (
    <Layout isLoading={isLoading}>
      <div className="max-w-[1800px] mx-auto pt-12 md:pt-20 space-y-32 pb-16">
        {/* Massive Hero */}
        {!result && !isLoading && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start animate-in fade-in slide-in-from-left-12 duration-1000 ease-out">
            <div className="lg:col-span-9 space-y-12">
              <div
                className="inline-block px-5 py-1.5 border-2 text-[11px] font-black tracking-[0.5em] uppercase transition-colors duration-1000 mb-4"
                style={{
                  borderColor: `${ROAST_COLORS[displayLevel].color}33`,
                  color: ROAST_COLORS[displayLevel].color
                }}
              >
                DIGITAL EGO CHECK // VER 2.5
              </div>
              <h1 className="text-8xl md:text-[9vw] font-heading font-black -tracking-widest leading-[0.75] uppercase">
                Your identity, <br />
                <span
                  className="italic block ml-[5vw] md:ml-[10vw] outline-text text-transparent opacity-80 hover:opacity-100 transition-opacity"
                  style={{ WebkitTextStroke: '2px white' }}
                >
                  exposed.
                </span>
              </h1>
            </div>
            <div className="lg:col-span-3 lg:pt-24">
              <p className="text-xl md:text-2xl text-gray-500 font-bold leading-none tracking-tight border-l-4 border-white pl-8">
                An experiment in radical honesty. We scan your GitHub, LinkedIn,
                or Portfolio to find the person behind the buzzwords. No
                templates, just pure, high-octane critique.
              </p>
            </div>
          </section>
        )}

        {/* Input Area */}
        <section className="relative">
          {!result && !isLoading && (
            <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
              <RoastForm />
            </div>
          )}

          {/* Extreme Loading State */}
          {isLoading && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] space-y-16 animate-in fade-in duration-500">
              <div className="relative group">
                <div
                  className="absolute inset-[-60px] blur-[80px] opacity-20 animate-pulse transition-all duration-1000"
                  style={{ backgroundColor: ROAST_COLORS[displayLevel].color }}
                ></div>
                <div
                  className="w-48 h-48 border-8 border-white/5 animate-spin-slow"
                  style={{ borderTopColor: ROAST_COLORS[displayLevel].color }}
                ></div>
                <div
                  className="absolute inset-6 w-36 h-36 border-4 border-white/5 animate-spin-reverse opacity-50"
                  style={{
                    borderBottomColor: ROAST_COLORS[displayLevel].color
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-4xl font-black italic animate-pulse">
                    DIGESTING
                  </div>
                </div>
              </div>
              <div className="text-center space-y-8 max-w-2xl px-8">
                <p
                  className={`text-3xl md:text-5xl font-heading font-black tracking-tighter uppercase italic h-24 flex items-center justify-center transition-all duration-500 ease-in-out transform ${
                    fade
                      ? 'opacity-100 blur-0 translate-y-0'
                      : 'opacity-0 blur-sm translate-y-4'
                  }`}
                >
                  {loadingText}
                </p>
                <div
                  className="h-[2px] w-16 mx-auto animate-pulse transition-colors duration-1000"
                  style={{ backgroundColor: ROAST_COLORS[displayLevel].color }}
                ></div>
              </div>
            </div>
          )}

          {result && !isLoading && <RoastResultView />}
        </section>

        {/* Chaos Steps */}
        {!result && !isLoading && (
          <section className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-y border-white/5">
              {[
                {
                  title: 'THE LINK',
                  desc: 'Portfolio, GitHub, LinkedIn. Feed the beast.'
                },
                {
                  title: 'THE HEAT',
                  desc: 'Decide if you want a joke or a career change.'
                },
                {
                  title: 'THE TRUTH',
                  desc: 'The AI speaks. You listen.'
                }
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="group p-20 border-r border-white/5 hover:bg-white/2 transition-all relative overflow-hidden"
                >
                  <div className="text-[200px] font-heading font-black opacity-[0.02] group-hover:opacity-[0.05] transition-all leading-none absolute -bottom-10 -left-10 select-none">
                    0{idx + 1}
                  </div>
                  <div className="relative z-10 space-y-6">
                    <h3
                      className="text-4xl font-heading font-black uppercase tracking-tighter italic transition-colors group-hover:text-white"
                      style={{ color: ROAST_COLORS[displayLevel].color }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-lg font-bold leading-tight max-w-[280px]">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <ErrorModal />
    </Layout>
  );
}

export default function Home() {
  return (
    <QueryProvider>
      <AppContent />
    </QueryProvider>
  );
}
