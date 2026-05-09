import HeroScrollSection from "@/components/HeroScrollSection";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";
import { getSession } from "@/lib/session";
import { getPostgresPool } from "@/lib/database";
import Link from "next/link";

type TournamentSummary = {
  id: string;
  name: string;
  status: string;
  created_at: Date;
};

export default async function Home() {
  const session = await getSession();
  let tournaments: TournamentSummary[] = [];
  
  if (session) {
    const pool = getPostgresPool();
    const res = await pool.query<TournamentSummary>(
      "SELECT id, name, status, created_at FROM tournaments WHERE status NOT IN ('CANCELLED', 'COMPLETED') ORDER BY created_at DESC LIMIT 3"
    );
    tournaments = res.rows;
  }

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

          {/* CTA / User Profile */}
          {session ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2 group px-2 py-1.5 rounded-xl border border-zinc-800/50 hover:border-arena-cyan/30 bg-zinc-900/50 backdrop-blur transition-all duration-300">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-arena-cyan font-bold text-xs uppercase shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                  {session.username.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col pr-2">
                  <span className="text-xs font-bold text-white leading-tight">
                    {session.username}
                  </span>
                  <span className="text-[9px] text-arena-cyan uppercase tracking-widest leading-tight">
                    En línea
                  </span>
                </div>
              </Link>
            </div>
          ) : (
            <a href="login" className="px-5 py-2 text-xs font-bold uppercase tracking-widest text-arena-cyan border border-arena-cyan/30 rounded-lg transition-all duration-300 hover:bg-arena-cyan/10 hover:border-arena-cyan/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              Unirse
            </a>
          )}
        </div>

        {/* Nav background blur */}
        <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xl -z-10 border-b border-white/[0.03]" />
      </nav>

      {/* Sections */}
      <HeroScrollSection />
      <FeaturesSection />
      <CTASection session={session} tournaments={tournaments} />
    </main>
  );
}
