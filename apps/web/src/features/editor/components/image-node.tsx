import { ImageIcon } from "lucide-react";
import type { PointerEvent } from "react";
import { useRef, useState } from "react";

import { replaceEditorImage } from "#/db/image-db";
import { useStoredImageUrl } from "#/features/editor/hooks/use-stored-image-url";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { ImageNode as ImageNodeData } from "#/features/editor/types";

type ImageNodeProps = {
	cardId: string;
	node: ImageNodeData;
	isSelected: boolean;
	onSelect: () => void;
	onStartDragging: (event: PointerEvent<HTMLElement>) => void;
};

export function ImageNode({
	cardId,
	node,
	isSelected,
	onSelect,
	onStartDragging,
}: ImageNodeProps) {
	const imageInputRef = useRef<HTMLInputElement>(null);
	const [isReplacing, setIsReplacing] = useState(false);
	const storedImageUrl = useStoredImageUrl(node.imageId);
	const imageUrl = node.src || storedImageUrl;

	async function replaceImage(file: File) {
		setIsReplacing(true);
		try {
			const imageId = await replaceEditorImage(file, node.imageId);
			useEditorStore.getState().updateNode(cardId, node.id, {
				imageId,
				src: "",
				alt: node.alt || file.name.replace(/\.[^.]+$/, ""),
			});
		} finally {
			setIsReplacing(false);
		}
	}

	return (
		<>
			<button
				type="button"
				aria-label="Select image node"
				aria-pressed={isSelected}
				className="size-full overflow-hidden border-0 bg-transparent p-0 text-left outline-none"
				onClick={(event) => {
					event.stopPropagation();
					onSelect();
				}}
				onPointerDown={onStartDragging}
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
			<input
				ref={imageInputRef}
				type="file"
				accept="image/*"
				aria-label="Replace image node file"
				className="sr-only"
				disabled={isReplacing}
				onClick={(event) => event.stopPropagation()}
				onChange={(event) => {
					const file = event.target.files?.[0];
					if (file) void replaceImage(file);
					event.target.value = "";
				}}
			/>
		</>
	);
}
