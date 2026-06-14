'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Preloader({ children }: { children?: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [textVisible, setTextVisible] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    setShowContent(false);
    setTextVisible(true);

    // Fade text out 300ms before curtains open so they never overlap
    const textTimer = setTimeout(() => {
      setTextVisible(false);
    }, 1100);

    // Then open the curtains
    const curtainTimer = setTimeout(() => {
      setLoading(false);
      setShowContent(true);
    }, 1500);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(curtainTimer);
    };
  }, [pathname]);

  return (
    <>
      <div className="fixed inset-0 z-[9999] pointer-events-none flex">
        {/* Left Curtain */}
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

        {/* Right Curtain */}
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

      {/* Page content fades in once curtains are open */}
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
