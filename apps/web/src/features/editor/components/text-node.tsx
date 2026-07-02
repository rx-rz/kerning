import type { PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { useEditorStore } from "#/features/editor/store/editor-store";
import type { TextNode as TextNodeData } from "#/features/editor/types";
import { cn } from "#/lib/utils";

type TextNodeProps = {
	cardId: string;
	node: TextNodeData;
	isSelected: boolean;
	onSelect: () => void;
	onStartDragging: (event: PointerEvent<HTMLElement>) => void;
};

export function TextNode({
	cardId,
	node,
	isSelected,
	onSelect,
	onStartDragging,
}: TextNodeProps) {
	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const [isEditing, setIsEditing] = useState(false);
	const isTextEditing = isSelected && isEditing;

	useEffect(() => {
		if (isTextEditing) textAreaRef.current?.focus();
	}, [isTextEditing]);

	useEffect(() => {
		if (!isSelected && isEditing) setIsEditing(false);
	}, [isEditing, isSelected]);

	return (
		<textarea
			ref={textAreaRef}
			aria-label="Edit text node"
			aria-readonly={!isTextEditing}
			readOnly={!isTextEditing}
			rows={1}
			value={node.text}
			data-font-type={node.fontType}
			className={cn(
				"block size-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none whitespace-pre-wrap wrap-anywhere",
				isTextEditing ? "cursor-text select-text" : "cursor-move select-none",
			)}
			style={{
				fontSize: node.fontSize,
				fontWeight: node.fontWeight,
				lineHeight: node.lineHeight,
				letterSpacing: node.letterSpacing,
				color: node.color,
				WebkitTextFillColor: node.color,
				textAlign: node.textAlign,
				textTransform: node.textCasing,
			}}
			onChange={(event) =>
				useEditorStore.getState().updateNode(cardId, node.id, {
					text: event.target.value,
				})
			}
			onClick={(event) => {
				event.stopPropagation();
				onSelect();
			}}
			onDoubleClick={(event) => {
				event.stopPropagation();
				onSelect();
				setIsEditing(true);
			}}
			onBlur={() => setIsEditing(false)}
			onKeyDown={(event) => {
				if (event.key === "Escape") event.currentTarget.blur();
			}}
			onPointerDown={(event) => {
				if (isTextEditing) {
					event.stopPropagation();
					return;
				}
				onStartDragging(event);
			}}
		/>
	);
}
