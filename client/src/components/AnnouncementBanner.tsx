import { useEffect, useState } from "react";

export function AnnouncementBanner() {
  const text = "🚴 DELIVERY COMING SOON! 🚴";
  const repeatedText = Array(10).fill(text).join(" \u00A0\u00A0\u00A0\u00A0\u00A0 ");

  return (
    <div className="fixed top-0 left-0 w-full h-[30px] md:h-[40px] bg-[#C46A3A] text-white overflow-hidden z-[100] flex items-center shadow-md">
      <div className="whitespace-nowrap flex animate-scroll-banner">
        <span className="text-xs md:text-sm font-bold uppercase tracking-wide px-4">
          {repeatedText}
        </span>
        <span className="text-xs md:text-sm font-bold uppercase tracking-wide px-4">
          {repeatedText}
        </span>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scroll-banner {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-banner {
          animation: scroll-banner 60s linear infinite;
        }
      `}} />
    </div>
  );
}
