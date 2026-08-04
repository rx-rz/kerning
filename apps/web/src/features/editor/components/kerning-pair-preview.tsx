export function KerningPairPreview({ pair, fontFamily, size }: { pair: string; fontFamily: string; size: number }) {
	return (
		<div className="grid grid-cols-1 border-b border-hairline sm:grid-cols-2">
		{([false, true] as const).map((enabled) => (
			<section key={String(enabled)} aria-label={enabled ? "Kerning enabled" : "Kerning disabled"} className="min-w-0 overflow-hidden border-b border-hairline p-4 sm:border-r sm:border-b-0">
				<div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{enabled ? "With kerning" : "Without kerning"}</div>
				<div className="flex min-h-36 items-center justify-center whitespace-pre" style={{ fontFamily, fontSize: size, lineHeight: 1, fontKerning: enabled ? "normal" : "none", fontFeatureSettings: enabled ? '"kern" 1' : '"kern" 0' }}>{pair}</div>
			</section>
		))}
		</div>
	);
}
