import { EditorCard } from "#/features/editor/components/editor-card";
import type { EditorCard as EditorCardData } from "#/features/editor/types";

export type CanvasProofMode = "none" | "glance" | "width" | "contrast";

export const CANVAS_PROOF_OPTIONS: ReadonlyArray<{
	mode: CanvasProofMode;
	label: string;
	description: string;
}> = [
	{
		mode: "none",
		label: "Original view",
		description: "Return to the editable canvas.",
	},
	{
		mode: "glance",
		label: "Glance test",
		description: "Check hierarchy at thumbnail distance.",
	},
	{
		mode: "width",
		label: "Width proof",
		description: "Compare compact, current, and wide frames.",
	},
	{
		mode: "contrast",
		label: "Contrast proof",
		description: "Test the type on light, dark, and image surfaces.",
	},
];

type CanvasProofPreviewProps = {
	card: EditorCardData;
	mode: Exclude<CanvasProofMode, "none">;
	contentStressPreview?: ReadonlyMap<string, string>;
};

const NOOP = () => {};

export function CanvasProofPreview({
	card,
	mode,
	contentStressPreview,
}: CanvasProofPreviewProps) {
	if (mode === "glance") {
		return (
			<ProofFrame
				label="Glance test · blurred thumbnail distance"
				className="items-center"
			>
				<EditorCard
					card={card}
					zoom={0.4}
					proofBlur={2.5}
					isInteractive={false}
					isSelected={false}
					contentStressPreview={contentStressPreview}
					onSelect={NOOP}
					onDelete={NOOP}
				/>
			</ProofFrame>
		);
	}

	if (mode === "width") {
		const widths = [
			{
				label: "Compact",
				width: Math.max(280, Math.round(card.width * 0.65)),
			},
			{ label: "Current", width: card.width },
			{ label: "Wide", width: Math.min(800, Math.round(card.width * 1.35)) },
		];
		const widest = Math.max(...widths.map(({ width }) => width));
		const proofZoom = Math.min(0.68, 440 / widest);

		return (
			<ProofGroup label="Width proof">
				{widths.map(({ label, width }) => (
					<ProofFrame key={label} label={`${label} · ${width}px`}>
						<EditorCard
							card={{ ...card, width }}
							zoom={proofZoom}
							isInteractive={false}
							isSelected={false}
							contentStressPreview={contentStressPreview}
							onSelect={NOOP}
							onDelete={NOOP}
						/>
					</ProofFrame>
				))}
			</ProofGroup>
		);
	}

	const surfaces: ReadonlyArray<{ label: string; card: EditorCardData }> = [
		{ label: "Original", card },
		{
			label: "Light",
			card: withProofSurface(card, { type: "solid", color: "#E8EDF4" }),
		},
		{
			label: "Dark",
			card: withProofSurface(card, { type: "solid", color: "#17191D" }),
		},
		{
			label: "Image",
			card: withProofSurface(card, {
				type: "image",
				imageId: null,
				src: "/splash.webp",
				opacity: 1,
				settings: { backgroundSize: "cover", originX: 50, originY: 50 },
			}),
		},
	];
	const proofZoom = Math.min(0.52, 300 / card.width);

	return (
		<ProofGroup label="Contrast proof">
			{surfaces.map(({ label, card: proofCard }) => (
				<ProofFrame key={label} label={label}>
					<EditorCard
						card={proofCard}
						zoom={proofZoom}
						isInteractive={false}
						isSelected={false}
						contentStressPreview={contentStressPreview}
						onSelect={NOOP}
						onDelete={NOOP}
					/>
				</ProofFrame>
			))}
		</ProofGroup>
	);
}

function ProofGroup({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<section
			aria-label={label}
			className="flex w-full max-w-[96rem] flex-wrap items-end justify-center gap-6"
		>
			{children}
		</section>
	);
}

function ProofFrame({
	label,
	children,
	className = "",
}: {
	label: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<figure className={`flex flex-col gap-2 ${className}`}>
			<figcaption className="font-mono text-[10px] font-semibold text-muted-foreground">
				{label}
			</figcaption>
			<div className="pointer-events-none">{children}</div>
		</figure>
	);
}

function withProofSurface(
	card: EditorCardData,
	fill: EditorCardData["settings"]["fill"],
): EditorCardData {
	return {
		...card,
		settings: {
			...card.settings,
			fill,
			texture: null,
		},
	};
}
