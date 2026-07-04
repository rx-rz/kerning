import { PanelRightOpen } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProjectFontEntity } from "@kerning/shared";
import { useProjectApi } from "#/api/projects/detail";
import { loadGoogleFontStylesheet } from "#/lib/fonts";

import { Button } from "#/components/ui/button";
import { EditorCanvas } from "#/features/editor/components/editor-canvas";
import { EditorInspector } from "#/features/editor/components/editor-inspector";
import { TemplateSidebar } from "#/features/editor/components/template-sidebar";
import { useEditorStore } from "#/features/editor/store/editor-store";

export function EditorPage() {
	return <EditorWorkspace />;
}

export function ProjectEditorPage({ projectId }: { projectId: string }) {
	const { data } = useProjectApi(projectId);
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
			primary={primary}
			secondaryOne={secondaryOne}
			secondaryTwo={secondaryTwo}
		/>
	);
}

function EditorWorkspace({
	primary,
	secondaryOne,
	secondaryTwo,
}: {
	primary?: ProjectFontEntity;
	secondaryOne?: ProjectFontEntity;
	secondaryTwo?: ProjectFontEntity;
} = {}) {
	const [isInspectorOpen, setIsInspectorOpen] = useState(true);
	const [templateCardId, setTemplateCardId] = useState<string | null>(null);

	useEffect(() => {
		useEditorStore.persist.rehydrate();
	}, []);

	return (
		<main
			className="h-dvh min-w-240 overflow-hidden bg-surface-wash text-foreground"
			style={
				{
					"--font-project-primary":
						primary?.cssFamily ?? primary?.family ?? "inherit",
					"--font-project-sec1":
						secondaryOne?.cssFamily ??
						secondaryOne?.family ??
						primary?.cssFamily ??
						primary?.family ??
						"inherit",
					"--font-project-sec2":
						secondaryTwo?.cssFamily ??
						secondaryTwo?.family ??
						primary?.cssFamily ??
						primary?.family ??
						"inherit",
				} as React.CSSProperties
			}
		>
			<EditorCanvas
				onToggleInspector={() => setIsInspectorOpen((isOpen) => !isOpen)}
				onOpenTemplates={setTemplateCardId}
			/>
			{templateCardId ? (
				<TemplateSidebar
					cardId={templateCardId}
					onClose={() => setTemplateCardId(null)}
				/>
			) : null}
			{isInspectorOpen ? (
				<EditorInspector onClose={() => setIsInspectorOpen(false)} />
			) : (
				<Button
					type="button"
					aria-label="Open inspector"
					variant="ghost"
					size="icon"
					className="fixed top-2.5 right-2.5 z-40 border border-hairline bg-white/90 shadow-hairline backdrop-blur-3xl"
					onClick={() => setIsInspectorOpen(true)}
				>
					<PanelRightOpen />
				</Button>
			)}
		</main>
	);
}
