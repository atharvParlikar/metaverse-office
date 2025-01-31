import { cn } from "../../lib/utils";

export function VerticalSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-3 h-full w-px bg-border", // Base styles
        "dark:bg-border-dark", // Dark mode
        className,
      )}
      {...props}
    />
  );
}
