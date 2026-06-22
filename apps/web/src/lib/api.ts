import { createId } from "@paralleldrive/cuid2";
import ky, { type KyInstance, type Options } from "ky";

import { publicEnv } from "./env";

type JSendResponse<T> = {
	status: "success" | "fail" | "error";
	data: T;
	message?: string;
};

type ErrorBody = {
	message?: string;
	[key: string]: unknown;
};

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class APIError extends Error {
	constructor(
		message: string,
		public readonly status: number = 500,
		public readonly details?: unknown,
	) {
		super(message);
		this.name = "APIError";
	}
}

const baseClient = ky.create({
	prefix: publicEnv.apiUrl,
	credentials: "include",
	hooks: {
		beforeRequest: [
			async ({ request }) => {
				if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
					request.headers.set(
						"Idempotency-Key",
						request.headers.get("Idempotency-Key") ?? createId(),
					);
				}
			},
		],
		afterResponse: [
			async ({ response }) => {
				if (!response.ok) {
					const errorBody = (await response
						.clone()
						.json()
						.catch(() => ({}))) as ErrorBody;

					throw new APIError(
						errorBody.message ??
							`HTTP ${response.status}: ${response.statusText}`,
						response.status,
						errorBody,
					);
				}
			},
		],
	},
});

class APIClient {
	private client: KyInstance = baseClient;

	get = this.client.get.bind(this.client);
	post = this.client.post.bind(this.client);
	put = this.client.put.bind(this.client);
	patch = this.client.patch.bind(this.client);
	delete = this.client.delete.bind(this.client);

	private getMethod(method: HttpMethod) {
		const methods = {
			GET: this.get,
			POST: this.post,
			PUT: this.put,
			PATCH: this.patch,
			DELETE: this.delete,
		};

		return methods[method];
	}

	async jsend<T>(
		url: string,
		method: HttpMethod = "POST",
		options?: Options,
	): Promise<T> {
		const response = await this.getMethod(method)(url, options);
		const json = await response.json<JSendResponse<T>>();

		if (json.status !== "success") {
			throw new APIError(json.message ?? "Request failed", 400, json);
		}

		return json.data;
	}

	async request<T>(url: string, options?: Options): Promise<T> {
		const response = await this.client(url, options);
		return response.json<T>();
	}
}

export const api = new APIClient();
