import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	deleteFontFamily,
	type FontFamilyMeta,
	getAllFontFamilies,
	toFontFamilyMeta,
} from "#/db/font-db";
import {
	loadFontFamilyIntoDocument,
	normalizeFontFamilyName,
} from "#/lib/fonts";
import { FontSelectSection } from "../components/font-selection";
import { FontUploadButton } from "../components/font-upload-button";
import { UploadedFonts } from "../components/uploaded-fonts";

const MAX_UPLOADED_FONTS = 3;

export type FontUploadPreviewState = {
	fonts: FontFamilyMeta[];
	primaryFontId?: string;
	secondaryFontOneId?: string;
	secondaryFontTwoId?: string;
};

type Props = {
	onPreviewChange?: (state: FontUploadPreviewState) => void;
};

export function FontUploadTab({ onPreviewChange }: Props) {
	const [fonts, setFonts] = useState<FontFamilyMeta[]>([]);

	const [primaryFontId, setPrimaryFontId] = useState<string>();
	const [secondaryFontOneId, setSecondaryFontOneId] = useState<string>();
	const [secondaryFontTwoId, setSecondaryFontTwoId] = useState<string>();

	useEffect(() => {
		async function loadFonts() {
			const storedFonts = await getAllFontFamilies();

			for (const font of storedFonts) {
				await loadFontFamilyIntoDocument(font);
			}

			setFonts(
				mergeFontFamilies(storedFonts.map(toFontFamilyMeta)).slice(
					0,
					MAX_UPLOADED_FONTS,
				),
			);
		}

		loadFonts();
	}, []);

	useEffect(() => {
		const fontIds = new Set(fonts.map((font) => font.id));
		const [firstFontId, secondFontId, thirdFontId] = fonts.map(
			(font) => font.id,
		);

		if (!fonts.length) {
			setPrimaryFontId(undefined);
			setSecondaryFontOneId(undefined);
			setSecondaryFontTwoId(undefined);
			return;
		}

		if (!primaryFontId || !fontIds.has(primaryFontId)) {
			setPrimaryFontId(firstFontId);
		}

		if (!secondaryFontOneId || !fontIds.has(secondaryFontOneId)) {
			setSecondaryFontOneId(secondFontId);
		}

		if (!secondaryFontTwoId || !fontIds.has(secondaryFontTwoId)) {
			setSecondaryFontTwoId(thirdFontId);
		}
	}, [fonts, primaryFontId, secondaryFontOneId, secondaryFontTwoId]);

	useEffect(() => {
		onPreviewChange?.({
			fonts,
			primaryFontId,
			secondaryFontOneId,
			secondaryFontTwoId,
		});
	}, [
		fonts,
		onPreviewChange,
		primaryFontId,
		secondaryFontOneId,
		secondaryFontTwoId,
	]);

	function handleUploaded(nextFonts: FontFamilyMeta[]) {
		setFonts(mergeFontFamilies(nextFonts).slice(0, MAX_UPLOADED_FONTS));
	}

	async function handleDeleteFont(fontId: string) {
		await deleteFontFamily(fontId);
		setFonts((currentFonts) =>
			currentFonts.filter((font) => font.id !== fontId),
		);
	}

	return (
		<div className="mx-auto space-y-12">
			<FontUploadButton
				onUploaded={handleUploaded}
				uploadedFontCount={fonts.length}
				maxFonts={MAX_UPLOADED_FONTS}
			/>

			<UploadedFonts fonts={fonts} onDeleteFont={handleDeleteFont} />

			<FontSelectSection
				fonts={fonts}
				primaryFontId={primaryFontId}
				secondaryFontOneId={secondaryFontOneId}
				secondaryFontTwoId={secondaryFontTwoId}
				onPrimaryChange={setPrimaryFontId}
				onSecondaryOneChange={setSecondaryFontOneId}
				onSecondaryTwoChange={setSecondaryFontTwoId}
			/>

			{fonts.length > 0 && (
				<Button className="w-full p-5 mt-5" disabled={!primaryFontId}>
					Create Project
				</Button>
			)}
		</div>
	);
}

function mergeFontFamilies(fonts: FontFamilyMeta[]) {
	const familyMap = new Map<string, FontFamilyMeta>();

	for (const font of fonts) {
		const familyName = normalizeFontFamilyName(font.name);
		const familyKey = familyName.toLowerCase();
		const existingFamily = familyMap.get(familyKey);

		if (!existingFamily) {
			familyMap.set(familyKey, {
				...font,
				name: familyName,
				faces: dedupeFontFaces(font.faces),
			});
			continue;
		}

		existingFamily.faces = dedupeFontFaces([
			...existingFamily.faces,
			...font.faces,
		]);
		existingFamily.updatedAt =
			existingFamily.updatedAt > font.updatedAt
				? existingFamily.updatedAt
				: font.updatedAt;
	}

	return Array.from(familyMap.values()).sort((a, b) =>
		a.createdAt.localeCompare(b.createdAt),
	);
}

type FontFaceMeta = FontFamilyMeta["faces"][number];

function dedupeFontFaces(faces: FontFaceMeta[]) {
	const faceMap = new Map<string, FontFaceMeta>();

	for (const face of faces) {
		faceMap.set(face.id, face);
	}

	return Array.from(faceMap.values());
}
