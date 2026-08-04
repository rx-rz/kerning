import { Check } from "lucide-react";
import { Button } from "#/components/ui/button";
import type { ProjectFontRole } from "#/features/editor/font-system/font-system.types";
import { useEditorStore } from "#/features/editor/store/editor-store";

const LABELS: Record<ProjectFontRole, string> = {
	primary: "Display",
	"secondary-one": "Text",
	"secondary-two": "Accent",
};

const VISIBLE_ROLES = ["primary", "secondary-one", "secondary-two"] as const;

export function FontSystemPanel({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const fontSystem = useEditorStore((state) => state.fontSystem);
	const fonts = useEditorStore((state) => state.projectFonts);
	const assign = useEditorStore((state) => state.assignFontToRole);

	return (
		<div className="fixed top-3 left-3 z-50 flex items-start gap-2">
			<Button
				type="button"
				aria-label="Open font manager"
				aria-expanded={open}
				variant={open ? "default" : "outline"}
				className="h-10 rounded-xl border-white/60 bg-surface-glass px-3 shadow-xl backdrop-blur-3xl"
				onClick={() => onOpenChange(!open)}
			>
				Fonts
			</Button>

			{open ? (
				<section
					aria-labelledby="font-system-title"
					className="absolute top-12 left-0 w-80 overflow-hidden rounded-2xl border border-white/60 bg-surface-glass p-2 shadow-[0_8px_24px_rgba(15,23,42,.14)] backdrop-blur-3xl"
				>
					<div className="space-y-1">
						{VISIBLE_ROLES.map((role) => {
							const config = fontSystem.roles[role];
							const font = fonts.find(({ dbId }) => dbId === config?.fontId);
							return (
								<div
									key={role}
									className="rounded-lg border border-hairline bg-background/45 p-2.5"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<div className="flex items-center gap-2 text-xs font-semibold">
												<span>{LABELS[role]}</span>
											</div>
											<p className="truncate text-sm">
												{font?.family ?? "No font assigned"}
											</p>
										</div>
									</div>
									<div className="mt-2 flex flex-wrap gap-1">
										{fonts.map((item) => (
											<button
												key={item.dbId}
												type="button"
												aria-pressed={config?.fontId === item.dbId}
												className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-accent/10 hover:text-accent aria-pressed:border aria-pressed:border-accent aria-pressed:bg-accent/10 aria-pressed:text-accent"
												onClick={() => assign(role, item.dbId)}
											>
												{config?.fontId === item.dbId ? (
													<Check className="size-3" />
												) : null}
												{item.family}
											</button>
										))}
									</div>
								</div>
							);
						})}
					</div>
				</section>
			) : null}
		</div>
	);
}
