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
					className="flex h-6 items-center gap-1 rounded-md bg-primary px-2 text-[10px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/80"
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
