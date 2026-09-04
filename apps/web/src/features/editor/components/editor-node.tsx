import type { PointerEvent } from "react";
import { useEffect, useRef } from "react";

import { ImageNode } from "#/features/editor/components/image-node";
import { ShapeNode } from "#/features/editor/components/shape-node";
import { TextNode } from "#/features/editor/components/text-node";
import {
	type SmartGuide,
	SmartGuideEngine,
} from "#/features/editor/lib/smart-guide-engine";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { EditorNode as EditorNodeData } from "#/features/editor/types";
import { cn } from "#/lib/utils";

type EditorNodeProps = {
	cardId: string;
	cardWidth: number;
	cardHeight: number;
	zoom: number;
	node: EditorNodeData;
	previewText?: string;
	nodes: readonly EditorNodeData[];
	isSelected: boolean;
	layerIndex: number;
	onSelect: (nodeId: string) => void;
	onGuidesChange: (guides: SmartGuide[]) => void;
};

export function EditorNode({
	cardId,
	cardWidth,
	cardHeight,
	zoom,
	node,
	previewText,
	nodes,
	isSelected,
	layerIndex,
	onSelect,
	onGuidesChange,
}: EditorNodeProps) {
	const nodeRef = useRef<HTMLDivElement>(null);
	const frameRef = useRef<number | null>(null);
	const pendingFrameRef = useRef<(() => void) | null>(null);
	const selectNode = () => onSelect(node.id);

	useEffect(
		() => () => {
			if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
		},
		[],
	);

	function createGuideEngine() {
		return new SmartGuideEngine(nodes.filter(({ id }) => id !== node.id));
	}

	function scheduleFrame(run: () => void) {
		pendingFrameRef.current = run;
		if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
		frameRef.current = requestAnimationFrame(() => {
			frameRef.current = null;
			const pending = pendingFrameRef.current;
			pendingFrameRef.current = null;
			pending?.();
		});
	}

	function finishInteraction() {
		if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
		frameRef.current = null;
		const pending = pendingFrameRef.current;
		pendingFrameRef.current = null;
		pending?.();
		onGuidesChange([]);
	}

	function startDragging(event: PointerEvent<HTMLElement>) {
		event.stopPropagation();
		selectNode();
		useEditorStore.getState().beginHistoryTransaction(cardId);

		const origin = {
			pointerX: event.clientX,
			pointerY: event.clientY,
			x: node.x,
			y: node.y,
		};
		const target = event.currentTarget;
		const guideEngine = createGuideEngine();
		target.setPointerCapture(event.pointerId);

		function moveNode(moveEvent: globalThis.PointerEvent) {
			const clientX = moveEvent.clientX;
			const clientY = moveEvent.clientY;
			scheduleFrame(() => {
				const result = guideEngine.compute({
					...node,
					x: origin.x + (clientX - origin.pointerX) / zoom,
					y: origin.y + (clientY - origin.pointerY) / zoom,
				});
				const round =
					node.type === "image" ? Math.ceil : (value: number) => value;
				useEditorStore.getState().updateNode(cardId, node.id, {
					x: round(result.bounds.x),
					y: round(result.bounds.y),
				});
				onGuidesChange(result.guides);
			});
		}

		function stopDragging() {
			finishInteraction();
			useEditorStore.getState().endHistoryTransaction(cardId);
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
		useEditorStore.getState().beginHistoryTransaction(cardId);

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
		const guideEngine = createGuideEngine();
		target.setPointerCapture(event.pointerId);

		function resizeNode(moveEvent: globalThis.PointerEvent) {
			const clientX = moveEvent.clientX;
			const clientY = moveEvent.clientY;
			scheduleFrame(() => {
				const deltaX = (clientX - origin.pointerX) / zoom;
				const deltaY = (clientY - origin.pointerY) / zoom;
				const round =
					node.type === "image" ? Math.ceil : (value: number) => value;

				const movesLeft = direction.includes("w");
				const movesRight = direction.includes("e");
				const movesTop = direction.includes("n");
				const movesBottom = direction.includes("s");
				const width = movesLeft
					? Math.min(
							origin.x + origin.width,
							Math.max(24, origin.width - deltaX),
						)
					: movesRight
						? Math.min(
								cardWidth - origin.x,
								Math.max(24, origin.width + deltaX),
							)
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

				const result = guideEngine.compute(
					{
						id: node.id,
						width,
						height,
						x: movesLeft ? origin.x + origin.width - width : origin.x,
						y: movesTop ? origin.y + origin.height - height : origin.y,
					},
					{
						left: movesLeft || undefined,
						right: movesRight || undefined,
						top: movesTop || undefined,
						bottom: movesBottom || undefined,
					},
				);
				const nextBounds = {
					width: round(result.bounds.width),
					height: round(result.bounds.height),
					x: round(result.bounds.x),
					y: round(result.bounds.y),
				};
				useEditorStore.getState().updateNode(cardId, node.id, nextBounds);
				onGuidesChange(result.guides);
			});
		}

		function stopResizing() {
			finishInteraction();
			useEditorStore.getState().endHistoryTransaction(cardId);
			target.removeEventListener("pointermove", resizeNode);
			target.removeEventListener("pointerup", stopResizing);
			target.removeEventListener("pointercancel", stopResizing);
		}

		target.addEventListener("pointermove", resizeNode);
		target.addEventListener("pointerup", stopResizing);
		target.addEventListener("pointercancel", stopResizing);
	}

	return (
		<div
			ref={nodeRef}
			data-editor-node
			className={cn(
				"absolute m-0 touch-none bg-transparent p-0 text-left transition-[box-shadow]",
				isSelected
					? "ring-1 ring-accent/45 shadow-[0_0_0_1px_rgba(255,255,255,.55)]"
					: "hover:ring-1 hover:ring-accent/25",
			)}
			style={{
				left: node.x,
				top: node.y,
				width: node.width,
				height: node.height,
				transform: `rotate(${node.rotation ?? 0}deg)`,
				zIndex: (layerIndex + 1) * 5,
			}}
		>
			{node.type === "text" ? (
				<TextNode
					cardId={cardId}
					node={node}
					previewText={previewText}
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
					{(
						[
						[
								"ne",
								"top-0 right-0 size-2.5 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
							],
							[
								"se",
								"right-0 bottom-0 size-2.5 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
							],
							[
								"sw",
								"bottom-0 left-0 size-2.5 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
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
							aria-label={`Resize ${node.type} node from ${direction}`}
							className={cn(
								"absolute z-30 touch-none rounded-[2px] bg-accent/60 p-0 shadow-sm outline-none",
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
