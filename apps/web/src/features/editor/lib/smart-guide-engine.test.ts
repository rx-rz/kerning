import { describe, expect, it } from "vitest";
import { SmartGuideEngine } from "#/features/editor/lib/smart-guide-engine";

const target = { id: "target", x: 100, y: 40, width: 80, height: 60 };

describe("SmartGuideEngine", () => {
	it("snaps edge and center anchors within tolerance", () => {
		const engine = new SmartGuideEngine([target]);
		expect(
			engine.compute({ id: "a", x: 95, y: 150, width: 20, height: 20 }).bounds
				.x,
		).toBe(100);
		expect(
			engine.compute({ id: "a", x: 124, y: 150, width: 30, height: 20 }).bounds
				.x,
		).toBe(125);
		expect(
			engine.compute({ id: "a", x: 155, y: 150, width: 20, height: 20 }).bounds
				.x,
		).toBe(160);
	});

	it("only moves the active resize edge", () => {
		const result = new SmartGuideEngine([target]).compute(
			{ id: "a", x: 30, y: 40, width: 66, height: 40 },
			{ right: true },
		);
		expect(result.bounds).toMatchObject({ x: 30, width: 70 });
		expect(result.guides[0]).toMatchObject({
			type: "alignment",
			axis: "x",
			position: 100,
		});
	});

	it("reports equal spacing", () => {
		const engine = new SmartGuideEngine([
			{ id: "one", x: 0, y: 0, width: 20, height: 20 },
			{ id: "two", x: 40, y: 0, width: 20, height: 20 },
		]);
		const result = engine.compute({
			id: "active",
			x: 80,
			y: 0,
			width: 20,
			height: 20,
		});
		expect(result.guides).toContainEqual(
			expect.objectContaining({ type: "spacing", axis: "x", distance: 20 }),
		);
	});

	it("isolates cached bounds from source mutation", () => {
		const source = { ...target };
		const engine = new SmartGuideEngine([source]);
		source.x = 400;
		expect(
			engine.compute({ id: "a", x: 95, y: 150, width: 20, height: 20 }).bounds
				.x,
		).toBe(100);
	});
});
