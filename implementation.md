# Implementation Changelog

Record implemented features and technical changes here. Add newest entries below this note. Keep the explanation tied to the code that changed.

### 2026-08-26 — Scale text with resized text containers

#### What changed

Resizing a text node with its canvas handles now scales its font size and pixel-based tracking along with its bounds.

#### Why

Previously, resize gestures changed only `width` and `height`. Text stayed at its original size, so enlarging a text container left type visually undersized; shrinking it could make type no longer fit.

#### How it works

The resize gesture measures its original bounds once. After guides have produced final bounds, it uses the smaller dimension ratio as a uniform scale. This preserves text proportions and keeps wrapped text within a non-proportionally resized container. Unitless `lineHeight` already scales with `fontSize`, so it remains unchanged.

```ts
const textScale = Math.min(
	nextBounds.width / origin.width,
	nextBounds.height / origin.height,
);

fontSize: scaleTypographyValue(node.fontSize, textScale),
letterSpacing: scaleTypographyValue(node.letterSpacing, textScale),
```

#### Study next

- [CSS `line-height`](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height): unitless values scale with font size.
- `apps/web/src/features/editor/components/editor-node.tsx`: pointer resize, smart-guide bounds, and per-card undo transactions.

#### References

- `apps/web/src/features/editor/components/editor-components.test.tsx`: regression test for scaled font size and tracking.

## Entry template

### YYYY-MM-DD — Implementation title

#### What changed

Short description of user-visible or internal behavior added.

#### Why

Reason this change was needed and tradeoffs that shaped it.

#### How it works

Name relevant files, data flow, and important decisions. Include the smallest code excerpt that explains the implementation.

```ts
// Key implementation detail
```

#### Study next

- Concept or API to learn: [Resource title](https://example.com)
- Related area of code: `path/to/file.ts`

#### References

- [Relevant documentation](https://example.com)
