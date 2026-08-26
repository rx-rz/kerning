import type { ProjectFontEntity } from "@kerning/shared";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import {
	DEFAULT_OVERLAYS,
	GlyphMetricsPreview,
	GlyphOverlayControls,
	type GlyphOverlayOptions,
} from "#/features/editor/components/glyph-metrics-preview";
import {
	type WordComparisonSlot,
	WordMetricsPreview,
} from "#/features/editor/components/word-metrics-preview";
import {
	getFontFeatureSettingsCss,
	getFontVariationSettingsCss,
} from "#/features/editor/font-system/font-system";
import type {
	FontFeatureSettings,
	ProjectFontRole,
} from "#/features/editor/font-system/font-system.types";
import type { FontLabLaunchContext } from "#/features/editor/font-lab-bridge/font-lab-context.types";
import {
	selectedWordFromRange,
	uniqueInspectableCharacters,
	uniqueInspectableWords,
} from "#/features/editor/font-lab-bridge/text-selection";
import {
	type LoadedGlyphFont,
	loadGlyphFont,
	normalizeGlyphMetrics,
} from "#/features/editor/lib/glyph-font";
import { getOpenTypeFeatures } from "#/features/editor/lib/open-type-features";

export type TypeLensStudy = {
	text: string;
	role: ProjectFontRole;
	kind: "glyph" | "word";
};

type TypeLensProps = {
	fonts: ProjectFontEntity[];
	launchContext: FontLabLaunchContext;
	onClose: () => void;
	onPinToCanvas: (study: TypeLensStudy) => void;
	onFeatureSettingsChange?: (settings: FontFeatureSettings) => void;
};

const ROLE_ORDER: ProjectFontRole[] = [
	"primary",
	"secondary-one",
	"secondary-two",
];
const ROLE_LABELS: Record<ProjectFontRole, string> = {
	primary: "Display",
	"secondary-one": "Text",
	"secondary-two": "Accent",
};
const COMPARISON_COLORS = ["#111111", "#2774FF", "#D14B38"];
const EXCLUSIVE_FEATURE_GROUPS = [
	["onum", "lnum"],
	["pnum", "tnum"],
	["sups", "subs"],
];

function fontId(font: ProjectFontEntity) {
	return font.dbId || font.id;
}

function fontRole(font: ProjectFontEntity): ProjectFontRole | undefined {
	return ROLE_ORDER.find((role) => role === font.role);
}

function firstCodePoint(text: string, fallback = 65) {
	return Array.from(text)[0]?.codePointAt(0) ?? fallback;
}

function LensSwatchGroup<T extends string>({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: T;
	options: Array<{ value: T; label: string; visual: React.ReactNode }>;
	onChange: (value: T) => void;
}) {
	return (
		<fieldset className="flex min-h-10 items-center gap-2 rounded-lg bg-white/75 px-2 ">
			<legend className="sr-only">{label}</legend>
			<span
				className="mono-label shrink-0 text-muted-foreground"
				aria-hidden="true"
			>
				{label}
			</span>
			<div className="flex gap-1 py-1">
				{options.map((option) => (
					<label key={option.value} className="cursor-pointer">
						<input
							type="radio"
							name={`type-lens-${label}`}
							value={option.value}
							checked={value === option.value}
							aria-label={option.label}
							className="peer sr-only"
							onChange={() => onChange(option.value)}
						/>
						<span className="flex size-8 items-center justify-center rounded-md border border-hairline bg-white text-xs font-semibold text-muted-foreground transition-colors peer-checked:border-2 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-foreground">
							{option.visual}
							<span className="sr-only">{option.label}</span>
						</span>
					</label>
				))}
			</div>
		</fieldset>
	);
}

function LayoutSwatch({ sideBySide = false }: { sideBySide?: boolean }) {
	return (
		<span
			className="relative flex h-4 w-5 items-center justify-center"
			aria-hidden="true"
		>
			<span
				className={
					sideBySide
						? "h-4 w-2 rounded-xs border border-current"
						: "absolute left-0.5 h-3 w-3 rounded-xs border border-current"
				}
			/>
			<span
				className={
					sideBySide
						? "ml-0.5 h-4 w-2 rounded-xs border border-current"
						: "absolute right-0.5 bottom-0 h-3 w-3 rounded-xs border border-current bg-white/80"
				}
			/>
		</span>
	);
}

export function TypeLens({
	fonts,
	launchContext,
	onClose,
	onPinToCanvas,
	onFeatureSettingsChange,
}: TypeLensProps) {
	const comparisonFonts = useMemo(() => {
		const ordered = ROLE_ORDER.flatMap((role) => {
			const match = fonts.find((font) => fontRole(font) === role);
			return match ? [match] : [];
		});
		return [
			...ordered,
			...fonts.filter((font) => !ordered.includes(font)),
		].slice(0, 3);
	}, [fonts]);
	const sourceText = launchContext.sampleText ?? "";
	const characters = useMemo(
		() => uniqueInspectableCharacters(sourceText),
		[sourceText],
	);
	const words = useMemo(() => uniqueInspectableWords(sourceText), [sourceText]);
	const selection =
		launchContext.selection?.type === "text-range"
			? launchContext.selection
			: undefined;
	const initialWord =
		launchContext.selectedWord ||
		selectedWordFromRange(sourceText, selection?.start, selection?.end) ||
		words[0] ||
		"Type";
	const role = launchContext.role ?? "primary";
	const selectedFont =
		comparisonFonts.find(
			(font) =>
				fontId(font) === launchContext.fontId || fontRole(font) === role,
		) ?? comparisonFonts[0];
	const [mode, setMode] = useState<"glyph" | "word">("word");
	const [layout, setLayout] = useState<"stack" | "side-by-side">("stack");
	const [selectedCodePoint, setSelectedCodePoint] = useState(
		launchContext.selectedCodePoint ??
			firstCodePoint(selection?.text || initialWord || characters[0] || "A"),
	);
	const [selectedWord, setSelectedWord] = useState(initialWord);
	const [activeFontIds, setActiveFontIds] = useState<Set<string>>(
		() => new Set(selectedFont ? [fontId(selectedFont)] : []),
	);
	const [loaded, setLoaded] = useState<
		Record<string, { data?: LoadedGlyphFont; error?: string }>
	>({});
	const [overlays, setOverlays] =
		useState<GlyphOverlayOptions>(DEFAULT_OVERLAYS);
	const [featureSettings, setFeatureSettings] = useState<FontFeatureSettings>(
		launchContext.featureSettings ?? {},
	);
	const glyphText = String.fromCodePoint(selectedCodePoint);
	const studyText = mode === "glyph" ? glyphText : selectedWord;
	const featureCss = getFontFeatureSettingsCss(featureSettings);
	const variationCss = getFontVariationSettingsCss(
		launchContext.variationSettings ?? {},
	);
	const selectedFamily =
		selectedFont?.cssFamily ?? selectedFont?.family ?? "system-ui";
	const typeStyle = {
		fontFamily: `${JSON.stringify(selectedFamily)}, system-ui, sans-serif`,
		fontWeight: launchContext.textStyle?.fontWeight ?? 400,
		fontFeatureSettings: featureCss,
		fontVariationSettings: variationCss,
	} as const;
	const sourceParts = sourceText.split(studyText);
	const canHighlight = Boolean(studyText && sourceParts.length > 1);

	useEffect(() => {
		let cancelled = false;
		setLoaded({});
		for (const font of comparisonFonts) {
			const id = fontId(font);
			void loadGlyphFont(font)
				.then((data) => {
					if (!cancelled)
						setLoaded((current) => ({ ...current, [id]: { data } }));
				})
				.catch((error: unknown) => {
					if (!cancelled)
						setLoaded((current) => ({
							...current,
							[id]: {
								error:
									error instanceof Error
										? error.message
										: "Outline calculations are unavailable.",
							},
						}));
				});
		}
		return () => {
			cancelled = true;
		};
	}, [comparisonFonts]);

	const activeFonts = comparisonFonts.filter((font) =>
		activeFontIds.has(fontId(font)),
	);
	const loadedSlots = activeFonts.flatMap((font, index) => {
		const id = fontId(font);
		const data = loaded[id]?.data;
		return data
			? [
					{
						id,
						font,
						data,
						label: `${fontRole(font) ? ROLE_LABELS[fontRole(font) as ProjectFontRole] : "Font"} · ${font.family}`,
						color:
							COMPARISON_COLORS[comparisonFonts.indexOf(font)] ??
							COMPARISON_COLORS[index] ??
							"#111111",
					},
				]
			: [];
	});
	const detectedFeatures = useMemo(() => {
		const byTag = new Map<
			string,
			ReturnType<typeof getOpenTypeFeatures>[number]
		>();
		for (const slot of loadedSlots)
			for (const feature of getOpenTypeFeatures(slot.data))
				if (!byTag.has(feature.tag)) byTag.set(feature.tag, feature);
		return [...byTag.values()];
	}, [loadedSlots]);

	function toggleFont(id: string) {
		setActiveFontIds((current) => {
			const next = new Set(current);
			if (next.has(id)) {
				if (next.size === 1) return current;
				next.delete(id);
			} else next.add(id);
			return next;
		});
	}

	function toggleFeature(tag: string) {
		const next = { ...featureSettings, [tag]: !featureSettings[tag] };
		if (next[tag])
			for (const group of EXCLUSIVE_FEATURE_GROUPS)
				if (group.includes(tag))
					for (const other of group) if (other !== tag) next[other] = false;
		setFeatureSettings(next);
		onFeatureSettingsChange?.(next);
	}

	const firstLoaded = loadedSlots[0];
	const wordSlots: WordComparisonSlot[] = loadedSlots.map((slot) => ({
		id: slot.id,
		label: slot.label,
		font: slot.data,
		color: slot.color,
	}));

	return (
		<section
			aria-label="Type Lens"
			className="relative flex h-full min-h-0 flex-col overflow-hidden bg-surface-wash"
		>
			<header className="relative z-20 flex min-h-16 items-center gap-3 border-b border-accent/15 px-3 sm:px-5">
				<Button
					type="button"
					aria-label="Back to Canvas"
					className="bg-white shadow-xl"
					size="sm"
					onClick={onClose}
				>
					<ArrowLeft className="text-primary" />
				</Button>
				<div className="min-w-0">
					<p className="text-sm font-semibold">Type Lens</p>
				</div>
				<Button
					type="button"
					size="sm"
					className="ml-auto"
					disabled={!studyText}
					onClick={() => onPinToCanvas({ text: studyText, role, kind: mode })}
				>
					Pin to Canvas
				</Button>
			</header>

			<main className="flex check-card min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-5">
				<section className=" relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-hairline bg-background/75">
					<div
						aria-label="Type Lens controls"
						role="toolbar"
						className="relative z-10 flex shrink-0 flex-wrap items-center gap-2 border-b bg-surface-glass p-2 "
					>
						<div className="flex min-w-0 flex-wrap gap-1">
							{comparisonFonts.map((font) => {
								const id = fontId(font);
								const active = activeFontIds.has(id);
								const roleName = fontRole(font);
								return (
									<button
										key={id}
										type="button"
										aria-label={`${active ? "Hide" : "Show"} ${font.family}`}
										aria-pressed={active}
										className="max-w-52 truncate rounded border border-hairline px-2 py-1 font-mono text-xs transition-colors hover:bg-accent/10 aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-background"
										onClick={() => toggleFont(id)}
									>
										{roleName ? `${ROLE_LABELS[roleName]} · ` : ""}
										{font.family}
									</button>
								);
							})}
						</div>
						<div className="ml-auto flex flex-wrap items-center gap-2">
							<LensSwatchGroup
								label="View"
								value={mode}
								onChange={setMode}
								options={[
									{ value: "glyph", label: "Glyph", visual: "A" },
									{ value: "word", label: "Word", visual: "Ab" },
								]}
							/>
							<LensSwatchGroup
								label="Layout"
								value={layout}
								onChange={setLayout}
								options={[
									{
										value: "stack",
										label: "Stack",
										visual: <LayoutSwatch />,
									},
									{
										value: "side-by-side",
										label: "Side by side",
										visual: <LayoutSwatch sideBySide />,
									},
								]}
							/>

						</div>
					</div>
					<div className="flex py-2 shrink-0 items-center px-2 gap-2 border-b border-hairline">
						<GlyphOverlayControls
							overlays={overlays}
							onChange={setOverlays}
							className="min-w-0 flex-1 border-0 p-0"
						/>
						<Popover>
							<PopoverTrigger asChild>
								<button
									type="button"
									aria-label="OpenType features"
									className="flex py-1 cursor-pointer shrink-0 items-center gap-2 rounded-md border border-hairline bg-white/75 px-3 font-mono text-xs font-semibold  hover:border-accent/50"
								>
									OpenType
									<span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-accent">
										{detectedFeatures.length}
									</span>
								</button>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-80 p-0">
								<div className="border-b border-hairline px-3 py-2.5">
									<p className="text-xs font-semibold">OpenType features</p>
									<p className="mt-0.5 text-[10px] text-muted-foreground">
										Changes update the selected Canvas text.
									</p>
								</div>
								<div className="max-h-72 space-y-1 overflow-y-auto p-2">
									{detectedFeatures.map((feature) => (
										<button
											key={feature.tag}
											type="button"
											aria-pressed={Boolean(featureSettings[feature.tag])}
											className="flex w-full items-center gap-3 rounded-lg border border-hairline bg-white px-3 py-2 text-left hover:bg-accent/5 aria-pressed:border-accent aria-pressed:bg-accent/10"
											onClick={() => toggleFeature(feature.tag)}
										>
											<span className="min-w-0 flex-1">
												<span className="block truncate text-xs font-semibold">
													{feature.label}
												</span>
												<span className="block truncate text-[10px] text-muted-foreground">
													{feature.description}
												</span>
											</span>
											<span className="font-mono text-[10px] text-muted-foreground">
												{feature.tag}
											</span>
										</button>
									))}
									{detectedFeatures.length === 0 ? (
										<p className="px-2 py-6 text-center text-xs text-muted-foreground">
											No features detected in the active font.
										</p>
									) : null}
								</div>
							</PopoverContent>
						</Popover>
					</div>
					{firstLoaded ? (
						mode === "word" ? (
							<WordMetricsPreview
								slots={wordSlots}
								word={selectedWord}
								overlays={overlays}
								layout={layout}
								featureSettings={featureSettings}
							/>
						) : layout === "stack" ? (
							<GlyphMetricsPreview
								entries={loadedSlots.map((slot) =>
									slot.data.glyphs.find(
										(glyph) => glyph.codePoint === selectedCodePoint,
									),
								)}
								metrics={normalizeGlyphMetrics(firstLoaded.data.metrics)}
								slots={loadedSlots.map((slot) => slot.id)}
								loaded={loaded}
								overlays={overlays}
								onOverlaysChange={setOverlays}
								systemCharacter={glyphText}
								primaryFontFamily={
									firstLoaded.font.cssFamily ?? firstLoaded.font.family
								}
								showControls={false}
							/>
						) : (
							<div
								className="grid min-h-0 flex-1"
								style={{
									gridTemplateColumns: `repeat(${loadedSlots.length}, minmax(0, 1fr))`,
								}}
							>
								{loadedSlots.map((slot) => (
									<div
										key={slot.id}
										className="relative flex min-w-0 border-r border-hairline last:border-r-0"
									>
										<span
											className="absolute top-3 left-3 z-10 rounded-full bg-background/85 px-2 py-1 text-[10px] font-semibold"
											style={{ color: slot.color }}
										>
											{slot.label}
										</span>
										<GlyphMetricsPreview
											entries={[
												slot.data.glyphs.find(
													(glyph) => glyph.codePoint === selectedCodePoint,
												),
											]}
											metrics={normalizeGlyphMetrics(slot.data.metrics)}
											slots={[slot.id]}
											loaded={loaded}
											overlays={overlays}
											onOverlaysChange={setOverlays}
											systemCharacter={glyphText}
											primaryFontFamily={
												slot.font.cssFamily ?? slot.font.family
											}
											showControls={false}
											showInformation={false}
										/>
									</div>
								))}
							</div>
						)
					) : (
						<div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
							Calculating outlines and spacing…
						</div>
					)}
				</section>

				<section className="shrink-0 rounded-xl bg-surface-glass p-3 sm:p-4">
					<div
						className="flex gap-1 overflow-x-auto pb-1"
						style={typeStyle}
					>
						{mode === "glyph"
							? characters.map((character) => {
									const codePoint = character.codePointAt(0) ?? 0;
									return (
										<button
											key={codePoint}
											type="button"
											aria-label={`Select ${character}`}
											aria-pressed={selectedCodePoint === codePoint}
											className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xl hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent/50 aria-pressed:bg-accent aria-pressed:text-background"
											onClick={() => setSelectedCodePoint(codePoint)}
										>
											{character}
										</button>
									);
								})
							: words.map((word) => (
									<button
										key={word}
										type="button"
										aria-label={`Select word ${word}`}
										aria-pressed={selectedWord === word}
										className="flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-lg px-3 text-lg hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent/50 aria-pressed:bg-accent aria-pressed:text-background"
										onClick={() => setSelectedWord(word)}
									>
										{word}
									</button>
								))}
					</div>
				</section>
			</main>
		</section>
	);
}
