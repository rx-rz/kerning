export type CardAspectRatio =
	| "1:1"
	| "4:5"
	| "16:9"
	| "9:16"
	| "3:2"
	| "business-card";

export type CardSettings = {
	aspectRatio: CardAspectRatio;
};

export type FontType = "primary" | "sec1" | "sec2";

type BaseNode = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
};

export type TextNode = BaseNode & {
	type: "text";
	text: string;
	fontType: FontType;
	fontSize: number;
	fontWeight: number;
	lineHeight: number;
	color: string;
	textAlign: "left" | "center" | "right";
};

export type ImageNode = BaseNode & {
	type: "image";
	src: string;
	imageId: string | null;
	alt: string;
	objectFit: "cover" | "contain";
	opacity: number;
};

export type EditorNode = TextNode | ImageNode;
export type EditorNodePatch = Partial<TextNode> | Partial<ImageNode>;

export type EditorCard = {
	id: string;
	name: string;
	width: number;
	height: number;
	settings: CardSettings;
	background: string;
	borderRadius: number;
	nodes: EditorNode[];
};
