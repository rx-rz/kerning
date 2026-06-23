import type { CreateFileInput, FileEntity } from "@kerning/shared";

import { api } from "#/lib/api";
import { API_ROUTES } from "../api-routes";

type FileData = {
  file: FileEntity;
};

export async function createFileMetadata(input: CreateFileInput) {
  return api.jsend<FileData>(API_ROUTES.files.create, "POST", {
    json: input,
  });
}
