'use client';

import React, { useEffect, useRef } from 'react';
import { ROAST_COLORS } from '../constants';
import { useRoastStore } from '../store/roast-store';
import { RoastLevel } from '../types';

const CustomCursor: React.FC = () => {
  const { currentLevel } = useRoastStore();
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);
  const ringXRef = useRef(0);
  const ringYRef = useRef(0);
  const isHoveringRef = useRef(false);
  const lastTargetRef = useRef<EventTarget | null>(null);

  const activeColor = ROAST_COLORS[currentLevel].color;

  useEffect(() => {
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');

    const handleMouseMove = (e: MouseEvent) => {
      mouseXRef.current = e.clientX;
      mouseYRef.current = e.clientY;

      // Initialize ring position on first move to prevent jump
      if (ringXRef.current === 0 && ringYRef.current === 0) {
        ringXRef.current = e.clientX;
        ringYRef.current = e.clientY;
      }

      // Optimize hover detection by checking if target changed
      if (e.target !== lastTargetRef.current) {
        lastTargetRef.current = e.target;
        const target = e.target as HTMLElement;
        const isHoverable = !!target.closest(
          'button, a, input, [role="button"]'
        );

        if (isHoverable !== isHoveringRef.current) {
          isHoveringRef.current = isHoverable;
          if (isHoverable) {
            dot?.classList.add('hovering');
            ring?.classList.add('hovering');
          } else {
            dot?.classList.remove('hovering');
            ring?.classList.remove('hovering');
          }
        }
      }
    };

    const animate = () => {
      // 1. Update Dot Position
      if (dot) {
        dot.style.transform = `translate3d(${mouseXRef.current}px, ${mouseYRef.current}px, 0) translate(-50%, -50%)`;
      }

      // 2. Update Ring Position with Smoothing
      const dx = mouseXRef.current - ringXRef.current;
      const dy = mouseYRef.current - ringYRef.current;

      ringXRef.current += dx * 0.15;
      ringYRef.current += dy * 0.15;

      if (ring) {
        // Dynamic scaling based on speed
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = 1 + Math.min(distance / 1000, 0.3);

        // Add extra aggression for PEDES level
        const jitter =
          currentLevel === RoastLevel.PEDES ? (Math.random() - 0.5) * 4 : 0;

        ring.style.transform = `translate3d(${ringXRef.current}px, ${ringYRef.current}px, 0) translate(-50%, -50%) scale(${scale}) translate(${jitter}px, ${jitter}px)`;
        ring.style.borderColor = activeColor;
      }

      // 3. Update CSS variables for Background Parallax
      const normX = (mouseXRef.current / window.innerWidth) * 2 - 1;
      const normY = (mouseYRef.current / window.innerHeight) * 2 - 1;
      document.documentElement.style.setProperty('--mouse-x', normX.toFixed(3));
      document.documentElement.style.setProperty('--mouse-y', normY.toFixed(3));

      requestAnimationFrame(animate);
    };

    const handleMouseDown = () => ring?.classList.add('clicking');
    const handleMouseUp = () => ring?.classList.remove('clicking');

    const animationId = requestAnimationFrame(animate);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationId);
    };
  }, [activeColor, currentLevel]);

  return (
    <>
      <div id="cursor-dot"></div>
      <div id="cursor-ring"></div>
    </>
  );
};

export default CustomCursor;
