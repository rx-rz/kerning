import type { ProjectFontEntity } from "@kerning/shared";
import { Check, Copy, Eye, EyeOff, Info, RotateCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Slider } from "#/components/ui/slider";
import { useFontLabContextStore } from "#/features/editor/font-lab-bridge/font-lab-context.store";
import type { FontLabLaunchContext } from "#/features/editor/font-lab-bridge/font-lab-context.types";
import type { LoadedGlyphFont } from "#/features/editor/lib/glyph-font";
import { normalizeGlyphMetrics } from "#/features/editor/lib/glyph-font";
import { getOpenTypeFeatures } from "#/features/editor/lib/open-type-features";
import { useEditorStore } from "#/features/editor/store/editor-store";

export type ComparisonSlot = {
  id: string;
  family: string;
  fontFamily: string;
  entity?: ProjectFontEntity;
  data?: LoadedGlyphFont;
  error?: string;
  loading: boolean;
};

type Layout = "stacked" | "side-by-side" | "overlay";
type Sizing = "same-font-size" | "match-cap-height" | "match-x-height";
type Override = {
  enabled: boolean;
  hidden: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  baselineShift: number;
  features: Set<string>;
  axes: Record<string, number>;
};

const PRESETS = {
  headline: "Variable type changes everything.",
  paragraph:
    "A well-designed typeface creates rhythm, hierarchy, and clarity across every line of text.",
  ui: "Create project\nSave changes\nLast edited 4 minutes ago\nSearch fonts…",
  numbers: "0123456789\n$1,234.56\n12:45 PM\n01/07/2026",
  punctuation: ".,:;!? “quotes” ‘apostrophes’ — – (parentheses) [brackets]",
  kerning: "AV AW AY To Ta Te Ty Va Wa Yo LT PA",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz",
} as const;
const DEFAULT_TEXT = PRESETS.headline;
const DEFAULT_FEATURES = new Set(["kern", "liga", "clig", "calt"]);
const EXCLUSIVE = [
  ["onum", "lnum"],
  ["pnum", "tnum"],
  ["sups", "subs"],
];

function support(data: LoadedGlyphFont | undefined, text: string) {
  if (!data) return [];
  const supported = new Set(data.glyphs.map((glyph) => glyph.codePoint));
  return [
    ...new Set(
      Array.from(text).filter(
        (character) =>
          !/^\s$/u.test(character) &&
          !supported.has(character.codePointAt(0) ?? -1),
      ),
    ),
  ];
}

export function FontComparisonView({
  slots,
  colors,
  onOpenDetails,
  availableFonts,
  onAddFont,
  onRemoveFont,
  launchContext,
}: {
  slots: ComparisonSlot[];
  colors: string[];
  onOpenDetails: (id: string) => void;
  availableFonts: Array<{ id: string; family: string; roleLabel: string }>;
  onAddFont: (id: string) => void;
  onRemoveFont: (id: string) => void;
  launchContext?: FontLabLaunchContext;
}) {
  const [text, setText] = useState<string>(
    launchContext?.sampleText || DEFAULT_TEXT,
  );
  const [preset, setPreset] = useState<string>(
    launchContext?.sampleText ? "custom" : "headline",
  );
  const [fontSize, setFontSize] = useState(
    launchContext?.textStyle?.fontSize ?? 80,
  );
  const [lineHeight, setLineHeight] = useState(
    launchContext?.textStyle?.lineHeight ?? 1.1,
  );
  const [letterSpacing, setLetterSpacing] = useState(
    launchContext?.textStyle?.letterSpacing ?? 0,
  );
  const [layout, setLayout] = useState<Layout>("stacked");
  const [sizing, setSizing] = useState<Sizing>("same-font-size");
  const [selectedId, setSelectedId] = useState(slots[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const fontSystem = useEditorStore((state) => state.fontSystem);
  const setTextNodeFontSource = useEditorStore(
    (state) => state.setTextNodeFontSource,
  );
  const assignFontToRole = useEditorStore((state) => state.assignFontToRole);
  const setTemporarySettings = useFontLabContextStore(
    (state) => state.setTemporarySettings,
  );
  useEffect(() => {
    if (!slots.some((slot) => slot.id === selectedId))
      setSelectedId(slots[0]?.id ?? "");
  }, [selectedId, slots]);
  const normalized = useMemo(
    () =>
      Object.fromEntries(
        slots.map((slot) => [
          slot.id,
          slot.data ? normalizeGlyphMetrics(slot.data.metrics) : undefined,
        ]),
      ),
    [slots],
  );
  const reference = normalized[slots[0]?.id ?? ""];
  const visible =
    layout === "overlay"
      ? slots.filter((slot) => !overrides[slot.id]?.hidden)
      : slots;
  const selected = slots.find((slot) => slot.id === selectedId) ?? slots[0];
  const selectedFeatures = selected?.data
    ? getOpenTypeFeatures(selected.data)
    : [];
  const selectedOverride = selected ? overrides[selected.id] : undefined;
  function defaults(slot: ComparisonSlot): Override {
    const contextual =
      slot.id === launchContext?.fontId ? launchContext : undefined;
    const roleConfig = Object.values(fontSystem.roles).find(
      (config) => config?.fontId === slot.id,
    );
    const saved = roleConfig
      ? fontSystem.variants[roleConfig.activeVariantId]
      : undefined;
    return {
      enabled: false,
      hidden: false,
      fontSize,
      lineHeight,
      letterSpacing,
      baselineShift: 0,
      features: contextual?.featureSettings
        ? new Set(
            Object.entries(contextual.featureSettings)
              .filter(([, enabled]) => enabled)
              .map(([tag]) => tag),
          )
        : saved
          ? new Set(
              Object.entries(saved.featureSettings)
                .filter(([, enabled]) => enabled)
                .map(([tag]) => tag),
            )
          : new Set(
              getOpenTypeFeatures(
                slot.data ?? {
                  fonts: [],
                  glyphs: [],
                  metrics: {
                    unitsPerEm: 1000,
                    ascender: 800,
                    capHeight: 700,
                    xHeight: 500,
                    descender: -200,
                  },
                },
              )
                .filter(({ tag }) => DEFAULT_FEATURES.has(tag))
                .map(({ tag }) => tag),
            ),
      axes: contextual?.variationSettings
        ? { ...contextual.variationSettings }
        : saved
          ? { ...saved.variationSettings }
          : Object.fromEntries(
              (slot.entity?.axes ?? []).map((axis) => [
                axis.tag,
                axis.defaultValue,
              ]),
            ),
    };
  }
  function browserSettings(slot = selected) {
    if (!slot) return null;
    const value = overrides[slot.id] ?? defaults(slot);
    return {
      fontId: slot.id,
      featureSettings: Object.fromEntries(
        selectedFeatures.map(({ tag }) => [tag, value.features.has(tag)]),
      ),
      variationSettings: { ...value.axes },
      fontSize: value.enabled ? value.fontSize : fontSize,
      lineHeight: value.enabled ? value.lineHeight : lineHeight,
      letterSpacing: value.enabled ? value.letterSpacing : letterSpacing,
    };
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: synchronize the normalized preview values, not helper identity
  useEffect(() => {
    const settings = browserSettings();
    if (settings) setTemporarySettings(settings);
  }, [selectedId, overrides, fontSize, lineHeight, letterSpacing]);
  function update(id: string, change: (value: Override) => Override) {
    const slot = slots.find((candidate) => candidate.id === id);
    if (!slot) return;
    setOverrides((current) => ({
      ...current,
      [id]: change(current[id] ?? defaults(slot)),
    }));
  }
  function effectiveSize(slot: ComparisonSlot) {
    const custom = overrides[slot.id];
    const base = custom?.enabled ? custom.fontSize : fontSize;
    if (sizing === "same-font-size" || !reference || !normalized[slot.id])
      return base;
    const key = sizing === "match-cap-height" ? "capHeight" : "xHeight";
    const metric = normalized[slot.id]?.[key];
    return metric && metric > 0 ? (base * reference[key]) / metric : base;
  }
  function featureString(slot: ComparisonSlot) {
    const value = overrides[slot.id] ?? defaults(slot);
    return getOpenTypeFeatures(
      slot.data ?? {
        fonts: [],
        glyphs: [],
        metrics: {
          unitsPerEm: 1000,
          ascender: 800,
          capHeight: 700,
          xHeight: 500,
          descender: -200,
        },
      },
    )
      .map(({ tag }) => `"${tag}" ${value.features.has(tag) ? 1 : 0}`)
      .join(", ");
  }
  function variationString(slot: ComparisonSlot) {
    return Object.entries((overrides[slot.id] ?? defaults(slot)).axes)
      .map(([tag, value]) => `"${tag}" ${value}`)
      .join(", ");
  }
  async function copyCss() {
    if (!selected) return;
    const value = overrides[selected.id] ?? defaults(selected);
    const lines = [
      `font-family: ${JSON.stringify(selected.family)};`,
      `font-size: ${Math.round(effectiveSize(selected))}px;`,
      `line-height: ${value.enabled ? value.lineHeight : lineHeight};`,
    ];
    const spacing = value.enabled ? value.letterSpacing : letterSpacing;
    if (spacing) lines.push(`letter-spacing: ${spacing}em;`);
    const features = featureString(selected);
    if (features) lines.push(`font-feature-settings: ${features};`);
    const axes = variationString(selected);
    if (axes) lines.push(`font-variation-settings: ${axes};`);
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  const sourceTextNode =
    launchContext?.source.type === "text-node"
      ? launchContext.source
      : undefined;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Fonts
        </span>
        {slots.map((slot, index) => (
          <span
            key={slot.id}
            className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={{ borderColor: colors[index], color: colors[index] }}
          >
            {slot.family}
            {index === 0 ? (
              <span className="font-normal opacity-70">Source</span>
            ) : (
              <button
                type="button"
                aria-label={`Remove ${slot.family} from comparison`}
                className="ml-1 text-base leading-none"
                onClick={() => onRemoveFont(slot.id)}
              >
                ×
              </button>
            )}
          </span>
        ))}
        {slots.length < 3 && availableFonts.length > 0 ? (
          availableFonts.map((font) => <button key={font.id} type="button" className="rounded-md border border-transparent px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-accent hover:bg-accent/10 hover:text-accent" onClick={() => onAddFont(font.id)}>{font.family}<span className="ml-1 opacity-55">{font.roleLabel}</span></button>)
        ) : slots.length >= 3 ? (
          <span className="text-xs text-muted-foreground">Maximum 3 fonts</span>
        ) : (
          <span className="text-xs text-muted-foreground">
            No other project fonts available
          </span>
        )}
      </div>
      <div className="grid gap-2 border-b border-hairline p-3 lg:grid-cols-[minmax(240px,1fr)_150px_150px_150px]">
        <Input
          aria-label="Comparison text"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setPreset("custom");
          }}
        />
        <Select
          value={preset}
          onValueChange={(value) => {
            setPreset(value);
            if (value !== "custom")
              setText(PRESETS[value as keyof typeof PRESETS]);
          }}
        >
          <SelectTrigger aria-label="Content preset">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(PRESETS).map((key) => (
              <SelectItem key={key} value={key}>
                {key[0]?.toUpperCase()}
                {key.slice(1)}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={layout}
          onValueChange={(value) => setLayout(value as Layout)}
        >
          <SelectTrigger aria-label="Comparison layout">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stacked">Stacked</SelectItem>
            <SelectItem value="side-by-side">Side by side</SelectItem>
            <SelectItem value="overlay">Overlay</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sizing}
          onValueChange={(value) => setSizing(value as Sizing)}
        >
          <SelectTrigger aria-label="Comparison sizing">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="same-font-size">Same font size</SelectItem>
            <SelectItem value="match-cap-height">Match cap height</SelectItem>
            <SelectItem value="match-x-height">Match x-height</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2 border-b border-hairline p-3 md:grid-cols-[1fr_1fr_1fr_170px_auto]">
        <Slider
          label="Size"
          min={20}
          max={200}
          value={[fontSize]}
          formatValue={(value) => `${value}px`}
          onValueChange={([value]) => value !== undefined && setFontSize(value)}
        />
        <Slider
          label="Line height"
          min={0.7}
          max={2}
          step={0.05}
          value={[lineHeight]}
          formatValue={(value) => value.toFixed(2)}
          onValueChange={([value]) =>
            value !== undefined && setLineHeight(value)
          }
        />
        <Slider
          label="Letter spacing"
          min={-0.1}
          max={0.2}
          step={0.005}
          value={[letterSpacing]}
          formatValue={(value) => `${value.toFixed(3)}em`}
          onValueChange={([value]) =>
            value !== undefined && setLetterSpacing(value)
          }
        />
        <Button
          variant="outline"
          onClick={() => {
            setText(DEFAULT_TEXT);
            setPreset("headline");
            setFontSize(80);
            setLineHeight(1.1);
            setLetterSpacing(0);
            setLayout("stacked");
            setSizing("same-font-size");
            setOverrides({});
          }}
        >
          <RotateCw /> Reset
        </Button>
      </div>
      {layout === "overlay" && Array.from(text).length > 80 ? (
        <p className="border-b border-hairline px-4 py-2 text-xs text-muted-foreground">
          Overlay is clearest with a short, single-line sample.
        </p>
      ) : null}
      <div
        className="grid min-h-0 flex-1 overflow-y-auto"
        style={{
          gridTemplateColumns:
            layout === "side-by-side"
              ? `repeat(${Math.max(1, visible.length)}, minmax(0, 1fr))`
              : "1fr",
        }}
      >
        <div
          className={
            layout === "overlay" ? "relative min-h-90" : "contents"
          }
        >
          {visible.map((slot, index) => {
            const current = overrides[slot.id];
            const size = effectiveSize(slot);
            const missing = support(slot.data, text);
            const style = {
              fontFamily: slot.fontFamily,
              fontSize: size,
              fontWeight: launchContext?.textStyle?.fontWeight,
              fontStyle: launchContext?.textStyle?.fontStyle,
              lineHeight: current?.enabled ? current.lineHeight : lineHeight,
              letterSpacing: `${current?.enabled ? current.letterSpacing : letterSpacing}em`,
              transform: `translateY(${current?.baselineShift ?? 0}px)`,
              fontFeatureSettings: featureString(slot) || undefined,
              fontVariationSettings: variationString(slot) || undefined,
              fontKerning: "normal",
              maxWidth: launchContext?.textStyle?.containerWidth,
              color: layout === "overlay" ? colors[index] : undefined,
            } as const;
            return (
              <section
                key={slot.id}
                aria-label={`Select ${slot.family} comparison`}
                className={`${layout === "overlay" ? "absolute inset-0" : "min-h-56"} ${selectedId === slot.id ? "ring-2 ring-inset ring-accent/40" : ""} overflow-auto border-b border-r border-hairline p-4 outline-none`}
              >
                <div className="relative z-10 mb-4 flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedId(slot.id)}
                    className="font-semibold"
                    style={{ color: colors[index] }}
                  >
                    {slot.family}
                  </button>
                  {index === 0 ? (
                    <span className="text-muted-foreground">Source</span>
                  ) : null}
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Open ${slot.family} font details`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenDetails(slot.id);
                    }}
                  >
                    <Info />
                  </Button>
                  {layout === "overlay" ? (
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`${current?.hidden ? "Show" : "Hide"} ${slot.family}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        update(slot.id, (value) => ({
                          ...value,
                          hidden: !value.hidden,
                        }));
                      }}
                    >
                      {current?.hidden ? <Eye /> : <EyeOff />}
                    </Button>
                  ) : null}
                </div>
                {slot.loading ? (
                  <p className="text-sm text-muted-foreground">Loading font…</p>
                ) : slot.error ? (
                  <p className="text-sm text-destructive">{slot.error}</p>
                ) : (
                  <div
                    className="relative whitespace-pre-wrap wrap-break-word"
                    style={style}
                  >
                    {text}
                  </div>
                )}
                <p className="relative z-10 mt-4 font-mono text-[10px] text-muted-foreground">
                  {missing.length
                    ? `Missing: ${missing.slice(0, 8).join(" ")}${missing.length > 8 ? ` +${missing.length - 8}` : ""}`
                    : "All sample characters supported"}
                </p>
              </section>
            );
          })}
        </div>
      </div>
      {selected ? (
        <aside className="max-h-[42vh] overflow-y-auto border-t border-hairline bg-surface-glass p-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{selected.family}</h3>
            <Button size="xs" variant="outline" onClick={copyCss}>
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy CSS"}
            </Button>
            {sourceTextNode ? (
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  setTextNodeFontSource(
                    sourceTextNode.cardId,
                    sourceTextNode.nodeId,
                    { type: "font", fontId: selected.id },
                  )
                }
              >
                Use font for this block
              </Button>
            ) : null}
            {sourceTextNode ? (
              <Button
                size="xs"
                variant="outline"
                onClick={() => assignFontToRole("primary", selected.id)}
              >
                Assign to Primary
              </Button>
            ) : null}
            {sourceTextNode ? (
              <Button
                size="xs"
                variant="outline"
                onClick={() => assignFontToRole("secondary-one", selected.id)}
              >
                Assign to Secondary
              </Button>
            ) : null}
            <Button
              size="xs"
              variant={selectedOverride?.enabled ? "default" : "outline"}
              onClick={() =>
                update(selected.id, (value) => ({
                  ...value,
                  enabled: !value.enabled,
                }))
              }
            >
              {selectedOverride?.enabled
                ? "Custom settings"
                : "Use shared settings"}
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() =>
                setOverrides((current) => {
                  const next = { ...current };
                  delete next[selected.id];
                  return next;
                })
              }
            >
              Reset overrides
            </Button>
          </div>
          {selectedOverride?.enabled ? (
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <Slider
                label="Custom size"
                min={20}
                max={200}
                value={[selectedOverride.fontSize]}
                onValueChange={([value]) =>
                  value !== undefined &&
                  update(selected.id, (item) => ({ ...item, fontSize: value }))
                }
              />
              <Slider
                label="Custom line height"
                min={0.7}
                max={2}
                step={0.05}
                value={[selectedOverride.lineHeight]}
                onValueChange={([value]) =>
                  value !== undefined &&
                  update(selected.id, (item) => ({
                    ...item,
                    lineHeight: value,
                  }))
                }
              />
              <Slider
                label="Custom spacing"
                min={-0.1}
                max={0.2}
                step={0.005}
                value={[selectedOverride.letterSpacing]}
                onValueChange={([value]) =>
                  value !== undefined &&
                  update(selected.id, (item) => ({
                    ...item,
                    letterSpacing: value,
                  }))
                }
              />
              <Slider
                label="Baseline shift"
                min={-40}
                max={40}
                value={[selectedOverride.baselineShift]}
                formatValue={(value) => `${value}px`}
                onValueChange={([value]) =>
                  value !== undefined &&
                  update(selected.id, (item) => ({
                    ...item,
                    baselineShift: value,
                  }))
                }
              />
            </div>
          ) : null}
          <details
            open
            className="mt-3 border-t border-hairline pt-3"
          >
            <summary className="cursor-pointer text-xs font-semibold">
              OpenType features ({selectedFeatures.length})
            </summary>
            <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {selectedFeatures.map((feature) => {
                const enabled = (
                  selectedOverride ?? defaults(selected)
                ).features.has(feature.tag);
                return (
                  <button
                    key={feature.tag}
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    className="flex justify-between border border-hairline p-2 text-left text-xs aria-checked:border-accent"
                    onClick={() =>
                      update(selected.id, (value) => {
                        const features = new Set(value.features);
                        if (features.has(feature.tag))
                          features.delete(feature.tag);
                        else {
                          features.add(feature.tag);
                          for (const group of EXCLUSIVE)
                            if (group.includes(feature.tag))
                              for (const other of group)
                                if (other !== feature.tag)
                                  features.delete(other);
                        }
                        return { ...value, features };
                      })
                    }
                  >
                    <span className="flex items-center gap-1">{feature.label}<Info className="size-3 text-muted-foreground" aria-label={feature.description} /></span>
                    <code title={feature.description}>{feature.tag}</code>
                  </button>
                );
              })}
            </div>
          </details>
          {(selected.entity?.axes?.length ?? 0) > 0 ? (
            <details
              open={launchContext?.expandedSection === "axes" || undefined}
              className="mt-3 border-t border-hairline pt-3"
            >
              <summary className="cursor-pointer text-xs font-semibold">
                Variable axes
              </summary>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {selected.entity?.axes?.map((axis) => (
                  <Slider
                    key={axis.tag}
                    label={`${axis.name} (${axis.tag})`}
                    min={axis.min}
                    max={axis.max}
                    value={[
                      (selectedOverride ?? defaults(selected)).axes[axis.tag] ??
                        axis.defaultValue,
                    ]}
                    formatValue={(value) => value}
                    onValueChange={([value]) =>
                      value !== undefined &&
                      update(selected.id, (item) => ({
                        ...item,
                        axes: { ...item.axes, [axis.tag]: value },
                      }))
                    }
                  />
                ))}
              </div>
            </details>
          ) : null}
        </aside>
      ) : null}
      <details className="border-t border-hairline p-4">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider">
          Comparison details
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left">Metric</th>
                {slots.map((slot) => (
                  <th key={slot.id} className="p-2 text-right">
                    {slot.family}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Units per em",
                  (slot: ComparisonSlot) => slot.data?.metrics.unitsPerEm,
                ],
                [
                  "Cap height",
                  (slot: ComparisonSlot) =>
                    normalized[slot.id]
                      ? `${((normalized[slot.id]?.capHeight ?? 0) / 10).toFixed(1)}%`
                      : "—",
                ],
                [
                  "X-height",
                  (slot: ComparisonSlot) =>
                    normalized[slot.id]
                      ? `${((normalized[slot.id]?.xHeight ?? 0) / 10).toFixed(1)}%`
                      : "—",
                ],
                [
                  "Ascender",
                  (slot: ComparisonSlot) =>
                    normalized[slot.id]
                      ? `${((normalized[slot.id]?.ascender ?? 0) / 10).toFixed(1)}%`
                      : "—",
                ],
                [
                  "Descender",
                  (slot: ComparisonSlot) =>
                    normalized[slot.id]
                      ? `${((normalized[slot.id]?.descender ?? 0) / 10).toFixed(1)}%`
                      : "—",
                ],
                ["Glyphs", (slot: ComparisonSlot) => slot.data?.glyphs.length],
                [
                  "Axes",
                  (slot: ComparisonSlot) => slot.entity?.axes?.length ?? 0,
                ],
                [
                  "Missing sample characters",
                  (slot: ComparisonSlot) => support(slot.data, text).length,
                ],
              ].map(([label, getter]) => (
                <tr key={label as string} className="border-t border-hairline">
                  <td className="p-2">{label as string}</td>
                  {slots.map((slot) => (
                    <td key={slot.id} className="p-2 text-right font-mono">
                      {String(
                        (getter as (slot: ComparisonSlot) => unknown)(slot) ??
                          "—",
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
