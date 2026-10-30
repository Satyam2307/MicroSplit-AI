'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Zap,
  FileText,
  CreditCard,
  BookOpen,
  Layers,
  Search,
  Bell,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Sparkles,
  Radio,
  Cpu
} from 'lucide-react';
import { showToast } from '@/components/Toast';

const navLinks = [
  { href: '/squads', label: 'Squads', icon: Users },
  { href: '/splits/new', label: 'Splits', icon: Zap },
  { href: '/evidence', label: 'Evidence', icon: FileText },
  { href: '/payouts', label: 'Payouts', icon: CreditCard },
  { href: '/ledger', label: 'Ledger', icon: BookOpen },
  { href: '/statements', label: 'Statements', icon: Layers },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Live IST Clock (+05:30) inspired by GuestVerify
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istString = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setCurrentTime(`${istString} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor scroll for dynamic header elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = () => {
      setUserMenuOpen(false);
      setNotifOpen(false);
    };
    if (userMenuOpen || notifOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [userMenuOpen, notifOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('squad') || q.includes('team')) router.push('/squads');
    else if (q.includes('split') || q.includes('run')) router.push('/splits/new');
    else if (q.includes('evidence') || q.includes('session')) router.push('/evidence');
    else if (q.includes('payout') || q.includes('paypal')) router.push('/payouts');
    else if (q.includes('ledger') || q.includes('audit')) router.push('/ledger');
    else if (q.includes('statement') || q.includes('streak')) router.push('/statements');
    else {
      showToast({
        type: 'info',
        title: 'Search Results',
        message: `Navigating to evidence & ledger search for "${searchQuery}"`,
      });
      router.push('/evidence');
    }
    setSearchQuery('');
  };

  return (
    <>
      {/* ─── Awwwards Floating Island Navigation Wrapper ─── */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 px-3 sm:px-6 py-2.5 sm:py-3.5`}
      >
        <div
          className={`max-w-7xl mx-auto rounded-2xl sm:rounded-full transition-all duration-300 ${
            scrolled
              ? 'bg-[#0B1F3A]/92 backdrop-blur-xl border border-teal-500/30 shadow-[0_16px_40px_rgba(7,23,43,0.65)] py-2 sm:py-2.5 px-3 sm:px-6'
              : 'bg-[#0B1F3A]/85 backdrop-blur-lg border border-white/12 shadow-[0_8px_30px_rgba(7,23,43,0.4)] py-2.5 sm:py-3 px-4 sm:px-6'
          }`}
        >
          <div className="flex items-center justify-between gap-2 sm:gap-4">

            {/* ─── LEFT: Logo & Brand ─── */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_24px_rgba(15,157,138,0.6)] relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0F9D8A 0%, #07172B 100%)',
                  border: '1.5px solid rgba(15, 157, 138, 0.5)',
                }}
              >
                <div className="absolute inset-0 bg-teal-400/10 group-hover:bg-teal-400/25 transition-colors" />
                <Zap size={19} strokeWidth={2.5} className="text-teal-300 relative z-10 transition-transform group-hover:rotate-6" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-[16px] sm:text-[18px] tracking-tight text-white">
                    Micro<span className="text-[#0F9D8A]">Split</span>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-[2px] rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    AI
                  </span>
                </div>
                <span className="text-[9.5px] font-medium tracking-wide text-slate-300 mt-1 flex items-center gap-1">
                  <span>0-Cent Loss</span>
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span className="text-teal-400 font-semibold">PayPal v1</span>
                </span>
              </div>
            </Link>

            {/* ─── CENTER: Floating Island Pill Tabs ─── */}
            <nav className="hidden lg:flex items-center justify-center flex-1 px-2">
              <div
                className="inline-flex items-center gap-1 p-1 rounded-full backdrop-blur-md"
                style={{
                  background: 'rgba(7, 23, 43, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.4)',
                }}
              >
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    pathname === link.href ||
                    (link.href !== '/' && pathname.startsWith(link.href));

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`group relative inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 select-none whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'text-white shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)'
                          : 'transparent',
                        border: isActive ? '1px solid rgba(20, 184, 166, 0.6)' : '1px solid transparent',
                        boxShadow: isActive ? '0 2px 10px rgba(15, 157, 138, 0.4)' : 'none',
                      }}
                    >
                      <Icon
                        size={13}
                        className={`transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-teal-400 group-hover:text-white'
                        }`}
                      />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* ─── RIGHT: Actions, Telemetry & CTA ─── */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">

              {/* GuestVerify-inspired Live IST Clock Pill */}
              <div
                className="hidden 2xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-mono text-slate-200 bg-white/5 border border-white/10 shadow-xs"
                title="Live IST Timestamp (Asia/Kolkata)"
              >
                <Radio size={11} className="text-teal-400 animate-pulse" />
                <span>{currentTime || 'IST LIVE'}</span>
              </div>

              {/* GuestVerify-inspired AI Engine Status Pill */}
              <div
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-mono text-teal-300 bg-teal-500/15 border border-teal-400/30 shadow-xs"
                title="Claude 3.5 Sonnet Connected"
              >
                <Cpu size={12} className="text-teal-300" />
                <span>Claude 3.5</span>
              </div>

              {/* Status Indicator Pill */}
              <div
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-semibold text-teal-300 bg-teal-500/15 border border-teal-400/30 shadow-xs"
                title="SHA-256 Ledger verified & PayPal Batch v1 connected"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981] animate-pulse" />
                <span>SHA-256 Live</span>
              </div>

              {/* Quick Search */}
              <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
                <Search
                  size={13}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs font-medium rounded-full transition-all w-28 lg:w-36 text-white placeholder-slate-400 focus:w-48 bg-slate-900/80 border border-white/15 pl-9 pr-3 focus:outline-none focus:border-teal-500"
                />
              </form>

              {/* Notification Bell */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                  className="relative p-2 rounded-full transition-colors text-white hover:bg-white/10"
                  aria-label="View notifications"
                >
                  <Bell size={17} className="text-slate-300 hover:text-white" />
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400"
                    style={{ border: '1.5px solid #0B1F3A', boxShadow: '0 0 8px #0F9D8A' }}
                  />
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50 shadow-2xl bg-white border border-slate-200 text-slate-800"
                    >
                      <div className="px-4 py-3 flex items-center justify-between bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-900">Settlement Activity</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          2 live events
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                        <Link
                          href="/runs/run_3"
                          className="p-3.5 block transition-colors hover:bg-slate-50 text-left"
                          onClick={() => setNotifOpen(false)}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              <span>PayPal Batch #204 Disbursed</span>
                            </p>
                            <span className="text-[10px] text-slate-400">12m ago</span>
                          </div>
                          <p className="text-[11px] mt-1 text-slate-600">
                            $1,000.00 split successfully paid across 2 members. Exact 0-cent balance.
                          </p>
                        </Link>
                        <Link
                          href="/statements"
                          className="p-3.5 block transition-colors hover:bg-slate-50 text-left"
                          onClick={() => setNotifOpen(false)}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <Flame size={13} className="text-amber-500" />
                              <span>Streak Cap Reached</span>
                            </p>
                            <span className="text-[10px] text-slate-400">1h ago</span>
                          </div>
                          <p className="text-[11px] mt-1 text-slate-600">
                            Maya Chen achieved 100-day consistency streak. $50.00 bonus locked.
                          </p>
                        </Link>
                      </div>
                      <div className="p-2.5 bg-slate-50 text-center border-t border-slate-100">
                        <Link
                          href="/ledger"
                          className="text-xs font-bold text-teal-700 hover:underline"
                          onClick={() => setNotifOpen(false)}
                        >
                          Inspect Cryptographic Ledger →
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Primary Shimmer CTA Button */}
              <Link
                href="/splits/new"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-md flex-shrink-0 group relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)',
                  boxShadow: '0 4px 16px rgba(15, 157, 138, 0.45)',
                }}
              >
                <span className="relative z-10 flex items-center gap-1">
                  <Sparkles size={12} className="text-teal-200 animate-pulse" />
                  <span>Run Split</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              </Link>

              {/* User Avatar & Menu */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-105 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #0F9D8A, #0B1F3A)',
                    border: '1.5px solid rgba(15, 157, 138, 0.6)',
                  }}
                  aria-label="User profile menu"
                >
                  AR
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-60 rounded-2xl overflow-hidden z-50 shadow-2xl bg-white border border-slate-200 text-slate-800"
                    >
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">Alex Rivera</p>
                        <p className="text-[11px] text-slate-500">alex@paypal.demo</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          Squad Lead (Owner)
                        </span>
                      </div>
                      <div className="py-1 text-xs">
                        <Link
                          href="/squads"
                          className="px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <span>Manage Squads</span>
                          <span className="text-[10px] text-slate-400">3 active</span>
                        </Link>
                        <Link
                          href="/statements"
                          className="px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <span>My Statements</span>
                          <span className="text-[10px] font-bold text-teal-600">100d streak</span>
                        </Link>
                        <Link
                          href="/payouts"
                          className="px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <span>PayPal Batch Console</span>
                          <span className="text-[10px] text-emerald-600 font-bold">API v1</span>
                        </Link>
                        <Link
                          href="/contact"
                          className="px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <span>Support & Concierge</span>
                          <span className="text-[10px] text-teal-600 font-semibold">24/7 Desk</span>
                        </Link>
                      </div>
                      <div className="pt-1 pb-1 border-t border-slate-100 bg-slate-50">
                        <Link
                          href="/login"
                          className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 block"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Sign Out / Switch Account
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Hamburger */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 lg:hidden transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ─── MOBILE DRAWER WITH GLASS PILLS ─── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mt-2 rounded-2xl border border-white/15 overflow-hidden bg-[#0B1F3A]/95 backdrop-blur-xl shadow-2xl"
            >
              <div className="px-4 py-4 space-y-3">
                {/* GuestVerify Live Meta Row */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                    <Radio size={12} className="text-teal-400 animate-pulse" />
                    <span>{currentTime || 'IST ACTIVE'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-teal-300 font-bold">
                    <Cpu size={12} />
                    <span>Claude AI Live</span>
                  </div>
                </div>

                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search squads, splits, evidence..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 text-xs rounded-full text-white placeholder-slate-400 bg-slate-900 border border-slate-700 focus:outline-none focus:border-teal-500 pl-10 pr-4"
                  />
                </form>

                {/* Mobile Pill Nav Links */}
                <div className="grid grid-cols-2 gap-2">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive =
                      pathname === link.href ||
                      (link.href !== '/' && pathname.startsWith(link.href));

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-xs font-bold text-center transition-all ${
                          isActive
                            ? 'bg-teal-600 text-white shadow-md border border-teal-400'
                            : 'bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <Icon size={14} className={isActive ? 'text-white' : 'text-teal-400'} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Action CTAs */}
                <div className="pt-2 flex gap-2">
                  <Link
                    href="/splits/new"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 py-2.5 rounded-full text-xs font-bold text-center text-white bg-teal-600 hover:bg-teal-700 shadow-md"
                  >
                    Run Split
                  </Link>
                  <Link
                    href="/squads/new"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2.5 rounded-full text-xs font-bold text-center text-white bg-slate-800 border border-slate-700 hover:bg-slate-700"
                  >
                    + Squad
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
