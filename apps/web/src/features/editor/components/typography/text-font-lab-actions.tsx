import { useMemo } from "react";
import { Button } from "#/components/ui/button";
import { useFontLabContextStore } from "#/features/editor/font-lab-bridge/font-lab-context.store";
import type { FontLabLaunchContext } from "#/features/editor/font-lab-bridge/font-lab-context.types";
import { resolveSelectedTextFontContext } from "#/features/editor/font-lab-bridge/selected-text-font-context";
import { selectedWordFromRange } from "#/features/editor/font-lab-bridge/text-selection";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { EditorCard, TextNode } from "#/features/editor/types";

const ROLE_LABELS = {
	primary: "Display",
	"secondary-one": "Text",
	"secondary-two": "Accent",
} as const;

export function TextFontLabActions({
	card,
	node,
	className,
}: {
	card: EditorCard;
	node: TextNode;
	className?: string;
}) {
	const fontSystem = useEditorStore((state) => state.fontSystem);
	const fonts = useEditorStore((state) => state.projectFonts);
	const open = useFontLabContextStore((state) => state.open);
	const editorSelection = useFontLabContextStore((state) =>
		state.editorSelection?.cardId === card.id &&
		state.editorSelection.nodeId === node.id
			? state.editorSelection
			: null,
	);
	const context = useMemo(
		() => resolveSelectedTextFontContext({ card, node, fontSystem, fonts }),
		[card, node, fontSystem, fonts],
	);
	const selectedCharacters = Array.from(editorSelection?.text ?? "");
	const selectedWord = selectedWordFromRange(
		node.text,
		editorSelection?.start,
		editorSelection?.end,
	);

	if (!context) {
		return (
			<Button
				className={`text-white shadow-none ${className ?? ""}`}
				variant="accent"
				disabled
			>
				Open Type Lens
			</Button>
		);
	}

	function launch() {
		if (!context) return;
		const role =
			context.role ??
			(node.fontType === "sec1"
				? "secondary-one"
				: node.fontType === "sec2"
					? "secondary-two"
					: "primary");
		const selectedCodePoint =
			selectedCharacters.length === 1
				? selectedCharacters[0]?.codePointAt(0)
				: undefined;
		const selection: FontLabLaunchContext["selection"] = editorSelection
			? {
					type: "text-range",
					text: editorSelection.text,
					start: editorSelection.start,
					end: editorSelection.end,
				}
			: { type: "node", text: node.text };

		open({
			surface: "word",
			source: { type: "text-node", cardId: card.id, nodeId: node.id },
			fontId: context.fontId,
			variantId: context.variantId,
			role,
			sampleText: node.text,
			selection,
			selectedCodePoint,
			selectedWord,
			returnTarget: { cardId: card.id, nodeId: node.id },
			sourceLabel: `${card.name} · ${ROLE_LABELS[role]}`,
			textStyle: {
				fontSize: node.fontSize,
				fontWeight: node.fontWeight,
				fontStyle: "normal",
				lineHeight: node.lineHeight,
				letterSpacing: node.letterSpacing,
				textAlign: node.textAlign,
				textTransform: node.textCasing,
				containerWidth: node.width,
			},
			featureSettings: context.effectiveFeatureSettings,
			variationSettings: context.effectiveVariationSettings,
		});
	}

	return (
		<Button
			className={`text-white shadow-none hover:shadow-[0_8px_16px_rgba(68,87,253,.20)] ${className ?? ""}`}
			variant="accent"
			onClick={launch}
		>
			Open Type Lens
		</Button>
	);
}
