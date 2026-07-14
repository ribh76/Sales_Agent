import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function Textarea({ label, className = "", ...props }: TextareaProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      <span>{label}</span>
      <textarea
        className={`min-h-28 rounded-md border border-line bg-white px-3 py-2 text-sm outline-none transition placeholder:text-neutral-400 focus:border-signal focus:ring-2 focus:ring-teal-100 ${className}`}
        {...props}
      />
    </label>
  );
}

