"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        contentRef.current,
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="cta"
      className="relative py-24 md:py-32 px-4 md:px-8 overflow-hidden"
    >
      {/* Background glows */}
      <div className="glow-orb w-[500px] h-[500px] bg-arena-cyan top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />

      <div ref={contentRef} className="relative z-10 max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-arena-cyan/20 via-arena-magenta/10 to-arena-gold/20 rounded-3xl" />
          <div className="absolute inset-[1px] bg-surface-900 rounded-3xl" />

          <div className="relative px-8 py-16 md:px-16 md:py-20 text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-arena-gold/20 bg-arena-gold/5 text-arena-gold text-xs font-semibold uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-arena-gold animate-pulse" />
              Inscripciones abiertas
            </div>

            {/* Title */}
            <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl md:text-7xl font-black uppercase leading-[0.9] text-white mb-6">
              ¿Listo para
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-arena-cyan via-arena-magenta to-arena-gold text-glow-cyan">
                competir?
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-zinc-400 text-sm md:text-lg max-w-xl mx-auto leading-relaxed mb-10">
              Únete a miles de jugadores que ya compiten en la plataforma más
              avanzada de esports de la región. Tu próximo torneo te espera.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="group relative px-10 py-4 bg-gradient-to-r from-arena-cyan to-arena-cyan-dim text-zinc-950 font-bold text-sm uppercase tracking-widest rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_rgba(0,240,255,0.3)] hover:scale-105 w-full sm:w-auto">
                <a href="register" className="relative z-10">Crear cuenta gratis</a>
                <div className="absolute inset-0 bg-gradient-to-r from-arena-cyan via-white to-arena-cyan opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </button>
              <button className="px-10 py-4 border border-zinc-700 text-zinc-300 font-semibold text-sm uppercase tracking-widest rounded-xl transition-all duration-300 hover:border-arena-cyan/50 hover:text-arena-cyan hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] w-full sm:w-auto">
                Ver todos los torneos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer-like bottom */}
      <div className="relative z-10 mt-20 pt-8 border-t border-zinc-800/50 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-arena-cyan to-arena-magenta flex items-center justify-center text-white font-black text-[10px]">
              T
            </div>
            <span className="font-semibold text-zinc-400">
              TMP — Tournament Manager Pro
            </span>
          </div>
          <span>© 2026 Tournament Manager Pro. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-zinc-400 transition-colors">
              Términos
            </a>
            <a href="#" className="hover:text-zinc-400 transition-colors">
              Privacidad
            </a>
            <a href="#" className="hover:text-zinc-400 transition-colors">
              Discord
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
