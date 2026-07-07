declare module "wawoff2/build/decompress_binding.js" {
	type Woff2Decoder = {
		decompress?: (buffer: Uint8Array) => Uint8Array | false;
		onRuntimeInitialized?: () => void;
	};

	const decoder: Woff2Decoder;
	export default decoder;
}
