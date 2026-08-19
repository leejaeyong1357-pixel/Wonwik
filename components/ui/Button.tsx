"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-brand-navy hover:bg-brand-navy-dark text-white",
  secondary: "bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue border border-brand-blue/30",
  danger: "bg-brand-red hover:bg-brand-red-dark text-white",
  outline: "bg-brand-blue hover:bg-blue-700 text-white",
  ghost: "bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-6 py-3.5 text-lg",
};

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", size = "md", fullWidth, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export default Button;
