import { Info, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { Kbd } from "#/components/ui/kbd";
import type { FontFamilyMeta } from "#/db/font-db";
import { uploadFontFiles } from "#/lib/fonts";

type Props = {
	onUploaded: (fonts: FontFamilyMeta[]) => void;
	uploadedFontCount: number;
	maxFonts?: number;
};

export function FontUploadButton({
	onUploaded,
	uploadedFontCount,
	maxFonts = 3,
}: Props) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (
				!(event.metaKey || event.ctrlKey) ||
				event.key.toLowerCase() !== "u"
			) {
				return;
			}

			event.preventDefault();

			if (!isUploading && uploadedFontCount < maxFonts) {
				inputRef.current?.click();
			}
		}

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isUploading, maxFonts, uploadedFontCount]);

	async function handleFiles(files: FileList | null) {
		if (!files?.length) return;

		setIsUploading(true);

		try {
			const fonts = await uploadFontFiles(files, { maxFamilies: maxFonts });

			onUploaded(fonts);
			if (inputRef.current) inputRef.current.value = "";
		} finally {
			setIsUploading(false);
		}
	}

	const isFull = uploadedFontCount >= maxFonts;

	return (
		<>
			<div className="">
				<input
					ref={inputRef}
					type="file"
					multiple
					accept=".ttf,.otf,.woff,.woff2"
					className="hidden"
					onChange={(event) => handleFiles(event.target.files)}
				/>

				<Button
					type="button"
					variant="accent"
					size="lg"
					className="mt-6 w-full justify-between gap-4 rounded-xl  px-4 py-4 text-left"
					disabled={isUploading || isFull}
					onClick={() => inputRef.current?.click()}
				>
					<span className="inline-flex min-w-0 items-center gap-4 text-muted-foreground">
						<Upload strokeWidth={1.5} className="size-6 shrink-0" />
						<span className="min-w-0">
							<span className="block text-base truncate capitalize tracking-normal">
								{isUploading
									? "Uploading"
									: isFull
										? "Limit reached"
										: `Upload fonts`}
							</span>
							{/* <span className="mt-1 block truncate font-sans text-xs font-medium normal-case">
							TTF, OTF, WOFF, WOFF2 · static or variable
						</span> */}
						</span>
					</span>
					<Kbd className="text-muted-foreground text-base font-medium border items-center flex"><span>&#8984;</span><span>+</span> <span>U</span></Kbd>
				</Button>
				<div className="flex items-center mt-2 gap-2">
					<Info className="size-4" />
					<p className="">You can upload up to {maxFonts} font files at a time.</p>
				</div>
			</div>

		</>
	);
}
