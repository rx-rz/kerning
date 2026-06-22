import type * as React from "react"

import { cn } from "#/lib/utils.ts"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        [
          "h-[41px] w-full min-w-0 rounded-md border border-hairline",
          "bg-component-inset px-3 py-2 text-sm text-foreground",
          "shadow-[rgba(0,0,0,.05)_0_1px_0_inset,rgba(255,255,255,.48)_0_1px_0]",
          "outline-none transition-[border-color,box-shadow,background-color,color] duration-150 ease-[var(--ease)]",

          "placeholder:text-muted-foreground/50",
          "selection:bg-primary selection:text-primary-foreground",

          "file:inline-flex file:h-7 file:border-0 file:bg-transparent",
          "file:text-sm file:font-medium file:text-foreground",

          "hover:bg-paper",
          "focus-visible:border-primary",
          "focus-visible:ring-[3px] focus-visible:ring-primary/20",

          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",

          "aria-invalid:border-destructive",
          "aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",

          "dark:bg-component-inset",
          "dark:shadow-[rgba(0,0,0,.35)_0_1px_0_inset,rgba(255,255,255,.08)_0_1px_0]",
          "dark:hover:bg-component",
        ],
        className
      )}
      {...props}
    />
  )
}

export { Input }
