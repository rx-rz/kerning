import { Field, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
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

type NumericCardKey = "width" | "height" | "borderRadius";

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
				: key === "height"
					? Math.min(MAX_CARD_HEIGHT, Math.max(MIN_CARD_DIMENSION, parsedValue))
					: Math.max(0, parsedValue);

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
				<Field className="relative space-y-0">
					<FieldLabel
						className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 capitalize"
						htmlFor="card-background"
					>
						Background
					</FieldLabel>
					<span
						className="pointer-events-none absolute top-1/2 left-29 z-10 size-4 -translate-y-1/2 rounded-sm border"
						style={{ background: card.background }}
					/>
					<Input
						id="card-background"
						className="pr-4 pl-36 text-right font-mono"
						value={card.background}
						onChange={(event) =>
							updateCard(card.id, { background: event.target.value })
						}
					/>
				</Field>
				<NumberField
					id="card-border-radius"
					label="Border Radius"
					min={0}
					value={card.borderRadius}
					onChange={(value) => updateNumericValue("borderRadius", value)}
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
