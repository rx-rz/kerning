import { GripVertical, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { deleteEditorImage } from "#/db/image-db";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { EditorCard, EditorNode } from "#/features/editor/types";
import { cn } from "#/lib/utils";

type LayerListProps = {
	card: EditorCard;
	selectedNodeId: string | null;
	onSelectNode: (nodeId: string) => void;
};

type DragState = {
	nodeId: string;
	pointerId: number;
	startX: number;
	startY: number;
	isDragging: boolean;
	insertionIndex: number | null;
};

const DRAG_THRESHOLD = 4;

function getLayerLabel(node: EditorNode) {
	if (node.type === "text") return node.text.trim().slice(0, 14) || "Text";
	if (node.type === "image") return node.alt.trim().slice(0, 14) || "Image";
	return node.shape.replaceAll("-", " ").slice(0, 14) || "Shape";
}

export function LayerList({
	card,
	selectedNodeId,
	onSelectNode,
}: LayerListProps) {
	const reorderNode = useEditorStore((state) => state.reorderNode);
	const deleteNode = useEditorStore((state) => state.deleteNode);
	const rowRefs = useRef(new Map<string, HTMLDivElement>());
	const dragRef = useRef<DragState | null>(null);
	const suppressClickRef = useRef(false);
	const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
	const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
	const visualNodes = [...card.nodes].reverse();
	const remainingNodes = draggedNodeId
		? visualNodes.filter((node) => node.id !== draggedNodeId)
		: visualNodes;

	function removeNode(node: EditorNode) {
		if (node.type === "image" && node.imageId) {
			void deleteEditorImage(node.imageId);
		}
		deleteNode(card.id, node.id);
	}

	function updateInsertion(clientY: number, nodeId: string) {
		const remaining = visualNodes.filter((node) => node.id !== nodeId);
		let nextIndex = remaining.length;

		for (let index = 0; index < remaining.length; index += 1) {
			const row = rowRefs.current.get(remaining[index]?.id ?? "");
			if (!row) continue;
			const bounds = row.getBoundingClientRect();
			if (clientY < bounds.top + bounds.height / 2) {
				nextIndex = index;
				break;
			}
		}

		dragRef.current = dragRef.current
			? { ...dragRef.current, insertionIndex: nextIndex }
			: null;
		setInsertionIndex(nextIndex);
	}

	function handlePointerDown(
		event: React.PointerEvent<HTMLDivElement>,
		nodeId: string,
	) {
		if (
			event.button !== 0 ||
			(event.target as HTMLElement).closest("[data-layer-delete]")
		) {
			return;
		}
		event.stopPropagation();
		event.currentTarget.setPointerCapture(event.pointerId);
		dragRef.current = {
			nodeId,
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			isDragging: false,
			insertionIndex: null,
		};
	}

	function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		const distance = Math.hypot(
			event.clientX - drag.startX,
			event.clientY - drag.startY,
		);

		if (!drag.isDragging && distance < DRAG_THRESHOLD) return;
		if (!drag.isDragging) {
			drag.isDragging = true;
			setDraggedNodeId(drag.nodeId);
		}
		event.preventDefault();
		updateInsertion(event.clientY, drag.nodeId);
	}

	function finishDragging(event: React.PointerEvent<HTMLDivElement>) {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;

		if (drag.isDragging && drag.insertionIndex !== null) {
			const finalVisualIds = visualNodes
				.filter((node) => node.id !== drag.nodeId)
				.map((node) => node.id);
			finalVisualIds.splice(drag.insertionIndex, 0, drag.nodeId);
			const finalUnderlyingIds = finalVisualIds.reverse();
			reorderNode(
				card.id,
				drag.nodeId,
				finalUnderlyingIds.indexOf(drag.nodeId),
			);
			suppressClickRef.current = true;
			window.setTimeout(() => {
				suppressClickRef.current = false;
			}, 0);
		}

		dragRef.current = null;
		setDraggedNodeId(null);
		setInsertionIndex(null);
	}

	const insertionBeforeId =
		insertionIndex === null
			? null
			: (remainingNodes[insertionIndex]?.id ?? null);
	const insertionAtEnd =
		insertionIndex !== null && insertionIndex === remainingNodes.length;

	return (
		<section
			aria-label={`${card.name} layers`}
			className="absolute top-full left-10 z-40 mt-2 flex max-h-64 w-52 touch-none flex-col items-stretch gap-1 overflow-y-auto rounded-xl border border-white/60 bg-surface-glass p-1.5 shadow-[0_12px_35px_rgba(15,23,42,.14)] backdrop-blur-3xl"
			onPointerDown={(event) => event.stopPropagation()}
			onWheel={(event) => event.stopPropagation()}
		>
			<span className="px-1.5 py-1 font-mono text-[9px] font-semibold tracking-wider text-muted-foreground">
				Layers
			</span>
			{visualNodes.map((node, visualIndex) => {
				const index = card.nodes.length - 1 - visualIndex;
				return (
					<div
						key={node.id}
						ref={(element) => {
							if (element) rowRefs.current.set(node.id, element);
							else rowRefs.current.delete(node.id);
						}}
						data-layer-id={node.id}
						className={cn(
							"relative flex h-9 w-full shrink-0 cursor-grab items-center rounded-md border border-hairline bg-surface-glass text-[10px] font-semibold text-muted-foreground transition-[background-color,color,opacity] active:cursor-grabbing",
							node.id === selectedNodeId && "bg-foreground text-background",
							node.id === draggedNodeId && "opacity-40",
							node.id === insertionBeforeId &&
								"before:absolute before:inset-x-0 before:-top-1 before:h-0.5 before:rounded-full before:bg-accent",
							insertionAtEnd &&
								visualIndex === visualNodes.length - 1 &&
								"after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-accent",
						)}
						onPointerDown={(event) => handlePointerDown(event, node.id)}
						onPointerMove={handlePointerMove}
						onPointerUp={finishDragging}
						onPointerCancel={finishDragging}
					>
						<button
							type="button"
							data-layer-delete
							aria-label={`Select ${getLayerLabel(node)} layer`}
							aria-pressed={node.id === selectedNodeId}
							className="flex min-w-0 flex-1 items-center gap-1.5 self-stretch rounded-l-md px-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
							onClick={(event) => {
								event.stopPropagation();
								if (suppressClickRef.current) {
									suppressClickRef.current = false;
									return;
								}
								onSelectNode(node.id);
							}}
							onKeyDown={(event) => {
								if (event.key === "Delete" || event.key === "Backspace") {
									event.preventDefault();
									removeNode(node);
								}
							}}
						>
							<GripVertical className="size-3 shrink-0 opacity-50" />
							<span className="min-w-0 flex-1 truncate">
								{getLayerLabel(node)}
							</span>
							<span className="shrink-0 font-mono text-[8px] opacity-50">
								{(index + 1) * 5}
							</span>
						</button>
						<button
							type="button"
							aria-label={`Delete ${getLayerLabel(node)} layer`}
							className="mr-1 flex size-7 shrink-0 items-center justify-center rounded-md text-current opacity-60 outline-none transition-opacity hover:bg-destructive hover:text-white hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
							onClick={(event) => {
								event.stopPropagation();
								removeNode(node);
							}}
							onPointerDown={(event) => event.stopPropagation()}
						>
							<Trash2 className="size-3" />
						</button>
					</div>
				);
			})}
			{card.nodes.length === 0 ? (
				<span className="px-2 pb-1 text-[10px] text-muted-foreground">
					No nodes yet
				</span>
			) : null}
		</section>
	);
}
