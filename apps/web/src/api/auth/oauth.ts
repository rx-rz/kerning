import { authClient } from "#/lib/auth";
import { useQuery } from "@tanstack/react-query";

import { queries } from "../queries";

type OAuthProvider = "google";

async function getOauthLink(provider: OAuthProvider) {
	const frontendOrigin = window.location.origin;
	const result = await authClient.signIn.social({
		provider,
		callbackURL: `${frontendOrigin}/`,
		newUserCallbackURL: `${frontendOrigin}/`,
		errorCallbackURL: `${frontendOrigin}/auth/login`,
		disableRedirect: true,
	});

	if (result.error) {
		throw new Error(result.error.message ?? "OAuth could not be started.");
	}

	const authUrl = result.data?.url;

	if (!authUrl) {
		throw new Error("OAuth provider did not return a redirect URL.");
	}

	return { authUrl };
}

export function useGetGoogleOauthLinkApi() {
	return useQuery({
		queryKey: queries.auth.oauth("google").queryKey,
		queryFn: () => getOauthLink("google"),
		enabled: false,
		retry: false,
	});
}
