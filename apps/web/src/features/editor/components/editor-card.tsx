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
import { SmartGuideOverlay } from "#/features/editor/components/smart-guide-overlay";
import { getCardFillStyle } from "#/features/editor/lib/card-fill";
import type { SmartGuide } from "#/features/editor/lib/smart-guide-engine";
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
	const [smartGuides, setSmartGuides] = useState<SmartGuide[]>([]);
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
						nodes={card.nodes}
						isSelected={node.id === selectedNodeId}
						layerIndex={index}
						onSelect={handleSelectNode}
						onGuidesChange={setSmartGuides}
					/>
				))}
				<SmartGuideOverlay guides={smartGuides} />
			</div>
			{isSelected ? (
				<div className="card-control-tray absolute -top-3 left-0 z-30 -translate-y-full">
					<button
						type="button"
						aria-label={`Add text to ${card.name}`}
						className="card-control card-control-icon"
						data-tooltip="Add text"
						onClick={(event) => {
							event.stopPropagation();
							addTextNode(card.id);
						}}
					>
						<Type className="size-3" />
					</button>
					<button
						type="button"
						aria-label={`Add image to ${card.name}`}
						className="card-control card-control-icon"
						data-tooltip="Add image"
						onClick={(event) => {
							event.stopPropagation();
							addImageNode(card.id);
						}}
					>
						<ImagePlus className="size-3" />
					</button>
					<ShapePicker cardId={card.id} cardName={card.name} />
					<button
						type="button"
						aria-label={`Open templates for ${card.name}`}
						className="card-control card-control-icon"
						data-tooltip="Templates"
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
						className="card-control card-control-icon"
						data-tooltip="Card settings"
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
							className="card-control card-control-icon card-control-danger"
							data-tooltip="Delete card"
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
					className="card-control card-control-icon absolute top-full left-0 z-30 mt-3"
					data-tooltip="Layers"
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
