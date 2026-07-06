import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import type { FontFamilyMeta } from "#/db/font-db";

type FontSlot = {
	id: string;
	label: string;
	placeholder: string;
	value?: string;
	onChange: (fontId: string) => void;
	number: number;
};

type Props = {
	fonts: FontFamilyMeta[];

	primaryFontId?: string;
	secondaryFontOneId?: string;
	secondaryFontTwoId?: string;

	onPrimaryChange: (fontId: string) => void;
	onSecondaryOneChange: (fontId: string) => void;
	onSecondaryTwoChange: (fontId: string) => void;
};

export function FontSelectSection({
	fonts,
	primaryFontId,
	secondaryFontOneId,
	secondaryFontTwoId,
	onPrimaryChange,
	onSecondaryOneChange,
	onSecondaryTwoChange,
}: Props) {
	const slots: FontSlot[] = [
		{
			id: "primary-font",
			label: "Primary Font",
			placeholder: "Select primary font",
			value: primaryFontId,
			onChange: onPrimaryChange,
			number: 1,
		},
		{
			id: "secondary-font-one",
			label: "Secondary Font 1 (Optional)",
			placeholder: "Select secondary font (optional)",
			value: secondaryFontOneId,
			onChange: onSecondaryOneChange,
			number: 2,
		},
		{
			id: "secondary-font-two",
			label: "Secondary Font 2 (Optional)",
			placeholder: "Select secondary font (optional)",
			value: secondaryFontTwoId,
			onChange: onSecondaryTwoChange,
			number: 3,
		},
	];

	if (fonts.length === 0) {
		return null;
	}

	return (
		<section className="space-y-3 ">
			<div className="font-sans text-lg font-semibold uppercase  text-muted-foreground">
				Font Selection
			</div>

			<div className="space-y-2">
				{slots.map((slot) => (
					<div key={slot.number} className="w-full">
						<div>
							<label
								htmlFor={slot.id}
								className="mb-1.5 block capitalize font-semibold tracking-wide text-muted-foreground"
							>
								{slot.label}
							</label>

							<Select value={slot.value} onValueChange={slot.onChange}>
								<SelectTrigger
									id={slot.id}
									className="min-h-11 w-full py-2.5"
									disabled={!fonts.length}
								>
									<SelectValue placeholder={slot.placeholder} />
								</SelectTrigger>

								<SelectContent className="">
									{fonts.map((font) => (
										<SelectItem key={font.id} value={font.id}>
											<span style={{ fontFamily: font.cssFamily }}>
												{font.name}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
