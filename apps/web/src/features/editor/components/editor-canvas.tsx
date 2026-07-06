import useEmblaCarousel from "embla-carousel-react";
import {
	ChevronLeft,
	ChevronRight,
	Info,
	Languages,
	Lock,
	LockOpen,
	Plus,
	RectangleHorizontal,
	RotateCcw,
	ScanText,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "#/components/ui/button";
import { CardTickNavigator } from "#/features/editor/components/card-tick-navigator";
import { EditorCard } from "#/features/editor/components/editor-card";
import { useEditorStore } from "#/features/editor/store/editor-store";

type EditorCanvasProps = {
	projectTitle?: string;
	onProjectTitleChange?: (title: string) => void;
	onToggleInspector?: () => void;
	onSelectNode?: () => void;
	onOpenTemplates?: (cardId: string) => void;
	onOpenGlyphViewer?: () => void;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

export function EditorCanvas({
	projectTitle = "Untitled Project",
	onProjectTitleChange,
	onToggleInspector,
	onSelectNode,
	onOpenTemplates,
	onOpenGlyphViewer,
}: EditorCanvasProps) {
	const [zoom, setZoom] = useState(1);
	const [isCardDragLocked, setIsCardDragLocked] = useState(false);
	const [title, setTitle] = useState(projectTitle);
	const cancelTitleCommit = useRef(false);
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
		watchDrag: isCardDragLocked
			? false
			: (_emblaApi, event) => {
					const target = event.target as HTMLElement | null;
					return !target?.closest?.("[data-editor-node]");
				},
	});
	const lastWheelNavigationAt = useRef(0);
	const selectedIndex = cards.findIndex((card) => card.id === selectedCardId);
	const hasPreviousCard = selectedIndex > 0;
	const hasNextCard = selectedIndex >= 0 && selectedIndex < cards.length - 1;
	const zoomPercentage = Math.round(zoom * 100);

	useEffect(() => {
		setTitle(projectTitle);
	}, [projectTitle]);

	function commitProjectTitle() {
		if (cancelTitleCommit.current) {
			cancelTitleCommit.current = false;
			return;
		}
		const nextTitle = title.trim() || projectTitle;
		setTitle(nextTitle);
		if (nextTitle !== projectTitle) onProjectTitleChange?.(nextTitle);
	}

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
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					selectCard(null);
				}
			}}
			tabIndex={-1}
		>
			<Button
				type="button"
				aria-label="Open glyph viewer"
				variant="ghost"
				size="icon"
				className="absolute top-3 left-3 z-30 border border-white/60 bg-surface-glass shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-3xl"
				onClick={onOpenGlyphViewer}
			>
				<Languages />
			</Button>
			<div
				aria-label="Project controls"
				className="absolute top-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-white/60 bg-surface-glass p-3 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-3xl"
				onPointerDown={(event) => event.stopPropagation()}
				role="toolbar"
			>
				<input
					aria-label="Project title"
					className="w-40 rounded-md bg-transparent px-2 py-1 text-sm font-medium outline-none transition-colors hover:bg-muted/70 focus:bg-muted focus:ring-1 focus:ring-ring"
					value={title}
					onBlur={commitProjectTitle}
					onChange={(event) => setTitle(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") event.currentTarget.blur();
						if (event.key === "Escape") {
							cancelTitleCommit.current = true;
							setTitle(projectTitle);
							event.currentTarget.blur();
						}
					}}
				/>
				<div className="h-5 w-px bg-border" />
				<Button
					type="button"
					aria-label={
						isCardDragLocked ? "Unlock card dragging" : "Lock card dragging"
					}
					aria-pressed={isCardDragLocked}
					variant={isCardDragLocked ? "secondary" : "ghost"}
					size="icon-sm"
					onClick={() => setIsCardDragLocked((isLocked) => !isLocked)}
				>
					{isCardDragLocked ? <Lock /> : <LockOpen />}
				</Button>
				<div className="group relative flex items-center">
					<button
						type="button"
						aria-label="About card drag lock"
						aria-describedby="card-lock-tooltip"
						className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<Info className="size-3.5" />
					</button>
					<span
						id="card-lock-tooltip"
						role="tooltip"
						className="pointer-events-none absolute top-full left-1/2 mt-2 w-max max-w-56 -translate-x-1/2 rounded-md bg-foreground px-2.5 py-1.5 text-center text-xs text-background opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
					>
						Lock to prevent dragging between cards while you edit.
					</span>
				</div>
			</div>

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
									onSelectNode={onSelectNode}
									onOpenTemplates={onOpenTemplates}
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
					className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-white/60 bg-surface-glass p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-3xl"
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
