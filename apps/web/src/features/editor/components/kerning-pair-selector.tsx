import { Input } from "#/components/ui/input";
import type { GlyphEntry } from "#/features/editor/lib/glyph-font";

export type PairSelectionTarget = "left" | "right";

export function KerningPairSelector({ glyphs, leftCodePoint, rightCodePoint, target, onTargetChange, onPairChange, onGlyphSelect, fontFamily }: { glyphs: GlyphEntry[]; leftCodePoint: number; rightCodePoint: number; target: PairSelectionTarget; onTargetChange: (target: PairSelectionTarget) => void; onPairChange: (value: string) => void; onGlyphSelect: (codePoint: number) => void; fontFamily: string }) {
	const left = String.fromCodePoint(leftCodePoint); const right = String.fromCodePoint(rightCodePoint);
	return <div className="flex min-h-0 flex-col">
		<div className="grid grid-cols-2 gap-2 p-3">
			{(["left", "right"] as const).map((side) => <button key={side} type="button" aria-pressed={target === side} onClick={() => onTargetChange(side)} className="rounded-md border border-hairline p-3 text-left outline-none hover:bg-muted focus-visible:ring-2 aria-pressed:border-foreground aria-pressed:bg-muted"><span className="block font-mono text-[10px] uppercase text-muted-foreground">{side} glyph</span><span className="block text-center text-5xl" style={{fontFamily}}>{side === "left" ? left : right}</span></button>)}
			<label className="col-span-2 font-mono text-[10px] uppercase text-muted-foreground">Pair<Input className="mt-1 font-sans text-base normal-case" aria-label="Kerning pair" value={`${left}${right}`} onChange={(event) => onPairChange(event.target.value)} /></label>
		</div>
		<section aria-label="Kerning pair glyph selector" className="grid min-h-48 flex-1 grid-cols-6 content-start overflow-y-auto border-t border-hairline" style={{fontFamily}}>
			{glyphs.map((glyph) => { const isLeft = glyph.codePoint === leftCodePoint; const isRight = glyph.codePoint === rightCodePoint; return <button key={glyph.codePoint} type="button" aria-label={`Select ${glyph.character} as ${target} glyph`} aria-pressed={target === "left" ? isLeft : isRight} onClick={() => onGlyphSelect(glyph.codePoint)} className="relative aspect-square border-r border-b border-hairline text-2xl outline-none [content-visibility:auto] hover:bg-muted focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset"><span>{glyph.character}</span>{isLeft || isRight ? <span className="absolute right-1 bottom-1 font-mono text-[8px] text-muted-foreground">{isLeft ? "L" : ""}{isRight ? "R" : ""}</span> : null}</button>})}
		</section>
	</div>;
}
