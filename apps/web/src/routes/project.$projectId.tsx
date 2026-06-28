import { createFileRoute } from "@tanstack/react-router";

import { EditorPage } from "#/features/editor/components/editor-page";

export const Route = createFileRoute("/project/$projectId")({
	component: ProjectEditorRoute,
});

function ProjectEditorRoute() {
	const { projectId } = Route.useParams();

	return <EditorPage key={projectId} />;
}
