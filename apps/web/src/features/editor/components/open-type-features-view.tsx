import { Check, Copy, RotateCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Slider } from "#/components/ui/slider";
import type { LoadedGlyphFont } from "#/features/editor/lib/glyph-font";
import type { OpenTypeFeatureCategory } from "#/features/editor/lib/open-type-feature-definitions";
import {
	type DetectedOpenTypeFeature,
	getOpenTypeFeatures,
} from "#/features/editor/lib/open-type-features";

const DEFAULT_FEATURE_PREVIEW =
	"office affinity difficult 0123456789 1/2 No. 4";
const DEFAULT_ENABLED = new Set(["kern", "liga", "clig", "calt"]);
const EXCLUSIVE_FEATURE_GROUPS = [
	["onum", "lnum"],
	["pnum", "tnum"],
	["sups", "subs"],
];
const PRESETS = {
	Ligatures: "office affinity difficult final flag",
	Numerals: "0123456789 1/2 3/4 €1,234.56",
	"Small caps": "Small Capitals and Acronyms NASA UI",
	Alternates: "Hamburgefontsiv Typography",
} as const;
const CATEGORY_LABELS: Record<OpenTypeFeatureCategory, string> = {
	ligatures: "Ligatures",
	alternates: "Alternates and stylistic sets",
	capitalization: "Capitals",
	numerals: "Numerals",
	positioning: "Positioning",
	language: "Language and localization",
	other: "Other",
};
const CATEGORY_ORDER = Object.keys(
	CATEGORY_LABELS,
) as OpenTypeFeatureCategory[];

function FeatureToggle({
	feature,
	enabled,
	onToggle,
}: {
	feature: DetectedOpenTypeFeature;
	enabled: boolean;
	onToggle: () => void;
}) {
	return (
		<div className="flex gap-3 border-b border-hairline py-3 last:border-b-0">
			<button
				type="button"
				role="switch"
				aria-checked={enabled}
				aria-label={`${feature.label} (${feature.tag})`}
				onClick={onToggle}
				className="mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full border border-hairline bg-muted p-0.5 transition-colors aria-checked:border-accent aria-checked:bg-accent"
			>
				<span
					className="size-3.5 rounded-full bg-background transition-transform aria-hidden group-aria-checked:translate-x-4"
					style={{ transform: enabled ? "translateX(16px)" : undefined }}
				/>
			</button>
			<div className="min-w-0 flex-1">
				<div className="flex items-baseline justify-between gap-3">
					<span className="text-xs font-semibold">{feature.label}</span>
					<code className="text-[10px] text-muted-foreground">
						{feature.tag}
					</code>
				</div>
				<p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
					{feature.description}
				</p>
			</div>
		</div>
	);
}

export function OpenTypeFeaturesView({
	font,
	fontFamily,
	familyName,
}: {
	font: LoadedGlyphFont;
	fontFamily: string;
	familyName: string;
}) {
	const features = useMemo(() => getOpenTypeFeatures(font), [font]);
	const [enabled, setEnabled] = useState<Set<string>>(new Set());
	const [text, setText] = useState(DEFAULT_FEATURE_PREVIEW);
	const [fontSize, setFontSize] = useState(64);
	const [filter, setFilter] = useState("");
	const [fontReady, setFontReady] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		setEnabled(
			new Set(
				features
					.filter(({ tag }) => DEFAULT_ENABLED.has(tag))
					.map(({ tag }) => tag),
			),
		);
	}, [features]);

	useEffect(() => {
		let cancelled = false;
		setFontReady(false);
		void document.fonts
			.load(`16px "${familyName.replaceAll('"', '\\"')}"`)
			.then((faces) => {
				if (!cancelled) setFontReady(faces.length > 0);
			})
			.catch(() => {
				if (!cancelled) setFontReady(false);
			});
		return () => {
			cancelled = true;
		};
	}, [familyName]);

	const settings = features
		.map(({ tag }) => `"${tag}" ${enabled.has(tag) ? 1 : 0}`)
		.join(", ");
	const css = `font-feature-settings: ${settings};`;
	const matching = features.filter((feature) =>
		`${feature.label} ${feature.tag} ${feature.description}`
			.toLowerCase()
			.includes(filter.trim().toLowerCase()),
	);

	function toggle(tag: string) {
		setEnabled((current) => {
			const next = new Set(current);
			if (next.has(tag)) next.delete(tag);
			else {
				next.add(tag);
				for (const group of EXCLUSIVE_FEATURE_GROUPS)
					if (group.includes(tag))
						for (const other of group) if (other !== tag) next.delete(other);
			}
			return next;
		});
	}

	return (
		<div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px]">
			<section className="flex min-h-0 flex-col overflow-y-auto border-b border-hairline p-5 lg:border-r lg:border-b-0">
				<label
					htmlFor="feature-preview-text"
					className="mb-2 font-mono text-[10px] uppercase tracking-[.12em]"
				>
					Preview text
				</label>
				<Input
					id="feature-preview-text"
					value={text}
					onChange={(event) => setText(event.target.value)}
				/>
				<div className="mt-2 flex flex-wrap gap-1.5">
					{Object.entries(PRESETS).map(([label, value]) => (
						<Button
							key={label}
							type="button"
							size="xs"
							variant="outline"
							onClick={() => setText(value)}
						>
							{label}
						</Button>
					))}
					<Button
						type="button"
						size="xs"
						variant="outline"
						onClick={() =>
							document.getElementById("feature-preview-text")?.focus()
						}
					>
						Custom
					</Button>
				</div>
				<div className="mt-5">
					<Slider
						label="Font size"
						min={24}
						max={144}
						value={[fontSize]}
						formatValue={(value) => `${value}px`}
						onValueChange={([value]) => {
							if (value !== undefined) setFontSize(value);
						}}
					/>
				</div>
				{fontReady ? (
					<div className="mt-5 grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
						<div className="min-h-44 border border-hairline bg-background p-4">
							<p className="mb-5 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">
								Default rendering
							</p>
							<div
								className="break-words leading-tight"
								style={{ fontFamily, fontSize }}
							>
								{text}
							</div>
						</div>
						<div className="min-h-44 border border-hairline bg-background p-4">
							<p className="mb-5 font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">
								Selected features
							</p>
							<div
								className="break-words leading-tight"
								style={{ fontFamily, fontSize, fontFeatureSettings: settings }}
							>
								{text}
							</div>
						</div>
					</div>
				) : (
					<div className="mt-5 flex min-h-48 flex-1 items-center justify-center text-sm text-muted-foreground">
						Loading browser font…
					</div>
				)}
				<div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-4">
					<span className="text-xs font-semibold">Active:</span>
					{[...enabled].map((tag) => (
						<code
							key={tag}
							className="border border-hairline bg-muted px-1.5 py-0.5 text-[10px]"
						>
							{tag}
						</code>
					))}
					{enabled.size === 0 ? (
						<span className="text-xs text-muted-foreground">None</span>
					) : null}
					<Button
						type="button"
						size="xs"
						variant="outline"
						className="ml-auto"
						onClick={() =>
							setEnabled(
								new Set(
									features
										.filter(({ tag }) => DEFAULT_ENABLED.has(tag))
										.map(({ tag }) => tag),
								),
							)
						}
					>
						<RotateCw /> Reset
					</Button>
					<Button
						type="button"
						size="xs"
						variant="outline"
						aria-label="Copy font-feature-settings CSS"
						onClick={async () => {
							await navigator.clipboard.writeText(css);
							setCopied(true);
							window.setTimeout(() => setCopied(false), 1600);
						}}
					>
						{copied ? <Check /> : <Copy />}
						{copied ? "Copied" : "Copy CSS"}
					</Button>
				</div>
			</section>
			<aside
				className="min-h-0 overflow-y-auto bg-surface-glass p-4"
				aria-label="Supported OpenType features"
			>
				<label
					htmlFor="feature-search"
					className="mb-2 block font-mono text-[10px] uppercase tracking-[.12em]"
				>
					Search features
				</label>
				<div className="relative">
					<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="feature-search"
						className="pl-9"
						value={filter}
						onChange={(event) => setFilter(event.target.value)}
						placeholder="Name, tag, or description"
					/>
				</div>
				{features.length === 0 ? (
					<div className="py-16 text-center">
						<p className="text-sm font-semibold">
							No OpenType features detected
						</p>
						<p className="mt-2 text-xs text-muted-foreground">
							The font loaded successfully, but its parsed tables did not expose
							supported features.
						</p>
					</div>
				) : matching.length === 0 ? (
					<p className="py-12 text-center text-sm text-muted-foreground">
						No features match this search.
					</p>
				) : (
					CATEGORY_ORDER.map((category) => {
						const items = matching.filter(
							(feature) => feature.category === category,
						);
						return items.length ? (
							<section key={category} className="mt-5 first:mt-4">
								<h3 className="font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground">
									{CATEGORY_LABELS[category]}
								</h3>
								<div className="mt-1">
									{items.map((feature) => (
										<FeatureToggle
											key={feature.tag}
											feature={feature}
											enabled={enabled.has(feature.tag)}
											onToggle={() => toggle(feature.tag)}
										/>
									))}
								</div>
							</section>
						) : null;
					})
				)}
			</aside>
		</div>
	);
}
