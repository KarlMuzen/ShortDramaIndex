'use client';

import React, { useEffect, useState } from 'react';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'names', label: 'Names' },
  { id: 'watch', label: 'Where to watch' },
  { id: 'versions', label: 'Versions' },
  { id: 'cast', label: 'Cast' },
  { id: 'community', label: 'Community' },
];

export function TitleNav() {
  const [activeId, setActiveId] = useState('overview');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveId(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="In-page navigation"
      className="hidden lg:flex items-center gap-6 border-b border-[var(--line)] py-2 text-[13px] font-medium sticky top-14 bg-[var(--paper)]/95 backdrop-blur-sm z-30 mb-6"
    >
      {sections.map((sec) => (
        <button
          key={sec.id}
          type="button"
          onClick={() => scrollTo(sec.id)}
          className={`transition-colors cursor-pointer py-1 border-b-2 -mb-[9px] ${
            activeId === sec.id
              ? 'text-[var(--crimson)] border-[var(--crimson)] font-semibold'
              : 'text-[var(--muted)] border-transparent hover:text-[var(--ink)]'
          }`}
        >
          {sec.label}
        </button>
      ))}
    </nav>
  );
}
