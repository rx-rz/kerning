import { cn } from "#/lib/utils";

export function InspectorSection({
	title,
	children,
	className,
}: {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
	className?: string;
}) {
	return (
		<details
			className={cn(
				"group rounded-xl border border-hairline bg-surface-wash",
				className,
			)}
			open
		>
			<summary className="flex min-h-12 cursor-pointer list-none items-center px-4 text-xs font-semibold">
				{title}
			</summary>
			<div className="space-y-3 border-t border-hairline p-3">{children}</div>
		</details>
	);
}
