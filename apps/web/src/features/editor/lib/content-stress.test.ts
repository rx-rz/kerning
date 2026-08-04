import { describe, expect, it } from "vitest";
import { createContentStressPreview } from "#/features/editor/lib/content-stress";
import type { TextNode } from "#/features/editor/types";

function textNode(
	id: string,
	text: string,
	role: "primary" | "secondary-one" | "secondary-two",
): TextNode {
	return {
		id,
		type: "text",
		text,
		fontType:
			role === "primary"
				? "primary"
				: role === "secondary-one"
					? "sec1"
					: "sec2",
		fontSource: { type: "role", role },
		x: 0,
		y: 0,
		width: 200,
		height: 60,
		fontSize: 24,
		fontWeight: 500,
		lineHeight: 1.1,
		letterSpacing: 0,
		color: "#000000",
		textAlign: "left",
		textCasing: "none",
	};
}

describe("content stress previews", () => {
	it("leaves saved copy untouched when the original mode is selected", () => {
		const node = textNode("title", "Original title", "primary");

		expect(createContentStressPreview([node], "original").size).toBe(0);
		expect(node.text).toBe("Original title");
	});

	it("uppercases each node's existing copy for the all-caps proof", () => {
		const nodes = [
			textNode("title", "A mixed Case title", "primary"),
			textNode("body", "Supporting copy", "secondary-one"),
		];

		const preview = createContentStressPreview(nodes, "all-caps");

		expect(preview.get("title")).toBe("A MIXED CASE TITLE");
		expect(preview.get("body")).toBe("SUPPORTING COPY");
		expect(nodes.map(({ text }) => text)).toEqual([
			"A mixed Case title",
			"Supporting copy",
		]);
	});

	it("uses role-aware samples for structured stress tests", () => {
		const nodes = [
			textNode("title", "Short", "primary"),
			textNode("body", "Brief", "secondary-one"),
			textNode("meta", "Today", "secondary-two"),
		];

		const preview = createContentStressPreview(nodes, "data-details");

		expect(preview.get("title")).toContain("2026");
		expect(preview.get("body")).toContain("@north-office.co");
		expect(preview.get("meta")).toContain("₦1,249,990.50");
	});
});
