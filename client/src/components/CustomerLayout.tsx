import { ReactNode } from "react";
export function CustomerLayout({ children }: { children: ReactNode }) {
  const logoUrl = "/cafe-twenty-twenty-logo.png";
  return (
    <div className="min-h-screen bg-[#F5E6D3] relative overflow-x-hidden flex flex-col items-center justify-center p-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-100/50 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md z-10 h-full flex flex-col py-8 overflow-hidden">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-6 flex-shrink-0">
          <div className="w-40 transition-transform duration-300">
            <img 
              src={logoUrl} 
              alt="Cafe Twenty Twenty" 
              className="w-full h-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mt-4">
            Cafe Twenty Twenty
          </h1>
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
