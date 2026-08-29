export const API_ROUTES = {
  projects: {
    list: "projects",
    create: "projects",
    detail: (projectId: string) => `projects/${projectId}`,
  },
  files: {
    getUploadUrl: "files/get-upload-url",
    create: "files",
    downloadUrl: (fileId: string) => `files/${fileId}/download-url`,
    publicUrl: (fileId: string) => `files/${fileId}/public-url`,
    delete: "files/delete",
  },
  fonts: {
    google: "google-fonts",
  },
} as const;

export const apiRoutes = API_ROUTES;
