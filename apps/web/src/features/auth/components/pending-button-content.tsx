import { LoaderCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { TextMorph } from "torph/react";
import { cn } from "#/lib/utils";

type PendingButtonContentProps = {
	isPending: boolean;
	idleText: string;
	pendingText: string;
	icon?: LucideIcon;
	idleIcon?: ReactNode;
};

export function PendingButtonContent({
	isPending,
	idleText,
	pendingText,
	icon: Icon,
	idleIcon,
}: PendingButtonContentProps) {
	const LeadingIcon = isPending ? LoaderCircle : Icon;

	return (
		<>
			{LeadingIcon ? (
				<LeadingIcon
					aria-hidden="true"
					className={cn(isPending && "animate-spin")}
				/>
			) : (
				idleIcon
			)}
			<TextMorph
				as="span"
				className="inline-block"
				duration={260}
				ease="cubic-bezier(0.16, 1, 0.3, 1)"
			>
				{isPending ? pendingText : idleText}
			</TextMorph>
		</>
	);
}
