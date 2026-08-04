import { describe, expect, it } from "vitest";
import {
	createEmptyFontSystem,
	createVariant,
	getFontFeatureSettingsCss,
	getFontVariationSettingsCss,
	isGlyphKey,
	isKerningPairKey,
	sanitizeFontSystem,
} from "./font-system";

describe("project font system", () => {
	it("generates deterministic and validated browser CSS", () => {
		expect(getFontFeatureSettingsCss({ ss01: true, liga: false, bad: true })).toBe(
			'"liga" 0, "ss01" 1',
		);
		expect(getFontVariationSettingsCss({ wght: 620.5, opsz: 18, nope: Number.NaN })).toBe(
			'"opsz" 18, "wght" 620.5',
		);
		expect(getFontFeatureSettingsCss({})).toBeUndefined();
	});

	it("uses unambiguous glyph and pair keys", () => {
		expect(isGlyphKey("gid:42")).toBe(true);
		expect(isGlyphKey("u+1f600")).toBe(true);
		expect(isKerningPairKey("gid:36|gid:57")).toBe(true);
		expect(isKerningPairKey("AV")).toBe(false);
	});

	it("rejects role links to missing variants during hydration", () => {
		const variant = createVariant("font-1");
		const value = createEmptyFontSystem();
		value.variants[variant.id] = variant;
		value.roles.primary = {
			role: "primary",
			fontId: "font-1",
			activeVariantId: "missing",
		};
		expect(sanitizeFontSystem(value).roles.primary).toBeNull();
	});
});
