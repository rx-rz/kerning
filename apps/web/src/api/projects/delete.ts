import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import { API_ROUTES } from "../api-routes";
import { queries } from "../queries";
import type { ProjectData } from "./types";

export function useDeleteProjectApi() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (projectId: string) =>
			api.jsend<ProjectData>(API_ROUTES.projects.detail(projectId), "DELETE"),
		onSuccess: async ({ project }) => {
			queryClient.removeQueries({
				queryKey: queries.projects.detail(project.id).queryKey,
			});
			await queryClient.invalidateQueries({
				queryKey: queries.projects.list.queryKey,
			});
		},
	});
}
