import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";
import { API_ROUTES } from "../api-routes";
import { queries } from "../queries";
import type { ProjectsData } from "./types";

export function useProjectsApi() {
	return useQuery({
		queryKey: queries.projects.list.queryKey,
		queryFn: () => api.jsend<ProjectsData>(API_ROUTES.projects.list, "GET"),
	});
}
