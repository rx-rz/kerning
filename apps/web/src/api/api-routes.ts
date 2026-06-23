export const API_ROUTES = {
  auth: {
    signup: "auth/sign-up/email",
    login: "auth/sign-in/email",
    me: "auth/get-session",
    logout: "auth/sign-out",
    oauth: {
      google: "auth/sign-in/social",
    },
    otp: {
      send: "auth/email-otp/send-verification-otp",
      verify: "auth/email-otp/verify-email",
    },
  },
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
