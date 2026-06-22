import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";
import { API_ROUTES } from "../api-routes";
import { queries } from "../queries";
import type { ProjectData } from "./types";

export function useProjectApi(projectId: string) {
	return useQuery({
		queryKey: queries.projects.detail(projectId).queryKey,
		queryFn: () =>
			api.jsend<ProjectData>(API_ROUTES.projects.detail(projectId), "GET"),
		enabled: projectId.length > 0,
	});
}
