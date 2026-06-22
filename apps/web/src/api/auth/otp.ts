import { authClient } from "#/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queries } from "../queries";

function assertOtpSuccess<T extends { error?: { message?: string } | null }>(
	result: T,
) {
	if (result.error) {
		throw new Error(result.error.message ?? "Verification failed.");
	}

	return result;
}

export function useSendOTPApi() {
	return useMutation({
		mutationFn: async (input: { email: string }) =>
			assertOtpSuccess(
				await authClient.emailOtp.sendVerificationOtp({
					email: input.email,
					type: "email-verification",
				}),
			),
	});
}

export function useVerifyOTPApi() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: { email: string; otp: string }) =>
			assertOtpSuccess(
				await authClient.emailOtp.verifyEmail({
					email: input.email,
					otp: input.otp,
				}),
			),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queries.auth.me.queryKey,
			});
		},
	});
}
