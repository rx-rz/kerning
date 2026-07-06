import type { ProjectFontEntity } from "@kerning/shared";
import { AlertCircle, LoaderCircle, RotateCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	type GlyphEntry,
	loadGlyphFont,
	normalizeGlyphMetrics,
	SYSTEM_GLYPHS,
} from "#/features/editor/lib/glyph-font";
import type { FontType } from "#/features/editor/types";

type FontOption = {
	font: ProjectFontEntity;
	role: FontType;
	roleLabel: string;
};

type GlyphViewerProps = {
	fonts: FontOption[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const SYSTEM_FONT_ID = "system";
const SYSTEM_METRICS = {
	ascender: 800,
	capHeight: 700,
	xHeight: 500,
	baseline: 0,
	descender: -150,
};

function getFontFamily(role?: FontType) {
	return role
		? `var(--font-project-${role})`
		: "ui-sans-serif, system-ui, sans-serif";
}

function MetricGuide({ label, value }: { label: string; value: number }) {
	const y = -value;
	return (
		<g>
			<line
				x1="0"
				x2="1200"
				y1={y}
				y2={y}
				stroke="currentColor"
				strokeDasharray="5 7"
				strokeOpacity="0.3"
				vectorEffect="non-scaling-stroke"
			/>
			<text
				x="24"
				y={y - 13}
				className="fill-current font-mono text-[18px]"
				opacity="0.65"
			>
				{label}
			</text>
			<rect
				x="1107"
				y={y - 27}
				width="76"
				height="27"
				rx="2"
				fill="currentColor"
			/>
			<text
				x="1145"
				y={y - 8}
				className="fill-background font-mono text-[17px]"
				textAnchor="middle"
			>
				{value}
			</text>
		</g>
	);
}

function GlyphPreview({
	entry,
	metrics,
	systemCharacter,
	fontFamily,
}: {
	entry?: GlyphEntry;
	metrics: typeof SYSTEM_METRICS;
	systemCharacter?: string;
	fontFamily: string;
}) {
	const glyphGeometry = useMemo(() => {
		if (!entry) return null;
		const unitScale = 1000 / entry.font.unitsPerEm;
		const bounds = entry.glyph.getBoundingBox();
		const xMin = bounds.x1 * unitScale;
		const xMax = bounds.x2 * unitScale;
		const originX = 600 - (xMin + xMax) / 2;
		const path = entry.glyph.getPath(originX, 0, 1000, undefined, entry.font);
		return {
			path: path.toPathData(2),
			left: originX + xMin,
			advance: Math.round((entry.glyph.advanceWidth ?? 0) * unitScale),
			bounds: `${Math.round(xMin)}…${Math.round(xMax)}`,
		};
	}, [entry]);

	return (
		<div className="relative  flex min-h-0 flex-1 overflow-hidden bg-surface-glass">
			<svg
				aria-label="Selected glyph preview"
				className="size-full text-foreground"
				preserveAspectRatio="xMidYMid meet"
				viewBox="0 -900 1200 1200"
			>
				<MetricGuide label="CAP HEIGHT" value={metrics.capHeight} />
				<MetricGuide label="X-HEIGHT" value={metrics.xHeight} />
				<MetricGuide label="BASELINE" value={0} />
				<MetricGuide label="DESCENDER" value={metrics.descender} />

				{glyphGeometry ? (
					<>
						<line
							x1={glyphGeometry.left}
							x2={glyphGeometry.left}
							y1={-metrics.ascender}
							y2={-metrics.descender}
							stroke="var(--color-accent)"
							strokeWidth="3"
							vectorEffect="non-scaling-stroke"
						/>
						<path d={glyphGeometry.path} fill="currentColor" />
					</>
				) : (
					<text
						x="600"
						y="0"
						fill="currentColor"
						fontFamily={fontFamily}
						fontSize="1000"
						textAnchor="middle"
					>
						{systemCharacter}
					</text>
				)}
			</svg>
			{glyphGeometry ? (
				<span className="absolute right-4 bottom-4 rounded-md border border-hairline bg-surface-glass px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-xl">
					advance {glyphGeometry.advance} · bounds {glyphGeometry.bounds}
				</span>
			) : null}
		</div>
	);
}

export function GlyphViewer({ fonts, open, onOpenChange }: GlyphViewerProps) {
	const [selectedFontId, setSelectedFontId] = useState(
		() => fonts[0]?.font.dbId ?? SYSTEM_FONT_ID,
	);
	const [glyphs, setGlyphs] = useState<GlyphEntry[]>([]);
	const [metrics, setMetrics] = useState(SYSTEM_METRICS);
	const [selectedCodePoint, setSelectedCodePoint] = useState<number | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [retryKey, setRetryKey] = useState(0);
	const selectedOption = fonts.find(
		(option) => option.font.dbId === selectedFontId,
	);
	const isSystemFont = !selectedOption;
	const fontFamily = getFontFamily(selectedOption?.role);

	useEffect(() => {
		if (!fonts.length) {
			setSelectedFontId(SYSTEM_FONT_ID);
			return;
		}
		if (!fonts.some((option) => option.font.dbId === selectedFontId)) {
			setSelectedFontId(fonts[0]?.font.dbId ?? SYSTEM_FONT_ID);
		}
	}, [fonts, selectedFontId]);

	useEffect(() => {
		if (!open || !selectedOption) {
			setGlyphs([]);
			setMetrics(SYSTEM_METRICS);
			setSelectedCodePoint(null);
			setError(null);
			return;
		}

		let cancelled = false;
		setIsLoading(true);
		setError(null);
		void loadGlyphFont(selectedOption.font, retryKey)
			.then((loaded) => {
				if (cancelled) return;
				setGlyphs(loaded.glyphs);
				setMetrics(normalizeGlyphMetrics(loaded.metrics));
				const defaultGlyph =
					loaded.glyphs.find((glyph) => glyph.character === "A") ??
					loaded.glyphs[0];
				setSelectedCodePoint(defaultGlyph?.codePoint ?? null);
			})
			.catch((reason: unknown) => {
				if (cancelled) return;
				setGlyphs([]);
				setSelectedCodePoint(null);
				setError(
					reason instanceof Error
						? reason.message
						: "The font could not be loaded.",
				);
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [open, retryKey, selectedOption]);

	const selectedEntry = glyphs.find(
		(glyph) => glyph.codePoint === selectedCodePoint,
	);
	const systemCodePoint = selectedCodePoint ?? 65;
	const displayedCharacters = isSystemFont
		? SYSTEM_GLYPHS.map((character) => ({
			character,
			codePoint: character.codePointAt(0) ?? 0,
		}))
		: glyphs;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton
				className="
     h-dvh w-dvw max-w-none sm:max-w-[90%] max-h-[90%]
    gap-0 overflow-hidden 
    border-0 bg-surface-glass p-0
    
  "
			>
				<DialogTitle className="sr-only">Glyph viewer</DialogTitle>
				<DialogDescription className="sr-only">
					Inspect every printable character available in a project font.
				</DialogDescription>
				{/* <header className="flex min-h-16 items-center gap-4 border-b border-hairline px-6 pr-16">
					<span className="font-sans text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
						Glyph viewer
					</span>
					<Select value={selectedFontId} onValueChange={setSelectedFontId}>
						<SelectTrigger className="h-10 min-h-10 w-auto min-w-64 border-0 bg-transparent px-2 text-base font-semibold shadow-none">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="z-90" position="popper" align="start">
							{fonts.map((option) => (
								<SelectItem key={option.font.dbId} value={option.font.dbId}>
									{option.font.family} · {option.roleLabel}
								</SelectItem>
							))}
							{fonts.length === 0 ? (
								<SelectItem value={SYSTEM_FONT_ID}>System font</SelectItem>
							) : null}
						</SelectContent>
					</Select>
				</header> */}
					<Select value={selectedFontId} onValueChange={setSelectedFontId} >
						<SelectTrigger className="w-auto left-2 top-2  border-0 bg-transparent absolute z-100 px-2 text-base font-semibold shadow-none">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="z-90" position="popper" align="start">
							{fonts.map((option) => (
								<SelectItem key={option.font.dbId} value={option.font.dbId}>
									{option.font.family} · {option.roleLabel}
								</SelectItem>
							))}
							{fonts.length === 0 ? (
								<SelectItem value={SYSTEM_FONT_ID}>System font</SelectItem>
							) : null}
						</SelectContent>
					</Select>
				<div className="grid h-full  min-h-0 w-full grid-cols-[1fr_650px] ">
					<section className="flex  border min-h-0 flex-col border-r border-hairline">
						{isLoading ? (
							<div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
								<LoaderCircle className="size-4 animate-spin" /> Parsing font…
							</div>
						) : error ? (
							<div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
								<AlertCircle className="size-6 text-destructive" />
								<p className="max-w-sm text-sm text-muted-foreground">
									{error}
								</p>
								<Button
									variant="outline"
									onClick={() => setRetryKey((key) => key + 1)}
								>
									<RotateCw /> Retry
								</Button>
							</div>
						) : (
							<GlyphPreview
								entry={selectedEntry}
								metrics={metrics}
								systemCharacter={String.fromCodePoint(systemCodePoint)}
								fontFamily={fontFamily}
							/>
						)}
					</section>

					<section
						aria-label="Available glyphs"
						className="grid min-h-0  border grid-cols-8 content-start overflow-y-auto overscroll-contain scrollbar-none bg-surface-glass"
					>
						{displayedCharacters.map((glyph) => (
							<button
								key={glyph.codePoint}
								type="button"
								aria-label={`Select ${glyph.character}, Unicode ${glyph.codePoint.toString(16).toUpperCase().padStart(4, "0")}`}
								aria-pressed={
									glyph.codePoint === systemCodePoint ||
									glyph.codePoint === selectedCodePoint
								}
								className="aspect-square bg-background border-r border-b border-hairline text-2xl outline-none [content-visibility:auto] hover:bg-muted focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring aria-pressed:bg-foreground aria-pressed:text-background"
								style={{ fontFamily }}
								onClick={() => setSelectedCodePoint(glyph.codePoint)}
							>
								{glyph.character}
							</button>
						))}
					</section>
				</div>
			</DialogContent>
		</Dialog>
	);
}
