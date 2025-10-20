"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "default" | "outline";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4",
  lg: "h-11 px-6 text-base",
};

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-teal-700 text-white hover:bg-teal-800",
  outline:
    "border border-teal-200 text-teal-800 hover:bg-teal-50",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          // base
          "inline-flex items-center justify-center rounded-2xl transition-colors disabled:opacity-50 disabled:pointer-events-none",
          // size + variant
          sizeClasses[size],
          variantClasses[variant],
          // caller overrides
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
