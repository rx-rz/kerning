import { useEffect, useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import { Slider } from "#/components/ui/slider";
import {
  KerningComparisonList,
  type KerningComparisonSlot,
} from "#/features/editor/components/kerning-comparison-list";
import {
  KerningDiagram,
  type KerningOverlayOptions,
} from "#/features/editor/components/kerning-diagram";
import { KerningPairPreview } from "#/features/editor/components/kerning-pair-preview";
import {
  KerningPairSelector,
  type PairSelectionTarget,
} from "#/features/editor/components/kerning-pair-selector";
import type { LoadedGlyphFont } from "#/features/editor/lib/glyph-font";
import {
  getKerningPairData,
  unicodeLabel,
} from "#/features/editor/lib/kerning";

const DEFAULT_OPTIONS: KerningOverlayOptions = {
  metricGuides: true,
  advanceBoxes: true,
  boundingBoxes: true,
  sideBearings: true,
  showUnkernedPosition: true,
};

export function KerningView({
  primaryData,
  primaryFontFamily,
  comparisonSlots,
  colors,
  initialPair,
}: {
  primaryData: LoadedGlyphFont;
  primaryFontFamily: string;
  comparisonSlots: KerningComparisonSlot[];
  colors: string[];
  initialPair?: { leftCodePoint: number; rightCodePoint: number };
}) {
  const [leftCodePoint, setLeftCodePoint] = useState(
    initialPair?.leftCodePoint ?? 65,
  );
  const [rightCodePoint, setRightCodePoint] = useState(
    initialPair?.rightCodePoint ?? 86,
  );
  const [target, setTarget] = useState<PairSelectionTarget>("left");
  const [previewSize, setPreviewSize] = useState(112);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const supported = useMemo(
    () => new Set(primaryData.glyphs.map((g) => g.codePoint)),
    [primaryData],
  );
  useEffect(() => {
    if (supported.has(leftCodePoint) && supported.has(rightCodePoint)) return;
    const fallback = [65, 86].filter((cp) => supported.has(cp));
    const values = [...fallback, ...primaryData.glyphs.map((g) => g.codePoint)];
    if (!supported.has(leftCodePoint)) setLeftCodePoint(values[0] ?? 65);
    if (!supported.has(rightCodePoint))
      setRightCodePoint(
        values.find((cp) => cp !== (values[0] ?? 65)) ?? values[0] ?? 86,
      );
  }, [supported, primaryData, leftCodePoint, rightCodePoint]);
  const data = useMemo(
    () => getKerningPairData(primaryData, leftCodePoint, rightCodePoint),
    [primaryData, leftCodePoint, rightCodePoint],
  );
  const pair = `${String.fromCodePoint(leftCodePoint)}${String.fromCodePoint(rightCodePoint)}`;
  const selectPair = (value: string) => {
    const chars = Array.from(value);
    if (!chars.length) return;
    const left = chars[0]?.codePointAt(0);
    const right = chars[1]?.codePointAt(0);
    if (left !== undefined && supported.has(left)) setLeftCodePoint(left);
    if (right !== undefined && supported.has(right)) setRightCodePoint(right);
  };
  const chooseGlyph = (cp: number) => {
    if (target === "left") {
      setLeftCodePoint(cp);
      setTarget("right");
    } else setRightCodePoint(cp);
  };
  return (
    <div className="grid h-full min-h-0 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(360px,42vw)] lg:overflow-hidden">
      <main className="min-w-0 overflow-y-auto bg-surface-glass">
        <KerningPairPreview
          pair={pair}
          fontFamily={primaryFontFamily}
          size={previewSize}
        />
        <div className="border-b border-hairline p-3">
          <Slider
            label="Preview size"
            min={48}
            max={200}
            value={[previewSize]}
            formatValue={(v) => `${v}px`}
            onValueChange={([v]) => {
              if (v !== undefined) setPreviewSize(v);
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-4 py-2 text-[10px]">
          <span>
            Kerning: <strong>{data?.kerningValue ?? "—"} units</strong>
          </span>
          <span className="text-muted-foreground">
            Compare the browser-rendered pair above with and without kerning.
          </span>
        </div>
        {data ? (
          <>
            <div className="h-[min(42vh,430px)]">
              <KerningDiagram
                data={data}
                metrics={primaryData.metrics}
                options={options}
                color={colors[0] ?? "currentColor"}
              />
            </div>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-5 gap-y-1 border-t border-hairline px-4 py-3 text-xs">
              <dt>Pair</dt>
              <dd className="font-mono">{pair}</dd>
              <dt>Left glyph</dt>
              <dd className="font-mono">
                {data.left.glyphName ?? "Unnamed"} · glyph{" "}
                {data.left.glyphIndex} · {unicodeLabel(data.left.codePoint)}
              </dd>
              <dt>Right glyph</dt>
              <dd className="font-mono">
                {data.right.glyphName ?? "Unnamed"} · glyph{" "}
                {data.right.glyphIndex} · {unicodeLabel(data.right.codePoint)}
              </dd>
              <dt>Advances</dt>
              <dd className="font-mono">
                {data.left.advanceWidth} + {data.right.advanceWidth}
              </dd>
              <dt>Side bearings L/R</dt>
              <dd className="font-mono">
                {data.left.leftSideBearing}/{data.left.rightSideBearing} ·{" "}
                {data.right.leftSideBearing}/{data.right.rightSideBearing}
              </dd>
              <dt>Bounds L</dt>
              <dd className="font-mono">
                {Object.values(data.left.bounds).join(", ")}
              </dd>
              <dt>Bounds R</dt>
              <dd className="font-mono">
                {Object.values(data.right.bounds).join(", ")}
              </dd>
              <dt>Kerning</dt>
              <dd className="font-mono">
                {data.kerningValue} units ·{" "}
                {(data.normalizedKerning * 100).toFixed(2)}% em
              </dd>
              <dt>Pair advance</dt>
              <dd className="font-mono">
                {data.unkernedAdvance} unkerned · {data.kernedAdvance} kerned
              </dd>
            </dl>
          </>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Pair not supported
          </div>
        )}
        <KerningComparisonList
          slots={comparisonSlots}
          colors={colors}
          leftCodePoint={leftCodePoint}
          rightCodePoint={rightCodePoint}
        />
        <p className="p-4 text-xs text-muted-foreground">
          Kerning values are reported through font data exposed by OpenType.js.
          Advanced positioning may be applied differently by the browser shaping
          engine.
        </p>
      </main>
      <aside className="flex min-h-140 flex-col border-t border-hairline lg:min-h-0 lg:border-t-0 lg:border-l">
        <KerningPairSelector
          glyphs={primaryData.glyphs}
          leftCodePoint={leftCodePoint}
          rightCodePoint={rightCodePoint}
          target={target}
          onTargetChange={setTarget}
          onPairChange={selectPair}
          onGlyphSelect={chooseGlyph}
          fontFamily={primaryFontFamily}
        />
        <div className="border-t border-hairline p-3">
          <div className="mb-2 font-mono text-[10px] uppercase text-muted-foreground">
            Diagram layers
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(options).map(([key, value]) => (
              <Button
                key={key}
                size="sm"
                variant={value ? "default" : "outline"}
                aria-pressed={value}
                aria-label={`Toggle ${key}`}
                onClick={() =>
                  setOptions((current) => ({
                    ...current,
                    [key]: !current[key as keyof KerningOverlayOptions],
                  }))
                }
              >
                {key.replace(/([A-Z])/g, " $1")}
              </Button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
