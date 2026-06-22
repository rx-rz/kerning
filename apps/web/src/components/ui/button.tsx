import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import type * as React from "react"

import { cn } from "#/lib/utils.ts"

const buttonVariants = cva(
  [
    "relative isolate inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md border text-sm font-medium outline-none transition-[transform,filter,box-shadow,background-color,color,border-color] duration-150 ease-[var(--ease)]",
    "active:translate-y-px active:scale-[.99]",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default:
          "border-white/30 bg-[linear-gradient(180deg,var(--accent-hover),var(--accent))] text-primary-foreground shadow-[rgba(255,255,255,.32)_0_1px_0_inset,rgba(0,0,0,.18)_0_-1px_2px_inset,rgba(182,176,255,.38)_0_10px_22px] hover:brightness-105",
        destructive:
          "border-white/20 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--danger)_92%,white_8%),var(--danger))] text-white shadow-[rgba(255,255,255,.22)_0_1px_0_inset,rgba(0,0,0,.18)_0_-1px_2px_inset,rgba(232,90,79,.28)_0_10px_22px] hover:brightness-105 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-hairline bg-surface text-foreground shadow-small hover:bg-paper-soft",
        secondary:
          "border-[#383838] bg-[linear-gradient(rgba(32,32,32,.10),rgba(32,32,32,.10)),linear-gradient(180deg,#4f4f4f,rgba(32,32,32,.85))] text-white shadow-dark-btn hover:brightness-110",
        accent:
          "border-white/30 bg-[linear-gradient(180deg,var(--accent-hover),var(--accent))] text-primary-foreground shadow-[rgba(255,255,255,.32)_0_1px_0_inset,rgba(0,0,0,.18)_0_-1px_2px_inset,rgba(182,176,255,.38)_0_10px_22px] hover:brightness-105",
        glass:
          "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.08))] text-white shadow-[rgba(0,0,0,.12)_0_-1px_0_inset,rgba(0,0,0,.1)_0_-1px_2px_inset,rgba(255,255,255,.24)_0_1px_1px_inset] backdrop-blur-md hover:brightness-110",
        ghost:
          "border-hairline bg-component text-secondary-foreground shadow-small hover:bg-component-deep",
        link: "h-auto border-transparent bg-transparent p-0 text-primary shadow-none underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[41px] px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 gap-1 rounded px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-11 px-6 has-[>svg]:px-4",
        icon: "size-[41px] p-0",
        "icon-xs": "size-7 rounded [&_svg:not([class*='size-'])]:size-3",
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
