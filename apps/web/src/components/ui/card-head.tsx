import * as React from "react"

import { cn } from "#/lib/utils.ts"

export type CardHeadProps = React.ComponentProps<"div"> & {
    title?: React.ReactNode
    variant?: "glass" | "solid" | "black"
    leading?: React.ReactNode
    trailing?: React.ReactNode
}

function CardHead({
    title,
    variant = "glass",
    leading,
    trailing,
    className,
    ...props
}: CardHeadProps) {
    return (
        <div
            data-slot="card-head"
            data-variant={variant}
            className={cn(
                [
                    "grid h-11 items-center px-3 rounded-none" ,
                    "grid-cols-[80px_1fr_80px]",
                    "shadow-[inset_0_-1px_0_var(--line-hair)]",

                    variant === "glass" &&
                    "bg-surface-glass backdrop-blur-xl",

                    variant === "solid" &&
                    "bg-surface-head",

                    variant === "black" &&
                    "bg-foreground text-background",
                ],
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-1.5 rounded-none">
                {leading ?? (
                    <>
                        <span className="size-2 rounded-full bg-current opacity-30" />
                        <span className="size-2 rounded-full bg-current opacity-30" />
                        <span className="size-2 rounded-full bg-current opacity-30" />
                    </>
                )}
            </div>

            <div className="mono-label text-center">
                {title}
            </div>

            <div className="flex justify-end">
                {trailing ?? (
                    <span className="size-2 rounded-full bg-current opacity-30" />
                )}
            </div>
        </div>
    )
}

function GlassCardHead(
    props: Omit<CardHeadProps, "variant">
) {
    return <CardHead variant="glass" {...props} />
}

function SolidCardHead(
    props: Omit<CardHeadProps, "variant">
) {
    return <CardHead variant="solid" {...props} />
}

function BlackCardHead(
    props: Omit<CardHeadProps, "variant">
) {
    return <CardHead variant="black" {...props} />
}

export {
    CardHead,
    GlassCardHead,
    SolidCardHead,
    BlackCardHead,
}
