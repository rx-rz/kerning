import { PanelRightOpen } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "#/components/ui/button";
import { EditorCanvas } from "#/features/editor/components/editor-canvas";
import { EditorInspector } from "#/features/editor/components/editor-inspector";
import { useEditorStore } from "#/features/editor/store/editor-store";

export function EditorPage() {
	const [isInspectorOpen, setIsInspectorOpen] = useState(true);

	useEffect(() => {
		useEditorStore.persist.rehydrate();
	}, []);

	return (
		<main className="h-dvh min-w-240 overflow-hidden bg-surface-wash text-foreground">
			<EditorCanvas
				onToggleInspector={() => setIsInspectorOpen((isOpen) => !isOpen)}
			/>
			{isInspectorOpen ? (
				<EditorInspector onClose={() => setIsInspectorOpen(false)} />
			) : (
				<Button
					type="button"
					aria-label="Open inspector"
					variant="ghost"
					size="icon"
					className="fixed top-2.5 right-2.5 z-40 border border-hairline bg-white/90 shadow-hairline backdrop-blur-3xl"
					onClick={() => setIsInspectorOpen(true)}
				>
					<PanelRightOpen />
				</Button>
			)}
		</main>
	);
}
