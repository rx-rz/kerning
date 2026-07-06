import { Trash2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import type { FontFamilyMeta } from "#/db/font-db";
import { formatBytes } from "#/lib/fonts";

type Props = {
  fonts: FontFamilyMeta[];
  onDeleteFont: (fontId: string) => void;
};

export function UploadedFonts({ fonts, onDeleteFont }: Props) {
  if (!fonts.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3 font-sans text-sm font-semibold uppercase  text-muted-foreground sm:text-lg">
        <span>Uploaded Fonts</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tracking-normal">
          {fonts.length}
        </span>
      </div>

      <Card className="gap-0 border mt-3" variant="hairline">
        {fonts.map((font) => {
          const firstFace = font.faces[0];
          const totalSize = font.faces.reduce(
            (total, face) => total + face.size,
            0,
          );
          const faceSummary = formatFaceSummary(font);

          return (
            <div
              key={font.id}
              className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0 sm:flex-nowrap"
            >
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-lg font-semibold"
                style={{ fontFamily: font.cssFamily }}
              >
                Aa
              </div>

              <div className="min-w-0 flex-1">
                <h3
                  className="truncate font-semibold tracking-tight"
                  style={{ fontFamily: font.cssFamily }}
                >
                  {font.name}
                </h3>

                <p className="truncate text-xs text-muted-foreground">
                  {firstFace
                    ? `${formatBytes(totalSize)} · ${faceSummary}`
                    : null}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => onDeleteFont(font.id)}
              >
                <Trash2 />
                Delete
              </Button>
            </div>
          );
        })}
      </Card>
    </section>
  );
}

function formatFaceSummary(font: FontFamilyMeta) {
  const faces = font.faces.map((face) => {
    if (face.kind === "variable" && face.weightRange) {
      return `${face.weightRange.min}-${face.weightRange.max} ${face.style}`;
    }

    return `${face.weight} ${face.style}`;
  });

  return [...new Set(faces)].join(", ");
}
