import { create } from "zustand";
import type {
  FontLabBrowserSettings,
  FontLabLaunchContext,
} from "./font-lab-context.types";

export type EditorTextSelection = {
  cardId: string;
  nodeId: string;
  start: number;
  end: number;
  text: string;
};

export type FontGuideOverlay = {
  cardId: string;
  nodeId: string;
  metrics: {
    unitsPerEm: number;
    ascender: number;
    capHeight: number;
    xHeight: number;
    descender: number;
  };
  estimated: boolean;
};

type FontLabContextState = {
  context: FontLabLaunchContext | null;
  temporarySettings: FontLabBrowserSettings | null;
  editorSelection: EditorTextSelection | null;
  fontGuideOverlay: FontGuideOverlay | null;
  open: (
    context: FontLabLaunchContext,
    settings?: FontLabBrowserSettings,
  ) => void;
  close: () => void;
  setTemporarySettings: (settings: FontLabBrowserSettings) => void;
  setEditorSelection: (selection: EditorTextSelection | null) => void;
  setFontGuideOverlay: (overlay: FontGuideOverlay | null) => void;
};

/** Transient Font Lab navigation and preview state. This store is intentionally not persisted. */
export const useFontLabContextStore = create<FontLabContextState>((set) => ({
  context: null,
  temporarySettings: null,
  editorSelection: null,
  fontGuideOverlay: null,
  open: (context, settings) =>
    set({
      context,
      temporarySettings: settings ? structuredClone(settings) : null,
      fontGuideOverlay: null,
    }),
  close: () =>
    set({
      context: null,
      temporarySettings: null,
      fontGuideOverlay: null,
    }),
  setTemporarySettings: (temporarySettings) => set({ temporarySettings }),
  setEditorSelection: (editorSelection) => set({ editorSelection }),
  setFontGuideOverlay: (fontGuideOverlay) => set({ fontGuideOverlay }),
}));
