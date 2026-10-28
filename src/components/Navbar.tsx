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
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: 'var(--primary)',
          borderBottom: '1px solid color-mix(in srgb, var(--background) 8%, transparent)',
          boxShadow: '0 4px 20px color-mix(in srgb, var(--primary) 40%, transparent)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px] gap-2 sm:gap-4">

            {/* ─── LEFT: Logo & Brand (GuestVerify layout) ─── */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  boxShadow: '0 2px 10px color-mix(in srgb, var(--accent) 35%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
                }}
              >
                <Zap size={18} strokeWidth={2.5} className="text-[var(--background)]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-[17px] tracking-tight text-white">
                    Micro<span style={{ color: 'var(--accent)' }}>Split</span>
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-[2px] rounded-full"
                    style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}
                  >
                    v2.0
                  </span>
                </div>
                <span className="text-[10px] font-medium tracking-wide text-slate-300 mt-0.5">
                  Fair Revenue Engine
                </span>
              </div>
            </Link>

            {/* ─── CENTER: Overall Oval Box containing Navbar Option Pills ─── */}
            <nav className="hidden lg:flex items-center justify-center flex-1 px-4">
              <div
                className="inline-flex items-center gap-1 p-1.5 rounded-full"
                style={{
                  background: 'rgba(16, 44, 77, 0.95)',
                  border: '1.5px solid rgba(15, 157, 138, 0.3)',
                  boxShadow: '0 4px 16px rgba(7, 23, 43, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
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
                      className="group relative inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 select-none whitespace-nowrap cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5"
                      style={{
                        color: isActive ? '#FFFFFF' : '#CBD5E1',
                        background: isActive
                          ? 'linear-gradient(135deg, #0F9D8A 0%, #087F73 100%)'
                          : 'transparent',
                        border: isActive
                          ? '1px solid #14B8A6'
                          : '1px solid transparent',
                        boxShadow: isActive
                          ? '0 2px 8px rgba(15, 157, 138, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                          : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#FFFFFF';
                          e.currentTarget.style.background = 'rgba(15, 157, 138, 0.16)';
                          e.currentTarget.style.borderColor = 'rgba(15, 157, 138, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#CBD5E1';
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'transparent';
                        }
                      }}
                    >
                      <Icon
                        size={14}
                        className={`transition-colors duration-200 ${
                          isActive ? 'text-white' : 'text-[#0F9D8A] group-hover:text-white'
                        }`}
                      />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* ─── RIGHT: Actions & CTAs (GuestVerify style) ─── */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">

              {/* Status Indicator Pill */}
              <div
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: 'rgba(15, 157, 138, 0.15)',
                  color: '#0F9D8A',
                  border: '1px solid rgba(15, 157, 138, 0.3)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F9D8A] shadow-[0_0_8px_#0F9D8A]" />
                Online
              </div>

              {/* Mode Pill */}
              <div
                className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: 'rgba(15, 157, 138, 0.15)',
                  color: '#0F9D8A',
                  border: '1px solid rgba(15, 157, 138, 0.3)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F9D8A]" />
                0-Cent Loss
              </div>

              {/* Search */}
              <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs font-medium rounded-full transition-all w-32 lg:w-40 text-white placeholder-slate-400 focus:w-48"
                  style={{
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    background: 'rgba(16, 44, 77, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent)';
                    e.currentTarget.style.background = 'var(--primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--background) 12%, transparent)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 75%, transparent)';
                  }}
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
                  <Bell size={18} className="text-white" />
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#0F9D8A]"
                    style={{ border: '1.5px solid #0B1F3A', boxShadow: '0 0 6px #0F9D8A' }}
                  />
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50 shadow-2xl"
                      style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                    >
                      <div className="px-4 py-3 flex items-center justify-between bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-bold text-[#0B1F3A]">Notifications</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">1 pending</span>
                      </div>
                      <div>
                        <Link
                          href="/evidence"
                          className="p-3.5 block transition-colors hover:bg-slate-50 border-b border-slate-100"
                          onClick={() => setNotifOpen(false)}
                        >
                          <p className="text-xs font-bold text-[#0B1F3A]">Approver Review Flagged</p>
                          <p className="text-[11px] mt-0.5 text-slate-500">Sam Patel logged an 18.5h focus session exceeding daily threshold.</p>
                          <span className="text-[10px] font-semibold mt-1 inline-block text-[#0F9D8A]">Review Evidence →</span>
                        </Link>
                      </div>
                      <div className="p-2.5 bg-slate-50 text-center">
                        <Link href="/evidence" className="text-xs font-bold text-[#0F9D8A] hover:underline" onClick={() => setNotifOpen(false)}>
                          View All Audit Items
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Primary CTA Button (GuestVerify style oval action) */}
              <Link
                href="/splits/new"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white transition-all duration-200 hover:scale-[1.02] shadow-md flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent))',
                  boxShadow: '0 2px 10px color-mix(in srgb, var(--accent) 40%, transparent)',
                }}
              >
                <span>Run Split</span>
                <ArrowRight size={13} />
              </Link>

              {/* User Avatar & Menu */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent), var(--primary))',
                    color: 'var(--background)',
                    border: '1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)',
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
                      className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-50 shadow-2xl"
                      style={{ background: 'var(--background)', border: '1px solid var(--text)' }}
                    >
                      <div className="px-4 py-3 bg-[var(--background)] border-b border-[var(--text)]">
                        <p className="text-xs font-bold text-[var(--primary)]">Alex Rivera</p>
                        <p className="text-[11px] text-[var(--text)]">alex@paypal.demo</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--background)] text-[var(--accent)]">
                          Squad Owner
                        </span>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/squads"
                          className="px-4 py-2 text-xs font-medium text-[var(--primary)] hover:bg-[var(--background)] flex items-center justify-between"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <span>Manage Squads</span>
                          <span className="text-[10px] text-[var(--text)]">3 active</span>
                        </Link>
                        <Link
                          href="/statements"
                          className="px-4 py-2 text-xs font-medium text-[var(--primary)] hover:bg-[var(--background)] flex items-center justify-between"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <span>My Payout Statement</span>
                          <span className="text-[10px] font-bold text-[var(--accent)]">100d streak</span>
                        </Link>
                        <Link
                          href="/payouts"
                          className="px-4 py-2 text-xs font-medium text-[var(--primary)] hover:bg-[var(--background)] flex items-center justify-between"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <span>PayPal Batch Console</span>
                          <span className="text-[10px] text-emerald-600 font-bold">API v1</span>
                        </Link>
                      </div>
                      <div className="pt-1 pb-1 border-t border-[var(--text)]">
                        <Link
                          href="/login"
                          className="px-4 py-2 text-xs font-semibold text-[var(--primary)] hover:bg-rose-50 block"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Switch Account
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
                className="p-1.5 rounded-lg text-[var(--text)] hover:text-white hover:bg-white/10 lg:hidden transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ─── MOBILE DRAWER WITH OVAL PILLS ─── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-white/10 overflow-hidden"
              style={{ background: 'var(--primary)' }}
            >
              <div className="px-4 py-4 space-y-2">
                {/* Search */}
                <form onSubmit={handleSearchSubmit} className="relative mb-3">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text)]"
                  />
                  <input
                    type="text"
                    placeholder="Search squads, splits, evidence..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 text-xs rounded-full text-white placeholder-[var(--text)]"
                    style={{
                      paddingLeft: '38px',
                      paddingRight: '12px',
                      background: 'var(--primary)',
                      border: '1px solid color-mix(in srgb, var(--background) 12%, transparent)',
                      outline: 'none',
                    }}
                  />
                </form>

                {/* Oval Pill Nav Links */}
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
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-center transition-all shadow-sm"
                        style={{
                          color: isActive ? 'var(--background)' : 'var(--text)',
                          background: isActive ? 'linear-gradient(135deg, var(--accent), var(--accent))' : 'color-mix(in srgb, var(--primary) 75%, transparent)',
                          border: isActive ? '1px solid var(--accent)' : '1px solid color-mix(in srgb, var(--background) 10%, transparent)',
                          boxShadow: isActive ? '0 2px 8px color-mix(in srgb, var(--accent) 35%, transparent)' : '0 2px 4px color-mix(in srgb, var(--text) 20%, transparent)',
                        }}
                      >
                        <Icon size={12} className={isActive ? 'text-white' : 'text-[var(--accent)]'} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-3 flex gap-2">
                  <Link
                    href="/splits/new"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 py-2 rounded-full text-xs font-bold text-center text-white"
                    style={{ background: 'var(--accent)' }}
                  >
                    Run Split
                  </Link>
                  <Link
                    href="/squads/new"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-bold text-center text-white bg-[var(--primary)] border border-white/10"
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
