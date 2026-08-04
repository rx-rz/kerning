import type { ProjectFontRole } from "#/features/editor/font-system/font-system.types";
import type { EditorNode, TextNode } from "#/features/editor/types";

export type ContentStressMode =
	| "original"
	| "long-headline"
	| "dense-paragraph"
	| "all-caps"
	| "data-details";

export const CONTENT_STRESS_OPTIONS: ReadonlyArray<{
	mode: ContentStressMode;
	label: string;
	description: string;
}> = [
	{
		mode: "original",
		label: "Original copy",
		description: "Return to the card’s saved content.",
	},
	{
		mode: "long-headline",
		label: "Long headline",
		description: "Test wrapping and display rhythm.",
	},
	{
		mode: "dense-paragraph",
		label: "Dense paragraph",
		description: "Test texture, leading, and small sizes.",
	},
	{
		mode: "all-caps",
		label: "All caps",
		description: "Test width, spacing, and emphasis.",
	},
	{
		mode: "data-details",
		label: "Data & details",
		description: "Test names, prices, dates, and URLs.",
	},
];

const ROLE_SAMPLES: Record<
	Exclude<ContentStressMode, "original" | "all-caps">,
	Record<ProjectFontRole, readonly string[]>
> = {
	"long-headline": {
		primary: [
			"The choices we make today will shape how tomorrow feels",
			"A longer headline should still hold its rhythm across every line",
		],
		"secondary-one": [
			"A useful pairing stays clear when the message needs more room than expected.",
			"Supporting copy should remain calm while the headline expands above it.",
		],
		"secondary-two": [
			"FIELD NOTES · VOLUME 18 · JULY 2026",
			"READING TIME · 12 MINUTES",
		],
	},
	"dense-paragraph": {
		primary: ["Reading under pressure", "A study in sustained attention"],
		"secondary-one": [
			"Typography earns trust over time. In a dense passage, comfortable spacing, distinct letterforms, and an even reading rhythm matter more than a striking first impression. The page should invite the eye forward without making each line feel like work.",
			"When paragraphs grow longer, small inconsistencies become visible. Tight counters close, punctuation interrupts the colour of the page, and uneven spacing makes the reader slow down for the wrong reasons.",
		],
		"secondary-two": [
			"CHAPTER 07 · NOTES ON READING",
			"ARCHIVE COPY · 1,284 WORDS",
		],
	},
	"data-details": {
		primary: [
			"The 2026 Price & Performance Review",
			"Alexandria Okonkwo-Santos",
		],
		"secondary-one": [
			"Alexandria Okonkwo-Santos · alexandria@north-office.co · north-office.co/reports/2026",
			"Standard plan: ₦1,249,990.50 per year · renewal due 13/07/2026 · reference #KR-08429-A",
		],
		"secondary-two": [
			"₦1,249,990.50 · +18.75% · 13/07/2026",
			"MON–FRI · 08:30–17:45 · REF #KR-08429-A",
		],
	},
};

function getTextRole(node: TextNode): ProjectFontRole {
	if (node.fontSource?.type === "role") return node.fontSource.role;
	if (node.fontType === "sec1") return "secondary-one";
	if (node.fontType === "sec2") return "secondary-two";
	return "primary";
}

/**
 * Builds a temporary text map for a card. The map is consumed by rendering only;
 * it never replaces the saved text on the editor nodes.
 */
export function createContentStressPreview(
	nodes: readonly EditorNode[],
	mode: ContentStressMode,
): ReadonlyMap<string, string> {
	if (mode === "original") return new Map();

	const preview = new Map<string, string>();
	const roleIndexes: Record<ProjectFontRole, number> = {
		primary: 0,
		"secondary-one": 0,
		"secondary-two": 0,
	};

	for (const node of nodes) {
		if (node.type !== "text") continue;
		if (mode === "all-caps") {
			preview.set(node.id, node.text.toLocaleUpperCase());
			continue;
		}

		const role = getTextRole(node);
		const samples = ROLE_SAMPLES[mode][role];
		const index = roleIndexes[role]++;
		const sample = samples[index % samples.length];
		if (sample) preview.set(node.id, sample);
	}

	return preview;
}

/** Builds a temporary preview for one selected text node only. */
export function createNodeContentStressPreview(
	node: TextNode,
	mode: ContentStressMode,
): ReadonlyMap<string, string> {
	return createContentStressPreview([node], mode);
}
