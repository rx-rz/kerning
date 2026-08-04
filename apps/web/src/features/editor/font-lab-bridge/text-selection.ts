const ORDINARY_WHITESPACE = /^\s$/u;
const WORD = /[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*/gu;
const WORD_CHARACTER = /[\p{L}\p{M}\p{N}'’-]/u;

export function uniqueInspectableCharacters(text: string) {
	return [
		...new Set(
			Array.from(text).filter(
				(character) => !ORDINARY_WHITESPACE.test(character),
			),
		),
	];
}

export function adjacentInspectablePairs(text: string) {
	const characters = Array.from(text);
	const pairs: Array<{
		text: string;
		leftCodePoint: number;
		rightCodePoint: number;
	}> = [];
	const seen = new Set<string>();
	for (let index = 0; index < characters.length - 1; index += 1) {
		const left = characters[index];
		const right = characters[index + 1];
		if (
			!left ||
			!right ||
			(ORDINARY_WHITESPACE.test(left) && ORDINARY_WHITESPACE.test(right))
		)
			continue;
		const leftCodePoint = left.codePointAt(0);
		const rightCodePoint = right.codePointAt(0);
		if (leftCodePoint === undefined || rightCodePoint === undefined) continue;
		const key = `${leftCodePoint}:${rightCodePoint}`;
		if (seen.has(key)) continue;
		seen.add(key);
		pairs.push({ text: `${left}${right}`, leftCodePoint, rightCodePoint });
	}
	return pairs;
}

export function uniqueInspectableWords(text: string) {
	return [...new Set(text.match(WORD) ?? [])];
}

export function selectedWordFromRange(text: string, start = 0, end = start) {
	if (!text) return "";
	let wordStart = Math.max(0, Math.min(start, text.length));
	let wordEnd = Math.max(wordStart, Math.min(end, text.length));
	while (wordStart > 0 && WORD_CHARACTER.test(text[wordStart - 1] ?? ""))
		wordStart -= 1;
	while (wordEnd < text.length && WORD_CHARACTER.test(text[wordEnd] ?? ""))
		wordEnd += 1;
	const expanded = text.slice(wordStart, wordEnd).match(WORD)?.[0];
	return expanded ?? uniqueInspectableWords(text)[0] ?? "";
}

export function unicodeLabel(character: string) {
	const codePoint = character.codePointAt(0) ?? 0;
	return `${character} · U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

export function classifyCharacterSupport(
	text: string,
	supportedCodePoints: ReadonlySet<number>,
) {
	const supported: string[] = [];
	const missing: string[] = [];
	for (const character of uniqueInspectableCharacters(text)) {
		const target = supportedCodePoints.has(character.codePointAt(0) ?? -1)
			? supported
			: missing;
		target.push(character);
	}
	return { supported, missing };
}
