import {
	ImagePlus,
	Layers3,
	Settings2,
	SwatchBook,
	Trash2,
	Type,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { CardImageFill } from "#/features/editor/components/card-image-fill";
import { EditorNode } from "#/features/editor/components/editor-node";
import { LayerList } from "#/features/editor/components/layer-list";
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
	onSelectNode?: () => void;
	onOpenTemplates?: (cardId: string) => void;
	onDelete: (id: string) => void;
};

export function EditorCard({
	card,
	zoom,
	isSelected,
	onSelect,
	onToggleSettings,
	onSelectNode,
	onOpenTemplates,
	onDelete,
}: EditorCardProps) {
	const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
	const canDelete = useEditorStore((state) => state.cards.length > 1);
	const addTextNode = useEditorStore((state) => state.addTextNode);
	const addImageNode = useEditorStore((state) => state.addImageNode);
	const selectNode = useEditorStore((state) => state.selectNode);
	const [layersOpen, setLayersOpen] = useState(false);
	const handleSelectNode = (nodeId: string) => {
		selectNode(card.id, nodeId);
		onSelectNode?.();
	};

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
						cardHeight={card.height}
						zoom={zoom}
						node={node}
						isSelected={node.id === selectedNodeId}
						layerIndex={index}
						onSelect={handleSelectNode}
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
				<LayerList
					card={card}
					selectedNodeId={selectedNodeId}
					onSelectNode={handleSelectNode}
				/>
			) : null}
		</div>
	);
}
