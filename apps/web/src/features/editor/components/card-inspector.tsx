import { ColorField } from "#/components/ui/color-field";
import { Field, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Slider } from "#/components/ui/slider";
import {
	CardFillInspector,
	CardTextureInspector,
} from "#/features/editor/components/card-fill-inspector";
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
		<div className="divide-y divide-border pt-6">
			<InspectorSection title="">
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
			</InspectorSection>

			<InspectorSection title="Settings">
				<Field className="space-y-0">
					<Select
						value={card.settings.aspectRatio}
						onValueChange={(aspectRatio: CardAspectRatio) =>
							updateCardSettings(card.id, { aspectRatio })
						}
					>
						<SelectTrigger id="card-aspect-ratio" className="w-full gap-4">
							<FieldLabel
								className="pointer-events-none mr-auto shrink-0 capitalize"
								htmlFor="card-aspect-ratio"
							>
								Aspect Ratio
							</FieldLabel>
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="end">
							{ASPECT_RATIOS.map((aspectRatio) => (
								<SelectItem key={aspectRatio.value} value={aspectRatio.value}>
									{aspectRatio.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
			</InspectorSection>

			<InspectorSection title="Size">
				<div className="grid grid-cols-2 gap-2">
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
			</InspectorSection>

			<InspectorSection title="Appearance">
				<Slider
					label="Opacity"
					value={[card.settings.opacity]}
					min={0}
					max={1}
					step={0.01}
					showTicks={false}
					snapToDeciles={false}
					onValueChange={([opacity]) => {
						if (opacity !== undefined) updateCardSettings(card.id, { opacity });
					}}
				/>
				<Slider
					label="Blur"
					value={[card.settings.blur]}
					min={0}
					max={40}
					step={1}
					showTicks={false}
					snapToDeciles={false}
					onValueChange={([blur]) => {
						if (blur !== undefined) updateCardSettings(card.id, { blur });
					}}
				/>
				<div className="space-y-3 rounded-lg border border-border p-3">
					<h4 className="text-xs font-semibold">Border</h4>
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
					<Field className="space-y-0">
						<Select
							value={card.settings.borderStyle}
							onValueChange={(borderStyle) =>
								updateCardSettings(card.id, {
									borderStyle: borderStyle as typeof card.settings.borderStyle,
								})
							}
						>
							<SelectTrigger id="card-border-style" className="w-full">
								<FieldLabel
									className="pointer-events-none mr-auto"
									htmlFor="card-border-style"
								>
									Style
								</FieldLabel>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end">
								{["solid", "dashed", "dotted", "double"].map((style) => (
									<SelectItem key={style} value={style}>
										{style}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
					<ColorField
						label="Color"
						ariaLabel="Border color"
						value={card.settings.borderColor}
						onChange={(borderColor) =>
							updateCardSettings(card.id, { borderColor })
						}
					/>
				</div>
				<CardFillInspector
					fill={card.settings.fill}
					onChange={(fill) => updateCardSettings(card.id, { fill })}
				/>
				<CardTextureInspector
					texture={card.settings.texture}
					onChange={(texture) => updateCardSettings(card.id, { texture })}
				/>
			</InspectorSection>
		</div>
	);
}

function InspectorSection({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-3 px-5 py-4">
			{title ? (
				<h3 className="font-mono text-[10px] font-semibold capitalize tracking-[0.08em] text-muted-foreground">
					{title}
				</h3>
			) : null}
			{children}
		</section>
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
