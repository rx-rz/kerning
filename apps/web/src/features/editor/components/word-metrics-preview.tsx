import { useMemo } from "react";
import type { GlyphOverlayOptions } from "#/features/editor/components/glyph-metrics-preview";
import type { FontFeatureSettings } from "#/features/editor/font-system/font-system.types";
import {
	type LoadedGlyphFont,
	normalizeGlyphMetrics,
} from "#/features/editor/lib/glyph-font";

export type WordComparisonSlot = {
	id: string;
	label: string;
	font: LoadedGlyphFont;
	color: string;
};

type WordGlyphGeometry = {
	id: string;
	path: string;
	advanceLeft: number;
	advanceRight: number;
	glyphLeft: number;
	glyphRight: number;
	top: number;
	bottom: number;
};

type WordGeometry = {
	glyphs: WordGlyphGeometry[];
	width: number;
	bounds: { left: number; right: number; top: number; bottom: number } | null;
};

function calculateWordGeometry(
	font: LoadedGlyphFont,
	word: string,
	featureSettings: FontFeatureSettings,
): WordGeometry {
	const parsedFont = font.fonts[0];
	if (!parsedFont) return { glyphs: [], width: 1000, bounds: null };
	const scale = 1000 / parsedFont.unitsPerEm;
	const glyphs: WordGlyphGeometry[] = [];
	const options = { kerning: true, features: featureSettings };
	let index = 0;
	const advance = parsedFont.forEachGlyph(
		word,
		0,
		0,
		1000,
		options,
		(glyph, cursor) => {
			const bounds = glyph.getBoundingBox();
			const advanceWidth =
				(glyph.advanceWidth ?? parsedFont.unitsPerEm) * scale;
			glyphs.push({
				id: `${glyph.index}:${index}`,
				path: glyph.getPath(cursor, 0, 1000, options, parsedFont).toPathData(2),
				advanceLeft: cursor,
				advanceRight: cursor + advanceWidth,
				glyphLeft: cursor + bounds.x1 * scale,
				glyphRight: cursor + bounds.x2 * scale,
				top: -bounds.y2 * scale,
				bottom: -bounds.y1 * scale,
			});
			index += 1;
		},
	);
	const visible = glyphs.filter(
		(glyph) => glyph.glyphRight > glyph.glyphLeft && glyph.bottom > glyph.top,
	);
	return {
		glyphs,
		width: Math.max(advance, 1),
		bounds: visible.length
			? {
					left: Math.min(...visible.map((glyph) => glyph.glyphLeft)),
					right: Math.max(...visible.map((glyph) => glyph.glyphRight)),
					top: Math.min(...visible.map((glyph) => glyph.top)),
					bottom: Math.max(...visible.map((glyph) => glyph.bottom)),
				}
			: null,
	};
}

function WordGuide({
	label,
	value,
	width,
}: {
	label: string;
	value: number;
	width: number;
}) {
	const y = -value;
	return (
		<g className="group" aria-label={`${label}: ${value}`}>
			<title>{`${label}: ${value}`}</title>
			<line
				x1="-60"
				x2={width + 60}
				y1={y}
				y2={y}
				stroke="currentColor"
				strokeDasharray="5 7"
				strokeOpacity=".3"
				vectorEffect="non-scaling-stroke"
			/>
			<line
				x1="-60"
				x2={width + 60}
				y1={y}
				y2={y}
				stroke="transparent"
				strokeWidth="20"
				vectorEffect="non-scaling-stroke"
				pointerEvents="stroke"
			/>
			<text
				x="-45"
				y={y - 13}
				className="pointer-events-none fill-current font-mono text-[18px] opacity-0 group-hover:opacity-100"
			>
				{label}
			</text>
		</g>
	);
}

function WordSvg({
	geometry,
	metrics,
	overlays,
	color,
	opacity = 1,
	showMeasurements = true,
}: {
	geometry: WordGeometry;
	metrics: ReturnType<typeof normalizeGlyphMetrics>;
	overlays: GlyphOverlayOptions;
	color: string;
	opacity?: number;
	showMeasurements?: boolean;
}) {
	return (
		<svg
			aria-label="Selected word preview"
			className="block size-full max-h-full max-w-full text-foreground"
			preserveAspectRatio="xMidYMid meet"
			viewBox={`${-80} -900 ${geometry.width + 160} 1200`}
		>
			{showMeasurements && overlays.guides ? (
				<>
					<WordGuide
						label="ASCENDER"
						value={metrics.ascender}
						width={geometry.width}
					/>
					<WordGuide
						label="CAP HEIGHT"
						value={metrics.capHeight}
						width={geometry.width}
					/>
					<WordGuide
						label="X-HEIGHT"
						value={metrics.xHeight}
						width={geometry.width}
					/>
					<WordGuide label="BASELINE" value={0} width={geometry.width} />
					<WordGuide
						label="DESCENDER"
						value={metrics.descender}
						width={geometry.width}
					/>
				</>
			) : null}
			{geometry.glyphs.map((glyph) => (
				<g key={glyph.id} opacity={opacity}>
					{showMeasurements && overlays.sideBearings ? (
						<g fill="currentColor" opacity=".06">
							<rect
								x={Math.min(glyph.advanceLeft, glyph.glyphLeft)}
								y={glyph.top}
								width={Math.abs(glyph.glyphLeft - glyph.advanceLeft)}
								height={glyph.bottom - glyph.top}
							/>
							<rect
								x={Math.min(glyph.glyphRight, glyph.advanceRight)}
								y={glyph.top}
								width={Math.abs(glyph.advanceRight - glyph.glyphRight)}
								height={glyph.bottom - glyph.top}
							/>
						</g>
					) : null}
					{showMeasurements && overlays.advanceWidth ? (
						<rect
							x={glyph.advanceLeft}
							y={-metrics.ascender}
							width={glyph.advanceRight - glyph.advanceLeft}
							height={metrics.ascender - metrics.descender}
							fill="none"
							stroke="currentColor"
							strokeDasharray="7 7"
							strokeOpacity=".32"
							vectorEffect="non-scaling-stroke"
						/>
					) : null}
					{showMeasurements && overlays.boundingBox ? (
						<rect
							x={glyph.glyphLeft}
							y={glyph.top}
							width={glyph.glyphRight - glyph.glyphLeft}
							height={glyph.bottom - glyph.top}
							fill="none"
							stroke="currentColor"
							strokeOpacity=".55"
							vectorEffect="non-scaling-stroke"
						/>
					) : null}
					<path
						d={glyph.path}
						fill={overlays.filled ? color : "none"}
						stroke={color}
						strokeWidth={overlays.filled ? 0 : 2}
						vectorEffect="non-scaling-stroke"
					/>
				</g>
			))}
		</svg>
	);
}

function Summary({
	slot,
	geometry,
	word,
}: {
	slot: WordComparisonSlot;
	geometry: WordGeometry;
	word: string;
}) {
	return (
		<div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-hairline bg-surface-glass/80 px-3 py-2">
			<span className="text-sm font-semibold" style={{ color: slot.color }}>
				{slot.label}
			</span>
			<span className="text-lg">{word}</span>
			<span className="font-mono text-[10px] text-muted-foreground">
				Advance {Math.round(geometry.width)}
			</span>
			{geometry.bounds ? (
				<span className="font-mono text-[10px] text-muted-foreground">
					Bounds {Math.round(geometry.bounds.right - geometry.bounds.left)} ×{" "}
					{Math.round(geometry.bounds.bottom - geometry.bounds.top)}
				</span>
			) : null}
		</div>
	);
}

export function WordMetricsPreview({
	slots,
	word,
	overlays,
	layout,
	featureSettings,
}: {
	slots: WordComparisonSlot[];
	word: string;
	overlays: GlyphOverlayOptions;
	layout: "stack" | "side-by-side";
	featureSettings: FontFeatureSettings;
}) {
	const rendered = useMemo(
		() =>
			slots.map((slot) => ({
				slot,
				geometry: calculateWordGeometry(slot.font, word, featureSettings),
				metrics: normalizeGlyphMetrics(slot.font.metrics),
			})),
		[featureSettings, slots, word],
	);
	if (!rendered.length) return null;

	if (layout === "side-by-side") {
		return (
			<div
				className="grid h-0 min-h-0 min-w-0 flex-1 overflow-hidden"
				style={{
					gridTemplateColumns: `repeat(${rendered.length}, minmax(0, 1fr))`,
				}}
			>
				{rendered.map(({ slot, geometry, metrics }) => (
					<div
						key={slot.id}
						className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-hairline last:border-r-0"
					>
						<div className="h-0 min-h-0 flex-1 overflow-hidden">
							<WordSvg
								geometry={geometry}
								metrics={metrics}
								overlays={overlays}
								color={slot.color}
							/>
						</div>
						<Summary slot={slot} geometry={geometry} word={word} />
					</div>
				))}
			</div>
		);
	}

	const primary = rendered[0];
	if (!primary) return null;
	const widest = Math.max(...rendered.map(({ geometry }) => geometry.width));
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
			<div className="relative h-0 min-h-0 flex-1 overflow-hidden">
				{rendered.map(({ slot, geometry, metrics }, index) => (
					<div key={slot.id} className="absolute inset-0">
						<WordSvg
							geometry={{ ...geometry, width: widest }}
							metrics={metrics}
							overlays={overlays}
							color={slot.color}
							opacity={rendered.length > 1 ? 0.58 : 1}
							showMeasurements={index === 0}
						/>
					</div>
				))}
			</div>
			<div className="flex flex-wrap border-t border-hairline bg-surface-glass/80">
				{rendered.map(({ slot, geometry }) => (
					<Summary key={slot.id} slot={slot} geometry={geometry} word={word} />
				))}
			</div>
		</div>
	);
}
