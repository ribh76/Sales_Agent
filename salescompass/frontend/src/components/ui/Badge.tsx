import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "green" | "amber" | "neutral" | "red";
};

const tones = {
  green: "bg-teal-50 text-teal-800 ring-teal-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  red: "bg-red-50 text-red-800 ring-red-200"
};

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold ring-1 ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

