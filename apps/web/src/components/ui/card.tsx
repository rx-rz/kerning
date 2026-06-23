import type * as React from "react"

import { cn } from "#/lib/utils.ts"

type CardVariant = "default" | "hairline" | "frosted" | "checkered"

function Card({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: CardVariant
}) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(
        [
          "flex flex-col gap-5 overflow-hidden rounded-lg  text-card-foreground",
          variant === "default" && "bg-surface-paper shadow-card",
          variant === "hairline" && "bg-surface-paper shadow-hairline",
          variant === "frosted" &&
          "bg-surface-glass shadow-floating backdrop-blur-xl",
          variant === "checkered" && "check-card shadow-hairline",
        ],
        className
      )}
      {...props}
    />
  )
}

function CardHead({
  className,
  variant = "glass",
  title,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "glass" | "black" | "solid"
  title?: React.ReactNode
}) {
  return (
    <div
      data-slot="card-head"
      data-variant={variant}
      className={cn(
        [
          "grid h-11 grid-cols-[80px_1fr_80px] items-center px-3",
          "shadow-[inset_0_-1px_0_var(--line-hair)]",
          variant === "glass" && "bg-surface-glass backdrop-blur-xl",
          variant === "black" && "bg-foreground text-background",
          variant === "solid" && "bg-surface-head",
        ],
        className
      )}
      {...props}
    >
      <div className="flex gap-1.5">
        <i className="size-2 rounded-full bg-current opacity-30" />
        <i className="size-2 rounded-full bg-current opacity-30" />
        <i className="size-2 rounded-full bg-current opacity-30" />
      </div>

      {title ? (
        <div className="mono-label justify-self-center">
          {title}
        </div>
      ) : null}

      <div className="justify-self-end">
        <i className="block size-2 rounded-full bg-current opacity-30" />
      </div>
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        [
          "@container/card-header grid auto-rows-min grid-rows-[auto_auto]",
          "items-start gap-2 px-5",
          "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
          "[.border-b]:border-hairline [.border-b]:pb-5",
        ],
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-base font-black leading-none tracking-normal", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-xs font-semibold leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-5 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        [
          "flex items-center px-5",
          "[.border-t]:border-hairline [.border-t]:pt-5",
        ],
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHead,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}