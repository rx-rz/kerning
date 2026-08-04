import type {
	FontFeatureSettings,
	FontVariationSettings,
	ProjectFontRole,
	TextFontSource,
} from "#/features/editor/font-system/font-system.types";

export type CardAspectRatio =
	| "1:1"
	| "4:5"
	| "16:9"
	| "9:16"
	| "3:2"
	| "business-card";

export type CardSettings = {
	aspectRatio: CardAspectRatio;
	fill: CardFill;
	texture: TextureCardFill | null;
	opacity: number;
	blur: number;
	borderWidth: number;
	borderStyle: "solid" | "dashed" | "dotted" | "double";
	borderColor: string;
};

export type SolidCardFill = {
	type: "solid";
	color: string;
};

export type GradientStop = {
	id: string;
	color: string;
	position: number;
};

export type LinearGradientCardFill = {
	type: "linear-gradient";
	angle: number;
	stops: GradientStop[];
};

export type RadialGradientCardFill = {
	type: "radial-gradient";
	centerX: number;
	centerY: number;
	stops: GradientStop[];
};

export type ImageCardFill = {
	type: "image";
	imageId: string | null;
	src?: string;
	opacity: number;
	settings: ImageFillSettings;
};

export type ImageFillSettings = {
	backgroundSize: "cover" | "contain" | "auto";
	originX: number;
	originY: number;
};

type TextureFill<TTexture extends string, TSettings> = {
	type: "texture";
	texture: TTexture;
	opacity: number;
	settings: TSettings;
};

export type PaperTextureSettings = {
	colorFront: string;
	colorBack: string;
	contrast: number;
	roughness: number;
	fiber: number;
	crumples: number;
	folds: number;
	seed: number;
};

export type FlutedGlassSettings = {
	colorBack: string;
	colorShadow: string;
	colorHighlight: string;
	size: number;
	angle: number;
	distortion: number;
	blur: number;
	highlights: number;
};

export type HalftoneTextureSettings = {
	colorBack: string;
	colorFront: string;
	size: number;
	radius: number;
	contrast: number;
	grid: "square" | "hex";
	dotType: "classic" | "gooey" | "holes" | "soft";
	inverted: boolean;
	grain: number;
};

export type HalftoneCmykTextureSettings = {
	colorBack: string;
	colorC: string;
	colorM: string;
	colorY: string;
	colorK: string;
	size: number;
	contrast: number;
	softness: number;
	gridNoise: number;
	dotType: "dots" | "ink" | "sharp";
};

export type TextureCardFill =
	| TextureFill<"paper", PaperTextureSettings>
	| TextureFill<"fluted-glass", FlutedGlassSettings>
	| TextureFill<"halftone", HalftoneTextureSettings>
	| TextureFill<"halftone-cmyk", HalftoneCmykTextureSettings>;

export type CardFill =
	| SolidCardFill
	| LinearGradientCardFill
	| RadialGradientCardFill
	| ImageCardFill;

export type FontType = "primary" | "sec1" | "sec2";
export type TextAlignment = "left" | "center" | "right" | "justify";
export type TextCasing = "none" | "uppercase" | "lowercase" | "capitalize";

type BaseNode = {
	id: string;
	x: number;
	y: number;
	/** Coordinates saved independently for each card aspect ratio. */
	positions?: Partial<Record<CardAspectRatio, NodePosition>>;
	width: number;
	height: number;
	rotation?: NodeRotation;
	/** Stable semantic identity shared by corresponding nodes in comparison cards. */
	linkedNodeKey?: string;
};

export type NodePosition = { x: number; y: number };
export type NodeRotation = number;

export type TextNode = BaseNode & {
	type: "text";
	text: string;
	fontType: FontType;
	/** Semantic role or explicit font reference. fontType remains as a legacy fallback. */
	fontSource?: TextFontSource;
	/** Browser-applicable node-only overrides. Role linkage remains intact. */
	featureSettings?: FontFeatureSettings;
	variationSettings?: FontVariationSettings;
	fontSize: number;
	fontWeight: number;
	lineHeight: number;
	letterSpacing: number;
	color: string;
	textAlign: TextAlignment;
	textCasing: TextCasing;
};

export type ImageNode = BaseNode & {
	type: "image";
	src: string;
	imageId: string | null;
	alt: string;
	objectFit: "cover" | "contain";
	zoom: number;
	positionX: number;
	positionY: number;
	effects: ImageEffects;
	opacity: number;
	/** @deprecated Retained only to deserialize older saved projects. */
	blendMode?:
		| "normal"
		| "multiply"
		| "screen"
		| "overlay"
		| "difference"
		| "lighten"
		| "darken";
	texture?: TextureCardFill | null;
};

export type ImageEffects = {
	brightness: number;
	contrast: number;
	saturation: number;
	blur: number;
	grayscale: number;
	sepia: number;
};

export type ShapeNode = BaseNode & {
	type: "shape";
	shapeType: "icon" | "emoji" | "line" | "rectangle" | "ellipse";
	shape: string;
	color: string;
	strokeWidth: number;
	texture?: TextureCardFill | null;
};

export type EditorNode = TextNode | ImageNode | ShapeNode;
export type EditorNodePatch =
	| Partial<TextNode>
	| Partial<ImageNode>
	| Partial<ShapeNode>;

export type EditorCard = {
	id: string;
	name: string;
	width: number;
	height: number;
	settings: CardSettings;
	nodes: EditorNode[];
	scenario?: CardScenarioMetadata;
	comparisonLabel?: string;
	fontSystemOverrides?: CardFontSystemOverrides;
};

export type TypographyScenarioCategory =
	| "display"
	| "editorial"
	| "product-ui"
	| "identity"
	| "technical";

export type TypographyStressTest =
	| "display-size"
	| "small-size"
	| "dense-copy"
	| "long-form"
	| "all-caps"
	| "mixed-case"
	| "numerals"
	| "punctuation"
	| "kerning"
	| "variable-axes"
	| "open-type-features"
	| "multilingual"
	| "image-overlay"
	| "narrow-container"
	| "wide-container";

export type CardScenarioMetadata = {
	scenarioId: string;
	scenarioName: string;
	category: TypographyScenarioCategory;
	stressTests: TypographyStressTest[];
};

export type CardFontRoleOverride = {
	fontId?: string;
	variantId?: string;
	featureSettings?: FontFeatureSettings;
	variationSettings?: FontVariationSettings;
};

export type CardFontSystemOverrides = {
	roles?: Partial<Record<ProjectFontRole, CardFontRoleOverride>>;
};

export type LinkedCardGroupMode =
	| "font-assignment"
	| "role-swap"
	| "font-variant"
	| "feature-settings"
	| "variation-settings"
	| "size-normalization"
	| "original-vs-modified";

export type LinkedCardSyncSettings = {
	content: boolean;
	layout: boolean;
	images: boolean;
	cardStyle: boolean;
	typographyStructure: boolean;
};

export type LinkedCardGroup = {
	id: string;
	name: string;
	scenarioId?: string;
	cardIds: string[];
	sourceCardId: string;
	mode: LinkedCardGroupMode;
	sync: LinkedCardSyncSettings;
};
