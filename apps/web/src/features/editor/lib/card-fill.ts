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
	{ id: "start", color: "#FFFDF8", position: 1 },
	{ id: "end", color: "#046A63", position: 100 },
];

export const DEFAULT_PAPER_SETTINGS: PaperTextureSettings = {
	colorFront: "#046A63",
	colorBack: "#FFFFFF",
	contrast: 0.3,
	roughness: 0.4,
	fiber: 0.3,
	crumples: 0.3,
	folds: 0.65,
	seed: 5.8,
};

export const DEFAULT_FLUTED_GLASS_SETTINGS: FlutedGlassSettings = {
	colorBack: "#E6F0EF",
	colorShadow: "#034F4A",
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
	colorBack: "#E6F0EF",
	colorFront: "#046A63",
	size: 0.5,
	radius: 1.25,
	contrast: 0.4,
	grid: "hex",
	dotType: "gooey",
	inverted: false,
	grain: 0.2,
};

export const DEFAULT_HALFTONE_CMYK_SETTINGS: HalftoneCmykTextureSettings = {
	colorBack: "#E6F0EF",
	colorC: "#046A63",
	colorM: "#E5484D",
	colorY: "#FED503",
	colorK: "#141414",
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
				src: "",
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

function clampIntegerPercent(value: number) {
	return Math.min(100, Math.max(1, Math.round(value)));
}

export function normalizeCardFillPercentages(fill: CardFill): CardFill {
	if (fill.type === "solid") return fill;
	if (fill.type === "image") {
		return {
			...fill,
			settings: {
				...fill.settings,
				originX: clampIntegerPercent(fill.settings.originX),
				originY: clampIntegerPercent(fill.settings.originY),
			},
		};
	}

	const normalizedFill = {
		...fill,
		stops: fill.stops.map((stop) => ({
			...stop,
			position: clampIntegerPercent(stop.position),
		})),
	};

	return fill.type === "radial-gradient"
		? {
				...normalizedFill,
				centerX: clampIntegerPercent(fill.centerX),
				centerY: clampIntegerPercent(fill.centerY),
			}
		: normalizedFill;
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
