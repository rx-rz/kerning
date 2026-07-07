import type { ProjectFontEntity } from "@kerning/shared";
import { X } from "lucide-react";

import { Button } from "#/components/ui/button";
import { CardInspector } from "#/features/editor/components/card-inspector";
import { NoSelectionPanel } from "#/features/editor/components/no-selection-panel";
import { NodeInspector } from "#/features/editor/components/node-inspector";
import { useEditorStore } from "#/features/editor/store/editor-store";

type EditorInspectorProps = {
	onClose: () => void;
	fonts?: Partial<Record<"primary" | "sec1" | "sec2", ProjectFontEntity>>;
};

export function EditorInspector({ onClose, fonts }: EditorInspectorProps) {
	const selectedCard = useEditorStore((state) =>
		state.cards.find((card) => card.id === state.selectedCardId),
	);
	const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
	const selectedNode = selectedCard?.nodes.find(
		(node) => node.id === selectedNodeId,
	);

	return (
		<aside className="fixed top-2 right-2 bottom-2 z-40 flex min-h-0 max-h-dvh w-[min(23rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-white/60 bg-surface-glass pt-2 shadow-[0_20px_60px_rgba(15,23,42,0.14)] backdrop-blur-3xl">
			<Button
				type="button"
				aria-label="Close inspector"
				variant="ghost"
				size="icon-sm"
				className="absolute top-3 right-3 z-10"
				onClick={onClose}
			>
				<X />
			</Button>
			<div className="mt-8 flex min-h-0 flex-1 flex-col overflow-y-auto">
				{selectedCard && selectedNode ? (
					<NodeInspector
						card={selectedCard}
						node={selectedNode}
						fonts={fonts}
					/>
				) : selectedCard ? (
					<CardInspector card={selectedCard} />
				) : (
					<NoSelectionPanel />
				)}
			</div>
		</aside>
	);
}
