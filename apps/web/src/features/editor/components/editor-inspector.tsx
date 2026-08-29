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
		<aside className="z-40 flex h-full min-h-0 w-[min(23rem,calc(100vw-1rem))] shrink-0 flex-col overflow-hidden border-l border-hairline bg-surface-glass">
			<header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline px-4">
				<h2 className="text-base font-semibold">Inspector</h2>
				<Button
					type="button"
					aria-label="Close inspector"
					variant="ghost"
					size="icon-sm"
					onClick={onClose}
				>
					<X />
				</Button>
			</header>
			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
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
