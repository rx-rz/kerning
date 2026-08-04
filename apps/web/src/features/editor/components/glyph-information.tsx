import type { GlyphInspectionData } from "../lib/glyph-inspection";
import {
  TypographyTermInfo,
  type TypographyTerm,
} from "./typography/typography-term-info";

export function GlyphInformation({ glyph }: { glyph?: GlyphInspectionData }) {
  if (!glyph) return null;
  const values = [
    ["Advance width", glyph.advanceWidth, "Advance width"],
    ["Left bearing", glyph.leftSideBearing, "Side bearings"],
    ["Right bearing", glyph.rightSideBearing, "Side bearings"],
    [
      "Bounding box",
      `${glyph.bounds.xMin}, ${glyph.bounds.yMin} → ${glyph.bounds.xMax}, ${glyph.bounds.yMax}`,
      "Bounding box",
    ],
    ["Contours", glyph.contourCount, undefined],
    ["Points", glyph.pointCount, undefined],
  ].filter((row) => row[1] !== undefined);
  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-hairline bg-surface-glass px-4 py-3">
      <div className="mr-2">
        <span className="text-2xl">{glyph.character}</span>
        <p className="font-mono text-[10px] text-muted-foreground">
          {glyph.unicode} · glyph {glyph.index} · {glyph.name ?? "Unnamed"}
        </p>
      </div>
      {values.map(([label, value, term]) => (
        <div key={label}>
          <div className="flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {label}
            {term ? <TypographyTermInfo term={term as TypographyTerm} /> : null}
          </div>
          <p className="font-mono text-xs">{value}</p>
        </div>
      ))}
    </div>
  );
}
