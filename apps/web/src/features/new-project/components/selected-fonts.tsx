import { Button } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import type { FontFamilyMeta } from "#/db/font-db";

type Props = {
  fonts: FontFamilyMeta[];
  onDeleteFont: (fontId: string) => void;
};

export function SelectedFonts({ fonts, onDeleteFont }: Props) {
  if (!fonts.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 font-mono text-sm font-semibold uppercase text-muted-foreground sm:text-lg">
        <span>Selected Fonts</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tracking-normal">
          {fonts.length}
        </span>
      </div>

      <Card className="gap-0 border" variant="hairline">
        {fonts.map((font) => (
          <SelectedFontRow
            key={font.id}
            font={font}
            onDeleteFont={onDeleteFont}
          />
        ))}
      </Card>
    </section>
  );
}

function SelectedFontRow({
  font,
  onDeleteFont,
}: {
  font: FontFamilyMeta;
  onDeleteFont: (fontId: string) => void;
}) {
  const metadata = getSelectedFontMetadata(font);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0 sm:flex-nowrap">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-lg font-semibold"
        style={{ fontFamily: font.cssFamily }}
      >
        Aa
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3
            className="truncate font-semibold tracking-tight"
            style={{ fontFamily: font.cssFamily }}
          >
            {font.name}
          </h3>
        </div>

        <div className="mt-1 flex min-w-0 flex-wrap gap-1.5">
          {metadata.map((item) => (
            <span
              key={item}
              className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="text-destructive"
        size="sm"
        onClick={() => onDeleteFont(font.id)}
      >
        Delete
      </Button>
    </div>
  );
}

function getSelectedFontMetadata(font: FontFamilyMeta) {
  const isGoogleFont = font.source === "google";
  const source = isGoogleFont ? "Google" : "Uploaded";
  const category = isGoogleFont
    ? formatFontCategory(font.category)
    : getUploadedFontType(font);
  const variantCount = isGoogleFont
    ? (font.variants?.length ?? 0)
    : getUploadedVariantCount(font);

  return [source, category, formatCount(variantCount, "variant")];
}

function formatFontCategory(category?: string) {
  if (!category) return "Unknown";

  return category.replace(/-/g, " ");
}

function getUploadedFontType(font: FontFamilyMeta) {
  return font.faces.some((face) => face.kind === "variable")
    ? "Variable"
    : "Static";
}

function getUploadedVariantCount(font: FontFamilyMeta) {
  const variants = font.faces.map((face) => {
    if (face.kind === "variable" && face.weightRange) {
      return `${face.weightRange.min}-${face.weightRange.max}-${face.style}`;
    }

    return `${face.weight}-${face.style}`;
  });

  return new Set(variants).size;
}

function formatCount(count: number, label: string) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}
