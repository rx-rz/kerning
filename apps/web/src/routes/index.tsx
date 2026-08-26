import { Button } from "#/components/ui/button";
import { APP_ROUTES } from "#/lib/app-routes";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Blend,
	Brackets,
	Check,
	Move,
	ScanText,
} from "lucide-react";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "Kerning — A type lab for better typography" },
			{
				name: "description",
				content:
					"Compare fonts, inspect glyphs, test kerning, and build typography systems in one focused workspace.",
			},
		],
	}),
	component: LandingPage,
});

const featureList = [
	{
		icon: ScanText,
		title: "See every glyph clearly",
		body: "Inspect outlines, side bearings, advance width, and OpenType features without leaving your canvas.",
	},
	{
		icon: Blend,
		title: "Compare real type systems",
		body: "Assign primary and supporting roles, then test the full stack across useful editorial and product scenarios.",
	},
	{
		icon: Move,
		title: "Build on a flexible canvas",
		body: "Arrange, resize, duplicate, and link type studies with alignment guides that stay out of your way.",
	},
];

function LandingPage() {
	return (
		<div className="min-h-dvh overflow-x-hidden bg-background text-foreground">
			<a
				href="#main-content"
				className="sr-only z-50 rounded-md bg-foreground px-4 py-2 text-background focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
			>
				Skip to content
			</a>

			<header className="border-b border-border">
				<nav
					aria-label="Main navigation"
					className="mx-auto flex min-h-18 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8"
				>
					<Link to="/" className="flex items-center gap-3" aria-label="Kerning home">
						<img src="/logo.png" alt="" className="size-9 border border-border" />
						<span className="text-sm font-semibold tracking-[-0.02em]">Kerning</span>
					</Link>

					<div className="ms-auto hidden items-center gap-7 text-sm text-muted-foreground md:flex">
						<a href="#features" className="transition-colors hover:text-foreground">
							Features
						</a>
						<a href="#workflow" className="transition-colors hover:text-foreground">
							Workflow
						</a>
					</div>

					<Button asChild variant="ghost" className="ms-auto md:ms-0">
						<Link to={APP_ROUTES.LOGIN}>Sign in</Link>
					</Button>
					<Button asChild className="hidden sm:inline-flex">
						<Link to={APP_ROUTES.SIGNUP}>
							Start creating
							<ArrowRight />
						</Link>
					</Button>
				</nav>
			</header>

			<main id="main-content">
				<section className="relative isolate overflow-hidden bg-[#fed503] text-[#141414]">
					<div className="mx-auto grid min-h-[calc(100dvh-4.5rem)] w-full max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
						<div className="relative z-10 max-w-2xl">
							<p className="mb-5 w-fit rounded-full border border-black/30 px-3 py-1.5 text-xs font-semibold">
								A focused workspace for type
							</p>
							<h1 className="max-w-[12ch] text-balance text-[clamp(3.5rem,9vw,6rem)] font-semibold leading-[0.9] tracking-[-0.04em]">
								See what type is doing.
							</h1>
							<p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-black/75 sm:text-xl">
								Kerning brings font comparison, glyph inspection, and layout studies into one precise canvas—so better type decisions take minutes, not tabs.
							</p>
							<div className="mt-9 flex flex-wrap gap-3">
								<Button asChild size="lg" className="bg-[#141414] text-white hover:bg-black">
									<Link to={APP_ROUTES.SIGNUP}>
										Start a project
										<ArrowRight />
									</Link>
								</Button>
								<Button
									asChild
									size="lg"
									variant="outline"
									className="border-black/35 bg-transparent text-black hover:bg-black/5"
								>
									<a href="#features">Explore features</a>
								</Button>
							</div>
							<p className="mt-5 flex items-center gap-2 text-sm text-black/65">
								<Check className="size-4" /> TTF, OTF, WOFF, WOFF2, and Google Fonts
							</p>
						</div>

						<ProductPreview />
					</div>
				</section>

				<section id="features" className="scroll-mt-8 border-b border-border">
					<div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
						<div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
							<div className="max-w-md">
								<h2 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
									One place to make type earn its space.
								</h2>
								<p className="mt-5 text-pretty text-base leading-7 text-muted-foreground">
									From first font choice to final layout stress test, every tool shares the same project and the same source files.
								</p>
							</div>

							<div className="divide-y divide-border border-y border-border">
								{featureList.map((feature) => {
									const Icon = feature.icon;
									return (
										<article key={feature.title} className="grid gap-4 py-7 sm:grid-cols-[3rem_1fr] sm:py-9">
											<div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
												<Icon className="size-5" aria-hidden="true" />
											</div>
											<div>
												<h3 className="text-xl font-semibold tracking-[-0.025em]">{feature.title}</h3>
												<p className="mt-2 max-w-2xl text-pretty leading-7 text-muted-foreground">{feature.body}</p>
											</div>
										</article>
									);
								})}
							</div>
						</div>
					</div>
				</section>

				<section className="bg-[#046a63] text-white">
					<div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:items-center lg:px-8">
						<div className="max-w-xl">
							<h2 className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
								Test the system, not a perfect sentence.
							</h2>
							<p className="mt-5 text-pretty text-lg leading-8 text-white/75">
								Switch between content stress tests, type specimens, glyph metrics, and kerning pairs. Weak choices show up before they ship.
							</p>
							<ul className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
								{["Variable font axes", "OpenType features", "Kerning comparisons", "Smart alignment guides"].map((item) => (
									<li key={item} className="flex items-center gap-2">
										<Check className="size-4 text-[#fed503]" /> {item}
									</li>
								))}
							</ul>
						</div>

						<TypeLensPreview />
					</div>
				</section>

				<section id="workflow" className="scroll-mt-8">
					<div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
						<div className="flex flex-col gap-5 border-b border-border pb-10 sm:flex-row sm:items-end sm:justify-between">
							<h2 className="max-w-xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
								From font files to a working system.
							</h2>
							<p className="max-w-sm text-pretty leading-7 text-muted-foreground">Three steps. No setup maze, no disposable screenshots.</p>
						</div>

						<ol className="grid border-b border-border md:grid-cols-3 md:divide-x md:divide-border">
							{[
								["01", "Bring your fonts", "Upload local files or choose Google Fonts. Matching faces are grouped automatically."],
								["02", "Assign clear roles", "Set primary and supporting fonts, then preview the hierarchy before creating."],
								["03", "Study and refine", "Build layouts, inspect details, and compare choices inside one saved project."],
							].map(([number, title, body]) => (
								<li key={number} className="py-9 md:px-8 md:first:ps-0 md:last:pe-0">
									<span className="font-mono text-sm font-semibold text-primary">{number}</span>
									<h3 className="mt-8 text-xl font-semibold tracking-[-0.025em]">{title}</h3>
									<p className="mt-3 max-w-sm text-pretty leading-7 text-muted-foreground">{body}</p>
								</li>
							))}
						</ol>
					</div>
				</section>

				<section className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
					<div className="mx-auto flex max-w-7xl flex-col items-start gap-8 rounded-2xl bg-[#141414] px-6 py-14 text-white sm:px-10 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-14">
						<div>
							<h2 className="max-w-2xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">Your next type decision can be an informed one.</h2>
							<p className="mt-4 text-white/65">Create a project and put the fonts through their paces.</p>
						</div>
						<Button asChild size="lg" className="shrink-0 bg-[#fed503] text-black hover:bg-[#ffe04d]">
							<Link to={APP_ROUTES.SIGNUP}>
								Start creating
								<ArrowRight />
							</Link>
						</Button>
					</div>
				</section>
			</main>

			<footer className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
				<p>© {new Date().getFullYear()} Kerning.</p>
				<div className="flex gap-5">
					<Link to="/about" className="hover:text-foreground">About</Link>
					<Link to={APP_ROUTES.LOGIN} className="hover:text-foreground">Sign in</Link>
				</div>
			</footer>
		</div>
	);
}

function ProductPreview() {
	return (
		<div className="relative mx-auto w-full max-w-2xl lg:translate-x-8" aria-label="Kerning canvas preview">
			<div className="overflow-hidden rounded-2xl bg-[#f7f7f7] text-[#141414] ring-1 ring-black/20">
				<div className="flex min-h-12 items-center gap-2 border-b border-black/10 px-4">
					<span className="size-2.5 rounded-full bg-black/20" />
					<span className="size-2.5 rounded-full bg-black/20" />
					<span className="size-2.5 rounded-full bg-black/20" />
					<span className="ms-3 font-mono text-[10px] font-semibold">Untitled type study</span>
				</div>
				<div className="grid min-h-105 grid-cols-[4.5rem_1fr] sm:grid-cols-[8rem_1fr]">
					<div className="border-e border-black/10 p-3 sm:p-4">
						<div className="mb-5 h-7 rounded-md bg-[#046a63]" />
						{["Canvas", "Templates", "Layers"].map((item, index) => (
							<div key={item} className={`mb-2 hidden rounded-md px-2 py-2 text-[10px] font-semibold sm:block ${index === 0 ? "bg-black text-white" : "text-black/50"}`}>
								{item}
							</div>
						))}
					</div>
					<div className="relative overflow-hidden p-4 sm:p-7">
						<div className="absolute end-4 top-4 flex gap-1 rounded-full bg-white p-1 ring-1 ring-black/10 sm:end-6 sm:top-6">
							<span className="rounded-full bg-black px-2 py-1 font-mono text-[8px] text-white">100%</span>
							<span className="px-2 py-1 font-mono text-[8px]">Share</span>
						</div>
						<div className="mt-16 border border-[#046a63] bg-white p-5 sm:p-7">
							<div className="flex items-center justify-between font-mono text-[8px] text-black/45">
								<span>DISPLAY / PRIMARY</span><span>64 PX</span>
							</div>
							<p className="mt-5 max-w-sm text-[clamp(2rem,6vw,4.25rem)] font-semibold leading-[0.9] tracking-[-0.04em]">Make space for meaning.</p>
							<div className="mt-7 flex items-end justify-between gap-4 border-t border-black/10 pt-4">
								<p className="max-w-55 text-xs leading-5 text-black/55">A working specimen with real hierarchy, content, and constraints.</p>
								<Brackets className="size-5 text-[#046a63]" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function TypeLensPreview() {
	return (
		<div className="overflow-hidden rounded-2xl bg-white text-[#141414] ring-1 ring-white/25">
			<div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
				<span className="text-sm font-semibold">Type Lens</span>
				<div className="flex gap-2 font-mono text-[9px] text-black/50"><span>GLYPH</span><span>WORD</span></div>
			</div>
			<div className="grid min-h-95 sm:grid-cols-[1.1fr_0.9fr]">
				<div className="relative flex items-center justify-center overflow-hidden border-b border-black/10 p-8 sm:border-b-0 sm:border-e">
					<div className="absolute inset-x-8 top-[32%] border-t border-dashed border-[#046a63]/50" />
					<div className="absolute inset-x-8 top-[69%] border-t border-dashed border-[#046a63]/50" />
					<span className="relative text-[clamp(8rem,25vw,13rem)] font-semibold leading-none tracking-[-0.04em]">g</span>
				</div>
				<div className="p-6">
					<p className="font-mono text-[10px] font-semibold text-black/45">GLYPH METRICS</p>
					<dl className="mt-6 divide-y divide-black/10 border-y border-black/10">
						{[["Advance width", "1042"], ["Left bearing", "88"], ["Right bearing", "76"], ["Unicode", "U+0067"]].map(([term, value]) => (
							<div key={term} className="flex justify-between gap-4 py-3 text-xs"><dt className="text-black/55">{term}</dt><dd className="font-mono font-semibold">{value}</dd></div>
						))}
					</dl>
					<div className="mt-6 rounded-xl bg-[#fed503] p-4">
						<p className="font-mono text-[9px] font-semibold">KERNING PAIR</p>
						<p className="mt-2 text-4xl font-semibold tracking-[-0.08em]">Ag</p>
					</div>
				</div>
			</div>
		</div>
	);
}
