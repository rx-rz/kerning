import { cn } from "#/lib/utils.ts"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-lg",
        "border border-white/20",
        "bg-white/10",
        "backdrop-blur-xl",
        "shadow-[0_4px_24px_rgba(0,0,0,0.08)]",
        "px-2 text-xs font-medium text-foreground/80",
        "capitalize select-none",
        className
      )}
      {...props}
    />
  )
}
function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
