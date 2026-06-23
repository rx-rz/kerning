import type {
	GoogleFontCategory,
	GoogleFontsData,
} from "@kerning/shared";
import { useQuery } from "@tanstack/react-query";

import { api } from "#/lib/api";
import { API_ROUTES } from "../api-routes";
import { queries } from "../queries";

type GoogleFontsQuery = {
	q?: string;
	category?: GoogleFontCategory;
	limit?: number;
	enabled?: boolean;
};

export function useGoogleFontsApi(input: GoogleFontsQuery) {
	return useQuery({
		queryKey: queries.googleFonts.list(input).queryKey,
		queryFn: () =>
			api.jsend<GoogleFontsData>(API_ROUTES.fonts.google, "GET", {
				searchParams: toSearchParams(input),
			}),
		enabled: input.enabled ?? true,
		staleTime: 1000 * 60 * 60,
	});
}

function toSearchParams(input: GoogleFontsQuery) {
	const params = new URLSearchParams();

	params.set("q", input.q ?? "");
	if (input.category) params.set("category", input.category);
	if (input.limit) params.set("limit", String(input.limit));

	return params;
}
