// @vitest-environment jsdom

import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EditorCanvas } from "#/features/editor/components/editor-canvas";
import { EditorInspector } from "#/features/editor/components/editor-inspector";
import { EditorPage } from "#/features/editor/components/editor-page";
import { DEFAULT_PAPER_SETTINGS } from "#/features/editor/lib/card-fill";
import {
	EDITOR_SESSION_STORAGE_KEY,
	useEditorStore,
} from "#/features/editor/store/editor-store";

const imageDbMocks = vi.hoisted(() => ({
	deleteEditorImage: vi.fn(async () => {}),
	getEditorImage: vi.fn(async () => undefined),
	replaceEditorImage: vi.fn(async () => "replacement-image-id"),
}));

vi.mock("#/db/image-db", () => imageDbMocks);

function renderEditorParts() {
	return render(
		<>
			<EditorCanvas />
			<EditorInspector onClose={() => {}} />
		</>,
	);
}

describe("editor components", () => {
	beforeEach(() => {
		window.sessionStorage.clear();
		Object.defineProperty(window, "matchMedia", {
			configurable: true,
			value: vi.fn().mockImplementation((query: string) => ({
				matches: false,
				media: query,
				onchange: null,
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				addListener: vi.fn(),
				removeListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		});
		vi.stubGlobal(
			"ResizeObserver",
			class {
				observe() {}
				unobserve() {}
				disconnect() {}
			},
		);
		vi.stubGlobal(
			"IntersectionObserver",
			class {
				observe() {}
				unobserve() {}
				disconnect() {}
			},
		);
		useEditorStore.getState().resetEditor();
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it("keeps the selected card when empty canvas space is clicked", () => {
		renderEditorParts();

		expect(screen.getByLabelText("Card Name")).toBeTruthy();
		fireEvent.click(screen.getByLabelText("Editor preview"));
		expect(screen.getByLabelText("Card Name")).toBeTruthy();
	});

	it("opens the system glyph viewer and updates its preview", () => {
		render(<EditorPage />);
		fireEvent.click(screen.getByRole("button", { name: "Open glyph viewer" }));

		expect(screen.getByRole("dialog", { name: "Glyph viewer" })).toBeTruthy();
		expect(screen.getByLabelText("Available glyphs")).toBeTruthy();
		fireEvent.click(
			screen.getByRole("button", { name: "Select A, Unicode 0041" }),
		);
		expect(
			screen.getByLabelText("Selected glyph preview").textContent,
		).toContain("A");
	});

	it("updates the selected card from inspector controls", () => {
		renderEditorParts();

		fireEvent.change(screen.getByLabelText("Card Name"), {
			target: { value: "Editorial Cover" },
		});
		fireEvent.change(screen.getByLabelText("Width"), {
			target: { value: "720" },
		});

		expect(useEditorStore.getState().cards[0]).toMatchObject({
			name: "Editorial Cover",
			width: 640,
		});
		expect(screen.getByLabelText("Width")).toHaveProperty("max", "640");
		expect(screen.getByLabelText("Height")).toHaveProperty("max", "640");
		expect(
			screen.getByRole("button", { name: "Select Editorial Cover" }),
		).toBeTruthy();
	});

	it("renders inspector sections as static, non-collapsible regions", () => {
		renderEditorParts();
		const sections = Array.from(document.querySelectorAll("section"));

		expect(sections.length).toBeGreaterThan(0);
		expect(document.querySelector("details")).toBeNull();
		expect(document.querySelector("summary")).toBeNull();
	});

	it("updates the card solid fill from the inspector", () => {
		renderEditorParts();

		fireEvent.change(screen.getByLabelText("Card fill hex code"), {
			target: { value: "#123456" },
		});

		expect(useEditorStore.getState().cards[0]?.settings.fill).toEqual({
			type: "solid",
			color: "#123456",
		});
	});

	it("layers texture independently from the selected fill", () => {
		renderEditorParts();

		fireEvent.click(screen.getByRole("button", { name: /Fill/ }));
		fireEvent.click(screen.getByRole("radio", { name: "Linear" }));
		fireEvent.click(screen.getByRole("button", { name: /Texture/ }));
		fireEvent.click(screen.getByRole("radio", { name: "Paper" }));

		expect(useEditorStore.getState().cards[0]?.settings).toMatchObject({
			fill: { type: "linear-gradient" },
			texture: { type: "texture", texture: "paper", opacity: 0.35 },
		});
		expect(screen.getByRole("radio", { name: "Paper" })).toHaveProperty(
			"checked",
			true,
		);
	});

	it("renders texture below an image fill on the card", async () => {
		const card = useEditorStore.getState().cards[0];
		if (!card) throw new Error("Expected a default card");

		imageDbMocks.getEditorImage.mockResolvedValueOnce({
			id: "background-image",
			blob: new Blob(["image"], { type: "image/png" }),
		});
		vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:background-image");
		vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
		useEditorStore.getState().updateCardSettings(card.id, {
			fill: {
				type: "image",
				imageId: "background-image",
				opacity: 1,
				settings: { backgroundSize: "cover", originX: 50, originY: 50 },
			},
			texture: {
				type: "texture",
				texture: "paper",
				opacity: 0.35,
				settings: {
					colorFront: "#FFFFFF",
					colorBack: "#000000",
					contrast: 0.5,
					roughness: 0.5,
					fiber: 0.5,
					crumples: 0.5,
					folds: 0.5,
					seed: 1,
				},
			},
		});

		renderEditorParts();

		await waitFor(() => {
			const texture = document.querySelector('[data-card-layer="texture"]');
			const image = document.querySelector('[data-card-layer="image"]');
			expect(texture).toBeTruthy();
			expect(image).toBeTruthy();
			expect(
				texture?.compareDocumentPosition(image as Node) &
					Node.DOCUMENT_POSITION_FOLLOWING,
			).toBeTruthy();
		});
	});

	it("offers image as an upload-based fill instead of a texture", async () => {
		renderEditorParts();

		fireEvent.click(screen.getByRole("button", { name: /Fill/ }));
		const imageChoices = screen.getAllByRole("radio", { name: "Image" });
		expect(imageChoices).toHaveLength(1);
		fireEvent.click(imageChoices[0] as HTMLElement);

		expect(useEditorStore.getState().cards[0]?.settings).toMatchObject({
			fill: {
				type: "image",
				imageId: null,
				settings: { backgroundSize: "cover", originX: 50, originY: 50 },
			},
			texture: null,
		});
		expect(screen.getByRole("button", { name: "Upload image" })).toBeTruthy();
		expect(screen.queryByText("Dither")).toBeNull();
		expect(screen.queryByText("Color steps")).toBeNull();
		expect(screen.queryByText("Original colors")).toBeNull();
		expect(screen.queryByText("Background")).toBeNull();
		expect(screen.queryByText("Ink")).toBeNull();
		expect(screen.queryByText("Highlight")).toBeNull();
		expect(screen.queryByText("Pixel size")).toBeNull();
		expect(screen.getByText("Background size")).toBeTruthy();

		fireEvent.change(screen.getByLabelText("Image URL"), {
			target: { value: "https://example.com/card-background.jpg" },
		});
		expect(useEditorStore.getState().cards[0]?.settings.fill).toMatchObject({
			type: "image",
			imageId: null,
			src: "https://example.com/card-background.jpg",
		});
		expect(
			(document.querySelector('[data-card-layer="image"]') as HTMLElement).style
				.backgroundImage,
		).toContain("card-background.jpg");

		const upload = screen.getByLabelText("Upload image fill");
		const file = new File(["image"], "cover.png", { type: "image/png" });
		await act(async () => {
			fireEvent.change(upload, { target: { files: [file] } });
		});

		expect(imageDbMocks.replaceEditorImage).toHaveBeenCalledWith(file, null);
		expect(useEditorStore.getState().cards[0]?.settings.fill).toMatchObject({
			type: "image",
			imageId: "replacement-image-id",
			src: "",
		});
	});

	it("expands a text node when multiline copy needs more room", () => {
		renderEditorParts();

		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);
		const textArea = screen.getByLabelText("Edit text node");
		expect(textArea).toHaveProperty("readOnly", true);
		fireEvent.doubleClick(textArea);
		expect(textArea).toHaveProperty("readOnly", false);
		Object.defineProperty(textArea, "scrollHeight", {
			configurable: true,
			value: 88,
		});
		fireEvent.change(textArea, {
			target: { value: "Kerning is\ncontext\nin motion" },
		});

		const node = useEditorStore.getState().cards[0]?.nodes[0];
		expect(node).toMatchObject({
			type: "text",
			text: "Kerning is\ncontext\nin motion",
			fontType: "primary",
			fontSize: 20,
			height: 70,
		});
		fireEvent.blur(textArea);
		expect(textArea).toHaveProperty("readOnly", true);
	});

	it("updates text typography settings and applies them to the canvas", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);
		fireEvent.click(screen.getByText("Appearance"));

		fireEvent.change(screen.getByLabelText("Size"), {
			target: { value: "32" },
		});
		fireEvent.change(screen.getByLabelText("Line height"), {
			target: { value: "1.5" },
		});
		fireEvent.change(screen.getByLabelText("Letter spacing"), {
			target: { value: "2.5" },
		});

		const node = useEditorStore.getState().cards[0]?.nodes[0];
		expect(node).toMatchObject({
			type: "text",
			fontSize: 32,
			lineHeight: 1.5,
			letterSpacing: 2.5,
		});

		const textArea = screen.getByLabelText("Edit text node");
		expect(textArea.style.fontSize).toBe("32px");
		expect(textArea.style.lineHeight).toBe("1.5");
		expect(textArea.style.letterSpacing).toBe("2.5px");
		expect(screen.queryByText("Font type")).toBeNull();
		expect(screen.queryByText("Weight")).toBeNull();
	});

	it("updates text color from the picker and valid hex edits", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);

		const textArea = screen.getByLabelText("Edit text node");
		const hexInput = screen.getByLabelText("Text color hex code");
		fireEvent.change(hexInput, { target: { value: "#ff3366" } });

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			color: "#FF3366",
		});
		expect(textArea.style.color).toBe("rgb(255, 51, 102)");
		expect(textArea.style.webkitTextFillColor).toBe("rgb(255, 51, 102)");

		fireEvent.change(hexInput, { target: { value: "#ff" } });
		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			color: "#FF3366",
		});

		fireEvent.change(screen.getByLabelText("Text color picker"), {
			target: { value: "#123456" },
		});
		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			color: "#123456",
		});
	});

	it("offers visual text alignment and casing choices", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);

		expect(screen.getByRole("radio", { name: "Left" })).toHaveProperty(
			"checked",
			true,
		);
		expect(screen.getByRole("radio", { name: "Original" })).toHaveProperty(
			"checked",
			true,
		);
	});

	it("adds an image node and accepts its source", () => {
		renderEditorParts();

		fireEvent.click(
			screen.getByRole("button", { name: "Add image to Untitled Card" }),
		);
		fireEvent.change(screen.getByLabelText("Image source URL"), {
			target: { value: "https://example.com/specimen.jpg" },
		});

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			type: "image",
			src: "https://example.com/specimen.jpg",
		});
		expect(document.querySelector("img")).toHaveProperty(
			"src",
			"https://example.com/specimen.jpg",
		);
	});

	it("adds a shape node and exposes simple color and size controls", () => {
		renderEditorParts();

		fireEvent.click(
			screen.getByRole("button", { name: "Add shape to Untitled Card" }),
		);
		expect(screen.queryByRole("button", { name: "All" })).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Horizontal line" }));

		const node = useEditorStore.getState().cards[0]?.nodes[0];
		expect(node).toMatchObject({ type: "shape", shapeType: "line" });
		fireEvent.change(screen.getByLabelText("Shape color hex code"), {
			target: { value: "#ff3366" },
		});
		fireEvent.change(screen.getByLabelText("Size"), {
			target: { value: "144" },
		});

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			color: "#FF3366",
			width: 144,
			height: 144,
		});
	});

	it("applies a texture within a shape silhouette", async () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add shape to Untitled Card" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Geometry" }));
		fireEvent.click(screen.getByRole("button", { name: "Rectangle" }));
		fireEvent.click(screen.getByRole("button", { name: /Texture/ }));
		fireEvent.click(screen.getByRole("radio", { name: "Paper" }));

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			type: "shape",
			texture: { type: "texture", texture: "paper", opacity: 0.35 },
		});
		await waitFor(() =>
			expect(
				document.querySelector('[data-shape-layer="texture"]'),
			).toBeTruthy(),
		);
	});

	it("opens the template sidebar and applies a square album-cover preset", () => {
		render(<EditorPage />);

		fireEvent.click(
			screen.getByRole("button", { name: "Open templates for Untitled Card" }),
		);
		expect(screen.getByRole("heading", { name: "Templates" })).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: /Swiss Modernism/ }));

		expect(useEditorStore.getState().cards[0]).toMatchObject({
			name: "Swiss Modernism",
			width: 500,
			height: 500,
			settings: {
				aspectRatio: "1:1",
				fill: { type: "solid", color: "#F2F1EC" },
			},
		});
	});

	it("stacks the layer controls vertically", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Add image to Untitled Card" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Toggle layers for Untitled Card" }),
		);

		expect(screen.getByLabelText("Untitled Card layers").className).toContain(
			"flex-col",
		);
	});

	it("keeps a selected node at its real layer depth", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Add image to Untitled Card" }),
		);
		const card = useEditorStore.getState().cards[0];
		const bottomNode = card?.nodes[0];
		if (!card || !bottomNode) throw new Error("Expected two editor nodes");

		act(() => useEditorStore.getState().selectNode(card.id, bottomNode.id));
		const selectedElement = document.querySelector(
			`[data-editor-node][style*="z-index: 5"]`,
		);
		expect(selectedElement).toBeTruthy();
	});

	it("deletes image layers and cleans up their stored image", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add image to Untitled Card" }),
		);
		const card = useEditorStore.getState().cards[0];
		const image = card?.nodes[0];
		if (!card || !image || image.type !== "image") {
			throw new Error("Expected an image node");
		}
		act(() =>
			useEditorStore
				.getState()
				.updateNode(card.id, image.id, { imageId: "stored-image" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Toggle layers for Untitled Card" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Delete Image layer" }));

		expect(imageDbMocks.deleteEditorImage).toHaveBeenCalledWith("stored-image");
		expect(useEditorStore.getState().cards[0]?.nodes).toHaveLength(0);
	});

	it("sorts a whole layer row with pointer input", () => {
		Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
			configurable: true,
			value: vi.fn(),
		});
		renderEditorParts();
		for (let index = 0; index < 3; index += 1) {
			fireEvent.click(
				screen.getByRole("button", { name: "Add text to Untitled Card" }),
			);
		}
		const card = useEditorStore.getState().cards[0];
		if (!card) throw new Error("Expected an editor card");
		const [bottom, middle, top] = card.nodes;
		if (!bottom || !middle || !top) throw new Error("Expected three layers");
		fireEvent.click(
			screen.getByRole("button", { name: "Toggle layers for Untitled Card" }),
		);

		const visualIds = [top.id, middle.id, bottom.id];
		visualIds.forEach((id, index) => {
			const row = document.querySelector<HTMLElement>(
				`[data-layer-id="${id}"]`,
			);
			if (!row) throw new Error("Expected a layer row");
			Object.defineProperty(row, "getBoundingClientRect", {
				configurable: true,
				value: () => ({
					top: index * 40,
					bottom: index * 40 + 36,
					height: 36,
					left: 0,
					right: 200,
					width: 200,
					x: 0,
					y: index * 40,
					toJSON: () => ({}),
				}),
			});
		});
		const topRow = document.querySelector<HTMLElement>(
			`[data-layer-id="${top.id}"]`,
		);
		if (!topRow) throw new Error("Expected the top layer row");
		fireEvent.pointerDown(topRow, {
			button: 0,
			pointerId: 1,
			clientX: 10,
			clientY: 10,
		});
		fireEvent.pointerMove(topRow, { pointerId: 1, clientX: 10, clientY: 130 });
		fireEvent.pointerUp(topRow, { pointerId: 1, clientX: 10, clientY: 130 });

		expect(
			useEditorStore.getState().cards[0]?.nodes.map((node) => node.id),
		).toEqual([top.id, bottom.id, middle.id]);
	});

	it("applies and resets image composition and effects", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add image to Untitled Card" }),
		);
		const card = useEditorStore.getState().cards[0];
		const node = card?.nodes[0];
		if (!card || !node || node.type !== "image")
			throw new Error("Expected an image node");

		act(() => {
			useEditorStore.getState().updateNode(card.id, node.id, {
				src: "https://example.com/effects.jpg",
				zoom: 1.75,
				positionX: 20,
				positionY: 80,
				effects: {
					brightness: 120,
					contrast: 90,
					saturation: 140,
					blur: 2,
					grayscale: 25,
					sepia: 10,
				},
			});
		});

		const image = document.querySelector("img") as HTMLImageElement;
		expect(image.style.objectPosition).toBe("20% 80%");
		expect(image.style.transform).toBe("scale(1.75)");
		expect(image.style.transformOrigin).toBe("20% 80%");
		expect(image.style.filter).toBe(
			"brightness(120%) contrast(90%) saturate(140%) blur(2px) grayscale(25%) sepia(10%)",
		);

		fireEvent.click(screen.getByRole("button", { name: "Reset image" }));
		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			zoom: 1,
			positionX: 50,
			positionY: 50,
			effects: {
				brightness: 100,
				contrast: 100,
				saturation: 100,
				blur: 0,
				grayscale: 0,
				sepia: 0,
			},
		});
	});

	it("applies a texture overlay to an image node", async () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add image to Untitled Card" }),
		);
		const card = useEditorStore.getState().cards[0];
		const node = card?.nodes[0];
		if (!card || !node || node.type !== "image")
			throw new Error("Expected an image node");

		act(() => {
			useEditorStore.getState().updateNode(card.id, node.id, {
				src: "https://example.com/texture.jpg",
				texture: {
					type: "texture",
					texture: "paper",
					opacity: 0.4,
					settings: DEFAULT_PAPER_SETTINGS,
				},
			});
		});

		await waitFor(() =>
			expect(
				document.querySelector('[data-card-layer="texture"]'),
			).toBeTruthy(),
		);
	});

	it("opens image replacement on double click and shows uploaded state", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add image to Untitled Card" }),
		);
		const card = useEditorStore.getState().cards[0];
		const node = card?.nodes[0];
		if (!card || !node) throw new Error("Expected an image node");

		act(() => {
			useEditorStore.getState().updateNode(card.id, node.id, {
				imageId: "stored-image-id",
			});
		});

		expect(screen.getByText("Replace uploaded image")).toBeTruthy();
		expect(screen.getByText("Uploaded")).toBeTruthy();
		const fileInput = screen.getByLabelText("Replace image node file");
		const clickFileInput = vi.spyOn(fileInput, "click");
		fireEvent.doubleClick(
			screen.getByRole("button", { name: "Select image node" }),
		);
		expect(clickFileInput).toHaveBeenCalledOnce();
	});

	it("deletes a node from its attached control", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);

		const deleteButton = screen.getByRole("button", {
			name: "Delete text node from card",
		});
		expect(deleteButton.className).toContain("top-1");
		expect(deleteButton.className).toContain("right-1");
		expect(deleteButton.className).not.toContain("translate-x-1/2");
		fireEvent.click(deleteButton);

		expect(useEditorStore.getState().cards[0]?.nodes).toHaveLength(0);
		expect(useEditorStore.getState().selectedNodeId).toBeNull();
	});

	it("does not let node gestures initialize carousel dragging", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);

		const node = screen.getByLabelText("Edit text node");
		const nodeContainer = node.closest("[data-editor-node]") as HTMLElement;
		expect(nodeContainer).toBeTruthy();
		expect(nodeContainer.style.width).toBe("220px");
	});

	it("resizes an image node from its corner handle", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add image to Untitled Card" }),
		);

		const handle = screen.getByRole("button", { name: "Resize image node" });
		Object.defineProperty(handle, "setPointerCapture", { value: vi.fn() });
		fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100, clientY: 100 });
		fireEvent.pointerMove(handle, { pointerId: 1, clientX: 150, clientY: 130 });
		fireEvent.pointerUp(handle, { pointerId: 1 });

		const state = useEditorStore.getState();
		expect(state.cards[0]?.nodes[0]).toMatchObject({
			width: 270,
			height: 190,
		});
		expect(state.selectedNodeId).toBe(state.cards[0]?.nodes[0]?.id);
	});

	it("resizes a node from its left edge without crossing the card", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add image to Untitled Card" }),
		);

		const handle = screen.getByRole("button", {
			name: "Resize image node from w",
		});
		Object.defineProperty(handle, "setPointerCapture", { value: vi.fn() });
		fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100, clientY: 100 });
		fireEvent.pointerMove(handle, { pointerId: 1, clientX: 0, clientY: 100 });
		fireEvent.pointerUp(handle, { pointerId: 1 });

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			x: 0,
			width: 244,
		});
	});

	it("resizes a text node without changing its font size", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);

		const handle = screen.getByRole("button", { name: "Resize text node" });
		Object.defineProperty(handle, "setPointerCapture", { value: vi.fn() });
		fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100, clientY: 100 });
		fireEvent.pointerMove(handle, { pointerId: 1, clientX: 150, clientY: 140 });
		fireEvent.pointerUp(handle, { pointerId: 1 });

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			width: 270,
			height: 98,
			fontSize: 20,
		});
	});

	it("reflows text width all the way to the card edge", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);

		const textArea = screen.getByLabelText("Edit text node");
		Object.defineProperty(textArea, "scrollHeight", {
			configurable: true,
			value: 1000,
		});
		const handle = screen.getByRole("button", { name: "Resize text width" });
		Object.defineProperty(handle, "setPointerCapture", { value: vi.fn() });
		fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100, clientY: 100 });
		fireEvent.pointerMove(handle, {
			pointerId: 1,
			clientX: 1100,
			clientY: 100,
		});
		fireEvent.pointerUp(handle, { pointerId: 1 });

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			width: 536,
			height: 58,
			fontSize: 20,
		});
	});

	it("persists and rehydrates the editor document from session storage", async () => {
		const card = useEditorStore.getState().cards[0];

		if (!card) {
			throw new Error("Expected a default card");
		}

		useEditorStore.setState({ cards: [], selectedCardId: null });
		window.sessionStorage.setItem(
			EDITOR_SESSION_STORAGE_KEY,
			JSON.stringify({
				state: {
					cards: [
						{
							...card,
							name: "Persisted Card",
							width: 900,
							height: 800,
							settings: { aspectRatio: card.settings.aspectRatio },
							background: "#AABBCC",
							borderRadius: 18,
						},
					],
					selectedCardId: card.id,
				},
				version: 0,
			}),
		);

		await useEditorStore.persist.rehydrate();

		expect(useEditorStore.getState().cards[0]).toMatchObject({
			name: "Persisted Card",
			width: 640,
			height: 640,
			settings: {
				fill: { type: "solid", color: "#AABBCC" },
				opacity: 1,
				blur: 0,
				borderWidth: 0,
				borderStyle: "solid",
				borderColor: "#000000",
			},
		});
		expect(useEditorStore.getState().cards[0]).not.toHaveProperty("background");
		expect(useEditorStore.getState().cards[0]).not.toHaveProperty(
			"borderRadius",
		);
		expect(useEditorStore.getState().cards[0]?.settings).not.toHaveProperty(
			"borderRadius",
		);
		expect(useEditorStore.getState().selectedCardId).toBe(card.id);

		useEditorStore.getState().updateCard(card.id, { name: "Saved Card" });
		const savedSession = JSON.parse(
			window.sessionStorage.getItem(EDITOR_SESSION_STORAGE_KEY) ?? "{}",
		);

		expect(savedSession.state.cards[0]).toMatchObject({ name: "Saved Card" });
	});

	it("removes legacy dithering settings from saved image fills", async () => {
		const card = useEditorStore.getState().cards[0];
		if (!card) throw new Error("Expected a default card");

		useEditorStore.setState({ cards: [], selectedCardId: null });
		window.sessionStorage.setItem(
			EDITOR_SESSION_STORAGE_KEY,
			JSON.stringify({
				state: {
					cards: [
						{
							...card,
							settings: {
								...card.settings,
								fill: {
									type: "image",
									imageId: "stored-image-id",
									opacity: 0.7,
									settings: {
										image: "/splash.webp",
										ditherType: "4x4",
										size: 2,
									},
								},
							},
						},
					],
					selectedCardId: card.id,
				},
				version: 4,
			}),
		);

		await useEditorStore.persist.rehydrate();

		expect(useEditorStore.getState().cards[0]?.settings.fill).toEqual({
			type: "image",
			imageId: "stored-image-id",
			opacity: 0.7,
			settings: { backgroundSize: "cover", originX: 50, originY: 50 },
		});
	});

	it("adds and resets cards from the preview controls", () => {
		renderEditorParts();

		fireEvent.click(screen.getByRole("button", { name: "Add Card" }));
		expect(useEditorStore.getState().cards).toHaveLength(2);
		expect(
			screen.getByRole("textbox", { name: "Card name" }).getAttribute("value"),
		).toBe("Untitled Card 2");

		fireEvent.click(screen.getByRole("button", { name: "Reset" }));
		expect(
			screen.getByRole("textbox", { name: "Card name" }).getAttribute("value"),
		).toBe("Untitled Card");
	});

	it("selects a card from the tick navigator", () => {
		renderEditorParts();
		fireEvent.click(screen.getByRole("button", { name: "Add Card" }));

		fireEvent.click(
			screen.getByRole("button", { name: "Go to Untitled Card" }),
		);

		expect(
			screen.getByRole("textbox", { name: "Card name" }).getAttribute("value"),
		).toBe("Untitled Card");
	});

	it("moves between adjacent cards from the preview navigation", () => {
		renderEditorParts();

		fireEvent.click(screen.getByRole("button", { name: "Add Card" }));
		expect(
			screen.getByRole("textbox", { name: "Card name" }).getAttribute("value"),
		).toBe("Untitled Card 2");

		fireEvent.click(screen.getByRole("button", { name: "Previous card" }));
		expect(
			screen.getByRole("textbox", { name: "Card name" }).getAttribute("value"),
		).toBe("Untitled Card");

		fireEvent.click(screen.getByRole("button", { name: "Next card" }));
		expect(
			screen.getByRole("textbox", { name: "Card name" }).getAttribute("value"),
		).toBe("Untitled Card 2");
	});

	it("edits the project title and toggles the card drag lock", () => {
		const onProjectTitleChange = vi.fn();
		render(
			<EditorCanvas
				projectTitle="Brand exploration"
				onProjectTitleChange={onProjectTitleChange}
			/>,
		);

		const title = screen.getByRole("textbox", { name: "Project title" });
		fireEvent.change(title, { target: { value: "Launch campaign" } });
		fireEvent.blur(title);
		expect(onProjectTitleChange).toHaveBeenCalledWith("Launch campaign");
		expect(screen.getByText(/^Last edited /).textContent).not.toBe(
			"Last edited —",
		);

		const cardName = screen.getByRole("textbox", { name: "Card name" });
		fireEvent.change(cardName, { target: { value: "Front cover" } });
		fireEvent.blur(cardName);
		expect(useEditorStore.getState().cards[0]?.name).toBe("Front cover");

		const lock = screen.getByRole("button", { name: "Lock card dragging" });
		fireEvent.click(lock);
		expect(
			screen
				.getByRole("button", { name: "Unlock card dragging" })
				.getAttribute("aria-pressed"),
		).toBe("true");
		expect(screen.getByRole("tooltip").textContent).toContain(
			"prevent dragging between cards",
		);
	});

	it("moves between cards with wheel scrolling", () => {
		renderEditorParts();
		fireEvent.click(screen.getByRole("button", { name: "Add Card" }));

		fireEvent.wheel(screen.getByLabelText("Scrollable cards"), {
			deltaY: -100,
		});

		expect(
			screen.getByRole("textbox", { name: "Card name" }).getAttribute("value"),
		).toBe("Untitled Card");
	});

	it("zooms the canvas between fifty and one hundred fifty percent", () => {
		renderEditorParts();
		const card = document.querySelector("[data-card-id]") as HTMLElement;

		expect(card.style.width).toBe("560px");
		fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
		expect(card.style.width).toBe("616px");
		expect(
			screen.getByRole("button", { name: "Reset zoom from 110%" }),
		).toBeTruthy();

		for (let index = 0; index < 12; index += 1) {
			fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
		}
		expect(card.style.width).toBe("840px");
		expect(screen.getByRole("button", { name: "Zoom in" })).toHaveProperty(
			"disabled",
			true,
		);

		fireEvent.click(screen.getByRole("button", { name: /Reset zoom/ }));
		for (let index = 0; index < 6; index += 1) {
			fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
		}
		expect(card.style.width).toBe("280px");
		expect(screen.getByRole("button", { name: "Zoom out" })).toHaveProperty(
			"disabled",
			true,
		);
	});

	it("zooms with a modified wheel gesture", () => {
		renderEditorParts();
		fireEvent.wheel(screen.getByLabelText("Scrollable cards"), {
			ctrlKey: true,
			deltaY: -100,
		});

		expect(
			screen.getByRole("button", { name: "Reset zoom from 110%" }),
		).toBeTruthy();
	});

	it("converts pointer movement back into document coordinates while zoomed", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);
		for (let index = 0; index < 10; index += 1) {
			fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
		}

		const textArea = screen.getByLabelText("Edit text node");
		Object.defineProperty(textArea, "setPointerCapture", { value: vi.fn() });
		fireEvent.pointerDown(textArea, {
			pointerId: 1,
			clientX: 100,
			clientY: 100,
		});
		fireEvent.pointerMove(textArea, {
			pointerId: 1,
			clientX: 175,
			clientY: 100,
		});
		fireEvent.pointerUp(textArea, { pointerId: 1 });

		expect(useEditorStore.getState().cards[0]?.nodes[0]).toMatchObject({
			x: 74,
		});
	});

	it("closes and reopens the floating inspector", () => {
		render(<EditorPage />);

		fireEvent.click(screen.getByRole("button", { name: "Close inspector" }));
		expect(screen.getByRole("button", { name: "Open inspector" })).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Open inspector" }));
		expect(
			screen.getByRole("button", { name: "Close inspector" }),
		).toBeTruthy();
	});

	it("opens the inspector when a node is clicked", () => {
		render(<EditorPage />);
		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Close inspector" }));

		fireEvent.click(screen.getByLabelText("Edit text node"));

		expect(
			screen.getByRole("button", { name: "Close inspector" }),
		).toBeTruthy();
		expect(screen.getByLabelText("Text")).toBeTruthy();
	});

	it("toggles the inspector from the selected card settings button", () => {
		render(<EditorPage />);

		fireEvent.click(
			screen.getByRole("button", {
				name: "Toggle settings for Untitled Card",
			}),
		);
		expect(screen.getByRole("button", { name: "Open inspector" })).toBeTruthy();

		fireEvent.click(
			screen.getByRole("button", {
				name: "Toggle settings for Untitled Card",
			}),
		);
		expect(
			screen.getByRole("button", { name: "Close inspector" }),
		).toBeTruthy();
	});

	it("keeps the inspector closed when card selection changes", () => {
		render(<EditorPage />);

		fireEvent.click(screen.getByRole("button", { name: "Close inspector" }));
		fireEvent.click(screen.getByLabelText("Editor preview"));
		fireEvent.click(
			screen.getByRole("button", { name: "Select Untitled Card" }),
		);

		expect(screen.getByRole("button", { name: "Open inspector" })).toBeTruthy();
		expect(
			screen.queryByRole("button", { name: "Close inspector" }),
		).toBeNull();
	});

	it("does not offer deletion when only one card remains", () => {
		renderEditorParts();
		expect(
			screen.queryByRole("button", { name: "Delete Untitled Card" }),
		).toBeNull();
		expect(useEditorStore.getState().cards).toHaveLength(1);
	});
});
