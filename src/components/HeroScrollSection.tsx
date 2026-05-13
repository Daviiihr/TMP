"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const PARTICLES = Array.from({ length: 15 }, (_, i) => {
  const seed = i + 1;

  return {
    left: `${(seed * 37) % 100}%`,
    top: `${60 + ((seed * 23) % 40)}%`,
    animationDuration: `${8 + ((seed * 11) % 12)}s`,
    animationDelay: `${(seed * 7) % 10}s`,
    size: `${1 + ((seed * 5) % 3)}px`,
  };
});

export default function HeroScrollSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const keyboardRef = useRef<HTMLDivElement>(null);
  const trophyRef = useRef<HTMLDivElement>(null);
  const badgeLeftRef = useRef<HTMLDivElement>(null);
  const badgeRightRef = useRef<HTMLDivElement>(null);
  const featuresTitleRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        // ── Main timeline pinned to the scroll ──
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: triggerRef.current,
            start: "top top",
            end: "+=250%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });

        // Phase 1: Hero text fades out upward (0% → 30%)
        tl.to(
          titleRef.current,
          {
            y: -200,
            opacity: 0,
            scale: 0.8,
            duration: 3,
            ease: "power2.in",
          },
          0
        );

        tl.to(
          subtitleRef.current,
          {
            y: -150,
            opacity: 0,
            duration: 3,
            ease: "power2.in",
          },
          0.5
        );

        tl.to(
          ctaRef.current,
          {
            y: -100,
            opacity: 0,
            duration: 2.5,
            ease: "power2.in",
          },
          1
        );

        // Phase 2: Controller fades in and scales down (30% → 80%)
        tl.fromTo(
          controllerRef.current,
          {
            opacity: 0,
            scale: 1.2,
            y: 100,
          },
          {
            opacity: 1,
            scale: 0.75,
            rotation: 5,
            y: -40,
            duration: 7,
            ease: "power1.inOut",
          },
          3
        );

        // Phase 3: Peripherals float in from sides (10% → 70%)
        // Keyboard from the left
        tl.fromTo(
          keyboardRef.current,
          {
            x: -800,
            y: 300,
            opacity: 0,
            scale: 0.4,
            rotation: -30,
            filter: "blur(0px)",
          },
          {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: -12,
            filter: "blur(0px)",
            duration: 6,
            ease: "power2.out",
          },
          1
        );

        // Trophy from the right
        tl.fromTo(
          trophyRef.current,
          {
            x: 800,
            y: -300,
            opacity: 0,
            scale: 0.4,
            rotation: 25,
            filter: "blur(0px)",
          },
          {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: 8,
            filter: "blur(0px)",
            duration: 6,
            ease: "power2.out",
          },
          2
        );

        // Phase 3b: subtle blur only after peripherals have settled,
        // so the focus stays crisp during the initial entrance.
        tl.to(
          keyboardRef.current,
          {
            filter: "blur(4px)",
            duration: 3,
            ease: "power1.out",
          },
          8
        );

        tl.to(
          trophyRef.current,
          {
            filter: "blur(3px)",
            duration: 3,
            ease: "power1.out",
          },
          8.5
        );

        // Phase 4: Info badges appear
        tl.fromTo(
          badgeLeftRef.current,
          { x: -100, opacity: 0 },
          { x: 0, opacity: 1, duration: 3, ease: "power2.out" },
          5
        );

        tl.fromTo(
          badgeRightRef.current,
          { x: 100, opacity: 0 },
          { x: 0, opacity: 1, duration: 3, ease: "power2.out" },
          5.5
        );

        // Phase 5: Features title enters from below
        tl.fromTo(
          featuresTitleRef.current,
          { y: 100, opacity: 0 },
          { y: 0, opacity: 1, duration: 3, ease: "power2.out" },
          7
        );

        // ── Peripheral movement is managed by the main timeline only.
        // Avoid duplicate ScrollTrigger tweens that conflict with the entry animation.
      });

      // ── Mobile: simplified animations ──
      mm.add("(max-width: 767px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: triggerRef.current,
            start: "top top",
            end: "+=150%",
            pin: true,
            scrub: 1,
          },
        });

        tl.to(titleRef.current, {
          y: -100,
          opacity: 0,
          duration: 3,
        }, 0);

        tl.to(subtitleRef.current, {
          y: -80,
          opacity: 0,
          duration: 3,
        }, 0.5);

        tl.to(ctaRef.current, {
          y: -60,
          opacity: 0,
          duration: 2,
        }, 1);

        tl.to(controllerRef.current, {
          scale: 0.6,
          y: -20,
          duration: 5,
        }, 2);

        tl.fromTo(
          keyboardRef.current,
          { x: -300, opacity: 0, scale: 0.3 },
          { x: 0, opacity: 1, scale: 0.7, rotation: -8, duration: 4 },
          2
        );

        tl.fromTo(
          trophyRef.current,
          { x: 300, opacity: 0, scale: 0.3, filter: "blur(0px)" },
          { x: 0, opacity: 1, scale: 0.7, rotation: 5, filter: "blur(0px)", duration: 4 },
          3
        );

        tl.to(
          [keyboardRef.current, trophyRef.current],
          {
            filter: "blur(2px)",
            duration: 2.5,
            ease: "power1.out",
          },
          7
        );

        tl.fromTo(
          featuresTitleRef.current,
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 3 },
          6
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative"
      id="hero-scroll"
    >
      {/* Background effects */}
      <div className="glow-orb w-[600px] h-[600px] bg-arena-cyan top-[-200px] left-[-200px] animate-[pulse-glow_6s_ease-in-out_infinite]" />
      <div className="glow-orb w-[500px] h-[500px] bg-arena-magenta bottom-[-100px] right-[-150px] animate-[pulse-glow_8s_ease-in-out_infinite_1s]" />

      {/* Pinned container */}
      <div
        ref={triggerRef}
        className="relative min-h-screen w-full overflow-hidden grid-pattern scanlines"
      >
        {/* ═══ HERO TEXT ═══ */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-4">
          <div ref={titleRef} className="text-center">
            <p className="font-[var(--font-display)] text-sm md:text-base tracking-[0.3em] uppercase text-arena-cyan mb-4 font-semibold">
              Plataforma de esports competitivos
            </p>
            <h1 className="font-[var(--font-display)] text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase leading-[0.85] tracking-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                Domina
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-arena-cyan via-arena-cyan to-arena-magenta text-glow-cyan">
                La Arena
              </span>
            </h1>
          </div>

          <div ref={subtitleRef} className="text-center mt-6 md:mt-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-arena-cyan/20 bg-arena-cyan/5 text-arena-cyan text-xs md:text-sm font-medium tracking-wider uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-arena-cyan animate-pulse" />
              Competición + Premios en efectivo
            </div>
            <p className="text-zinc-400 text-sm md:text-lg max-w-xl mx-auto leading-relaxed">
              Demuestra tus habilidades, sube de rango y compite por premios
              exclusivos en los torneos más grandes de la región.
            </p>
          </div>

          <div ref={ctaRef} className="mt-8 pointer-events-auto">
            <button className="group relative px-8 py-3.5 bg-gradient-to-r from-arena-cyan to-arena-cyan-dim text-zinc-950 font-bold text-sm uppercase tracking-widest rounded-lg overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,240,255,0.3)] hover:scale-105">
              <a href="login" className="relative z-10">Únete ahora</a>
              <div className="absolute inset-0 bg-gradient-to-r from-arena-cyan via-white to-arena-cyan opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </button>
          </div>
        </div>

        {/* ═══ CONTROLLER — Center (pinned element) ═══ */}
        <div
          ref={controllerRef}
          className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
        >
          <div className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[450px] md:h-[450px] lg:w-[550px] lg:h-[550px]">
            {/* Glow ring behind controller */}
            <div className="absolute inset-[-20%] rounded-full bg-gradient-to-br from-arena-cyan/10 via-transparent to-arena-magenta/10 blur-3xl animate-[pulse-glow_4s_ease-in-out_infinite]" />
            <Image
              src="/images/main-controller.png"
              alt="Mando de consola premium TMP"
              fill
              sizes="(max-width: 640px) 280px, (max-width: 768px) 350px, (max-width: 1024px) 450px, 550px"
              className="object-contain drop-shadow-[0_20px_60px_rgba(0,240,255,0.2)]"
              priority
            />
          </div>
        </div>

        {/* ═══ KEYBOARD — Left peripheral (parallax) ═══ */}
        <div
          ref={keyboardRef}
          className="absolute bottom-[10%] left-[3%] md:left-[8%] z-30 pointer-events-none opacity-0"
        >
          <div className="relative w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] md:w-[280px] md:h-[280px] lg:w-[340px] lg:h-[340px]">
            <Image
              src="/images/keyboard.png"
              alt="Teclado mecánico gaming"
              fill
              sizes="(max-width: 640px) 150px, (max-width: 768px) 200px, (max-width: 1024px) 280px, 340px"
              className="object-contain drop-shadow-[0_15px_40px_rgba(232,80,112,0.25)]"
            />
          </div>
        </div>

        {/* ═══ TROPHY — Right peripheral (parallax) ═══ */}
        <div
          ref={trophyRef}
          className="absolute top-[10%] right-[3%] md:right-[8%] z-30 pointer-events-none opacity-0"
        >
          <div className="relative w-[130px] h-[130px] sm:w-[180px] sm:h-[180px] md:w-[250px] md:h-[250px] lg:w-[300px] lg:h-[300px]">
            <Image
              src="/images/trophy.png"
              alt="Trofeo de torneo e-sports"
              fill
              sizes="(max-width: 640px) 130px, (max-width: 768px) 180px, (max-width: 1024px) 250px, 300px"
              className="object-contain drop-shadow-[0_15px_40px_rgba(255,215,0,0.25)]"
            />
          </div>
        </div>

        {/* ═══ INFO BADGES ═══ */}
        <div
          ref={badgeLeftRef}
          className="absolute bottom-[30%] left-[5%] md:left-[12%] z-40 opacity-0"
        >
          <div className="glass-card gradient-border rounded-xl px-4 py-3 max-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                En vivo
              </span>
            </div>
            <p className="text-xs text-zinc-300">
              <span className="text-white font-bold">12 torneos</span> activos
              ahora mismo
            </p>
          </div>
        </div>

        <div
          ref={badgeRightRef}
          className="absolute top-[25%] right-[5%] md:right-[12%] z-40 opacity-0"
        >
          <div className="glass-card gradient-border rounded-xl px-4 py-3 max-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-arena-gold text-lg">🏆</span>
              <span className="text-xs font-semibold text-arena-gold uppercase tracking-wider">
                Pool de premios
              </span>
            </div>
            <p className="text-xs text-zinc-300">
              Más de{" "}
              <span className="text-arena-gold font-bold">$25,000 USD</span>{" "}
              distribuidos
            </p>
          </div>
        </div>

        {/* ═══ FEATURES TITLE (appears at end of scroll) ═══ */}
        <div
          ref={featuresTitleRef}
          className="absolute bottom-[5%] left-0 right-0 z-40 opacity-0 text-center px-4"
        >
          <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-arena-magenta font-semibold mb-2">
            Por qué elegirnos
          </p>
          <h2 className="font-[var(--font-display)] text-3xl md:text-5xl font-black uppercase text-white">
            Todo lo que necesitas{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-arena-cyan to-arena-magenta">
              para competir
            </span>
          </h2>
        </div>

        {/* Floating particles (CSS only) */}
        {PARTICLES.map((particle, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: particle.left,
              top: particle.top,
              animationName: "drift",
              animationDuration: particle.animationDuration,
              animationDelay: particle.animationDelay,
              animationIterationCount: "infinite",
              animationTimingFunction: "linear",
              width: particle.size,
              height: particle.size,
              background:
                i % 3 === 0
                  ? "rgba(0, 240, 255, 0.4)"
                  : i % 3 === 1
                    ? "rgba(232, 80, 112, 0.3)"
                    : "rgba(255, 215, 0, 0.3)",
            }}
          />
        ))}
      </div>

      {/* Scroll hint */}
      
    </section>
  );
}
