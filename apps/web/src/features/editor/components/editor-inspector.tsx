import { X } from "lucide-react";

import { Button } from "#/components/ui/button";
import { CardInspector } from "#/features/editor/components/card-inspector";
import { NoSelectionPanel } from "#/features/editor/components/no-selection-panel";
import { NodeInspector } from "#/features/editor/components/node-inspector";
import { useEditorStore } from "#/features/editor/store/editor-store";

type EditorInspectorProps = {
	onClose: () => void;
};

export function EditorInspector({ onClose }: EditorInspectorProps) {
	const selectedCard = useEditorStore((state) =>
		state.cards.find((card) => card.id === state.selectedCardId),
	);
	const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
	const selectedNode = selectedCard?.nodes.find(
		(node) => node.id === selectedNodeId,
	);

	return (
		<aside className="fixed top-1 right-1 bottom-2.5 z-40 flex min-h-0 max-h-dvh  flex-col pt-3 overflow-hidden rounded-2xl border bg-surface-wash w-[min(25rem,calc(100vw-1.25rem))] shadow-inset  backdrop-blur-3xl">
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
			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto ">
				{selectedCard && selectedNode ? (
					<NodeInspector card={selectedCard} node={selectedNode} />
				) : selectedCard ? (
					<CardInspector card={selectedCard} />
				) : (
					<NoSelectionPanel />
				)}
			</div>
		</aside>
	);
}
