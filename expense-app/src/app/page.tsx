'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Check,
  Phone,
  Mail,
  MapPin,
  Code,
  DollarSign,
  Database,
  FileSpreadsheet,
  Eye,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
  </svg>
);

export default function LandingPage() {
  const [activeNav, setActiveNav] = useState('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const active = saved || 'light';
    setTheme(active);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(active === 'dark' ? 'dark' : 'light');
    document.body.className = active === 'dark' ? 'dark-theme' : 'light-theme';
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next === 'dark' ? 'dark' : 'light');
    document.body.className = next === 'dark' ? 'dark-theme' : 'light-theme';
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-dots-grid selection:bg-[#f5bb1b] selection:text-black">
      {/* Navbar: High contrast header with name title (logo removed) and dark/light switcher */}
      <header className="sticky top-0 z-50 bg-[#1b1b1b] border-b border-[rgba(255,255,255,0.08)] px-4 sm:px-6 py-3 shadow-none safe-top">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-widest text-white uppercase font-mono">
              EXPENSE{' '}
              <span className="text-black bg-[#f5bb1b] border-2 border-black px-2 py-0.5 rounded shadow-[2px_2px_0px_#000]">
                TRACKER
              </span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-300">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About' },
              { id: 'features', label: 'Services' },
              { id: 'portfolio', label: 'Logs' },
              { id: 'contact', label: 'Contact' },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActiveNav(link.id);
                  const el = document.getElementById(link.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`transition duration-200 hover:text-[#f5bb1b] cursor-pointer ${
                  activeNav === link.id
                    ? 'text-[#f5bb1b] border-b-2 border-[#f5bb1b] pb-0.5'
                    : 'text-slate-300'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Controls & Get Started */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-neutral-900 border-2 border-neutral-700 text-[#f5bb1b] hover:text-white hover:bg-neutral-800 transition cursor-pointer shadow-[2px_2px_0px_rgba(255,255,255,0.1)]"
              title="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4.5 h-4.5" />
              ) : (
                <Sun className="w-4.5 h-4.5" />
              )}
            </button>

            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-[#f5bb1b] uppercase tracking-wider transition"
            >
              Login
            </Link>

            <Link
              href="/dashboard"
              className="bg-[#f5bb1b] hover:bg-[#f6c333] text-black text-xs font-black uppercase tracking-wider py-2.5 px-5 rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] transition transform hover:-translate-y-0.5 active:translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Section 1: Hero Section (Vibrant Neo-Brutalist Layout with floating shapes) */}
      <section
        id="home"
        className="bg-[#1b1b1b] text-white pt-16 sm:pt-20 pb-16 sm:pb-24 relative overflow-hidden border-b-4 border-black"
      >
        {/* Floating animated decorative shapes */}
        <div className="absolute top-12 left-10 w-8 h-8 bg-[#f5bb1b]/20 border-2 border-[#f5bb1b]/40 rounded-lg transform rotate-12 floating-shape"></div>
        <div className="absolute top-1/4 right-16 w-12 h-12 bg-white/10 border-2 border-white/20 rounded-xl transform -rotate-45 floating-shape-delayed-1"></div>
        <div className="absolute bottom-20 left-1/4 w-10 h-10 bg-[#f5bb1b]/10 border-2 border-[#f5bb1b]/20 rounded-2xl transform rotate-45 floating-shape-delayed-2"></div>
        <div className="absolute bottom-10 right-1/4 w-8 h-8 bg-white/5 border border-white/10 rounded transform rotate-12 floating-shape"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center relative z-10">
          {/* Left Column: Headings & CTAs */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-neutral-900 border-2 border-black rounded-xl px-4 py-1.5 text-[#f5bb1b] text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000]">
              <Sparkles className="w-3.5 h-3.5" />
              Financial Resolution for Flatmates
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2]">
                <span className="inline-block bg-white text-black border-3 border-black px-4 py-2 rounded-2xl shadow-[4px_4px_0px_#000] transform -rotate-1">
                  HI, We are Expense Tracker.
                </span>
                <br />
                <span className="inline-block bg-[#f5bb1b] text-black border-3 border-black px-4 py-2 rounded-2xl shadow-[4px_4px_0px_#000] transform rotate-1 mt-3">
                  We are Art Director of Balances.
                </span>
              </h1>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed max-w-xl">
              No more messy spreadsheets, conversion confusion, or time-travel membership
              calculations. We construct an elegant, auditable, and completely transparent picture
              of your shared flatmate ledger.
            </p>

            {/* Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Time-Travel Membership Check',
                'Exchange Rate Transparency',
                'Oversight Review Queue',
                'Optimal Settlements Engine',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-[#f5bb1b] text-black border-2 border-black flex items-center justify-center shadow-[1.5px_1.5px_0px_#000] shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </span>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-6">
              <Link
                href="/dashboard"
                className="bg-[#f5bb1b] hover:bg-[#f6c333] text-black text-xs font-black uppercase tracking-wider py-4 px-8 rounded-xl border-3 border-black shadow-[4px_4px_0px_#000] transition transform hover:-translate-y-1 active:translate-y-1 flex items-center gap-2 group"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 transition duration-200 group-hover:translate-x-1" />
              </Link>
              <button
                onClick={() =>
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="text-xs font-black uppercase tracking-wider text-slate-300 hover:text-[#f5bb1b] transition"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Right Column: Hero Artwork */}
          <div className="flex justify-center relative">
            <div className="w-[340px] h-[240px] md:w-[480px] md:h-[320px] rounded-3xl overflow-hidden border-4 border-black shadow-[8px_8px_0px_#000] relative bg-[#262626]">
              <Image
                src="/hero_artwork.png"
                alt="Expense Tracker Core Concept Artwork"
                fill
                className="object-cover transition duration-500 hover:scale-102"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: About System (Dynamic Background) */}
      <section id="about" className="py-24 relative border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left Column: Portrait */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative w-[300px] h-[380px] md:w-[350px] md:h-[440px]">
              {/* Decorative Background yellow card offset */}
              <div className="absolute inset-0 bg-[#f5bb1b] rounded-3xl translate-x-5 translate-y-5 border-3 border-black shadow-[4px_4px_0px_#000] -z-10"></div>

              <div className="w-full h-full rounded-3xl overflow-hidden border-3 border-black relative bg-[#1b1b1b]">
                <Image
                  src="/about_portrait.png"
                  alt="About Us Lead Portrait"
                  fill
                  className="object-cover transition duration-300 hover:scale-102"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <h2 className="text-3xl font-black uppercase tracking-tight relative inline-block text-box border-3 border-black bg-[#f5bb1b] text-black px-4 py-2 rounded-2xl shadow-[3px_3px_0px_#000]">
                About System
              </h2>
              <p className="text-[10px] text-[#f5bb1b] dark:text-[#f6c333] font-black uppercase tracking-wider block pt-2">
                Our core engine is built to solve shared ledger conflicts
              </p>
            </div>

            <p className="text-sm font-semibold leading-relaxed">
              The Shared Expense Tracker is a professional audit utility that prevents standard
              calculation disputes. It resolves members join/departure dynamically and registers all
              historical currency values transparently.
            </p>

            <div className="space-y-5">
              <div className="flex gap-4">
                <span className="w-12 h-12 rounded-xl bg-[#f5bb1b] text-black border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Time-Travel Ledger
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 leading-relaxed">
                    Splits are computed according to active memberships on the exact date of the
                    transaction. Late-joining members are excluded from early bills automatically.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="w-12 h-12 rounded-xl bg-[#f5bb1b] text-black border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
                  <DollarSign className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Multi-Currency Accountability
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 leading-relaxed">
                    USD expenditures record the actual exchange rate at import time. This provides
                    auditable splits and eliminates dynamic rate conversion discrepancies.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="w-12 h-12 rounded-xl bg-[#f5bb1b] text-black border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#000]">
                  <AlertCircle className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Interactive Review Queue
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1 leading-relaxed">
                    Flagged anomalies (negatives, duplicates, unknown members, date issues) are
                    placed in the review queue for manual correction, approval, or rejection.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Connect */}
            <div className="pt-4 flex items-center gap-4 border-t-2 border-dashed border-slate-300 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                Connect with our Devs:
              </span>
              <div className="flex gap-2.5">
                {[
                  { icon: GithubIcon, href: 'https://github.com' },
                  { icon: LinkedinIcon, href: 'https://linkedin.com' },
                  { icon: TwitterIcon, href: 'https://twitter.com' },
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl border-2 border-black bg-white text-black hover:bg-[#f5bb1b] flex items-center justify-center transition shadow-[2px_2px_0px_#000]"
                  >
                    <item.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: What We Do (Symmetric Cards) */}
      <section id="features" className="py-24 border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl font-black uppercase tracking-tight inline-block border-3 border-black bg-white text-black px-4 py-2 rounded-2xl shadow-[3px_3px_0px_#000]">
              What We Do
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block pt-2">
              Standard operations and financial micro-services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: FileSpreadsheet,
                title: 'CSV Importer',
                desc: 'Upload Expenses Export.csv directly. The engine parses lines, checks member syntax, and separates errors without manual preprocessing.',
              },
              {
                icon: Code,
                title: 'Optimal Settlements',
                desc: "Computes Simplified Debts (Aisha's request) to settle all internal balances with the minimum number of currency transactions.",
              },
              {
                icon: Eye,
                title: 'Audit Trails',
                desc: "Get full transparency into individual bills. Rohan's Explain Balance drill-down illustrates exact split formulas to eliminate doubts.",
              },
              {
                icon: AlertCircle,
                title: 'Oversight Queue',
                desc: "Park duplicate items, date errors, and incorrect currency claims. Discard items or review details inline with Meera's oversight panel.",
              },
            ].map((serv, idx) => (
              <div
                key={idx}
                className="neobrutal-card-white p-6 flex flex-col justify-between h-full group"
              >
                <div>
                  <span className="w-12 h-12 rounded-xl bg-[#f5bb1b] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000] transition duration-300">
                    <serv.icon className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <h3 className="text-xs font-black uppercase tracking-wider mt-5">{serv.title}</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                    {serv.desc}
                  </p>
                </div>
                <div className="pt-4 mt-auto">
                  <span className="text-[9px] font-black uppercase text-[#f5bb1b] group-hover:underline flex items-center gap-1">
                    System Core <ChevronRightMini />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Key Stats Strip (Vibrant Yellow Background) */}
      <section className="bg-[#f5bb1b] py-12 border-b-4 border-black text-black shadow-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-around items-center gap-8">
          {[
            { num: '90+', label: 'Total Expenses Tracked' },
            { num: '50+', label: 'Active Group Members' },
            { num: '18+', label: 'Import Anomalies Audited' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center space-y-1">
              <h3 className="text-5xl font-black tracking-tight border-2 border-black bg-white px-5 py-2 rounded-2xl shadow-[3px_3px_0px_#000] inline-block">
                {stat.num}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5: Activity Log Table (Symmetric & Highly Readable) */}
      <section id="portfolio" className="py-24 border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl font-black uppercase tracking-tight inline-block border-3 border-black bg-[#f5bb1b] text-black px-4 py-2 rounded-2xl shadow-[3px_3px_0px_#000]">
              Audited Activity Logs
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block pt-2">
              Live sample of tracked transactions & membership milestones
            </p>
          </div>

          <div className="neobrutal-card-white overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1b1b1b] text-white text-[10px] font-black uppercase tracking-wider border-b-2 border-black">
                <tr>
                  <th className="px-6 py-4.5">Date</th>
                  <th className="px-6 py-4.5">Transaction Detail</th>
                  <th className="px-6 py-4.5">Audited Status</th>
                  <th className="px-6 py-4.5 text-right">Impact Value</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black text-[11px] font-semibold">
                {[
                  {
                    date: '15-Apr-2026',
                    title: 'Sam Joined Group (Mid-Month Milestone)',
                    desc: 'Membership updated. Excluded from early April calculations.',
                    status: 'COMPLETED',
                    val: '0.00 INR',
                    type: 'system',
                  },
                  {
                    date: '12-Apr-2026',
                    title: 'Rohan paid USD Rent (Converted)',
                    desc: 'Original: $50.00 @ ₹83.50/$ rate. Audited transparently.',
                    status: 'CONVERTED',
                    val: '4,175.00 INR',
                    type: 'expense',
                  },
                  {
                    date: '08-Apr-2026',
                    title: 'Meera flagged Duplicate cost (Oversight)',
                    desc: 'Duplicate laundry row parsed. Parked in review queue.',
                    status: 'ANOMALY PENDING',
                    val: '350.00 INR',
                    type: 'anomaly',
                  },
                  {
                    date: '02-Apr-2026',
                    title: 'Aisha settled Rohan (Ledger balanced)',
                    desc: 'Debt minimization completed. Settlement logged.',
                    status: 'SETTLED',
                    val: '1,200.00 INR',
                    type: 'settlement',
                  },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/50 transition"
                  >
                    <td className="px-6 py-4 font-bold text-slate-400">{row.date}</td>
                    <td className="px-6 py-4">
                      <span className="block text-slate-900 dark:text-white font-extrabold">
                        {row.title}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-normal block mt-0.5">
                        {row.desc}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black border-2 border-black shadow-[1.5px_1.5px_0px_#000] tracking-wider ${
                          row.status === 'COMPLETED'
                            ? 'bg-slate-100 text-slate-700'
                            : row.status === 'CONVERTED'
                              ? 'bg-sky-100 text-sky-800'
                              : row.status === 'ANOMALY PENDING'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-black text-xs ${row.type === 'expense' ? 'text-red-500' : row.type === 'settlement' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}
                    >
                      {row.val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 6: Contact Support Form */}
      <section id="contact" className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Contact details */}
          <div className="lg:col-span-4 space-y-8">
            <div className="space-y-3">
              <h2 className="text-3xl font-black uppercase tracking-tight inline-block border-3 border-black bg-white text-black px-4 py-2 rounded-2xl shadow-[3px_3px_0px_#000]">
                Contact Us
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block pt-2">
                Keep in touch for support and feedback
              </p>
            </div>

            <p className="text-sm font-semibold leading-relaxed">
              If you discover calculation discrepancies or require custom schema configurations for
              your shared household, reach out to our core tech team. We resolve issues within 24
              hours.
            </p>

            <div className="space-y-5">
              {[
                { icon: Phone, title: 'Call Me', val: '+91 98765-43210' },
                { icon: Mail, title: 'Email Me', val: 'support@flatmatesplit.com' },
                { icon: MapPin, title: 'Follow Me', val: 'Flat 402, Sector-5, Bangalore' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <span className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shrink-0 text-black shadow-[2px_2px_0px_#000]">
                    <item.icon className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <div>
                    <h4 className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                      {item.title}
                    </h4>
                    <p className="text-xs font-black uppercase tracking-wide mt-0.5">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Message Form */}
          <div className="lg:col-span-8 neobrutal-card-white p-8">
            <div className="mb-6 space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Send Free Message
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">
                Our admin team is standing by to assist with your ledger imports.
              </p>
            </div>

            {formSubmitted ? (
              <div className="rounded-2xl bg-emerald-50 border-3 border-black p-6 flex flex-col items-center justify-center text-center gap-3 shadow-[4px_4px_0px_#000]">
                <span className="w-12 h-12 rounded-full bg-emerald-500 border-2 border-black text-white flex items-center justify-center shadow-[2px_2px_0px_#000]">
                  <Check className="w-6 h-6 stroke-[3]" />
                </span>
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Message Dispatched Successfully!
                </h4>
                <p className="text-[10px] text-emerald-600 font-semibold uppercase leading-relaxed max-w-xs">
                  We have queued your support request. A developer will review your split queries
                  shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Sam Smith"
                      className="w-full neobrutal-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                      Your Email
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="sam@flatmates.com"
                      className="w-full neobrutal-input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="USD Exchange Rate Anomaly Inquiry"
                    className="w-full neobrutal-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="We uploaded a CSV but Rohan was billed for March utilities although he joined in April..."
                    className="w-full neobrutal-input text-xs resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="neobrutal-btn-yellow py-3 px-8 text-xs font-black shadow-[3px_3px_0px_#000] border-2 border-black"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer: Charcoal background */}
      <footer className="bg-[#1b1b1b] text-white py-12 border-t-4 border-black">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black tracking-widest text-[#ffffff] uppercase font-mono">
              EXPENSE{' '}
              <span className="text-black bg-[#f5bb1b] border-2 border-black px-2 py-0.5 rounded shadow-[2px_2px_0px_#000]">
                TRACKER
              </span>
            </span>
          </div>

          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest text-center">
            © 2026 Expense Tracker Inc. All rights reserved. Developed with AI transparency.
          </p>

          <div className="flex gap-4 text-xs font-bold uppercase tracking-wider text-white/80">
            <Link href="/login" className="hover:text-[#f5bb1b] transition">
              Sign In
            </Link>
            <span className="text-neutral-800">|</span>
            <Link href="/dashboard" className="hover:text-[#f5bb1b] transition">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const ChevronRightMini = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline">
    <path
      fillRule="evenodd"
      d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
      clipRule="evenodd"
    />
  </svg>
);
