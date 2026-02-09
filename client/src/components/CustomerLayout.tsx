import { ReactNode } from "react";
import cafeLogo from "../assets/cafe-logo.png";
import { useState, useEffect } from "react";

export function CustomerLayout({ children }: { children: ReactNode }) {
  const [showLogo, setShowLogo] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowLogo(true), 100);
    setTimeout(() => setShowTitle(true), 500);
    setTimeout(() => setShowTagline(true), 900);
  }, []);

  const logoUrl = cafeLogo;
  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col items-center justify-center p-4 bg-transparent">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[var(--beige)]/50 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md z-10 h-full flex flex-col py-8 overflow-hidden">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-6 flex-shrink-0">
          <div className={`w-fit transition-all duration-1000 ease-out p-2 rounded-xl bg-transparent flex items-center justify-center ${showLogo ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-8 scale-90'}`}>
            <img 
              src={logoUrl} 
              alt="Cafe Twenty Twenty" 
              className="w-56 h-56 object-contain"
            />
          </div>
          <div className="mt-4 px-3 py-1 rounded-xl bg-transparent text-center">
            <h1 
              className={`text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-sm transition-all duration-1000 ease-out ${showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Cafe Twenty Twenty
            </h1>
            <p 
              className={`text-white/90 text-xl md:text-2xl font-normal italic mt-1 tracking-wider drop-shadow-md transition-all duration-1000 ease-out ${showTagline ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Roasted Rich. Served Rustic.
            </p>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="glass-card rounded-3xl p-6 md:p-8 shadow-2xl ring-1 ring-black/5 flex-1 mb-24 overflow-visible">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-stone-400 font-bold text-[10px] mt-4 uppercase tracking-widest opacity-60 flex-shrink-0">
          &copy; {new Date().getFullYear()} Cafe Twenty Twenty. Powered by ReserveGo
        </p>
      </div>
    </div>
  );
}
