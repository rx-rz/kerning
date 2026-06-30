import {
	FlutedGlass,
	HalftoneCmyk,
	HalftoneDots,
	ImageDithering,
	PaperTexture,
} from "@paper-design/shaders-react";

import type { ImageCardFill, TextureCardFill } from "#/features/editor/types";

const SHADER_CLASS_NAME = "pointer-events-none absolute inset-0 size-full";
const MAX_PIXEL_COUNT = 1_000_000;

export function CardTextureFill({
	fill,
}: {
	fill: TextureCardFill | ImageCardFill;
}) {
	const sharedProps = {
		"aria-hidden": true,
		className: SHADER_CLASS_NAME,
		maxPixelCount: MAX_PIXEL_COUNT,
		minPixelRatio: 1,
		style: {
			width: "100%",
			height: "100%",
			opacity: fill.opacity,
		},
	} as const;

	if (fill.type === "image") {
		const { ditherType, ...settings } = fill.settings;
		return (
			<ImageDithering
				{...sharedProps}
				{...settings}
				fit="cover"
				type={ditherType}
			/>
		);
	}

	switch (fill.texture) {
		case "fluted-glass":
			return <FlutedGlass {...sharedProps} {...fill.settings} fit="cover" />;
		case "halftone": {
			const { dotType, grain, ...settings } = fill.settings;
			return (
				<HalftoneDots
					{...sharedProps}
					{...settings}
					fit="cover"
					type={dotType}
					grainMixer={grain}
					grainOverlay={grain}
				/>
			);
		}
		case "halftone-cmyk": {
			const { dotType, ...settings } = fill.settings;
			return (
				<HalftoneCmyk
					{...sharedProps}
					{...settings}
					fit="cover"
					type={dotType}
				/>
			);
		}
		default:
			return (
				<PaperTexture
					{...sharedProps}
					{...fill.settings}
					fit="cover"
					speed={0}
				/>
			);
	}
}
