import type {
  GoogleFontCatalogItem,
  GoogleFontCategory,
} from "@kerning/shared";
import { Check, Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useGoogleFontsApi } from "#/api/google-fonts/list";
import { Button } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import { SolidCardHead } from "#/components/ui/card-head";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
  getGoogleFontDefaultWeight,
  loadGoogleFontStylesheet,
} from "#/lib/fonts";
import { cn } from "#/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFont: (font: GoogleFontCatalogItem) => void;
  onRemoveFont: (fontId: string) => void;
  currentFontCount?: number;
  maxFontFamilies?: number;
  importedFonts?: Array<{
    id: string;
    name: string;
  }>;
};

const MAX_VISIBLE_FONTS = 12;

const CATEGORIES: Array<{
  value: GoogleFontCategory;
  label: string;
}> = [
  { value: undefined, label: "All" },
  { value: "sans-serif", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Mono" },
  { value: "display", label: "Display" },
  { value: "handwriting", label: "Handwriting" },
];

const SPECIMEN_MODES = {
  letters: {
    label: "Aa",
    sample: (
      <>
        <span>abcdefghi</span>
        <span>jklmnopq</span>
        <span>rstuvwxyz</span>
      </>
    ),
  },
  numbers: {
    label: "12",
    sample: (
      <>
        <span>0123</span>
        <span>4567</span>
        <span>89.0</span>
      </>
    ),
  },
  symbols: {
    label: "?!",
    sample: (
      <>
        <span>&amp;@#</span>
        <span>!?*</span>
        <span>+-=</span>
      </>
    ),
  },
} as const;

type SpecimenMode = keyof typeof SPECIMEN_MODES;

export function GoogleFontsDialog({
  open,
  onOpenChange,
  onSelectFont,
  onRemoveFont,
  currentFontCount = 0,
  maxFontFamilies,
  importedFonts = [],
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GoogleFontCategory>();
  const [specimenModes, setSpecimenModes] = useState<
    Record<string, SpecimenMode>
  >({});
  const { data, isLoading, isError, error } = useGoogleFontsApi({
    q: query,
    category,
    limit: MAX_VISIBLE_FONTS,
    enabled: open,
  });

  const fonts = useMemo(
    () => (data?.fonts ?? []).slice(0, MAX_VISIBLE_FONTS),
    [data?.fonts],
  );
  const importedFontIdByFamily = useMemo(
    () => new Map(importedFonts.map((font) => [font.name, font.id])),
    [importedFonts],
  );
  const hasReachedFontLimit =
    typeof maxFontFamilies === "number" && currentFontCount >= maxFontFamilies;

  useEffect(() => {
    if (!open) return;

    for (const font of fonts) {
      loadGoogleFontStylesheet(font);
    }
  }, [fonts, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-100 h-[90dvh] w-full max-w-[90vw]! overflow-hidden border-0 bg-transparent p-0 shadow-none"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Google Fonts</DialogTitle>
        <DialogDescription className="sr-only">
          Search Google Fonts and add one family to this project.
        </DialogDescription>

        <Card variant="frosted" className="h-full gap-0  border">
          <div className="shrink-0 border-b border-border bg-surface-glass/85  backdrop-blur-2xl">
            <div className="grid h-16 grid-cols-[96px_1fr_96px] items-center px-4 sm:px-5">
              <div className="flex items-center gap-2 text-foreground/40">
                <span className="size-2.5 rounded-full bg-current" />
                <span className="size-2.5 rounded-full bg-current" />
                <span className="size-2.5 rounded-full bg-current" />
              </div>

              <div className="mono-label text-center text-foreground">
                Google Fonts
              </div>

              <DialogClose asChild>
                <button
                  type="button"
                  className="ml-auto flex size-8 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-background/60 hover:text-foreground"
                  aria-label="Close Google Fonts"
                >
                  <X className="size-5" />
                </button>
              </DialogClose>
            </div>

            <div className="flex flex-col gap-4 px-4 pb-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-wrap gap-2">
                {CATEGORIES.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    variant={category === item.value ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-12 rounded-xl px-5 shadow-[inset_0_0_0_1px_var(--line-hair)]",
                      category !== item.value &&
                        "bg-background/52 backdrop-blur-xl hover:bg-background/80",
                    )}
                    onClick={() => setCategory(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <div className="relative w-full lg:ml-auto lg:max-w-xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-black" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search families"
                  className="min-h-14 rounded-2xl bg-background/78 pl-12 pr-5 backdrop-blur-xl hover:bg-background/90"
                />
              </div>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto p-5">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : isError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Unable to load Google Fonts."}
              </p>
            ) : fonts.length ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {fonts.map((font) => {
                  const specimenMode = specimenModes[font.family] ?? "letters";

                  return (
                    <GoogleFontCard
                      key={font.family}
                      font={font}
                      importedFontId={importedFontIdByFamily.get(font.family)}
                      specimenMode={specimenMode}
                      hasReachedFontLimit={hasReachedFontLimit}
                      onSpecimenModeChange={(mode) =>
                        setSpecimenModes((currentModes) => ({
                          ...currentModes,
                          [font.family]: mode,
                        }))
                      }
                      onSelect={() => {
                        onSelectFont(font);
                        onOpenChange(false);
                      }}
                      onRemove={onRemoveFont}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="rounded-md border border-border p-4 text-sm text-muted-foreground">
                No matching families.
              </p>
            )}
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

function GoogleFontCard({
  font,
  importedFontId,
  specimenMode,
  hasReachedFontLimit,
  onSpecimenModeChange,
  onSelect,
  onRemove,
}: {
  font: GoogleFontCatalogItem;
  importedFontId?: string;
  specimenMode: SpecimenMode;
  hasReachedFontLimit: boolean;
  onSpecimenModeChange: (mode: SpecimenMode) => void;
  onSelect: () => void;
  onRemove: (fontId: string) => void;
}) {
  const isImported = Boolean(importedFontId);
  const cannotAdd = !isImported && hasReachedFontLimit;
  const fontWeight = getGoogleFontDefaultWeight(font);

  return (
    <Card
      variant="frosted"
      className={cn(
        "group min-h-110 gap-0 border transition-[box-shadow,transform]",
        isImported && "shadow-[inset_0_0_0_1px_var(--primary)]",
      )}
    >
      <SolidCardHead
        title={font.family}
        trailing={
          isImported ? <Check className="size-4 text-primary" /> : undefined
        }
      />

      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div
          className="flex min-h-52.5 flex-1 flex-col items-center justify-center gap-3 text-center text-5xl leading-none tracking-normal text-foreground"
          style={{
            fontFamily: font.family,
            fontWeight,
          }}
        >
          {SPECIMEN_MODES[specimenMode].sample}
        </div>

        <div className="mt-6 min-w-0">
          <h3
            className="truncate text-lg font-semibold tracking-normal text-foreground"
            style={{
              fontFamily: font.family,
              fontWeight,
            }}
          >
            {font.family}
          </h3>
          <p className="mt-1 font-mono text-[11px] font-semibold uppercase text-muted-foreground">
            {font.category} / {font.variants.length} variants
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="flex rounded-lg border border-border bg-background/70 p-1">
            {Object.entries(SPECIMEN_MODES).map(([mode, item]) => (
              <button
                key={mode}
                type="button"
                className={cn(
                  "flex size-9 items-center justify-center rounded-md font-mono text-[11px] font-semibold uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  specimenMode === mode && "bg-foreground text-background",
                )}
                onClick={() => onSpecimenModeChange(mode as SpecimenMode)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            size="sm"
            className={isImported ? "text-white" : "text-foreground"}
            variant={isImported ? "destructive" : "accent"}
            disabled={cannotAdd}
            onClick={() => {
              if (importedFontId) {
                onRemove(importedFontId);
                return;
              }

              onSelect();
            }}
          >
            {isImported ? "Remove" : cannotAdd ? "Limit reached" : "Add"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
