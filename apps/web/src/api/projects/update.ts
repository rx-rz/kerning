import type { UpdateProjectInput } from "@kerning/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import { API_ROUTES } from "../api-routes";
import { queries } from "../queries";
import type { ProjectData } from "./types";

export function useUpdateProjectApi(projectId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateProjectInput) =>
			api.jsend<ProjectData>(API_ROUTES.projects.detail(projectId), "PATCH", {
				json: input,
			}),
		onSuccess: async ({ project }) => {
			queryClient.setQueryData(queries.projects.detail(project.id).queryKey, {
				project,
			} satisfies ProjectData);
			await queryClient.invalidateQueries({
				queryKey: queries.projects.list.queryKey,
			});
		},
	});
}
