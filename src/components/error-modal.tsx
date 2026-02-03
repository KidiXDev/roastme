'use client';

import React from 'react';
import { useRoastStore } from '../store/roast-store';

const ErrorModal: React.FC = () => {
  const { error, setError } = useRoastStore();

  if (!error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative max-w-md w-full bg-[#0d0d0d] border border-rose-500/30 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(244,63,94,0.15)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-6xl drop-shadow-lg">
          😵
        </div>

        <div className="text-center space-y-6 pt-4">
          <h3 className="text-2xl font-black font-heading tracking-tight text-rose-500 uppercase">
            ROAST FAILED!
          </h3>

          <p className="text-gray-300 font-medium leading-relaxed text-lg italic">
            &quot;{error}&quot;
          </p>

          <button
            onClick={() => {
              setError(null);
            }}
            className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95"
          >
            TRY AGAIN, CHAMP
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
