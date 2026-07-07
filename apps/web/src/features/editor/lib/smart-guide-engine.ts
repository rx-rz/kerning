import type { EditorNode } from "#/features/editor/types";

export type NodeBounds = Pick<
	EditorNode,
	"id" | "x" | "y" | "width" | "height"
>;

export type SmartGuideOptions = {
	snapTolerance: number;
	snappingEnabled: boolean;
};

export type AlignmentGuide = {
	type: "alignment";
	axis: "x" | "y";
	position: number;
	start: number;
	end: number;
};

export type SpacingGuide = {
	type: "spacing";
	axis: "x" | "y";
	start: number;
	end: number;
	crossStart: number;
	crossEnd: number;
	distance: number;
};

export type SmartGuide = AlignmentGuide | SpacingGuide;
export type ResizeEdges = Partial<
	Record<"left" | "right" | "top" | "bottom", true>
>;

export type SmartGuideResult = {
	bounds: NodeBounds;
	guides: SmartGuide[];
};

const DEFAULT_OPTIONS: SmartGuideOptions = {
	snapTolerance: 6,
	snappingEnabled: true,
};

type Anchor = { value: number; kind: "start" | "center" | "end" };
type AxisMatch = {
	delta: number;
	active: Anchor;
	target: Anchor;
	targetBounds: NodeBounds;
};

function anchors(start: number, size: number): Anchor[] {
	return [
		{ value: start, kind: "start" },
		{ value: start + size / 2, kind: "center" },
		{ value: start + size, kind: "end" },
	];
}

function overlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
	return Math.min(aEnd, bEnd) >= Math.max(aStart, bStart);
}

/** Stateless geometry engine. Construct once per gesture to cache static bounds. */
export class SmartGuideEngine {
	readonly staticBounds: readonly NodeBounds[];
	readonly options: SmartGuideOptions;

	constructor(
		bounds: readonly NodeBounds[],
		options: Partial<SmartGuideOptions> = {},
	) {
		this.staticBounds = bounds.map((bound) => ({ ...bound }));
		this.options = { ...DEFAULT_OPTIONS, ...options };
	}

	compute(proposed: NodeBounds, resizeEdges?: ResizeEdges): SmartGuideResult {
		const xMatch = this.findAlignment(proposed, "x", resizeEdges);
		const yMatch = this.findAlignment(proposed, "y", resizeEdges);
		let bounds = { ...proposed };

		if (this.options.snappingEnabled) {
			bounds = this.applyAxisDelta(
				bounds,
				"x",
				xMatch?.delta ?? 0,
				resizeEdges,
			);
			bounds = this.applyAxisDelta(
				bounds,
				"y",
				yMatch?.delta ?? 0,
				resizeEdges,
			);
		}

		const guides: SmartGuide[] = [];
		if (xMatch) guides.push(this.alignmentGuide(bounds, xMatch, "x"));
		if (yMatch) guides.push(this.alignmentGuide(bounds, yMatch, "y"));
		this.addSpacingGuides(bounds, guides);
		return { bounds, guides };
	}

	private findAlignment(
		bounds: NodeBounds,
		axis: "x" | "y",
		edges?: ResizeEdges,
	) {
		const start = axis === "x" ? bounds.x : bounds.y;
		const size = axis === "x" ? bounds.width : bounds.height;
		let activeAnchors = anchors(start, size);
		if (edges) {
			const movesStart = axis === "x" ? edges.left : edges.top;
			const movesEnd = axis === "x" ? edges.right : edges.bottom;
			activeAnchors = movesStart
				? activeAnchors.filter(({ kind }) => kind === "start")
				: movesEnd
					? activeAnchors.filter(({ kind }) => kind === "end")
					: [];
		}

		let best: AxisMatch | undefined;
		for (const targetBounds of this.staticBounds) {
			const targetStart = axis === "x" ? targetBounds.x : targetBounds.y;
			const targetSize =
				axis === "x" ? targetBounds.width : targetBounds.height;
			for (const active of activeAnchors) {
				for (const target of anchors(targetStart, targetSize)) {
					const delta = target.value - active.value;
					if (Math.abs(delta) > this.options.snapTolerance) continue;
					if (!best || Math.abs(delta) < Math.abs(best.delta)) {
						best = { delta, active, target, targetBounds };
					}
				}
			}
		}
		return best;
	}

	private applyAxisDelta(
		bounds: NodeBounds,
		axis: "x" | "y",
		delta: number,
		edges?: ResizeEdges,
	) {
		if (!delta) return bounds;
		if (!edges) return { ...bounds, [axis]: bounds[axis] + delta };
		const movesStart = axis === "x" ? edges.left : edges.top;
		const movesEnd = axis === "x" ? edges.right : edges.bottom;
		const sizeKey = axis === "x" ? "width" : "height";
		if (movesStart)
			return {
				...bounds,
				[axis]: bounds[axis] + delta,
				[sizeKey]: bounds[sizeKey] - delta,
			};
		if (movesEnd) return { ...bounds, [sizeKey]: bounds[sizeKey] + delta };
		return bounds;
	}

	private alignmentGuide(
		bounds: NodeBounds,
		match: AxisMatch,
		axis: "x" | "y",
	): AlignmentGuide {
		const target = match.targetBounds;
		const position = match.target.value;
		return axis === "x"
			? {
					type: "alignment",
					axis,
					position,
					start: Math.min(bounds.y, target.y),
					end: Math.max(bounds.y + bounds.height, target.y + target.height),
				}
			: {
					type: "alignment",
					axis,
					position,
					start: Math.min(bounds.x, target.x),
					end: Math.max(bounds.x + bounds.width, target.x + target.width),
				};
	}

	private addSpacingGuides(active: NodeBounds, guides: SmartGuide[]) {
		const tolerance = this.options.snapTolerance;
		for (const axis of ["x", "y"] as const) {
			const startKey = axis;
			const sizeKey = axis === "x" ? "width" : "height";
			const crossKey = axis === "x" ? "y" : "x";
			const crossSizeKey = axis === "x" ? "height" : "width";
			for (let index = 0; index < this.staticBounds.length; index++) {
				const neighbor = this.staticBounds[index];
				if (!neighbor) continue;
				const crossOverlaps = overlap(
					active[crossKey],
					active[crossKey] + active[crossSizeKey],
					neighbor[crossKey],
					neighbor[crossKey] + neighbor[crossSizeKey],
				);
				if (!crossOverlaps) continue;
				const activeAfter =
					active[startKey] >= neighbor[startKey] + neighbor[sizeKey];
				const activeBefore =
					active[startKey] + active[sizeKey] <= neighbor[startKey];
				if (!activeAfter && !activeBefore) continue;
				const activeGap = activeAfter
					? active[startKey] - (neighbor[startKey] + neighbor[sizeKey])
					: neighbor[startKey] - (active[startKey] + active[sizeKey]);
				for (
					let otherIndex = 0;
					otherIndex < this.staticBounds.length;
					otherIndex++
				) {
					if (otherIndex === index) continue;
					const other = this.staticBounds[otherIndex];
					if (!other) continue;
					let referenceGap = -1;
					if (other[startKey] >= neighbor[startKey] + neighbor[sizeKey])
						referenceGap =
							other[startKey] - (neighbor[startKey] + neighbor[sizeKey]);
					else if (neighbor[startKey] >= other[startKey] + other[sizeKey])
						referenceGap =
							neighbor[startKey] - (other[startKey] + other[sizeKey]);
					if (
						referenceGap < 0 ||
						Math.abs(referenceGap - activeGap) > tolerance
					)
						continue;
					const start = activeAfter
						? neighbor[startKey] + neighbor[sizeKey]
						: active[startKey] + active[sizeKey];
					guides.push({
						type: "spacing",
						axis,
						start,
						end: start + activeGap,
						crossStart: Math.max(active[crossKey], neighbor[crossKey]),
						crossEnd: Math.min(
							active[crossKey] + active[crossSizeKey],
							neighbor[crossKey] + neighbor[crossSizeKey],
						),
						distance: activeGap,
					});
					return;
				}
			}
		}
	}
}
