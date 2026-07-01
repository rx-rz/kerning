import type {
	CardFill,
	FlutedGlassSettings,
	GradientStop,
	HalftoneCmykTextureSettings,
	HalftoneTextureSettings,
	ImageFillSettings,
	PaperTextureSettings,
	TextureCardFill,
} from "#/features/editor/types";

const DEFAULT_STOPS: GradientStop[] = [
	{ id: "start", color: "#FFFDF8", position: 0 },
	{ id: "end", color: "#111111", position: 100 },
];

export const DEFAULT_PAPER_SETTINGS: PaperTextureSettings = {
	colorFront: "#9FADBC",
	colorBack: "#FFFFFF",
	contrast: 0.3,
	roughness: 0.4,
	fiber: 0.3,
	crumples: 0.3,
	folds: 0.65,
	seed: 5.8,
};

export const DEFAULT_FLUTED_GLASS_SETTINGS: FlutedGlassSettings = {
	colorBack: "#D9E6EF",
	colorShadow: "#000000",
	colorHighlight: "#FFFFFF",
	size: 0.5,
	angle: 0,
	distortion: 0.5,
	blur: 0,
	highlights: 0.1,
};

export const DEFAULT_IMAGE_SETTINGS: ImageFillSettings = {
	backgroundSize: "cover",
	originX: 50,
	originY: 50,
};

export const DEFAULT_HALFTONE_SETTINGS: HalftoneTextureSettings = {
	colorBack: "#F2F1E8",
	colorFront: "#2B2B2B",
	size: 0.5,
	radius: 1.25,
	contrast: 0.4,
	grid: "hex",
	dotType: "gooey",
	inverted: false,
	grain: 0.2,
};

export const DEFAULT_HALFTONE_CMYK_SETTINGS: HalftoneCmykTextureSettings = {
	colorBack: "#FBFAF5",
	colorC: "#00B4FF",
	colorM: "#FC519F",
	colorY: "#FFD800",
	colorK: "#231F20",
	size: 0.2,
	contrast: 1,
	softness: 1,
	gridNoise: 0.2,
	dotType: "ink",
};

export function createDefaultFill(type: CardFill["type"]): CardFill {
	switch (type) {
		case "linear-gradient":
			return {
				type,
				angle: 135,
				stops: DEFAULT_STOPS.map((stop) => ({ ...stop })),
			};
		case "radial-gradient":
			return {
				type,
				centerX: 50,
				centerY: 50,
				stops: DEFAULT_STOPS.map((stop) => ({ ...stop })),
			};
		case "image":
			return {
				type,
				imageId: null,
				opacity: 0.35,
				settings: { ...DEFAULT_IMAGE_SETTINGS },
			};
		default:
			return { type: "solid", color: "#FFFDF8" };
	}
}

export function createDefaultTextureFill(
	texture: TextureCardFill["texture"],
): TextureCardFill {
	switch (texture) {
		case "fluted-glass":
			return {
				type: "texture",
				texture,
				opacity: 0.35,
				settings: DEFAULT_FLUTED_GLASS_SETTINGS,
			};
		case "halftone":
			return {
				type: "texture",
				texture,
				opacity: 0.35,
				settings: DEFAULT_HALFTONE_SETTINGS,
			};
		case "halftone-cmyk":
			return {
				type: "texture",
				texture,
				opacity: 0.35,
				settings: DEFAULT_HALFTONE_CMYK_SETTINGS,
			};
		default:
			return {
				type: "texture",
				texture: "paper",
				opacity: 0.35,
				settings: DEFAULT_PAPER_SETTINGS,
			};
	}
}

export function getCardFillStyle(fill: CardFill): React.CSSProperties {
	if (fill.type === "solid") return { backgroundColor: fill.color };
	if (fill.type === "image") return {};
	const stops = [...fill.stops]
		.sort((left, right) => left.position - right.position)
		.map((stop) => `${stop.color} ${stop.position}%`)
		.join(", ");

	return fill.type === "linear-gradient"
		? { backgroundImage: `linear-gradient(${fill.angle}deg, ${stops})` }
		: {
				backgroundImage: `radial-gradient(circle at ${fill.centerX}% ${fill.centerY}%, ${stops})`,
			};
}
