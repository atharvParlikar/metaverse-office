import { LabelHTMLAttributes, forwardRef } from "react"
import { cn } from "../../lib/utils"

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  size?: "default" | "sm" | "lg"
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size = "default", ...props }, ref) => {
    return (
      <label
        className={cn(
          "font-press-start select-none",
          "text-[#1A1A1A] [image-rendering:pixelated]",
          size === "default" && "text-sm mb-2",
          size === "sm" && "text-xs mb-1.5",
          size === "lg" && "text-base mb-2.5",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Label.displayName = "Label"

export { Label }