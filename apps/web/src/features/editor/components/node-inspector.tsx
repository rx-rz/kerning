import { Trash2 } from "lucide-react";
import { useState } from "react";

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
import { deleteEditorImage, replaceEditorImage } from "#/db/image-db";
import {
	NODE_CARD_INSET,
	useEditorStore,
} from "#/features/editor/store/editor-store";
import type {
	EditorCard,
	EditorNode,
	EditorNodePatch,
	FontType,
	ImageNode,
	TextNode,
} from "#/features/editor/types";

type NodeInspectorProps = {
	card: EditorCard;
	node: EditorNode;
};

const FONT_WEIGHTS = [
	{ value: 100, label: "Thin" },
	{ value: 200, label: "Extra light" },
	{ value: 300, label: "Light" },
	{ value: 400, label: "Regular" },
	{ value: 500, label: "Medium" },
	{ value: 600, label: "Semi bold" },
	{ value: 700, label: "Bold" },
	{ value: 800, label: "Extra bold" },
	{ value: 900, label: "Black" },
] as const;

export function NodeInspector({ card, node }: NodeInspectorProps) {
	const updateNode = useEditorStore((state) => state.updateNode);
	const deleteNode = useEditorStore((state) => state.deleteNode);

	function updateNumericValue(
		key: "x" | "y" | "width" | "height",
		value: string,
	) {
		const parsedValue = Number(value);
		if (Number.isFinite(parsedValue))
			updateNode(card.id, node.id, { [key]: parsedValue });
	}

	function handleDelete() {
		if (node.type === "image" && node.imageId) {
			void deleteEditorImage(node.imageId);
		}
		deleteNode(card.id, node.id);
	}

	return (
		<div className="divide-y divide-border pt-6">
			<section className="flex items-center justify-between px-5 py-4">
				<div>
					<p className="text-xs font-semibold capitalize">{node.type} node</p>
					<p className="mt-1 font-mono text-[10px] text-muted-foreground">
						Positioned inside {card.name}
					</p>
				</div>
				<Button
					type="button"
					aria-label={`Delete ${node.type} node`}
					variant="ghost"
					size="icon-sm"
					className="text-destructive"
					onClick={handleDelete}
				>
					<Trash2 />
				</Button>
			</section>

			{node.type === "text" ? (
				<TextSettings cardId={card.id} node={node} />
			) : (
				<ImageSettings cardId={card.id} node={node} />
			)}

			<section className="space-y-3 px-5 py-4">
				<h3 className="font-mono text-[10px] font-semibold tracking-[0.08em] text-muted-foreground">
					Geometry
				</h3>
				<div className="grid grid-cols-2 gap-2">
					{(["x", "y", "width", "height"] as const).map((key) => (
						<NumberField
							key={key}
							id={`node-${key}`}
							label={key}
							value={node[key]}
							min={key === "x" || key === "y" ? NODE_CARD_INSET : 1}
							max={
								(key === "x" || key === "width" ? card.width : card.height) -
								NODE_CARD_INSET
							}
							onChange={(value) => updateNumericValue(key, value)}
						/>
					))}
				</div>
			</section>
		</div>
	);
}

function TextSettings({ cardId, node }: { cardId: string; node: TextNode }) {
	const updateNode = useEditorStore((state) => state.updateNode);

	return (
		<section className="space-y-3 px-5 py-4">
			<h3 className="font-mono text-[10px] font-semibold tracking-[0.08em] text-muted-foreground">
				Typography
			</h3>
			<Field className="space-y-1">
				<FieldLabel htmlFor="node-text">Content</FieldLabel>
				<Input
					id="node-text"
					aria-label="Text content"
					value={node.text}
					onChange={(event) =>
						updateNode(cardId, node.id, { text: event.target.value })
					}
				/>
			</Field>
			<Field className="space-y-0">
				<Select
					value={node.fontType}
					onValueChange={(fontType: FontType) =>
						updateNode(cardId, node.id, { fontType })
					}
				>
					<SelectTrigger id="node-font-type" className="w-full">
						<FieldLabel
							className="pointer-events-none mr-auto"
							htmlFor="node-font-type"
						>
							Font type
						</FieldLabel>
						<SelectValue />
					</SelectTrigger>
					<SelectContent align="end">
						<SelectItem value="primary">Primary</SelectItem>
						<SelectItem value="sec1">Secondary 1</SelectItem>
						<SelectItem value="sec2">Secondary 2</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<div className="grid grid-cols-2 gap-2">
				<NumberField
					id="node-font-size"
					label="Font size"
					value={node.fontSize}
					min={1}
					onChange={(value) =>
						updateFinite(updateNode, cardId, node.id, "fontSize", value)
					}
				/>
				<Field className="space-y-0">
					<Select
						value={String(node.fontWeight)}
						onValueChange={(fontWeight) =>
							updateNode(cardId, node.id, { fontWeight: Number(fontWeight) })
						}
					>
						<SelectTrigger id="node-font-weight" className="w-full">
							<FieldLabel
								className="pointer-events-none mr-auto"
								htmlFor="node-font-weight"
							>
								Weight
							</FieldLabel>
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="end">
							{FONT_WEIGHTS.map((weight) => (
								<SelectItem key={weight.value} value={String(weight.value)}>
									{weight.value} · {weight.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
			</div>
			<ColorField
				label="Color"
				ariaLabel="Text color"
				pickerAriaLabel="Text color picker"
				value={node.color}
				onChange={(color) => updateNode(cardId, node.id, { color })}
			/>
		</section>
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

	return (
		<section className="space-y-3 px-5 py-4">
			<h3 className="font-mono text-[10px] font-semibold tracking-[0.08em] text-muted-foreground">
				Image
			</h3>
			<Field className="space-y-1">
				<FieldLabel htmlFor="node-image-upload">Upload</FieldLabel>
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
					className="flex min-h-12 cursor-pointer items-center justify-between rounded-lg bg-background px-4 py-3 text-xs font-semibold tracking-[.025em] shadow-[inset_0_0_0_1px_var(--line-hair)] transition-colors hover:bg-muted"
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
			<Field className="space-y-1">
				<FieldLabel htmlFor="node-image-alt">Alt text</FieldLabel>
				<Input
					id="node-image-alt"
					value={node.alt}
					onChange={(event) =>
						updateNode(cardId, node.id, { alt: event.target.value })
					}
				/>
			</Field>
			<Field className="space-y-0">
				<Select
					value={node.objectFit}
					onValueChange={(objectFit: ImageNode["objectFit"]) =>
						updateNode(cardId, node.id, { objectFit })
					}
				>
					<SelectTrigger id="node-image-fit" className="w-full">
						<FieldLabel
							className="pointer-events-none mr-auto"
							htmlFor="node-image-fit"
						>
							Fit
						</FieldLabel>
						<SelectValue />
					</SelectTrigger>
					<SelectContent align="end">
						<SelectItem value="cover">Cover</SelectItem>
						<SelectItem value="contain">Contain</SelectItem>
					</SelectContent>
				</Select>
			</Field>
		</section>
	);
}

function updateFinite(
	updateNode: (cardId: string, nodeId: string, patch: EditorNodePatch) => void,
	cardId: string,
	nodeId: string,
	key: "fontSize",
	value: string,
) {
	const parsedValue = Number(value);
	if (Number.isFinite(parsedValue))
		updateNode(cardId, nodeId, { [key]: parsedValue });
}

function NumberField({
	id,
	label,
	value,
	min,
	max,
	onChange,
}: {
	id: string;
	label: string;
	value: number;
	min?: number;
	max?: number;
	onChange: (value: string) => void;
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
				className="pr-4 pl-20 text-right"
				value={value}
				onChange={(event) => onChange(event.target.value)}
			/>
		</Field>
	);
}
