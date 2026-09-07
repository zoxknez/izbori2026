import React from "react";
import { cn } from "@/lib/utils";

interface ZmaiIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * ZmAI zvanični amblem (olovka sa grebenom zmaja i podvlakom)
 * Vektorizovan direktno iz zvaničnog vizuelnog identiteta servisa zmai.crta.rs.
 */
export function ZmaiIcon({ className, ...props }: ZmaiIconProps) {
  return (
    <svg
      viewBox="-10 0 108 188"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block shrink-0", className)}
      aria-hidden="true"
      {...props}
    >
      {/* 1. Gornji narandžasti blok olovke */}
      <rect x="0" y="0" width="60" height="16" fill="#F97316" />

      {/* 2. Glavni stub olovke (prati tekstualnu boju okruženja / currentColor) */}
      <path
        d="M0 16H60V152L30 172L0 152Z"
        fill="currentColor"
      />

      {/* 3. Četiri narandžasta grebena/krljušti zmaja */}
      <polygon points="60,16 88,16 60,49" fill="#F97316" />
      <polygon points="60,49 88,49 60,83" fill="#F97316" />
      <polygon points="60,83 88,83 60,117" fill="#F97316" />
      <polygon points="60,117 88,117 60,152" fill="#F97316" />

      {/* 4. Narandžasti vrh olovke */}
      <polygon points="17,172 43,172 30,181" fill="#F97316" />

      {/* 5. Donja narandžasta podvlaka */}
      <path d="M26 181 L34 181 L88 183 L88 188 L26 188 Z" fill="#F97316" />
    </svg>
  );
}
