import {
	GripVertical,
	ImagePlus,
	LayoutTemplate,
	Layers3,
	Settings2,
	Trash2,
	Type,
	SwatchBook,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { CardImageFill } from "#/features/editor/components/card-image-fill";
import { EditorNode } from "#/features/editor/components/editor-node";
import { ShapePicker } from "#/features/editor/components/shape-picker";
import { getCardFillStyle } from "#/features/editor/lib/card-fill";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { EditorCard as EditorCardData } from "#/features/editor/types";
import { cn } from "#/lib/utils";

const CardTextureFill = lazy(() =>
	import("#/features/editor/components/card-texture-fill").then((module) => ({
		default: module.CardTextureFill,
	})),
);

type EditorCardProps = {
	card: EditorCardData;
	zoom: number;
	isSelected: boolean;
	onSelect: (id: string) => void;
	onToggleSettings?: () => void;
	onOpenTemplates?: (cardId: string) => void;
	onDelete: (id: string) => void;
};

export function EditorCard({
	card,
	zoom,
	isSelected,
	onSelect,
	onToggleSettings,
	onOpenTemplates,
	onDelete,
}: EditorCardProps) {
	const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
	const canDelete = useEditorStore((state) => state.cards.length > 1);
	const addTextNode = useEditorStore((state) => state.addTextNode);
	const addImageNode = useEditorStore((state) => state.addImageNode);
	const selectNode = useEditorStore((state) => state.selectNode);
	const reorderNode = useEditorStore((state) => state.reorderNode);
	const [layersOpen, setLayersOpen] = useState(false);

	return (
		<div
			data-card-id={card.id}
			data-card-zoom={zoom}
			className="relative shrink-0 border-px"
			style={{
				width: card.width * zoom,
				height: card.height * zoom,
			}}
		>
			<div
				className={cn(
					"relative cursor-default overflow-hidden border border-hairline bg-white p-0 text-left shadow-[0_10px_30px_rgba(15,23,42,0.10)] outline-none transition-[outline-color,box-shadow] duration-150",
					isSelected ? "z-10 ring-1 ring-primary/30" : "",
				)}
				style={{
					width: card.width,
					height: card.height,
					...getCardFillStyle(card.settings.fill),
					opacity: card.settings.opacity,
					filter: `blur(${card.settings.blur}px)`,
					borderWidth: card.settings.borderWidth,
					borderStyle: card.settings.borderStyle,
					borderColor: card.settings.borderColor,
					transform: `scale(${zoom})`,
					transformOrigin: "top left",
				}}
			>
				{card.settings.texture ? (
					<Suspense fallback={null}>
						<CardTextureFill fill={card.settings.texture} />
					</Suspense>
				) : null}
				{card.settings.fill.type === "image" ? (
					<CardImageFill fill={card.settings.fill} />
				) : null}
				<button
					type="button"
					aria-label={`Select ${card.name}`}
					aria-pressed={isSelected}
					className="absolute inset-0 size-full border-0 bg-transparent"
					onClick={(event) => {
						event.stopPropagation();
						onSelect(card.id);
					}}
				/>
				{card.nodes.map((node, index) => (
					<EditorNode
						key={node.id}
						cardId={card.id}
						cardWidth={card.width}
						zoom={zoom}
						node={node}
						isSelected={node.id === selectedNodeId}
						layerIndex={index}
					/>
				))}
			</div>
			{isSelected ? (
				<div className="absolute -top-2 left-2 z-30 flex -translate-y-full items-center gap-1">
					<span className="pointer-events-none rounded-md bg-primary px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.04em] text-primary-foreground shadow-sm">
						{card.name}
					</span>
					<button
						type="button"
						aria-label={`Add text to ${card.name}`}
						className="flex h-6 items-center gap-1 rounded-md bg-primary px-2 text-[10px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/80"
						onClick={(event) => {
							event.stopPropagation();
							addTextNode(card.id);
						}}
					>
						<Type className="size-3" /> Text
					</button>
					<button
						type="button"
						aria-label={`Add image to ${card.name}`}
						className="flex h-6 items-center gap-1 rounded-md bg-primary px-2 text-[10px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/80"
						onClick={(event) => {
							event.stopPropagation();
							addImageNode(card.id);
						}}
					>
						<ImagePlus className="size-3" /> Image
					</button>
					<ShapePicker cardId={card.id} cardName={card.name} />
					<button
						type="button"
						aria-label={`Open templates for ${card.name}`}
						className="flex h-6 items-center gap-1 rounded-md bg-primary px-2 text-[10px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/80"
						onClick={(event) => {
							event.stopPropagation();
							onOpenTemplates?.(card.id);
						}}
					>
						<SwatchBook className="size-3" /> 
					</button>
					<button
						type="button"
						aria-label={`Toggle settings for ${card.name}`}
						className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
						onClick={(event) => {
							event.stopPropagation();
							onToggleSettings?.();
						}}
					>
						<Settings2 className="size-3" />
					</button>
					{canDelete ? (
						<button
							type="button"
							aria-label={`Delete ${card.name}`}
							className="flex size-6 items-center justify-center rounded-md bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
							onClick={(event) => {
								event.stopPropagation();
								onDelete(card.id);
							}}
						>
							<Trash2 className="size-3" />
						</button>
					) : null}
				</div>
			) : null}
			{isSelected ? (
				<button
					type="button"
					aria-label={`Toggle layers for ${card.name}`}
					aria-expanded={layersOpen}
					className="absolute top-full left-2 z-30 mt-2 flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/80"
					onClick={(event) => {
						event.stopPropagation();
						setLayersOpen((open) => !open);
					}}
				>
					<Layers3 className="size-3" />
				</button>
			) : null}
			{isSelected && layersOpen ? (
				<div
					className="absolute top-full left-10 z-40 mt-2 flex max-w-[calc(100%-3rem)] items-center gap-1 overflow-x-auto rounded-xl border border-white/70 bg-white/85 p-1.5 shadow-[0_12px_35px_rgba(15,23,42,.14)] backdrop-blur-xl"
					onClick={(event) => event.stopPropagation()}
				>
					<span className="px-1.5 font-mono text-[9px] font-semibold tracking-wider text-muted-foreground">
						Layers
					</span>
					{[...card.nodes].reverse().map((node, visualIndex) => {
						const index = card.nodes.length - 1 - visualIndex;
						const label =
							node.type === "text"
								? node.text.trim().slice(0, 14) || "Text"
								: node.type === "image"
									? node.alt.trim().slice(0, 14) || "Image"
									: node.shape.replaceAll("-", " ").slice(0, 14) || "Shape";
						return (
							<button
								key={node.id}
								type="button"
								draggable
								aria-pressed={node.id === selectedNodeId}
								className="flex h-7 shrink-0 items-center gap-1 rounded-md border border-hairline bg-white/70 px-2 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted aria-pressed:bg-foreground aria-pressed:text-background"
								onClick={() => selectNode(card.id, node.id)}
								onDragStart={(event) =>
									event.dataTransfer.setData("text/plain", node.id)
								}
								onDragOver={(event) => event.preventDefault()}
								onDrop={(event) => {
									event.preventDefault();
									const sourceId = event.dataTransfer.getData("text/plain");
									if (sourceId) reorderNode(card.id, sourceId, index);
								}}
							>
								<GripVertical className="size-3 opacity-50" />
								{label}
								<span className="font-mono text-[8px] opacity-50">
									{(index + 1) * 5}
								</span>
							</button>
						);
					})}
					{card.nodes.length === 0 ? (
						<span className="px-2 text-[10px] text-muted-foreground">
							No nodes yet
						</span>
					) : null}
				</div>
			) : null}
		</div>
	);
}
