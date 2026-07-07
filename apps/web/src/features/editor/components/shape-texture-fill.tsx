import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CardTextureFill } from "#/features/editor/components/card-texture-fill";
import { ICON_COMPONENTS } from "#/features/editor/lib/shape-library";
import type { ShapeNode } from "#/features/editor/types";

function escapeXml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

function getMaskSvg(node: ShapeNode) {
	if (node.shapeType === "icon") {
		const Icon = ICON_COMPONENTS[node.shape];
		if (Icon) {
			return renderToStaticMarkup(
				createElement(Icon, {
					xmlns: "http://www.w3.org/2000/svg",
					width: "100%",
					height: "100%",
					stroke: "black",
					strokeWidth: node.strokeWidth,
				}),
			);
		}
	}

	const content =
		node.shapeType === "ellipse"
			? '<ellipse cx="50" cy="50" rx="50" ry="50" fill="black"/>'
			: node.shapeType === "rectangle"
				? '<rect width="100" height="100" fill="black"/>'
				: node.shapeType === "emoji"
					? `<text x="50" y="82" text-anchor="middle" font-size="80">${escapeXml(node.shape)}</text>`
					: `<line x1="0" y1="50" x2="100" y2="50" stroke="black" stroke-width="${node.strokeWidth}" stroke-linecap="round" transform="rotate(${node.shape === "vertical" ? 90 : node.shape === "diagonal-up" ? -30 : node.shape === "diagonal-down" ? 30 : 0} 50 50)"/>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${content}</svg>`;
}

export function ShapeTextureFill({ node }: { node: ShapeNode }) {
	if (!node.texture) return null;

	const maskImage = `url("data:image/svg+xml,${encodeURIComponent(getMaskSvg(node))}")`;

	return (
		<span
			aria-hidden
			data-shape-layer="texture"
			className="pointer-events-none absolute inset-0 size-full"
			style={{
				maskImage,
				maskPosition: "center",
				maskRepeat: "no-repeat",
				maskSize: "100% 100%",
				WebkitMaskImage: maskImage,
				WebkitMaskPosition: "center",
				WebkitMaskRepeat: "no-repeat",
				WebkitMaskSize: "100% 100%",
			}}
		>
			<CardTextureFill fill={node.texture} />
		</span>
	);
}
