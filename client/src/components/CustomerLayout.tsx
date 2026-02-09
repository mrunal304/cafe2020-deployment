import { ReactNode } from "react";
import cafeLogo from "../assets/cafe-logo.png";
import { motion } from "framer-motion";

export function CustomerLayout({ children }: { children: ReactNode }) {
  const logoUrl = cafeLogo;
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  };

  const title = "Cafe Twenty Twenty";

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col items-center justify-center p-4 bg-transparent">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[var(--beige)]/50 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-[95vw] sm:max-w-lg z-10 h-full flex flex-col py-4 overflow-hidden">
        {/* Logo Header */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex flex-col items-center mb-2 flex-shrink-0"
        >
          {/* Logo with animations */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            whileHover={{ scale: 1.1, filter: "drop-shadow(0 0 20px rgba(255,255,255,0.4))" }}
            className="relative p-2"
          >
            {/* Rotating Border */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/30 animate-rotate-border" />
            
            <img 
              src={logoUrl} 
              alt="Cafe Twenty Twenty" 
              className="w-48 h-48 object-contain animate-subtle-glow"
            />
          </motion.div>

          <div className="mt-0 px-3 py-0 rounded-xl bg-transparent text-center flex flex-col items-center">
            {/* Cafe Name with animations */}
            <motion.h1 
              className="text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-sm flex animate-gradient-shift hover-shine transition-transform hover:-translate-y-1 px-4 text-center justify-center flex-wrap"
              style={{ fontFamily: "'Playfair Display', serif" }}
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.5
                  }
                }
              }}
            >
              {title.split("").map((char, index) => (
                <motion.span
                  key={index}
                  variants={letterVariants}
                  className="inline-block"
                  animate={{
                    y: [0, -10, 0],
                    transition: {
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: index * 0.1
                    }
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.h1>

            {/* Tagline with animations */}
            <motion.p 
              className="text-white/90 text-xl md:text-2xl font-normal italic mt-0 tracking-wider drop-shadow-md hover:italic hover:underline cursor-default transition-all"
              style={{ fontFamily: "'Playfair Display', serif" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              {Array.from("Roasted Rich. Served Rustic.").map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 + i * 0.05 }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.p>
          </div>
        </motion.div>

        {/* Main Content Card */}
        <div className="glass-card rounded-3xl p-6 md:p-8 shadow-2xl ring-1 ring-black/5 flex-1 mb-24 overflow-visible w-full max-w-md mx-auto">
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
