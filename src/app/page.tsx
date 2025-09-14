'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function WelcomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [hasConfetti, setHasConfetti] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [hasAnimatedStats, setHasAnimatedStats] = useState(false);

  // Gallery images
  const galleryImages = [
    '/side image.jpg',
    '/side image.jpg', // You can add more images here
  ];

  // Stats data with animation counters
  const stats = useMemo(() => [
    { label: 'Programs', value: '30+', count: 30 },
    { label: 'Top Ranked', value: 'University', count: null },
    { label: 'Global', value: 'Partnerships', count: null },
    { label: 'Graduate', value: '95%', count: 95 },
    { label: 'Excellence', value: 'Research', count: null },
  ], []);

  useEffect(() => {
    // Auto-slide gallery
    if (galleryImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % galleryImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [galleryImages.length]);

  // Intersection Observer for stats animation
  useEffect(() => {
    if (!statsRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedStats) {
            setHasAnimatedStats(true);
            // Animate counter numbers
            stats.forEach((stat) => {
              if (stat.count !== null) {
                const element = document.querySelector(`[data-count="${stat.count}"]`);
                if (element) {
                  animateNumber(element as HTMLElement, stat.count);
                }
              }
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [hasAnimatedStats, stats]);

  // Number animation function
  const animateNumber = (element: HTMLElement, target: number, duration = 1200) => {
    const start = 0;
    const startTime = performance.now();
    
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(start + (target - start) * progress);
      element.textContent = current.toString();
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  };

  // Confetti effect
  const burstConfetti = (x: number, y: number) => {
    if (hasConfetti) return;
    setHasConfetti(true);
    
    const colors = ['#7a0d0d', '#f59e0b', '#dc2626', '#fbbf24'];
    const particles = 36;
    
    for (let i = 0; i < particles; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'fixed';
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      particle.style.width = '6px';
      particle.style.height = '6px';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.borderRadius = Math.random() > 0.5 ? '2px' : '50%';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '9999';
      
      const dx = (Math.random() - 0.5) * 220;
      const dy = (Math.random() - 0.8) * 280;
      const rotation = (Math.random() - 0.5) * 360;
      const duration = 800 + Math.random() * 900;
      
      particle.animate([
        { transform: 'translate(0, 0) rotate(0deg)', opacity: '1' },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rotation}deg)`, opacity: '0' }
      ], {
        duration,
        easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)'
      });
      
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), duration + 60);
    }
    
    setTimeout(() => setHasConfetti(false), 1000);
  };

  return (
    <div className="bg-neutral-50 text-neutral-800 antialiased selection:bg-amber-200/60">
      {/* Custom styles */}
      <style jsx global>{`
        @keyframes floaty {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes gradientX {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pingSoft {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
          100% { box-shadow: 0 0 0 14px rgba(245, 158, 11, 0); }
        }
        .glass { backdrop-filter: saturate(1.3) blur(10px); }
        .animate-floaty { animation: floaty 8s ease-in-out infinite; }
        .animate-fadeUp { animation: fadeUp 0.8s ease forwards; }
        .animate-gradientX { animation: gradientX 12s ease infinite; }
        .animate-pingSoft { animation: pingSoft 1.8s ease-out infinite; }
        .reveal { opacity: 0; transform: translateY(16px); }
        .shadow-soft { box-shadow: 0 12px 40px -12px rgba(0,0,0,0.25); }
      `}</style>

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="rounded-2xl shadow-sm ring-1 ring-black/5 bg-white px-4 sm:px-6 py-2">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Logo */}
              <div className="flex items-center gap-3 min-w-0">
                <Link href="/" className="shrink-0">
                  <Image 
                    src="/iuea logo.png" 
                    alt="IUEA Logo" 
                    width={120}
                    height={40}
                    className="h-10 sm:h-12 w-auto object-contain filter contrast-110 brightness-105"
                    priority
                    quality={100}
                  />
                </Link>
              </div>
              
              {/* Right: Create Account + yellow ping dot */}
              <div className="relative">
                <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-amber-400 ring-2 ring-white shadow"></span>
                <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-amber-400 opacity-75 animate-ping"></span>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 rounded-lg font-semibold
                            text-white bg-red-900 hover:bg-red-800 whitespace-nowrap transition text-sm"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    burstConfetti(rect.left + rect.width / 2, rect.top + window.scrollY);
                  }}
                >
                  <span className="hidden sm:inline">Create Account</span>
                  <span className="sm:hidden">Sign Up</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5-5 5M6 12h12"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HERO with animated gradient and gallery */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-red-50 via-white to-neutral-50 bg-[length:200%_200%] animate-gradientX"></div>
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-100/60 blur-3xl"></div>
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-red-200/50 blur-3xl"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-10 lg:pb-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-lg border bg-white/80 px-3 py-1 text-xs text-neutral-600 shadow-soft animate-fadeUp">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span> Welcome to IUEA • Applicant Portal
            </span>
            <h1 className="mt-4 text-5xl sm:text-6xl font-black leading-tight tracking-tight">
              <span className="block">Welcome to Your</span>
              <span className="block bg-gradient-to-r from-red-900 via-red-800 to-amber-600 bg-clip-text text-transparent">Application Portal</span>
            </h1>
            <p className="mt-4 text-lg text-neutral-600 animate-fadeUp" style={{animationDelay: '0.1s'}}>
              Ready to join <strong>15,000+ students</strong> at East Africa&apos;s premier university? Start your application journey today and unlock world‑class education opportunities at IUEA.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link 
                href="/signup" 
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-red-900 px-4 sm:px-6 py-3 text-white font-semibold shadow-soft hover:translate-y-[-2px] hover:bg-red-800 transition"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  burstConfetti(rect.left + rect.width / 2, rect.top + window.scrollY);
                }}
              >
                <span className="relative overflow-hidden">
                  <span className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition rounded-lg bg-gradient-to-r from-amber-400/40 to-transparent"></span>
                  <span className="hidden sm:inline">Create Account</span>
                  <span className="sm:hidden">Sign Up</span>
                </span>
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </Link>
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-6 py-3 font-semibold hover:bg-neutral-50 hover:translate-y-[-2px] transition"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-9A2.25 2.25 0 002.25 5.25v13.5A2.25 2.25 0 004.5 21h9a2.25 2.25 0 002.25-2.25V15"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9l6 3-6 3V9z"/>
                </svg>
                Applicant Login
              </Link>
            </div>

            {/* STAT CARDS with hover + animated counters */}
            <div ref={statsRef} className="mt-9 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.map((stat, statIndex) => (
                <div 
                  key={statIndex}
                  className="rounded-lg bg-white p-4 shadow-soft hover:-translate-y-1 hover:shadow-lg transition animate-fadeUp"
                  style={{animationDelay: `${statIndex * 120}ms`}}
                >
                  <div className="text-2xl font-extrabold text-neutral-900">
                    {stat.count !== null ? (
                      <>
                        <span data-count={stat.count}>0</span>
                        {stat.value.includes('%') ? '%' : '+'}
                      </>
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div className="text-sm text-neutral-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery: auto-slide */}
          <div className="relative select-none">
            <div className="absolute -top-6 -left-6 h-24 w-24 rounded-3xl bg-amber-200 blur-2xl opacity-70"></div>
            <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-3xl bg-red-200 blur-2xl opacity-70"></div>
            
            {/* IUEA Chartered Badge */}
            <div className="absolute -top-4 -right-4 z-10 animate-floaty">
              <Image
                src="/IUEA-Charter-Badge.png"
                alt="IUEA Chartered University Badge"
                width={80}
                height={80}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-lg hover:scale-110 transition-transform duration-300"
              />
            </div>

            <div className="rounded-[2rem] overflow-hidden border border-neutral-200 bg-white shadow-soft">
              <div className="relative">
                <Image
                  src={galleryImages[currentSlide]}
                  alt={`IUEA gallery image ${currentSlide + 1}`}
                  width={500}
                  height={420}
                  className="w-full h-[420px] object-cover"
                  priority
                />
                
                {galleryImages.length > 1 && (
                  <>
                    {/* controls */}
                    <button 
                      type="button" 
                      onClick={() => setCurrentSlide((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 shadow-soft"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6"/>
                      </svg>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setCurrentSlide((prev) => (prev + 1) % galleryImages.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 shadow-soft"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6"/>
                      </svg>
                    </button>
                    
                    {/* indicators */}
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                      {galleryImages.map((_, imgIndex) => (
                        <button
                          key={imgIndex}
                          onClick={() => setCurrentSlide(imgIndex)}
                          className={`h-2.5 w-2.5 rounded-full border border-white/70 transition-all ${
                            imgIndex === currentSlide ? 'bg-white scale-125' : 'bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="absolute bottom-4 left-4 rounded-md bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-soft">
              12+ Years • Excellence & Innovation
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
