import type { ProjectFontEntity } from "@kerning/shared";
import { inspectFont } from "../lib/font-inspection";
import type { LoadedGlyphFont } from "../lib/glyph-font";

function Rows({ rows }: { rows: Array<{ label: string; value: string }> }) {
	return (
		<dl className="divide-y divide-hairline">
			{rows.map((row) => (
				<div
					key={row.label}
					className="grid grid-cols-[minmax(10rem,1fr)_2fr] gap-5 py-2.5"
				>
					<dt className="text-xs text-muted-foreground">{row.label}</dt>
					<dd className="text-sm">{row.value}</dd>
				</div>
			))}
		</dl>
	);
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section className="border-t border-hairline pt-5">
			<h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
				{title}
			</h2>
			{children}
		</section>
	);
}

export function FontInspector({
	data,
	entity,
	fontFamily,
}: {
	data: LoadedGlyphFont;
	entity: ProjectFontEntity;
	fontFamily: string;
}) {
	const inspection = inspectFont(data.fonts[0], entity);
	return (
		<div className="h-full overflow-y-auto bg-surface-glass">
			<div className="mx-auto max-w-5xl space-y-8 px-8 py-10">
				<div>
					<p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
						Font inspector
					</p>
					<div
						className="break-words text-6xl leading-none"
						style={{ fontFamily }}
					>
						{inspection.family}
					</div>
				</div>
				<Section title="Overview">
					<Rows rows={inspection.overview} />
				</Section>
				<Section title="Vertical metrics">
					<div className="divide-y divide-hairline">
						{inspection.metrics.map(({ label, value }) => (
							<div
								key={label}
								className="grid grid-cols-[1fr_8rem_8rem] py-2.5 text-sm"
							>
								<span className="text-muted-foreground">{label}</span>
								<span className="font-mono text-right">{value}</span>
								<span className="font-mono text-right text-muted-foreground">
									{Math.round((value / inspection.unitsPerEm) * 100)}%
								</span>
							</div>
						))}
					</div>
				</Section>
				<Section title="Character coverage">
					<div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
						{inspection.coverage.map(({ label, status }) => (
							<div
								key={label}
								className="flex justify-between border-b border-hairline py-2.5 text-sm"
							>
								<span>{label}</span>
								<span className="font-mono text-xs text-muted-foreground">
									{status}
								</span>
							</div>
						))}
					</div>
				</Section>
				<Section title="OpenType capabilities">
					<div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
						{inspection.capabilities.map(({ label, value }) => (
							<div
								key={label}
								className="flex justify-between border-b border-hairline py-2.5 text-sm"
							>
								<span>{label}</span>
								<span className="font-mono text-xs text-muted-foreground">
									{value}
								</span>
							</div>
						))}
					</div>
				</Section>
				<details className="border-t border-hairline py-5">
					<summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
						Raw metadata
					</summary>
					<div className="mt-4">
						<Rows
							rows={
								inspection.rawMetadata.length
									? inspection.rawMetadata
									: [{ label: "Metadata", value: "Not available" }]
							}
						/>
					</div>
				</details>
			</div>
		</div>
	);
}
