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
} as const;



export const apiRoutes = API_ROUTES;
