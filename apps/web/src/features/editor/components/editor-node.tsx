import { ImageIcon, X } from "lucide-react";
import type { MouseEvent, PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

import {
	deleteEditorImage,
	getEditorImage,
	replaceEditorImage,
} from "#/db/image-db";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { EditorNode as EditorNodeData } from "#/features/editor/types";
import { cn } from "#/lib/utils";

type EditorNodeProps = {
	cardId: string;
	cardWidth: number;
	zoom: number;
	node: EditorNodeData;
	isSelected: boolean;
};

export function EditorNode({
	cardId,
	cardWidth,
	zoom,
	node,
	isSelected,
}: EditorNodeProps) {
	const selectNode = useEditorStore((state) => state.selectNode);
	const nodeRef = useRef<HTMLDivElement>(null);
	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const [isEditingText, setIsEditingText] = useState(false);
	const [isReplacingImage, setIsReplacingImage] = useState(false);
	const storedImageUrl = useStoredImageUrl(
		node.type === "image" ? node.imageId : null,
	);
	const imageUrl = node.type === "image" ? node.src || storedImageUrl : "";
	const isTextEditing = node.type === "text" && isSelected && isEditingText;

	useEffect(() => {
		if (isTextEditing) textAreaRef.current?.focus();
	}, [isTextEditing]);

	useEffect(() => {
		if (!isSelected && isEditingText) setIsEditingText(false);
	}, [isEditingText, isSelected]);

	function startDragging(event: PointerEvent<HTMLElement>) {
		event.stopPropagation();
		selectNode(cardId, node.id);

		const origin = {
			pointerX: event.clientX,
			pointerY: event.clientY,
			x: node.x,
			y: node.y,
		};
		const target = event.currentTarget;
		target.setPointerCapture(event.pointerId);

		function moveNode(moveEvent: globalThis.PointerEvent) {
			useEditorStore.getState().updateNode(cardId, node.id, {
				x: origin.x + (moveEvent.clientX - origin.pointerX) / zoom,
				y: origin.y + (moveEvent.clientY - origin.pointerY) / zoom,
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

	function startResizing(event: PointerEvent<HTMLButtonElement>) {
		event.preventDefault();
		event.stopPropagation();
		selectNode(cardId, node.id);

		const measuredWidth = nodeRef.current?.getBoundingClientRect().width;
		const origin = {
			pointerX: event.clientX,
			pointerY: event.clientY,
			width:
				measuredWidth && measuredWidth > 0 ? measuredWidth / zoom : node.width,
			height: node.height,
		};
		const target = event.currentTarget;
		target.setPointerCapture(event.pointerId);

		function resizeNode(moveEvent: globalThis.PointerEvent) {
			const deltaX = (moveEvent.clientX - origin.pointerX) / zoom;
			const deltaY = (moveEvent.clientY - origin.pointerY) / zoom;

			useEditorStore.getState().updateNode(cardId, node.id, {
				width: Math.max(24, origin.width + deltaX),
				height: Math.max(24, origin.height + deltaY),
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
		selectNode(cardId, node.id);

		const origin = {
			pointerX: event.clientX,
			width: node.width,
		};
		const target = event.currentTarget;
		target.setPointerCapture(event.pointerId);

		function resizeWidth(moveEvent: globalThis.PointerEvent) {
			const maximumWidth = cardWidth - node.x - 8;
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

	async function replaceImage(file: File) {
		if (node.type !== "image") return;

		setIsReplacingImage(true);
		try {
			const imageId = await replaceEditorImage(file, node.imageId);
			useEditorStore.getState().updateNode(cardId, node.id, {
				imageId,
				src: "",
				alt: node.alt || file.name.replace(/\.[^.]+$/, ""),
			});
		} finally {
			setIsReplacingImage(false);
		}
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
				"absolute m-0 touch-none bg-transparent p-0 text-left",
				isSelected
					? "z-20 ring-2 ring-blue-500 ring-offset-1"
					: "z-10 hover:ring-1 hover:ring-blue-400/60",
			)}
			style={{
				left: node.x,
				top: node.y,
				width: node.width,
				height: node.height,
			}}
		>
			{node.type === "text" ? (
				<textarea
					ref={textAreaRef}
					aria-label="Edit text node"
					aria-readonly={!isTextEditing}
					readOnly={!isTextEditing}
					rows={1}
					value={node.text}
					data-font-type={node.fontType}
					className={cn(
						"block size-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none whitespace-pre-wrap [overflow-wrap:anywhere]",
						isTextEditing
							? "cursor-text select-text"
							: "cursor-move select-none",
					)}
					style={{
						fontSize: node.fontSize,
						fontWeight: node.fontWeight,
						lineHeight: node.lineHeight,
						color: node.color,
						WebkitTextFillColor: node.color,
						textAlign: node.textAlign,
					}}
					onChange={(event) =>
						useEditorStore.getState().updateNode(cardId, node.id, {
							text: event.target.value,
						})
					}
					onClick={(event) => {
						event.stopPropagation();
						selectNode(cardId, node.id);
					}}
					onDoubleClick={(event) => {
						event.stopPropagation();
						selectNode(cardId, node.id);
						setIsEditingText(true);
					}}
					onBlur={() => setIsEditingText(false)}
					onKeyDown={(event) => {
						if (event.key === "Escape") event.currentTarget.blur();
					}}
					onPointerDown={(event) => {
						if (isTextEditing) {
							event.stopPropagation();
							return;
						}
						startDragging(event);
					}}
				/>
			) : (
				<button
					type="button"
					aria-label="Select image node"
					aria-pressed={isSelected}
					className="size-full overflow-hidden border-0 bg-transparent p-0 text-left outline-none"
					onClick={(event) => {
						event.stopPropagation();
						selectNode(cardId, node.id);
					}}
					onPointerDown={startDragging}
					onDoubleClick={(event) => {
						event.stopPropagation();
						imageInputRef.current?.click();
					}}
				>
					{imageUrl ? (
						<img
							className="pointer-events-none size-full"
							src={imageUrl}
							alt={node.alt}
							style={{ objectFit: node.objectFit, opacity: node.opacity }}
							draggable={false}
						/>
					) : (
						<span className="flex size-full flex-col items-center justify-center gap-2 border border-dashed border-black/20 bg-black/5 text-[10px] font-semibold tracking-wide text-black/45 uppercase">
							<ImageIcon className="size-5" />
							Add image URL
						</span>
					)}
				</button>
			)}
			{isSelected ? (
				<>
					<button
						type="button"
						aria-label={`Delete ${node.type} node from card`}
						className="absolute top-0 right-0 z-30 flex size-5 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-red-500 p-0 text-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
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
							className="absolute top-1/2 right-0 z-30 h-5 w-2 -translate-y-1/2 translate-x-1/2 cursor-ew-resize touch-none rounded-full border-2 border-white bg-blue-500 p-0 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
							onClick={(event) => event.stopPropagation()}
							onPointerDown={startWidthResizing}
						/>
					) : null}
					<button
						type="button"
						data-editor-node-resize-handle
						aria-label={
							node.type === "text" ? "Resize text node" : "Resize image node"
						}
						className="absolute right-0 bottom-0 z-30 size-3 translate-x-1/2 translate-y-1/2 cursor-nwse-resize touch-none rounded-[2px] border-2 border-white bg-blue-500 p-0 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
						onClick={(event) => event.stopPropagation()}
						onPointerDown={startResizing}
					/>
				</>
			) : null}
			{node.type === "image" ? (
				<input
					ref={imageInputRef}
					type="file"
					accept="image/*"
					aria-label="Replace image node file"
					className="sr-only"
					disabled={isReplacingImage}
					onClick={(event) => event.stopPropagation()}
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (file) void replaceImage(file);
						event.target.value = "";
					}}
				/>
			) : null}
		</div>
	);
}

function useStoredImageUrl(imageId: string | null) {
	const [objectUrl, setObjectUrl] = useState("");

	useEffect(() => {
		if (!imageId) {
			setObjectUrl("");
			return;
		}

		let isActive = true;
		let nextObjectUrl = "";

		void getEditorImage(imageId).then((image) => {
			if (!image || !isActive) return;
			nextObjectUrl = URL.createObjectURL(image.blob);
			setObjectUrl(nextObjectUrl);
		});

		return () => {
			isActive = false;
			if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
		};
	}, [imageId]);

	return objectUrl;
}
