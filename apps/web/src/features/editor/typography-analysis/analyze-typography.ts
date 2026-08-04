import type { ProjectFontEntity } from "@kerning/shared";
import { resolveSelectedTextFontContext } from "#/features/editor/font-lab-bridge/selected-text-font-context";
import type { ProjectFontSystem } from "#/features/editor/font-system/font-system.types";
import type { LoadedGlyphFont } from "#/features/editor/lib/glyph-font";
import { getOpenTypeFeatureDefinition } from "#/features/editor/lib/open-type-feature-definitions";
import { getOpenTypeFeatures } from "#/features/editor/lib/open-type-features";
import type { EditorCard, TextNode } from "#/features/editor/types";
import type { TypographyWarning } from "./typography-warning.types";

const whitespace = /^\s$/u;

export function analyzeTextNodeTypography({
	card,
	node,
	fontSystem,
	fonts,
	loadedFont,
	fontLoadState = loadedFont ? "ready" : "loading",
}: {
	card: EditorCard;
	node: TextNode;
	fontSystem: ProjectFontSystem;
	fonts: ProjectFontEntity[];
	loadedFont?: LoadedGlyphFont;
	fontLoadState?: "loading" | "ready" | "failed";
}): TypographyWarning[] {
	const context = resolveSelectedTextFontContext({
		card,
		node,
		fontSystem,
		fonts,
	});
	if (!context)
		return [
			{
				id: `${card.id}:${node.id}:font`,
				code: "font-variant-missing",
				severity: "error",
				cardId: card.id,
				nodeId: node.id,
				title: "Font unavailable",
				description:
					"The selected text node's font or project variant could not be resolved.",
			},
		];
	if (fontLoadState === "failed")
		return [
			{
				id: `${card.id}:${node.id}:load`,
				code: "font-load-failed",
				severity: "error",
				cardId: card.id,
				nodeId: node.id,
				role: context.role,
				title: "Font failed to load",
				description: `${context.resolvedFont.font.family} could not be loaded for typography inspection.`,
			},
		];
	const warnings: TypographyWarning[] = [];
	if (context.sourceType === "direct-font")
		warnings.push({
			id: `${card.id}:${node.id}:detached`,
			code: "detached-role",
			severity: "info",
			cardId: card.id,
			nodeId: node.id,
			title: "Direct font assignment",
			description:
				"This text node no longer inherits changes from a semantic font role.",
			action: {
				type: "relink-role",
				role:
					node.fontType === "sec1"
						? "secondary-one"
						: node.fontType === "sec2"
							? "secondary-two"
							: "primary",
			},
		});
	if (fontLoadState === "ready" && loadedFont) {
		const supported = new Set(
			loadedFont.glyphs.map(({ codePoint }) => codePoint),
		);
		const missing = [
			...new Set(
				Array.from(node.text).filter(
					(character) =>
						!whitespace.test(character) &&
						!supported.has(character.codePointAt(0) ?? -1),
				),
			),
		];
		if (missing.length)
			warnings.push({
				id: `${card.id}:${node.id}:coverage`,
				code: "missing-character",
				severity: "warning",
				cardId: card.id,
				nodeId: node.id,
				role: context.role,
				title: "Browser fallback may be visible",
				description: `${context.resolvedFont.font.family} does not include ${missing.map((character) => `“${character}”`).join(", ")}. Your browser may be displaying ${missing.length === 1 ? "it" : "them"} with a fallback font.`,
				characters: missing,
				action: { type: "open-glyph", codePoint: missing[0]?.codePointAt(0) },
			});
		const detected = new Set(
			getOpenTypeFeatures(loadedFont).map(({ tag }) => tag),
		);
		for (const [tag, enabled] of Object.entries(
			context.effectiveFeatureSettings,
		))
			if (enabled && !detected.has(tag)) {
				const feature = getOpenTypeFeatureDefinition(tag);
				warnings.push({
					id: `${card.id}:${node.id}:feature:${tag}`,
					code: "unsupported-feature",
					severity: "warning",
					cardId: card.id,
					nodeId: node.id,
					role: context.role,
					title: `${feature.label} (${tag}) not detected`,
					description: `${feature.description} This feature may not be available in ${context.resolvedFont.font.family}.`,
					featureTag: tag,
					action: { type: "disable-feature", tag },
				});
			}
	}
	const axes = new Map(
		(
			context.resolvedFont.font.axes ??
			context.resolvedFont.font.faces.flatMap((face) => face.axes ?? [])
		).map((axis) => [axis.tag, axis]),
	);
	for (const [tag, value] of Object.entries(
		context.effectiveVariationSettings,
	)) {
		const axis = axes.get(tag);
		if (!axis)
			warnings.push({
				id: `${card.id}:${node.id}:axis:${tag}`,
				code: "unsupported-axis",
				severity: "warning",
				cardId: card.id,
				nodeId: node.id,
				role: context.role,
				title: `${tag} axis unavailable`,
				description: `The ${tag} axis was not detected in ${context.resolvedFont.font.family}.`,
				axisTag: tag,
				action: { type: "reset-axis", tag },
			});
		else if (!Number.isFinite(value) || value < axis.min || value > axis.max)
			warnings.push({
				id: `${card.id}:${node.id}:axis-range:${tag}`,
				code: "axis-out-of-range",
				severity: "warning",
				cardId: card.id,
				nodeId: node.id,
				role: context.role,
				title: `${tag} is out of range`,
				description: `${tag} ${value} is outside ${axis.min}–${axis.max}.`,
				axisTag: tag,
				action: {
					type: "clamp-axis",
					tag,
					value: Math.min(
						axis.max,
						Math.max(
							axis.min,
							Number.isFinite(value) ? value : axis.defaultValue,
						),
					),
				},
			});
	}
	if (context.role && card.fontSystemOverrides?.roles?.[context.role])
		warnings.push({
			id: `${card.id}:${node.id}:override`,
			code: "comparison-override-active",
			severity: "info",
			cardId: card.id,
			nodeId: node.id,
			role: context.role,
			title: "Card font override active",
			description: `The ${context.role} role is overridden for this card.`,
			action: { type: "reset-card-override", role: context.role },
		});
	return warnings;
}

export function analyzeCardTypography(
	input: Omit<
		Parameters<typeof analyzeTextNodeTypography>[0],
		"node" | "loadedFont"
	> & { loadedFonts?: Record<string, LoadedGlyphFont | undefined> },
) {
	return input.card.nodes.flatMap((node) =>
		node.type === "text"
			? analyzeTextNodeTypography({
					...input,
					node,
					loadedFont: undefined,
					fontLoadState: "loading",
				})
			: [],
	);
}

export function analyzeProjectTypography({
	cards,
	...input
}: Omit<Parameters<typeof analyzeCardTypography>[0], "card"> & {
	cards: EditorCard[];
}) {
	return cards.flatMap((card) => analyzeCardTypography({ ...input, card }));
}
