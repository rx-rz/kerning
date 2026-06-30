// @vitest-environment jsdom

import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EditorCanvas } from "#/features/editor/components/editor-canvas";
import { EditorInspector } from "#/features/editor/components/editor-inspector";
import { EditorPage } from "#/features/editor/components/editor-page";
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

	it("selects cards and deselects when empty canvas space is clicked", () => {
		renderEditorParts();

		expect(screen.getByLabelText("Card Name")).toBeTruthy();
		fireEvent.click(screen.getByLabelText("Editor preview"));
		expect(screen.getByText("No card selected")).toBeTruthy();

		fireEvent.click(
			screen.getByRole("button", { name: "Select Untitled Card" }),
		);
		expect(screen.getByLabelText("Card Name")).toBeTruthy();
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

		fireEvent.click(screen.getByRole("radio", { name: "Linear" }));
		fireEvent.click(screen.getByRole("radio", { name: "Paper" }));

		expect(useEditorStore.getState().cards[0]?.settings).toMatchObject({
			fill: { type: "linear-gradient" },
			texture: { type: "texture", texture: "paper", opacity: 0.35 },
		});
		expect(screen.getByRole("radio", { name: "Linear" })).toHaveProperty(
			"checked",
			true,
		);
		expect(screen.getByRole("radio", { name: "Paper" })).toHaveProperty(
			"checked",
			true,
		);
	});

	it("offers image as a fill instead of a texture", () => {
		renderEditorParts();

		const imageChoices = screen.getAllByRole("radio", { name: "Image" });
		expect(imageChoices).toHaveLength(1);
		fireEvent.click(imageChoices[0] as HTMLElement);

		expect(useEditorStore.getState().cards[0]?.settings).toMatchObject({
			fill: { type: "image", settings: { image: "/splash.webp" } },
			texture: null,
		});
		expect(screen.getByLabelText("Image source")).toBeTruthy();
	});

	it("edits multiline text without changing its container geometry", () => {
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
			height: 58,
		});
		fireEvent.blur(textArea);
		expect(textArea).toHaveProperty("readOnly", true);
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

	it("uses a fixed-step font weight selector", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Add text to Untitled Card" }),
		);

		const weightControl = screen.getByLabelText("Weight");
		expect(weightControl.getAttribute("role")).toBe("combobox");
		expect(weightControl.getAttribute("type")).toBe("button");
		expect(weightControl.textContent).toContain("500");
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

		fireEvent.click(
			screen.getByRole("button", { name: "Delete text node from card" }),
		);

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

	it("reflows text width and stops eight pixels from the card edge", () => {
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
			width: 528,
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
				borderRadius: 18,
			},
		});
		expect(useEditorStore.getState().cards[0]).not.toHaveProperty("background");
		expect(useEditorStore.getState().cards[0]).not.toHaveProperty(
			"borderRadius",
		);
		expect(useEditorStore.getState().selectedCardId).toBe(card.id);

		useEditorStore.getState().updateCard(card.id, { name: "Saved Card" });
		const savedSession = JSON.parse(
			window.sessionStorage.getItem(EDITOR_SESSION_STORAGE_KEY) ?? "{}",
		);

		expect(savedSession.state.cards[0]).toMatchObject({ name: "Saved Card" });
	});

	it("adds and resets cards from the preview controls", () => {
		renderEditorParts();

		fireEvent.click(screen.getByRole("button", { name: "Add Card" }));
		expect(useEditorStore.getState().cards).toHaveLength(2);
		expect(screen.getByDisplayValue("Untitled Card 2")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Reset" }));
		expect(screen.getByDisplayValue("Untitled Card")).toBeTruthy();
	});

	it("selects a card from the tick navigator", () => {
		renderEditorParts();
		fireEvent.click(screen.getByRole("button", { name: "Add Card" }));

		fireEvent.click(
			screen.getByRole("button", { name: "Go to Untitled Card" }),
		);

		expect(screen.getByDisplayValue("Untitled Card")).toBeTruthy();
	});

	it("moves between adjacent cards from the preview navigation", () => {
		renderEditorParts();

		fireEvent.click(screen.getByRole("button", { name: "Add Card" }));
		expect(screen.getByDisplayValue("Untitled Card 2")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Previous card" }));
		expect(screen.getByDisplayValue("Untitled Card")).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "Next card" }));
		expect(screen.getByDisplayValue("Untitled Card 2")).toBeTruthy();
	});

	it("moves between cards with wheel scrolling", () => {
		renderEditorParts();
		fireEvent.click(screen.getByRole("button", { name: "Add Card" }));

		fireEvent.wheel(screen.getByLabelText("Scrollable cards"), {
			deltaY: -100,
		});

		expect(screen.getByDisplayValue("Untitled Card")).toBeTruthy();
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

	it("shows an empty canvas state and can add the first card", () => {
		renderEditorParts();
		fireEvent.click(
			screen.getByRole("button", { name: "Delete Untitled Card" }),
		);
		expect(screen.getByText("No cards yet")).toBeTruthy();
		expect(screen.queryByLabelText("Card navigation")).toBeNull();

		fireEvent.click(
			screen.getByRole("button", { name: "Add your first card" }),
		);
		expect(useEditorStore.getState().cards).toHaveLength(1);
		expect(screen.getByDisplayValue("Untitled Card")).toBeTruthy();
	});
});
