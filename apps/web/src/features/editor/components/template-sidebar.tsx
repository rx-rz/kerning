import { LayoutTemplate, SwatchBook, X } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/button";
import { ShapeGraphic } from "#/features/editor/components/shape-node";
import {
	EDITOR_TEMPLATES,
	type EditorTemplate,
} from "#/features/editor/lib/editor-templates";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { EditorNode } from "#/features/editor/types";
import { cn } from "#/lib/utils";

type TemplateFilter = "All" | EditorTemplate["category"];

export function TemplateSidebar({
	cardId,
	onClose,
}: {
	cardId: string;
	onClose: () => void;
}) {
	const [filter, setFilter] = useState<TemplateFilter>("All");
	const applyTemplate = useEditorStore((state) => state.applyTemplate);
	const templates = EDITOR_TEMPLATES.filter(
		(template) => filter === "All" || template.category === filter,
	);

	return (
		<aside className="fixed top-2 bottom-2 left-2 z-60 flex w-[min(24rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
			<header className="flex items-center gap-3 border-b border-hairline px-4 py-4">
				<span className="flex size-9 items-center justify-center rounded-lg bg-accent text-background">
					<SwatchBook className="size-4" />
				</span>
				<div>
					<h2 className="text-sm font-semibold">Templates</h2>
					<p className="mt-0.5 text-[10px] text-muted-foreground">
						Editable arrangements of nodes
					</p>
				</div>
				<Button
					type="button"
					aria-label="Close templates"
					variant="ghost"
					size="icon-sm"
					className="ml-auto"
					onClick={onClose}
				>
					<X />
				</Button>
			</header>
			<div className="flex gap-1 border-b border-hairline p-3">
				{(["All", "Album covers", "Movie posters"] as const).map((item) => (
					<button
						key={item}
						type="button"
						aria-pressed={filter === item}
						className="rounded-md border border-hairline px-2.5 py-1.5 text-[10px] font-semibold aria-pressed:border-foreground aria-pressed:bg-accent aria-pressed:text-background"
						onClick={() => setFilter(item)}
					>
						{item}
					</button>
				))}
			</div>
			<div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto p-3">
				{templates.map((template) => (
					<button
						key={template.id}
						type="button"
						className="group flex flex-col rounded-xl border border-hairline bg-surface-wash p-2 text-left shadow-[0_8px_20px_rgba(15,23,42,.06)] transition-transform hover:-translate-y-0.5"
						onClick={() => applyTemplate(cardId, template.card)}
					>
						<TemplatePreview template={template} />
						<span className="mt-2 flex w-full items-center gap-2 px-1">
							<span className="min-w-0 flex-1 truncate text-[11px] font-semibold">
								{template.name}
							</span>
							<span className="font-mono text-[8px] text-muted-foreground">
								{template.aspectRatio}
							</span>
						</span>
					</button>
				))}
			</div>
		</aside>
	);
}

function TemplatePreview({ template }: { template: EditorTemplate }) {
	const { card } = template;
	const scale = template.aspectRatio === "1:1" ? 0.28 : 0.275;

	return (
		<span
			className={cn(
				"relative mx-auto block overflow-hidden rounded-md border border-black/10 shadow-sm",
				template.aspectRatio === "1:1" ? "size-[140px]" : "h-44 w-[99px]",
			)}
			style={{
				backgroundColor:
					card.settings.fill.type === "solid"
						? card.settings.fill.color
						: "#FFFFFF",
			}}
		>
			<span
				className="absolute top-0 left-0 block origin-top-left"
				style={{ width: card.width, height: card.height, transform: `scale(${scale})` }}
			>
				{card.nodes.map((node) => (
					<TemplateNodePreview key={node.id} node={node} />
				))}
			</span>
		</span>
	);
}

function TemplateNodePreview({ node }: { node: EditorNode }) {
	const style = {
		left: node.x,
		top: node.y,
		width: node.width,
		height: node.height,
	} as const;

	if (node.type === "text") {
		return (
			<span
				className="absolute overflow-hidden whitespace-pre-wrap"
				style={{
					...style,
					fontSize: node.fontSize,
					fontWeight: node.fontWeight,
					lineHeight: node.lineHeight,
					letterSpacing: node.letterSpacing,
					color: node.color,
					textAlign: node.textAlign,
				}}
			>
				{node.text}
			</span>
		);
	}

	if (node.type === "shape") {
		return (
			<span className="absolute flex items-center justify-center" style={style}>
				<ShapeGraphic node={node} />
			</span>
		);
	}

	return null;
}
