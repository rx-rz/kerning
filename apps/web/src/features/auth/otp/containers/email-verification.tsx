import { useNavigate } from "@tanstack/react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Mail, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSendOTPApi, useVerifyOTPApi } from "#/api/auth/otp";
import { Button } from "#/components/ui/button";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "#/components/ui/input-otp";
import { PendingButtonContent } from "../../components/pending-button-content";

type EmailVerificationProps = {
	email: string;
};

const OTP_SLOTS = [0, 1, 2, 3, 4, 5] as const;

export function EmailVerification({ email }: EmailVerificationProps) {
	const navigate = useNavigate();
	const verifyOtp = useVerifyOTPApi();
	const sendOtp = useSendOTPApi();
	const [otp, setOtp] = useState("");
	const [cooldown, setCooldown] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const isVerifying = verifyOtp.isPending;
	const isSending = sendOtp.isPending;
	const isPending = isVerifying || isSending;

	useEffect(() => {
		if (cooldown === 0) {
			return;
		}

		const timeout = window.setTimeout(
			() => setCooldown((value) => value - 1),
			1000,
		);
		return () => window.clearTimeout(timeout);
	}, [cooldown]);

	const canVerify = useMemo(
		() => otp.length === 6 && !isPending,
		[isPending, otp],
	);

	const handleVerify = async () => {
		setError(null);

		try {
			await verifyOtp.mutateAsync({ email, otp });
			await navigate({ to: "/" });
		} catch (caughtError) {
			setError(
				caughtError instanceof Error
					? caughtError.message
					: "Verification failed.",
			);
		}
	};

	const handleResend = async () => {
		setError(null);

		try {
			await sendOtp.mutateAsync({ email });
			setCooldown(30);
		} catch (caughtError) {
			setError(
				caughtError instanceof Error
					? caughtError.message
					: "Could not send a new code.",
			);
		}
	};

	return (
		<div className="space-y-5">
			<div className="space-y-1">
      <h1 className='text-2xl font-bold '>Verify Email</h1>
				<p className="text-xs leading-relaxed mb-12 text-muted-foreground">
					Enter the six-digit code sent to {email}.
				</p>
			</div>
			{error ? <p className="text-sm text-destructive font-bold">{error}</p> : null}
			<InputOTP
				maxLength={6}
				pattern={REGEXP_ONLY_DIGITS}
        className="w-full  h-14"
				value={otp}
				onChange={setOtp}
			>
				<InputOTPGroup className="w-full  mb-12">
					{OTP_SLOTS.map((slot) => (
						<InputOTPSlot key={`otp-slot-${slot}`} index={slot} className="text-lg w-full flex-1 h-14" />
					))}
				</InputOTPGroup>
			</InputOTP>



			<div className="flex flex-col gap-4">
				<Button disabled={!canVerify} className="p-6" onClick={handleVerify}>
					<PendingButtonContent
						icon={ShieldCheck}
						idleText="Verify email"
						isPending={isVerifying}
						pendingText="Verifying email"
					/>
				</Button>
				<Button
					type="button"
					variant="outline"
					className="p-6 tabular-nums"
					onClick={handleResend}
					disabled={cooldown > 0 || isPending}
					title={cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
				>
					<PendingButtonContent
						icon={Mail}
						idleText={cooldown > 0 ? `${cooldown}s` : "Resend code"}
						isPending={isSending}
						pendingText="Sending code"
					/>
				</Button>
			</div>
		</div>
	);
}
