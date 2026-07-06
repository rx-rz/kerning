import { createDefaultTextureFill } from "#/features/editor/lib/card-fill";
import type {
	CardAspectRatio,
	CardSettings,
	EditorCard,
	EditorNode,
	FontType,
	ImageNode,
	ShapeNode,
	TextNode,
	TextureCardFill,
} from "#/features/editor/types";

export type EditorTemplate = {
	id: string;
	name: string;
	category: "Album covers" | "Movie posters";
	aspectRatio: CardAspectRatio;
	card: EditorCard;
};

type TemplateSpec = {
	title: string;
	subtitle: string;
	background: string;
	secondary: string;
	texture: string;
	ink: string;
	accent: string;
};

const PORTRAITS = [
	"2a22e4e6-89d3-4874-a008-6a71ff2eab16",
	"a9473f87-9e71-471f-a8e3-3123afe1c11b",
	"422b202a-bf7e-4053-97d0-422ded6a8165",
	"71eebb90-df11-4b53-8e44-da186c2b3196",
	"1de06cc3-ba0d-4d5e-9a7e-8765ec96f000",
	"c5bf3870-2cbc-4134-93ce-b5dd892f9d5f",
	"d2d1dc93-8399-4188-bbca-9ae6344417a4",
	"47c02d7f-7519-4f61-a194-2131a48dd576",
	"ec9f0f05-9b5c-4706-ac70-d154d9b06f38",
	"433cee80-07fa-4830-afc3-283ce7106711",
	"8bbe2b05-2462-48d8-9f4c-45f656523a24",
	"843177f8-3d9a-42fc-9720-09cb3b47194c",
	"269067c0-641a-4463-9c91-ca0a270f0be3",
	"eeda8280-80e0-4b16-a71c-5364bcf34d85",
	"22f3e8f7-e5da-40ea-9f62-507eb4db0291",
	"d3390ad0-8fb1-4416-87a7-d109d31e26ca",
	"8187d1ce-ed88-445c-9f58-1ad08e613e66",
	"b56bc46b-33ba-4257-b85c-473485282640",
	"a82e5f09-65e8-4eb0-8c40-d35876dc994e",
	"7ab70d75-b7f9-4abb-9e1a-91f61922d139",
	"023e2a1f-238d-444a-a2ba-f7a76ef8864b",
	"62c21481-87df-43c0-a100-92fbeb48ae55",
	"9478fa0f-b3d4-4aad-894b-2d793f90be42",
	"d8324d85-87d9-4cae-8c63-3c803db3a48c",
	"d649f130-ab7b-4fa4-87fd-0f9dce8754d3",
	"131f6aae-6ba6-482b-bb7f-1fcb718f5b02",
	"72d86d95-456f-4a6b-b63f-59331a35bb67",
	"9af121f9-de12-44b8-95c2-1c06bdca7ad7",
	"e8479336-e98c-41fa-9db9-5a6303971fcd",
	"a02d87c0-83ec-425b-8e39-52ace2060911",
	"67669f1f-d2a4-4230-aa8c-137aa0d15dc5",
	"dff6d38b-5d58-43eb-853a-5835f2617103",
	"65358b06-de85-4ac0-86ac-461e723dba2c",
	"ac63c618-41c7-4326-9410-01d2ed33f5c4",
	"a5c89afd-0967-44b1-b974-366c348cf7b6",
	"ac2a433b-41d2-41a4-91bf-eaa3df53f54f",
	"979fddfe-9a8b-4e4d-811d-333a7fcbdb83",
	"5561189a-578a-4a21-b8ca-bd9bbf525154",
	"e6023edc-5dc4-435e-9e35-13a7e1e4225e",
	"6df2af09-f221-4244-8f55-eeffe68d6a96",
].map((id) => `https://cdn.cosmos.so/${id}?format=webp&w=400`);

const OBJECTS = [
	"93eedbb2-fe16-43a1-8b5a-2f3c2df97d72",
	"bb97c1d6-cecb-4669-9c01-f942bd1d58a9",
	"8a33e0a6-cf83-4b0c-9795-14cc3c80417a",
	"b4a1d79c-f3d8-48cf-ac6b-9f64dc260914",
	"6467c211-3927-45de-bfeb-01b6426c64ee",
	"61e9c32b-2c6f-4cdc-9d58-6dcb7fe6cd7f",
	"156e0b83-8ee0-4978-bc49-1d1e4a67422b",
	"c4a74274-6b12-419e-abb8-fd016b1ed056",
	"99a1e9a0-064c-445c-aa2e-f0e08fc4d7ab",
	"bea8b8af-0a6a-48c3-8a1f-977be376b4b1",
	"2f94d1d6-f514-44fa-9560-b85e9daef576",
	"337a198f-0bc1-4c9d-bca4-cd5ddaf39d5e",
	"aead85b8-3d97-4734-8fd1-f629839da963",
	"1ae65e48-c058-49d4-9127-fad8f9c32210",
	"669b7431-af28-486f-b1e6-c531b6a7d572",
	"b88915c2-ebf0-4505-85d2-6a24e74c8aa7",
	"fc29c831-c54b-4451-b2f6-46e2bc4f40e1",
	"5136cedb-9f91-40a4-93b0-fa8ae5c23634",
	"025217ea-c563-427b-beba-3799a473f5c6",
	"a196c7d5-ed3a-4e9c-8aec-e5c6e3c90e99",
	"69fa5555-7a08-4d2f-9ba1-3a5fa028bec9",
	"38550029-e193-471d-af0c-f3cc0009e5a1",
	"23e80f91-c10f-41e3-8845-d210f520011f",
	"9edab0d5-71cf-44b7-b223-b5ba55dfc338",
	"d04bf126-953c-47a9-8401-19a017a28693",
	"d135a3ef-7dd3-420f-96a4-cfa8d88e6b58",
	"f1721aab-0f58-4ad6-bbd3-5e01f83b5af1",
	"a30d1537-462e-4a25-9537-36428016ceca",
	"27997674-76a2-4ba0-bc80-b1680f8e80ff",
	"ce70b586-1694-45e8-b7a2-d20c4a997589",
	"0be4aa6a-5541-4c7d-b4db-10bf0156b16a",
	"a777c218-4bfe-41ba-a2ae-5d8e2262389b",
	"696bbcbf-c34f-46b6-8fd0-206a38a63503",
	"1254a064-6edf-488d-b993-b19b92cb2c16",
	"8b72c915-2ff8-47d0-b2e8-d2fb3a28cae8",
	"b5256fd6-974e-45ce-a020-dd668ad2524e",
	"9af90a14-2b0f-4ea9-98e8-24ea971a2de5",
	"dc800dd2-1cfb-43b9-a7e8-2a973d0accb6",
	"e6402bd1-e918-4b1e-8478-63d576f65de1",
	"cb3b1994-f668-4a12-a9e8-d0744c07ccf5",
].map((id) => `https://cdn.cosmos.so/${id}?format=webp&w=400`);

const TEXTURES = [
	"26907ff0-66ae-415b-8265-0abcc796f49b",
	"76439e62-783a-4e56-975c-403ec4aa0e56",
	"9519a695-f156-492b-9cb2-6e47d77c9fe3",
	"03ba2fb8-a4bf-489b-a0cb-17926b234865",
	"f868fc3d-ec1b-4d7d-8bd9-74092fbb9798",
	"e66b2490-8047-46c3-99a1-c0cdcc736281",
	"79c1be79-dda5-497e-b877-99d1006e17f9",
	"7d2a3600-1755-4431-a699-08779484d612",
	"bbcf1735-0ae7-4464-87bd-8548505acd2b",
	"0e13e286-e9d5-4bcc-abcf-5f5ab9a20709",
	"0473c375-3aec-4b3f-afc1-dfbb226aa302",
	"e8cd52b8-527f-4375-b0ea-0f19502e6a26",
	"a04e2d05-0b8b-455d-9b67-b278d4ae8973",
	"89a2b131-de0f-42a2-821d-708a72409d72",
	"d241359c-67aa-46e9-a191-dd10b09d400f",
	"c647640f-f0a1-40fb-9dff-24845f2f7796",
	"7b8a46f2-3d47-4aa5-83fc-61f068c22e4e",
	"04be0b5d-c5d6-46ea-99c5-19163eb120b0",
	"16bb9c6a-eecf-4556-a756-749622a37a51",
	"a3389094-6153-4fed-aebe-76e61d06b974",
].map((id) => `https://cdn.cosmos.so/${id}?format=webp&w=400`);

const ALBUM_META = [
	["brat", "CHARLI XCX", "#EAFD38", "#111111"],
	["VELVET STATIC", "MARA / 02", "#F4EBDD", "#D42E24"],
	["OBJECTS IN MIRROR", "NEON PRAIRIE", "#E8E3D7", "#161616"],
	["AFTER THE GARDEN", "AERIAL FORM", "#F3D7DC", "#183C2E"],
	["NO SAINTS", "BLK CHOIR", "#111111", "#F2F0E8"],
	["BLUE CEREMONY", "PARALLEL YOUTH", "#2447BD", "#F4E8C5"],
	["FOLD / UNFOLD", "SOFT MACHINE", "#F4F0E8", "#EC4B2D"],
	["NIGHT BOTANICA", "MIRA VALE", "#112D25", "#E9FF70"],
	["DUST LANGUAGE", "PUBLIC MEMORY", "#CBBBA5", "#231E19"],
	["THE BODY ELECTRIC", "KINO 04", "#FF5A36", "#251761"],
	["SILVER TEETH", "LUCIA NINE", "#D9D9D3", "#121212"],
	["OPEN WINDOWS", "COMMON FIELD", "#B9D8EF", "#E53F25"],
	["ROSE INDEX", "ANNA K", "#F1C7CD", "#761C28"],
	["TWIN FLAME", "VANTA", "#111111", "#F22F47"],
	["HALF LIGHT", "NORTH / 00", "#E7E1D6", "#304C89"],
	["HEAVY PETALS", "ORBITAL UNIT", "#EBD8A4", "#412B76"],
	["SLOW BURN", "PALM HOUSE", "#232FA3", "#FFB348"],
	["STRANGE WEATHER", "LURA", "#DDE5DF", "#C3262E"],
	["OUTSIDE / IN", "MONO CLUB", "#101010", "#FF9EB5"],
	["BLOOMING NOISES", "TRACIN", "#EFE7D2", "#B72D2E"],
] as const;

const POSTER_META = [
	["SILVER EXIT", "THE ROAD REMEMBERS", "#E7E8E8", "#101112"],
	["DUSK COUNTRY", "EVEN THE MOUNTAINS FORGET", "#F1EEE7", "#11110F"],
	["A SOFT VIOLENCE", "BEAUTY LEAVES A MARK", "#F2EEE5", "#D62426"],
	["FAULT COLOUR", "SOME TRUTHS ARRIVE BRIGHT", "#F07845", "#0C1512"],
	["THE QUIET MOUTH", "SHE KEPT THE SHARPEST SILENCE", "#F2F2F0", "#17171A"],
	["FEVER SAINT", "HOLINESS HAS A TEMPERATURE", "#EFE5D7", "#AD2727"],
	["COLD ANIMAL", "LOVE WITHOUT WITNESSES", "#F4F0E6", "#121212"],
	["THE GILDED HOUR", "EVERY FAVOR LEAVES A BRUISE", "#EDE1CC", "#725B32"],
	["NINE WINDOWS", "SOMEONE IS ALWAYS AWAKE", "#F4F1EA", "#121212"],
	["RED DESERT", "THE DUST KNOWS HER NAME", "#B92328", "#F6E8D2"],
	["VÉRONIQUE", "NOTHING STAYS BURIED IN LIGHT", "#E4EAE8", "#152A31"],
	["THE ORNAMENT", "BEAUTY IS NEVER INNOCENT", "#F0ECE4", "#141414"],
	["NOTHING TWICE", "MEMORY REFUSES THE SECOND TAKE", "#F3F2ED", "#111111"],
	["ZERO HOUR", "MIDNIGHT ARRIVED EARLY", "#D6DB2C", "#171717"],
	["MIRROR STATE", "SHE WOKE UP ON BOTH SIDES", "#DCD6CF", "#2E2393"],
	["WHITE NOISE", "SILENCE HAS TEETH", "#F4F4EF", "#151515"],
	["A SMALL FIRE", "WINTER KEPT THE ASHES", "#331B18", "#FF765A"],
	["SOMEWHERE NORTH", "NO MAP SURVIVES THE COLD", "#B9D2E4", "#19233C"],
	["LAST FREQUENCY", "THE DEAD AIR IS LISTENING", "#111111", "#D8FF43"],
	["SEASON OF GLASS", "EVERY BLOOM HIDES A WOUND", "#EFE8D5", "#183C2E"],
] as const;

function buildSpecs(
	meta: readonly (readonly [string, string, string, string])[],
	offset: number,
): TemplateSpec[] {
	return meta.map(([title, subtitle, accent, ink], index) => ({
		title,
		subtitle,
		background: PORTRAITS[index + offset] ?? PORTRAITS[index] ?? "",
		secondary: OBJECTS[index + offset] ?? OBJECTS[index] ?? "",
		texture: TEXTURES[index % TEXTURES.length] ?? "",
		ink,
		accent,
	}));
}

const ALBUMS = buildSpecs(ALBUM_META, 0);
const POSTER_ART = [
	"https://cdn.cosmos.so/efd3219c-a749-4a28-b837-17c4fa411708?format=webp",
	"https://cdn.cosmos.so/98c09665-30ea-4579-bfec-3d6aa2915850?format=webp",
	"https://cdn.cosmos.so/c1c043ae-367e-42aa-a878-be7a301ab577?format=webp",
	"https://cdn.cosmos.so/fa292b44-a3a8-4e4c-95d0-8785fde7c7c5?format=webp",
	"https://cdn.cosmos.so/91867887-c3a6-4912-a3a5-2b480860612a?format=webp",
] as const;

const POSTERS = buildSpecs(POSTER_META, 20).map((spec, index) => {
	const artwork = POSTER_ART[index];
	return artwork ? { ...spec, background: artwork, secondary: artwork } : spec;
});

function texture(index: number): TextureCardFill | null {
	if (index % 4 === 3) return null;
	const choices: TextureCardFill["texture"][] = [
		"paper",
		"halftone",
		"halftone-cmyk",
		"fluted-glass",
	];
	const selected = choices[index % choices.length] ?? "paper";
	return {
		...createDefaultTextureFill(selected),
		opacity: index % 2 ? 0.12 : 0.2,
	};
}

function settings(
	aspectRatio: CardAspectRatio,
	spec: TemplateSpec,
	index: number,
): CardSettings {
	return {
		aspectRatio,
		fill: {
			type: "image",
			imageId: null,
			src: spec.background,
			opacity: 1,
			settings: {
				backgroundSize: "cover",
				originX: 35 + (index % 4) * 10,
				originY: 40 + (index % 3) * 10,
			},
		},
		texture: texture(index),
		opacity: 1,
		blur: 0,
		borderWidth: 0,
		borderStyle: "solid",
		borderColor: "#000000",
	};
}

function posterSettings(src: string): CardSettings {
	return {
		aspectRatio: "9:16",
		fill: {
			type: "image",
			imageId: null,
			src,
			opacity: 0,
			settings: { backgroundSize: "cover", originX: 50, originY: 50 },
		},
		texture: null,
		opacity: 1,
		blur: 0,
		borderWidth: 0,
		borderStyle: "solid",
		borderColor: "#000000",
	};
}

export type TemplateFontAvailability = Record<FontType, boolean>;

export function getTemplateFontType(id: string): FontType {
	if (/(?:title|first|last|vertical)$/.test(id)) return "primary";
	if (/(?:date|year|credit|studio|cat|meta|no|side)$/.test(id)) {
		return "sec2";
	}
	return "sec1";
}

export function resolveTemplateFontType(
	fontType: FontType,
	available: TemplateFontAvailability,
): FontType {
	const fallbackOrder: Record<FontType, FontType[]> = {
		primary: ["primary", "sec1", "sec2"],
		sec1: ["sec1", "primary", "sec2"],
		sec2: ["sec2", "sec1", "primary"],
	};

	return fallbackOrder[fontType].find((role) => available[role]) ?? "primary";
}

export function resolveTemplateFonts(
	card: EditorCard,
	available: TemplateFontAvailability,
): EditorCard {
	return {
		...card,
		nodes: card.nodes.map((node) =>
			node.type === "text"
				? {
						...node,
						fontType: resolveTemplateFontType(node.fontType, available),
					}
				: node,
		),
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
	const lineHeight = options.lineHeight ?? 0.9;
	const letterSpacing = options.letterSpacing ?? -1;
	const isDisplayText = /(?:title|first|last)$/.test(id);
	const approximateCharacterWidth = Math.max(
		fontSize * 0.5 + Math.max(letterSpacing, 0),
		1,
	);
	const charactersPerLine = Math.max(
		1,
		Math.floor(width / approximateCharacterWidth),
	);
	const estimatedLineCount = value
		.split("\n")
		.reduce(
			(lines, paragraph) =>
				lines + Math.max(1, Math.ceil(paragraph.length / charactersPerLine)),
			0,
		);
	const safeDisplayHeight = Math.ceil(
		estimatedLineCount * fontSize * lineHeight + fontSize * 0.18,
	);

	return {
		id,
		type: "text",
		x,
		y,
		width,
		height: isDisplayText ? Math.max(height, safeDisplayHeight) : height,
		text: value,
		fontType: getTemplateFontType(id),
		fontSize,
		fontWeight: 700,
		lineHeight,
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
	return {
		id,
		type: "shape",
		shapeType,
		shape: value,
		x,
		y,
		width,
		height,
		color,
	};
}

function image(
	id: string,
	src: string,
	x: number,
	y: number,
	width: number,
	height: number,
	options: Partial<ImageNode> = {},
): ImageNode {
	return {
		id,
		type: "image",
		src,
		imageId: null,
		alt: "Template image",
		x,
		y,
		width,
		height,
		objectFit: "cover",
		zoom: 1,
		positionX: 50,
		positionY: 50,
		effects: {
			brightness: 100,
			contrast: 100,
			saturation: 100,
			blur: 0,
			grayscale: 0,
			sepia: 0,
		},
		opacity: 1,
		blendMode: "normal",
		texture: null,
		...options,
	};
}

function albumNodes(spec: TemplateSpec, index: number): EditorNode[] {
	const { title, subtitle, secondary, texture: textureUrl, ink, accent } = spec;
	const catalog = `KRN—${String(index + 1).padStart(2, "0")}`;

	switch (index) {
		case 0:
			return [
				image("a0-paper", textureUrl, 0, 0, 500, 500, {
					opacity: 0.3,
					blendMode: "multiply",
				}),
				shape("a0-block", "rectangle", "rectangle", 26, 26, 448, 448, accent),
				image("a0-object", secondary, 126, 70, 248, 270, {
					blendMode: "multiply",
					effects: {
						brightness: 105,
						contrast: 135,
						saturation: 65,
						blur: 0,
						grayscale: 35,
						sepia: 0,
					},
				}),
				text("a0-title", title, 38, 344, 424, 92, 76, ink, {
					textAlign: "center",
					letterSpacing: -5,
					fontWeight: 500,
				}),
				text(
					"a0-meta",
					`${subtitle}  •  ${catalog}`,
					42,
					454,
					416,
					18,
					10,
					ink,
					{ textAlign: "center", letterSpacing: 2 },
				),
			];
		case 1:
			return [
				shape("a1-ground", "rectangle", "rectangle", 0, 0, 210, 500, accent),
				image("a1-cut", secondary, 178, 44, 282, 338, {
					effects: {
						brightness: 100,
						contrast: 120,
						saturation: 0,
						blur: 0,
						grayscale: 100,
						sepia: 10,
					},
				}),
				text("a1-title", title, 24, 42, 164, 212, 48, ink, {
					lineHeight: 0.82,
					letterSpacing: -3,
				}),
				shape("a1-rule", "line", "vertical", 210, 0, 4, 500, ink),
				text("a1-sub", subtitle, 230, 408, 230, 24, 13, ink, {
					letterSpacing: 3,
				}),
				text("a1-cat", catalog, 388, 462, 72, 16, 9, ink, {
					textAlign: "right",
				}),
			];
		case 2:
			return [
				shape("a2-panel", "rectangle", "rectangle", 34, 32, 432, 436, accent),
				image("a2-one", secondary, 58, 58, 172, 172, {
					effects: {
						brightness: 112,
						contrast: 135,
						saturation: 30,
						blur: 0,
						grayscale: 65,
						sepia: 0,
					},
				}),
				image("a2-two", textureUrl, 250, 58, 192, 172, {
					opacity: 0.72,
					blendMode: "multiply",
				}),
				image("a2-three", secondary, 58, 250, 384, 104, {
					positionY: 72,
					blendMode: "darken",
				}),
				text("a2-title", title, 58, 374, 384, 62, 42, ink, {
					letterSpacing: -2,
				}),
				text("a2-sub", `${subtitle} / ${catalog}`, 60, 444, 380, 16, 9, ink, {
					letterSpacing: 2,
				}),
			];
		case 3:
			return [
				image("a3-wash", textureUrl, 0, 0, 500, 500, {
					opacity: 0.38,
					blendMode: "screen",
				}),
				shape("a3-circle", "ellipse", "circle", 84, 64, 332, 332, accent),
				image("a3-flower", secondary, 120, 92, 260, 278, {
					blendMode: "multiply",
					effects: {
						brightness: 106,
						contrast: 120,
						saturation: 45,
						blur: 0,
						grayscale: 25,
						sepia: 10,
					},
				}),
				text("a3-title", title, 36, 180, 428, 112, 58, ink, {
					textAlign: "center",
					letterSpacing: -3,
					lineHeight: 0.84,
				}),
				text("a3-sub", subtitle, 98, 430, 304, 18, 11, ink, {
					textAlign: "center",
					letterSpacing: 4,
				}),
			];
		case 4:
			return [
				shape("a4-black", "rectangle", "rectangle", 0, 0, 500, 500, accent),
				image("a4-figure", secondary, 40, 34, 420, 430, {
					blendMode: "screen",
					effects: {
						brightness: 90,
						contrast: 150,
						saturation: 0,
						blur: 0,
						grayscale: 100,
						sepia: 0,
					},
				}),
				text("a4-title", title, 22, 30, 456, 90, 72, ink, {
					letterSpacing: -5,
				}),
				shape("a4-cross1", "line", "diagonal-down", 330, 308, 132, 132, ink),
				shape("a4-cross2", "line", "diagonal-up", 330, 308, 132, 132, ink),
				text("a4-sub", subtitle, 28, 458, 220, 18, 10, ink, {
					letterSpacing: 3,
				}),
			];
		case 5:
			return [
				image("a5-texture", textureUrl, 0, 0, 500, 500, {
					opacity: 0.22,
					blendMode: "overlay",
				}),
				shape("a5-blue", "rectangle", "rectangle", 24, 24, 452, 452, accent),
				image("a5-inset", secondary, 188, 58, 254, 282, {
					blendMode: "lighten",
				}),
				text("a5-title", title, 36, 280, 426, 112, 66, ink, {
					letterSpacing: -4,
					lineHeight: 0.82,
				}),
				text("a5-sub", subtitle, 38, 418, 250, 20, 12, ink, {
					letterSpacing: 2,
				}),
				text("a5-no", "05", 390, 412, 62, 46, 38, ink, { textAlign: "right" }),
			];
		case 6:
			return [
				shape("a6-paper", "rectangle", "rectangle", 54, 38, 392, 424, accent),
				image("a6-torn", secondary, 84, 78, 332, 226, {
					effects: {
						brightness: 112,
						contrast: 128,
						saturation: 15,
						blur: 0,
						grayscale: 85,
						sepia: 8,
					},
				}),
				image("a6-grain", textureUrl, 54, 38, 392, 424, {
					opacity: 0.2,
					blendMode: "multiply",
				}),
				text("a6-title", title, 80, 326, 340, 62, 46, ink, {
					textAlign: "center",
					letterSpacing: -2,
				}),
				shape("a6-rule", "line", "horizontal", 130, 402, 240, 10, ink),
				text("a6-meta", `${subtitle}\n${catalog}`, 120, 424, 260, 36, 10, ink, {
					textAlign: "center",
					lineHeight: 1.2,
					letterSpacing: 2,
				}),
			];
		case 7:
			return [
				shape("a7-ground", "rectangle", "rectangle", 0, 0, 500, 500, accent),
				image("a7-botanical", secondary, 160, 0, 340, 500, {
					blendMode: "screen",
					opacity: 0.9,
				}),
				text("a7-title", title, 24, 44, 214, 262, 62, ink, {
					lineHeight: 0.78,
					letterSpacing: -4,
				}),
				text("a7-sub", subtitle, 28, 390, 180, 42, 11, ink, {
					letterSpacing: 3,
					lineHeight: 1.2,
				}),
				shape("a7-star", "icon", "sparkles", 36, 448, 32, 32, ink),
			];
		case 8:
			return [
				image("a8-stone", textureUrl, 0, 0, 500, 500, {
					opacity: 0.5,
					blendMode: "multiply",
				}),
				image("a8-object", secondary, 134, 64, 232, 300, {
					effects: {
						brightness: 105,
						contrast: 145,
						saturation: 0,
						blur: 0,
						grayscale: 100,
						sepia: 25,
					},
				}),
				text("a8-title", title, 20, 22, 460, 90, 64, ink, {
					textAlign: "center",
					letterSpacing: -4,
				}),
				text("a8-side", "DUST\nLANGUAGE\nVOL. 09", 28, 340, 96, 88, 14, ink, {
					lineHeight: 1.1,
					letterSpacing: 1,
				}),
				text("a8-sub", subtitle, 292, 410, 176, 20, 11, ink, {
					textAlign: "right",
					letterSpacing: 2,
				}),
			];
		case 9:
			return [
				shape("a9-accent", "rectangle", "rectangle", 0, 0, 500, 500, accent),
				image("a9-double1", secondary, 36, 36, 286, 380, {
					opacity: 0.85,
					blendMode: "multiply",
				}),
				image("a9-double2", secondary, 178, 68, 286, 380, {
					opacity: 0.55,
					blendMode: "screen",
					positionX: 68,
				}),
				text("a9-title", title, 26, 356, 448, 94, 58, ink, {
					textAlign: "center",
					letterSpacing: -3,
				}),
				text("a9-sub", subtitle, 30, 462, 440, 18, 10, ink, {
					textAlign: "center",
					letterSpacing: 4,
				}),
			];
		case 10:
			return [
				shape("a10-ground", "rectangle", "rectangle", 0, 0, 500, 500, accent),
				image("a10-strip1", secondary, 26, 78, 138, 278, { positionX: 22 }),
				image("a10-strip2", secondary, 181, 78, 138, 278, {
					positionX: 50,
					effects: {
						brightness: 100,
						contrast: 125,
						saturation: 0,
						blur: 0,
						grayscale: 100,
						sepia: 0,
					},
				}),
				image("a10-strip3", secondary, 336, 78, 138, 278, { positionX: 78 }),
				text("a10-title", title, 24, 22, 452, 48, 40, ink, {
					letterSpacing: -2,
				}),
				text("a10-sub", subtitle, 28, 390, 300, 22, 13, ink, {
					letterSpacing: 4,
				}),
				text("a10-cat", catalog, 376, 448, 96, 18, 10, ink, {
					textAlign: "right",
				}),
			];
		case 11:
			return [
				shape("a11-sky", "rectangle", "rectangle", 0, 0, 500, 500, accent),
				shape("a11-window", "rectangle", "rectangle", 124, 96, 252, 252, ink),
				image("a11-object", secondary, 138, 110, 224, 224),
				shape("a11-circle", "ellipse", "circle", 208, 186, 84, 84, accent),
				text("a11-title", title, 24, 370, 452, 58, 52, ink, {
					textAlign: "center",
					letterSpacing: -3,
				}),
				text("a11-sub", subtitle, 24, 446, 452, 16, 10, ink, {
					textAlign: "center",
					letterSpacing: 5,
				}),
			];
		case 12:
			return [
				image("a12-paper", textureUrl, 0, 0, 500, 500, {
					opacity: 0.45,
					blendMode: "multiply",
				}),
				image("a12-rose", secondary, 250, 0, 250, 500, {
					blendMode: "multiply",
				}),
				shape("a12-line", "line", "vertical", 246, 0, 8, 500, ink),
				text("a12-title", title, 28, 36, 206, 168, 64, ink, {
					lineHeight: 0.82,
					letterSpacing: -4,
				}),
				text("a12-sub", subtitle, 30, 408, 190, 44, 11, ink, {
					letterSpacing: 3,
					lineHeight: 1.25,
				}),
			];
		case 13:
			return [
				shape("a13-black", "rectangle", "rectangle", 0, 0, 500, 500, accent),
				image("a13-one", secondary, 40, 40, 190, 420, {
					effects: {
						brightness: 95,
						contrast: 140,
						saturation: 0,
						blur: 0,
						grayscale: 100,
						sepia: 0,
					},
				}),
				image("a13-two", secondary, 270, 40, 190, 420, {
					positionX: 80,
					blendMode: "screen",
					opacity: 0.72,
				}),
				text("a13-title", title, 82, 182, 336, 132, 68, ink, {
					textAlign: "center",
					letterSpacing: -4,
					lineHeight: 0.8,
				}),
				shape("a13-cross", "icon", "asterisk", 222, 420, 56, 56, ink),
			];
		case 14:
			return [
				shape("a14-frame", "rectangle", "rectangle", 28, 28, 444, 444, accent),
				image("a14-image", secondary, 48, 48, 404, 316, { positionY: 25 }),
				image("a14-dust", textureUrl, 48, 48, 404, 316, {
					opacity: 0.26,
					blendMode: "screen",
				}),
				text("a14-title", title, 50, 378, 400, 54, 46, ink, {
					textAlign: "center",
					letterSpacing: -2,
				}),
				text("a14-sub", `${subtitle} — ${catalog}`, 50, 446, 400, 16, 9, ink, {
					textAlign: "center",
					letterSpacing: 2,
				}),
			];
		case 15:
			return [
				shape("a15-ground", "rectangle", "rectangle", 0, 0, 500, 500, accent),
				image("a15-petal", secondary, 66, 68, 368, 364, {
					blendMode: "multiply",
					opacity: 0.92,
				}),
				shape("a15-orbit", "icon", "orbit", 152, 142, 196, 196, ink),
				text("a15-title", title, 22, 26, 456, 70, 58, ink, {
					textAlign: "center",
					letterSpacing: -4,
				}),
				text("a15-sub", subtitle, 76, 448, 348, 18, 10, ink, {
					textAlign: "center",
					letterSpacing: 4,
				}),
			];
		case 16:
			return [
				shape("a16-blue", "rectangle", "rectangle", 0, 0, 500, 500, accent),
				shape("a16-stage", "rectangle", "rectangle", 56, 52, 388, 308, ink),
				image("a16-hand", secondary, 84, 70, 332, 294, { blendMode: "screen" }),
				shape("a16-sun", "ellipse", "circle", 182, 134, 136, 136, "#FF6B2C"),
				text("a16-title", title, 42, 374, 416, 64, 54, ink, {
					textAlign: "center",
					letterSpacing: -3,
				}),
				text("a16-sub", subtitle, 42, 452, 416, 16, 10, ink, {
					textAlign: "center",
					letterSpacing: 3,
				}),
			];
		case 17:
			return [
				image("a17-cloud", secondary, 0, 0, 500, 350, { positionY: 25 }),
				shape("a17-paper", "rectangle", "rectangle", 0, 342, 500, 158, accent),
				text("a17-title", title, 22, 362, 456, 64, 52, ink, {
					letterSpacing: -3,
				}),
				text("a17-sub", subtitle, 24, 446, 250, 18, 11, ink, {
					letterSpacing: 2,
				}),
				text("a17-cat", catalog, 386, 446, 90, 18, 10, ink, {
					textAlign: "right",
				}),
			];
		case 18:
			return [
				shape("a18-black", "rectangle", "rectangle", 0, 0, 500, 500, accent),
				image("a18-flower", secondary, 50, 36, 400, 428, {
					blendMode: "screen",
					effects: {
						brightness: 110,
						contrast: 135,
						saturation: 30,
						blur: 0,
						grayscale: 45,
						sepia: 0,
					},
				}),
				image("a18-halftone", textureUrl, 0, 0, 500, 500, {
					opacity: 0.3,
					blendMode: "overlay",
				}),
				text("a18-title", title, 20, 26, 460, 104, 70, ink, {
					lineHeight: 0.78,
					letterSpacing: -5,
				}),
				text("a18-sub", subtitle, 28, 454, 444, 18, 11, ink, {
					textAlign: "right",
					letterSpacing: 4,
				}),
			];
		default:
			return [
				image("a19-paper", textureUrl, 0, 0, 500, 500, {
					opacity: 0.5,
					blendMode: "multiply",
				}),
				shape("a19-tape1", "rectangle", "rectangle", 42, 92, 416, 48, accent),
				image("a19-bloom", secondary, 112, 102, 276, 276, {
					blendMode: "multiply",
				}),
				shape("a19-tape2", "rectangle", "rectangle", 42, 352, 416, 48, accent),
				text("a19-title", title, 64, 174, 372, 120, 62, ink, {
					textAlign: "center",
					lineHeight: 0.82,
					letterSpacing: -4,
				}),
				text("a19-sub", `${subtitle} / ${catalog}`, 60, 438, 380, 18, 10, ink, {
					textAlign: "center",
					letterSpacing: 3,
				}),
			];
	}
}

function posterNodes(spec: TemplateSpec, index: number): EditorNode[] {
	const { title, subtitle, secondary, texture: textureUrl, ink, accent } = spec;
	const credits = `KER NING PICTURES PRESENTS  •  ${subtitle}  •  2027`;

	switch (index) {
		case 0:
			return [
				shape("p0-ground", "rectangle", "rectangle", 0, 0, 360, 640, "#E7E8E8"),
				image("p0-car", secondary, 18, 18, 324, 292, { positionY: 44 }),
				shape("p0-rule", "line", "horizontal", 22, 330, 316, 2, "#697075"),
				text(
					"p0-eyebrow",
					"A KERNING PICTURES FILM  /  09.18.27",
					24,
					350,
					312,
					16,
					8,
					"#697075",
					{
						letterSpacing: 1.6,
					},
				),
				text(
					"p0-title-shadow",
					"SILVER\nEXIT",
					26,
					375,
					310,
					150,
					70,
					"#AEB4B7",
					{
						lineHeight: 0.78,
						letterSpacing: -4,
						fontWeight: 500,
					},
				),
				text("p0-title", title.replace(" ", "\n"), 22, 371, 310, 150, 70, ink, {
					lineHeight: 0.78,
					letterSpacing: -4,
					fontWeight: 500,
				}),
				text("p0-tag", subtitle, 24, 542, 312, 18, 10, "#3D4143", {
					letterSpacing: 2.2,
				}),
				text(
					"p0-credits",
					"NORTHLINE FILMS  •  MARA VEIL  •  NOAH GREY\nDIRECTED BY ELI VOSS  /  MUSIC BY INA WREN",
					24,
					582,
					312,
					34,
					6,
					"#697075",
					{
						lineHeight: 1.35,
						letterSpacing: 0.6,
					},
				),
			];
		case 1:
			return [
				shape("p1-ground", "rectangle", "rectangle", 0, 0, 360, 640, "#F2EFE7"),
				image("p1-landscape", secondary, 10, 10, 340, 492, { positionY: 48 }),
				text("p1-title", title, 14, 516, 332, 44, 36, ink, {
					textAlign: "center",
					letterSpacing: -2.6,
					fontWeight: 700,
				}),
				shape("p1-dot", "ellipse", "circle", 18, 584, 10, 10, "#CB4F45"),
				text("p1-sub", subtitle, 38, 580, 270, 17, 8, ink, {
					letterSpacing: 1.35,
				}),
				text("p1-date", "OCTOBER 3", 280, 580, 64, 17, 8, ink, {
					textAlign: "right",
				}),
				text(
					"p1-credits",
					"STILL WATER PRESENTS  •  A FILM BY REN ITO\nWITH EMI SATO  /  CINEMATOGRAPHY LEO MORI",
					18,
					610,
					324,
					24,
					6,
					"#4B4B47",
					{
						textAlign: "center",
						lineHeight: 1.25,
					},
				),
			];
		case 2:
			return [
				shape("p2-ground", "rectangle", "rectangle", 0, 0, 360, 640, "#F2EEE5"),
				image("p2-collage", secondary, 0, 0, 360, 430, { positionY: 48 }),
				text(
					"p2-kicker",
					"THE NEW FILM FROM LENA ORR",
					22,
					448,
					316,
					14,
					7,
					"#171717",
					{ letterSpacing: 2.2 },
				),
				text("p2-title", "A SOFT\nVIOLENCE", 20, 470, 320, 108, 57, ink, {
					letterSpacing: -3.6,
					lineHeight: 0.78,
				}),
				text("p2-sub", subtitle, 22, 584, 210, 16, 8, "#171717", {
					letterSpacing: 1.6,
				}),
				text("p2-date", "11.07.27", 276, 584, 62, 16, 8, "#171717", {
					textAlign: "right",
				}),
				text(
					"p2-credits",
					"MOTH HOUSE  •  AYA BELL  •  CELIA NORTH  •  JON VALE\nWRITTEN & DIRECTED BY LENA ORR",
					22,
					612,
					316,
					22,
					6,
					"#171717",
					{ lineHeight: 1.2 },
				),
			];
		case 3:
			return [
				image("p3-field", secondary, 0, 0, 360, 640, { positionX: 51 }),
				text("p3-studio", "KERNING / PICTURES", 20, 18, 150, 14, 7, "#101713", {
					letterSpacing: 2,
				}),
				text("p3-title", "FAULT\nCOLOUR", 18, 52, 252, 116, 58, ink, {
					lineHeight: 0.8,
					letterSpacing: -3.5,
				}),
				shape("p3-orange", "rectangle", "rectangle", 18, 500, 324, 112, accent),
				text("p3-tag", subtitle, 30, 516, 286, 20, 10, ink, {
					letterSpacing: 1.5,
				}),
				text("p3-hook", "A shape can keep a secret.", 30, 548, 286, 16, 9, ink),
				text(
					"p3-credits",
					"PAPER SUN FILMS  •  MIRA SOL  •  TOM ARDEN\nA FILM BY NICO RHEE  /  08.22.27",
					30,
					578,
					286,
					24,
					6,
					ink,
					{ lineHeight: 1.25 },
				),
			];
		case 4:
			return [
				image("p4-portrait", secondary, 0, 0, 360, 640, { positionY: 50 }),
				text("p4-title", "THE QUIET\nMOUTH", 20, 18, 320, 110, 55, ink, {
					lineHeight: 0.8,
					letterSpacing: -3.8,
				}),
				text("p4-tag", subtitle, 22, 134, 300, 16, 8, "#343338", {
					letterSpacing: 1.7,
				}),
				shape("p4-rule", "line", "horizontal", 22, 164, 96, 2, ink),
				text("p4-date", "IN CINEMAS  /  12.05.27", 22, 178, 190, 14, 7, ink, {
					letterSpacing: 1.7,
				}),
				text(
					"p4-credit",
					"PALE ROOM PRESENTS  •  EVE LAURENT\nA FILM BY SASKIA REED  /  MUSIC BY LOW CHOIR",
					22,
					596,
					316,
					28,
					6,
					"#F4F2EC",
					{
						lineHeight: 1.3,
						letterSpacing: 0.5,
					},
				),
			];
		case 5:
			return [
				image("p5-face", secondary, 0, 0, 360, 478, { positionY: 20 }),
				shape("p5-footer", "rectangle", "rectangle", 0, 478, 360, 162, accent),
				text("p5-title", title, 18, 490, 158, 82, 48, ink, {
					lineHeight: 0.8,
					letterSpacing: -3,
				}),
				text(
					"p5-cast",
					"MARA VEIL  TOM ARDEN\nIVA NORTH  LEO MORI",
					190,
					502,
					154,
					54,
					8,
					ink,
					{ lineHeight: 1.25 },
				),
				text("p5-sub", subtitle, 190, 574, 154, 18, 9, ink),
			];
		case 6:
			return [
				shape("p6-ground", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				image("p6-pieces", secondary, 72, 62, 216, 392, {
					blendMode: "multiply",
					effects: {
						brightness: 104,
						contrast: 135,
						saturation: 0,
						blur: 0,
						grayscale: 100,
						sepia: 0,
					},
				}),
				shape("p6-dot1", "ellipse", "circle", 44, 540, 12, 12, ink),
				shape("p6-dot2", "ellipse", "circle", 64, 540, 12, 12, ink),
				shape("p6-dot3", "ellipse", "circle", 84, 540, 12, 12, ink),
				text("p6-title", title, 36, 476, 288, 58, 46, ink, {
					textAlign: "center",
					letterSpacing: -2,
				}),
				text("p6-credit", credits, 38, 568, 284, 40, 7, ink, {
					textAlign: "center",
					lineHeight: 1.3,
				}),
			];
		case 7:
			return [
				shape("p7-beige", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				text("p7-kicker", "T  H  E", 138, 30, 84, 16, 8, ink, {
					textAlign: "center",
					letterSpacing: 5,
				}),
				text("p7-title", title, 64, 54, 232, 52, 36, ink, {
					textAlign: "center",
					letterSpacing: 1,
					fontWeight: 500,
				}),
				shape("p7-border", "rectangle", "rectangle", 100, 268, 238, 272, ink),
				image("p7-frame", secondary, 112, 280, 214, 248, { positionY: 25 }),
				image("p7-front", secondary, 36, 386, 176, 212, {
					positionX: 20,
					blendMode: "multiply",
				}),
				text(
					"p7-cast",
					"ADA  MIRA  EVE\nVALE  SOL  WREN",
					60,
					122,
					240,
					36,
					8,
					ink,
					{ textAlign: "center", letterSpacing: 3 },
				),
			];
		case 8:
			return [
				shape("p8-paper", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				image("p8-grid1", secondary, 20, 20, 150, 190, { positionX: 25 }),
				image("p8-grid2", secondary, 190, 20, 150, 190, { positionX: 75 }),
				image("p8-grid3", secondary, 20, 230, 320, 160, { positionY: 78 }),
				text("p8-title", title, 20, 410, 320, 112, 62, ink, {
					lineHeight: 0.78,
					letterSpacing: -4,
				}),
				text("p8-sub", subtitle, 22, 544, 180, 20, 10, ink, {
					letterSpacing: 2,
				}),
				text("p8-year", "2027", 270, 544, 68, 20, 10, ink, {
					textAlign: "right",
				}),
			];
		case 9:
			return [
				shape("p9-red", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				image("p9-desert", secondary, 0, 118, 360, 366, {
					blendMode: "multiply",
				}),
				image("p9-scratch", textureUrl, 0, 0, 360, 640, {
					opacity: 0.26,
					blendMode: "screen",
				}),
				text("p9-title", title, 24, 28, 312, 82, 66, ink, {
					textAlign: "center",
					letterSpacing: -4,
				}),
				text("p9-sub", subtitle, 26, 520, 308, 22, 11, ink, {
					textAlign: "center",
					letterSpacing: 3,
				}),
				text("p9-credit", credits, 28, 570, 304, 38, 7, ink, {
					textAlign: "center",
					lineHeight: 1.2,
				}),
			];
		case 10:
			return [
				shape("p10-white", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				image("p10-field", secondary, 28, 30, 304, 176, { positionY: 65 }),
				image("p10-portrait", secondary, 126, 232, 108, 110, { positionX: 30 }),
				text("p10-first", "VÉRONIQUE", 40, 208, 280, 52, 36, ink, {
					letterSpacing: -2,
				}),
				text("p10-last", "LEROY", 110, 354, 140, 48, 38, ink, {
					textAlign: "center",
					letterSpacing: -2,
				}),
				text("p10-credit", credits, 44, 558, 272, 42, 7, ink, {
					textAlign: "center",
					lineHeight: 1.2,
				}),
			];
		case 11:
			return [
				shape("p11-white", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				text("p11-title", title, 26, 28, 308, 64, 42, ink, {
					letterSpacing: -2,
				}),
				text(
					"p11-copy",
					"FORM FOLLOWS MEMORY\nA STUDY IN STRUCTURE",
					28,
					102,
					156,
					50,
					9,
					ink,
					{ lineHeight: 1.3, letterSpacing: 1 },
				),
				image("p11-building", secondary, 30, 214, 300, 156, {
					effects: {
						brightness: 108,
						contrast: 120,
						saturation: 0,
						blur: 0,
						grayscale: 100,
						sepia: 5,
					},
				}),
				shape("p11-rule", "line", "horizontal", 30, 392, 300, 8, ink),
				text("p11-sub", subtitle, 30, 414, 220, 38, 14, ink, {
					lineHeight: 1.1,
				}),
				text(
					"p11-address",
					"BRANDENBURGISCHE STR. 65\nBERLIN",
					30,
					558,
					160,
					34,
					8,
					ink,
					{ lineHeight: 1.2 },
				),
			];
		case 12:
			return [
				shape("p12-white", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				text("p12-title", title, 16, 30, 328, 122, 70, ink, {
					lineHeight: 0.72,
					letterSpacing: -5,
				}),
				text("p12-vertical", "2027 KERNING SELECT", 286, 156, 58, 106, 9, ink, {
					textAlign: "right",
					lineHeight: 1.2,
				}),
				shape("p12-grid1", "line", "vertical", 78, 174, 8, 290, ink),
				shape("p12-grid2", "line", "vertical", 178, 174, 8, 290, ink),
				image("p12-image", secondary, 198, 344, 132, 86, {
					blendMode: "multiply",
				}),
				text("p12-copy", credits, 20, 524, 320, 74, 8, ink, {
					lineHeight: 1.15,
					letterSpacing: 1,
				}),
			];
		case 13:
			return [
				shape("p13-acid", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				image("p13-face", secondary, 52, 118, 256, 354, {
					blendMode: "multiply",
					effects: {
						brightness: 108,
						contrast: 140,
						saturation: 0,
						blur: 0,
						grayscale: 100,
						sepia: 0,
					},
				}),
				shape("p13-orbit", "icon", "orbit", 104, 210, 152, 152, ink),
				text("p13-title", title, 18, 26, 324, 82, 66, ink, {
					textAlign: "center",
					letterSpacing: -4,
				}),
				text("p13-sub", subtitle, 34, 520, 292, 24, 11, ink, {
					textAlign: "center",
					letterSpacing: 3,
				}),
			];
		case 14:
			return [
				shape("p14-paper", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				image("p14-left", secondary, 24, 24, 214, 414, {
					positionX: 30,
					opacity: 0.85,
				}),
				image("p14-right", secondary, 122, 80, 214, 414, {
					positionX: 72,
					blendMode: "difference",
					opacity: 0.65,
				}),
				text("p14-title", title, 26, 448, 308, 88, 54, ink, {
					lineHeight: 0.82,
					letterSpacing: -3,
				}),
				text("p14-sub", subtitle, 28, 550, 304, 20, 10, ink, {
					letterSpacing: 2,
				}),
			];
		case 15:
			return [
				shape("p15-white", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				image("p15-small", secondary, 112, 168, 136, 210, {
					effects: {
						brightness: 110,
						contrast: 150,
						saturation: 0,
						blur: 0,
						grayscale: 100,
						sepia: 0,
					},
				}),
				image("p15-noise", textureUrl, 0, 0, 360, 640, {
					opacity: 0.2,
					blendMode: "multiply",
				}),
				text("p15-title", title, 24, 28, 312, 70, 58, ink, {
					textAlign: "center",
					letterSpacing: -4,
				}),
				text("p15-sub", subtitle, 58, 416, 244, 24, 12, ink, {
					textAlign: "center",
					letterSpacing: 4,
				}),
				text("p15-credit", credits, 36, 558, 288, 46, 7, ink, {
					textAlign: "center",
					lineHeight: 1.2,
				}),
			];
		case 16:
			return [
				shape("p16-dark", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				image("p16-fire", secondary, 0, 0, 360, 500, {
					blendMode: "screen",
					opacity: 0.82,
				}),
				shape("p16-block", "rectangle", "rectangle", 22, 364, 316, 126, ink),
				text("p16-title", title, 34, 380, 292, 72, 52, accent, {
					letterSpacing: -3,
				}),
				text("p16-sub", subtitle, 36, 512, 288, 22, 11, ink, {
					letterSpacing: 3,
				}),
				text("p16-credit", credits, 36, 564, 288, 40, 7, ink, {
					lineHeight: 1.2,
				}),
			];
		case 17:
			return [
				shape("p17-sky", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				image("p17-land", secondary, 0, 0, 360, 380, { positionY: 68 }),
				shape("p17-window", "rectangle", "rectangle", 92, 108, 176, 176, ink),
				image("p17-window-image", secondary, 104, 120, 152, 152, {
					positionX: 20,
				}),
				text("p17-title", title, 28, 406, 304, 92, 58, ink, {
					textAlign: "center",
					lineHeight: 0.82,
					letterSpacing: -3,
				}),
				text("p17-sub", subtitle, 40, 526, 280, 22, 11, ink, {
					textAlign: "center",
					letterSpacing: 3,
				}),
			];
		case 18:
			return [
				shape("p18-black", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				image("p18-signal", secondary, 30, 104, 300, 366, {
					blendMode: "screen",
					effects: {
						brightness: 112,
						contrast: 160,
						saturation: 30,
						blur: 0,
						grayscale: 60,
						sepia: 0,
					},
				}),
				image("p18-static", textureUrl, 0, 0, 360, 640, {
					opacity: 0.35,
					blendMode: "overlay",
				}),
				text("p18-title", title, 18, 28, 324, 112, 58, ink, {
					lineHeight: 0.78,
					letterSpacing: -4,
				}),
				shape("p18-wave", "icon", "audio-waveform", 124, 478, 112, 112, ink),
				text("p18-sub", subtitle, 34, 600, 292, 18, 9, ink, {
					textAlign: "center",
					letterSpacing: 3,
				}),
			];
		default:
			return [
				shape("p19-paper", "rectangle", "rectangle", 0, 0, 360, 640, accent),
				image("p19-botanical", secondary, 0, 0, 360, 640, {
					blendMode: "multiply",
					opacity: 0.9,
				}),
				image("p19-grain", textureUrl, 0, 0, 360, 640, {
					opacity: 0.22,
					blendMode: "multiply",
				}),
				shape(
					"p19-label",
					"rectangle",
					"rectangle",
					28,
					176,
					304,
					288,
					"#EFE8D5",
				),
				text("p19-title", title, 42, 200, 276, 226, 54, ink, {
					textAlign: "center",
					lineHeight: 0.78,
					letterSpacing: -4,
				}),
				shape("p19-butterfly", "icon", "sparkles", 154, 448, 52, 52, ink),
				text("p19-sub", subtitle, 52, 566, 256, 22, 10, ink, {
					textAlign: "center",
					letterSpacing: 2,
				}),
			];
	}
}

function makeTemplate(
	spec: TemplateSpec,
	index: number,
	category: EditorTemplate["category"],
): EditorTemplate {
	const isAlbum = category === "Album covers";
	const width = isAlbum ? 500 : 360;
	const height = isAlbum ? 500 : 640;
	const aspectRatio = isAlbum ? "1:1" : "9:16";
	const prefix = isAlbum ? "album" : "poster";

	return {
		id: `${prefix}-${index + 1}`,
		name: spec.title,
		category,
		aspectRatio,
		card: {
			id: `${prefix}-${index + 1}`,
			name: spec.title,
			width,
			height,
			settings:
				!isAlbum && index < POSTER_ART.length
					? posterSettings(spec.background)
					: settings(aspectRatio, spec, index),
			nodes: isAlbum ? albumNodes(spec, index) : posterNodes(spec, index),
		},
	};
}

export const EDITOR_TEMPLATES: EditorTemplate[] = [
	...ALBUMS.map((spec, index) => makeTemplate(spec, index, "Album covers")),
	...POSTERS.map((spec, index) => makeTemplate(spec, index, "Movie posters")),
];
