import { createId } from "@paralleldrive/cuid2";
import { ChevronDown, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "#/components/ui/button";
import { ColorField } from "#/components/ui/color-field";
import { FieldLabel } from "#/components/ui/field";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
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
			<Popover>
				<PopoverTrigger asChild>
					<button
						type="button"
						className="flex min-h-12 w-full items-center gap-2 rounded-lg border border-hairline bg-white px-3 text-xs"
					>
						<FillSwatch type={fill.type} />
						<span className="font-semibold">Fill</span>
						<span className="ml-auto text-muted-foreground">
							{FILL_TYPES.find(({ value }) => value === fill.type)?.label}
						</span>
						<ChevronDown className="size-3" />
					</button>
				</PopoverTrigger>
				<PopoverContent
					align="end"
					className="w-[var(--radix-popover-trigger-width)]"
				>
					<fieldset className="grid grid-cols-2 gap-1.5">
						<legend className="sr-only">Fill</legend>
						{FILL_TYPES.map((option) => (
							<label key={option.value} className="cursor-pointer">
								<input
									type="radio"
									name="card-fill"
									className="peer sr-only"
									checked={fill.type === option.value}
									onChange={() => {
										if (option.value === fill.type) return;
										if (fill.type === "image" && fill.imageId)
											void deleteEditorImage(fill.imageId);
										onChange(createDefaultFill(option.value));
									}}
								/>
								<span className="flex flex-col gap-1 rounded-lg border border-hairline bg-white p-1 text-center text-[10px] font-semibold text-muted-foreground peer-checked:border-2 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-foreground">
									<FillSwatch type={option.value} large />
									{option.label}
								</span>
							</label>
						))}
					</fieldset>
				</PopoverContent>
			</Popover>

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
				<div className="space-y-2">
					<RangeField
						label="Center X"
						value={fill.centerX}
						min={1}
						max={100}
						step={1}
						onChange={(centerX) => onChange({ ...fill, centerX })}
					/>
					<RangeField
						label="Center Y"
						value={fill.centerY}
						min={1}
						max={100}
						step={1}
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
					<div key={stop.id} className="flex items-center gap-2">
						<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold text-muted-foreground">
							{index + 1}
						</span>
						<div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
							<ColorField
								label={`Stop ${index + 1}`}
								ariaLabel={`Stop ${index + 1}`}
								hideLabel
								value={stop.color}
								onChange={(color) => updateStop(stop.id, { color })}
							/>
							<RangeField
								label="Position"
								value={stop.position}
								min={1}
								max={100}
								step={1}
								onChange={(position) => updateStop(stop.id, { position })}
							/>
						</div>
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
	const selectedTexture = texture?.texture ?? "none";

	return (
		<div className="space-y-3">
			<Popover>
				<PopoverTrigger asChild>
					<button
						type="button"
						className="flex min-h-12 w-full items-center gap-2 rounded-lg border border-hairline bg-white px-3 text-xs"
					>
						<TextureSwatch texture={selectedTexture} />
						<span className="font-semibold">Texture</span>
						<span className="ml-auto capitalize text-muted-foreground">
							{TEXTURES.find(({ value }) => value === selectedTexture)?.label ??
								"None"}
						</span>
						<ChevronDown className="size-3" />
					</button>
				</PopoverTrigger>
				<PopoverContent
					align="end"
					className="w-[var(--radix-popover-trigger-width)]"
				>
					<fieldset className="grid grid-cols-3 gap-1.5">
						<legend className="sr-only">Texture</legend>
						{(
							[{ value: "none", label: "None" }, ...TEXTURES] as Array<{
								value: TextureChoice;
								label: string;
							}>
						).map((option) => (
							<label key={option.value} className="cursor-pointer">
								<input
									type="radio"
									name="card-texture"
									className="peer sr-only"
									checked={selectedTexture === option.value}
									onChange={() =>
										onChange(
											option.value === "none"
												? null
												: createDefaultTextureFill(option.value),
										)
									}
								/>
								<span className="flex flex-col gap-1 rounded-lg border border-hairline bg-white p-1 text-center text-[10px] text-muted-foreground peer-checked:border-2 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-foreground">
									<TextureSwatch texture={option.value} large />
									{option.label}
								</span>
							</label>
						))}
					</fieldset>
				</PopoverContent>
			</Popover>

			{texture ? (
				<div className="space-y-3">
					<RangeField
						label="Opacity"
						value={texture.opacity}
						onChange={(opacity) => onChange({ ...texture, opacity })}
					/>
					<TextureSettings fill={texture} onChange={onChange} />
				</div>
			) : null}
		</div>
	);
}

function TextureSwatch({
	texture,
	large = false,
}: {
	texture: TextureChoice;
	large?: boolean;
}) {
	const background =
		texture === "paper"
			? "repeating-radial-gradient(circle at 30% 40%,#4457fd 0 1px,#f1f2ff 1px 4px)"
			: texture === "fluted-glass"
				? "repeating-linear-gradient(90deg,#c7ccff 0 4px,#fff 4px 7px,#8792ff 7px 9px)"
				: texture === "halftone"
					? "radial-gradient(circle,#4457fd 1px,transparent 1.5px) 0 0/6px 6px,#f1f2ff"
					: texture === "halftone-cmyk"
						? "radial-gradient(circle at 35% 35%,#4457fd 0 1px,transparent 2px),radial-gradient(circle at 65% 65%,#7c3aed 0 1px,transparent 2px),#c7ccff"
						: "linear-gradient(135deg,#fff 45%,#d7dbe0 45% 55%,#fff 55%)";

	return (
		<span
			aria-hidden="true"
			className={
				large
					? "mx-auto size-12 rounded-md border border-hairline"
					: "size-7 shrink-0 rounded-md border border-hairline"
			}
			style={{ background }}
		/>
	);
}

function FillSwatch({
	type,
	large = false,
}: {
	type: CardFill["type"];
	large?: boolean;
}) {
	const background =
		type === "solid"
			? "#dbeafe"
			: type === "linear-gradient"
				? "linear-gradient(135deg,#f472b6,#60a5fa)"
				: type === "radial-gradient"
					? "radial-gradient(circle,#fef08a 0 20%,#fb7185 55%,#818cf8)"
					: "linear-gradient(135deg,#d1d5db 25%,transparent 25%) 0 0/8px 8px,linear-gradient(315deg,#e5e7eb 25%,#fff 25%) 0 0/8px 8px";

	return (
		<span
			aria-hidden="true"
			className={
				large
					? "mx-auto size-12 rounded-md border border-black/10"
					: "size-7 shrink-0 rounded-md border border-black/10"
			}
			style={{ background }}
		/>
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
			onChange({ ...fill, imageId, src: "" });
		} finally {
			setIsUploading(false);
		}
	}

	return (
		<>
			<div className="space-y-1.5">
				<FieldLabel htmlFor="card-background-url">Image URL</FieldLabel>
				<Input
					id="card-background-url"
					type="url"
					placeholder="https://example.com/image.jpg"
					value={fill.src ?? ""}
					onChange={(event) => {
						const src = event.target.value;
						if (src && fill.imageId) void deleteEditorImage(fill.imageId);
						onChange({ ...fill, src, imageId: src ? null : fill.imageId });
					}}
				/>
			</div>
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
			<div className="space-y-2">
				<RangeField
					label="Origin X"
					value={fill.settings.originX}
					min={1}
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
					min={1}
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
			<div className="space-y-2">
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
		<div className="space-y-2">
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
		<label className="flex min-h-12 items-center justify-between rounded-lg bg-white px-3 text-xs font-semibold shadow-[inset_0_0_0_1px_var(--line-hair)]">
			<span>{label}</span>
			<input
				type="checkbox"
				checked={checked}
				onChange={(event) => onChange(event.target.checked)}
			/>
		</label>
	);
}
