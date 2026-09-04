import { Shapes } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "#/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { ShapeGraphic } from "#/features/editor/components/shape-node";
import {
	SHAPE_CATEGORIES,
	SHAPE_LIBRARY,
} from "#/features/editor/lib/shape-library";
import { useEditorStore } from "#/features/editor/store/editor-store";
import { cn } from "#/lib/utils";

const cardControlClassName =
	"relative inline-flex size-8 items-center justify-center gap-1.5 rounded-full border border-hairline bg-paper px-3 font-mono text-[10px] font-medium leading-none tracking-[0.08em] text-ink uppercase shadow-[0_1px_0_rgba(20,20,20,0.04)] transition-[background-color,border-color,transform] duration-150 ease-[ease] hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--ink)_28%,transparent)] hover:bg-paper-soft focus-visible:outline-2 focus-visible:outline-[color-mix(in_srgb,var(--ring)_45%,transparent)] focus-visible:outline-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-[0.42] after:pointer-events-none after:absolute after:top-[calc(100%+0.45rem)] after:left-1/2 after:z-[90] after:w-max after:max-w-40 after:-translate-x-1/2 after:-translate-y-[0.2rem] after:rounded-md after:bg-foreground after:px-[0.45rem] after:py-[0.3rem] after:font-sans after:text-[0.625rem] after:font-semibold after:leading-4 after:whitespace-nowrap after:text-background after:opacity-0 after:content-[attr(data-tooltip)] after:transition-[opacity,transform] after:duration-150 after:ease-[ease] hover:after:translate-y-0 hover:after:opacity-100 focus-visible:after:translate-y-0 focus-visible:after:opacity-100";

export function ShapePicker({
	cardId,
	cardName,
}: {
	cardId: string;
	cardName: string;
}) {
	const addShapeNode = useEditorStore((state) => state.addShapeNode);
	const [category, setCategory] = useState(SHAPE_CATEGORIES[0] ?? "Lines");
	const [query, setQuery] = useState("");
	const filteredShapes = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		return SHAPE_LIBRARY.filter(
			(item) =>
				item.category === category &&
				(!normalizedQuery ||
					item.label.toLowerCase().includes(normalizedQuery)),
		);
	}, [category, query]);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label={`Add shape to ${cardName}`}
					className={cardControlClassName}
					data-tooltip="Add shape"
					onClick={(event) => event.stopPropagation()}
				>
					<Shapes className="size-3" />
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				className="z-70 flex max-h-[min(34rem,80vh)] w-80 flex-col gap-2 p-3"
				onClick={(event) => event.stopPropagation()}
			>
				<div>
					<p className="text-xs font-semibold">Shapes</p>
					<p className="mt-1 text-[10px] text-muted-foreground">
						{SHAPE_LIBRARY.length} editable symbols
					</p>
				</div>
				<Input
					aria-label="Search shapes"
					placeholder="Search shapes"
					className="min-h-10 py-2"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
				/>
				<div className="flex gap-1 overflow-x-auto pb-1">
					{SHAPE_CATEGORIES.map((item) => (
						<button
							key={item}
							type="button"
							aria-pressed={category === item}
							className="shrink-0 rounded-md border border-hairline px-2 py-1 text-[10px] font-semibold aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
							onClick={() => setCategory(item)}
						>
							{item}
						</button>
					))}
				</div>
				<div className="grid min-h-0 grid-cols-5 auto-rows-[3rem] gap-1 overflow-y-auto pr-1">
					{filteredShapes.map((item) => (
						<button
							key={item.id}
							type="button"
							aria-label={item.label}
							title={item.label}
							className={cn(
								"flex size-12 items-center justify-center overflow-hidden rounded-lg border border-hairline bg-white p-0 text-foreground",
								"transition-[border-color,transform] hover:border-foreground/30 hover:-translate-y-px",
							)}
							onClick={() =>
								addShapeNode(cardId, {
									shapeType: item.type,
									shape: item.value,
								})
							}
						>
							<span className="flex size-6 shrink-0 items-center justify-center overflow-hidden [container-type:size] [&>*]:max-h-full [&>*]:max-w-full">
								<ShapeGraphic
									node={{
										shapeType: item.type,
										shape: item.value,
										color: "currentColor",
										strokeWidth: 1,
									}}
									className="size-6 max-h-6 max-w-6"
								/>
							</span>
						</button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
