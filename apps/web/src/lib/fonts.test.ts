import { describe, expect, it } from "vitest";

import { MAX_FONT_FILE_SIZE, validateFontFiles } from "./fonts";

const fontFile = (name: string, size = 1) => ({ name, size }) as File;

describe("font upload validation", () => {
	it("accepts supported font extensions case-insensitively", () => {
		expect(() =>
			validateFontFiles([
				fontFile("family.TTF"),
				fontFile("family.woff2"),
			]),
		).not.toThrow();
	});

	it.each([
		["notes.txt", 1, "not a supported font"],
		["empty.otf", 0, "is empty"],
		["huge.woff", MAX_FONT_FILE_SIZE + 1, "exceeds the 10 MB"],
	])("rejects invalid file %s", (name, size, message) => {
		expect(() => validateFontFiles([fontFile(name, size)])).toThrow(message);
	});
});
