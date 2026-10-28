import Link from 'next/link';
import { Home, Users, Zap, HelpCircle, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-[var(--background)]">
      <div className="max-w-xl w-full text-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--background)] border border-[var(--accent)]/20 text-[var(--accent)] text-xs font-semibold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
          404 &bull; Page Not Found
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl font-black text-[var(--primary)] tracking-tight mb-4">
          Lost in settlement?
        </h1>
        <p className="text-base sm:text-lg text-[var(--text)] mb-8 leading-relaxed">
          The page or squad resource you requested doesn&apos;t exist, was moved, or requires higher settlement privileges.
        </p>

        {/* Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          <Link
            href="/"
            className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-[var(--text)] hover:border-[var(--accent)]/40 hover:shadow-md transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--background)] flex items-center justify-center text-[var(--accent)] shrink-0 group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--primary)] flex items-center gap-1">
                Homepage
                <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-[var(--text)] mt-0.5">Return to overview</p>
            </div>
          </Link>

          <Link
            href="/squads"
            className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-[var(--text)] hover:border-[var(--accent)]/40 hover:shadow-md transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--background)] flex items-center justify-center text-[var(--accent)] shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--primary)] flex items-center gap-1">
                Squads
                <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-[var(--text)] mt-0.5">Manage squad rosters</p>
            </div>
          </Link>

          <Link
            href="/splits/new"
            className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-[var(--text)] hover:border-[var(--accent)]/40 hover:shadow-md transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--background)] flex items-center justify-center text-[var(--accent)] shrink-0 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--primary)] flex items-center gap-1">
                New Split Run
                <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-[var(--text)] mt-0.5">Calculate attribution</p>
            </div>
          </Link>

          <Link
            href="/contact"
            className="group flex items-start gap-3 p-4 rounded-xl bg-white border border-[var(--text)] hover:border-[var(--accent)]/40 hover:shadow-md transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--background)] flex items-center justify-center text-[var(--accent)] shrink-0 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--primary)] flex items-center gap-1">
                Help &amp; Support
                <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-[var(--text)] mt-0.5">Contact support team</p>
            </div>
          </Link>
        </div>

        {/* Back Home CTA */}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:bg-[var(--primary)] shadow-sm transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to MicroSplit Home
        </Link>
      </div>
    </div>
  );
}
