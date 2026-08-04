import type { GlyphEntry, LoadedGlyphFont } from "../lib/glyph-font";
import { inspectGlyph } from "../lib/glyph-inspection";


export type GlyphOverlayOptions = {
	guides: boolean;
	boundingBox: boolean;
	sideBearings: boolean;
	advanceWidth: boolean;
	filled: boolean;
};
export const DEFAULT_OVERLAYS: GlyphOverlayOptions = {
	guides: false,
	boundingBox: true,
	sideBearings: false,
	advanceWidth: true,
	filled: true,
};
const COLORS = ["#111111", "#2774FF", "#D14B38"];

function Guide({ label, value }: { label: string; value: number }) {
	const y = -value;
	return (
		<g className="group" aria-label={`${label}: ${value}`}>
			<title>{`${label}: ${value}`}</title>
			<line
				x1="0"
				x2="1200"
				y1={y}
				y2={y}
				stroke="currentColor"
				strokeDasharray="5 7"
				strokeOpacity=".3"
				vectorEffect="non-scaling-stroke"
				pointerEvents="none"
			/>
			<line
				x1="0"
				x2="1200"
				y1={y}
				y2={y}
				stroke="transparent"
				strokeWidth="20"
				vectorEffect="non-scaling-stroke"
				pointerEvents="stroke"
			/>
			<text
				x="16"
				y={y - 14}
				className="pointer-events-none fill-current font-mono text-[18px] opacity-0 group-hover:opacity-100"
			>
				{label}
			</text>
		</g>
	);
}

export function GlyphOverlayControls({
	overlays,
	onChange,
	className = "",
}: {
	overlays: GlyphOverlayOptions;
	onChange: (value: GlyphOverlayOptions) => void;
	className?: string;
}) {
	return (
		<div className={`flex flex-wrap gap-1  ${className}`}>
			{(
				[
					["guides", "Metric guides"],
					["boundingBox", "Bounding box"],
					["sideBearings", "Side bearings"],
					["advanceWidth", "Advance width"],
					["filled", "Filled outline"],
				] as const
			).map(([key, label]) => (
				<button
					key={key}
					type="button"
					aria-pressed={overlays[key]}
					className="rounded border cursor-pointer border-hairline px-2 py-1 font-mono text-xs transition-colors hover:bg-accent/10 aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-background"
					onClick={() => onChange({ ...overlays, [key]: !overlays[key] })}
				>
					{label}
				</button>
			))}
		</div>
	);
}

export function GlyphMetricsPreview({
	entries,
	metrics,
	slots,
	overlays,
	onOverlaysChange,
	systemCharacter,
	primaryFontFamily,
	showControls = true,
	showInformation = true,
}: {
	entries: Array<GlyphEntry | undefined>;
	metrics: {
		ascender: number;
		capHeight: number;
		xHeight: number;
		descender: number;
	};
	slots: string[];
	loaded: Record<string, { data?: LoadedGlyphFont; error?: string }>;
	overlays: GlyphOverlayOptions;
	onOverlaysChange: (value: GlyphOverlayOptions) => void;
	systemCharacter: string;
	primaryFontFamily: string;
	showControls?: boolean;
	showInformation?: boolean;
}) {
	const geometries = entries.map((entry) => {
		if (!entry) return undefined;
		const scale = 1000 / entry.font.unitsPerEm;
		const bounds = entry.glyph.getBoundingBox();
		const advanceWidth =
			(entry.glyph.advanceWidth ?? entry.font.unitsPerEm) * scale;
		const advanceLeft = 600 - advanceWidth / 2;
		return {
			path: entry.glyph
				.getPath(advanceLeft, 0, 1000, undefined, entry.font)
				.toPathData(2),
			advanceLeft,
			advanceRight: advanceLeft + advanceWidth,
			glyphLeft: advanceLeft + bounds.x1 * scale,
			glyphRight: advanceLeft + bounds.x2 * scale,
			top: -bounds.y2 * scale,
			bottom: -bounds.y1 * scale,
		};
	});
	const primary = geometries[0];
	const inspection = inspectGlyph(entries[0]);
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
			{showControls ? (
				<GlyphOverlayControls overlays={overlays} onChange={onOverlaysChange} />
			) : null}
			<div className="relative h-0 min-h-0 flex-1 overflow-hidden bg-transparent">
				<svg
					aria-label="Selected glyph preview"
					className="block size-full max-h-full max-w-full text-foreground"
					preserveAspectRatio="xMidYMid meet"
					viewBox="0 -900 1200 1200"
				>
					{overlays.guides ? (
						<>
							{<Guide label="ASCENDER" value={metrics.ascender} />}
							<Guide label="CAP HEIGHT" value={metrics.capHeight} />
							<Guide label="X-HEIGHT" value={metrics.xHeight} />
							<Guide label="BASELINE" value={0} />
							<Guide label="DESCENDER" value={metrics.descender} />
						</>
					) : null}
					{primary && overlays.sideBearings ? (
						<g className="text-foreground" opacity=".06">
							<rect
								x={Math.min(primary.advanceLeft, primary.glyphLeft)}
								y={primary.top}
								width={Math.abs(primary.glyphLeft - primary.advanceLeft)}
								height={primary.bottom - primary.top}
								fill="currentColor"
							/>
							<rect
								x={Math.min(primary.glyphRight, primary.advanceRight)}
								y={primary.top}
								width={Math.abs(primary.advanceRight - primary.glyphRight)}
								height={primary.bottom - primary.top}
								fill="currentColor"
							/>
						</g>
					) : null}
					{primary && overlays.advanceWidth ? (
						<g
							stroke="currentColor"
							strokeDasharray="7 7"
							opacity=".5"
							vectorEffect="non-scaling-stroke"
						>
							<line
								x1={primary.advanceLeft}
								x2={primary.advanceLeft}
								y1={-metrics.ascender}
								y2={-metrics.descender}
							/>
							<line
								x1={primary.advanceRight}
								x2={primary.advanceRight}
								y1={-metrics.ascender}
								y2={-metrics.descender}
							/>
							<line
								x1={primary.advanceLeft}
								x2={primary.advanceLeft}
								y1={-metrics.ascender}
								y2={-metrics.descender}
								strokeWidth="3"
								strokeDasharray="none"
							/>
						</g>
					) : null}
					{primary && overlays.boundingBox ? (
						<rect
							x={primary.glyphLeft}
							y={primary.top}
							width={primary.glyphRight - primary.glyphLeft}
							height={primary.bottom - primary.top}
							fill="none"
							stroke="currentColor"
							opacity=".55"
							vectorEffect="non-scaling-stroke"
						/>
					) : null}
					{geometries.map((geometry, index) =>
						geometry ? (
							<path
								key={slots[index]}
								d={geometry.path}
								fill={overlays.filled ? COLORS[index] : "none"}
								stroke={COLORS[index]}
								strokeWidth={overlays.filled ? 0 : 2}
								opacity={slots.length > 1 ? 0.58 : 1}
								vectorEffect="non-scaling-stroke"
							/>
						) : null,
					)}
					{!geometries[0] ? (
						<text
							x="600"
							y="0"
							fill={COLORS[0]}
							fontFamily={primaryFontFamily}
							fontSize="1000"
							textAnchor="middle"
						>
							{systemCharacter}
						</text>
					) : null}
				</svg>
			</div>
			{/* {showInformation ? <GlyphInformation glyph={inspection} /> : null} */}
		</div>
	);
}
