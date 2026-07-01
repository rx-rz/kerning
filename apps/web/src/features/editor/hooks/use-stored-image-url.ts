import { useEffect, useState } from "react";

import { getEditorImage } from "#/db/image-db";

export function useStoredImageUrl(imageId: string | null) {
	const [objectUrl, setObjectUrl] = useState("");

	useEffect(() => {
		if (!imageId) {
			setObjectUrl("");
			return;
		}

		let isActive = true;
		let nextObjectUrl = "";

		void getEditorImage(imageId).then((image) => {
			if (!image || !isActive) return;
			nextObjectUrl = URL.createObjectURL(image.blob);
			setObjectUrl(nextObjectUrl);
		});

		return () => {
			isActive = false;
			if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
		};
	}, [imageId]);

	return objectUrl;
}
