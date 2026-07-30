import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white rounded-2xl border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}
      {...props}
    />
  );
}
