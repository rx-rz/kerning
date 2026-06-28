import { createId } from "@paralleldrive/cuid2";
import { openDB } from "idb";

const DB_NAME = "kerning-editor";
const IMAGE_STORE = "images";

export type StoredEditorImage = {
	id: string;
	name: string;
	type: string;
	blob: Blob;
	createdAt: string;
};

async function getImageDB() {
	return openDB(DB_NAME, 1, {
		upgrade(db) {
			if (!db.objectStoreNames.contains(IMAGE_STORE)) {
				db.createObjectStore(IMAGE_STORE, { keyPath: "id" });
			}
		},
	});
}

export async function saveEditorImage(id: string, file: File) {
	const db = await getImageDB();
	await db.put(IMAGE_STORE, {
		id,
		name: file.name,
		type: file.type,
		blob: file,
		createdAt: new Date().toISOString(),
	} satisfies StoredEditorImage);
}

export async function replaceEditorImage(
	file: File,
	previousId?: string | null,
) {
	const id = createId();
	await saveEditorImage(id, file);

	if (previousId) await deleteEditorImage(previousId);

	return id;
}

export async function getEditorImage(id: string) {
	const db = await getImageDB();
	return db.get(IMAGE_STORE, id) as Promise<StoredEditorImage | undefined>;
}

export async function deleteEditorImage(id: string) {
	const db = await getImageDB();
	await db.delete(IMAGE_STORE, id);
}
