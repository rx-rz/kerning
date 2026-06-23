import type { FontFamilyMeta } from "#/db/font-db";
import { normalizeFontFamilyName } from "#/lib/fonts";
import { FontUploadButton } from "../components/font-upload-button";

export type FontUploadPreviewState = {
  fonts: FontFamilyMeta[];
  primaryFontId?: string;
  secondaryFontOneId?: string;
  secondaryFontTwoId?: string;
};

type Props = {
  fonts: FontFamilyMeta[];
  onFontsChange: (fonts: FontFamilyMeta[]) => void;
  maxFonts?: number;
};

export function FontUploadTab({ fonts, onFontsChange, maxFonts }: Props) {
  function handleUploaded(nextFonts: FontFamilyMeta[]) {
    onFontsChange(mergeFontFamilies(nextFonts));
  }

  return (
    <div className="mx-auto">
      <FontUploadButton
        onUploaded={handleUploaded}
        uploadedFontCount={fonts.length}
        maxFonts={maxFonts}
      />
    </div>
  );
}

export function mergeFontFamilies(fonts: FontFamilyMeta[]) {
  const familyMap = new Map<string, FontFamilyMeta>();

  for (const font of fonts) {
    const familyName = normalizeFontFamilyName(font.name);
    const familyKey = `${font.source ?? "upload"}:${familyName.toLowerCase()}`;
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
