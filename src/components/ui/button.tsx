import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50";

const variants = {
  primary: "bg-brand text-brand-ink hover:bg-brand-strong",
  secondary: "bg-surface-2 text-ink border border-border hover:bg-surface hover:border-ink-faint",
  ghost: "text-ink-dim hover:text-ink hover:bg-surface-2",
  danger: "bg-sev-teska/15 text-sev-teska border border-sev-teska/30 hover:bg-sev-teska/25",
};

const sizes = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5",
  lg: "h-14 px-7 text-base",
};

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}
