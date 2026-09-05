import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "default" | "narrow" | "wide" | "full";
}

const SIZES = {
  narrow: "max-w-4xl",
  default: "max-w-7xl",
  wide: "max-w-[1440px]",
  full: "max-w-full",
};

export function Container({
  className,
  size = "default",
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", SIZES[size], className)}
      {...props}
    />
  );
}

