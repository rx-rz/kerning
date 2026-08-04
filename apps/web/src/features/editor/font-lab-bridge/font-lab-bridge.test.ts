import type { ProjectFontEntity } from "@kerning/shared";
import { describe, expect, it } from "vitest";
import {
  createEmptyFontSystem,
  createVariant,
} from "#/features/editor/font-system/font-system";
import type { EditorCard, TextNode } from "#/features/editor/types";
import { useFontLabContextStore } from "./font-lab-context.store";
import {
  addComparisonSlot,
  createInitialComparisonSlots,
} from "./comparison-slots";
import { resolveSelectedTextFontContext } from "./selected-text-font-context";
import {
  adjacentInspectablePairs,
  classifyCharacterSupport,
  selectedWordFromRange,
  uniqueInspectableCharacters,
  uniqueInspectableWords,
} from "./text-selection";

const font = {
  id: "font",
  dbId: "font",
  family: "Test Variable",
  cssFamily: "Test Variable",
  axes: [
    { tag: "wght", name: "Weight", min: 100, max: 900, defaultValue: 400 },
  ],
  faces: [],
} as unknown as ProjectFontEntity;
const node: TextNode = {
  id: "node",
  type: "text",
  x: 0,
  y: 0,
  width: 200,
  height: 40,
  text: "A😀 A",
  fontType: "primary",
  fontSource: { type: "role", role: "primary" },
  fontSize: 20,
  fontWeight: 400,
  lineHeight: 1.2,
  letterSpacing: 0,
  color: "#000",
  textAlign: "left",
  textCasing: "none",
};
const card = {
  id: "card",
  name: "Card",
  width: 400,
  height: 300,
  settings: {
    aspectRatio: "1:1",
    fill: { type: "solid", color: "#fff" },
    texture: null,
    opacity: 1,
    blur: 0,
    borderWidth: 0,
    borderStyle: "solid",
    borderColor: "#000",
  },
  nodes: [node],
  fontSystemOverrides: {
    roles: {
      primary: {
        featureSettings: { ss01: true },
        variationSettings: { wght: 650 },
      },
    },
  },
} satisfies EditorCard;

describe("Font Lab bridge", () => {
  it("iterates Unicode characters and adjacent pairs by code point", () => {
    expect(uniqueInspectableCharacters("A😀 A")).toEqual(["A", "😀"]);
    expect(adjacentInspectablePairs("A😀 A").map(({ text }) => text)).toEqual([
      "A😀",
      "😀 ",
      " A",
    ]);
  });
  it("expands a partial selection to its full word", () => {
    expect(uniqueInspectableWords("A love-letter to type")).toEqual([
      "A",
      "love-letter",
      "to",
      "type",
    ]);
    expect(selectedWordFromRange("Set AVENUE in type", 5, 7)).toBe("AVENUE");
  });
  it("classifies unique characters by actual font coverage", () => {
    expect(classifyCharacterSupport("A₦ A", new Set([65]))).toEqual({
      supported: ["A"],
      missing: ["₦"],
    });
  });
  it("populates and adds independent Compare font slots", () => {
    expect(
      createInitialComparisonSlots("a", ["a", "b", "c", "d"], true),
    ).toEqual(["a", "b", "c"]);
    expect(addComparisonSlot(["a"], "b")).toEqual(["a", "b"]);
    expect(addComparisonSlot(["a", "b", "c"], "d")).toEqual(["a", "b", "c"]);
  });
  it("resolves card role overrides on top of the project variant", () => {
    const fontSystem = createEmptyFontSystem();
    const variant = createVariant(font.dbId);
    variant.featureSettings = { liga: true };
    fontSystem.variants[variant.id] = variant;
    fontSystem.roles.primary = {
      role: "primary",
      fontId: font.dbId,
      activeVariantId: variant.id,
    };
    const result = resolveSelectedTextFontContext({
      card,
      node,
      fontSystem,
      fonts: [font],
    });
    expect(result?.effectiveFeatureSettings).toEqual({
      liga: true,
      ss01: true,
    });
    expect(result?.effectiveVariationSettings).toEqual({ wght: 650 });
  });
  it("keeps launch and preview settings transient", () => {
    const store = useFontLabContextStore.getState();
    store.open(
      {
        surface: "compare",
        source: { type: "text-node", cardId: "card", nodeId: "node" },
      },
      { featureSettings: { liga: true }, variationSettings: { wght: 400 } },
    );
    store.setTemporarySettings({
      featureSettings: { liga: false },
      variationSettings: { wght: 400 },
    });
    expect(useFontLabContextStore.getState().temporarySettings).toEqual({
      featureSettings: { liga: false },
      variationSettings: { wght: 400 },
    });
    store.close();
    expect(useFontLabContextStore.getState().context).toBeNull();
  });
});
