'use client';

import React, { useRef, useState } from 'react';
import { ROAST_COLORS } from '../constants';
import { audio } from '../services/audio';
import { useRoastStore } from '../store/roast-store';
import { Language, RoastLevel } from '../types';
import CustomCursor from './custom-cursor';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { language, setLanguage, currentLevel } = useRoastStore();
  const [mounted, setMounted] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const displayLanguage = mounted ? language : Language.EN;
  const displayLevel = mounted ? currentLevel : RoastLevel.NORMAL;
  const activeColor = ROAST_COLORS[displayLevel].color;

  const handleLogoClick = () => {
    setLogoClicks((prev) => prev + 1);
    audio.playTick();

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = setTimeout(() => {
      setLogoClicks(0);
    }, 1000);

    if (logoClicks >= 2) {
      triggerEasterEgg();
    }
  };

  const triggerEasterEgg = () => {
    setLogoClicks(0);
    setShowEasterEgg(true);
    audio.playEasterEgg();
    setTimeout(() => setShowEasterEgg(false), 4000);
  };

  const getIntensity = () => {
    switch (displayLevel) {
      case RoastLevel.PEDES:
        return { speed: '3s', blur: '150px', scale: 1.5, opacity: 0.15 };
      case RoastLevel.NORMAL:
        return { speed: '6s', blur: '200px', scale: 1.2, opacity: 0.1 };
      default:
        return { speed: '12s', blur: '250px', scale: 1.0, opacity: 0.05 };
    }
  };

  const intensity = getIntensity();

  return (
    <div className="min-h-screen relative selection:bg-white selection:text-black flex flex-col transition-colors duration-1000 overflow-x-hidden">
      <CustomCursor />
      {/* Dynamic Experimental Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#050505]">
        {/* Gritty Dots Grid - Reacts to Mouse */}
        <div
          className="absolute -inset-full opacity-[0.05] transition-transform duration-700 ease-out"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '30px 30px',
            transform:
              'rotate(-2deg) translate(calc(var(--mouse-x) * 30px), calc(var(--mouse-y) * 30px))'
          }}
        ></div>

        {/* Dynamic Glowing Blobs - Color matches Roast Level */}
        <div
          className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] blur-3xl rounded-full transition-all duration-2000 ease-in-out"
          style={
            {
              backgroundColor: activeColor,
              opacity: intensity.opacity,
              filter: `blur(${intensity.blur})`,
              transform: `translate(calc(var(--mouse-x) * 50px), calc(var(--mouse-y) * 50px)) scale(${intensity.scale})`,
              animation: `pulse ${intensity.speed} infinite alternate ease-in-out`
            } as React.CSSProperties
          }
        ></div>

        <div
          className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] blur-3xl rounded-full transition-all duration-3000 ease-in-out delay-500"
          style={
            {
              backgroundColor: activeColor,
              opacity: intensity.opacity * 0.8,
              filter: `blur(${intensity.blur})`,
              transform: `translate(calc(var(--mouse-x) * -70px), calc(var(--mouse-y) * -70px)) scale(${intensity.scale * 1.1})`,
              animation: `pulse ${intensity.speed} infinite alternate-reverse ease-in-out`
            } as React.CSSProperties
          }
        ></div>

        {/* Aggressive Chaos Lines - Color shifted */}
        <div
          className="absolute top-0 right-1/4 w-px h-[150vh] transition-all duration-1000 rotate-15"
          style={{ backgroundColor: activeColor, opacity: 0.08 }}
        ></div>
        <div
          className="absolute top-1/2 left-0 w-full h-px transition-all duration-1000 rotate-[-5deg]"
          style={{ backgroundColor: activeColor, opacity: 0.05 }}
        ></div>

        {/* Floating Ring - Reacts to Mouse + Level */}
        <div
          className="absolute top-20 right-20 w-40 h-40 border transition-all duration-1000 rounded-full animate-spin-slow"
          style={{
            borderColor: activeColor,
            opacity: 0.05,
            transform:
              'translate(calc(var(--mouse-x) * -20px), calc(var(--mouse-y) * -20px))'
          }}
        ></div>

        {/* Glitch Overlay for Pedes Level */}
        {displayLevel === RoastLevel.PEDES && (
          <div className="absolute inset-0 bg-white/1 mix-blend-overlay animate-glitch-bg pointer-events-none"></div>
        )}
      </div>

      <header className="py-6 px-8 md:px-20 sticky top-0 z-30 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div
            className="flex flex-col group select-none"
            onClick={handleLogoClick}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 flex items-center justify-center font-black text-xl transition-all duration-500"
                style={{
                  backgroundColor: logoClicks > 0 ? activeColor : 'white',
                  color: logoClicks > 0 ? 'white' : 'black'
                }}
              >
                R
              </div>
              <span className="text-3xl font-heading font-black -tracking-widest uppercase">
                Roastme
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold text-gray-700 mt-2 tracking-[0.3em] hidden sm:block italic uppercase">
              System.status:{' '}
              <span style={{ color: activeColor }}>
                {displayLevel} MODE ACTIVE
              </span>
            </span>
          </div>

          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLanguage(Language.EN)}
                className={`text-[11px] font-black tracking-[0.2em] transition-all py-1 px-2 ${displayLanguage === Language.EN ? 'bg-white text-black' : 'text-gray-600 hover:text-white'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage(Language.ID)}
                className={`text-[11px] font-black tracking-[0.2em] transition-all py-1 px-2 ${displayLanguage === Language.ID ? 'bg-white text-black' : 'text-gray-600 hover:text-white'}`}
              >
                ID
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-8 md:px-20 grow relative">{children}</main>

      {/* Easter Egg Overlay */}
      {showEasterEgg && (
        <div className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-8 backdrop-blur-xl animate-in fade-in zoom-in duration-500 select-none">
          <div className="text-center space-y-8 max-w-2xl">
            <div className="text-8xl animate-bounce">🤡</div>
            <h2 className="text-4xl md:text-6xl font-heading font-black tracking-tighter uppercase italic text-white leading-tight">
              ARE YOU THAT BORED? GO BUILD SOMETHING INSTEAD OF CLICKING LOGOS.
            </h2>
            <div className="text-[10px] font-mono text-gray-600 uppercase tracking-[1em]">
              LOG: curiosity_detected_v1.0
            </div>
          </div>
        </div>
      )}

      <footer className="py-10 px-8 md:px-20 border-t border-white/5 relative z-10">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="space-y-4">
            <p
              className="text-4xl font-heading font-bold text-gray-800 italic leading-none select-none transition-all duration-1000"
              style={{ color: `${activeColor}22` }}
            >
              &quot;Build something <br />
              worth roasting.&quot;
            </p>
            <div className="text-[10px] font-mono font-bold text-gray-800 uppercase tracking-[0.5em]">
              ROASTME_ENGINE_v2.5 // BY HUMANS WITH TASTE
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em] mb-2 italic">
              Legal Noise
            </div>
            <p className="text-[9px] text-gray-800 max-w-xs leading-relaxed uppercase">
              ROASTME IS A CREATIVE EXPERIMENT. IF YOU&apos;RE OFFENDED,
              IT&apos;S PROBABLY TRUE. IMPROVE OR IGNORE.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); filter: blur(150px); }
          100% { transform: scale(1.1); filter: blur(250px); }
        }
        @keyframes glitch-bg {
          0% { opacity: 0.01; transform: translate(0,0); }
          20% { opacity: 0.05; transform: translate(-2px, 2px); }
          40% { opacity: 0.01; transform: translate(2px, -2px); }
          100% { opacity: 0.01; transform: translate(0,0); }
        }
        .animate-glitch-bg {
          animation: glitch-bg 0.2s infinite;
        }
      `}</style>
    </div>
  );
};

export default Layout;
