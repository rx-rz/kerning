import { Circle } from "lucide-react";
import type { PointerEvent } from "react";

import type { ShapeNode as ShapeNodeData } from "#/features/editor/types";
import { ICON_COMPONENTS } from "#/features/editor/lib/shape-library";

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
			<ShapeGraphic node={node} />
		</button>
	);
}

export function ShapeGraphic({
	node,
	className,
}: {
	node: Pick<ShapeNodeData, "shapeType" | "shape" | "color">;
	className?: string;
}) {
	if (node.shapeType === "icon") {
		const Icon = ICON_COMPONENTS[node.shape] ?? Circle;
		return (
			<Icon
				className={className ?? "size-full"}
				color={node.color}
				strokeWidth={1.8}
			/>
		);
	}

	if (node.shapeType === "emoji") {
		return (
			<span
				className={className ?? "flex size-full items-center justify-center leading-none"}
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
		node.shape === "vertical" ? 90 : node.shape === "diagonal-up" ? -30 : node.shape === "diagonal-down" ? 30 : 0;
	return (
		<span className="flex size-full items-center justify-center">
			<span
				className="block h-1.5 w-full rounded-full"
				style={{ backgroundColor: node.color, transform: `rotate(${rotation}deg)` }}
			/>
		</span>
	);
}
