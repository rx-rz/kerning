export type OpenTypeFeatureCategory =
	| "ligatures"
	| "alternates"
	| "capitalization"
	| "numerals"
	| "positioning"
	| "language"
	| "other";

export type OpenTypeFeatureDefinition = {
	label: string;
	description: string;
	category: OpenTypeFeatureCategory;
};

const definition = (
	label: string,
	description: string,
	category: OpenTypeFeatureCategory,
): OpenTypeFeatureDefinition => ({ label, description, category });

export const OPEN_TYPE_FEATURE_DEFINITIONS = {
	kern: definition(
		"Kerning",
		"Adjusts spacing between particular pairs of glyphs.",
		"positioning",
	),
	liga: definition(
		"Standard ligatures",
		"Replaces common character combinations with designed ligature glyphs.",
		"ligatures",
	),
	clig: definition(
		"Contextual ligatures",
		"Applies ligatures that are appropriate in a specific context.",
		"ligatures",
	),
	dlig: definition(
		"Discretionary ligatures",
		"Enables optional decorative or historical ligature forms.",
		"ligatures",
	),
	hlig: definition(
		"Historical ligatures",
		"Uses ligatures customary in historical typography.",
		"ligatures",
	),
	calt: definition(
		"Contextual alternates",
		"Changes glyph forms according to the surrounding characters.",
		"alternates",
	),
	salt: definition(
		"Stylistic alternates",
		"Uses alternate glyph designs provided by the typeface.",
		"alternates",
	),
	swsh: definition(
		"Swashes",
		"Uses decorative swash forms where the font provides them.",
		"alternates",
	),
	cswh: definition(
		"Contextual swashes",
		"Applies swash forms according to surrounding characters.",
		"alternates",
	),
	smcp: definition(
		"Small capitals",
		"Replaces lowercase letters with purpose-designed small capitals.",
		"capitalization",
	),
	c2sc: definition(
		"Capitals to small capitals",
		"Replaces capital letters with small-capital forms.",
		"capitalization",
	),
	case: definition(
		"Case-sensitive forms",
		"Adjusts punctuation and symbols for use with capital letters.",
		"capitalization",
	),
	onum: definition(
		"Old-style numerals",
		"Uses numerals with varying heights and descenders.",
		"numerals",
	),
	lnum: definition(
		"Lining numerals",
		"Uses full-height numerals aligned on the baseline.",
		"numerals",
	),
	pnum: definition(
		"Proportional numerals",
		"Uses individually spaced numerals for running text.",
		"numerals",
	),
	tnum: definition(
		"Tabular numerals",
		"Uses equal-width numerals for columns and tables.",
		"numerals",
	),
	frac: definition(
		"Fractions",
		"Builds diagonal fractions from numerators, denominators, and a slash.",
		"numerals",
	),
	numr: definition(
		"Numerators",
		"Changes numbers into smaller numerator numbers, like the 1 in 1/2.",
		"numerals",
	),
	afrc: definition(
		"Alternative fractions",
		"Uses the font’s alternative fraction style.",
		"numerals",
	),
	ordn: definition(
		"Ordinals",
		"Uses designed ordinal forms for letters following numbers.",
		"numerals",
	),
	sups: definition(
		"Superscripts",
		"Changes characters into proper superscripts, like x².",
		"positioning",
	),
	subs: definition(
		"Subscripts",
		"Uses designed subscript glyphs.",
		"positioning",
	),
	zero: definition(
		"Slashed zero",
		"Distinguishes zero from the capital letter O with a slash.",
		"numerals",
	),
	locl: definition(
		"Localized forms",
		"Uses glyph forms appropriate to the active language and locale.",
		"language",
	),
	abvs: definition(
		"Above-base positioning",
		"Adjusts letters or marks that appear above another character.",
		"positioning",
	),
	akhn: definition(
		"Akhands",
		"Joins certain characters into one required combined shape.",
		"ligatures",
	),
	blws: definition(
		"Below-base positioning",
		"Adjusts letters or marks that appear below another character.",
		"positioning",
	),
	dist: definition(
		"Distance positioning",
		"Fixes spacing so characters do not collide or look awkward.",
		"positioning",
	),
	pstf: definition(
		"Post-base forms",
		"Changes a character into the version used after the main letter.",
		"alternates",
	),
	psts: definition(
		"Post-base substitutions",
		"Joins a main character with one that comes after it.",
		"ligatures",
	),
	rphf: definition(
		"Reph form",
		"Creates a special form of the letter Ra used in some Indic scripts.",
		"alternates",
	),
	vatu: definition(
		"Vattu variants",
		"Creates special joined forms that sit below another character.",
		"alternates",
	),
} satisfies Record<string, OpenTypeFeatureDefinition>;

export function getOpenTypeFeatureDefinition(tag: string) {
	const known =
		OPEN_TYPE_FEATURE_DEFINITIONS[
			tag as keyof typeof OPEN_TYPE_FEATURE_DEFINITIONS
		];
	if (known) return known;
	if (/^ss\d{2}$/.test(tag)) {
		return definition(
			`Stylistic set ${tag.slice(2)}`,
			"Uses a coordinated set of alternate glyph designs supplied by the font.",
			"alternates",
		);
	}
	if (/^cv\d{2}$/.test(tag)) {
		return definition(
			`Character variant ${tag.slice(2)}`,
			"Uses an alternate design for one or more characters supplied by the font.",
			"alternates",
		);
	}
	return definition(
		`Feature “${tag.toUpperCase()}”`,
		"This font contains the feature, but the app does not yet have a dedicated explanation for it.",
		"other",
	);
}
