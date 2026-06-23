import { MoreVertical, Trash2 } from "lucide-react";
import { Card } from "#/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { FontFamilyMeta } from "#/db/font-db";
import { formatBytes } from "#/lib/fonts";

type Props = {
	fonts: FontFamilyMeta[];
	onDeleteFont: (fontId: string) => void;
};

export function UploadedFonts({ fonts, onDeleteFont }: Props) {
	if (!fonts.length) return null;

	return (
		<section className="space-y-3">
			<div className="flex items-center gap-3 font-mono text-lg font-semibold uppercase  text-muted-foreground">
				<span>Uploaded Fonts</span>
				<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tracking-normal">
					{fonts.length}
				</span>
			</div>

			<Card className="gap-0 border mt-3" variant="hairline">
				{fonts.map((font) => {
					const firstFace = font.faces[0];
					const totalSize = font.faces.reduce(
						(total, face) => total + face.size,
						0,
					);
					const faceSummary = formatFaceSummary(font);

					return (
						<div
							key={font.id}
							className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0"
						>
							<div
								className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-accent text-lg font-semibold"
								style={{ fontFamily: font.cssFamily }}
							>
								Aa
							</div>

							<div className="min-w-0 flex-1">
								<h3
									className="truncate font-semibold tracking-tight"
									style={{ fontFamily: font.cssFamily }}
								>
									{font.name}
								</h3>

								<p className="truncate text-xs text-muted-foreground">
									{firstFace
										? `${formatBytes(totalSize)} · ${faceSummary}`
										: null}
								</p>
							</div>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button
										type="button"
										className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
										aria-label={`Actions for ${font.name}`}
									>
										<MoreVertical className="size-4" />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem
										variant="destructive"
										onSelect={() => onDeleteFont(font.id)}
									>
										<Trash2 />
										Delete font
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				})}
			</Card>
		</section>
	);
}

function formatFaceSummary(font: FontFamilyMeta) {
	const faces = font.faces.map((face) => {
		if (face.kind === "variable" && face.weightRange) {
			return `${face.weightRange.min}-${face.weightRange.max} ${face.style}`;
		}

		return `${face.weight} ${face.style}`;
	});

	return [...new Set(faces)].join(", ");
}
