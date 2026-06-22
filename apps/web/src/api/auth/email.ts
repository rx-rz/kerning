import { authClient } from "#/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queries } from "../queries";

type AuthResult = Awaited<ReturnType<typeof authClient.signIn.email>>;

function assertAuthSuccess(result: AuthResult) {
	if (result.error) {
		throw new Error(result.error.message ?? "Authentication failed.");
	}

	return result;
}

export function useLoginWithEmailApi() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: { email: string; password: string }) =>
			assertAuthSuccess(
				await authClient.signIn.email({
					...input,
					callbackURL: "/",
				}),
			),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queries.auth.me.queryKey,
			});
		},
	});
}

export function useSignupWithEmailApi() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: {
			name: string;
			email: string;
			password: string;
		}) =>
			assertAuthSuccess(
				await authClient.signUp.email({
					...input,
					callbackURL: "/",
				}),
			),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queries.auth.me.queryKey,
			});
		},
	});
}
