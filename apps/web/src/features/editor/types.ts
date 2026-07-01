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
	borderRadius: number;
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

type BaseNode = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
};

export type TextNode = BaseNode & {
	type: "text";
	text: string;
	fontType: FontType;
	fontSize: number;
	fontWeight: number;
	lineHeight: number;
	color: string;
	textAlign: "left" | "center" | "right";
};

export type ImageNode = BaseNode & {
	type: "image";
	src: string;
	imageId: string | null;
	alt: string;
	objectFit: "cover" | "contain";
	opacity: number;
};

export type EditorNode = TextNode | ImageNode;
export type EditorNodePatch = Partial<TextNode> | Partial<ImageNode>;

export type EditorCard = {
	id: string;
	name: string;
	width: number;
	height: number;
	settings: CardSettings;
	nodes: EditorNode[];
};
