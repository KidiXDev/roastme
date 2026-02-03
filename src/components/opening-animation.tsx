'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef, useState } from 'react';

export default function OpeningAnimation() {
  const [show, setShow] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const textTitleRef = useRef<HTMLHeadingElement>(null);
  const textSubtitleRef = useRef<HTMLHeadingElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        onComplete: () => {
          setShow(false);
        }
      });

      // Initial States
      tl.set(lineRef.current, { scaleX: 0, opacity: 0.5 })
        .set([textTitleRef.current, textSubtitleRef.current], {
          opacity: 0,
          y: 20
        })
        .set(countRef.current, { opacity: 1, innerText: '0%' });

      // 1. Loading Sequence
      tl.to(lineRef.current, {
        scaleX: 1,
        duration: 1.5,
        ease: 'power3.inOut'
      })
        .to(
          countRef.current,
          {
            innerText: '100%',
            duration: 1.5,
            snap: { innerText: 1 },
            ease: 'power3.inOut',
            onUpdate: function () {
              if (countRef.current) {
                countRef.current.innerText =
                  Math.round(this.progress() * 100) + '%';
              }
            }
          },
          '<'
        )

        // 2. Explosion / Text Reveal
        .to([lineRef.current, countRef.current], {
          opacity: 0,
          duration: 0.2,
          display: 'none'
        })
        // Flash effect
        .to(containerRef.current, {
          backgroundColor: '#1a1a1a',
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: 'power1.inOut'
        })
        .set(containerRef.current, { backgroundColor: '#050505' })

        // Title Slams In
        .fromTo(
          textTitleRef.current,
          { scale: 2, filter: 'blur(20px)', opacity: 0 },
          {
            scale: 1,
            filter: 'blur(0px)',
            opacity: 1,
            duration: 0.5,
            ease: 'expo.out'
          }
        )

        // Subtitle Reveal
        .to(
          textSubtitleRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'back.out(1.7)'
          },
          '-=0.3'
        )

        // Glitch Effect Loop (Subtle)
        .to(
          textTitleRef.current,
          {
            textShadow: '-2px 0 #ff0000, 2px 0 #00ffff',
            duration: 0.1,
            repeat: 3,
            yoyo: true
          },
          '-=0.5'
        )
        .set(textTitleRef.current, { textShadow: 'none' })

        // 3. Hold
        .to({}, { duration: 0.8 })

        // 4. Exit Animation
        .to(containerRef.current, {
          yPercent: -100,
          duration: 1,
          ease: 'power4.inOut'
        })
        // Parallax content
        .to(
          [textTitleRef.current, textSubtitleRef.current],
          {
            y: 100,
            opacity: 0,
            duration: 1,
            ease: 'power4.inOut'
          },
          '<'
        );
    },
    { scope: containerRef }
  );

  if (!show) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-99999 flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden"
    >
      {/* Background Grid Effect */}
      <div
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          maskImage:
            'radial-gradient(circle at center, black 40%, transparent 100%)'
        }}
      />

      {/* Noise Overlay */}
      <div className="noise z-10" />

      {/* Loading Elements */}
      <div className="relative z-20 flex flex-col items-center w-full max-w-md">
        <span
          ref={countRef}
          className="font-mono text-xl mb-2 font-bold text-white/50"
          style={{ opacity: 0 }}
        >
          0%
        </span>
        <div
          ref={lineRef}
          className="w-full h-[2px] bg-white shadow-[0_0_20px_white] origin-center"
          style={{ opacity: 0, transform: 'scaleX(0)' }}
        />
      </div>

      {/* Main Text Content */}
      <div className="absolute z-30 flex flex-col items-center justify-center text-center">
        <h1
          ref={textTitleRef}
          className="font-heading text-7xl md:text-[10rem] font-black uppercase tracking-tighter leading-none"
          style={{
            willChange: 'transform, opacity, filter',
            opacity: 0,
            transform: 'scale(2)',
            filter: 'blur(20px)'
          }}
        >
          ROASTME
        </h1>
        <h2
          ref={textSubtitleRef}
          className="font-heading text-xl md:text-3xl font-bold uppercase tracking-[0.5em] text-white/60 mt-4 md:mt-8"
          style={{ opacity: 0, transform: 'translateY(20px)' }}
        >
          READY TO GET ROASTED?
        </h2>
      </div>
    </div>
  );
}
