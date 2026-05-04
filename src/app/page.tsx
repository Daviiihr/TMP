import HeroScrollSection from "@/components/HeroScrollSection";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";

export default function Home() {
  return (
    <main className="relative bg-[#09090b]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-arena-cyan to-arena-magenta flex items-center justify-center text-white font-black text-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              T
            </div>
            <div className="flex flex-col">
              <span className="font-[var(--font-display)] text-base font-bold uppercase tracking-wider text-white leading-none">
                TMP
              </span>
              <span className="text-[9px] text-zinc-500 tracking-wider uppercase leading-none mt-0.5">
                Tournament Manager Pro
              </span>
            </div>
          </a>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <li>
              <a
                href="#features"
                className="hover:text-arena-cyan transition-colors duration-300"
              >
                Características
              </a>
            </li>
            <li>
              <a
                href="#cta"
                className="hover:text-arena-cyan transition-colors duration-300"
              >
                Torneos
              </a>
            </li>
            <li>
              <a
                href="#"
                className="hover:text-arena-cyan transition-colors duration-300"
              >
                Rankings
              </a>
            </li>
          </ul>

          {/* CTA */}
          <button className="px-5 py-2 text-xs font-bold uppercase tracking-widest text-arena-cyan border border-arena-cyan/30 rounded-lg transition-all duration-300 hover:bg-arena-cyan/10 hover:border-arena-cyan/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            Unirse
          </button>
        </div>

        {/* Nav background blur */}
        <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xl -z-10 border-b border-white/[0.03]" />
      </nav>

      {/* Sections */}
      <HeroScrollSection />
      <FeaturesSection />
      <CTASection />
    </main>
  );
}
