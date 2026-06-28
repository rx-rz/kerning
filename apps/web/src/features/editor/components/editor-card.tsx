import { ImagePlus, Settings2, Trash2, Type } from "lucide-react";
import { EditorNode } from "#/features/editor/components/editor-node";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { EditorCard as EditorCardData } from "#/features/editor/types";
import { cn } from "#/lib/utils";

type EditorCardProps = {
	card: EditorCardData;
	zoom: number;
	isSelected: boolean;
	onSelect: (id: string) => void;
	onToggleSettings?: () => void;
	onDelete: (id: string) => void;
};

export function EditorCard({
	card,
	zoom,
	isSelected,
	onSelect,
	onToggleSettings,
	onDelete,
}: EditorCardProps) {
	const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
	const addTextNode = useEditorStore((state) => state.addTextNode);
	const addImageNode = useEditorStore((state) => state.addImageNode);

	return (
		<div
			data-card-id={card.id}
			data-card-zoom={zoom}
			className="relative shrink-0"
			style={{
				width: card.width * zoom,
				height: card.height * zoom,
			}}
		>
			<div
				className={cn(
					"relative cursor-default overflow-hidden border-2 border-black/10 p-0 text-left outline-none transition-[box-shadow,border-color] duration-150",
					isSelected
						? "z-10 border-blue-500 shadow-inset"
						: "shadow-none hover:border-black/20",
				)}
				style={{
					width: card.width,
					height: card.height,
					background: card.background,
					borderRadius: card.borderRadius,
					transform: `scale(${zoom})`,
					transformOrigin: "top left",
				}}
			>
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
				{card.nodes.map((node) => (
					<EditorNode
						key={node.id}
						cardId={card.id}
						cardWidth={card.width}
						zoom={zoom}
						node={node}
						isSelected={node.id === selectedNodeId}
					/>
				))}
			</div>
			{isSelected ? (
				<div className="absolute -top-2 left-2 z-30 flex -translate-y-full items-center gap-1">
					<span className="pointer-events-none rounded-md bg-blue-600 px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.04em] text-white shadow-sm">
						{card.name}
					</span>
					<button
						type="button"
						aria-label={`Add text to ${card.name}`}
						className="flex h-6 items-center gap-1 rounded-md bg-black px-2 text-[10px] font-semibold text-white shadow-sm transition-colors hover:bg-black/80"
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
						className="flex h-6 items-center gap-1 rounded-md bg-black px-2 text-[10px] font-semibold text-white shadow-sm transition-colors hover:bg-black/80"
						onClick={(event) => {
							event.stopPropagation();
							addImageNode(card.id);
						}}
					>
						<ImagePlus className="size-3" /> Image
					</button>
					<button
						type="button"
						aria-label={`Toggle settings for ${card.name}`}
						className="flex size-6 items-center justify-center rounded-md bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
						onClick={(event) => {
							event.stopPropagation();
							onToggleSettings?.();
						}}
					>
						<Settings2 className="size-3" />
					</button>
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
				</div>
			) : null}
		</div>
	);
}
