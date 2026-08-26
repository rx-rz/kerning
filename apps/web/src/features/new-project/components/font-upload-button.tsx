import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { Kbd } from "#/components/ui/kbd";
import type { FontFamilyMeta } from "#/db/font-db";
import { uploadFontFiles } from "#/lib/fonts";

type Props = {
  onUploaded: (fonts: FontFamilyMeta[]) => void;
  uploadedFontCount: number;
  maxFonts?: number;
};

export function FontUploadButton({
  onUploaded,
  uploadedFontCount,
  maxFonts,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "u"
      ) {
        return;
      }

      event.preventDefault();

      if (
        !isUploading &&
        (typeof maxFonts !== "number" || uploadedFontCount < maxFonts)
      ) {
        inputRef.current?.click();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isUploading, maxFonts, uploadedFontCount]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setIsUploading(true);
    setUploadError(undefined);

    try {
      const fonts = await uploadFontFiles(files, { maxFamilies: maxFonts });

      onUploaded(fonts);
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Unable to load those fonts. Please try again.",
      );
    } finally {
      // Clearing lets users retry the same file after correcting a transient issue.
      if (inputRef.current) inputRef.current.value = "";
      setIsUploading(false);
    }
  }

  const isFull = typeof maxFonts === "number" && uploadedFontCount >= maxFonts;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
        aria-label="Choose font files"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <Button
        type="button"
        variant="accent"
        size="lg"
        className="w-full justify-between gap-4 rounded-xl mt-4 px-4 py-4 text-left"
        disabled={isUploading || isFull}
        aria-describedby="font-upload-help font-upload-status"
        onClick={() => inputRef.current?.click()}
      >
        <span className="inline-flex min-w-0 items-center gap-4 text-muted-foreground">
          <span className="min-w-0">
            <span className="block truncate text-base uppercase tracking-normal">
              {isUploading
                ? "Uploading"
                : isFull
                  ? "Limit reached"
                  : `Upload fonts`}
            </span>
            {/* <span className="mt-1 block truncate font-sans text-xs font-medium normal-case">
							TTF, OTF, WOFF, WOFF2 · static or variable
						</span> */}
          </span>
        </span>
        <Kbd className="flex items-center border text-base font-medium text-muted-foreground">
          <span>&#8984;</span>
          <span>+</span>
          <span>U</span>
        </Kbd>
      </Button>
      <div
        id="font-upload-help"
        className="flex items-start gap-2 text-sm text-muted-foreground"
      >
        <Info className="size-4" />
        <p>
          {maxFonts > 0
            ? `You can upload up to ${maxFonts} font families at a time.`
            : maxFonts === undefined
              ? "Upload as many project font families as you need."
              : "Remove a selected font to upload another."}
        </p>
      </div>
      <p
        id="font-upload-status"
        role={uploadError ? "alert" : "status"}
        aria-live="polite"
        className={
          uploadError
            ? "rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            : "sr-only"
        }
      >
        {uploadError ?? (isUploading ? "Loading selected font files." : "")}
      </p>
    </div>
  );
}
