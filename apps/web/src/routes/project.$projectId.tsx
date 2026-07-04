import { createFileRoute } from "@tanstack/react-router";

import { ProjectEditorPage } from "#/features/editor/components/editor-page";

export const Route = createFileRoute("/project/$projectId")({
	component: ProjectEditorRoute,
});

function ProjectEditorRoute() {
	const { projectId } = Route.useParams();

	return <ProjectEditorPage key={projectId} projectId={projectId} />;
}
