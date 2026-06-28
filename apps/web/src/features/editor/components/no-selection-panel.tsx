import { MousePointer2 } from "lucide-react";

export function NoSelectionPanel() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
			<div className="flex size-10 items-center justify-center rounded-lg border bg-surface-wash text-muted-foreground">
				<MousePointer2 className="size-4" />
			</div>
			<h2 className="mt-4 text-sm font-semibold">No card selected</h2>
			<p className="mt-1 max-w-48 text-xs leading-5 text-muted-foreground">
				Select a card on the canvas or from the card slider to edit it.
			</p>
		</div>
	);
}
