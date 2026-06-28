import { useEditorStore } from "#/features/editor/store/editor-store";
import { cn } from "#/lib/utils";

export function CardTickNavigator() {
	const cards = useEditorStore((state) => state.cards);
	const selectedCardId = useEditorStore((state) => state.selectedCardId);
	const selectCard = useEditorStore((state) => state.selectCard);

	if (!cards.length) {
		return null;
	}

	return (
		<nav
			aria-label="Card slider"
			className="group absolute top-1/2 left-5 z-20 flex -translate-y-1/2 flex-col gap-0.5 rounded-xl py-2 pr-3 pl-2 transition-[background-color,box-shadow,backdrop-filter] hover:bg-white/72 hover:shadow-[0_12px_32px_rgba(15,23,42,0.1)] hover:backdrop-blur-xl focus-within:bg-white/72 focus-within:shadow-[0_12px_32px_rgba(15,23,42,0.1)] focus-within:backdrop-blur-xl"
			onClick={(event) => event.stopPropagation()}
			onKeyDown={(event) => event.stopPropagation()}
		>
			{cards.map((card, index) => {
				const isSelected = card.id === selectedCardId;

				return (
					<button
						type="button"
						key={card.id}
						aria-label={`Go to ${card.name}`}
						aria-current={isSelected ? "true" : undefined}
						className="flex h-5 min-w-5 items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
						onClick={() => selectCard(card.id)}
					>
						<span
							className={cn(
								"h-px shrink-0 bg-foreground/35 transition-[width,background-color,height]",
								index % 5 === 0 ? "w-5" : "w-3",
								isSelected && "h-0.5 w-6 bg-foreground",
							)}
						/>
						<span
							className={cn(
								"pointer-events-none max-w-0 -translate-x-1 overflow-hidden whitespace-nowrap text-xs opacity-0 transition-[max-width,opacity,transform] duration-200 group-hover:max-w-44 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:max-w-44 group-focus-within:translate-x-0 group-focus-within:opacity-100",
								isSelected
									? "font-semibold text-foreground"
									: "text-muted-foreground",
							)}
						>
							{card.name}
						</span>
					</button>
				);
			})}
		</nav>
	);
}
