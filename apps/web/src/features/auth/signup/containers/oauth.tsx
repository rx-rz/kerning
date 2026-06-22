import { useState } from "react";
import { useGetGoogleOauthLinkApi } from "#/api/auth/oauth";
import { Button } from "#/components/ui/button";
import { PendingButtonContent } from "../../components/pending-button-content";

export function OauthContainer() {
	const google = useGetGoogleOauthLinkApi();
	const [error, setError] = useState<string | null>(null);

	const handleGoogle = async () => {
		setError(null);

		try {
			const result = await google.refetch();
			if (result.error) {
				throw result.error;
			}

			if (result.data?.authUrl) {
				window.location.assign(result.data.authUrl);
			}
		} catch (caughtError) {
			setError(
				caughtError instanceof Error
					? caughtError.message
					: "Google sign in failed.",
			);
		}
	};

	return (
		<div className="space-y-3">
			<Button
				type="button"
				variant="secondary"
				className="w-full p-6"
				onClick={handleGoogle}
				disabled={google.isFetching}
			>
				<PendingButtonContent
					idleIcon={<img src="/google.svg" alt="" className="size-4" />}
					idleText="Continue with Google"
					isPending={google.isFetching}
					pendingText="Connecting to Google"
				/>
			</Button>
			{error ? <p className="text-sm text-destructive ">{error}</p> : null}
		</div>
	);
}
