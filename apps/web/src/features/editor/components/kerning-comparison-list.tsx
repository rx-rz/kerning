import type { LoadedGlyphFont } from "#/features/editor/lib/glyph-font";
import { getKerningPairData } from "#/features/editor/lib/kerning";

export type KerningComparisonSlot = { id: string; family: string; fontFamily: string; data?: LoadedGlyphFont; error?: string; system?: boolean };

export function KerningComparisonList({ slots, colors, leftCodePoint, rightCodePoint }: { slots: KerningComparisonSlot[]; colors: string[]; leftCodePoint: number; rightCodePoint: number }) {
	const pair = `${String.fromCodePoint(leftCodePoint)}${String.fromCodePoint(rightCodePoint)}`;
	return <section aria-label="Font kerning comparison" className="border-t border-hairline"><div className="px-4 pt-3 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">Font comparison</div>
		{slots.map((slot, index) => { const result = slot.data ? getKerningPairData(slot.data, leftCodePoint, rightCodePoint) : null; return <article key={slot.id} aria-label={`${slot.family} kerning result`} className="grid grid-cols-[minmax(100px,1fr)_100px_minmax(190px,1fr)] items-center gap-3 border-b border-hairline px-4 py-3" style={{ borderLeft: `3px solid ${colors[index]}` }}><div className="truncate text-sm font-semibold">{slot.family}</div><div className="whitespace-pre text-4xl" style={{ fontFamily: slot.fontFamily, fontKerning: "normal" }}>{pair}</div><div className="font-mono text-xs text-muted-foreground">{slot.error ? slot.error : slot.system ? "Browser preview only · metrics unavailable" : !slot.data ? "Loading…" : !result ? "Pair not supported" : <><span style={{ color: colors[index] }}>{result.kerningValue} units · {(result.normalizedKerning * 100).toFixed(2)}% em</span><br />Unkerned {result.unkernedAdvance} · Kerned {result.kernedAdvance}</>}</div></article> })}
	</section>;
}
