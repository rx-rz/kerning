import { X } from "lucide-react";
import type { MouseEvent, PointerEvent } from "react";
import { useRef } from "react";

import { deleteEditorImage } from "#/db/image-db";
import { ImageNode } from "#/features/editor/components/image-node";
import { ShapeNode } from "#/features/editor/components/shape-node";
import { TextNode } from "#/features/editor/components/text-node";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { EditorNode as EditorNodeData } from "#/features/editor/types";
import { cn } from "#/lib/utils";

type EditorNodeProps = {
	cardId: string;
	cardWidth: number;
	cardHeight: number;
	zoom: number;
	node: EditorNodeData;
	isSelected: boolean;
	layerIndex: number;
	onSelect: (nodeId: string) => void;
};

export function EditorNode({
	cardId,
	cardWidth,
	cardHeight,
	zoom,
	node,
	isSelected,
	layerIndex,
	onSelect,
}: EditorNodeProps) {
	const nodeRef = useRef<HTMLDivElement>(null);
	const selectNode = () => onSelect(node.id);

	function startDragging(event: PointerEvent<HTMLElement>) {
		event.stopPropagation();
		selectNode();

		const origin = {
			pointerX: event.clientX,
			pointerY: event.clientY,
			x: node.x,
			y: node.y,
		};
		const target = event.currentTarget;
		target.setPointerCapture(event.pointerId);

		function moveNode(moveEvent: globalThis.PointerEvent) {
			const round =
				node.type === "image" ? Math.ceil : (value: number) => value;
			useEditorStore.getState().updateNode(cardId, node.id, {
				x: round(origin.x + (moveEvent.clientX - origin.pointerX) / zoom),
				y: round(origin.y + (moveEvent.clientY - origin.pointerY) / zoom),
			});
		}

		function stopDragging() {
			target.removeEventListener("pointermove", moveNode);
			target.removeEventListener("pointerup", stopDragging);
			target.removeEventListener("pointercancel", stopDragging);
		}

		target.addEventListener("pointermove", moveNode);
		target.addEventListener("pointerup", stopDragging);
		target.addEventListener("pointercancel", stopDragging);
	}

	type ResizeDirection = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

	function startResizing(
		event: PointerEvent<HTMLButtonElement>,
		direction: ResizeDirection,
	) {
		event.preventDefault();
		event.stopPropagation();
		selectNode();

		const measuredWidth = nodeRef.current?.getBoundingClientRect().width;
		const origin = {
			pointerX: event.clientX,
			pointerY: event.clientY,
			width:
				measuredWidth && measuredWidth > 0 ? measuredWidth / zoom : node.width,
			height: node.height,
			x: node.x,
			y: node.y,
		};
		const target = event.currentTarget;
		target.setPointerCapture(event.pointerId);

		function resizeNode(moveEvent: globalThis.PointerEvent) {
			const deltaX = (moveEvent.clientX - origin.pointerX) / zoom;
			const deltaY = (moveEvent.clientY - origin.pointerY) / zoom;
			const round =
				node.type === "image" ? Math.ceil : (value: number) => value;

			const movesLeft = direction.includes("w");
			const movesRight = direction.includes("e");
			const movesTop = direction.includes("n");
			const movesBottom = direction.includes("s");
			const width = movesLeft
				? Math.min(origin.x + origin.width, Math.max(24, origin.width - deltaX))
				: movesRight
					? Math.min(cardWidth - origin.x, Math.max(24, origin.width + deltaX))
					: origin.width;
			const height = movesTop
				? Math.min(
						origin.y + origin.height,
						Math.max(24, origin.height - deltaY),
					)
				: movesBottom
					? Math.min(
							cardHeight - origin.y,
							Math.max(24, origin.height + deltaY),
						)
					: origin.height;

			useEditorStore.getState().updateNode(cardId, node.id, {
				width: round(width),
				height: round(height),
				x: movesLeft ? round(origin.x + origin.width - width) : origin.x,
				y: movesTop ? round(origin.y + origin.height - height) : origin.y,
			});
		}

		function stopResizing() {
			target.removeEventListener("pointermove", resizeNode);
			target.removeEventListener("pointerup", stopResizing);
			target.removeEventListener("pointercancel", stopResizing);
		}

		target.addEventListener("pointermove", resizeNode);
		target.addEventListener("pointerup", stopResizing);
		target.addEventListener("pointercancel", stopResizing);
	}

	function startWidthResizing(event: PointerEvent<HTMLButtonElement>) {
		event.preventDefault();
		event.stopPropagation();
		selectNode();

		const origin = {
			pointerX: event.clientX,
			width: node.width,
		};
		const target = event.currentTarget;
		target.setPointerCapture(event.pointerId);

		function resizeWidth(moveEvent: globalThis.PointerEvent) {
			const maximumWidth = cardWidth - node.x;
			useEditorStore.getState().updateNode(cardId, node.id, {
				width: Math.min(
					maximumWidth,
					Math.max(
						24,
						origin.width + (moveEvent.clientX - origin.pointerX) / zoom,
					),
				),
			});
		}

		function stopWidthResizing() {
			target.removeEventListener("pointermove", resizeWidth);
			target.removeEventListener("pointerup", stopWidthResizing);
			target.removeEventListener("pointercancel", stopWidthResizing);
		}

		target.addEventListener("pointermove", resizeWidth);
		target.addEventListener("pointerup", stopWidthResizing);
		target.addEventListener("pointercancel", stopWidthResizing);
	}

	function deleteNode(event: MouseEvent<HTMLButtonElement>) {
		event.preventDefault();
		event.stopPropagation();
		if (node.type === "image" && node.imageId) {
			void deleteEditorImage(node.imageId);
		}
		useEditorStore.getState().deleteNode(cardId, node.id);
	}

	return (
		<div
			ref={nodeRef}
			data-editor-node
			className={cn(
				"absolute m-0 touch-none bg-transparent p-0 text-left transition-[box-shadow]",
				isSelected
					? "ring-1 ring-foreground/55 shadow-[0_0_0_1px_rgba(255,255,255,.55)]"
					: "hover:ring-1 hover:ring-foreground/25",
			)}
			style={{
				left: node.x,
				top: node.y,
				width: node.width,
				height: node.height,
				zIndex: (layerIndex + 1) * 5,
			}}
		>
			{node.type === "text" ? (
				<TextNode
					cardId={cardId}
					node={node}
					isSelected={isSelected}
					onSelect={selectNode}
					onStartDragging={startDragging}
				/>
			) : node.type === "image" ? (
				<ImageNode
					cardId={cardId}
					node={node}
					isSelected={isSelected}
					onSelect={selectNode}
					onStartDragging={startDragging}
				/>
			) : (
				<ShapeNode
					node={node}
					isSelected={isSelected}
					onSelect={selectNode}
					onStartDragging={startDragging}
				/>
			)}
			{isSelected ? (
				<>
					<button
						type="button"
						aria-label={`Delete ${node.type} node from card`}
						className="absolute top-1 right-1 z-30 flex size-4 items-center justify-center rounded-full bg-foreground/80 p-0 text-background shadow-sm outline-none transition-colors hover:bg-destructive focus-visible:ring-1 focus-visible:ring-foreground/30"
						onClick={deleteNode}
						onPointerDown={(event) => event.stopPropagation()}
					>
						<X className="size-2.5" />
					</button>
					{node.type === "text" ? (
						<button
							type="button"
							data-editor-node-width-handle
							aria-label="Resize text width"
							className="absolute top-1/2 right-0 z-30 h-5 w-1.5 -translate-y-1/2 translate-x-1/2 cursor-ew-resize touch-none rounded-full bg-foreground/70 p-0 shadow-sm outline-none"
							onClick={(event) => event.stopPropagation()}
							onPointerDown={startWidthResizing}
						/>
					) : null}
					{(
						[
							[
								"n",
								"top-0 left-1/2 h-1.5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
							],
							[
								"ne",
								"top-0 right-0 size-2.5 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
							],
							[
								"e",
								"top-1/2 right-0 h-5 w-1.5 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
							],
							[
								"se",
								"right-0 bottom-0 size-2.5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
							],
							[
								"s",
								"bottom-0 left-1/2 h-1.5 w-5 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
							],
							[
								"sw",
								"bottom-0 left-0 size-2.5 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
							],
							[
								"w",
								"top-1/2 left-0 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
							],
							[
								"nw",
								"top-0 left-0 size-2.5 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
							],
						] as const
					).map(([direction, position]) => (
						<button
							key={direction}
							type="button"
							data-editor-node-resize-handle={direction}
							aria-label={
								direction === "se"
									? `Resize ${node.type} node`
									: `Resize ${node.type} node from ${direction}`
							}
							className={cn(
								"absolute z-30 touch-none rounded-[2px] bg-foreground/75 p-0 shadow-sm outline-none",
								position,
							)}
							onClick={(event) => event.stopPropagation()}
							onPointerDown={(event) => startResizing(event, direction)}
						/>
					))}
				</>
			) : null}
		</div>
	);
}
