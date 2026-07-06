import { useStoredImageUrl } from "#/features/editor/hooks/use-stored-image-url";
import type { ImageCardFill } from "#/features/editor/types";

export function CardImageFill({ fill }: { fill: ImageCardFill }) {
	const storedImageUrl = useStoredImageUrl(fill.imageId);
	const imageUrl = storedImageUrl || fill.src;

	if (!imageUrl) return null;

	return (
		<div
			aria-hidden="true"
			data-card-layer="image"
			className="pointer-events-none absolute inset-0 size-full bg-no-repeat"
			style={{
				backgroundImage: `url(${imageUrl})`,
				backgroundPosition: `${fill.settings.originX}% ${fill.settings.originY}%`,
				backgroundSize: fill.settings.backgroundSize,
				opacity: fill.opacity,
			}}
		/>
	);
}
