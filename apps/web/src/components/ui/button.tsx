import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import type * as React from "react"

import { cn } from "#/lib/utils.ts"

const buttonVariants = cva(
  [
    "relative isolate inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg border-0 font-sans text-[11px] font-semibold tracking-[.04em] outline-none",
    "transition-[transform,filter,box-shadow,background-color,color,border-color,opacity] duration-150 ease-[cubic-bezier(.2,.8,.2,1)]",
    "hover:brightness-[1.025] active:scale-[.985] motion-reduce:transform-none motion-reduce:transition-none",
    "focus-visible:ring-[3px] focus-visible:ring-ring/25",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[15px]",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background shadow-[inset_0_0_0_1px_var(--line-hair)] hover:shadow-[inset_0_0_0_1px_var(--line-hair),0_8px_16px_rgba(20,20,20,.10)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,.14)] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,.14),0_8px_16px_rgba(216,60,53,.18)] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "bg-background text-foreground shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-muted",
        secondary:
          "bg-background text-foreground shadow-[inset_0_0_0_1px_var(--line-hair)] hover:bg-muted hover:shadow-[inset_0_0_0_1px_var(--line-hair),0_8px_16px_rgba(20,20,20,.10)]",
        accent:
          "bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,.12)] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,.12),0_8px_16px_rgba(68,87,253,.20)]",
        glass:
          "bg-surface-glass text-foreground shadow-soft backdrop-blur-[18px] hover:bg-surface",
        ghost:
          "bg-transparent text-foreground shadow-none hover:bg-muted",
        yellow:
          "bg-accent text-accent-foreground shadow-[inset_0_0_0_1px_rgba(20,20,20,.84)] hover:shadow-[inset_0_0_0_1px_rgba(20,20,20,.84),0_8px_16px_rgba(20,20,20,.10)]",
        link: "h-auto border-transparent bg-transparent p-0 text-primary shadow-none underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-10 px-4 py-2 has-[>svg]:px-3",
        xs: "min-h-7 gap-1 rounded-md px-2 text-[10px] has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "min-h-8 gap-1.5 rounded-md px-3 text-[10px] has-[>svg]:px-2.5",
        lg: "min-h-[58px] px-6 py-3 has-[>svg]:px-4",
        icon: "size-10 p-0",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 p-0",
        "icon-lg": "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn("cursor-pointer", buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
