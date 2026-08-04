import { AlertTriangle, Languages } from "lucide-react";
import { Button } from "#/components/ui/button";
import { useFontLabContextStore } from "#/features/editor/font-lab-bridge/font-lab-context.store";
import {
  getTextNodeRole,
  resolveSelectedTextFontContext,
} from "#/features/editor/font-lab-bridge/selected-text-font-context";
import { useEditorStore } from "#/features/editor/store/editor-store";
import type { EditorCard, TextNode } from "#/features/editor/types";

export function CardTypographyActions({ card }: { card: EditorCard }) {
  const fontSystem = useEditorStore((state) => state.fontSystem);
  const fonts = useEditorStore((state) => state.projectFonts);
  const setCardRoleOverride = useEditorStore(
    (state) => state.setCardRoleOverride,
  );
  const open = useFontLabContextStore((state) => state.open);
  const textNodes = card.nodes.filter(
    (node): node is TextNode => node.type === "text",
  );
  const textNode =
    textNodes.find((node) => getTextNodeRole(node) === "primary") ??
    textNodes[0];
  const context = textNode
    ? resolveSelectedTextFontContext({
        card,
        node: textNode,
        fontSystem,
        fonts,
      })
    : null;
  const overrideRoles = Object.keys(
    card.fontSystemOverrides?.roles ?? {},
  ) as Array<"primary" | "secondary-one" | "secondary-two">;
  function lookCloser() {
    if (!textNode || !context) return;
    open(
      {
        surface: "glyph",
        source: { type: "card", cardId: card.id },
        fontId: context.fontId,
        variantId: context.variantId,
        role: context.role,
        sampleText: textNode.text,
        returnTarget: { cardId: card.id, nodeId: textNode.id },
        sourceLabel: `${card.name}${card.scenario ? ` · ${card.scenario.scenarioName}` : ""}`,
        textStyle: {
          fontSize: textNode.fontSize,
          lineHeight: textNode.lineHeight,
          letterSpacing: textNode.letterSpacing,
          textAlign: textNode.textAlign,
          textTransform: textNode.textCasing,
          containerWidth: textNode.width,
        },
        featureSettings: context.effectiveFeatureSettings,
        variationSettings: context.effectiveVariationSettings,
      },
      {
        featureSettings: context.effectiveFeatureSettings,
        variationSettings: context.effectiveVariationSettings,
        fontSize: textNode.fontSize,
        lineHeight: textNode.lineHeight,
        letterSpacing: textNode.letterSpacing,
      },
    );
  }
  return (
    <section className="space-y-2 rounded-xl border border-hairline bg-surface-wash p-3">
      <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        Typography workflow
      </p>
      <div className="flex flex-wrap gap-1">
        <Button
          size="sm"
          variant="outline"
          disabled={!context}
          onClick={lookCloser}
        >
          <Languages /> Look closer
        </Button>
      </div>
      {overrideRoles.length ? (
        <div className="rounded-lg border border-hairline bg-background p-2">
          <p className="flex items-center gap-1 text-xs font-semibold">
            <AlertTriangle className="size-3" /> Card role override active
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {overrideRoles.map((role) => (
              <Button
                key={role}
                size="xs"
                variant="ghost"
                onClick={() => setCardRoleOverride(card.id, role, undefined)}
              >
                Reset {role.replace("-", " ")}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
