import type { SmartGuide } from "#/features/editor/lib/smart-guide-engine";

export type SmartGuideAppearance = {
	color: string;
	thickness: number;
};

const DEFAULT_APPEARANCE: SmartGuideAppearance = {
	color: "#EC4899",
	thickness: 1,
};

export function SmartGuideOverlay({
	guides,
	appearance = DEFAULT_APPEARANCE,
}: {
	guides: readonly SmartGuide[];
	appearance?: SmartGuideAppearance;
}) {
	return (
		<svg
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 z-40 size-full overflow-visible transition-opacity duration-100"
			style={{ opacity: guides.length ? 1 : 0 }}
		>
			{guides.map((guide) =>
				guide.type === "alignment" ? (
					<line
						key={`alignment-${guide.axis}-${guide.position}-${guide.start}-${guide.end}`}
						x1={guide.axis === "x" ? guide.position : guide.start}
						x2={guide.axis === "x" ? guide.position : guide.end}
						y1={guide.axis === "y" ? guide.position : guide.start}
						y2={guide.axis === "y" ? guide.position : guide.end}
						stroke={appearance.color}
						strokeWidth={appearance.thickness}
						vectorEffect="non-scaling-stroke"
					/>
				) : (
					<g
						key={`spacing-${guide.axis}-${guide.start}-${guide.end}-${guide.crossStart}-${guide.crossEnd}`}
						stroke={appearance.color}
						strokeWidth={appearance.thickness}
						fill="none"
						vectorEffect="non-scaling-stroke"
					>
						<line
							x1={guide.axis === "x" ? guide.start : guide.crossStart}
							x2={guide.axis === "x" ? guide.end : guide.crossEnd}
							y1={
								guide.axis === "x"
									? (guide.crossStart + guide.crossEnd) / 2
									: guide.start
							}
							y2={
								guide.axis === "x"
									? (guide.crossStart + guide.crossEnd) / 2
									: guide.end
							}
							strokeDasharray="2 2"
						/>
						<line
							x1={guide.axis === "x" ? guide.start : guide.crossStart}
							x2={guide.axis === "x" ? guide.start : guide.crossEnd}
							y1={guide.axis === "x" ? guide.crossStart : guide.start}
							y2={guide.axis === "x" ? guide.crossEnd : guide.start}
						/>
						<line
							x1={guide.axis === "x" ? guide.end : guide.crossStart}
							x2={guide.axis === "x" ? guide.end : guide.crossEnd}
							y1={guide.axis === "x" ? guide.crossStart : guide.end}
							y2={guide.axis === "x" ? guide.crossEnd : guide.end}
						/>
					</g>
				),
			)}
		</svg>
	);
}
