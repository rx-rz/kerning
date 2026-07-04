import type * as React from "react";

import { cn } from "#/lib/utils.ts";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				[
					"min-h-12 w-full min-w-0 rounded-lg border-0",
					"bg-white px-4 py-3 text-xs font-semibold tracking-[.05em] text-foreground",
					"shadow-[inset_0_0_0_1px_var(--line-hair)]",
					"outline-none transition-[box-shadow,background-color,color,filter] duration-150 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none",

					"placeholder:font-mono placeholder:text-muted-foreground/60",
					"selection:bg-primary selection:text-primary-foreground",

					"file:inline-flex file:h-7 file:border-0 file:bg-transparent",
					"file:font-mono file:text-xs file:font-semibold file:tracking-[.04em] file:text-foreground",

					"focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_18%,transparent),inset_0_0_0_1px_var(--ring)]",
					"[&:is([type=number])]:font-mono [&:is([type=number])]:tabular-nums",

					"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",

					"aria-invalid:shadow-[0_0_0_3px_color-mix(in_srgb,var(--destructive)_18%,transparent),inset_0_0_0_1px_var(--destructive)]",
				],
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
