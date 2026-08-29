const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const optionalEnv = (value: string | undefined, fallback: string) =>
	trimTrailingSlash(value?.trim() || fallback);

const apiUrl = optionalEnv(
	import.meta.env.VITE_API_URL,
	"http://localhost:4004/api/v1",
);

export const publicEnv = {
	apiUrl,
};
