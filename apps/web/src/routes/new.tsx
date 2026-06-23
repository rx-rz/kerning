import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { SolidCardHead } from "#/components/ui/card-head";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import type { FontFamilyMeta } from "#/db/font-db";
import {
	type FontUploadPreviewState,
	FontUploadTab,
} from "#/features/new-project/containers/font-upload-tab";

export const Route = createFileRoute("/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const [previewState, setPreviewState] = useState<FontUploadPreviewState>({
		fonts: [],
	});
	const handlePreviewChange = useCallback((state: FontUploadPreviewState) => {
		setPreviewState(state);
	}, []);

	return (
		<main className="flex h-dvh overflow-hidden bg-background text-foreground">
			{/* <aside className="w-42 border-r border-border p-4">
				<img src="/logo.png" alt="Logo" className="size-8" />

				<nav className="mt-10 space-y-2">
					<Link
						to={APP_ROUTES.DASHBOARD}
						className="block rounded-md px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[.06em] text-muted-foreground hover:bg-muted hover:text-foreground"
					>
						Dashboard
					</Link>
				</nav>
			</aside> */}

			<section className="h-dvh w-full max-w-155 overflow-y-auto border-border px-8 py-8">
				<Button variant="outline" size="sm">
					← Back
				</Button>

				<div className="mt-6">
					<h1 className="text-3xl font- font-semibold">Create Project</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Select fonts for your project typography.
					</p>
				</div>

				<Card className="mt-6 overflow-hidden p-0">
					<Tabs defaultValue="upload" className="gap-0">
						<div className="border-b border-border ">
							<TabsList variant="line" className="w-full">
								<TabsTrigger value="upload" className="w-fit py-4">
									<Upload />
									Upload Fonts
								</TabsTrigger>

								<TabsTrigger value="google" className="w-fit py-4">
									<img src="/google.svg" alt="" className="size-4" />
									Google Fonts
								</TabsTrigger>
							</TabsList>
						</div>

						<CardContent className="space-y-5 p-4">
							<TabsContent value="google">
								<div className="rounded-xl border border-dashed border-border p-10 text-center">
									<span className="mx-auto block text-4xl font-bold">G</span>
									<h3 className="mt-4 font-semibold">Search Google Fonts</h3>
									<p className="mt-1 text-sm text-muted-foreground">
										Import a font family directly into this project.
									</p>
								</div>
							</TabsContent>

							<TabsContent value="upload" className="space-y-5">
								<FontUploadTab onPreviewChange={handlePreviewChange} />
							</TabsContent>
						</CardContent>
					</Tabs>
				</Card>
			</section>

			<Card
				variant="checkered"
				className="sticky top-0 flex h-dvh flex-1 items-center justify-center overflow-hidden rounded-none p-8"
			>
				<FontPreviewCard state={previewState} />
			</Card>
		</main>
	);
}

function FontPreviewCard({ state }: { state: FontUploadPreviewState }) {
	const previewFonts = getPreviewFonts(state);

	return (
		<Card variant="frosted" className="w-full max-w-3xl gap-0 border">
			<SolidCardHead title="Kerning Preview" className="bg-accent" />

			<div className="p-6">
				{previewFonts.length ? (
					<div className="divide-y divide-border">
						{previewFonts.map((slot) => (
							<FontSpecimenRow key={slot.label} {...slot} />
						))}
					</div>
				) : (
					<SupportedFontFormats />
				)}
			</div>
		</Card>
	);
}

function FontSpecimenRow({
	label,
	font,
}: {
	label: string;
	font: FontFamilyMeta;
}) {
	return (
		<div className="grid gap-4 py-5 first:pt-0 last:pb-0 sm:grid-cols-[170px_1fr]">
			<div>
				<div className="mono-label text-muted-foreground">{label}</div>
				<div
					className="mt-4 text-6xl font-semibold leading-none tracking-normal text-foreground"
					style={{ fontFamily: font.cssFamily }}
				>
					Aa
				</div>
			</div>

			<div
				className="self-end text-foreground"
				style={{ fontFamily: font.cssFamily }}
			>
				<p className="max-w-md text-2xl font-semibold leading-tight tracking-normal">
					The quick brown fox jumps over the lazy dog
				</p>
				<p className="mt-3 text-lg tracking-normal">0123456789</p>
				<p className="mt-1 text-lg tracking-normal">
					!@#$%^&*()_+-=[]{"{}"};:,.&lt;&gt;?/
				</p>
			</div>
		</div>
	);
}

function SupportedFontFormats() {
	const formats = [
		{
			name: "TTF",
			description: "TrueType Font",
			detail: "Reliable desktop font files with wide browser support.",
		},
		{
			name: "OTF",
			description: "OpenType Font",
			detail: "OpenType outlines, alternates, and rich typographic features.",
		},
		{
			name: "WOFF",
			description: "Web Open Font Format",
			detail: "Compressed web fonts made for fast loading in browsers.",
		},
		{
			name: "WOFF2",
			description: "Web Open Font Format 2.0",
			detail: "Modern, smaller web font files with excellent compression.",
		},
	];

	return (
		<div>
			<div className="max-w-xl">
				<div className="mono-label text-muted-foreground">
					Supported formats
				</div>
				<h2 className="mt-3 text-2xl font-semibold tracking-normal text-foreground">
					Upload a font to generate a live specimen preview.
				</h2>
				<p className="mt-2 text-sm leading-6 text-muted-foreground">
					Static families and variable fonts are supported. Kerning reads each
					file, groups matching faces, and keeps the preview local to this
					browser.
				</p>
			</div>

			<div className="mt-8 flex flex-col gap-3">
				{formats.map((format) => (
					<div
						key={format.name}
						className="flex gap-4 rounded-lg border border-border bg-surface-paper/70 p-4"
					>
						<div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-xs font-semibold text-primary">
							Ff
						</div>
						<div className="min-w-0">
							<div className="font-mono flex items-center text-sm font-semibold uppercase text-foreground">
								{format.name}:{" "}
								<span className="capitalize ml-2">{format.description}</span>
							</div>

							<p className="mt-1 text-xs leading-5 text-muted-foreground">
								{format.detail}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function getPreviewFonts(state: FontUploadPreviewState) {
	const slots = [
		{
			label: "Primary Font",
			fontId: state.primaryFontId,
		},
		{
			label: "Secondary Font 1",
			fontId: state.secondaryFontOneId,
		},
		{
			label: "Secondary Font 2",
			fontId: state.secondaryFontTwoId,
		},
	];

	return slots.flatMap((slot) => {
		const font = state.fonts.find((item) => item.id === slot.fontId);
		return font ? [{ label: slot.label, font }] : [];
	});
}
