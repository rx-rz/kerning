import { Info } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#/components/ui/popover";

const EXPLANATIONS = {
  "X-height":
    "X-height is how tall lowercase letters appear. Fonts at the same CSS size can feel very different when one has a larger x-height.",
  "Cap height":
    "Cap height is the height of flat-topped capital letters. It helps explain why headings can look larger or smaller at the same numerical size.",
  "Advance width":
    "Advance width is the horizontal space the cursor moves after a glyph. It includes the character and its built-in spacing, so it is more useful than outline width alone.",
  "Side bearings":
    "Side bearings are the built-in breathing room on either side of a character. They shape spacing before pair-specific kerning is applied.",
  "Bounding box":
    "The bounding box encloses the visible outline. Comparing it with advance width reveals how the glyph sits inside its spacing area.",
  Kerning:
    "Kerning adjusts the space between particular character pairs. Compare the pair with kerning on and off to see the practical effect.",
  "Match x-height":
    "This scales each font until its lowercase letters appear equally tall. It can be fairer than using the same numerical font size.",
  "Match cap height":
    "This scales each font until its capital letters appear equally tall, making display-face comparisons easier to judge.",
  "Character coverage":
    "Coverage shows which characters the font actually contains. Missing characters may be drawn by a browser fallback and look subtly inconsistent.",
} as const;

export type TypographyTerm = keyof typeof EXPLANATIONS;

export function TypographyTermInfo({ term }: { term: TypographyTerm }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon-xs" variant="ghost" aria-label={`About ${term}`}>
          <Info />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <p className="text-xs font-semibold">{term}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {EXPLANATIONS[term]}
        </p>
      </PopoverContent>
    </Popover>
  );
}
