import { api } from "#/lib/api";
import { API_ROUTES } from "../api-routes";

type UploadUrlData = {
  url: string;
};

export async function getFileUploadUrl(key: string) {
  const searchParams = new URLSearchParams({ key });

  return api.jsend<UploadUrlData>(
    `${API_ROUTES.files.getUploadUrl}?${searchParams.toString()}`,
    "GET",
  );
}
