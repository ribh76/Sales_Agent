import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: ReactNode;
};

const variants = {
  primary: "bg-ink text-white hover:bg-signal",
  secondary: "border border-line bg-white text-ink hover:border-signal hover:text-signal",
  ghost: "text-ink hover:bg-field",
  danger: "bg-red-700 text-white hover:bg-red-800"
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm"
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  icon,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

