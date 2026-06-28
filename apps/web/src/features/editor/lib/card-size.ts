import type { CardAspectRatio } from "#/features/editor/types";

export type CardSize = {
	width: number;
	height: number;
};

export const MIN_CARD_DIMENSION = 1;
export const MAX_CARD_WIDTH = 640;
export const MAX_CARD_HEIGHT = 640;

const CARD_SIZES: Record<CardAspectRatio, CardSize> = {
	"1:1": { width: 500, height: 500 },
	"4:5": { width: 480, height: 600 },
	"16:9": { width: 640, height: 360 },
	"9:16": { width: 360, height: 640 },
	"3:2": { width: 600, height: 400 },
	"business-card": { width: 560, height: 320 },
};

export function getCardSizeFromAspectRatio(
	aspectRatio: CardAspectRatio,
): CardSize {
	return CARD_SIZES[aspectRatio];
}

export function clampCardWidth(width: number) {
	return Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_DIMENSION, width));
}

export function clampCardHeight(height: number) {
	return Math.min(MAX_CARD_HEIGHT, Math.max(MIN_CARD_DIMENSION, height));
}
