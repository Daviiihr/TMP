"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: "🏆",
    title: "Brackets inteligentes",
    description:
      "Generación automática con seeding por ranking, separación regional y asignación de byes. Sin inconsistencias, sin ciclos.",
    accent: "from-arena-cyan to-cyan-400",
  },
  {
    icon: "⚡",
    title: "Inscripción transaccional",
    description:
      "Validación completa en tiempo real de todos los jugadores. Todo o nada: sin estados parciales ni inscripciones inválidas.",
    accent: "from-arena-magenta to-pink-400",
  },
  {
    icon: "📊",
    title: "Ranking dinámico",
    description:
      "Sistema de puntuación con desempate jerárquico: victorias, diferencia de rondas, enfrentamientos directos y rendimiento reciente.",
    accent: "from-arena-gold to-yellow-400",
  },
  {
    icon: "🛡️",
    title: "Sanciones acumulativas",
    description:
      "Sistema que escala automáticamente por reincidencia y persiste entre torneos. Competencia justa garantizada.",
    accent: "from-purple-500 to-violet-400",
  },
  {
    icon: "💰",
    title: "Premios automáticos",
    description:
      "Distribución inteligente con redistribución automática ante descalificaciones. Siempre alguien recibe su recompensa.",
    accent: "from-green-500 to-emerald-400",
  },
  {
    icon: "🔍",
    title: "Auditoría total",
    description:
      "Cada acción registrada con estado anterior y posterior. Reconstruye el estado completo en cualquier punto temporal.",
    accent: "from-blue-500 to-sky-400",
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          {
            y: 80,
            opacity: 0,
            scale: 0.95,
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "top 60%",
              toggleActions: "play none none reverse",
            },
            delay: i * 0.08,
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-24 md:py-32 px-4 md:px-8 overflow-hidden"
    >
      {/* Background glow */}
      <div className="glow-orb w-[400px] h-[400px] bg-arena-cyan top-[20%] left-[-10%] opacity-10" />
      <div className="glow-orb w-[300px] h-[300px] bg-arena-magenta bottom-[10%] right-[-5%] opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 md:mb-20">
          <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-arena-cyan font-semibold mb-3">
            Características
          </p>
          <h2 className="font-[var(--font-display)] text-4xl md:text-6xl font-black uppercase text-white leading-tight">
            Todo lo que necesitas
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-arena-cyan to-arena-magenta">
              para competir
            </span>
          </h2>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="group glass-card gradient-border rounded-2xl p-6 md:p-8 transition-all duration-500 hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            >
              {/* Icon */}
              <div className="text-4xl mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                {feature.icon}
              </div>

              {/* Title */}
              <h3
                className={`font-[var(--font-display)] text-xl md:text-2xl font-bold uppercase mb-3 text-transparent bg-clip-text bg-gradient-to-r ${feature.accent}`}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-zinc-400 leading-relaxed">
                {feature.description}
              </p>

              {/* Bottom accent line */}
              <div
                className={`h-0.5 w-0 group-hover:w-full mt-6 bg-gradient-to-r ${feature.accent} transition-all duration-700 rounded-full`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
