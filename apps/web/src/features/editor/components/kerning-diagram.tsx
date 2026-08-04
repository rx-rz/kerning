import { useMemo } from "react";
import type { GlyphMetrics } from "#/features/editor/lib/glyph-font";
import type { KerningPairData } from "#/features/editor/lib/kerning";

export type KerningOverlayOptions = { metricGuides: boolean; advanceBoxes: boolean; boundingBoxes: boolean; sideBearings: boolean; showUnkernedPosition: boolean };

export function KerningDiagram({ data, metrics, options, color }: { data: KerningPairData; metrics: GlyphMetrics; options: KerningOverlayOptions; color: string }) {
	const geometry = useMemo(() => {
		const scale = 1000 / data.unitsPerEm;
		const leftAdvance = data.left.advanceWidth * scale;
		const rightAdvance = data.right.advanceWidth * scale;
		const kern = data.kerningValue * scale;
		const start = 750 - (leftAdvance + kern + rightAdvance) / 2;
		const unkernedRight = start + leftAdvance;
		const kernedRight = unkernedRight + kern;
		const font = data.left.entry.font;
		return { scale, leftAdvance, rightAdvance, kern, start, unkernedRight, kernedRight,
			leftPath: data.left.entry.glyph.getPath(start, 0, 1000, undefined, font).toPathData(2),
			rightPath: data.right.entry.glyph.getPath(kernedRight, 0, 1000, undefined, font).toPathData(2),
			ghostPath: data.right.entry.glyph.getPath(unkernedRight, 0, 1000, undefined, font).toPathData(2) };
	}, [data]);
	const guideValues = [["ASC", metrics.ascender], ["CAP", metrics.capHeight], ["X", metrics.xHeight], ["BASE", 0], ["DESC", metrics.descender]] as const;
	const box = (side: "left" | "right", origin: number) => {
		const glyph = data[side]; const b = glyph.bounds; const s = geometry.scale; const advance = glyph.advanceWidth * s;
		return <g key={side}>
			{options.advanceBoxes ? <rect x={origin} y={-metrics.ascender} width={advance} height={metrics.ascender - metrics.descender} fill="none" stroke="currentColor" strokeOpacity=".25" /> : null}
			{options.boundingBoxes ? <rect x={origin + b.xMin * s} y={-b.yMax * s} width={(b.xMax-b.xMin)*s} height={(b.yMax-b.yMin)*s} fill="none" stroke="currentColor" strokeDasharray="5 4" strokeOpacity=".65" /> : null}
			{options.sideBearings ? <><rect x={origin} y={-b.yMax*s} width={b.xMin*s} height={(b.yMax-b.yMin)*s} fill="currentColor" opacity=".08" /><rect x={origin+b.xMax*s} y={-b.yMax*s} width={(glyph.advanceWidth-b.xMax)*s} height={(b.yMax-b.yMin)*s} fill="currentColor" opacity=".08" /></> : null}
			<line x1={origin} x2={origin} y1={-metrics.ascender} y2={-metrics.descender} stroke="currentColor" strokeWidth="2" /><text x={origin+8} y={-metrics.descender-15} className="fill-current font-mono text-[18px]">{side === "left" ? "LEFT" : "RIGHT"}</text>
		</g>;
	};
	return <svg role="img" aria-label="Technical kerning diagram" className="h-full min-h-72 w-full" viewBox="0 -900 1500 1200" preserveAspectRatio="xMidYMid meet">
		<title>Technical diagram for {data.left.character}{data.right.character}, kerning {data.kerningValue} units</title>
		<g color="currentColor">{options.metricGuides ? guideValues.map(([label,value]) => <g key={label}><line x1="0" x2="1500" y1={-value} y2={-value} stroke="currentColor" strokeDasharray="6 7" strokeOpacity=".18"/><text x="12" y={-value-8} className="fill-current font-mono text-[16px]" opacity=".5">{label}</text></g>) : null}</g>
		<g color={color}>{box("left", geometry.start)}{box("right", geometry.kernedRight)}
		{options.showUnkernedPosition ? <><path d={geometry.ghostPath} fill="none" stroke="currentColor" strokeOpacity=".22" strokeWidth="2"/><line x1={geometry.unkernedRight} x2={geometry.unkernedRight} y1="-820" y2="180" stroke="currentColor" strokeDasharray="8 7" strokeOpacity=".35" /></> : null}
		<path d={geometry.leftPath} fill="currentColor" fillOpacity=".82"/><path d={geometry.rightPath} fill="currentColor" fillOpacity=".82"/>
		<line x1={geometry.unkernedRight} x2={geometry.kernedRight} y1="220" y2="220" stroke="currentColor" strokeWidth="3"/><line x1={geometry.unkernedRight} x2={geometry.unkernedRight} y1="205" y2="235" stroke="currentColor"/><line x1={geometry.kernedRight} x2={geometry.kernedRight} y1="205" y2="235" stroke="currentColor"/><text x={(geometry.unkernedRight+geometry.kernedRight)/2} y="195" textAnchor="middle" className="fill-current font-mono text-[20px]">{data.kerningValue === 0 ? "No adjustment" : `${data.kerningValue < 0 ? "←" : "→"} ${data.kerningValue} units`}</text></g>
	</svg>;
}
