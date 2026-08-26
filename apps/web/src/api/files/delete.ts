import { api } from "#/lib/api";
import { API_ROUTES } from "../api-routes";

export async function deleteRemoteFile(key: string) {
	const searchParams = new URLSearchParams({ key });

	await api.jsend(
		`${API_ROUTES.files.delete}?${searchParams.toString()}`,
		"DELETE",
	);
}
