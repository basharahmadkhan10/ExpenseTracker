'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Preloader() {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // When pathname changes or on initial load, show curtain then slide it away
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800); // 800ms animation delay before sliding away

    return () => clearTimeout(timer);
  }, [pathname]);



  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex">
      {/* Left Curtain */}
      <div 
        className={`w-1/2 h-full bg-[#111111] border-r-2 border-[#f5bb1b] shadow-[4px_0_15px_rgba(245,187,27,0.2)] flex items-center justify-end transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] ${
          loading ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <span className="text-[#f5bb1b] font-black text-4xl uppercase tracking-widest pr-2 border-r-[3px] border-[#f5bb1b] translate-x-1/2">EXPENSE</span>
      </div>

      {/* Right Curtain */}
      <div 
        className={`w-1/2 h-full bg-[#111111] border-l-2 border-[#f5bb1b] shadow-[-4px_0_15px_rgba(245,187,27,0.2)] flex items-center justify-start transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] ${
          loading ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <span className="text-white font-black text-4xl uppercase tracking-widest pl-2 -translate-x-1/2">TRACKER</span>
      </div>
    </div>
  );
}
