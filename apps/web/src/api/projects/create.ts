import type { CreateProjectInput } from "@kerning/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import { API_ROUTES } from "../api-routes";
import { queries } from "../queries";
import type { ProjectData } from "./types";

export function useCreateProjectApi() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateProjectInput) =>
			api.jsend<ProjectData>(API_ROUTES.projects.create, "POST", {
				json: input,
			}),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queries.projects.list.queryKey,
			});
		},
	});
}
