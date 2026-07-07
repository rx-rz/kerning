import { Circle } from "lucide-react";
import type { PointerEvent } from "react";
import { lazy, Suspense } from "react";

import type { ShapeNode as ShapeNodeData } from "#/features/editor/types";
import { ICON_COMPONENTS } from "#/features/editor/lib/shape-library";

const ShapeTextureFill = lazy(() =>
	import("#/features/editor/components/shape-texture-fill").then((module) => ({
		default: module.ShapeTextureFill,
	})),
);

export function ShapeNode({
	node,
	isSelected,
	onSelect,
	onStartDragging,
}: {
	node: ShapeNodeData;
	isSelected: boolean;
	onSelect: () => void;
	onStartDragging: (event: PointerEvent<HTMLElement>) => void;
}) {
	return (
		<button
			type="button"
			aria-label={`Select shape ${node.shape}`}
			aria-pressed={isSelected}
			className="flex size-full items-center justify-center overflow-hidden border-0 bg-transparent p-0 outline-none"
			onClick={(event) => {
				event.stopPropagation();
				onSelect();
			}}
			onPointerDown={onStartDragging}
		>
			<span className="relative block size-full">
				<ShapeGraphic node={node} />
				{node.texture ? (
					<Suspense fallback={null}>
						<ShapeTextureFill node={node} />
					</Suspense>
				) : null}
			</span>
		</button>
	);
}

export function ShapeGraphic({
	node,
	className,
}: {
	node: Pick<
		ShapeNodeData,
		"shapeType" | "shape" | "color" | "strokeWidth"
	>;
	className?: string;
}) {
	if (node.shapeType === "icon") {
		const Icon = ICON_COMPONENTS[node.shape] ?? Circle;
		return (
			<Icon
				className={className ?? "size-full"}
				color={node.color}
				strokeWidth={node.strokeWidth}
			/>
		);
	}

	if (node.shapeType === "emoji") {
		return (
			<span
				className={
					className ?? "flex size-full items-center justify-center leading-none"
				}
				style={{ color: node.color, fontSize: "min(80cqw, 80cqh)" }}
			>
				{node.shape}
			</span>
		);
	}

	if (node.shapeType === "rectangle" || node.shapeType === "ellipse") {
		return (
			<span
				className={className ?? "block size-full"}
				style={{
					backgroundColor: node.color,
					borderRadius: node.shapeType === "ellipse" ? "999px" : undefined,
				}}
			/>
		);
	}

	const rotation =
		node.shape === "vertical"
			? 90
			: node.shape === "diagonal-up"
				? -30
				: node.shape === "diagonal-down"
					? 30
					: 0;
	return (
		<span className={className ?? "flex size-full items-center justify-center"}>
			<span
				className="block w-full rounded-full"
				style={{
					backgroundColor: node.color,
					height: node.strokeWidth,
					transform: `rotate(${rotation}deg)`,
				}}
			/>
		</span>
	);
}
