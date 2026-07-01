import { createId } from "@paralleldrive/cuid2";
import { ChevronDown, Plus, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Button } from "#/components/ui/button";
import { ColorField } from "#/components/ui/color-field";
import { FieldLabel } from "#/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Slider } from "#/components/ui/slider";
import { deleteEditorImage, replaceEditorImage } from "#/db/image-db";
import {
	createDefaultFill,
	createDefaultTextureFill,
} from "#/features/editor/lib/card-fill";
import type {
	CardFill,
	GradientStop,
	ImageCardFill,
	TextureCardFill,
} from "#/features/editor/types";

const FILL_TYPES: Array<{ value: CardFill["type"]; label: string }> = [
	{ value: "solid", label: "Solid" },
	{ value: "linear-gradient", label: "Linear" },
	{ value: "radial-gradient", label: "Radial" },
	{ value: "image", label: "Image" },
];

const TEXTURES: Array<{ value: TextureCardFill["texture"]; label: string }> = [
	{ value: "paper", label: "Paper" },
	{ value: "fluted-glass", label: "Glass" },
	{ value: "halftone", label: "Dots" },
	{ value: "halftone-cmyk", label: "CMYK" },
];

type TextureChoice = TextureCardFill["texture"] | "none";

export function CardFillInspector({
	fill,
	onChange,
}: {
	fill: CardFill;
	onChange: (fill: CardFill) => void;
}) {
	return (
		<div className="space-y-3">
			<ChoiceGroup<CardFill["type"]>
				label="Fill"
				value={fill.type}
				options={FILL_TYPES}
				onChange={(type) => {
					if (type === fill.type) return;
					if (fill.type === "image" && fill.imageId) {
						void deleteEditorImage(fill.imageId);
					}
					onChange(createDefaultFill(type));
				}}
			/>

			{fill.type === "solid" ? (
				<ColorField
					label="Card fill"
					value={fill.color}
					onChange={(color) => onChange({ ...fill, color })}
				/>
			) : fill.type === "image" ? (
				<div className="space-y-3">
					<RangeField
						label="Opacity"
						value={fill.opacity}
						onChange={(opacity) => onChange({ ...fill, opacity })}
					/>
					<ImageFillSettings fill={fill} onChange={onChange} />
				</div>
			) : (
				<GradientInspector fill={fill} onChange={onChange} />
			)}
		</div>
	);
}

function GradientInspector({
	fill,
	onChange,
}: {
	fill: Extract<CardFill, { type: "linear-gradient" | "radial-gradient" }>;
	onChange: (fill: CardFill) => void;
}) {
	function updateStop(id: string, patch: Partial<GradientStop>) {
		onChange({
			...fill,
			stops: fill.stops.map((stop) =>
				stop.id === id ? { ...stop, ...patch } : stop,
			),
		});
	}

	return (
		<div className="space-y-3">
			{fill.type === "linear-gradient" ? (
				<RangeField
					label="Angle"
					value={fill.angle}
					min={0}
					max={360}
					onChange={(angle) => onChange({ ...fill, angle })}
				/>
			) : (
				<div className="grid grid-cols-2 gap-2">
					<RangeField
						label="Center X"
						value={fill.centerX}
						min={0}
						max={100}
						onChange={(centerX) => onChange({ ...fill, centerX })}
					/>
					<RangeField
						label="Center Y"
						value={fill.centerY}
						min={0}
						max={100}
						onChange={(centerY) => onChange({ ...fill, centerY })}
					/>
				</div>
			)}

			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<FieldLabel>Color stops</FieldLabel>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Add gradient stop"
						onClick={() =>
							onChange({
								...fill,
								stops: [
									...fill.stops,
									{ id: createId(), color: "#888888", position: 50 },
								],
							})
						}
					>
						<Plus />
					</Button>
				</div>
				{fill.stops.map((stop, index) => (
					<div key={stop.id} className="rounded-lg border border-border p-2">
						<div className="flex items-center gap-2">
							<ColorField
								label={`Stop ${index + 1}`}
								value={stop.color}
								onChange={(color) => updateStop(stop.id, { color })}
							/>
							{fill.stops.length > 2 ? (
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									aria-label={`Delete gradient stop ${index + 1}`}
									onClick={() =>
										onChange({
											...fill,
											stops: fill.stops.filter(({ id }) => id !== stop.id),
										})
									}
								>
									<Trash2 />
								</Button>
							) : null}
						</div>
						<RangeField
							label="Position"
							value={stop.position}
							min={0}
							max={100}
							onChange={(position) => updateStop(stop.id, { position })}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

export function CardTextureInspector({
	texture,
	onChange,
}: {
	texture: TextureCardFill | null;
	onChange: (texture: TextureCardFill | null) => void;
}) {
	const [areSettingsOpen, setAreSettingsOpen] = useState(true);
	const selectedTexture = texture?.texture ?? "none";

	return (
		<div className="space-y-3">
			<ChoiceGroup<TextureChoice>
				label="Texture"
				value={selectedTexture}
				options={[{ value: "none", label: "None" }, ...TEXTURES]}
				onChange={(nextTexture) =>
					onChange(
						nextTexture === "none"
							? null
							: createDefaultTextureFill(
									nextTexture as TextureCardFill["texture"],
								),
					)
				}
			/>

			{texture ? (
				<details
					className="group rounded-lg border border-border"
					open={areSettingsOpen}
					onToggle={(event) => setAreSettingsOpen(event.currentTarget.open)}
				>
					<summary className="flex cursor-pointer list-none items-center justify-between px-3 py-3 text-xs font-semibold">
						Texture settings
						<ChevronDown className="size-4 transition-transform group-open:rotate-180" />
					</summary>
					<div className="space-y-3 border-t border-border p-3">
						<RangeField
							label="Opacity"
							value={texture.opacity}
							onChange={(opacity) => onChange({ ...texture, opacity })}
						/>
						<TextureSettings fill={texture} onChange={onChange} />
					</div>
				</details>
			) : null}
		</div>
	);
}

function ImageFillSettings({
	fill,
	onChange,
}: {
	fill: ImageCardFill;
	onChange: (fill: ImageCardFill) => void;
}) {
	const imageInputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);

	async function uploadImage(file: File) {
		setIsUploading(true);
		try {
			const imageId = await replaceEditorImage(file, fill.imageId);
			onChange({ ...fill, imageId });
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<>
			<Button
				type="button"
				variant="outline"
				className="w-full"
				disabled={isUploading}
				onClick={() => imageInputRef.current?.click()}
			>
				<Upload />
				{isUploading
					? "Uploading…"
					: fill.imageId
						? "Replace image"
						: "Upload image"}
			</Button>
			<input
				ref={imageInputRef}
				type="file"
				accept="image/*"
				aria-label="Upload image fill"
				className="sr-only"
				disabled={isUploading}
				onChange={(event) => {
					const file = event.target.files?.[0];
					if (file) void uploadImage(file);
					event.target.value = "";
				}}
			/>
			<OptionField
				label="Background size"
				value={fill.settings.backgroundSize}
				options={["cover", "contain", "auto"]}
				onChange={(backgroundSize) =>
					onChange({
						...fill,
						settings: {
							...fill.settings,
							backgroundSize:
								backgroundSize as ImageCardFill["settings"]["backgroundSize"],
						},
					})
				}
			/>
			<div className="grid grid-cols-2 gap-2">
				<RangeField
					label="Origin X"
					value={fill.settings.originX}
					min={0}
					max={100}
					step={1}
					onChange={(originX) =>
						onChange({
							...fill,
							settings: { ...fill.settings, originX },
						})
					}
				/>
				<RangeField
					label="Origin Y"
					value={fill.settings.originY}
					min={0}
					max={100}
					step={1}
					onChange={(originY) =>
						onChange({
							...fill,
							settings: { ...fill.settings, originY },
						})
					}
				/>
			</div>
		</>
	);
}

function TextureSettings({
	fill,
	onChange,
}: {
	fill: TextureCardFill;
	onChange: (fill: TextureCardFill) => void;
}) {
	if (fill.texture === "paper") {
		const update = (patch: Partial<typeof fill.settings>) =>
			onChange({ ...fill, settings: { ...fill.settings, ...patch } });
		return (
			<>
				<ColorPair
					fill={fill}
					labels={["Fiber", "Paper"]}
					keys={["colorFront", "colorBack"]}
					onChange={update}
				/>
				<RangeField
					label="Contrast"
					value={fill.settings.contrast}
					onChange={(contrast) => update({ contrast })}
				/>
				<RangeField
					label="Roughness"
					value={fill.settings.roughness}
					onChange={(roughness) => update({ roughness })}
				/>
				<RangeField
					label="Fiber"
					value={fill.settings.fiber}
					onChange={(fiber) => update({ fiber })}
				/>
				<RangeField
					label="Crumples"
					value={fill.settings.crumples}
					onChange={(crumples) => update({ crumples })}
				/>
				<RangeField
					label="Folds"
					value={fill.settings.folds}
					onChange={(folds) => update({ folds })}
				/>
				<RangeField
					label="Seed"
					value={fill.settings.seed}
					min={0}
					max={1000}
					step={0.1}
					onChange={(seed) => update({ seed })}
				/>
			</>
		);
	}

	if (fill.texture === "fluted-glass") {
		const update = (patch: Partial<typeof fill.settings>) =>
			onChange({ ...fill, settings: { ...fill.settings, ...patch } });
		return (
			<>
				<ColorField
					label="Background"
					value={fill.settings.colorBack}
					onChange={(colorBack) => update({ colorBack })}
				/>
				<ColorPair
					fill={fill}
					labels={["Shadow", "Highlight"]}
					keys={["colorShadow", "colorHighlight"]}
					onChange={update}
				/>
				<RangeField
					label="Flute size"
					value={fill.settings.size}
					onChange={(size) => update({ size })}
				/>
				<RangeField
					label="Angle"
					value={fill.settings.angle}
					min={0}
					max={180}
					onChange={(angle) => update({ angle })}
				/>
				<RangeField
					label="Distortion"
					value={fill.settings.distortion}
					onChange={(distortion) => update({ distortion })}
				/>
				<RangeField
					label="Blur"
					value={fill.settings.blur}
					onChange={(blur) => update({ blur })}
				/>
				<RangeField
					label="Highlights"
					value={fill.settings.highlights}
					onChange={(highlights) => update({ highlights })}
				/>
			</>
		);
	}

	if (fill.texture === "halftone") {
		const update = (patch: Partial<typeof fill.settings>) =>
			onChange({ ...fill, settings: { ...fill.settings, ...patch } });
		return (
			<>
				<ColorPair
					fill={fill}
					labels={["Paper", "Ink"]}
					keys={["colorBack", "colorFront"]}
					onChange={update}
				/>
				<OptionField
					label="Grid"
					value={fill.settings.grid}
					options={["square", "hex"]}
					onChange={(grid) =>
						update({ grid: grid as typeof fill.settings.grid })
					}
				/>
				<OptionField
					label="Dots"
					value={fill.settings.dotType}
					options={["classic", "gooey", "holes", "soft"]}
					onChange={(dotType) =>
						update({ dotType: dotType as typeof fill.settings.dotType })
					}
				/>
				<RangeField
					label="Size"
					value={fill.settings.size}
					onChange={(size) => update({ size })}
				/>
				<RangeField
					label="Radius"
					value={fill.settings.radius}
					min={0}
					max={2}
					step={0.01}
					onChange={(radius) => update({ radius })}
				/>
				<RangeField
					label="Contrast"
					value={fill.settings.contrast}
					onChange={(contrast) => update({ contrast })}
				/>
				<RangeField
					label="Grain"
					value={fill.settings.grain}
					onChange={(grain) => update({ grain })}
				/>
				<ToggleField
					label="Invert"
					checked={fill.settings.inverted}
					onChange={(inverted) => update({ inverted })}
				/>
			</>
		);
	}

	const update = (patch: Partial<typeof fill.settings>) =>
		onChange({ ...fill, settings: { ...fill.settings, ...patch } });
	return (
		<>
			<ColorField
				label="Paper"
				value={fill.settings.colorBack}
				onChange={(colorBack) => update({ colorBack })}
			/>
			<div className="grid grid-cols-2 gap-2">
				{(["colorC", "colorM", "colorY", "colorK"] as const).map((key) => (
					<ColorField
						key={key}
						label={key.slice(-1)}
						value={fill.settings[key]}
						onChange={(color) => update({ [key]: color })}
					/>
				))}
			</div>
			<OptionField
				label="Dots"
				value={fill.settings.dotType}
				options={["dots", "ink", "sharp"]}
				onChange={(dotType) =>
					update({ dotType: dotType as typeof fill.settings.dotType })
				}
			/>
			<RangeField
				label="Size"
				value={fill.settings.size}
				onChange={(size) => update({ size })}
			/>
			<RangeField
				label="Contrast"
				value={fill.settings.contrast}
				min={0}
				max={2}
				step={0.01}
				onChange={(contrast) => update({ contrast })}
			/>
			<RangeField
				label="Softness"
				value={fill.settings.softness}
				onChange={(softness) => update({ softness })}
			/>
			<RangeField
				label="Grid noise"
				value={fill.settings.gridNoise}
				onChange={(gridNoise) => update({ gridNoise })}
			/>
		</>
	);
}

function ColorPair({
	fill,
	labels,
	keys,
	onChange,
}: {
	fill: TextureCardFill;
	labels: [string, string];
	keys: [string, string];
	onChange: (patch: Record<string, string>) => void;
}) {
	const settings = fill.settings as unknown as Record<string, unknown>;
	return (
		<div className="grid grid-cols-2 gap-2">
			{keys.map((key, index) => (
				<ColorField
					key={key}
					label={labels[index] ?? key}
					value={String(settings[key])}
					onChange={(color) => onChange({ [key]: color })}
				/>
			))}
		</div>
	);
}

function RangeField({
	label,
	value,
	min = 0,
	max = 1,
	step = 0.01,
	onChange,
}: {
	label: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	onChange: (value: number) => void;
}) {
	return (
		<Slider
			label={label}
			value={[value]}
			min={min}
			max={max}
			step={step}
			showTicks={false}
			snapToDeciles={false}
			onValueChange={(values) => {
				const next = values[0];
				if (next !== undefined) onChange(next);
			}}
		/>
	);
}

function OptionField({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: string[];
	onChange: (value: string) => void;
}) {
	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-full">
				<span className="mr-auto text-xs">{label}</span>
				<SelectValue />
			</SelectTrigger>
			<SelectContent align="end">
				{options.map((option) => (
					<SelectItem key={option} value={option}>
						{option}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function ToggleField({
	label,
	checked,
	onChange,
}: {
	label: string;
	checked: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<label className="flex min-h-10 items-center justify-between rounded-lg bg-background px-3 text-xs font-semibold shadow-[inset_0_0_0_1px_var(--line-hair)]">
			<span>{label}</span>
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
			/>
		</label>
	);
}

function ChoiceGroup<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: Array<{ value: T; label: string }>;
	onChange: (value: T) => void;
}) {
	const name = useId();

	return (
		<fieldset className="flex items-start justify-between gap-3">
			<legend className="sr-only">{label}</legend>
			<span aria-hidden="true" className="pt-3 text-xs font-semibold">
				{label}
			</span>
			<div className="grid min-w-0 flex-1 grid-cols-3 gap-1">
				{options.map((option) => (
					<label key={option.value} className="relative min-w-0 cursor-pointer">
						<input
							type="radio"
							name={name}
							value={option.value}
							checked={value === option.value}
							className="peer sr-only"
							onChange={() => onChange(option.value)}
						/>
						<span className="flex min-h-10 items-center justify-center rounded-lg px-2 text-center text-[11px] font-semibold text-muted-foreground shadow-[inset_0_0_0_1px_var(--line-hair)] transition-[background-color,color,box-shadow] hover:bg-muted hover:text-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:shadow-[inset_0_0_0_1px_var(--primary)] peer-focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_22%,transparent),inset_0_0_0_1px_var(--ring)]">
							{option.label}
						</span>
					</label>
				))}
			</div>
		</fieldset>
	);
}
