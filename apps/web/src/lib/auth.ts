import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

import { publicEnv } from "./env";

export const authClient = createAuthClient({
	baseURL: publicEnv.authUrl,
	plugins: [emailOTPClient()],
});
