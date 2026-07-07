import { cn } from "#/lib/utils";

export function InspectorSection({
	title,
	children,
	className,
}: {
	title: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<section
			className={cn(
				"rounded-xl border border-hairline bg-surface-wash",
				className,
			)}
		>
			<h3 className="flex items-center px-3 py-2.5 text-xs font-semibold">
				{title}
			</h3>
			<div className="space-y-3 px-3 pb-3">{children}</div>
		</section>
	);
}
