import {
	createQueryKeys,
	mergeQueryKeys,
} from "@lukemorales/query-key-factory";

export const authKeys = createQueryKeys("auth", {
	me: null,
	oauth: (provider: "google") => [provider],
});

export const projectKeys = createQueryKeys("projects", {
	list: null,
	detail: (projectId: string) => [projectId],
});

export const queries = mergeQueryKeys(authKeys, projectKeys);
