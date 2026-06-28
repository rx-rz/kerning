import type { GoogleFontCatalogItem, ProjectFontInput } from "@kerning/shared";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { createFileMetadata } from "#/api/files/create";
import { getFileUploadUrl } from "#/api/files/upload-url";
import { API_ROUTES } from "#/api/api-routes";
import { useCreateProjectApi } from "#/api/projects/create";
import type { ProjectData } from "#/api/projects/types";
import { queries } from "#/api/queries";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { SolidCardHead } from "#/components/ui/card-head";
import { Input } from "#/components/ui/input";
import { Kbd } from "#/components/ui/kbd";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  deleteFontFamily,
  type FontFamilyMeta,
  getAllFontFamilies,
  getFontFamily,
  toFontFamilyMeta,
} from "#/db/font-db";
import { FontSelectSection } from "#/features/new-project/components/font-selection";
import { GoogleFontsDialog } from "#/features/new-project/components/google-fonts-dialog";
import { SelectedFonts } from "#/features/new-project/components/selected-fonts";
import {
  type FontUploadPreviewState,
  FontUploadTab,
  mergeFontFamilies,
} from "#/features/new-project/containers/font-upload-tab";
import { api } from "#/lib/api";
import { importGoogleFont, loadFontFamilyIntoDocument } from "#/lib/fonts";

export const Route = createFileRoute("/new")({
  validateSearch: (search): { confirm?: boolean } => {
    const confirm = search.confirm === true || search.confirm === "true";

    return confirm ? { confirm: true } : {};
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { confirm } = Route.useSearch();
  const navigate = useNavigate({ from: "/new" });
  const queryClient = useQueryClient();
  const createProject = useCreateProjectApi();
  const [activeTab, setActiveTab] = useState("upload");
  const [isGoogleFontsOpen, setIsGoogleFontsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [fonts, setFonts] = useState<FontFamilyMeta[]>([]);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [primaryFontId, setPrimaryFontId] = useState<string>();
  const [secondaryFontOneId, setSecondaryFontOneId] = useState<string>();
  const [secondaryFontTwoId, setSecondaryFontTwoId] = useState<string>();

  useEffect(() => {
    async function loadStoredFonts() {
      const storedFonts = await getAllFontFamilies();

      for (const font of storedFonts) {
        await loadFontFamilyIntoDocument(font);
      }

      setFonts(mergeFontFamilies(storedFonts.map(toFontFamilyMeta)));
    }

    loadStoredFonts();
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

  const previewState: FontUploadPreviewState = {
    fonts,
    primaryFontId,
    secondaryFontOneId,
    secondaryFontTwoId,
  };

  const uploadedFonts = fonts.filter((font) => font.source !== "google");
  const googleFonts = fonts.filter((font) => font.source === "google");

  const handleFontsChange = useCallback((nextFonts: FontFamilyMeta[]) => {
    setFonts(mergeFontFamilies(nextFonts));
  }, []);

  const handleGoogleFontSelected = useCallback(
    async (font: GoogleFontCatalogItem) => {
      const importedFont = await importGoogleFont(font);

      setFonts((currentFonts) =>
        mergeFontFamilies([...currentFonts, importedFont]),
      );
      setPrimaryFontId((currentFontId) => currentFontId ?? importedFont.id);
    },
    [],
  );

  const handleProceed = useCallback(async () => {
    await navigate({
      search: (currentSearch) => ({
        ...currentSearch,
        confirm: true,
      }),
    });
  }, [navigate]);

  const handleBackToDashboard = useCallback(async () => {
    await navigate({ to: "/" });
  }, [navigate]);

  const handleBackToSelection = useCallback(async () => {
    await navigate({
      search: (currentSearch) => ({
        ...currentSearch,
        confirm: undefined,
      }),
    });
  }, [navigate]);

  const handleCreateProject = useCallback(async () => {
    setIsSubmittingProject(true);

    try {
      const { project } = await createProject.mutateAsync({
        name: projectName.trim() || "Untitled Project",
      });
      const projectFonts = await buildProjectFontInputs({
        projectId: project.id,
        fonts,
        primaryFontId,
        secondaryFontOneId,
        secondaryFontTwoId,
      });
      const updatedProject = await api.jsend<ProjectData>(
        API_ROUTES.projects.detail(project.id),
        "PATCH",
        {
          json: { fonts: projectFonts },
        },
      );

      queryClient.setQueryData(queries.projects.detail(project.id).queryKey, {
        project: updatedProject.project,
      } satisfies ProjectData);
      await queryClient.invalidateQueries({
        queryKey: queries.projects.list.queryKey,
      });
      await navigate({
        to: "/project/$projectId",
        params: { projectId: updatedProject.project.id },
      });
    } finally {
      setIsSubmittingProject(false);
    }
  }, [
    createProject,
    fonts,
    navigate,
    primaryFontId,
    projectName,
    queryClient,
    secondaryFontOneId,
    secondaryFontTwoId,
  ]);

  const handleDeleteFont = useCallback(async (fontId: string) => {
    await deleteFontFamily(fontId);
    setFonts((currentFonts) =>
      currentFonts.filter((font) => font.id !== fontId),
    );
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "s"
      ) {
        return;
      }

      event.preventDefault();
      setActiveTab("google");
      setIsGoogleFontsOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="flex min-h-dvh bg-background text-foreground">
      {confirm ? (
        <ConfirmProjectView
          projectName={projectName}
          onProjectNameChange={setProjectName}
          previewState={previewState}
          canCreateProject={Boolean(primaryFontId)}
          isCreatingProject={isSubmittingProject}
          onBack={handleBackToSelection}
          onCreateProject={handleCreateProject}
        />
      ) : (
        <CreateProjectForm
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          fonts={fonts}
          uploadedFonts={uploadedFonts}
          googleFonts={googleFonts}
          primaryFontId={primaryFontId}
          secondaryFontOneId={secondaryFontOneId}
          secondaryFontTwoId={secondaryFontTwoId}
          onBrowseGoogleFonts={() => setIsGoogleFontsOpen(true)}
          onDeleteFont={handleDeleteFont}
          onFontsChange={handleFontsChange}
          onPrimaryChange={setPrimaryFontId}
          onSecondaryOneChange={setSecondaryFontOneId}
          onSecondaryTwoChange={setSecondaryFontTwoId}
          onBack={handleBackToDashboard}
          onProceed={handleProceed}
        />
      )}

      <GoogleFontsDialog
        open={isGoogleFontsOpen}
        onOpenChange={setIsGoogleFontsOpen}
        onSelectFont={handleGoogleFontSelected}
        onRemoveFont={handleDeleteFont}
        currentFontCount={fonts.length}
        importedFonts={googleFonts.map((font) => ({
          id: font.id,
          name: font.name,
        }))}
      />
    </main>
  );
}

function CreateProjectForm({
  activeTab,
  onActiveTabChange,
  fonts,
  uploadedFonts,
  googleFonts,
  primaryFontId,
  secondaryFontOneId,
  secondaryFontTwoId,
  onBrowseGoogleFonts,
  onDeleteFont,
  onFontsChange,
  onPrimaryChange,
  onSecondaryOneChange,
  onSecondaryTwoChange,
  onBack,
  onProceed,
}: {
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  fonts: FontFamilyMeta[];
  uploadedFonts: FontFamilyMeta[];
  googleFonts: FontFamilyMeta[];
  primaryFontId?: string;
  secondaryFontOneId?: string;
  secondaryFontTwoId?: string;
  onBrowseGoogleFonts: () => void;
  onDeleteFont: (fontId: string) => void;
  onFontsChange: (fonts: FontFamilyMeta[]) => void;
  onPrimaryChange: (fontId: string) => void;
  onSecondaryOneChange: (fontId: string) => void;
  onSecondaryTwoChange: (fontId: string) => void;
  onBack: () => void;
  onProceed: () => void;
}) {
  return (
    <section className="flex min-h-dvh w-full items-start justify-center overflow-y-auto px-4 py-6 sm:px-6 md:items-center md:px-8">
      <div className="w-full max-w-155 ">
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Back
        </Button>

        <div className="my-6 sm:my-8">
          <h1 className="text-2xl font-semibold sm:text-3xl">Create Project</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select fonts for your project typography.
          </p>
        </div>

        <Card className="overflow-hidden p-0">
          <Tabs
            value={activeTab}
            onValueChange={onActiveTabChange}
            className="gap-0"
          >
            <div className="border-b border-border">
              <TabsList variant="line" className="w-full">
                <TabsTrigger value="upload" className="w-fit py-4">
                  <Upload />
                  Upload Fonts
                </TabsTrigger>

                <TabsTrigger value="google" className="w-fit py-4">
                  <img src="/google.svg" alt="" className="size-4" />
                  Google Fonts
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="mt-12 w-full space-y-6 px-0">
              <SelectedFonts fonts={fonts} onDeleteFont={onDeleteFont} />

              <TabsContent value="google">
                <GoogleFontsTab onBrowse={onBrowseGoogleFonts} />
              </TabsContent>

              <TabsContent value="upload">
                <FontUploadTab
                  fonts={uploadedFonts}
                  onFontsChange={(nextUploadFonts) =>
                    onFontsChange([...googleFonts, ...nextUploadFonts])
                  }
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <div className="mt-10 space-y-4">
          <FontSelectSection
            fonts={fonts}
            primaryFontId={primaryFontId}
            secondaryFontOneId={secondaryFontOneId}
            secondaryFontTwoId={secondaryFontTwoId}
            onPrimaryChange={onPrimaryChange}
            onSecondaryOneChange={onSecondaryOneChange}
            onSecondaryTwoChange={onSecondaryTwoChange}
          />

          {fonts.length > 0 && (
            <Button
              type="button"
              className="mt-12 w-full p-5"
              disabled={!primaryFontId}
              onClick={onProceed}
            >
              Proceed
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function ConfirmProjectView({
  projectName,
  onProjectNameChange,
  previewState,
  canCreateProject,
  isCreatingProject,
  onBack,
  onCreateProject,
}: {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  previewState: FontUploadPreviewState;
  canCreateProject: boolean;
  isCreatingProject: boolean;
  onBack: () => void;
  onCreateProject: () => void;
}) {
  return (
    <section className="check-card flex min-h-dvh w-full items-start justify-center overflow-y-auto p-4 py-6 sm:p-6 md:items-center md:p-8">
      <div className="w-full max-w-3xl space-y-8 sm:space-y-12">
        <div>
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back
          </Button>

          <label
            htmlFor="project-name"
            className="mb-2 mt-8 block font-mono text-xs font-semibold uppercase text-muted-foreground"
          >
            Project Name
          </label>
          <Input
            id="project-name"
            value={projectName}
            onChange={(event) => onProjectNameChange(event.target.value)}
            placeholder="Untitled Project"
            className="bg-surface-paper text-lg"
          />
        </div>

        <FontPreviewCard state={previewState} />

        <Button
          type="button"
          className="w-full p-5"
          disabled={!canCreateProject || isCreatingProject}
          onClick={onCreateProject}
        >
          {isCreatingProject ? "Creating Project" : "Create Project"}
        </Button>
      </div>
    </section>
  );
}

function GoogleFontsTab({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="mt-6">
      <Button
        type="button"
        variant="accent"
        size="lg"
        onClick={onBrowse}
        className="w-full justify-between gap-4 rounded-xl px-4 py-4 text-left"
      >
        <span className="inline-flex min-w-0 items-center gap-4 text-muted-foreground">
          {/* <Search strokeWidth={1.5} className="size-6 shrink-0" /> */}
          <span className="min-w-0">
            <span className="block truncate text-base uppercase tracking-normal">
              Browse Google Fonts
            </span>
          </span>
        </span>
        <Kbd className="border text-base font-medium text-muted-foreground">
          <span>&#8984;</span>
          <span>+</span>
          <span>S</span>
        </Kbd>
      </Button>
      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
        <Info className="size-4" />
        <p>You can upload up to 3 font families at a time.</p>
      </div>
    </div>
  );
}

function FontPreviewCard({ state }: { state: FontUploadPreviewState }) {
  const previewFonts = getPreviewFonts(state);

  return (
    <Card variant="frosted" className="w-full max-w-3xl gap-0 border">
      <SolidCardHead title="Kerning Preview" className="bg-accent" />

      <div className="p-4 sm:p-6">
        {previewFonts.length ? (
          <div className="divide-y divide-border">
            {previewFonts.map((slot) => (
              <FontSpecimenRow key={slot.label} {...slot} />
            ))}
          </div>
        ) : (
          <SupportedFontFormats />
        )}
      </div>
    </Card>
  );
}

function FontSpecimenRow({
  label,
  font,
}: {
  label: string;
  font: FontFamilyMeta;
}) {
  return (
    <div className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[170px_1fr]">
      <div>
        <div className="mono-label text-muted-foreground">{font.name}</div>
        <div
          className="mt-4 text-4xl font-semibold leading-none tracking-normal text-foreground sm:text-6xl"
          style={{ fontFamily: font.cssFamily }}
        >
          Aa
        </div>
      </div>

      <div
        className="self-end -mt-1 text-foreground"
        style={{ fontFamily: font.cssFamily }}
      >
        <p className="mb-2 font-mono">{label}</p>
        <p className="max-w-md text-lg font-semibold leading-tight tracking-normal sm:text-2xl">
          The quick brown fox jumps over the lazy dog
        </p>
        <p className="mt-3 text-base tracking-normal sm:text-lg">0123456789</p>
        <p className="mt-1 text-base tracking-normal sm:text-lg">
          !@#$%^&*()_+-=[]{"{}"};:,.&lt;&gt;?/
        </p>
      </div>
    </div>
  );
}

function SupportedFontFormats() {
  const formats = [
    {
      name: "TTF",
      description: "TrueType Font",
      detail: "Reliable desktop font files with wide browser support.",
    },
    {
      name: "OTF",
      description: "OpenType Font",
      detail: "OpenType outlines, alternates, and rich typographic features.",
    },
    {
      name: "WOFF",
      description: "Web Open Font Format",
      detail: "Compressed web fonts made for fast loading in browsers.",
    },
    {
      name: "WOFF2",
      description: "Web Open Font Format 2.0",
      detail: "Modern, smaller web font files with excellent compression.",
    },
  ];

  return (
    <div>
      <div className="max-w-xl">
        <div className="mono-label text-muted-foreground">
          Supported formats
        </div>
        <h2 className="mt-3 text-xl font-semibold tracking-normal text-foreground sm:text-2xl">
          Upload a font to generate a live specimen preview.
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Static families and variable fonts are supported. Kerning reads each
          file, groups matching faces, and keeps the preview local to this
          browser.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {formats.map((format) => (
          <div
            key={format.name}
            className="flex gap-4 rounded-lg border border-border bg-surface-paper/70 p-4"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-semibold text-primary">
              Ff
            </div>
            <div className="min-w-0">
              <div className="font-mono flex items-center text-sm font-semibold uppercase text-foreground">
                {format.name}:{" "}
                <span className="capitalize ml-2">{format.description}</span>
              </div>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {format.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function buildProjectFontInputs({
  projectId,
  fonts,
  primaryFontId,
  secondaryFontOneId,
  secondaryFontTwoId,
}: {
  projectId: string;
  fonts: FontFamilyMeta[];
  primaryFontId?: string;
  secondaryFontOneId?: string;
  secondaryFontTwoId?: string;
}) {
  const rolesByFontId = new Map<string, ProjectFontInput["role"]>([
    ...(primaryFontId ? [[primaryFontId, "primary"] as const] : []),
    ...(secondaryFontOneId
      ? [[secondaryFontOneId, "secondary-one"] as const]
      : []),
    ...(secondaryFontTwoId
      ? [[secondaryFontTwoId, "secondary-two"] as const]
      : []),
  ]);

  return Promise.all(
    fonts.map(async (font, index): Promise<ProjectFontInput> => {
      if (font.source === "google") {
        return {
          id: font.id,
          source: "google",
          family: font.name,
          cssFamily: font.cssFamily,
          role: rolesByFontId.get(font.id) ?? "supporting",
          order: index,
          category: font.category,
          variants: font.variants ?? [],
          subsets: font.subsets,
          axes: font.axes,
          version: font.version,
          lastModified: font.lastModified,
          faces: [],
          createdAt: font.createdAt,
        };
      }

      const storedFont = await getFontFamily(font.id);

      if (!storedFont) {
        throw new Error(`Missing local font data for ${font.name}`);
      }

      const faces = await Promise.all(
        storedFont.faces.map(async (face) => {
          const key = createProjectFontFileKey({
            projectId,
            fontId: storedFont.id,
            faceId: face.id,
            fileName: face.fileName,
          });
          const { url } = await getFileUploadUrl(key);

          await uploadBlobToSignedUrl({
            url,
            blob: face.blob,
            mimeType: getFontMimeType(face.format),
          });

          const { file } = await createFileMetadata({
            key,
            mimeType: getFontMimeType(face.format),
            parentId: projectId,
            parentType: "PROJECT",
            isThumbnail: false,
            order: index,
          });

          return {
            id: face.id,
            fileId: file.id,
            fileKey: file.key,
            fileUrl: file.url,
            fileName: face.fileName,
            size: face.size,
            sizeLabel: face.sizeLabel,
            format: face.format,
            kind: face.kind,
            weight: face.weight,
            weightRange: face.weightRange,
            axes: face.axes,
            style: face.style,
            createdAt: face.createdAt,
          };
        }),
      );

      return {
        id: storedFont.id,
        source: "upload",
        family: storedFont.name,
        cssFamily: storedFont.cssFamily,
        role: rolesByFontId.get(font.id) ?? "supporting",
        order: index,
        variants: storedFont.variants ?? [],
        axes: storedFont.axes,
        faces,
        createdAt: storedFont.createdAt,
      };
    }),
  );
}

function createProjectFontFileKey({
  projectId,
  fontId,
  faceId,
  fileName,
}: {
  projectId: string;
  fontId: string;
  faceId: string;
  fileName: string;
}) {
  return `projects/${projectId}/fonts/${sanitizePathSegment(
    fontId,
  )}/${sanitizePathSegment(faceId)}-${sanitizePathSegment(fileName)}`;
}

function sanitizePathSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function getFontMimeType(format: FontFamilyMeta["faces"][number]["format"]) {
  const mimeTypes = {
    ttf: "font/ttf",
    otf: "font/otf",
    woff: "font/woff",
    woff2: "font/woff2",
  } as const;

  return mimeTypes[format];
}

async function uploadBlobToSignedUrl({
  url,
  blob,
  mimeType,
}: {
  url: string;
  blob: Blob;
  mimeType: string;
}) {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
    },
    body: blob,
  });

  if (!response.ok) {
    throw new Error(`Unable to upload font file (${response.status})`);
  }
}

function getPreviewFonts(state: FontUploadPreviewState) {
  const slots = [
    {
      label: "Primary Font",
      fontId: state.primaryFontId,
    },
    {
      label: "Secondary Font 1",
      fontId: state.secondaryFontOneId,
    },
    {
      label: "Secondary Font 2",
      fontId: state.secondaryFontTwoId,
    },
  ];

  return slots.flatMap((slot) => {
    const font = state.fonts.find((item) => item.id === slot.fontId);
    return font ? [{ label: slot.label, font }] : [];
  });
}
