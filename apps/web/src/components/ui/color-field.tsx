import { useEffect, useId, useState } from "react";

import { Field, FieldLabel } from "#/components/ui/field";
import { cn } from "#/lib/utils";

const HEX_COLOR_PATTERN = /^#?[0-9a-f]{6}$/i;

export function ColorField({
	label,
	ariaLabel = label,
	pickerAriaLabel = `${ariaLabel} color picker`,
	hideLabel = false,
	value,
	onChange,
	className,
}: {
	label: string;
	ariaLabel?: string;
	pickerAriaLabel?: string;
	hideLabel?: boolean;
	value: string;
	onChange: (value: string) => void;
	className?: string;
}) {
	const id = useId();
	const [draft, setDraft] = useState(value);
	const normalizedValue = normalizeHexColor(value) ?? "#000000";
	const isDraftValid = normalizeHexColor(draft) !== null;

	useEffect(() => setDraft(value), [value]);

	return (
		<Field className={cn("space-y-0", className)}>
			<div className="flex min-h-12 items-center justify-between gap-3 rounded-lg bg-white px-4 shadow-[inset_0_0_0_1px_var(--line-hair)] transition-shadow focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_22%,transparent),inset_0_0_0_1px_var(--ring)]">
				<FieldLabel
					htmlFor={id}
					className={hideLabel ? "sr-only" : "shrink-0 text-muted-foreground"}
				>
					{label}
				</FieldLabel>
				<div className="flex min-w-0 items-center gap-2">
					<label htmlFor={`${id}-picker`} className="sr-only">
						{pickerAriaLabel}
					</label>
					<span
						className="relative size-6 shrink-0 cursor-pointer overflow-hidden rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,.28)]"
						style={{ backgroundColor: normalizedValue }}
					>
						<input
							id={`${id}-picker`}
							type="color"
							aria-label={pickerAriaLabel}
							className="absolute inset-0 size-full cursor-pointer opacity-0"
							value={normalizedValue}
							onChange={(event) => onChange(event.target.value.toUpperCase())}
						/>
					</span>
					<input
						id={id}
						aria-label={`${ariaLabel} hex code`}
						aria-invalid={!isDraftValid}
						className="w-[9ch] shrink-0 bg-transparent text-right font-mono text-xs font-semibold tracking-[.03em] outline-none"
						inputMode="text"
						maxLength={7}
						spellCheck={false}
						value={draft}
						onChange={(event) => {
							const next = event.target.value;
							setDraft(next);
							const color = normalizeHexColor(next);
							if (color) onChange(color);
						}}
						onBlur={() => {
							if (!isDraftValid) setDraft(value);
						}}
					/>
				</div>
			</div>
		</Field>
	);
}

function normalizeHexColor(value: string) {
	const trimmedValue = value.trim();
	if (!HEX_COLOR_PATTERN.test(trimmedValue)) return null;
	return `#${trimmedValue.replace(/^#/, "").toUpperCase()}`;
}
