import useEmblaCarousel from "embla-carousel-react";
import { Plus, RectangleHorizontal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "#/components/ui/button";
import { deleteEditorImage } from "#/db/image-db";
import {
	type CanvasProofMode,
	CanvasProofPreview,
} from "#/features/editor/components/canvas-proof-preview";
import { CardTickNavigator } from "#/features/editor/components/card-tick-navigator";
import { EditorCanvasNavbar } from "#/features/editor/components/editor-canvas-navbar";
import { EditorCard } from "#/features/editor/components/editor-card";
import { createNodeContentStressPreview } from "#/features/editor/lib/content-stress";
import { useEditorStore } from "#/features/editor/store/editor-store";

type EditorCanvasProps = {
	projectTitle?: string;
	onProjectTitleChange?: (title: string) => void;
	onToggleInspector?: () => void;
	onSelectNode?: () => void;
	onOpenTemplates?: (cardId: string) => void;
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
}: EditorCanvasProps) {
	const [zoom, setZoom] = useState(1);
	const [isCardDragLocked, setIsCardDragLocked] = useState(false);
	const [canvasProof, setCanvasProof] = useState<{
		cardId: string;
		mode: Exclude<CanvasProofMode, "none">;
	} | null>(null);
	const cards = useEditorStore((state) => state.cards);
	const selectedCardId = useEditorStore((state) => state.selectedCardId);
	const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
	const contentStress = useEditorStore((state) => state.contentStressPreview);
	const setContentStressPreview = useEditorStore(
		(state) => state.setContentStressPreview,
	);
	const selectCard = useEditorStore((state) => state.selectCard);
	const addCard = useEditorStore((state) => state.addCard);
	const deleteCard = useEditorStore((state) => state.deleteCard);
	const undo = useEditorStore((state) => state.undo);
	const redo = useEditorStore((state) => state.redo);
	const canUndo = useEditorStore((state) =>
		selectedCardId
			? Boolean(state.cardHistories[selectedCardId]?.past.length)
			: false,
	);
	const canRedo = useEditorStore((state) =>
		selectedCardId
			? Boolean(state.cardHistories[selectedCardId]?.future.length)
			: false,
	);
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
	const selectedCard = selectedIndex >= 0 ? cards[selectedIndex] : undefined;
	const zoomPercentage = Math.round(zoom * 100);
	const selectedTextNode = selectedCard?.nodes.find(
		(node) => node.id === selectedNodeId && node.type === "text",
	);
	const contentStressPreview =
		selectedTextNode &&
		contentStress?.cardId === selectedCardId &&
		contentStress.nodeId === selectedTextNode.id
			? createNodeContentStressPreview(selectedTextNode, contentStress.mode)
			: undefined;
	const canvasProofMode: CanvasProofMode =
		canvasProof?.cardId === selectedCardId ? canvasProof.mode : "none";
	const isCanvasProofActive = canvasProofMode !== "none";
	const visibleCards =
		isCanvasProofActive && selectedCard ? [selectedCard] : cards;

	function changeCanvasProof(value: string) {
		if (value === "none") {
			setCanvasProof(null);
			return;
		}
		if (!selectedCard) return;
		setCanvasProof({
			cardId: selectedCard.id,
			mode: value as Exclude<CanvasProofMode, "none">,
		});
	}

	const previousSelection = useRef({ selectedCardId, selectedNodeId });
	useEffect(() => {
		const previous = previousSelection.current;
		if (previous.selectedCardId !== selectedCardId) {
			setCanvasProof(null);
			setContentStressPreview(null);
		} else if (previous.selectedNodeId !== selectedNodeId) {
			setContentStressPreview(null);
		}
		previousSelection.current = { selectedCardId, selectedNodeId };
	}, [selectedCardId, selectedNodeId, setContentStressPreview]);

	useEffect(() => {
		function handleHistoryShortcut(event: KeyboardEvent) {
			if (!selectedCardId || !(event.metaKey || event.ctrlKey)) return;
			const target = event.target as HTMLElement | null;
			if (target?.matches("input, textarea, select, [contenteditable='true']"))
				return;
			if (event.key.toLowerCase() !== "z") return;
			event.preventDefault();
			if (event.shiftKey) redo(selectedCardId);
			else undo(selectedCardId);
		}

		window.addEventListener("keydown", handleHistoryShortcut);
		return () => window.removeEventListener("keydown", handleHistoryShortcut);
	}, [redo, selectedCardId, undo]);

	useEffect(() => {
		function handleNodeDelete(event: KeyboardEvent) {
			if (event.key !== "Delete" || !selectedCardId || !selectedNodeId) return;
			const target = event.target;
			if (
				target instanceof HTMLInputElement ||
				target instanceof HTMLSelectElement ||
				(target instanceof HTMLTextAreaElement && !target.readOnly) ||
				(target instanceof HTMLElement && target.isContentEditable)
			)
				return;
			const card = useEditorStore
				.getState()
				.cards.find(({ id }) => id === selectedCardId);
			const node = card?.nodes.find(({ id }) => id === selectedNodeId);
			if (!card || !node) return;

			event.preventDefault();
			if (node.type === "image" && node.imageId) {
				void deleteEditorImage(node.imageId);
			}
			useEditorStore.getState().deleteNode(card.id, node.id);
		}

		window.addEventListener("keydown", handleNodeDelete);
		return () => window.removeEventListener("keydown", handleNodeDelete);
	}, [selectedCardId, selectedNodeId]);

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
			if (isCanvasProofActive) return;
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
			className="relative h-full min-h-0 min-w-0 flex-1 overflow-hidden "
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					selectCard(null);
				}
			}}
			tabIndex={-1}
		>
			<EditorCanvasNavbar
				projectTitle={projectTitle}
				onProjectTitleChange={onProjectTitleChange}
				hasSelectedCard={Boolean(selectedCard)}
				canvasProofMode={canvasProofMode}
				onCanvasProofChange={changeCanvasProof}
				canUndo={canUndo}
				canRedo={canRedo}
				onUndo={() => selectedCardId && undo(selectedCardId)}
				onRedo={() => selectedCardId && redo(selectedCardId)}
				hasCards={Boolean(cards.length)}
				zoom={zoom}
				zoomPercentage={zoomPercentage}
				minZoom={MIN_ZOOM}
				maxZoom={MAX_ZOOM}
				isCanvasProofActive={isCanvasProofActive}
				onAdjustZoom={adjustZoom}
			/>

			{cards.length ? (
				<section
					ref={emblaRef}
					aria-label="Scrollable cards"
					className="h-full touch-pan-y bg-[#e9e9e9] overflow-x-hidden scrollbar-none"
					onWheel={handleWheel}
				>
					<div
						className={
							isCanvasProofActive
								? "flex min-h-full w-full items-center justify-center px-8 pt-32 pb-28"
								: "flex min-h-full items-center gap-12 px-16 pt-32 pb-28"
						}
					>
						{visibleCards.map((card) => (
							<div
								key={card.id}
								className={
									isCanvasProofActive
										? "relative flex w-full min-w-0 justify-center"
										: "relative flex-[0_0_auto]"
								}
							>
								{!isCanvasProofActive && card.comparisonLabel ? (
									<div className="absolute -top-8 left-0 rounded-md border border-hairline bg-surface-glass px-2 py-1 text-[9px] font-semibold shadow-sm backdrop-blur-xl">
										{card.comparisonLabel}
									</div>
								) : null}
								{card.id === selectedCardId && canvasProofMode !== "none" ? (
									<CanvasProofPreview
										card={card}
										mode={canvasProofMode}
										contentStressPreview={contentStressPreview}
									/>
								) : (
									<EditorCard
										card={card}
										zoom={zoom}
										isSelected={card.id === selectedCardId}
										contentStressPreview={
											card.id === selectedCardId
												? contentStressPreview
												: undefined
										}
										onSelect={selectCard}
										onToggleSettings={onToggleInspector}
										onSelectNode={onSelectNode}
										onOpenTemplates={onOpenTemplates}
										onDelete={deleteCard}
										isCardDragLocked={isCardDragLocked}
										onToggleCardDragLock={() =>
											setIsCardDragLocked((isLocked) => !isLocked)
										}
									/>
								)}
							</div>
						))}
						{!isCanvasProofActive && selectedCard ? (
							<div className="relative flex-[0_0_auto]">
								<button
									type="button"
									aria-label="Add new card"
									className="flex items-center justify-center gap-3 border border-hairline bg-surface-deep text-sm font-semibold text-muted-foreground shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-colors hover:bg-[#DFDFDF] hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
									style={{
										width: selectedCard.width * zoom,
										height: selectedCard.height * zoom,
									}}
									onClick={(event) => {
										event.stopPropagation();
										addAndSelectCard();
									}}
								>
									<Plus className="size-5" />
									Add new card
								</button>
							</div>
						) : null}
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
		</section>
	);
}
