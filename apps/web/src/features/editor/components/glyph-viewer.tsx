import type { ProjectFontEntity } from "@kerning/shared";
import {
  AlertCircle,
  Info,
  Languages,
  LoaderCircle,
  PanelsTopLeft,
  Plus,
  RotateCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "#/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet";
import { FontInspector } from "#/features/editor/components/font-inspector";
import {
  DEFAULT_OVERLAYS,
  GlyphMetricsPreview,
  type GlyphOverlayOptions,
} from "#/features/editor/components/glyph-metrics-preview";
import { KerningView } from "#/features/editor/components/kerning-view";
import type { FontLabLaunchContext } from "#/features/editor/font-lab-bridge/font-lab-context.types";
import {
  adjacentInspectablePairs,
  uniqueInspectableCharacters,
} from "#/features/editor/font-lab-bridge/text-selection";
import type { ProjectFontRole } from "#/features/editor/font-system/font-system.types";
import {
  type GlyphEntry,
  type LoadedGlyphFont,
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
  onClose: () => void;
  onPlaceOnCanvas?: (study: GlyphStudy) => void;
  initialRole?: ProjectFontRole;
  launchContext?: FontLabLaunchContext;
};

type GlyphMode = "single" | "pair";
type LoadedSlot = { data?: LoadedGlyphFont; error?: string };
export type GlyphStudy = {
  text: string;
  role?: ProjectFontRole;
  kind: GlyphMode;
};

const SYSTEM_FONT_ID = "system";
const SLOT_COLORS = ["var(--accent)", "#2774FF", "#13A36D"];
const SYSTEM_METRICS = {
  ascender: 800,
  capHeight: 700,
  xHeight: 500,
  baseline: 0,
  descender: -150,
};

function getFontFamily(option?: FontOption) {
  const family = option?.font.cssFamily ?? option?.font.family;
  return family
    ? `${JSON.stringify(family)}, system-ui, sans-serif`
    : "ui-sans-serif, system-ui, sans-serif";
}

/* Legacy guide retained in history; metric rendering now lives in GlyphMetricsPreview. */
function LegacyMetricGuide({ label, value }: { label: string; value: number }) {
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

function MetricBadges({
  slots,
  loaded,
  options,
}: {
  slots: string[];
  loaded: Record<string, LoadedSlot>;
  options: FontOption[];
}) {
  return (
    <div className="absolute right-4 bottom-4 z-10 flex flex-wrap justify-end gap-2">
      {slots.map((id, index) => {
        const option = options.find(({ font }) => font.dbId === id);
        const metrics = loaded[id]?.data
          ? normalizeGlyphMetrics(loaded[id].data.metrics)
          : SYSTEM_METRICS;
        return (
          <span
            key={id}
            className="rounded-md border bg-surface-glass px-2 py-1 font-mono text-[10px] backdrop-blur-xl"
            style={{
              borderColor: SLOT_COLORS[index],
              color: SLOT_COLORS[index],
            }}
          >
            {option?.font.family ?? "System"} · cap {metrics.capHeight} · x{" "}
            {metrics.xHeight} · desc {metrics.descender}
          </span>
        );
      })}
    </div>
  );
}

export function LegacyGlyphPreview({
  entries,
  metrics,
  slots,
  loaded,
  options,
  systemCharacter,
}: {
  entries: Array<GlyphEntry | undefined>;
  metrics: typeof SYSTEM_METRICS;
  slots: string[];
  loaded: Record<string, LoadedSlot>;
  options: FontOption[];
  systemCharacter: string;
}) {
  const geometries = useMemo(
    () =>
      entries.map((entry) => {
        if (!entry) return null;
        const unitScale = 1000 / entry.font.unitsPerEm;
        const bounds = entry.glyph.getBoundingBox();
        const xMin = bounds.x1 * unitScale;
        const xMax = bounds.x2 * unitScale;
        const originX = 600 - (xMin + xMax) / 2;
        return {
          path: entry.glyph
            .getPath(originX, 0, 1000, undefined, entry.font)
            .toPathData(2),
          left: originX + xMin,
        };
      }),
    [entries],
  );

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-surface-glass">
      <svg
        aria-label="Selected glyph preview"
        className="size-full text-foreground"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 -900 1200 1200"
      >
        <LegacyMetricGuide label="CAP HEIGHT" value={metrics.capHeight} />
        <LegacyMetricGuide label="X-HEIGHT" value={metrics.xHeight} />
        <LegacyMetricGuide label="BASELINE" value={0} />
        <LegacyMetricGuide label="DESCENDER" value={metrics.descender} />
        {geometries.map((geometry, index) => {
          const slot = slots[index];
          if (!slot) return null;
          if (!geometry) {
            const option = options.find(({ font }) => font.dbId === slot);
            return slot === SYSTEM_FONT_ID ? (
              <text
                key={slot}
                x="600"
                y="0"
                fill={SLOT_COLORS[index]}
                fillOpacity={slots.length > 1 ? 0.58 : 1}
                fontFamily={getFontFamily(option)}
                fontSize="1000"
                textAnchor="middle"
              >
                {systemCharacter}
              </text>
            ) : null;
          }
          return (
            <g
              key={slot}
              color={SLOT_COLORS[index]}
              opacity={slots.length > 1 ? 0.58 : 1}
            >
              <line
                x1={geometry.left}
                x2={geometry.left}
                y1={-metrics.ascender}
                y2={-metrics.descender}
                stroke="currentColor"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={geometry.path}
                fill={slots.length === 1 ? "currentColor" : SLOT_COLORS[index]}
              />
            </g>
          );
        })}
      </svg>
      <MetricBadges slots={slots} loaded={loaded} options={options} />
    </div>
  );
}

export function TextOutline({
  font,
  text,
  size,
  color,
}: {
  font: LoadedGlyphFont;
  text: string;
  size: number;
  color: string;
}) {
  const geometry = useMemo(() => {
    const parsedFont = font.fonts[0];
    if (!parsedFont) return { paths: [], missing: [], width: 0 };
    let x = 24;
    const paths: Array<{ x: number; data: string }> = [];
    const missing: Array<{ x: number; width: number }> = [];
    const scale = size / parsedFont.unitsPerEm;
    for (const character of Array.from(text)) {
      const glyph = parsedFont.charToGlyph(character);
      const advance = Math.max(
        size * 0.5,
        (glyph.advanceWidth ?? parsedFont.unitsPerEm * 0.5) * scale,
      );
      if (glyph.index === 0 && !/^\s$/u.test(character)) {
        missing.push({ x, width: advance });
      } else {
        // Use Font#getPath so shaping and outline generation stay with opentype.js.
        paths.push({
          x,
          data: parsedFont.getPath(character, x, 0, size).toPathData(2),
        });
      }
      x += advance;
    }
    return { paths, missing, width: x + 24 };
  }, [font, size, text]);

  return (
    <svg
      className="h-full min-w-full"
      style={{ width: geometry.width }}
      viewBox={`0 ${-size} ${Math.max(geometry.width, 600)} ${size * 2}`}
      preserveAspectRatio="xMinYMid meet"
      aria-label="Text rendered from font outlines"
    >
      {geometry.paths.map((path) => (
        <path key={path.x} d={path.data} fill={color} />
      ))}
      {geometry.missing.map((box) => (
        <rect
          key={box.x}
          x={box.x}
          y={-size * 0.75}
          width={box.width}
          height={size * 0.75}
          fill="none"
          stroke={color}
          strokeDasharray="6 5"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export function TextPreview({
  slots,
  loaded,
  options,
  text,
  fontSize,
}: {
  slots: string[];
  loaded: Record<string, LoadedSlot>;
  options: FontOption[];
  text: string;
  fontSize: number;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface-glass pb-14">
      {slots.map((id, index) => {
        const data = loaded[id]?.data;
        const option = options.find(({ font }) => font.dbId === id);
        const metrics = data
          ? normalizeGlyphMetrics(data.metrics)
          : SYSTEM_METRICS;
        return (
          <section
            key={id}
            className="relative min-h-52 flex-1 overflow-x-auto border-b border-hairline px-5 pt-9"
          >
            <span
              className="absolute top-3 left-5 font-mono text-[10px] uppercase tracking-[0.12em]"
              style={{ color: SLOT_COLORS[index] }}
            >
              {option?.font.family ?? "System"}
            </span>
            <div
              className="pointer-events-none absolute inset-x-0"
              style={{
                top: `calc(50% - ${(metrics.capHeight / 1000) * fontSize}px)`,
              }}
            >
              <div className="border-t border-dashed border-foreground/20" />
            </div>
            <div
              className="pointer-events-none absolute inset-x-0"
              style={{
                top: `calc(50% - ${(metrics.xHeight / 1000) * fontSize}px)`,
              }}
            >
              <div className="border-t border-dashed border-foreground/15" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-foreground/30" />
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-foreground/20"
              style={{
                top: `calc(50% + ${(Math.abs(metrics.descender) / 1000) * fontSize}px)`,
              }}
            />
            {data ? (
              <TextOutline
                font={data}
                text={text}
                size={fontSize}
                color={SLOT_COLORS[index]}
              />
            ) : (
              <div className="flex h-full items-center text-sm text-muted-foreground">
                {loaded[id]?.error ?? "Loading outlines…"}
              </div>
            )}
          </section>
        );
      })}
      <MetricBadges slots={slots} loaded={loaded} options={options} />
    </div>
  );
}

export function GlyphViewer({
  fonts,
  onClose,
  onPlaceOnCanvas,
  initialRole,
  launchContext,
}: GlyphViewerProps) {
  const initialFont =
    fonts.find(({ font }) => font.dbId === launchContext?.fontId) ??
    fonts.find(
      ({ role }) =>
        role ===
        (initialRole === "secondary-one"
          ? "sec1"
          : initialRole === "secondary-two"
            ? "sec2"
            : initialRole),
    );
  const [primaryId] = useState(
    () => initialFont?.font.dbId ?? fonts[0]?.font.dbId ?? SYSTEM_FONT_ID,
  );
  const [glyphMode, setGlyphMode] = useState<GlyphMode>(
    launchContext?.surface === "pair" ? "pair" : "single",
  );
  const [detailsId, setDetailsId] = useState<string | undefined>(
    launchContext?.surface === "font-details"
      ? launchContext.fontId
      : undefined,
  );
  const [selectedCodePoint, setSelectedCodePoint] = useState(
    launchContext?.selectedCodePoint ?? 65,
  );
  const [selectedPair, setSelectedPair] = useState(() => ({
    leftCodePoint: launchContext?.pair?.leftCodePoint ?? 65,
    rightCodePoint: launchContext?.pair?.rightCodePoint ?? 86,
  }));
  const [loaded, setLoaded] = useState<Record<string, LoadedSlot>>({});
  const [retryKey, setRetryKey] = useState(0);
  const [overlays, setOverlays] =
    useState<GlyphOverlayOptions>(DEFAULT_OVERLAYS);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "glyph-editor");
    url.searchParams.set("glyphMode", glyphMode);
    window.history.replaceState(window.history.state, "", url);
  }, [glyphMode]);

  useEffect(() => {
    let cancelled = false;
    if (primaryId === SYSTEM_FONT_ID) return;
    const option = fonts.find(({ font }) => font.dbId === primaryId);
    if (!option) return;
    setLoaded((current) => ({ ...current, [primaryId]: {} }));
    void loadGlyphFont(option.font, retryKey)
      .then((data) => {
        if (!cancelled)
          setLoaded((current) => ({ ...current, [primaryId]: { data } }));
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setLoaded((current) => ({
            ...current,
            [primaryId]: {
              error:
                reason instanceof Error
                  ? reason.message
                  : "The font could not be loaded.",
            },
          }));
      });
    return () => {
      cancelled = true;
    };
  }, [fonts, primaryId, retryKey]);

  const primaryData = loaded[primaryId]?.data;
  const primaryOption = fonts.find(({ font }) => font.dbId === primaryId);
  const primaryFontFamily = getFontFamily(primaryOption);
  const slots = [primaryId];
  const kerningComparisonSlots = [
    {
      id: primaryId,
      family: primaryOption?.font.family ?? "System",
      fontFamily: primaryFontFamily,
      data: primaryData,
      error: loaded[primaryId]?.error,
      system: primaryId === SYSTEM_FONT_ID,
    },
  ];
  const metrics = primaryData
    ? normalizeGlyphMetrics(primaryData.metrics)
    : SYSTEM_METRICS;
  const displayedCharacters =
    primaryId === SYSTEM_FONT_ID
      ? SYSTEM_GLYPHS.map((character) => ({
          character,
          codePoint: character.codePointAt(0) ?? 0,
        }))
      : (primaryData?.glyphs ?? []);
  const entries = [
    primaryData?.glyphs.find(
      (glyph) => glyph.codePoint === selectedCodePoint,
    ),
  ];
  const isPrimaryLoading =
    primaryId !== SYSTEM_FONT_ID && !primaryData && !loaded[primaryId]?.error;
  const primaryError = loaded[primaryId]?.error;
  const detailsOption = fonts.find(({ font }) => font.dbId === detailsId);
  const detailsData = detailsId ? loaded[detailsId]?.data : undefined;
  const sourceText = launchContext?.sampleText ?? "";
  const sourceCharacters = useMemo(
    () => uniqueInspectableCharacters(sourceText),
    [sourceText],
  );
  const sourcePairs = useMemo(
    () => adjacentInspectablePairs(sourceText),
    [sourceText],
  );
  const trayCharacters = sourceCharacters.length
    ? sourceCharacters
    : displayedCharacters.slice(0, 52).map(({ character }) => character);
  const studyText =
    glyphMode === "pair"
      ? `${String.fromCodePoint(selectedPair.leftCodePoint)}${String.fromCodePoint(selectedPair.rightCodePoint)}`
      : String.fromCodePoint(selectedCodePoint);

  useEffect(() => {
    if (!displayedCharacters.length) return;
    if (launchContext?.selectedCodePoint === selectedCodePoint) return;
    if (
      !displayedCharacters.some(
        (glyph) => glyph.codePoint === selectedCodePoint,
      )
    ) {
      setSelectedCodePoint(displayedCharacters[0]?.codePoint ?? 65);
    }
  }, [
    displayedCharacters,
    launchContext?.selectedCodePoint,
    selectedCodePoint,
  ]);

  return (
    <section
      aria-label="Glyph Inspector"
      className="relative grid h-full min-h-0 grid-rows-[4rem_minmax(0,1fr)] overflow-hidden bg-surface-wash"
    >
      <header className="relative z-30 flex min-h-16 items-center gap-2 border-b border-accent/15 px-3">
        <div className="flex shrink-0 gap-1 rounded-xl border border-white/60 bg-surface-glass p-1 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-3xl">
          <Button
            type="button"
            aria-label={
              launchContext?.sourceLabel
                ? `Back to ${launchContext.sourceLabel}`
                : "Return to Scenario Editor"
            }
            title="Editor viewer"
            variant="ghost"
            size={launchContext?.returnTarget?.nodeId ? "sm" : "icon"}
            className="text-accent hover:bg-accent/10 hover:text-accent"
            onClick={onClose}
          >
            <PanelsTopLeft />
            {launchContext?.returnTarget?.nodeId ? "Back to Canvas" : null}
          </Button>
          <Button
            type="button"
            aria-label="Glyph Inspector"
            aria-current="page"
            variant="ghost"
            size="icon"
            className="bg-accent text-background hover:bg-accent hover:text-background"
          >
            <Languages />
          </Button>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {primaryOption?.font.family ?? "System font"}
          </p>
          {launchContext?.sourceLabel ? (
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {launchContext.sourceLabel}
            </p>
          ) : null}
        </div>
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 rounded-xl border border-accent/20 bg-accent/5 p-1 shadow-sm">
          <Button
            size="xs"
            variant="ghost"
            className={glyphMode === "single" ? "bg-accent text-background hover:bg-accent hover:text-background" : "text-accent"}
            aria-pressed={glyphMode === "single"}
            onClick={() => setGlyphMode("single")}
          >
            Single
          </Button>
          <Button
            size="xs"
            variant="ghost"
            className={glyphMode === "pair" ? "bg-accent text-background hover:bg-accent hover:text-background" : "text-accent"}
            aria-pressed={glyphMode === "pair"}
            onClick={() => setGlyphMode("pair")}
          >
            Pair
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Open ${primaryOption?.font.family ?? "font"} details`}
            onClick={() =>
              primaryId !== SYSTEM_FONT_ID && setDetailsId(primaryId)
            }
          >
            <Info />
          </Button>
          {onPlaceOnCanvas ? (
            <Button
              size="sm"
              onClick={() =>
                onPlaceOnCanvas({
                  text: studyText,
                  role: launchContext?.role,
                  kind: glyphMode,
                })
              }
            >
              <Plus /> Place on Canvas
            </Button>
          ) : null}
        </div>
      </header>

      <main className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden p-3 sm:p-5">
        <div className="min-h-0 overflow-hidden rounded-2xl border border-white/60 bg-surface-glass shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-3xl">
        {glyphMode === "pair" ? (
        isPrimaryLoading ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Parsing font…
          </div>
        ) : primaryError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <AlertCircle className="size-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{primaryError}</p>
            <Button
              variant="outline"
              onClick={() => setRetryKey((key) => key + 1)}
            >
              <RotateCw /> Retry
            </Button>
          </div>
        ) : primaryData ? (
          <KerningView
            primaryData={primaryData}
            primaryFontFamily={primaryFontFamily}
            comparisonSlots={kerningComparisonSlots}
            colors={SLOT_COLORS}
            initialPair={selectedPair}
            key={`${selectedPair.leftCodePoint}:${selectedPair.rightCodePoint}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Numerical kerning metrics are unavailable for the system font.
          </div>
        )) : (
          <section className="flex h-full min-h-0 flex-col">
            {isPrimaryLoading ? (
              <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" /> Parsing font…
              </div>
            ) : primaryError ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
                <AlertCircle className="size-6 text-destructive" />
                <p className="max-w-sm text-sm text-muted-foreground">
                  {primaryError}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setRetryKey((key) => key + 1)}
                >
                  <RotateCw /> Retry
                </Button>
              </div>
            ) : (
              <GlyphMetricsPreview
                entries={entries}
                metrics={metrics}
                slots={slots}
                loaded={loaded}
                overlays={overlays}
                onOverlaysChange={setOverlays}
                systemCharacter={String.fromCodePoint(selectedCodePoint)}
                primaryFontFamily={primaryFontFamily}
              />
            )}
          </section>
        )}
        </div>
        <section
          aria-label="Available glyphs"
          className="rounded-2xl border border-white/60 bg-surface-glass p-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-3xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {sourceText ? "Source text" : "Character tray"}
              </p>
              {sourceText ? (
                <p
                  className="mt-1 truncate text-sm"
                  style={{ fontFamily: primaryFontFamily }}
                >
                  {sourceText}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 font-mono text-[10px] text-muted-foreground">
              {glyphMode === "single" ? "Choose a letter" : "Choose a pair"}
            </p>
          </div>
          <div
            className="mt-3 flex gap-1 overflow-x-auto pb-1"
            style={{ fontFamily: primaryFontFamily }}
          >
            {glyphMode === "single"
              ? trayCharacters.map((character, index) => {
                  const codePoint = character.codePointAt(0) ?? 0;
                  return (
                    <button
                      key={`${codePoint}:${index}`}
                      type="button"
                      aria-label={`Select ${character}, Unicode ${codePoint.toString(16).toUpperCase().padStart(4, "0")}`}
                      aria-pressed={selectedCodePoint === codePoint}
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent text-xl transition-colors hover:bg-accent/10 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/50 aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-background"
                      onClick={() => setSelectedCodePoint(codePoint)}
                    >
                      {character}
                    </button>
                  );
                })
              : sourcePairs.map((pair) => (
                  <button
                    key={`${pair.leftCodePoint}:${pair.rightCodePoint}`}
                    type="button"
                    aria-label={`Select pair ${pair.text}`}
                    aria-pressed={
                      selectedPair.leftCodePoint === pair.leftCodePoint &&
                      selectedPair.rightCodePoint === pair.rightCodePoint
                    }
                    className="flex h-10 shrink-0 items-center justify-center rounded-lg border border-transparent px-3 text-xl transition-colors hover:bg-accent/10 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent/50 aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-background"
                    onClick={() => setSelectedPair(pair)}
                  >
                    {pair.text}
                  </button>
                ))}
          </div>
        </section>
      </main>
      <Sheet
        open={Boolean(detailsId)}
        onOpenChange={(open) => {
          if (!open) setDetailsId(undefined);
        }}
      >
        <SheetContent className="w-[min(94vw,680px)] overflow-hidden p-0 sm:max-w-170">
          <SheetHeader className="border-b border-hairline">
            <SheetTitle>Font details</SheetTitle>
            <SheetDescription>
              {detailsOption?.font.family ?? "Font metadata and capabilities"}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {detailsData && detailsOption ? (
              <FontInspector
                data={detailsData}
                entity={detailsOption.font}
                fontFamily={getFontFamily(detailsOption)}
              />
            ) : (
              <div className="p-8 text-sm text-muted-foreground">
                Font details are loading…
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}
