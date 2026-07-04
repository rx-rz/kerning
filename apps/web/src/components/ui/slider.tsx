import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "#/lib/utils.ts";

const SNAP_DURATION_MS = 360;
const TICK_VALUES = Array.from({ length: 9 }, (_, index) => (index + 1) * 10);

type SliderProps = Omit<
	React.ComponentProps<typeof SliderPrimitive.Root>,
	"defaultValue" | "onValueChange" | "value"
> & {
	/** A visible label inside the control. Also used as the accessible name. */
	label?: React.ReactNode;
	value?: number[];
	defaultValue?: number[];
	onValueChange?: (value: number[]) => void;
	/** Formats the visible value without changing the slider's numeric value. */
	formatValue?: (value: number) => React.ReactNode;
	/** Show proportional markers while the control is active. */
	showTicks?: boolean;
	/** Assist imprecise clicks by settling single-value sliders on the nearest decile. */
	snapToDeciles?: boolean;
	/** Allow the visible value to be clicked and entered precisely. */
	editableValue?: boolean;
};

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

function Slider({
	className,
	defaultValue,
	value,
	min = 0,
	max = 100,
	step = 1,
	label,
	formatValue = (currentValue) => currentValue,
	showTicks = true,
	snapToDeciles = true,
	editableValue = true,
	orientation = "horizontal",
	disabled,
	"aria-label": ariaLabel,
	onValueChange,
	onPointerDown,
	onPointerUp,
	...props
}: SliderProps) {
	const [uncontrolledValue, setUncontrolledValue] = React.useState<number[]>(
		() => defaultValue ?? [min],
	);
	const [isEditing, setIsEditing] = React.useState(false);
	const [isSnapping, setIsSnapping] = React.useState(false);
	const pointerStart = React.useRef<{ x: number; y: number } | null>(null);
	const snapTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

	const values = value ?? uncontrolledValue;
	const primaryValue = values[0] ?? min;
	const canEdit = editableValue && values.length === 1 && !disabled;
	const canSnap =
		snapToDeciles &&
		orientation === "horizontal" &&
		values.length === 1 &&
		max > min &&
		!disabled;

	const updateValue = React.useCallback(
		(nextValue: number[]) => {
			if (value === undefined) {
				setUncontrolledValue(nextValue);
			}
			onValueChange?.(nextValue);
		},
		[onValueChange, value],
	);

	React.useEffect(() => {
		return () => {
			if (snapTimer.current) clearTimeout(snapTimer.current);
		};
	}, []);

	function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
		pointerStart.current = { x: event.clientX, y: event.clientY };
		onPointerDown?.(event);
	}

	function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
		onPointerUp?.(event);

		const start = pointerStart.current;
		pointerStart.current = null;
		if (!start || !canSnap || event.defaultPrevented) return;

		const travel = Math.hypot(event.clientX - start.x, event.clientY - start.y);
		if (travel > 4) return;

		const bounds = event.currentTarget.getBoundingClientRect();
		const ratio = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
		const decile = Math.round(ratio * 10) / 10;
		const snappedValue = min + decile * (max - min);
		const steppedValue = min + Math.round((snappedValue - min) / step) * step;

		setIsSnapping(true);
		updateValue([clamp(steppedValue, min, max)]);
		if (snapTimer.current) clearTimeout(snapTimer.current);
		snapTimer.current = setTimeout(
			() => setIsSnapping(false),
			SNAP_DURATION_MS,
		);
	}

	function commitTypedValue(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const nextValue = Number(form.get("slider-value"));

		if (Number.isFinite(nextValue)) {
			updateValue([clamp(nextValue, min, max)]);
		}
		setIsEditing(false);
	}

	return (
		<div
			data-slot="slider-control"
			data-disabled={disabled ? "true" : undefined}
			data-orientation={orientation}
			data-snapping={isSnapping ? "true" : undefined}
			className="group/slider relative w-full rounded-lg"
		>
			<SliderPrimitive.Root
				data-slot="slider"
				value={values}
				min={min}
				max={max}
				step={step}
				orientation={orientation}
				disabled={disabled}
				aria-label={
					ariaLabel ?? (typeof label === "string" ? label : undefined)
				}
				className={cn(
					[
						"relative flex h-12 min-h-12 w-full touch-none items-center overflow-hidden rounded-lg select-none",
						"bg-white shadow-[inset_0_0_0_1px_var(--line-hair)] outline-none",
						"transition-[filter,box-shadow,transform] duration-200 ease-out",
						"hover:brightness-[1.025] focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_20%,transparent),inset_0_0_0_1px_var(--ring)]",
						"data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
						"data-[orientation=vertical]:h-44 data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-14 data-[orientation=vertical]:flex-col",
					],
					className,
				)}
				onValueChange={updateValue}
				onPointerDown={handlePointerDown}
				onPointerUp={handlePointerUp}
				{...props}
			>
				<SliderPrimitive.Track
					data-slot="slider-track"
					className="relative h-full w-full grow overflow-hidden rounded-[inherit] bg-white data-[orientation=vertical]:h-full data-[orientation=vertical]:w-full"
				>
					<SliderPrimitive.Range
						data-slot="slider-range"
						className={cn(
							"absolute h-full bg-primary/15 data-[orientation=vertical]:w-full",
							"group-data-[snapping=true]/slider:transition-[width,height] group-data-[snapping=true]/slider:duration-350 group-data-[snapping=true]/slider:ease-[cubic-bezier(.2,.8,.2,1)]",
						)}
					/>

					{showTicks ? (
						<span
							data-slot="slider-ticks"
							aria-hidden="true"
							className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover/slider:opacity-100 group-focus-within/slider:opacity-100 group-data-[orientation=vertical]/slider:hidden"
						>
							{TICK_VALUES.map((tick) => (
								<i
									key={tick}
									className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-foreground/15"
									style={{ left: `${tick}%` }}
								/>
							))}
						</span>
					) : null}
				</SliderPrimitive.Track>

				{values.map((_, index) => (
					<SliderPrimitive.Thumb
						data-slot="slider-thumb"
						// biome-ignore lint/suspicious/noArrayIndexKey: Radix thumbs are positional controls without stable domain IDs.
						key={index}
						aria-label={
							values.length > 1
								? `${typeof label === "string" ? label : "Slider"} value ${index + 1}`
								: (ariaLabel ?? (typeof label === "string" ? label : undefined))
						}
						className={cn([
							"block h-7 w-1 shrink-0 rounded-full bg-foreground/65 opacity-0 shadow-[0_0_0_1px_rgba(255,255,255,.2)] outline-none",
							"scale-x-0 transition-[opacity,transform,box-shadow] duration-200 ease-[cubic-bezier(.2,.8,.2,1)]",
							"group-hover/slider:scale-x-100 group-hover/slider:opacity-100 group-focus-within/slider:scale-x-100 group-focus-within/slider:opacity-100",
							"focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_28%,transparent)]",
							"group-data-[snapping=true]/slider:transition-transform group-data-[snapping=true]/slider:duration-350",
						])}
					/>
				))}
			</SliderPrimitive.Root>

			{label || values.length === 1 ? (
				<div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between gap-4 px-4 text-sm font-semibold text-foreground group-data-[orientation=vertical]/slider:hidden">
					<span className="min-w-0 truncate">{label}</span>

					{values.length === 1 ? (
						isEditing ? (
							<form
								className="pointer-events-auto"
								onSubmit={commitTypedValue}
								onBlur={(event) => {
									if (!event.currentTarget.contains(event.relatedTarget)) {
										setIsEditing(false);
									}
								}}
							>
								<input
									// biome-ignore lint/a11y/noAutofocus: Editing is explicitly initiated by the user.
									autoFocus
									name="slider-value"
									type="number"
									min={min}
									max={max}
									step={step}
									defaultValue={primaryValue}
									aria-label={`Set ${typeof label === "string" ? label : "slider"} value`}
									className="h-7 w-14 rounded-md border-0 bg-foreground/5 px-1.5 text-right font-mono text-xs font-semibold tabular-nums outline-none transition-colors hover:bg-foreground/8 focus:bg-foreground/10"
								/>
							</form>
						) : canEdit ? (
							<button
								type="button"
								className={cn(
									"pointer-events-auto -mr-1 min-h-7 rounded-md px-1.5 font-mono text-xs font-semibold tabular-nums outline-none transition-colors",
									"cursor-text hover:bg-foreground/5 focus-visible:bg-foreground/8",
								)}
								onPointerDown={(event) => event.stopPropagation()}
								onClick={() => setIsEditing(true)}
								aria-label="Edit slider value"
							>
								{formatValue(primaryValue)}
							</button>
						) : (
							<span className="-mr-2 px-2 font-mono text-xs font-semibold tabular-nums">
								{formatValue(primaryValue)}
							</span>
						)
					) : null}
				</div>
			) : null}
		</div>
	);
}

export { Slider };
export type { SliderProps };
