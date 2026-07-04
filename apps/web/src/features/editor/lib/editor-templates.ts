import type {
	CardAspectRatio,
	CardSettings,
	EditorCard,
	EditorNode,
	ShapeNode,
	TextNode,
} from "#/features/editor/types";

export type EditorTemplate = {
	id: string;
	name: string;
	category: "Album covers" | "Movie posters";
	aspectRatio: CardAspectRatio;
	card: EditorCard;
};

const ALBUMS = [
	["brat", "charli xcx", "#8ACE00", "#101010"],
	["POSITIVE SPACE", "LURA / JORIE", "#E7E4DC", "#181818"],
	["NO SIGNAL", "VANTA", "#111111", "#F1F1EC"],
	["SALT MEMORY", "MIRA", "#F06F52", "#272727"],
	["SOFT MACHINE", "PALM UNIT", "#C9C1FF", "#352867"],
	["BLUE HOUR", "NORTH/00", "#2657D8", "#F4F2E8"],
	["FIELD NOTES", "ANNA K", "#E5DDC7", "#24231F"],
	["AFTER IMAGE", "KINO", "#E64A2E", "#131313"],
	["ORBITAL", "LUCA 02", "#D7D7D2", "#181818"],
	["HEAT MAP", "PUBLIC MEMORY", "#F4B000", "#4A170F"],
] as const;

const POSTERS = [
	["THE SILENT ROOM", "A FILM BY N. ADEY", "#101010", "#F1EFE8"],
	["AFTER THE FLOOD", "COMING THIS AUTUMN", "#D6E2E1", "#152A31"],
	["NINE WINDOWS", "AN OBSERVATION", "#ECE9E0", "#141414"],
	["RED DESERT", "A NEW FILM", "#D6462D", "#F4EBDD"],
	["THE LAST FREQUENCY", "TRANSMISSION 08", "#151515", "#D8FF43"],
	["SOMEWHERE NORTH", "35MM / 2026", "#BFD1E7", "#19233C"],
	["MIRROR STATE", "ONE BODY / TWO LIVES", "#E0D9D3", "#3320A3"],
	["WHITE NOISE", "PICTURE HOUSE", "#F4F4F1", "#161616"],
	["A SMALL FIRE", "WINTER SELECTION", "#351C19", "#FF765A"],
	["ZERO HOUR", "A FILM IN THREE PARTS", "#DADB32", "#171717"],
] as const;

function settings(aspectRatio: CardAspectRatio, background: string): CardSettings {
	return {
		aspectRatio,
		fill: { type: "solid", color: background },
		texture: null,
		opacity: 1,
		blur: 0,
		borderWidth: 0,
		borderStyle: "solid",
		borderColor: "#000000",
	};
}

function text(
	id: string,
	value: string,
	x: number,
	y: number,
	width: number,
	height: number,
	fontSize: number,
	color: string,
	options: Partial<TextNode> = {},
): TextNode {
	return {
		id,
		type: "text",
		x,
		y,
		width,
		height,
		text: value,
		fontType: "primary",
		fontSize,
		fontWeight: 700,
		lineHeight: 0.92,
		letterSpacing: -1,
		color,
		textAlign: "left",
		textCasing: "none",
		...options,
	};
}

function shape(
	id: string,
	shapeType: ShapeNode["shapeType"],
	value: string,
	x: number,
	y: number,
	width: number,
	height: number,
	color: string,
): ShapeNode {
	return { id, type: "shape", shapeType, shape: value, x, y, width, height, color };
}

function albumTemplate(
	entry: (typeof ALBUMS)[number],
	index: number,
): EditorTemplate {
	const [title, artist, background, foreground] = entry;
	const graphic: EditorNode =
		index % 3 === 0
			? shape(`a-${index}-graphic`, "ellipse", "circle", 285, 80, 150, 150, foreground)
			: index % 3 === 1
				? shape(`a-${index}-graphic`, "line", "diagonal-down", 248, 74, 210, 180, foreground)
				: shape(`a-${index}-graphic`, "icon", "audio-waveform", 286, 72, 150, 150, foreground);
	const nodes: EditorNode[] =
		index === 0
			? [
					text("brat-title", title, 118, 205, 265, 82, 58, foreground, {
						fontWeight: 500,
						letterSpacing: -3,
						textAlign: "center",
					}),
				]
			: [
					graphic,
					text(`a-${index}-title`, title, 34, 302, 432, 102, index % 2 ? 46 : 58, foreground, {
						textAlign: index % 2 ? "left" : "center",
						letterSpacing: index % 2 ? -2 : -3,
					}),
					text(`a-${index}-artist`, artist, 35, 445, 260, 24, 12, foreground, {
						fontWeight: 600,
						letterSpacing: 2,
					}),
					text(`a-${index}-catalog`, `KER—${String(index + 1).padStart(2, "0")}`, 380, 445, 84, 20, 10, foreground, {
						fontWeight: 500,
						textAlign: "right",
						letterSpacing: 1,
					}),
				];

	return {
		id: `album-${index + 1}`,
		name: title,
		category: "Album covers",
		aspectRatio: "1:1",
		card: {
			id: `album-${index + 1}`,
			name: title,
			width: 500,
			height: 500,
			settings: settings("1:1", background),
			nodes,
		},
	};
}

function posterTemplate(
	entry: (typeof POSTERS)[number],
	index: number,
): EditorTemplate {
	const [title, subtitle, background, foreground] = entry;
	const nodes: EditorNode[] = [
		shape(
			`p-${index}-graphic`,
			index % 2 ? "icon" : "rectangle",
			index % 2 ? (index % 4 === 1 ? "aperture" : "orbit") : "rectangle",
			index % 2 ? 82 : 42,
			index % 2 ? 174 : 150,
			index % 2 ? 196 : 276,
			index % 2 ? 196 : 260,
			foreground,
		),
		text(`p-${index}-title`, title, 28, index % 2 ? 38 : 430, 304, 132, index % 3 === 0 ? 54 : 44, foreground, {
			letterSpacing: -2.5,
			lineHeight: 0.88,
		}),
		text(`p-${index}-subtitle`, subtitle, 30, 588, 230, 20, 10, foreground, {
			fontWeight: 600,
			letterSpacing: 1.5,
		}),
		text(`p-${index}-year`, `20${26 + index}`, 294, 588, 38, 20, 10, foreground, {
			fontWeight: 600,
			textAlign: "right",
		}),
	];

	return {
		id: `poster-${index + 1}`,
		name: title,
		category: "Movie posters",
		aspectRatio: "9:16",
		card: {
			id: `poster-${index + 1}`,
			name: title,
			width: 360,
			height: 640,
			settings: settings("9:16", background),
			nodes,
		},
	};
}

export const EDITOR_TEMPLATES: EditorTemplate[] = [
	...ALBUMS.map(albumTemplate),
	...POSTERS.map(posterTemplate),
];
