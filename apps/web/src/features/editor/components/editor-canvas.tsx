import useEmblaCarousel from "embla-carousel-react";
import {
	ChevronLeft,
	ChevronRight,
	Plus,
	RectangleHorizontal,
	Redo2,
	Scan,
	ScanEye,
	Undo2,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "#/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import {
	CANVAS_PROOF_OPTIONS,
	type CanvasProofMode,
	CanvasProofPreview,
} from "#/features/editor/components/canvas-proof-preview";
import { CardTickNavigator } from "#/features/editor/components/card-tick-navigator";
import { EditorCard } from "#/features/editor/components/editor-card";
import { createNodeContentStressPreview } from "#/features/editor/lib/content-stress";
import { useEditorStore } from "#/features/editor/store/editor-store";

type EditorCanvasProps = {
	projectTitle?: string;
	projectUpdatedAt?: string;
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
	projectUpdatedAt,
	onProjectTitleChange,
	onToggleInspector,
	onSelectNode,
	onOpenTemplates,
}: EditorCanvasProps) {
	const [zoom, setZoom] = useState(1);
	const [isCardDragLocked, setIsCardDragLocked] = useState(false);
	const [title, setTitle] = useState(projectTitle);
	const [lastEditedAt, setLastEditedAt] = useState<string | null>(null);
	const [cardTitle, setCardTitle] = useState("");
	const [canvasProof, setCanvasProof] = useState<{
		cardId: string;
		mode: Exclude<CanvasProofMode, "none">;
	} | null>(null);
	const cancelTitleCommit = useRef(false);
	const cancelCardTitleCommit = useRef(false);
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
	const updateCard = useEditorStore((state) => state.updateCard);
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
	const hasPreviousCard = selectedIndex > 0;
	const hasNextCard = selectedIndex >= 0 && selectedIndex < cards.length - 1;
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

	useEffect(() => {
		setTitle(projectTitle);
	}, [projectTitle]);

	useEffect(() => {
		setLastEditedAt(projectUpdatedAt ?? null);
	}, [projectUpdatedAt]);

	useEffect(() => {
		setCardTitle(selectedCard?.name ?? "");
	}, [selectedCard?.name]);

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

	function commitProjectTitle() {
		if (cancelTitleCommit.current) {
			cancelTitleCommit.current = false;
			return;
		}
		const nextTitle = title.trim() || projectTitle;
		setTitle(nextTitle);
		if (nextTitle !== projectTitle) {
			onProjectTitleChange?.(nextTitle);
			setLastEditedAt(new Date().toISOString());
		}
	}

	function commitCardTitle() {
		if (cancelCardTitleCommit.current) {
			cancelCardTitleCommit.current = false;
			return;
		}
		if (!selectedCard) return;
		const nextTitle = cardTitle.trim() || selectedCard.name;
		setCardTitle(nextTitle);
		if (nextTitle !== selectedCard.name) {
			updateCard(selectedCard.id, { name: nextTitle });
		}
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
			className="check-card relative h-full min-h-0 min-w-0 flex-1 overflow-hidden"
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					selectCard(null);
				}
			}}
			tabIndex={-1}
		>
			<div
				aria-label="Editor controls"
				className="absolute inset-x-0 top-0 z-30 flex h-14 items-center gap-1 border-b border-hairline bg-surface-glass px-2"
				onPointerDown={(event) => event.stopPropagation()}
				role="toolbar"
			>
				{selectedCard ? (
					<>
						<input
							aria-label="Card name"
							className="w-60 rounded-md bg-transparent px-2 py-2 text-base font-medium outline-none transition-colors hover:bg-muted/70 focus:bg-muted focus:ring-1 focus:ring-ring"
							value={cardTitle}
							onBlur={commitCardTitle}
							onChange={(event) => setCardTitle(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") event.currentTarget.blur();
								if (event.key === "Escape") {
									cancelCardTitleCommit.current = true;
									setCardTitle(selectedCard.name);
									event.currentTarget.blur();
								}
							}}
						/>
						<div className="h-5 w-px bg-border" />
						<CanvasProofSelect
							value={canvasProofMode}
							onChange={changeCanvasProof}
						/>
						<div className="h-5 w-px bg-border" />
						<Button
							type="button"
							aria-label="Undo card change"
							variant="ghost"
							size="icon-sm"
							disabled={!canUndo}
							onClick={() => undo(selectedCard.id)}
							title="Undo card change"
						>
							<Undo2 />
						</Button>
						<Button
							type="button"
							aria-label="Redo card change"
							variant="ghost"
							size="icon-sm"
							disabled={!canRedo}
							onClick={() => redo(selectedCard.id)}
							title="Redo card change"
						>
							<Redo2 />
						</Button>
					</>
				) : (
					<>
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
						<span className="px-2 font-mono text-[10px] text-muted-foreground">
							{formatLastEdited(lastEditedAt)}
						</span>
					</>
				)}
				{cards.length ? (
					<div className="flex items-center gap-1">
						<div className="mx-1 h-5 w-px bg-border" />
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
							aria-label="Zoom out"
							variant="ghost"
							size="icon-sm"
							disabled={isCanvasProofActive || zoom <= MIN_ZOOM}
							onClick={() => adjustZoom(-1)}
						>
							<ZoomOut />
						</Button>
						<output
							aria-label={
								isCanvasProofActive
									? "Zoom unavailable during canvas proof"
									: `Zoom: ${zoomPercentage}%`
							}
							className="min-w-11 px-1 py-1 text-center font-mono text-[10px] font-semibold tabular-nums text-muted-foreground"
						>
							{isCanvasProofActive ? "Proof" : `${zoomPercentage}%`}
						</output>
						<Button
							type="button"
							aria-label="Zoom in"
							variant="ghost"
							size="icon-sm"
							disabled={isCanvasProofActive || zoom >= MAX_ZOOM}
							onClick={() => adjustZoom(1)}
						>
							<ZoomIn />
						</Button>
						<Button
							type="button"
							aria-label="Fit canvas"
							variant="ghost"
							size="sm"
							disabled={isCanvasProofActive}
							onClick={() => setZoom(1)}
						>
							<Scan />
							Fit canvas
						</Button>
					</div>
				) : null}
			</div>

			{cards.length ? (
				<section
					ref={emblaRef}
					aria-label="Scrollable cards"
					className="h-full touch-pan-y overflow-x-hidden scrollbar-none"
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
									className="flex items-center justify-center gap-3 border border-hairline bg-surface-deep text-sm font-semibold text-muted-foreground shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-colors hover:bg-surface-head hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
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

function CanvasProofSelect({
	value,
	onChange,
}: {
	value: CanvasProofMode;
	onChange: (value: string) => void;
}) {
	const selected = CANVAS_PROOF_OPTIONS.find((option) => option.mode === value);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					type="button"
					aria-label={`Canvas proofs: ${selected?.label}`}
					variant={value === "none" ? "ghost" : "secondary"}
					size="icon-sm"
					title={value === "none" ? "Canvas proofs" : selected?.label}
				>
					<ScanEye />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="center" className="w-80">
				<div className="px-1 pb-2">
					<p className="text-xs font-semibold">Canvas proofs</p>
					<p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
						Temporary views for judging type in use.
					</p>
				</div>
				<fieldset className="grid grid-cols-2 gap-1.5">
					<legend className="sr-only">Canvas proofs</legend>
					{CANVAS_PROOF_OPTIONS.map((option) => (
						<label key={option.mode} className="cursor-pointer">
							<input
								type="radio"
								name="canvas-proof"
								value={option.mode}
								checked={value === option.mode}
								className="peer sr-only"
								onChange={() => onChange(option.mode)}
							/>
							<span className="flex min-h-[5.5rem] flex-col gap-1 rounded-lg border border-hairline bg-white p-1.5 text-left text-[10px] text-muted-foreground peer-checked:border-2 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-foreground">
								<CanvasProofSwatch mode={option.mode} />
								<span className="font-semibold">{option.label}</span>
								<span className="leading-3.5">{option.description}</span>
							</span>
						</label>
					))}
				</fieldset>
			</PopoverContent>
		</Popover>
	);
}

function CanvasProofSwatch({ mode }: { mode: CanvasProofMode }) {
	return (
		<span
			aria-hidden="true"
			className="flex h-9 w-full items-center justify-center gap-1 rounded-md border border-hairline bg-primary/5 p-1"
		>
			{mode === "none" ? (
				<span className="h-6 w-10 rounded-sm border border-current bg-white" />
			) : mode === "glance" ? (
				<span className="h-3 w-5 rounded-[2px] border border-current bg-white blur-[.35px]" />
			) : mode === "width" ? (
				<>
					<span className="h-6 w-4 rounded-[2px] border border-current bg-white" />
					<span className="h-6 w-6 rounded-[2px] border border-current bg-white" />
					<span className="h-6 w-8 rounded-[2px] border border-current bg-white" />
				</>
			) : (
				<>
					<span className="h-6 w-6 rounded-[2px] border border-current bg-white" />
					<span className="h-6 w-6 rounded-[2px] bg-foreground" />
					<span className="h-6 w-6 rounded-[2px] bg-[linear-gradient(135deg,#a8b3c8,#6b55b5,#e3ad82)]" />
				</>
			)}
		</span>
	);
}

function formatLastEdited(value: string | null) {
	if (!value) return "Last edited —";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Last edited —";
	return `Last edited ${date.toLocaleString([], {
		dateStyle: "medium",
		timeStyle: "short",
	})}`;
}
