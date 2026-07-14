import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      <span>{label}</span>
      <input
        className={`h-11 rounded-md border border-line bg-white px-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-signal focus:ring-2 focus:ring-teal-100 ${className}`}
        {...props}
      />
    </label>
  );
}

