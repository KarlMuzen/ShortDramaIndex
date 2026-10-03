'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolledValue;

  const handleChange = (val: string) => {
    if (!isControlled) {
      setUncontrolledValue(val);
    }
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onChange: handleChange }}>
      <div className={cn('w-full flex flex-col', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabList({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1 border-b border-[var(--line)] overflow-x-auto no-scrollbar',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  badge?: React.ReactNode;
}

export function TabTrigger({
  value,
  badge,
  children,
  className,
  disabled,
  ...props
}: TabTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabTrigger must be inside Tabs');

  const isSelected = context.value === value;

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => context.onChange(value)}
      className={cn(
        'relative px-3.5 py-2.5 text-[14px] font-medium transition-colors select-none whitespace-nowrap cursor-pointer border-b-2 -mb-px flex items-center gap-1.5',
        isSelected
          ? 'border-[var(--crimson)] text-[var(--crimson)] font-semibold'
          : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--line-strong)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {badge !== undefined && (
        <span className="text-[12px] font-normal tabular-nums px-1.5 py-0.2 bg-[var(--surface-subtle)] text-[var(--muted)] rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

export interface TabContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabContent({
  value,
  children,
  className,
  ...props
}: TabContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabContent must be inside Tabs');

  if (context.value !== value) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className={cn('pt-4 outline-none', className)}
      {...props}
    >
      {children}
    </div>
  );
}
