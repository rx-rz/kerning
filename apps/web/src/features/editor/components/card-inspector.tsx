import { ColorField } from "#/components/ui/color-field";
import { Field, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Slider } from "#/components/ui/slider";
import { ChevronDown } from "lucide-react";
import {
	CardFillInspector,
	CardTextureInspector,
} from "#/features/editor/components/card-fill-inspector";
import { InspectorSection } from "#/features/editor/components/inspector-section";
import {
	MAX_CARD_HEIGHT,
	MAX_CARD_WIDTH,
	MIN_CARD_DIMENSION,
} from "#/features/editor/lib/card-size";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { CardAspectRatio, EditorCard } from "#/features/editor/types";
import { cn } from "#/lib/utils";

const ASPECT_RATIOS: Array<{
	value: CardAspectRatio;
	label: string;
}> = [
	{ value: "1:1", label: "Square · 1:1" },
	{ value: "4:5", label: "Portrait · 4:5" },
	{ value: "16:9", label: "Landscape · 16:9" },
	{ value: "9:16", label: "Story · 9:16" },
	{ value: "3:2", label: "Classic · 3:2" },
	{ value: "business-card", label: "Business Card" },
];

const BORDER_STYLES = ["solid", "dashed", "dotted", "double"] as const;

type CardInspectorProps = {
	card: EditorCard;
};

type NumericCardKey = "width" | "height";

export function CardInspector({ card }: CardInspectorProps) {
	const updateCard = useEditorStore((state) => state.updateCard);
	const updateCardSettings = useEditorStore(
		(state) => state.updateCardSettings,
	);

	function updateNumericValue(key: NumericCardKey, value: string) {
		const parsedValue = Number(value);

		if (!Number.isFinite(parsedValue)) {
			return;
		}

		const nextValue =
			key === "width"
				? Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_DIMENSION, parsedValue))
				: Math.min(MAX_CARD_HEIGHT, Math.max(MIN_CARD_DIMENSION, parsedValue));

		updateCard(card.id, { [key]: nextValue });
	}

	return (
		<div className="space-y-3 px-4 py-5">
			<div className="space-y-2">
				<Field className="relative space-y-0">
					<FieldLabel
						className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 capitalize"
						htmlFor="card-name"
					>
						Card Name
					</FieldLabel>
					<Input
						id="card-name"
						className="pl-28"
						value={card.name}
						onChange={(event) =>
							updateCard(card.id, { name: event.target.value })
						}
					/>
				</Field>
				<Popover>
					<PopoverTrigger asChild>
						<button
							type="button"
							aria-label="Aspect ratio"
							className="flex min-h-12 w-full items-center rounded-lg border border-hairline bg-white px-3 text-xs"
						>
							<span className="font-semibold">Aspect ratio</span>
							<span className="ml-auto text-muted-foreground">
								{
									ASPECT_RATIOS.find(
										({ value }) => value === card.settings.aspectRatio,
									)?.label
								}
							</span>
							<ChevronDown className="ml-2 size-3" />
						</button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-[var(--radix-popover-trigger-width)]">
						<fieldset className="grid grid-cols-2 gap-1.5">
							<legend className="sr-only">Aspect ratio</legend>
							{ASPECT_RATIOS.map((aspectRatio) => (
								<label key={aspectRatio.value} className="cursor-pointer">
									<input
										type="radio"
										name="card-aspect-ratio"
										className="peer sr-only"
										checked={card.settings.aspectRatio === aspectRatio.value}
										onChange={() =>
											updateCardSettings(card.id, {
												aspectRatio: aspectRatio.value,
											})
										}
									/>
									<span className="flex flex-col items-center gap-1 rounded-lg border border-hairline bg-white p-1 text-center text-[10px] font-semibold text-muted-foreground peer-checked:border-2 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-foreground">
										<AspectRatioSwatch value={aspectRatio.value} />
										{aspectRatio.label}
									</span>
								</label>
							))}
						</fieldset>
					</PopoverContent>
				</Popover>
				<NumberField
						id="card-width"
						label="Width"
						min={MIN_CARD_DIMENSION}
						max={MAX_CARD_WIDTH}
						value={card.width}
						onChange={(value) => updateNumericValue("width", value)}
				/>
				<NumberField
						id="card-height"
						label="Height"
						min={MIN_CARD_DIMENSION}
						max={MAX_CARD_HEIGHT}
						value={card.height}
						onChange={(value) => updateNumericValue("height", value)}
				/>
			</div>

			<InspectorSection title="Surface">
					<Slider
						label="Opacity"
						value={[card.settings.opacity]}
						min={0}
						max={1}
						step={0.01}
						showTicks={false}
						snapToDeciles={false}
						onValueChange={([opacity]) => {
							if (opacity !== undefined)
								updateCardSettings(card.id, { opacity });
						}}
					/>
					<Slider
						label="Blur"
						value={[card.settings.blur]}
						min={0}
						max={10}
						step={1}
						showTicks={false}
						snapToDeciles={false}
						onValueChange={([blur]) => {
							if (blur !== undefined) updateCardSettings(card.id, { blur });
						}}
					/>
			</InspectorSection>
			<InspectorSection title="Border">
					<NumberField
						id="card-border-width"
						label="Border Width"
						min={0}
						max={40}
						value={card.settings.borderWidth}
						onChange={(value) => {
							const borderWidth = Number(value);
							if (Number.isFinite(borderWidth)) {
								updateCardSettings(card.id, {
									borderWidth: Math.min(40, Math.max(0, borderWidth)),
								});
							}
						}}
					/>
					<BorderStyleSelect
						value={card.settings.borderStyle}
						onChange={(borderStyle) =>
							updateCardSettings(card.id, { borderStyle })
						}
					/>
					<ColorField
						label="Color"
						ariaLabel="Border color"
						value={card.settings.borderColor}
						onChange={(borderColor) =>
							updateCardSettings(card.id, { borderColor })
						}
					/>
			</InspectorSection>
			<InspectorSection title="Color & fill">
					<CardFillInspector
						fill={card.settings.fill}
						onChange={(fill) => updateCardSettings(card.id, { fill })}
					/>
			</InspectorSection>
			<InspectorSection title="Texture">
					<CardTextureInspector
						texture={card.settings.texture}
						onChange={(texture) => updateCardSettings(card.id, { texture })}
					/>
			</InspectorSection>
		</div>
	);
}

function BorderStyleSelect({
	value,
	onChange,
}: {
	value: (typeof BORDER_STYLES)[number];
	onChange: (value: (typeof BORDER_STYLES)[number]) => void;
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label="Border style"
					className="flex min-h-12 w-full items-center gap-2 rounded-lg border border-hairline bg-white px-3 text-xs"
				>
					<BorderStyleSwatch value={value} />
					<span className="font-semibold">Border style</span>
					<span className="ml-auto capitalize text-muted-foreground">{value}</span>
					<ChevronDown className="size-3" />
				</button>
			</PopoverTrigger>
			<PopoverContent align="end" className="w-[var(--radix-popover-trigger-width)]">
				<fieldset className="grid grid-cols-2 gap-1.5">
					<legend className="sr-only">Border style</legend>
					{BORDER_STYLES.map((style) => (
						<label key={style} className="cursor-pointer">
							<input
								type="radio"
								name="border-style"
								className="peer sr-only"
								checked={value === style}
								onChange={() => onChange(style)}
							/>
							<span className="flex flex-col gap-1 rounded-lg border border-hairline bg-white p-1 text-center text-[10px] font-semibold capitalize text-muted-foreground peer-checked:border-2 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-foreground">
								<BorderStyleSwatch value={style} large />
								{style}
							</span>
						</label>
					))}
				</fieldset>
			</PopoverContent>
		</Popover>
	);
}

function BorderStyleSwatch({
	value,
	large = false,
}: {
	value: (typeof BORDER_STYLES)[number];
	large?: boolean;
}) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"flex shrink-0 items-center rounded-md border border-hairline bg-white px-2",
				large ? "mx-auto size-12" : "size-7",
			)}
		>
			<span
				className="w-full border-t-2 border-foreground"
				style={{ borderTopStyle: value }}
			/>
		</span>
	);
}

function AspectRatioSwatch({ value }: { value: CardAspectRatio }) {
	const dimensions: Record<CardAspectRatio, string> = {
		"1:1": "h-9 w-9",
		"4:5": "h-10 w-8",
		"16:9": "h-7 w-11",
		"9:16": "h-11 w-7",
		"3:2": "h-8 w-11",
		"business-card": "h-7 w-11",
	};

	return (
		<span className="flex size-12 items-center justify-center" aria-hidden="true">
			<span className={cn("rounded border-2 border-foreground/70 bg-primary/5", dimensions[value])} />
		</span>
	);
}

function NumberField({
	id,
	label,
	value,
	min,
	max,
	onChange,
	className,
}: {
	id: string;
	label: string;
	value: number;
	min?: number;
	max?: number;
	onChange: (value: string) => void;
	className?: string;
}) {
	return (
		<Field className="relative space-y-0">
			<FieldLabel
				className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 capitalize"
				htmlFor={id}
			>
				{label}
			</FieldLabel>
			<Input
				id={id}
				type="number"
				min={min}
				max={max}
				className={cn("pr-4 pl-16 text-right", className)}
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
		</Field>
	);
}
