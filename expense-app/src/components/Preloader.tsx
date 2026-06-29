'use client';

import { useEffect, useState } from 'react';

let hasShownThisSession = false;

export default function Preloader({ children }: { children?: React.ReactNode }) {
  const shouldAnimate = !hasShownThisSession;

  const [loading, setLoading] = useState(shouldAnimate);
  const [showContent, setShowContent] = useState(!shouldAnimate);
  const [textVisible, setTextVisible] = useState(shouldAnimate);

  useEffect(() => {
    if (!shouldAnimate) return;

    hasShownThisSession = true;

    const textTimer = setTimeout(() => {
      setTextVisible(false);
    }, 1100);

    const curtainTimer = setTimeout(() => {
      setLoading(false);
      setShowContent(true);
    }, 1500);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(curtainTimer);
    };
  }, [shouldAnimate]);

  if (!shouldAnimate) {
    return (
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[9999] pointer-events-none flex">
        <div
          className={`w-1/2 h-full bg-[#111111] border-r-2 border-[#f5bb1b] shadow-[4px_0_20px_rgba(245,187,27,0.25)] flex items-center justify-center transition-transform duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] ${
            loading ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <span
            className={`text-[#f5bb1b] font-black text-3xl uppercase tracking-[0.25em] transition-opacity duration-300 ${
              textVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            EXPENSE
          </span>
        </div>

        <div
          className={`w-1/2 h-full bg-[#111111] border-l-2 border-[#f5bb1b] shadow-[-4px_0_20px_rgba(245,187,27,0.25)] flex items-center justify-center transition-transform duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] ${
            loading ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <span
            className={`text-white font-black text-3xl uppercase tracking-[0.25em] transition-opacity duration-300 ${
              textVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            TRACKER
          </span>
        </div>
      </div>

      <div
        className={`transition-opacity duration-700 flex-1 flex flex-col ${
          showContent ? 'opacity-100' : 'opacity-0'
        } ${!showContent ? 'h-0 overflow-hidden' : ''}`}
      >
        {children}
      </div>
    </>
  );
}
