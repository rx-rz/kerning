import useEmblaCarousel from "embla-carousel-react";
import {
	ChevronLeft,
	ChevronRight,
	Plus,
	RectangleHorizontal,
	RotateCcw,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "#/components/ui/button";
import { CardTickNavigator } from "#/features/editor/components/card-tick-navigator";
import { EditorCard } from "#/features/editor/components/editor-card";
import { useEditorStore } from "#/features/editor/store/editor-store";

type EditorCanvasProps = {
	onToggleInspector?: () => void;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

export function EditorCanvas({ onToggleInspector }: EditorCanvasProps) {
	const [zoom, setZoom] = useState(1);
	const cards = useEditorStore((state) => state.cards);
	const selectedCardId = useEditorStore((state) => state.selectedCardId);
	const selectCard = useEditorStore((state) => state.selectCard);
	const addCard = useEditorStore((state) => state.addCard);
	const deleteCard = useEditorStore((state) => state.deleteCard);
	const resetEditor = useEditorStore((state) => state.resetEditor);
	const [emblaRef, emblaApi] = useEmblaCarousel({
		align: "center",
		containScroll: false,
		duration: 32,
		skipSnaps: false,
		watchDrag: (_emblaApi, event) => {
			const target = event.target as HTMLElement | null;
			return !target?.closest?.("[data-editor-node]");
		},
	});
	const lastWheelNavigationAt = useRef(0);
	const selectedIndex = cards.findIndex((card) => card.id === selectedCardId);
	const hasPreviousCard = selectedIndex > 0;
	const hasNextCard = selectedIndex >= 0 && selectedIndex < cards.length - 1;
	const zoomPercentage = Math.round(zoom * 100);

	const syncSelectionFromCarousel = useCallback(() => {
		if (!emblaApi) {
			return;
		}

		const card = cards[emblaApi.selectedScrollSnap()];
		const currentSelectedCardId = useEditorStore.getState().selectedCardId;

		if (card && card.id !== currentSelectedCardId) {
			selectCard(card.id);
		}
	}, [cards, emblaApi, selectCard]);

	useEffect(() => {
		if (!emblaApi) {
			return;
		}

		emblaApi.on("select", syncSelectionFromCarousel);

		return () => {
			emblaApi.off("select", syncSelectionFromCarousel);
		};
	}, [emblaApi, syncSelectionFromCarousel]);

	useEffect(() => {
		if (!emblaApi || !selectedCardId) {
			return;
		}

		const nextIndex = cards.findIndex((card) => card.id === selectedCardId);

		if (nextIndex >= 0 && nextIndex !== emblaApi.selectedScrollSnap()) {
			emblaApi.scrollTo(nextIndex);
		}
	}, [cards, emblaApi, selectedCardId]);

	function selectCardAt(index: number) {
		const card = cards[index];

		if (card) {
			selectCard(card.id);
		}
	}

	function addAndSelectCard() {
		addCard();
	}

	function resetAndSelectCard() {
		resetEditor();
	}

	function adjustZoom(direction: -1 | 1) {
		setZoom((currentZoom) =>
			Math.min(
				MAX_ZOOM,
				Math.max(
					MIN_ZOOM,
					Math.round((currentZoom + direction * ZOOM_STEP) * 10) / 10,
				),
			),
		);
	}

	function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
		const delta =
			Math.abs(event.deltaX) > Math.abs(event.deltaY)
				? event.deltaX
				: event.deltaY;

		if (event.ctrlKey || event.metaKey) {
			event.preventDefault();
			adjustZoom(delta < 0 ? 1 : -1);
			return;
		}

		if (Math.abs(delta) < 6) {
			return;
		}

		event.preventDefault();

		const now = Date.now();

		if (now - lastWheelNavigationAt.current < 180) {
			return;
		}

		lastWheelNavigationAt.current = now;
		selectCardAt(selectedIndex + (delta > 0 ? 1 : -1));
	}

	return (
		<section
			aria-label="Editor preview"
			className="relative h-full min-h-0 overflow-hidden backdrop-blur-xl"
			onClick={() => selectCard(null)}
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					selectCard(null);
				}
			}}
			tabIndex={-1}
		>
			{cards.length ? (
				<section
					ref={emblaRef}
					aria-label="Scrollable cards"
					className="h-full touch-pan-y overflow-x-hidden scrollbar-none"
					onWheel={handleWheel}
				>
					<div className="flex min-h-full items-center gap-12 px-16 pt-20 pb-28">
						{cards.map((card) => (
							<div key={card.id} className="flex-[0_0_auto]">
								<EditorCard
									card={card}
									zoom={zoom}
									isSelected={card.id === selectedCardId}
									onSelect={selectCard}
									onToggleSettings={onToggleInspector}
									onDelete={deleteCard}
								/>
							</div>
						))}
					</div>
				</section>
			) : (
				<div className="flex h-full flex-col items-center justify-center px-8 pb-16 text-center">
					<div className="flex size-12 items-center justify-center rounded-xl border border-black/10 text-muted-foreground">
						<RectangleHorizontal className="size-5" />
					</div>
					<h2 className="mt-5 text-base font-semibold">No cards yet</h2>
					<p className="mt-1 max-w-64 text-sm leading-6 text-muted-foreground">
						Add a card to start building this project.
					</p>
					<Button
						type="button"
						aria-label="Add your first card"
						className="mt-5"
						onClick={(event) => {
							event.stopPropagation();
							addAndSelectCard();
						}}
					>
						<Plus />
						Add Card
					</Button>
				</div>
			)}

			<CardTickNavigator />

			{cards.length ? (
				<div
					aria-label="Card navigation"
					className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-white/80 bg-white/80 p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl"
					onClick={(event) => event.stopPropagation()}
					onKeyDown={(event) => event.stopPropagation()}
					role="toolbar"
				>
					<Button
						type="button"
						aria-label="Previous card"
						variant="ghost"
						size="icon-sm"
						disabled={!hasPreviousCard}
						onClick={() => selectCardAt(selectedIndex - 1)}
					>
						<ChevronLeft />
					</Button>
					<span className="min-w-12 text-center font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
						{selectedIndex >= 0 ? selectedIndex + 1 : 0} / {cards.length}
					</span>
					<Button
						type="button"
						aria-label="Next card"
						variant="ghost"
						size="icon-sm"
						disabled={!hasNextCard}
						onClick={() => selectCardAt(selectedIndex + 1)}
					>
						<ChevronRight />
					</Button>
					<div className="mx-1 h-5 w-px bg-border" />
					<Button
						type="button"
						aria-label="Add Card"
						variant="ghost"
						size="icon-sm"
						onClick={addAndSelectCard}
					>
						<Plus />
					</Button>
					<Button
						type="button"
						aria-label="Reset"
						variant="ghost"
						size="icon-sm"
						onClick={resetAndSelectCard}
					>
						<RotateCcw />
					</Button>
					<div className="mx-1 h-5 w-px bg-border" />
					<Button
						type="button"
						aria-label="Zoom out"
						variant="ghost"
						size="icon-sm"
						disabled={zoom <= MIN_ZOOM}
						onClick={() => adjustZoom(-1)}
					>
						<ZoomOut />
					</Button>
					<button
						type="button"
						aria-label={`Reset zoom from ${zoomPercentage}%`}
						className="min-w-11 rounded-md px-1 py-1 font-mono text-[10px] font-semibold tabular-nums text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						onClick={() => setZoom(1)}
					>
						{zoomPercentage}%
					</button>
					<Button
						type="button"
						aria-label="Zoom in"
						variant="ghost"
						size="icon-sm"
						disabled={zoom >= MAX_ZOOM}
						onClick={() => adjustZoom(1)}
					>
						<ZoomIn />
					</Button>
				</div>
			) : null}
		</section>
	);
}
