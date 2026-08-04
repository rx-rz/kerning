import type { PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFontLabContextStore } from "#/features/editor/font-lab-bridge/font-lab-context.store";
import {
	getFontFeatureSettingsCss,
	getFontVariationSettingsCss,
	resolveTextNodeFont,
} from "#/features/editor/font-system/font-system";
import { resolveCardFontRole } from "#/features/editor/lib/linked-cards";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { TextNode as TextNodeData } from "#/features/editor/types";
import { cn } from "#/lib/utils";

type TextNodeProps = {
	cardId: string;
	node: TextNodeData;
	previewText?: string;
	isSelected: boolean;
	onSelect: () => void;
	onStartDragging: (event: PointerEvent<HTMLElement>) => void;
};

export function TextNode({
	cardId,
	node,
	previewText,
	isSelected,
	onSelect,
	onStartDragging,
}: TextNodeProps) {
	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const [isEditing, setIsEditing] = useState(false);
	const isPreviewing = previewText !== undefined;
	const isTextEditing = isSelected && isEditing && !isPreviewing;
	const fontSystem = useEditorStore((state) => state.fontSystem);
	const projectFonts = useEditorStore((state) => state.projectFonts);
	const card = useEditorStore((state) =>
		state.cards.find(({ id }) => id === cardId),
	);
	const resolvedFont = useMemo(() => {
		const role =
			node.fontSource?.type === "role"
				? node.fontSource.role
				: node.fontSource
					? null
					: node.fontType === "sec1"
						? "secondary-one"
						: node.fontType === "sec2"
							? "secondary-two"
							: "primary";
		return card && role
			? resolveCardFontRole(card, role, fontSystem, projectFonts)
			: resolveTextNodeFont(node, fontSystem, projectFonts);
	}, [node, card, fontSystem, projectFonts]);
	const featureSettings = getFontFeatureSettingsCss({
		...(resolvedFont?.featureSettings ?? {}),
		...node.featureSettings,
	});
	const variationSettings = getFontVariationSettingsCss({
		...(resolvedFont?.variationSettings ?? {}),
		...node.variationSettings,
	});
	const guideOverlay = useFontLabContextStore((state) =>
		state.fontGuideOverlay?.cardId === cardId &&
		state.fontGuideOverlay.nodeId === node.id
			? state.fontGuideOverlay
			: null,
	);
	const setEditorSelection = useFontLabContextStore(
		(state) => state.setEditorSelection,
	);

	function captureSelection(element: HTMLTextAreaElement) {
		const start = element.selectionStart;
		const end = element.selectionEnd;
		setEditorSelection({
			cardId,
			nodeId: node.id,
			start,
			end,
			text: element.value.slice(start, end),
		});
	}

	useEffect(() => {
		if (isTextEditing) textAreaRef.current?.focus();
	}, [isTextEditing]);

	useEffect(() => {
		if (!isSelected && isEditing) setIsEditing(false);
	}, [isEditing, isSelected]);

	return (
		<>
			<textarea
				ref={textAreaRef}
				aria-label="Edit text node"
				aria-readonly={!isTextEditing}
				readOnly={!isTextEditing || isPreviewing}
				rows={1}
				value={previewText ?? node.text}
				data-content-stress-preview={isPreviewing || undefined}
				data-font-type={node.fontType}
				data-font-source={node.fontSource?.type ?? "legacy-role"}
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
					fontFamily: resolvedFont
						? `${JSON.stringify(resolvedFont.familyName)}, system-ui, sans-serif`
						: `var(--font-project-${node.fontType})`,
					fontFeatureSettings: featureSettings,
					fontVariationSettings: variationSettings,
				}}
				onChange={(event) => {
					const nextText = event.target.value;
					const characterWidth = Math.max(
						node.fontSize * 0.5 + Math.max(node.letterSpacing, 0),
						1,
					);
					const charactersPerLine = Math.max(
						1,
						Math.floor(node.width / characterWidth),
					);
					const lineCount = nextText
						.split("\n")
						.reduce(
							(lines, paragraph) =>
								lines +
								Math.max(1, Math.ceil(paragraph.length / charactersPerLine)),
							0,
						);
					const requiredHeight = Math.ceil(
						lineCount * node.fontSize * node.lineHeight + node.fontSize * 0.18,
					);

					useEditorStore.getState().updateNode(cardId, node.id, {
						text: nextText,
						height: Math.max(node.height, requiredHeight),
					});
				}}
				onClick={(event) => {
					event.stopPropagation();
					onSelect();
					captureSelection(event.currentTarget);
				}}
				onSelect={(event) => captureSelection(event.currentTarget)}
				onKeyUp={(event) => captureSelection(event.currentTarget)}
				onDoubleClick={(event) => {
					event.stopPropagation();
					onSelect();
					if (!isPreviewing) setIsEditing(true);
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
			{guideOverlay ? (
				<FontMetricGuides node={node} overlay={guideOverlay} />
			) : null}
		</>
	);
}

function FontMetricGuides({
	node,
	overlay,
}: {
	node: TextNodeData;
	overlay: NonNullable<
		ReturnType<typeof useFontLabContextStore.getState>["fontGuideOverlay"]
	>;
}) {
	const { metrics } = overlay;
	const emTop = Math.max(
		0,
		(node.fontSize * node.lineHeight - node.fontSize) / 2,
	);
	const baseline =
		emTop + (metrics.ascender / metrics.unitsPerEm) * node.fontSize;
	const guides = [
		[
			"Ascender",
			baseline - (metrics.ascender / metrics.unitsPerEm) * node.fontSize,
		],
		[
			"Cap height",
			baseline - (metrics.capHeight / metrics.unitsPerEm) * node.fontSize,
		],
		[
			"X-height",
			baseline - (metrics.xHeight / metrics.unitsPerEm) * node.fontSize,
		],
		["Baseline", baseline],
		[
			"Descender",
			baseline - (metrics.descender / metrics.unitsPerEm) * node.fontSize,
		],
	] as const;
	return (
		<div
			data-font-guide-overlay
			role="img"
			aria-label={`Font metric guides${overlay.estimated ? ", estimated" : ""}`}
			className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
		>
			{guides.map(([label, top], index) => (
				<div
					key={label}
					className="absolute inset-x-0 border-t border-dashed border-accent/55"
					style={{ top }}
				>
					<span className="absolute right-0 -top-3 rounded-sm bg-background/85 px-1 font-mono text-[7px] uppercase text-accent">
						{label}
						{index === 0 && overlay.estimated ? " · Estimated" : ""}
					</span>
				</div>
			))}
		</div>
	);
}
