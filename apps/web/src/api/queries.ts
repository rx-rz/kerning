import {
	createQueryKeys,
	mergeQueryKeys,
} from "@lukemorales/query-key-factory";

export const projectKeys = createQueryKeys("projects", {
	list: null,
	detail: (projectId: string) => [projectId],
});

export const googleFontKeys = createQueryKeys("googleFonts", {
	list: (input: {
		q?: string;
		category?: string;
		limit?: number;
		enabled?: boolean;
	}) => [input],
});

export const queries = mergeQueryKeys(projectKeys, googleFontKeys);
