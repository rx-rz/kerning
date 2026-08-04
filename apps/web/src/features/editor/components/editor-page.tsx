import type { ProjectFontEntity } from "@kerning/shared";
import { PanelRightOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProjectApi } from "#/api/projects/detail";
import { useUpdateProjectApi } from "#/api/projects/update";
import { Button } from "#/components/ui/button";
import { EditorCanvas } from "#/features/editor/components/editor-canvas";
import { EditorInspector } from "#/features/editor/components/editor-inspector";
import { FontSystemPanel } from "#/features/editor/components/font-system-panel";
import { TemplateSidebar } from "#/features/editor/components/template-sidebar";
import {
	TypeLens,
	type TypeLensStudy,
} from "#/features/editor/components/type-lens";
import { useFontLabContextStore } from "#/features/editor/font-lab-bridge/font-lab-context.store";
import type { FontFeatureSettings } from "#/features/editor/font-system/font-system.types";
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
			projectUpdatedAt={data?.project.updatedAt}
			onProjectTitleChange={(name) => updateProject.mutate({ name })}
			primary={primary}
			secondaryOne={secondaryOne}
			secondaryTwo={secondaryTwo}
			projectFonts={projectFonts}
		/>
	);
}

function EditorWorkspace({
	projectTitle,
	projectUpdatedAt,
	onProjectTitleChange,
	primary,
	secondaryOne,
	secondaryTwo,
	projectFonts,
}: {
	projectTitle?: string;
	projectUpdatedAt?: string;
	onProjectTitleChange?: (title: string) => void;
	primary?: ProjectFontEntity;
	secondaryOne?: ProjectFontEntity;
	secondaryTwo?: ProjectFontEntity;
	projectFonts?: ProjectFontEntity[];
} = {}) {
	const [isInspectorOpen, setIsInspectorOpen] = useState(true);
	const [templateCardId, setTemplateCardId] = useState<string | null>(null);
	const [fontManagerOpen, setFontManagerOpen] = useState(false);
	const fontLabContext = useFontLabContextStore((state) => state.context);
	const closeFontLab = useFontLabContextStore((state) => state.close);
	const canvasFonts = useMemo(
		() =>
			projectFonts ??
			[primary, secondaryOne, secondaryTwo].filter(
				(font): font is ProjectFontEntity => Boolean(font),
			),
		[primary, secondaryOne, secondaryTwo, projectFonts],
	);

	function closeOrReturn() {
		const target = fontLabContext?.returnTarget;
		closeFontLab();
		if (!target?.cardId) return;
		const state = useEditorStore.getState();
		const card = state.cards.find(({ id }) => id === target.cardId);
		if (!card) return;
		if (target.nodeId && card.nodes.some(({ id }) => id === target.nodeId))
			state.selectNode(card.id, target.nodeId);
		else state.selectCard(card.id);
		window.setTimeout(
			() =>
				document
					.querySelector(`[data-card-id="${card.id}"]`)
					?.scrollIntoView({ behavior: "smooth", block: "center" }),
			0,
		);
	}

	function pinTypeStudy(study: TypeLensStudy) {
		const state = useEditorStore.getState();
		const cardId = fontLabContext?.returnTarget?.cardId;
		if (!cardId) return;
		const nodeId = state.placeTypeStudy(cardId, study);
		if (!nodeId) return;
		closeFontLab();
		window.setTimeout(
			() =>
				document
					.querySelector(`[data-card-id="${cardId}"]`)
					?.scrollIntoView({ behavior: "smooth", block: "center" }),
			0,
		);
	}

	function applyTypeLensFeatures(settings: FontFeatureSettings) {
		const target = fontLabContext?.returnTarget;
		if (!target?.cardId || !target.nodeId) return;
		useEditorStore.getState().updateNode(target.cardId, target.nodeId, {
			featureSettings: settings,
		});
	}

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

	useEffect(() => {
		const url = new URL(window.location.href);
		if (fontLabContext) url.searchParams.set("view", "type-lens");
		else {
			url.searchParams.set("view", "canvas");
			url.searchParams.delete("typeLensMode");
		}
		window.history.replaceState(window.history.state, "", url);
	}, [fontLabContext]);

	useEffect(
		() => () => {
			useFontLabContextStore.getState().close();
		},
		[],
	);

	useEffect(() => {
		useEditorStore
			.getState()
			.setProjectFonts(
				projectFonts ??
					[primary, secondaryOne, secondaryTwo].filter(
						(font): font is ProjectFontEntity => Boolean(font),
					),
			);
	}, [primary, secondaryOne, secondaryTwo, projectFonts]);

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
			{fontLabContext ? (
				<TypeLens
					fonts={canvasFonts}
					launchContext={fontLabContext}
					onClose={closeOrReturn}
					onPinToCanvas={pinTypeStudy}
					onFeatureSettingsChange={applyTypeLensFeatures}
				/>
			) : (
				<EditorCanvas
					projectTitle={projectTitle}
					projectUpdatedAt={projectUpdatedAt}
					onProjectTitleChange={onProjectTitleChange}
					onToggleInspector={() => setIsInspectorOpen((isOpen) => !isOpen)}
					onSelectNode={() => setIsInspectorOpen(true)}
					onOpenTemplates={setTemplateCardId}
				/>
			)}
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
			{!fontLabContext && isInspectorOpen ? (
				<EditorInspector
					onClose={() => setIsInspectorOpen(false)}
					fonts={{
						primary,
						sec1: secondaryOne,
						sec2: secondaryTwo,
					}}
				/>
			) : !fontLabContext ? (
				<Button
					type="button"
					aria-label="Open inspector"
					variant="ghost"
					size="icon"
					className="fixed top-2.5 right-2.5 shadow-xl z-40 border border-white/60 bg-surface-glass shadow-hairline backdrop-blur-3xl"
					onClick={() => setIsInspectorOpen(true)}
				>
					<PanelRightOpen />
				</Button>
			) : null}
			{!fontLabContext ? (
				<FontSystemPanel
					open={fontManagerOpen}
					onOpenChange={setFontManagerOpen}
				/>
			) : null}
		</main>
	);
}
