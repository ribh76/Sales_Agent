import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={`rounded-lg border border-line bg-white p-5 shadow-panel ${className}`}
      {...props}
    />
  );
}

