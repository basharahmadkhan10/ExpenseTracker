'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Preloader({ children }: { children?: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // When pathname changes, keep content hidden and close curtain
    setLoading(true);
    setShowContent(false);

    // Increase preloader time: wait 1.5 seconds before opening
    const timer = setTimeout(() => {
      setLoading(false);
      setShowContent(true);
    }, 1500); 

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <div className="fixed inset-0 z-[9999] pointer-events-none flex">
        {/* Left Curtain */}
        <div 
          className={`w-1/2 h-full bg-[#111111] border-r-2 border-[#f5bb1b] shadow-[4px_0_15px_rgba(245,187,27,0.2)] flex items-center justify-end transition-transform duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] ${
            loading ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <span className="text-[#f5bb1b] font-black text-4xl uppercase tracking-widest pr-2 border-r-[3px] border-[#f5bb1b] translate-x-1/2">EXPENSE</span>
        </div>

        {/* Right Curtain */}
        <div 
          className={`w-1/2 h-full bg-[#111111] border-l-2 border-[#f5bb1b] shadow-[-4px_0_15px_rgba(245,187,27,0.2)] flex items-center justify-start transition-transform duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] ${
            loading ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <span className="text-white font-black text-4xl uppercase tracking-widest pl-2 -translate-x-1/2">TRACKER</span>
        </div>
      </div>

      {/* Page content only becomes visible once preloader finishes */}
      <div className={`transition-opacity duration-1000 flex-1 flex flex-col ${showContent ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        {children}
      </div>
    </>
  );
}
