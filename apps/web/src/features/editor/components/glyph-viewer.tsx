import type { ProjectFontEntity } from "@kerning/shared";
import { AlertCircle, LoaderCircle, Plus, RotateCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Slider } from "#/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
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
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type ViewMode = "glyph" | "text";
type LoadedSlot = { data?: LoadedGlyphFont; error?: string };

const SYSTEM_FONT_ID = "system";
const SLOT_COLORS = ["#FF5C35", "#2774FF", "#13A36D"];
const DEFAULT_TEXT = "Sphinx of black quartz, judge my vow.";
const SYSTEM_METRICS = {
	ascender: 800,
	capHeight: 700,
	xHeight: 500,
	baseline: 0,
	descender: -150,
};

function getFontFamily(role?: FontType) {
	return role
		? `var(--font-project-${role})`
		: "ui-sans-serif, system-ui, sans-serif";
}

function MetricGuide({ label, value }: { label: string; value: number }) {
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

function GlyphPreview({
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
				<MetricGuide label="CAP HEIGHT" value={metrics.capHeight} />
				<MetricGuide label="X-HEIGHT" value={metrics.xHeight} />
				<MetricGuide label="BASELINE" value={0} />
				<MetricGuide label="DESCENDER" value={metrics.descender} />
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
								fontFamily={getFontFamily(option?.role)}
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

function TextOutline({
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

function TextPreview({
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

export function GlyphViewer({ fonts, open, onOpenChange }: GlyphViewerProps) {
	const availableIds = useMemo(
		() => fonts.map(({ font }) => font.dbId),
		[fonts],
	);
	const [slots, setSlots] = useState<string[]>(() => [
		fonts[0]?.font.dbId ?? SYSTEM_FONT_ID,
	]);
	const [viewMode, setViewMode] = useState<ViewMode>("glyph");
	const [selectedCodePoint, setSelectedCodePoint] = useState(65);
	const [text, setText] = useState(DEFAULT_TEXT);
	const [fontSize, setFontSize] = useState(120);
	const [loaded, setLoaded] = useState<Record<string, LoadedSlot>>({});
	const [retryKey, setRetryKey] = useState(0);

	useEffect(() => {
		setSlots((current) => {
			const valid = current.filter(
				(id) => id === SYSTEM_FONT_ID || availableIds.includes(id),
			);
			return valid.length ? valid : [availableIds[0] ?? SYSTEM_FONT_ID];
		});
	}, [availableIds]);

	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		for (const id of slots) {
			if (id === SYSTEM_FONT_ID) continue;
			const option = fonts.find(({ font }) => font.dbId === id);
			if (!option) continue;
			setLoaded((current) => ({ ...current, [id]: {} }));
			void loadGlyphFont(option.font, retryKey)
				.then((data) => {
					if (!cancelled)
						setLoaded((current) => ({ ...current, [id]: { data } }));
				})
				.catch((reason: unknown) => {
					if (!cancelled)
						setLoaded((current) => ({
							...current,
							[id]: {
								error:
									reason instanceof Error
										? reason.message
										: "The font could not be loaded.",
							},
						}));
				});
		}
		return () => {
			cancelled = true;
		};
	}, [fonts, open, retryKey, slots]);

	const primaryId = slots[0] ?? SYSTEM_FONT_ID;
	const primaryData = loaded[primaryId]?.data;
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
	const entries = slots.map((id) =>
		loaded[id]?.data?.glyphs.find(
			(glyph) => glyph.codePoint === selectedCodePoint,
		),
	);
	const unusedFonts = fonts.filter(({ font }) => !slots.includes(font.dbId));
	const isLoading = slots.some(
		(id) => id !== SYSTEM_FONT_ID && !loaded[id]?.data && !loaded[id]?.error,
	);
	const errors = slots.flatMap((id) =>
		loaded[id]?.error ? [loaded[id].error] : [],
	);

	function changePrimary(id: string) {
		setSlots((current) => [
			id,
			...current.slice(1).filter((slot) => slot !== id),
		]);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton
				className="grid h-dvh w-dvw max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden border-0 bg-surface-glass p-0 sm:max-h-[90%] sm:max-w-[90%]"
			>
				<DialogTitle className="sr-only">Glyph viewer</DialogTitle>
				<DialogDescription className="sr-only">
					Inspect and compare font glyphs and text outlines.
				</DialogDescription>
				<header className="flex min-h-16 items-center gap-3 border-b border-hairline px-4 pr-14">
					<Select value={primaryId} onValueChange={changePrimary}>
						<SelectTrigger
							size="compact"
							className="min-h-9 w-auto min-w-52 border-0 bg-transparent px-2 py-2 text-sm font-bold shadow-none"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="z-90" position="popper" align="start">
							{fonts.map((option) => (
								<SelectItem
									key={option.font.dbId}
									value={option.font.dbId}
									className="min-h-8 py-1.5 text-sm font-bold"
								>
									{option.font.family} · {option.roleLabel}
								</SelectItem>
							))}
							{fonts.length === 0 ? (
								<SelectItem
									value={SYSTEM_FONT_ID}
									className="min-h-8 py-1.5 text-sm font-bold"
								>
									System font
								</SelectItem>
							) : null}
						</SelectContent>
					</Select>
					{slots.slice(1).map((id, index) => {
						const option = fonts.find(({ font }) => font.dbId === id);
						return (
							<span
								key={id}
								className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
								style={{
									borderColor: SLOT_COLORS[index + 1],
									color: SLOT_COLORS[index + 1],
								}}
							>
								{option?.font.family}
								<button
									type="button"
									aria-label={`Remove ${option?.font.family}`}
									onClick={() =>
										setSlots((current) => current.filter((slot) => slot !== id))
									}
								>
									<X className="size-3" />
								</button>
							</span>
						);
					})}
					{slots.length < 3 && unusedFonts.length ? (
						<Select
							onValueChange={(id) => setSlots((current) => [...current, id])}
						>
							<SelectTrigger
								aria-label="Add comparison font"
								size="compact"
								className="h-9 min-h-9 w-9 rounded-full px-0 text-sm font-bold [&>svg:last-child]:hidden"
							>
								<Plus className="size-4" />
							</SelectTrigger>
							<SelectContent className="z-90">
								{unusedFonts.map((option) => (
									<SelectItem
										key={option.font.dbId}
										value={option.font.dbId}
										className="min-h-8 py-1.5 text-sm font-bold"
									>
										{option.font.family}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : null}
					<Tabs
						value={viewMode}
						onValueChange={(value) => setViewMode(value as ViewMode)}
						className="ml-auto"
					>
						<TabsList>
							<TabsTrigger value="glyph">Glyph</TabsTrigger>
							<TabsTrigger value="text">Text</TabsTrigger>
						</TabsList>
					</Tabs>
				</header>

				{viewMode === "text" ? (
					<div className="flex h-full min-h-0 flex-col">
						<div className="grid grid-cols-[1fr_280px] gap-3 border-b border-hairline p-3">
							<Input
								aria-label="Preview text"
								value={text}
								onChange={(event) => setText(event.target.value)}
							/>
							<Slider
								label="Font size"
								min={24}
								max={240}
								value={[fontSize]}
								formatValue={(value) => `${value}px`}
								onValueChange={([value]) => {
									if (value !== undefined) setFontSize(value);
								}}
							/>
						</div>
						<TextPreview
							slots={slots}
							loaded={loaded}
							options={fonts}
							text={text}
							fontSize={fontSize}
						/>
					</div>
				) : (
					<div className="grid h-full min-h-0 w-full grid-cols-[1fr_650px]">
						<section className="flex min-h-0 flex-col border-r border-hairline">
							{isLoading ? (
								<div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
									<LoaderCircle className="size-4 animate-spin" /> Parsing font…
								</div>
							) : errors.length ? (
								<div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
									<AlertCircle className="size-6 text-destructive" />
									<p className="max-w-sm text-sm text-muted-foreground">
										{errors[0]}
									</p>
									<Button
										variant="outline"
										onClick={() => setRetryKey((key) => key + 1)}
									>
										<RotateCw /> Retry
									</Button>
								</div>
							) : (
								<GlyphPreview
									entries={entries}
									metrics={metrics}
									slots={slots}
									loaded={loaded}
									options={fonts}
									systemCharacter={String.fromCodePoint(selectedCodePoint)}
								/>
							)}
						</section>
						<section
							aria-label="Available glyphs"
							className="grid min-h-0 grid-cols-8 content-start overflow-y-auto overscroll-contain bg-surface-glass scrollbar-none"
						>
							{displayedCharacters.map((glyph) => (
								<button
									key={glyph.codePoint}
									type="button"
									aria-label={`Select ${glyph.character}, Unicode ${glyph.codePoint.toString(16).toUpperCase().padStart(4, "0")}`}
									aria-pressed={glyph.codePoint === selectedCodePoint}
									className="aspect-square border-r border-b border-hairline bg-background text-2xl outline-none [content-visibility:auto] hover:bg-muted focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring aria-pressed:bg-foreground aria-pressed:text-background"
									style={{
										fontFamily: getFontFamily(
											fonts.find(({ font }) => font.dbId === primaryId)?.role,
										),
									}}
									onClick={() => setSelectedCodePoint(glyph.codePoint)}
								>
									{glyph.character}
								</button>
							))}
						</section>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
