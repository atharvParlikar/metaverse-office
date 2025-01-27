import { cn } from "../../lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          "relative select-none font-bold border-2 active:translate-y-[2px] transition-transform w-fit rounded-md",
          // Pixel art effect
          "[image-rendering:pixelated]",
          // Variants
          variant === "primary" &&
            "bg-gray-900 border-[#1A1A1A] text-white  hover:shadow-xl hover:bg-gray-800",
          variant === "secondary" &&
            "bg-[#8B8B8B] border-[#4C4C4C] text-white hover:bg-[#9A9A9A]",
          variant === "destructive" &&
            "bg-[#B71C1C] border-[#7F1313] text-white hover:bg-[#D32F2F]",
          // Sizes
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-8 px-3 text-sm",
          size === "lg" && "h-12 px-8 text-lg",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };

