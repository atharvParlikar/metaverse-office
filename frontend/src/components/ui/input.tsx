import { InputHTMLAttributes, forwardRef } from "react"
import { cn } from "../../lib/utils"

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: "default" | "sm" | "lg"
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = "default", ...props }, ref) => {
    return (
      <input
        className={cn(
          // Base styles
          "font-press-start w-full bg-white",
          "[image-rendering:pixelated] transition-colors",
          "border-[#1A1A1A] focus:border-[#4C4C4C] outline-none",
          // Sizes
          size === "default" && "h-10 px-3 py-2 text-sm",
          size === "sm" && "h-8 px-2 py-1 text-xs",
          size === "lg" && "h-12 px-4 py-3 text-base",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }