import { Redo2, ScanEye, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "#/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import {
	CANVAS_PROOF_OPTIONS,
	type CanvasProofMode,
} from "#/features/editor/components/canvas-proof-preview";

type EditorCanvasNavbarProps = {
	projectTitle: string;
	onProjectTitleChange?: (title: string) => void;
	hasSelectedCard: boolean;
	canvasProofMode: CanvasProofMode;
	onCanvasProofChange: (value: string) => void;
	canUndo: boolean;
	canRedo: boolean;
	onUndo: () => void;
	onRedo: () => void;
	hasCards: boolean;
	zoom: number;
	zoomPercentage: number;
	minZoom: number;
	maxZoom: number;
	isCanvasProofActive: boolean;
	onAdjustZoom: (direction: -1 | 1) => void;
};

export function EditorCanvasNavbar({
	projectTitle,
	onProjectTitleChange,
	hasSelectedCard,
	canvasProofMode,
	onCanvasProofChange,
	canUndo,
	canRedo,
	onUndo,
	onRedo,
	hasCards,
	zoom,
	zoomPercentage,
	minZoom,
	maxZoom,
	isCanvasProofActive,
	onAdjustZoom,
}: EditorCanvasNavbarProps) {
	const [title, setTitle] = useState(projectTitle);
	const cancelTitleCommit = useRef(false);

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
		if (nextTitle !== projectTitle) {
			onProjectTitleChange?.(nextTitle);
		}
	}

	return (
		<div
			aria-label="Editor controls"
			className="absolute inset-x-0 top-0 z-30 flex h-14 items-center gap-1 border-b border-hairline bg-white px-2"
			onPointerDown={(event) => event.stopPropagation()}
			role="toolbar"
		>
			<input
				aria-label="Project title"
				className="w-60 rounded-md bg-transparent px-2 py-2 text-base font-medium outline-none transition-colors hover:bg-muted/70 focus:bg-muted focus:ring-1 focus:ring-ring"
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
			{hasSelectedCard ? (
				<>
					<div className="h-5 w-px bg-border" />
					<CanvasProofSelect
						value={canvasProofMode}
						onChange={onCanvasProofChange}
					/>
					<div className="h-5 w-px bg-border" />
					<Button
						type="button"
						aria-label="Undo card change"
						variant="ghost"
						size="icon-sm"
						className="text-base font-medium tracking-normal"
						disabled={!canUndo}
						onClick={onUndo}
						title="Undo card change"
					>
						<Undo2 />
					</Button>
					<Button
						type="button"
						aria-label="Redo card change"
						variant="ghost"
						size="icon-sm"
						className="text-base font-medium tracking-normal"
						disabled={!canRedo}
						onClick={onRedo}
						title="Redo card change"
					>
						<Redo2 />
					</Button>
				</>
			) : null}
			{hasCards ? (
				<div className="flex items-center gap-1">
					<div className="mx-1 h-5 w-px bg-border" />
					<Button
						type="button"
						aria-label="Zoom out"
						variant="ghost"
						size="icon-sm"
						className="text-base font-medium tracking-normal"
						disabled={isCanvasProofActive || zoom <= minZoom}
						onClick={() => onAdjustZoom(-1)}
					>
						<ZoomOut />
					</Button>
					<output
						aria-label={
							isCanvasProofActive
								? "Zoom unavailable during canvas proof"
								: `Zoom: ${zoomPercentage}%`
						}
						className="min-w-14 px-1 py-1 text-center text-base font-medium tabular-nums text-muted-foreground"
					>
						{isCanvasProofActive ? "Proof" : `${zoomPercentage}%`}
					</output>
					<Button
						type="button"
						aria-label="Zoom in"
						variant="ghost"
						size="icon-sm"
						className="text-base font-medium tracking-normal"
						disabled={isCanvasProofActive || zoom >= maxZoom}
						onClick={() => onAdjustZoom(1)}
					>
						<ZoomIn />
					</Button>
				</div>
			) : null}
		</div>
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
					className="text-base font-medium tracking-normal"
					title={value === "none" ? "Canvas proofs" : selected?.label}
				>
					<ScanEye />
				</Button>
			</PopoverTrigger>
			<PopoverContent align="center" className="w-80">
				<div className="px-1 pb-2 text-base font-medium">
					<p>Canvas proofs</p>
					<p className="mt-0.5 leading-6 text-muted-foreground">
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
							<span className="flex min-h-[5.5rem] flex-col gap-1 rounded-lg border border-hairline bg-white p-1.5 text-left text-base font-medium text-muted-foreground peer-checked:border-2 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-foreground">
								<CanvasProofSwatch mode={option.mode} />
								<span>{option.label}</span>
								<span className="leading-6">{option.description}</span>
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
