import type { ProjectFontEntity } from "@kerning/shared";
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Crop,
	Scan,
} from "lucide-react";
import { useId, useState } from "react";

import { Button } from "#/components/ui/button";
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
import { deleteEditorImage, replaceEditorImage } from "#/db/image-db";
import { CardTextureInspector } from "#/features/editor/components/card-fill-inspector";
import { InspectorSection } from "#/features/editor/components/inspector-section";
import {
	NODE_CARD_INSET,
	useEditorStore,
} from "#/features/editor/store/editor-store";
import type {
	EditorCard,
	EditorNode,
	EditorNodePatch,
	ImageEffects,
	ImageNode,
	ShapeNode,
	TextAlignment,
	TextCasing,
	TextNode,
} from "#/features/editor/types";

type NodeInspectorProps = {
	card: EditorCard;
	node: EditorNode;
	fonts?: Partial<Record<TextNode["fontType"], ProjectFontEntity>>;
};

export function NodeInspector({ card, node, fonts }: NodeInspectorProps) {
	const updateNode = useEditorStore((state) => state.updateNode);

	function updateNumericValue(
		key: "x" | "y" | "width" | "height",
		value: string,
	) {
		const parsedValue = Math.round(Number(value));
		if (Number.isFinite(parsedValue))
			updateNode(card.id, node.id, { [key]: parsedValue });
	}

	return (
		<div className="space-y-3 px-4 py-5">
			{node.type === "text" ? (
				<TextSettings cardId={card.id} node={node} fonts={fonts} />
			) : node.type === "image" ? (
				<ImageSettings cardId={card.id} node={node} />
			) : (
				<ShapeSettings cardId={card.id} node={node} />
			)}

			<InspectorSection title="Layout">
				<div className="space-y-2">
					{(["x", "y", "width", "height"] as const).map((key) => (
						<NumberField
							key={key}
							id={`node-${key}`}
							label={key}
							value={node[key]}
							min={key === "x" || key === "y" ? NODE_CARD_INSET : 1}
							max={key === "x" || key === "width" ? card.width : card.height}
							onChange={(value) => updateNumericValue(key, value)}
						/>
					))}
				</div>
				<NumberField
					id="node-rotation"
					label="Rotation"
					value={node.rotation ?? 0}
					min={0}
					max={360}
					step={1}
					onChange={(value) =>
						updateFinite(updateNode, card.id, node.id, "rotation", value)
					}
				/>
			</InspectorSection>
		</div>
	);
}

function ShapeSettings({ cardId, node }: { cardId: string; node: ShapeNode }) {
	const updateNode = useEditorStore((state) => state.updateNode);

	return (
		<>
			<InspectorSection title="Shape">
				<ColorField
					label="Color"
					ariaLabel="Shape color"
					value={node.color}
					onChange={(color) => updateNode(cardId, node.id, { color })}
				/>
				<NumberField
					id="shape-size"
					label="Size"
					value={Math.max(node.width, node.height)}
					min={8}
					onChange={(value) => {
						const size = Number(value);
						if (Number.isFinite(size)) {
							updateNode(cardId, node.id, { width: size, height: size });
						}
					}}
				/>
				<NumberField
					id="shape-stroke-width"
					label="Stroke width"
					value={node.strokeWidth}
					min={1}
					max={24}
					step={1}
					onChange={(value) =>
						updateFinite(updateNode, cardId, node.id, "strokeWidth", value)
					}
				/>
			</InspectorSection>
			<InspectorSection title="Texture">
				<CardTextureInspector
					texture={node.texture ?? null}
					onChange={(texture) => updateNode(cardId, node.id, { texture })}
				/>
			</InspectorSection>
		</>
	);
}

function TextSettings({
	cardId,
	node,
	fonts,
}: {
	cardId: string;
	node: TextNode;
	fonts?: Partial<Record<TextNode["fontType"], ProjectFontEntity>>;
}) {
	const updateNode = useEditorStore((state) => state.updateNode);
	const fontRoles = [
		{ value: "primary" as const, label: "Primary" },
		{ value: "sec1" as const, label: "Secondary 1" },
		{ value: "sec2" as const, label: "Secondary 2" },
	];

	return (
		<>
			<InspectorSection title="Content">
				<Field className="relative space-y-0">
					<FieldLabel
						htmlFor="node-text"
						className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2"
					>
						Text
					</FieldLabel>
					<Input
						id="node-text"
						aria-label="Text content"
						className="pl-20"
						value={node.text}
						onChange={(event) =>
							updateNode(cardId, node.id, { text: event.target.value })
						}
					/>
				</Field>
				<Field className="space-y-0">
					<Select
						value={node.fontType}
						onValueChange={(fontType) =>
							updateNode(cardId, node.id, {
								fontType: fontType as TextNode["fontType"],
							})
						}
					>
						<SelectTrigger
							id="node-font-role"
							size="compact"
							className="min-h-9 px-3 py-2 text-sm font-bold"
						>
							<span className="mono-label mr-auto text-muted-foreground">
								Font role
							</span>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{fontRoles.map(({ value, label }) => (
								<SelectItem
									key={value}
									value={value}
									className="min-h-8 py-1.5 text-sm font-bold"
								>
									{fonts?.[value]?.family
										? `${fonts[value].family} (${label})`
										: label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
			</InspectorSection>
			<InspectorSection title="Appearance">
				<div className="space-y-2">
					<NumberField
						id="node-font-size"
						label="Size"
						value={node.fontSize}
						min={1}
						onChange={(value) =>
							updateFinite(updateNode, cardId, node.id, "fontSize", value)
						}
					/>
					<NumberField
						id="node-line-height"
						label="Line height"
						value={node.lineHeight}
						min={0.5}
						max={5}
						step={0.1}
						onChange={(value) =>
							updateFinite(updateNode, cardId, node.id, "lineHeight", value)
						}
					/>
					<NumberField
						id="node-letter-spacing"
						label="Letter spacing"
						value={node.letterSpacing}
						min={-20}
						max={100}
						step={0.1}
						onChange={(value) =>
							updateFinite(updateNode, cardId, node.id, "letterSpacing", value)
						}
					/>
				</div>
				<div className="space-y-2">
					<VisualChoiceGroup
						label="Alignment"
						value={node.textAlign}
						onChange={(textAlign) =>
							updateNode(cardId, node.id, {
								textAlign: textAlign as TextAlignment,
							})
						}
						options={[
							{ value: "left", label: "Left", visual: <AlignLeft /> },
							{ value: "center", label: "Center", visual: <AlignCenter /> },
							{ value: "right", label: "Right", visual: <AlignRight /> },
							{ value: "justify", label: "Justify", visual: <AlignJustify /> },
						]}
					/>
					<VisualChoiceGroup
						label="Case"
						value={node.textCasing}
						onChange={(textCasing) =>
							updateNode(cardId, node.id, {
								textCasing: textCasing as TextCasing,
							})
						}
						options={[
							{ value: "none", label: "Original", visual: "Aa" },
							{ value: "uppercase", label: "Uppercase", visual: "Ab" },
							{ value: "lowercase", label: "Lowercase", visual: "ab" },
							{ value: "capitalize", label: "Capitalize", visual: "Ab" },
						]}
					/>
				</div>
				<ColorField
					label="Color"
					ariaLabel="Text color"
					pickerAriaLabel="Text color picker"
					value={node.color}
					onChange={(color) => updateNode(cardId, node.id, { color })}
				/>
			</InspectorSection>
		</>
	);
}

function ImageSettings({ cardId, node }: { cardId: string; node: ImageNode }) {
	const updateNode = useEditorStore((state) => state.updateNode);
	const [isSaving, setIsSaving] = useState(false);
	const [uploadError, setUploadError] = useState("");

	async function uploadImage(file: File) {
		setIsSaving(true);
		setUploadError("");
		try {
			const imageId = await replaceEditorImage(file, node.imageId);
			updateNode(cardId, node.id, {
				imageId,
				src: "",
				alt: node.alt || file.name.replace(/\.[^.]+$/, ""),
			});
		} catch {
			setUploadError("The image could not be saved. Try another file.");
		} finally {
			setIsSaving(false);
		}
	}

	function handleRemoteUrl(src: string) {
		if (node.imageId) void deleteEditorImage(node.imageId);
		updateNode(cardId, node.id, { src, imageId: null });
	}

	function updateEffect(key: keyof ImageEffects, value: number) {
		updateNode(cardId, node.id, {
			effects: { ...node.effects, [key]: value },
		});
	}

	function resetAdjustments() {
		updateNode(cardId, node.id, {
			zoom: 1,
			positionX: 50,
			positionY: 50,
			effects: {
				brightness: 100,
				contrast: 100,
				saturation: 100,
				blur: 0,
				grayscale: 0,
				sepia: 0,
			},
		});
	}

	return (
		<>
			<InspectorSection title="Image">
				<Field className="space-y-1">
					<Input
						id="node-image-upload"
						type="file"
						accept="image/*"
						className="sr-only"
						disabled={isSaving}
						onChange={(event) => {
							const file = event.target.files?.[0];
							if (file) void uploadImage(file);
						}}
					/>
					<label
						htmlFor="node-image-upload"
						className="flex min-h-12 cursor-pointer items-center justify-between rounded-lg bg-white px-4 py-3 text-xs font-semibold tracking-[.025em] shadow-[inset_0_0_0_1px_var(--line-hair)]"
					>
						<span>
							{isSaving
								? "Saving image…"
								: node.imageId
									? "Replace uploaded image"
									: "Choose image"}
						</span>
						<span className="text-[10px] text-muted-foreground">
							{node.imageId ? "Uploaded" : node.src ? "URL active" : "No image"}
						</span>
					</label>
					{node.imageId ? (
						<p className="text-[10px] leading-4 text-muted-foreground">
							An image is stored in this browser. Choose another file to replace
							it.
						</p>
					) : null}
				</Field>
				{uploadError ? (
					<p className="text-xs text-destructive" role="alert">
						{uploadError}
					</p>
				) : null}
				<p className="text-center font-mono text-[10px] text-muted-foreground">
					or use a URL
				</p>
				<Field className="space-y-1">
					<FieldLabel htmlFor="node-image-source">Source URL</FieldLabel>
					<Input
						id="node-image-source"
						type="url"
						aria-label="Image source URL"
						placeholder="https://…"
						value={node.src}
						onChange={(event) => handleRemoteUrl(event.target.value)}
					/>
				</Field>
				<VisualChoiceGroup
					label="Image fit"
					value={node.objectFit}
					onChange={(objectFit) =>
						updateNode(cardId, node.id, {
							objectFit: objectFit as ImageNode["objectFit"],
						})
					}
					options={[
						{ value: "cover", label: "Cover", visual: <Crop /> },
						{ value: "contain", label: "Contain", visual: <Scan /> },
					]}
				/>
				<div className="space-y-2 pt-2">
					<div className="flex items-center justify-between">
						<h4 className="font-sans text-[10px] font-semibold tracking-[0.08em] text-muted-foreground">
							Composition
						</h4>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-[10px]"
							onClick={resetAdjustments}
						>
							Reset image
						</Button>
					</div>
					<Slider
						label="Zoom"
						value={[node.zoom]}
						min={1}
						max={4}
						step={0.05}
						formatValue={(value) => `${Math.round(value * 100)}%`}
						showTicks={false}
						snapToDeciles={false}
						onValueChange={([zoom]) => {
							if (zoom !== undefined) updateNode(cardId, node.id, { zoom });
						}}
					/>
					<Slider
						label="Horizontal position"
						value={[node.positionX]}
						formatValue={(value) => `${value}%`}
						onValueChange={([positionX]) => {
							if (positionX !== undefined)
								updateNode(cardId, node.id, { positionX });
						}}
					/>
					<Slider
						label="Vertical position"
						value={[node.positionY]}
						formatValue={(value) => `${value}%`}
						onValueChange={([positionY]) => {
							if (positionY !== undefined)
								updateNode(cardId, node.id, { positionY });
						}}
					/>
				</div>
				<div className="space-y-2 pt-2">
					<h4 className="font-sans text-[10px] font-semibold tracking-[0.08em] text-muted-foreground">
						Effects
					</h4>
					{(
						[
							["brightness", "Brightness", 0, 200, "%"],
							["contrast", "Contrast", 0, 200, "%"],
							["saturation", "Saturation", 0, 200, "%"],
							["blur", "Blur", 0, 20, "px"],
							["grayscale", "Grayscale", 0, 100, "%"],
							["sepia", "Sepia", 0, 100, "%"],
						] as const
					).map(([key, label, min, max, unit]) => (
						<Slider
							key={key}
							label={label}
							value={[node.effects[key]]}
							min={min}
							max={max}
							step={key === "blur" ? 0.5 : 1}
							formatValue={(value) => `${value}${unit}`}
							onValueChange={([value]) => {
								if (value !== undefined) updateEffect(key, value);
							}}
						/>
					))}
				</div>
			</InspectorSection>
			<InspectorSection title="Texture">
				<CardTextureInspector
					texture={node.texture ?? null}
					onChange={(texture) => updateNode(cardId, node.id, { texture })}
				/>
			</InspectorSection>
		</>
	);
}

function updateFinite(
	updateNode: (cardId: string, nodeId: string, patch: EditorNodePatch) => void,
	cardId: string,
	nodeId: string,
	key: "fontSize" | "lineHeight" | "letterSpacing" | "strokeWidth" | "rotation",
	value: string,
) {
	const parsedValue = Math.round(Number(value) * 100) / 100;
	if (Number.isFinite(parsedValue))
		updateNode(cardId, nodeId, { [key]: parsedValue });
}

function NumberField({
	id,
	label,
	value,
	min,
	max,
	step,
	onChange,
}: {
	id: string;
	label: string;
	value: number;
	min?: number;
	max?: number;
	step?: number;
	onChange: (value: string) => void;
}) {
	const effectiveStep = max !== undefined && max >= 100 ? 1 : step;

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
				step={effectiveStep}
				className="pr-4 pl-20 text-right"
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
		</Field>
	);
}

function VisualChoiceGroup({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: Array<{ value: string; label: string; visual: React.ReactNode }>;
	onChange: (value: string) => void;
}) {
	const name = useId();

	return (
		<fieldset className="flex min-h-12 items-center gap-3 rounded-lg bg-white px-4 shadow-[inset_0_0_0_1px_var(--line-hair)]">
			<legend className="sr-only">{label}</legend>
			<span
				aria-hidden="true"
				className="mono-label w-20 shrink-0 text-muted-foreground"
			>
				{label}
			</span>
			<div className="grid min-w-0 flex-1 grid-flow-col auto-cols-fr gap-1.5 py-1.5">
				{options.map((option) => (
					<label key={option.value} className="cursor-pointer">
						<input
							type="radio"
							name={name}
							value={option.value}
							aria-label={option.label}
							checked={value === option.value}
							className="peer sr-only"
							onChange={() => onChange(option.value)}
						/>
						<span className="flex min-h-9 items-center justify-center rounded-md border border-hairline bg-white font-sans text-xs font-semibold text-muted-foreground transition-colors peer-checked:border-2 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-foreground [&_svg]:size-4">
							{option.visual}
							<span className="sr-only">{option.label}</span>
						</span>
					</label>
				))}
			</div>
		</fieldset>
	);
}
