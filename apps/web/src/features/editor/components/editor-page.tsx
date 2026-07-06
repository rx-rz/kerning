import type { ProjectFontEntity } from "@kerning/shared";
import { PanelRightOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProjectApi } from "#/api/projects/detail";
import { useUpdateProjectApi } from "#/api/projects/update";
import { Button } from "#/components/ui/button";
import { EditorCanvas } from "#/features/editor/components/editor-canvas";
import { EditorInspector } from "#/features/editor/components/editor-inspector";
import { GlyphViewer } from "#/features/editor/components/glyph-viewer";
import { TemplateSidebar } from "#/features/editor/components/template-sidebar";
import { useEditorStore } from "#/features/editor/store/editor-store";
import { loadGoogleFontStylesheet } from "#/lib/fonts";

export function EditorPage() {
	return <EditorWorkspace />;
}

export function ProjectEditorPage({ projectId }: { projectId: string }) {
	const { data } = useProjectApi(projectId);
	const updateProject = useUpdateProjectApi(projectId);
	const projectFonts = data?.project.fonts;

	useEffect(() => {
		for (const font of projectFonts ?? []) {
			if (font.source === "google") {
				loadGoogleFontStylesheet({
					family: font.family,
					variants: font.variants,
					axes: font.axes,
				});
				continue;
			}
			for (const face of font.faces) {
				if (!face.fileUrl) continue;
				const weight =
					face.kind === "variable" && face.weightRange
						? `${face.weightRange.min} ${face.weightRange.max}`
						: String(face.weight);
				const loadedFace = new FontFace(
					font.cssFamily ?? font.family,
					`url(${face.fileUrl})`,
					{ weight, style: face.style },
				);
				void loadedFace
					.load()
					.then((readyFace) => document.fonts.add(readyFace));
			}
		}
	}, [projectFonts]);

	const fontByRole = (role: "primary" | "secondary-one" | "secondary-two") =>
		projectFonts?.find((font) => font.role === role);
	const primary = fontByRole("primary");
	const secondaryOne = fontByRole("secondary-one");
	const secondaryTwo = fontByRole("secondary-two");

	return (
		<EditorWorkspace
			projectTitle={data?.project.name}
			onProjectTitleChange={(name) => updateProject.mutate({ name })}
			primary={primary}
			secondaryOne={secondaryOne}
			secondaryTwo={secondaryTwo}
		/>
	);
}

function EditorWorkspace({
	projectTitle,
	onProjectTitleChange,
	primary,
	secondaryOne,
	secondaryTwo,
}: {
	projectTitle?: string;
	onProjectTitleChange?: (title: string) => void;
	primary?: ProjectFontEntity;
	secondaryOne?: ProjectFontEntity;
	secondaryTwo?: ProjectFontEntity;
} = {}) {
	const [isInspectorOpen, setIsInspectorOpen] = useState(true);
	const [templateCardId, setTemplateCardId] = useState<string | null>(null);
	const [isGlyphViewerOpen, setIsGlyphViewerOpen] = useState(false);
	const glyphFonts = useMemo(
		() =>
			[
				primary
					? { font: primary, role: "primary" as const, roleLabel: "Primary" }
					: null,
				secondaryOne
					? {
							font: secondaryOne,
							role: "sec1" as const,
							roleLabel: "Secondary one",
						}
					: null,
				secondaryTwo
					? {
							font: secondaryTwo,
							role: "sec2" as const,
							roleLabel: "Secondary two",
						}
					: null,
			].filter((option) => option !== null),
		[primary, secondaryOne, secondaryTwo],
	);

	function fontStack(...fonts: Array<ProjectFontEntity | undefined>): string {
		const names = fonts.flatMap((font) => {
			const name = font?.cssFamily ?? font?.family;
			return name ? [JSON.stringify(name)] : [];
		});
		return [...new Set(names), "system-ui", "sans-serif"].join(", ");
	}

	useEffect(() => {
		useEditorStore.persist.rehydrate();
	}, []);

	return (
		<main
			className="h-dvh min-w-240 overflow-hidden bg-surface-wash text-foreground"
			style={
				{
					"--font-project-primary": fontStack(
						primary,
						secondaryOne,
						secondaryTwo,
					),
					"--font-project-sec1": fontStack(secondaryOne, primary, secondaryTwo),
					"--font-project-sec2": fontStack(secondaryTwo, secondaryOne, primary),
				} as React.CSSProperties
			}
		>
			<EditorCanvas
				projectTitle={projectTitle}
				onProjectTitleChange={onProjectTitleChange}
				onToggleInspector={() => setIsInspectorOpen((isOpen) => !isOpen)}
				onSelectNode={() => setIsInspectorOpen(true)}
				onOpenTemplates={setTemplateCardId}
				onOpenGlyphViewer={() => setIsGlyphViewerOpen(true)}
			/>
			{templateCardId ? (
				<TemplateSidebar
					cardId={templateCardId}
					onClose={() => setTemplateCardId(null)}
					availableFonts={{
						primary: Boolean(primary),
						sec1: Boolean(secondaryOne),
						sec2: Boolean(secondaryTwo),
					}}
				/>
			) : null}
			<GlyphViewer
				fonts={glyphFonts}
				open={isGlyphViewerOpen}
				onOpenChange={setIsGlyphViewerOpen}
			/>
			{isInspectorOpen ? (
				<EditorInspector onClose={() => setIsInspectorOpen(false)} />
			) : (
				<Button
					type="button"
					aria-label="Open inspector"
					variant="ghost"
					size="icon"
					className="fixed top-2.5 right-2.5 z-40 border border-white/60 bg-surface-glass shadow-hairline backdrop-blur-3xl"
					onClick={() => setIsInspectorOpen(true)}
				>
					<PanelRightOpen />
				</Button>
			)}
		</main>
	);
}
