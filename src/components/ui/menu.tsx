'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/src/lib/utils';

export interface MenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  variant?: 'default' | 'danger';
}

export function MenuItem({
  children,
  icon,
  variant = 'default',
  className,
  ...props
}: MenuItemProps) {
  return (
    <button
      role="menuitem"
      type="button"
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-left rounded-[6px] transition-colors cursor-pointer select-none',
        variant === 'danger'
          ? 'text-[var(--crimson)] hover:bg-[var(--crimson-subtle)]'
          : 'text-[var(--ink)] hover:bg-[var(--surface-subtle)]',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0 text-[var(--muted)]">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

export function MenuDivider() {
  return <div className="h-px bg-[var(--line)] my-1" role="separator" />;
}

export interface MenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Menu({
  trigger,
  children,
  align = 'right',
  className,
}: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex cursor-pointer"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-1 min-w-[180px] p-1.5 bg-[var(--surface)] border border-[var(--line)] rounded-[8px] focus:outline-none transition-all',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
