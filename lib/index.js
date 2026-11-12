import crypto$1, { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, extname, isAbsolute, join, resolve } from "node:path";
import z from "@deepseek-ai/schemastery";
import dns from "node:dns";
import https from "node:https";
import tls from "node:tls";
import { createServer } from "node:http";
//#region src/media-protocol.ts
const MANUAL_PAID_ACKNOWLEDGEMENT = "accept-possible-openrouter-charge";
function hasManualPaidAcknowledgement(value) {
	return value === MANUAL_PAID_ACKNOWLEDGEMENT;
}
//#endregion
//#region src/openrouter-media.js
const API_BASE = "https://openrouter.ai/api/v1";
const MEDIA_API_PATH = "/model-palette/api/media";
const REQUEST_TIMEOUT_MS = 18e4;
const DOWNLOAD_TIMEOUT_MS = 6e5;
const REQUEST_BODY_LIMIT$2 = 1048576;
const CREDENTIAL_PATTERN$1 = /^[A-Za-z_][A-Za-z0-9_]*$/;
const DEFAULT_CREDENTIAL_REF = "OPENROUTER_API_KEY";
const RESULT_SCHEMA = {
	type: "object",
	additionalProperties: true,
	properties: {}
};
const IMAGE_EXTENSIONS = /* @__PURE__ */ new Map([
	["image/png", ".png"],
	["image/jpeg", ".jpg"],
	["image/webp", ".webp"],
	["image/gif", ".gif"]
]);
function registerOpenRouterMedia(ctx, rawConfig) {
	const config = resolveConfig$1(rawConfig);
	mkdirSync(config.outputDir, { recursive: true });
	const tools = {
		models: modelsTool(ctx, config),
		image: imageTool(ctx, config),
		video: videoSubmitTool(ctx, config),
		status: videoStatusTool(ctx, config),
		download: videoDownloadTool(ctx, config)
	};
	ctx.effect(() => ctx.tools.register(tools.models), "dsh-model-palette: OpenRouter media catalog tool");
	ctx.effect(() => ctx.tools.register(tools.image), "dsh-model-palette: OpenRouter image tool");
	ctx.effect(() => ctx.tools.register(tools.video), "dsh-model-palette: OpenRouter video submit tool");
	ctx.effect(() => ctx.tools.register(tools.status), "dsh-model-palette: OpenRouter video status tool");
	ctx.effect(() => ctx.tools.register(tools.download), "dsh-model-palette: OpenRouter video download tool");
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: MEDIA_API_PATH,
		handler: createMediaApiHandler({
			models: (args, signal) => tools.models.execute(args, { signal }),
			image: (args, signal) => executeImage(ctx, config, args, { signal }, true),
			video: (args, signal) => executeVideo(ctx, config, args, { signal }, true),
			status: (args, signal) => tools.status.execute(args, { signal }),
			download: (args, signal) => tools.download.execute(args, { signal })
		})
	}), "dsh-model-palette: direct media API");
}
function createMediaApiHandler(actions) {
	const routes = /* @__PURE__ */ new Map([
		[`${MEDIA_API_PATH}/models`, actions.models],
		[`${MEDIA_API_PATH}/images/generate`, actions.image],
		[`${MEDIA_API_PATH}/videos/generate`, actions.video],
		[`${MEDIA_API_PATH}/videos/status`, actions.status],
		[`${MEDIA_API_PATH}/videos/download`, actions.download]
	]);
	return async (req, res) => {
		if (req.method !== "POST") {
			writeJson$4(res, 405, {
				ok: false,
				error: { message: "method not allowed" }
			});
			return;
		}
		if (!isTrustedBrowserRequest$2(req)) {
			writeJson$4(res, 403, {
				ok: false,
				error: { message: "cross-site request rejected" }
			});
			return;
		}
		if (!String(req.headers["content-type"] ?? "").toLocaleLowerCase().startsWith("application/json")) {
			writeJson$4(res, 415, {
				ok: false,
				error: { message: "application/json is required" }
			});
			return;
		}
		let pathname;
		try {
			pathname = new URL(req.url ?? "/", "http://dsh.internal").pathname;
		} catch {
			writeJson$4(res, 400, {
				ok: false,
				error: { message: "invalid request path" }
			});
			return;
		}
		const action = routes.get(pathname);
		if (action === void 0) {
			writeJson$4(res, 404, {
				ok: false,
				error: { message: "unknown media action" }
			});
			return;
		}
		const controller = new AbortController();
		const abort = () => controller.abort();
		req.once("aborted", abort);
		try {
			writeJson$4(res, 200, {
				ok: true,
				value: await action(await readJsonBody$2(req), controller.signal)
			});
		} catch (error) {
			writeJson$4(res, mediaErrorStatus(error), {
				ok: false,
				error: { message: errorMessage$3(error) }
			});
		} finally {
			req.removeListener("aborted", abort);
		}
	};
}
function isTrustedBrowserRequest$2(req) {
	const site = req.headers["sec-fetch-site"];
	return site === void 0 || site === "same-origin" || site === "same-site" || site === "none";
}
async function readJsonBody$2(req) {
	let text = "";
	for await (const chunk of req) {
		text += chunk;
		if (Buffer.byteLength(text) > REQUEST_BODY_LIMIT$2) throw new Error("request body is too large");
	}
	if (text.trim() === "") return {};
	try {
		return JSON.parse(text);
	} catch {
		throw new Error("request body must be valid JSON");
	}
}
function writeJson$4(res, status, value) {
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
		"x-content-type-options": "nosniff"
	});
	res.end(JSON.stringify(value));
}
function mediaErrorStatus(error) {
	const message = errorMessage$3(error);
	if (message.startsWith("OpenRouter ")) return 502;
	if (message.includes("not configured in DSH")) return 503;
	return 400;
}
function errorMessage$3(error) {
	return error instanceof Error ? error.message : String(error);
}
/**
* Zero-config by default: reuse the DSH credential store's OPENROUTER_API_KEY
* (the same key the chat routes use) and write outputs under ~/.dsh/media-output.
* `enabled: false` opts out; every field stays overridable through plugin config.
*/
function resolveConfig$1(rawConfig) {
	const source = rawConfig === void 0 || rawConfig === null ? {} : rawConfig;
	const credentialRef = source.credentialRef === void 0 || source.credentialRef === "" ? DEFAULT_CREDENTIAL_REF : requireString$1(source.credentialRef, "credentialRef");
	if (!CREDENTIAL_PATTERN$1.test(credentialRef)) throw new TypeError(`credentialRef must match ${String(CREDENTIAL_PATTERN$1)}`);
	const rawOutputDir = source.outputDir === void 0 || source.outputDir === "" ? join(homedir(), ".dsh", "media-output") : requireString$1(source.outputDir, "outputDir");
	if (!isAbsolute(rawOutputDir)) throw new TypeError("outputDir must be absolute");
	return {
		credentialRef,
		outputDir: resolve(rawOutputDir),
		allowPaidImages: source.allowPaidImages === void 0 ? false : requireBoolean(source.allowPaidImages, "allowPaidImages"),
		allowPaidVideos: source.allowPaidVideos === void 0 ? false : requireBoolean(source.allowPaidVideos, "allowPaidVideos"),
		preferredImageModels: optionalStringArray(source.preferredImageModels, "preferredImageModels"),
		preferredVideoModels: optionalStringArray(source.preferredVideoModels, "preferredVideoModels")
	};
}
function requireString$1(value, field) {
	if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${field} must be a non-empty string`);
	return value.trim();
}
function requireBoolean(value, field) {
	if (typeof value !== "boolean") throw new TypeError(`${field} must be boolean`);
	return value;
}
function optionalStringArray(value, field) {
	if (value === void 0) return [];
	if (!Array.isArray(value)) throw new TypeError(`${field} must be a string array`);
	const normalized = value.map((entry) => requireString$1(entry, field));
	if (new Set(normalized).size !== normalized.length) throw new TypeError(`${field} contains duplicates`);
	return normalized;
}
function modelsTool(ctx, config) {
	return {
		name: "openrouter_media_models",
		description: "Inspect live OpenRouter image/video generation models and pricing without generating media.",
		parameters: {
			type: "object",
			additionalProperties: false,
			properties: {
				kind: {
					type: "string",
					enum: [
						"image",
						"video",
						"all"
					]
				},
				preferred_only: { type: "boolean" },
				free_only: { type: "boolean" }
			}
		},
		output: {
			schema: RESULT_SCHEMA,
			render: (_args, value) => [{
				type: "text",
				text: renderModels(value)
			}]
		},
		isConcurrencySafe: () => true,
		presentCall: (args) => ({
			card: "generic",
			title: "OpenRouter media models",
			kind: "search",
			rawInput: args
		}),
		async execute(args, exec) {
			const kind = args?.kind ?? "all";
			if (![
				"image",
				"video",
				"all"
			].includes(kind)) throw new Error("kind must be image, video, or all");
			const preferredOnly = args?.preferred_only === true;
			const freeOnly = args?.free_only === true;
			const result = {
				kind,
				preferred_only: preferredOnly,
				free_only: freeOnly,
				paid_images_enabled: config.allowPaidImages,
				paid_videos_enabled: config.allowPaidVideos,
				images: [],
				videos: []
			};
			if (kind === "image" || kind === "all") result.images = await listImages(ctx, config, preferredOnly, freeOnly, exec.signal);
			if (kind === "video" || kind === "all") result.videos = await listVideos(ctx, config, preferredOnly, freeOnly, exec.signal);
			return result;
		}
	};
}
function imageTool(ctx, config) {
	return {
		name: "openrouter_generate_image",
		description: "Generate or edit images through OpenRouter POST /api/v1/images and save returned bytes locally. Paid generation obeys plugin configuration.",
		parameters: {
			type: "object",
			additionalProperties: false,
			properties: {
				model: { type: "string" },
				prompt: { type: "string" },
				resolution: { type: "string" },
				aspect_ratio: { type: "string" },
				quality: { type: "string" },
				output_format: { type: "string" },
				n: {
					type: "integer",
					minimum: 1,
					maximum: 8
				},
				reference_images: {
					type: "array",
					items: { type: "string" },
					maxItems: 8
				},
				output_name: { type: "string" }
			},
			required: ["model", "prompt"]
		},
		output: {
			schema: RESULT_SCHEMA,
			render: (_args, value) => [{
				type: "text",
				text: renderImageResult(value)
			}]
		},
		isConcurrencySafe: () => true,
		presentCall: (args) => ({
			card: "generic",
			title: "Generate OpenRouter image",
			rawInput: args
		}),
		async execute(args, exec) {
			return executeImage(ctx, config, args, exec, false);
		}
	};
}
async function executeImage(ctx, config, args, exec, allowManualOverride) {
	const model = requireString$1(args?.model, "model");
	const prompt = requireString$1(args?.prompt, "prompt");
	const entry = (await imageCatalog(ctx, config, exec.signal)).find((candidate) => candidate.id === model);
	if (!entry) throw new Error(`OpenRouter image model not found: ${model}`);
	const endpoints = await imageEndpoints(ctx, config, entry, exec.signal);
	const freeEndpoint = endpoints.find((endpoint) => imageEndpointIsFree(endpoint) && typeof endpoint.provider_tag === "string" && endpoint.provider_tag !== "");
	const manualPaidOverride = allowManualOverride && !freeEndpoint && hasManualPaidAcknowledgement(args?.manual_paid_acknowledgement);
	if (!freeEndpoint && !config.allowPaidImages && !manualPaidOverride) throw new Error(`OpenRouter does not report a free image endpoint. Select the model manually in the media panel and confirm the possible charge, or enable allowPaidImages. ${pricingText(model, endpoints)}`);
	const body = {
		model,
		prompt
	};
	copyOptional(body, args, [
		"resolution",
		"aspect_ratio",
		"quality",
		"output_format",
		"n"
	]);
	if (Array.isArray(args.reference_images) && args.reference_images.length > 0) body.input_references = await Promise.all(args.reference_images.map(async (source) => ({
		type: "image_url",
		image_url: { url: await imageSource(source) }
	})));
	if (freeEndpoint) body.provider = {
		only: [freeEndpoint.provider_tag],
		allow_fallbacks: false
	};
	const response = await apiJson(ctx, config, "/images", {
		method: "POST",
		body,
		signal: exec.signal
	});
	const records = Array.isArray(response.data) ? response.data : [];
	if (records.length === 0) throw new Error("OpenRouter returned no images");
	const files = [];
	for (let index = 0; index < records.length; index += 1) {
		const record = records[index];
		const mediaType = typeof record.media_type === "string" ? record.media_type : "image/png";
		const bytes = await imageBytes(record, ctx, config, exec.signal);
		const path = outputPath(config.outputDir, args.output_name, IMAGE_EXTENSIONS.get(mediaType) ?? ".img", index, records.length);
		await writeFile(path, bytes);
		files.push({
			path,
			media_type: mediaType,
			bytes: bytes.byteLength
		});
	}
	return {
		model,
		free_endpoint: Boolean(freeEndpoint),
		manual_paid_override: manualPaidOverride,
		files,
		usage: response.usage ?? null
	};
}
function videoSubmitTool(ctx, config) {
	return {
		name: "openrouter_generate_video",
		description: "Submit asynchronous OpenRouter video generation. Poll with openrouter_video_status, then download with openrouter_download_video.",
		parameters: {
			type: "object",
			additionalProperties: false,
			properties: {
				model: { type: "string" },
				prompt: { type: "string" },
				duration: {
					type: "integer",
					minimum: 1,
					maximum: 60
				},
				resolution: { type: "string" },
				aspect_ratio: { type: "string" },
				size: { type: "string" },
				generate_audio: { type: "boolean" },
				seed: { type: "integer" },
				first_frame: { type: "string" },
				last_frame: { type: "string" },
				reference_images: {
					type: "array",
					items: { type: "string" },
					maxItems: 8
				}
			},
			required: ["model", "prompt"]
		},
		output: {
			schema: RESULT_SCHEMA,
			render: (_args, value) => [{
				type: "text",
				text: `Submitted video job ${value.id}; status=${value.status}.`
			}]
		},
		isConcurrencySafe: () => true,
		presentCall: (args) => ({
			card: "generic",
			title: "Submit OpenRouter video",
			rawInput: args
		}),
		async execute(args, exec) {
			return executeVideo(ctx, config, args, exec, false);
		}
	};
}
async function executeVideo(ctx, config, args, exec, allowManualOverride) {
	const model = requireString$1(args?.model, "model");
	const prompt = requireString$1(args?.prompt, "prompt");
	const entry = (await videoCatalog(ctx, config, exec.signal)).find((candidate) => candidate.id === model);
	if (!entry) throw new Error(`OpenRouter video model not found: ${model}`);
	const free = videoModelIsFree(entry);
	const manualPaidOverride = allowManualOverride && !free && hasManualPaidAcknowledgement(args?.manual_paid_acknowledgement);
	if (!free && !config.allowPaidVideos && !manualPaidOverride) throw new Error(`OpenRouter does not report this video model as free. Select it manually in the media panel and confirm the possible charge, or enable allowPaidVideos. ${JSON.stringify(entry.pricing_skus ?? {})}`);
	const body = {
		model,
		prompt
	};
	copyOptional(body, args, [
		"duration",
		"resolution",
		"aspect_ratio",
		"size",
		"generate_audio",
		"seed"
	]);
	const frames = [];
	if (typeof args.first_frame === "string" && args.first_frame.trim() !== "") frames.push({
		type: "image_url",
		image_url: { url: await imageSource(args.first_frame) },
		frame_type: "first_frame"
	});
	if (typeof args.last_frame === "string" && args.last_frame.trim() !== "") frames.push({
		type: "image_url",
		image_url: { url: await imageSource(args.last_frame) },
		frame_type: "last_frame"
	});
	if (frames.length > 0) body.frame_images = frames;
	if (frames.length === 0 && Array.isArray(args.reference_images) && args.reference_images.length > 0) body.input_references = await Promise.all(args.reference_images.map(async (source) => ({
		type: "image_url",
		image_url: { url: await imageSource(source) }
	})));
	const response = await apiJson(ctx, config, "/videos", {
		method: "POST",
		body,
		signal: exec.signal
	});
	return {
		id: response.id,
		polling_url: response.polling_url,
		status: response.status,
		model,
		free_endpoint: free,
		manual_paid_override: manualPaidOverride,
		pricing_skus: entry.pricing_skus ?? {}
	};
}
function videoStatusTool(ctx, config) {
	return {
		name: "openrouter_video_status",
		description: "Poll an existing OpenRouter video job without creating a new generation charge.",
		parameters: {
			type: "object",
			additionalProperties: false,
			properties: { job_id: { type: "string" } },
			required: ["job_id"]
		},
		output: {
			schema: RESULT_SCHEMA,
			render: (_args, value) => [{
				type: "text",
				text: JSON.stringify(value, null, 2)
			}]
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			return apiJson(ctx, config, `/videos/${encodeURIComponent(safeJobId(args?.job_id))}`, { signal: exec.signal });
		}
	};
}
function videoDownloadTool(ctx, config) {
	return {
		name: "openrouter_download_video",
		description: "Download a completed OpenRouter video job to the configured output directory.",
		parameters: {
			type: "object",
			additionalProperties: false,
			properties: {
				job_id: { type: "string" },
				output_name: { type: "string" }
			},
			required: ["job_id"]
		},
		output: {
			schema: RESULT_SCHEMA,
			render: (_args, value) => [{
				type: "text",
				text: `Video saved to ${value.path} (${value.bytes} bytes).`
			}]
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const jobId = safeJobId(args?.job_id);
			const status = await apiJson(ctx, config, `/videos/${encodeURIComponent(jobId)}`, { signal: exec.signal });
			if (status.status !== "completed") throw new Error(`Video job ${jobId} is ${String(status.status ?? "unknown")}`);
			const response = await apiFetch(ctx, config, `/videos/${encodeURIComponent(jobId)}/content`, {
				signal: exec.signal,
				timeoutMs: DOWNLOAD_TIMEOUT_MS
			});
			const bytes = Buffer.from(await response.arrayBuffer());
			const mediaType = response.headers.get("content-type");
			const extension = mediaType?.includes("webm") ? ".webm" : mediaType?.includes("quicktime") ? ".mov" : ".mp4";
			const path = outputPath(config.outputDir, args.output_name ?? jobId, extension, 0, 1);
			await writeFile(path, bytes);
			return {
				job_id: jobId,
				path,
				bytes: bytes.byteLength,
				media_type: mediaType
			};
		}
	};
}
async function listImages(ctx, config, preferredOnly, freeOnly, signal) {
	const preferred = new Set(config.preferredImageModels);
	let catalog = await imageCatalog(ctx, config, signal);
	if (preferredOnly) catalog = catalog.filter((entry) => preferred.has(entry.id));
	const records = await mapLimit(catalog, 6, async (entry) => {
		const endpoints = await imageEndpoints(ctx, config, entry, signal);
		return {
			id: entry.id,
			name: entry.name,
			preferred: preferred.has(entry.id),
			free: endpoints.some(imageEndpointIsFree),
			architecture: entry.architecture ?? null,
			supported_parameters: entry.supported_parameters ?? {},
			pricing: endpoints.map((endpoint) => ({
				provider: endpoint.provider_tag ?? endpoint.provider_name ?? null,
				pricing: endpoint.pricing ?? null
			}))
		};
	});
	return freeOnly ? records.filter((entry) => entry.free) : records;
}
async function listVideos(ctx, config, preferredOnly, freeOnly, signal) {
	const preferred = new Set(config.preferredVideoModels);
	let catalog = await videoCatalog(ctx, config, signal);
	if (preferredOnly) catalog = catalog.filter((entry) => preferred.has(entry.id));
	const records = catalog.map((entry) => ({
		id: entry.id,
		name: entry.name,
		preferred: preferred.has(entry.id),
		free: videoModelIsFree(entry),
		pricing_skus: entry.pricing_skus ?? {},
		supported_resolutions: entry.supported_resolutions ?? [],
		supported_aspect_ratios: entry.supported_aspect_ratios ?? [],
		supported_durations: entry.supported_durations ?? []
	}));
	return freeOnly ? records.filter((entry) => entry.free) : records;
}
async function imageCatalog(ctx, config, signal) {
	const response = await apiJson(ctx, config, "/images/models", { signal });
	return Array.isArray(response.data) ? response.data : [];
}
async function imageEndpoints(ctx, config, entry, signal) {
	const response = await apiJson(ctx, config, typeof entry.endpoints === "string" ? entry.endpoints.replace(/^https:\/\/openrouter\.ai/u, "").replace(/^\/api\/v1/u, "") : `/images/models/${entry.id}/endpoints`, { signal });
	return Array.isArray(response.endpoints) ? response.endpoints : [];
}
async function videoCatalog(ctx, config, signal) {
	const response = await apiJson(ctx, config, "/videos/models", { signal });
	return Array.isArray(response.data) ? response.data : [];
}
function imageEndpointIsFree(endpoint) {
	const lines = Array.isArray(endpoint.pricing) ? endpoint.pricing : endpoint.pricing ? [endpoint.pricing] : [];
	return lines.length > 0 && lines.every((line) => Number(line?.cost_usd) === 0);
}
function videoModelIsFree(entry) {
	const values = Object.values(entry.pricing_skus ?? {});
	return values.length > 0 && values.every((value) => Number(value) === 0);
}
function pricingText(model, endpoints) {
	return `${model}: ${JSON.stringify(endpoints.map((endpoint) => ({
		provider: endpoint.provider_tag ?? endpoint.provider_name ?? "unknown",
		pricing: endpoint.pricing ?? null
	})))}`;
}
async function apiJson(ctx, config, path, options = {}) {
	const text = await (await apiFetch(ctx, config, path, options)).text();
	if (text.trim() === "") return {};
	try {
		return JSON.parse(text);
	} catch {
		throw new Error(`OpenRouter returned invalid JSON: ${text.slice(0, 500)}`);
	}
}
async function apiFetch(ctx, config, path, options = {}) {
	const resolved = await ctx.credentials.resolve(config.credentialRef);
	if (!resolved) throw new Error(`Credential ${config.credentialRef} is not configured in DSH`);
	const headers = new Headers(options.headers);
	headers.set("Authorization", `Bearer ${resolved.value}`);
	headers.set("Accept", "application/json");
	headers.set("X-Title", "DSH Model Palette OpenRouter Media");
	const body = options.body === void 0 ? void 0 : JSON.stringify(options.body);
	if (body !== void 0) headers.set("Content-Type", "application/json");
	const timeout = AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS);
	const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
	const url = path.startsWith("https://") ? path : `${API_BASE}${path}`;
	const response = await fetch(url, {
		method: options.method ?? "GET",
		headers,
		body,
		signal,
		redirect: "follow"
	});
	if (!response.ok) {
		const message = await response.text().catch(() => "");
		throw new Error(`OpenRouter ${response.status} ${response.statusText}: ${message.slice(0, 1e3)}`);
	}
	return response;
}
async function imageSource(rawSource) {
	const source = requireString$1(rawSource, "image source");
	if (/^https?:\/\//iu.test(source) || /^data:image\//iu.test(source)) return source;
	if (!isAbsolute(source)) throw new Error(`Local image path must be absolute: ${source}`);
	const bytes = await readFile(source);
	return `data:${localImageType(extname(source))};base64,${bytes.toString("base64")}`;
}
function localImageType(extension) {
	switch (extension.toLocaleLowerCase()) {
		case ".jpg":
		case ".jpeg": return "image/jpeg";
		case ".webp": return "image/webp";
		case ".gif": return "image/gif";
		case ".png": return "image/png";
		default: throw new Error(`Unsupported image extension: ${extension || "(none)"}`);
	}
}
async function imageBytes(record, ctx, config, signal) {
	if (typeof record.b64_json === "string" && record.b64_json !== "") return Buffer.from(record.b64_json, "base64");
	if (typeof record.url === "string" && record.url !== "") {
		const response = await apiFetch(ctx, config, record.url, {
			signal,
			timeoutMs: DOWNLOAD_TIMEOUT_MS
		});
		return Buffer.from(await response.arrayBuffer());
	}
	throw new Error("Image record contains neither b64_json nor url");
}
function outputPath(outputDir, rawName, extension, index, total) {
	const requested = typeof rawName === "string" && rawName.trim() !== "" ? rawName.trim() : `openrouter-${Date.now()}-${randomUUID().slice(0, 8)}`;
	if (basename(requested) !== requested || requested === "." || requested === "..") throw new Error("output_name must not contain directories");
	const sourceExtension = extname(requested);
	const stem = requested.slice(0, sourceExtension === "" ? requested.length : -sourceExtension.length).replace(/[^A-Za-z0-9._-]+/gu, "-");
	return join(outputDir, `${stem}${total > 1 ? `-${index + 1}` : ""}${extension}`);
}
function safeJobId(value) {
	const jobId = requireString$1(value, "job_id");
	if (!/^[A-Za-z0-9._-]+$/u.test(jobId)) throw new Error("job_id contains invalid characters");
	return jobId;
}
function copyOptional(target, source, keys) {
	for (const key of keys) if (source?.[key] !== void 0) target[key] = source[key];
}
async function mapLimit(items, limit, fn) {
	const results = new Array(items.length);
	let cursor = 0;
	async function worker() {
		while (cursor < items.length) {
			const index = cursor++;
			results[index] = await fn(items[index], index);
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
	return results;
}
function renderModels(value) {
	const lines = [`Paid images: ${value.paid_images_enabled ? "enabled" : "blocked"}`, `Paid videos: ${value.paid_videos_enabled ? "enabled" : "blocked"}`];
	for (const model of value.images ?? []) lines.push(`image ${model.id}: free=${model.free}`);
	for (const model of value.videos ?? []) lines.push(`video ${model.id}: free=${model.free}`);
	return lines.join("\n");
}
function renderImageResult(value) {
	const lines = [`Generated ${value.files?.length ?? 0} image(s) with ${value.model}.`];
	for (const file of value.files ?? []) lines.push(`${file.path} (${file.media_type}, ${file.bytes} bytes)`);
	if (value.usage?.cost !== void 0) lines.push(`Reported cost: $${value.usage.cost}`);
	return lines.join("\n");
}
//#endregion
//#region src/model-config-api.js
const CONFIG_API_PATH = "/model-palette/api/config";
const OPENROUTER_MODELS_URL$1 = "https://openrouter.ai/api/v1/models";
const REQUEST_BODY_LIMIT$1 = 65536;
const PROBE_MAX_OUTPUT_TOKENS = 16;
const CATALOG_TIMEOUT_MS$2 = 2e4;
const BATCH_PROVIDER_LIMIT = 100;
const PROTOCOL_MODEL_LIMIT = 100;
const PROTOCOL_PROBE_CONCURRENCY = 4;
const MODEL_RESOLVE_CONCURRENCY = 8;
const DIAGNOSTIC_LENGTH_LIMIT = 240;
const CLOUDFLARE_BLOCK_PATTERN$2 = /(?:Attention Required!\s*\|\s*Cloudflare|cdn-cgi\/styles\/cf\.errors\.css|cf-error-details)/iu;
const CREDENTIAL_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PROTOCOLS = ["openai-completions", "openai-responses"];
const API_KEY_PROTOCOLS = [
	"openai-completions",
	"openai-responses",
	"anthropic-messages"
];
/** Register the loopback-only credential reveal route used by the configuration panel. */
function registerModelConfigApi(ctx) {
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: CONFIG_API_PATH,
		handler: createModelConfigApiHandler(ctx)
	}), "dsh-model-palette: model configuration API");
}
/** Create the model-configuration HTTP handler. */
function createModelConfigApiHandler(ctx) {
	return async (req, res) => {
		if (req.method !== "POST") {
			writeJson$3(res, 405, {
				ok: false,
				error: { message: "method not allowed" }
			});
			return;
		}
		if (!isTrustedBrowserRequest$1(req)) {
			writeJson$3(res, 403, {
				ok: false,
				error: { message: "cross-site request rejected" }
			});
			return;
		}
		if (!String(req.headers["content-type"] ?? "").toLocaleLowerCase().startsWith("application/json")) {
			writeJson$3(res, 415, {
				ok: false,
				error: { message: "application/json is required" }
			});
			return;
		}
		let pathname;
		try {
			pathname = new URL(req.url ?? "/", "http://dsh.internal").pathname;
		} catch {
			writeJson$3(res, 400, {
				ok: false,
				error: { message: "invalid request path" }
			});
			return;
		}
		if (pathname === `${CONFIG_API_PATH}/protocols/probe`) {
			await probeProtocols(ctx, req, res);
			return;
		}
		if (pathname === `${CONFIG_API_PATH}/credentials/validate`) {
			await validateApiKey(ctx, req, res);
			return;
		}
		if (pathname === `${CONFIG_API_PATH}/credentials/validate-batch`) {
			await validateApiKeysBatch(ctx, req, res);
			return;
		}
		if (pathname === `${CONFIG_API_PATH}/models/openrouter/free`) {
			await listOpenRouterFreeModels(res);
			return;
		}
		if (pathname === `${CONFIG_API_PATH}/models/resolve`) {
			await resolveProviderModels(ctx, req, res);
			return;
		}
		if (pathname !== `${CONFIG_API_PATH}/credentials/reveal`) {
			writeJson$3(res, 404, {
				ok: false,
				error: { message: "unknown configuration action" }
			});
			return;
		}
		if (!isDirectLoopbackRequest(req)) {
			writeJson$3(res, 403, {
				ok: false,
				error: { message: "credential reveal is available only on direct localhost access" }
			});
			return;
		}
		try {
			const ref = requireCredentialRef((await readJsonBody$1(req))?.ref);
			const resolved = await ctx.credentials.resolve(ref);
			if (resolved === void 0) {
				writeJson$3(res, 404, {
					ok: false,
					error: { message: `credential ${ref} is not configured` }
				});
				return;
			}
			writeJson$3(res, 200, {
				ok: true,
				value: { value: resolved.value }
			});
		} catch (error) {
			writeJson$3(res, 400, {
				ok: false,
				error: { message: errorMessage$2(error) }
			});
		}
	};
}
async function listOpenRouterFreeModels(res) {
	try {
		const response = await fetch(OPENROUTER_MODELS_URL$1, {
			headers: {
				"accept": "application/json",
				"user-agent": "DSH-Model-Palette/0.7"
			},
			signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS$2)
		});
		if (!response.ok) throw new Error(await responseMessage(response));
		const models = parseOpenRouterFreeModels(await response.json());
		writeJson$3(res, 200, {
			ok: true,
			value: {
				checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
				models
			}
		});
	} catch (error) {
		writeJson$3(res, 502, {
			ok: false,
			error: { message: `OpenRouter model catalog failed: ${errorMessage$2(error)}` }
		});
	}
}
/** Convert the public OpenRouter catalog into DSH-compatible free text-model candidates. */
function parseOpenRouterFreeModels(value) {
	if (value === null || typeof value !== "object" || !Array.isArray(value.data)) throw new Error("OpenRouter returned an invalid model catalog");
	const models = [];
	const seen = /* @__PURE__ */ new Set();
	for (const entry of value.data) {
		if (entry === null || typeof entry !== "object") continue;
		const id = typeof entry.id === "string" ? entry.id.trim() : "";
		if (!id.toLocaleLowerCase().endsWith(":free") || seen.has(id)) continue;
		const architecture = entry.architecture !== null && typeof entry.architecture === "object" ? entry.architecture : {};
		const output = stringArray(architecture.output_modalities);
		if (output.length > 0 && !output.includes("text")) continue;
		const input = stringArray(architecture.input_modalities).filter((modality) => modality === "text" || modality === "image");
		if (input.length === 0) continue;
		const topProvider = entry.top_provider !== null && typeof entry.top_provider === "object" ? entry.top_provider : {};
		const contextWindow = positiveInteger$1(entry.context_length);
		const maxTokens = positiveInteger$1(topProvider.max_completion_tokens);
		const supported = stringArray(entry.supported_parameters);
		models.push({
			id,
			...typeof entry.name === "string" && entry.name.trim() !== "" ? { name: entry.name.trim() } : {},
			...contextWindow === void 0 ? {} : { contextWindow },
			...maxTokens === void 0 ? {} : { maxTokens },
			input,
			...supported.includes("reasoning") ? { reasoning: true } : {},
			free: true
		});
		seen.add(id);
	}
	return models;
}
function stringArray(value) {
	return Array.isArray(value) ? [...new Set(value.filter((entry) => typeof entry === "string"))] : [];
}
function positiveInteger$1(value) {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : void 0;
}
async function probeProtocols(ctx, req, res) {
	try {
		const body = await readJsonBody$1(req);
		const baseURL = requireBaseURL(body?.baseURL);
		const models = body?.models === void 0 ? void 0 : requireProtocolModels(body.models);
		const model = models === void 0 ? requireNonEmptyString(body?.model, "model") : void 0;
		const ref = requireCredentialRef(body?.credentialRef);
		const apiKey = optionalApiKey(body?.apiKey) ?? (await ctx.credentials.resolve(ref))?.value;
		if (apiKey === void 0) throw new Error(`credential ${ref} is not configured`);
		if (models !== void 0) {
			const results = [];
			for (let offset = 0; offset < models.length; offset += PROTOCOL_PROBE_CONCURRENCY) results.push(...await Promise.all(models.slice(offset, offset + PROTOCOL_PROBE_CONCURRENCY).map((model) => probeModelProtocols(baseURL, model, apiKey))));
			writeJson$3(res, 200, {
				ok: true,
				value: { results }
			});
			return;
		}
		writeJson$3(res, 200, {
			ok: true,
			value: { results: await Promise.all(PROTOCOLS.map((protocol) => probeProtocol(baseURL, model, apiKey, protocol))) }
		});
	} catch (error) {
		writeJson$3(res, 400, {
			ok: false,
			error: { message: errorMessage$2(error) }
		});
	}
}
async function probeModelProtocols(baseURL, model, apiKey) {
	const [completions, responses] = await Promise.all([probeProtocol(baseURL, model, apiKey, "openai-completions"), probeProtocol(baseURL, model, apiKey, "openai-responses")]);
	return {
		model,
		responses,
		completions,
		classification: responses.available ? completions.available ? "both" : "responses-preferred" : completions.available ? "completions-only" : "unsupported"
	};
}
async function resolveProviderModels(ctx, req, res) {
	try {
		const body = await readJsonBody$1(req);
		const provider = requireNonEmptyString(body?.provider, "provider");
		const ids = requireProtocolModels(body?.models);
		const models = [];
		for (let offset = 0; offset < ids.length; offset += MODEL_RESOLVE_CONCURRENCY) models.push(...await Promise.all(ids.slice(offset, offset + MODEL_RESOLVE_CONCURRENCY).map(async (id) => {
			const resolved = await ctx.llm.resolveModelInfo(provider, id);
			const input = stringArray(resolved.inputModalities).filter((modality) => modality === "text" || modality === "image");
			const contextWindow = positiveInteger$1(resolved.context?.contextWindow);
			const maxTokens = positiveInteger$1(resolved.defaultMaxTokens);
			return {
				id,
				...typeof resolved.name === "string" && resolved.name.trim() !== "" ? { name: resolved.name.trim() } : {},
				...contextWindow === void 0 ? {} : { contextWindow },
				...maxTokens === void 0 ? {} : { maxTokens },
				...input.length === 0 ? {} : { input }
			};
		})));
		writeJson$3(res, 200, {
			ok: true,
			value: { models }
		});
	} catch (error) {
		writeJson$3(res, 400, {
			ok: false,
			error: { message: errorMessage$2(error) }
		});
	}
}
async function validateApiKey(ctx, req, res) {
	try {
		const body = await readJsonBody$1(req);
		const baseURL = requireBaseURL(body?.baseURL);
		const protocol = requireProtocol(body?.protocol);
		const model = requireNonEmptyString(body?.model, "model");
		const ref = requireCredentialRef(body?.credentialRef);
		const draftApiKey = optionalApiKey(body?.apiKey);
		const resolved = await ctx.credentials.resolve(ref);
		const runtimeApiKey = optionalApiKey(resolved?.value);
		if (runtimeApiKey === void 0 && draftApiKey === void 0) throw new Error(`credential ${ref} is not configured`);
		writeJson$3(res, 200, {
			ok: true,
			value: await validateCredential(baseURL, protocol, model, runtimeApiKey, draftApiKey, resolved?.source)
		});
	} catch (error) {
		writeJson$3(res, 400, {
			ok: false,
			error: { message: errorMessage$2(error) }
		});
	}
}
async function validateApiKeysBatch(ctx, req, res) {
	try {
		const providers = requireBatchProviders((await readJsonBody$1(req))?.providers);
		const results = [];
		for (const provider of providers) {
			let model = provider.model;
			if (model === "") {
				try {
					model = (await ctx.llm.listModels(provider.provider))[0]?.id ?? "";
				} catch (error) {
					results.push({
						...provider,
						status: "unknown",
						checkedBy: "request",
						message: `could not resolve a runtime model for provider ${provider.provider}: ${errorMessage$2(error)}`
					});
					continue;
				}
				if (model === "") {
					results.push({
						...provider,
						status: "unknown",
						checkedBy: "request",
						message: `provider ${provider.provider} exposes no model for a live credential check`
					});
					continue;
				}
			}
			const resolved = await ctx.credentials.resolve(provider.credentialRef);
			const apiKey = optionalApiKey(resolved?.value);
			if (apiKey === void 0) {
				results.push({
					...provider,
					status: "missing",
					checkedBy: "request",
					message: `credential ${provider.credentialRef} is not configured`
				});
				continue;
			}
			const result = await validateModelRequest(provider.baseURL, provider.protocol, model, apiKey);
			results.push({
				...provider,
				model,
				...result,
				...resolved?.source === void 0 ? {} : { credentialSource: resolved.source }
			});
		}
		writeJson$3(res, 200, {
			ok: true,
			value: { results }
		});
	} catch (error) {
		writeJson$3(res, 400, {
			ok: false,
			error: { message: errorMessage$2(error) }
		});
	}
}
async function probeProtocol(baseURL, model, apiKey, protocol) {
	const path = protocol === "openai-completions" ? "/chat/completions" : "/responses";
	const body = protocol === "openai-completions" ? {
		model,
		messages: [{
			role: "user",
			content: "Reply only with OK."
		}],
		max_tokens: PROBE_MAX_OUTPUT_TOKENS,
		stream: true
	} : {
		model,
		input: "Reply only with OK.",
		max_output_tokens: PROBE_MAX_OUTPUT_TOKENS,
		stream: true
	};
	try {
		const response = await fetch(`${baseURL.replace(/\/+$/u, "")}${path}`, {
			method: "POST",
			headers: headersForProtocol(apiKey, protocol, true),
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(15e3)
		});
		if (response.ok) return {
			protocol,
			available: true
		};
		const error = await responseMessage(response, apiKey);
		return {
			protocol,
			available: false,
			httpStatus: response.status,
			failure: classifyProtocolFailure(response.status, error),
			error
		};
	} catch (error) {
		return {
			protocol,
			available: false,
			failure: "transport",
			error: errorMessage$2(error, apiKey)
		};
	}
}
async function validateCredential(baseURL, protocol, model, runtimeApiKey, draftApiKey, credentialSource) {
	if (runtimeApiKey === void 0) return {
		...await validateModelRequest(baseURL, protocol, model, draftApiKey),
		credentialTarget: "draft",
		runtimeConfigured: false
	};
	const runtimeResult = await validateModelRequest(baseURL, protocol, model, runtimeApiKey);
	if (draftApiKey === void 0 || draftApiKey === runtimeApiKey) return {
		...runtimeResult,
		credentialTarget: "runtime",
		runtimeConfigured: true,
		...credentialSource === void 0 ? {} : { credentialSource },
		...draftApiKey === void 0 ? {} : { runtimeMatchesDraft: true }
	};
	const draftResult = await validateModelRequest(baseURL, protocol, model, draftApiKey);
	return {
		...runtimeResult,
		credentialTarget: "runtime",
		runtimeConfigured: true,
		...credentialSource === void 0 ? {} : { credentialSource },
		runtimeMatchesDraft: false,
		draft: validationAttempt(draftResult)
	};
}
async function validateModelRequest(baseURL, protocol, model, apiKey) {
	const path = protocol === "openai-completions" ? "/chat/completions" : protocol === "openai-responses" ? "/responses" : "/messages";
	const body = protocol === "openai-completions" ? {
		model,
		messages: [{
			role: "user",
			content: "Reply only with OK."
		}],
		max_tokens: PROBE_MAX_OUTPUT_TOKENS,
		stream: true
	} : protocol === "openai-responses" ? {
		model,
		input: "Reply only with OK.",
		max_output_tokens: PROBE_MAX_OUTPUT_TOKENS,
		stream: true
	} : {
		model,
		max_tokens: PROBE_MAX_OUTPUT_TOKENS,
		messages: [{
			role: "user",
			content: "Reply only with OK."
		}],
		stream: true
	};
	try {
		const response = await fetch(`${baseURL.replace(/\/+$/u, "")}${path}`, {
			method: "POST",
			headers: headersForProtocol(apiKey, protocol, true),
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(15e3)
		});
		const message = response.ok ? `HTTP ${response.status}: minimal model request succeeded` : await responseMessage(response, apiKey);
		return validationResult(protocol, model, response.ok ? "valid" : classifyApiKeyStatus(response.status, message), "request", response.status, message);
	} catch (error) {
		return {
			protocol,
			model,
			status: "unknown",
			checkedBy: "request",
			message: errorMessage$2(error, apiKey)
		};
	}
}
function headersForProtocol(apiKey, protocol, includeContentType = false) {
	const headers = protocol === "anthropic-messages" ? {
		"x-api-key": apiKey,
		"anthropic-version": "2023-06-01",
		accept: "application/json"
	} : {
		authorization: `Bearer ${apiKey}`,
		accept: "application/json"
	};
	if (includeContentType) headers["content-type"] = "application/json";
	return headers;
}
function classifyApiKeyStatus(status, message) {
	if (status === 401) return "invalid";
	if (status === 403) return "blocked";
	if (isAuthenticationFailure(message)) return "invalid";
	if (status === 402 || status === 408 || status === 429) return "unavailable";
	return "unknown";
}
function classifyProtocolFailure(status, message) {
	if (status === 401 || isAuthenticationFailure(message)) return "authentication";
	if (status === 403) return "blocked";
	if (status === 408 || status === 429 || status >= 500) return "unavailable";
	return "rejected";
}
function isAuthenticationFailure(message) {
	return /(?:api[\s_-]*key|token|credential).*(?:invalid|incorrect|unauthori[sz]ed|expired|revoked)|(?:invalid|incorrect|unauthori[sz]ed|expired|revoked).*(?:api[\s_-]*key|token|credential)|(?:missing|absent).*(?:authentication|authorization)|(?:authentication|authorization).*(?:missing|absent)/iu.test(message);
}
function validationResult(protocol, model, status, checkedBy, httpStatus, message) {
	return {
		protocol,
		model,
		status,
		checkedBy,
		httpStatus,
		message
	};
}
function validationAttempt(result) {
	return {
		status: result.status,
		...result.httpStatus === void 0 ? {} : { httpStatus: result.httpStatus },
		message: result.message
	};
}
async function responseMessage(response, secret = "") {
	const detail = boundedDiagnostic(responseDetail(redactDiagnostic(await response.text(), secret)));
	return detail === "" ? `HTTP ${response.status}` : `HTTP ${response.status}: ${detail}`;
}
function responseDetail(text) {
	if (CLOUDFLARE_BLOCK_PATTERN$2.test(text)) return "Cloudflare blocked the provider request before it reached the API; this does not prove the API key is invalid";
	let value = text;
	for (let attempt = 0; attempt < 2 && typeof value === "string"; attempt += 1) try {
		value = JSON.parse(value);
	} catch {
		return value;
	}
	if (value !== null && typeof value === "object") {
		if (value.error !== null && typeof value.error === "object" && typeof value.error.message === "string") return value.error.message;
		if (typeof value.error === "string") return value.error;
		if (typeof value.message === "string") return value.message;
	}
	return typeof value === "string" ? value : text;
}
function boundedDiagnostic(value) {
	const normalized = value.replace(/\s+/gu, " ").trim();
	return normalized.length <= DIAGNOSTIC_LENGTH_LIMIT ? normalized : `${normalized.slice(0, 239)}…`;
}
function isTrustedBrowserRequest$1(req) {
	const site = req.headers["sec-fetch-site"];
	return site === void 0 || site === "same-origin" || site === "same-site" || site === "none";
}
function isDirectLoopbackRequest(req) {
	if (hasHeader(req, "forwarded") || hasHeader(req, "x-forwarded-for") || hasHeader(req, "cf-connecting-ip")) return false;
	if (!isLoopbackHost(String(req.socket?.remoteAddress ?? "").replace(/^::ffff:/u, "").toLocaleLowerCase())) return false;
	const host = hostnameOf(req.headers.host);
	if (host === void 0 || !isLoopbackHost(host)) return false;
	const origin = req.headers.origin;
	if (origin !== void 0) {
		const originHost = hostnameOf(origin, true);
		if (originHost === void 0 || !isLoopbackHost(originHost)) return false;
	}
	const referer = req.headers.referer;
	if (origin === void 0 && referer !== void 0) {
		const refererHost = hostnameOf(referer, true);
		if (refererHost === void 0 || !isLoopbackHost(refererHost)) return false;
	}
	return true;
}
function hasHeader(req, name) {
	const value = req.headers[name];
	return value !== void 0 && String(value).trim() !== "";
}
function hostnameOf(value, absolute = false) {
	if (value === void 0) return void 0;
	try {
		return new URL(absolute ? String(value) : `http://${String(value)}`).hostname.toLocaleLowerCase();
	} catch {
		return;
	}
}
function isLoopbackHost(value) {
	if (value === "localhost" || value === "::1" || value === "[::1]") return true;
	const match = /^127\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(value);
	return match !== null && match.slice(1).every((part) => Number(part) <= 255);
}
async function readJsonBody$1(req) {
	let text = "";
	for await (const chunk of req) {
		text += chunk;
		if (Buffer.byteLength(text) > REQUEST_BODY_LIMIT$1) throw new Error("request body is too large");
	}
	if (text.trim() === "") return {};
	try {
		return JSON.parse(text);
	} catch {
		throw new Error("request body must be valid JSON");
	}
}
function requireCredentialRef(value) {
	if (typeof value !== "string" || !CREDENTIAL_PATTERN.test(value)) throw new Error(`credential ref must match ${String(CREDENTIAL_PATTERN)}`);
	return value;
}
function requireBaseURL(value) {
	const baseURL = requireNonEmptyString(value, "baseURL");
	try {
		const parsed = new URL(baseURL);
		if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("baseURL must use http or https");
		return baseURL;
	} catch (error) {
		throw new Error(error instanceof Error && error.message === "baseURL must use http or https" ? error.message : "baseURL must be a valid URL");
	}
}
function requireProtocol(value) {
	if (typeof value !== "string" || !API_KEY_PROTOCOLS.includes(value)) throw new Error("protocol is invalid");
	return value;
}
function requireBatchProviders(value) {
	if (!Array.isArray(value) || value.length === 0 || value.length > BATCH_PROVIDER_LIMIT) throw new Error(`providers must contain from 1 to ${BATCH_PROVIDER_LIMIT} entries`);
	return value.map((entry, index) => {
		if (entry === null || typeof entry !== "object" || Array.isArray(entry)) throw new Error(`providers[${index}] is invalid`);
		const provider = requireNonEmptyString(entry.provider, `providers[${index}].provider`);
		if (!/^[a-z0-9][a-z0-9-]*$/u.test(provider)) throw new Error(`providers[${index}].provider is invalid`);
		return {
			provider,
			displayName: optionalDisplayName(entry.displayName) ?? provider,
			baseURL: requireBaseURL(entry.baseURL),
			credentialRef: requireCredentialRef(entry.credentialRef),
			protocol: requireProtocol(entry.protocol),
			model: optionalNonEmptyString(entry.model, `providers[${index}].model`) ?? ""
		};
	});
}
function requireProtocolModels(value) {
	if (!Array.isArray(value) || value.length === 0 || value.length > PROTOCOL_MODEL_LIMIT) throw new Error(`models must contain from 1 to ${PROTOCOL_MODEL_LIMIT} entries`);
	const models = value.map((model, index) => requireNonEmptyString(model, `models[${index}]`));
	if (new Set(models).size !== models.length) throw new Error("models must not contain duplicates");
	return models;
}
function optionalDisplayName(value) {
	if (value === void 0 || value === "") return void 0;
	if (typeof value !== "string" || value.trim().length > 120) throw new Error("displayName is invalid");
	return value.trim();
}
function optionalNonEmptyString(value, label) {
	if (value === void 0 || value === "") return void 0;
	return requireNonEmptyString(value, label);
}
function requireNonEmptyString(value, label) {
	if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} is required`);
	return value.trim();
}
function optionalApiKey(value) {
	if (value === void 0 || value === "") return void 0;
	if (typeof value !== "string" || /[\s\x00-\x1F\x7F]/u.test(value)) throw new Error("apiKey is invalid");
	return value;
}
function writeJson$3(res, status, value) {
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
		"x-content-type-options": "nosniff"
	});
	res.end(JSON.stringify(value));
}
function errorMessage$2(error, secret = "") {
	return redactDiagnostic(error instanceof Error ? error.message : String(error), secret);
}
function redactDiagnostic(value, secret) {
	return secret === "" ? value : value.split(secret).join("[redacted]");
}
//#endregion
//#region src/request-retry-settings.js
const REQUEST_RETRY_SETTINGS_NAMESPACE = "dsh-model-palette";
const MAX_CONFIGURED_RETRIES = 1e3;
const PRESET_PROVIDERS = [
	"b.ai",
	"bai",
	"bailsb",
	"baiwhr",
	"bankofai"
];
const FREE_SYNC_PRESET_PROVIDERS = ["openrouter-free"];
const retryCount = z.number().step(1).min(0).max(MAX_CONFIGURED_RETRIES);
const providerRule = z.object({
	enabled: z.boolean().default(true),
	maxRetries: retryCount.default(0),
	models: z.dict(retryCount).default({})
});
const freeSyncRule = z.object({
	enabled: z.boolean().default(true),
	intervalHours: z.number().step(1).min(0).max(168).default(6)
});
const freeSyncState = z.object({
	lastSyncAt: z.string(),
	total: z.number().min(0).required(false),
	added: z.number().min(0).required(false),
	removed: z.number().min(0).required(false),
	error: z.string().required(false)
});
const requestRetriesSchema = z.object({ providers: z.dict(providerRule).default({}) });
const freeSyncSchema = z.object({
	providers: z.dict(freeSyncRule).default({}),
	state: z.dict(freeSyncState).default({})
});
/** Host-config section: per-provider request retry rules (0.2 Config export). */
const RequestRetrySectionSchema = requestRetriesSchema;
/** Host-config section: free-sync rules plus recorded sync state (0.2 Config export). */
const FreeSyncSectionSchema = freeSyncSchema;
const RequestRetrySettingsSchema = z.object({
	requestRetries: requestRetriesSchema,
	freeSync: freeSyncSchema
});
const DEFAULT_REQUEST_RETRY_SETTINGS = Object.freeze({
	requestRetries: Object.freeze({ providers: Object.freeze(Object.fromEntries(PRESET_PROVIDERS.map((provider) => [provider, Object.freeze({
		enabled: true,
		maxRetries: 50,
		models: Object.freeze({})
	})]))) }),
	freeSync: Object.freeze({
		providers: Object.freeze(Object.fromEntries(FREE_SYNC_PRESET_PROVIDERS.map((provider) => [provider, Object.freeze({
			enabled: true,
			intervalHours: 6
		})]))),
		state: Object.freeze({})
	})
});
/** Register live request-retry and free-sync settings with plugin-presets applied. */
function registerRequestRetrySettings(settings) {
	return settings.register(REQUEST_RETRY_SETTINGS_NAMESPACE, RequestRetrySettingsSchema, {
		base: structuredClone(DEFAULT_REQUEST_RETRY_SETTINGS),
		applies: "live"
	});
}
/** Resolve an exact model override before the provider-wide retry count. */
function resolveRequestRetryRule(settings, provider, model) {
	const requestRetries = isRecord$3(settings?.requestRetries) ? settings.requestRetries : void 0;
	const providers = isRecord$3(requestRetries?.providers) ? requestRetries.providers : void 0;
	const rule = isRecord$3(providers?.[provider]) ? providers[provider] : void 0;
	if (rule === void 0) return void 0;
	const models = isRecord$3(rule.models) ? rule.models : void 0;
	if (model !== "" && models !== void 0 && Object.hasOwn(models, model)) {
		const maxRetries = models[model];
		return isRetryCount(maxRetries) ? {
			maxRetries,
			source: "model"
		} : void 0;
	}
	return rule.enabled !== false && isRetryCount(rule.maxRetries) ? {
		maxRetries: rule.maxRetries,
		source: "provider"
	} : void 0;
}
/** Read the free-sync rule for one provider from the plugin settings value. */
function resolveFreeSyncRule(settings, provider) {
	const freeSync = isRecord$3(settings?.freeSync) ? settings.freeSync : void 0;
	const providers = isRecord$3(freeSync?.providers) ? freeSync.providers : void 0;
	const rule = isRecord$3(providers?.[provider]) ? providers[provider] : void 0;
	if (rule === void 0 || rule.enabled === false) return void 0;
	return { intervalHours: Number.isInteger(rule.intervalHours) && rule.intervalHours >= 0 && rule.intervalHours <= 168 ? rule.intervalHours : 6 };
}
/** Read the recorded sync state for one provider (undefined when never synced). */
function resolveFreeSyncState(settings, provider) {
	const freeSync = isRecord$3(settings?.freeSync) ? settings.freeSync : void 0;
	const state = isRecord$3(freeSync?.state) ? freeSync.state : void 0;
	return isRecord$3(state?.[provider]) ? state[provider] : void 0;
}
function isRetryCount(value) {
	return Number.isInteger(value) && value >= 0 && value <= 1e3;
}
function isRecord$3(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
//#endregion
//#region src/gateway-recovery.js
const CLOUDFLARE_BLOCK_PATTERN$1 = /(?:Attention Required!\s*\|\s*Cloudflare|\bCloudflare\b|cf-error-details|cdn-cgi\/styles\/cf\.errors\.css)/iu;
const DEFAULT_DELAYS_MS = [
	750,
	1500,
	3e3
];
const RETRYABLE_CODES = /* @__PURE__ */ new Set([
	"EMPTY_RESPONSE",
	"RATE_LIMIT",
	"SERVER",
	"TIMEOUT",
	"TRANSPORT"
]);
const BLOCKED_CODE = "PROVIDER_BLOCKED";
const BLOCKED_MESSAGE = "Cloudflare/WAF blocked the provider request before it reached the API. The API key was not proven invalid; retry later or review the gateway, request content, size, and rate limits.";
/** Register recovery for Cloudflare/WAF responses misclassified as authentication failures. */
function registerGatewayRecovery(ctx, config = {}, retrySettings) {
	if (config.enabled === false) return;
	const handler = createGatewayRecoveryHandler(ctx, config, retrySettings);
	const dispose = ctx.on("agent/request-error", handler.recover);
	ctx.effect(() => async () => {
		dispose();
		await handler.dispose();
	}, "dsh-model-palette: abort and drain gateway recovery");
}
/** Create the request-error listener separately so retry behavior remains unit-testable. */
function createGatewayRecoveryHandler(ctx, config = {}, retrySettings = { get: () => ({}) }) {
	const delaysMs = resolveDelays(config.delaysMs);
	const maxRetries = resolveMaxRetries(config.maxRetries, delaysMs.length);
	const lifetime = new AbortController();
	const retries = /* @__PURE__ */ new WeakMap();
	const active = /* @__PURE__ */ new Set();
	async function recover(payload, next) {
		const model = typeof payload.agent?.options?.model === "string" ? payload.agent.options.model : "";
		const rule = resolveRequestRetryRule(retrySettings.get(), payload.provider, model);
		if (rule !== void 0) return recoverConfigured(payload, model, rule);
		const downstream = await next();
		if (downstream?.kind === "retry") return downstream;
		if (!isCloudflareBlock(payload.failure)) return downstream;
		const key = `gateway:${payload.turn}:${payload.step}:${payload.provider}:${model}`;
		const agentRetries = retries.get(payload.agent) ?? /* @__PURE__ */ new Map();
		retries.set(payload.agent, agentRetries);
		const retry = agentRetries.get(key) ?? 0;
		if (retry >= maxRetries || payload.signal.aborted || lifetime.signal.aborted) {
			agentRetries.delete(key);
			relabelCloudflareFailure(payload.failure);
			ctx.logger?.warn?.(`dsh-model-palette: provider "${payload.provider}" remained blocked by Cloudflare/WAF after ${retry} recovery attempts`);
			return downstream;
		}
		const delayMs = delaysMs[Math.min(retry, delaysMs.length - 1)];
		agentRetries.set(key, retry + 1);
		ctx.logger?.warn?.(`dsh-model-palette: provider "${payload.provider}" hit Cloudflare/WAF; retrying in ${delayMs}ms (${retry + 1}/${maxRetries})`);
		const pending = cancellableDelay(delayMs, AbortSignal.any([payload.signal, lifetime.signal]));
		active.add(pending);
		try {
			if (!await pending) return downstream;
			return { kind: "retry" };
		} finally {
			active.delete(pending);
		}
	}
	async function recoverConfigured(payload, model, rule) {
		if (!isRetryableFailure(payload.failure) || payload.signal.aborted || lifetime.signal.aborted) return void 0;
		const key = `configured:${payload.turn}:${payload.step}:${payload.provider}:${model}`;
		const agentRetries = retries.get(payload.agent) ?? /* @__PURE__ */ new Map();
		retries.set(payload.agent, agentRetries);
		const retry = agentRetries.get(key) ?? 0;
		if (retry >= rule.maxRetries) {
			agentRetries.delete(key);
			if (isCloudflareBlock(payload.failure)) relabelCloudflareFailure(payload.failure);
			if (retry > 0) ctx.logger?.warn?.(`dsh-model-palette: ${rule.source} retry limit reached for "${payload.provider}/${model || "?"}" after ${retry} attempts`);
			return;
		}
		const delayMs = resolveRetryDelay(payload.failure, delaysMs, retry);
		agentRetries.set(key, retry + 1);
		ctx.logger?.warn?.(`dsh-model-palette: transient request failure for "${payload.provider}/${model || "?"}"; retrying in ${delayMs}ms (${retry + 1}/${rule.maxRetries}, ${rule.source} rule)`);
		const pending = cancellableDelay(delayMs, AbortSignal.any([payload.signal, lifetime.signal]));
		active.add(pending);
		try {
			if (!await pending) return void 0;
			return { kind: "retry" };
		} finally {
			active.delete(pending);
		}
	}
	return {
		recover,
		async dispose() {
			lifetime.abort(/* @__PURE__ */ new Error("dsh-model-palette gateway recovery disposed"));
			await Promise.allSettled([...active]);
		}
	};
}
/** Identify only explicit Cloudflare/WAF 403 diagnostics. */
function isCloudflareBlock(failure) {
	if (failure === null || typeof failure !== "object") return false;
	const message = typeof failure.message === "string" ? failure.message : "";
	return (failure.status === 403 || /\b403\b/u.test(message)) && CLOUDFLARE_BLOCK_PATTERN$1.test(message);
}
/** Retry only provider-neutral transient failures plus explicit HTTP transient statuses. */
function isRetryableFailure(failure) {
	if (failure === null || typeof failure !== "object") return false;
	if (isCloudflareBlock(failure)) return true;
	const code = typeof failure.code === "string" ? failure.code.toLocaleUpperCase() : "";
	if (RETRYABLE_CODES.has(code)) return true;
	const status = failure.status;
	return status === 408 || status === 425 || status === 429 || typeof status === "number" && status >= 500 && status <= 599;
}
function relabelCloudflareFailure(failure) {
	failure.code = BLOCKED_CODE;
	failure.status = 403;
	failure.message = BLOCKED_MESSAGE;
}
function resolveDelays(value) {
	if (value === void 0) return DEFAULT_DELAYS_MS;
	if (!Array.isArray(value) || value.length === 0 || value.some((delay) => !Number.isInteger(delay) || delay < 0 || delay > 6e4)) throw new Error("dsh-model-palette: gatewayRecovery.delaysMs must be a non-empty array of integers from 0 to 60000");
	return [...value];
}
function resolveMaxRetries(value, availableDelays) {
	if (value === void 0) return availableDelays;
	if (!Number.isInteger(value) || value < 0 || value > 10) throw new Error("dsh-model-palette: gatewayRecovery.maxRetries must be an integer from 0 to 10");
	return value;
}
function resolveRetryDelay(failure, delaysMs, retry) {
	const providerDelay = failure?.providerRetryAfterMs;
	if (Number.isFinite(providerDelay) && providerDelay > 0 && providerDelay <= 6e4) return Math.round(providerDelay);
	return delaysMs[Math.min(retry, delaysMs.length - 1)];
}
function cancellableDelay(delayMs, signal) {
	if (signal.aborted) return Promise.resolve(false);
	return new Promise((resolve) => {
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve(true);
		}, delayMs);
		const onAbort = () => {
			clearTimeout(timer);
			resolve(false);
		};
		signal.addEventListener("abort", onAbort, { once: true });
	});
}
//#endregion
//#region src/bai-relay.js
const BAI_RELAY_PATH = "/model-palette/api/bai-relay";
const BAI_HOST_HEADER = "api.b.ai";
const BAI_UPSTREAM_HOST = "a18ccd091ab831ac3.awsglobalaccelerator.com";
const PROVIDER_RELAY_PATH = "/model-palette/api/relay";
const DEFAULT_TIMEOUT_MS = 18e4;
const DEFAULT_ALLOWED_PATH_PREFIX = "/v1/";
const DEFAULT_UPSTREAM_RETRIES = 2;
const DEFAULT_RETRY_DELAYS_MS = [250, 1e3];
const DEFAULT_RETRY_BODY_LIMIT_BYTES = 16777216;
const MAX_UPSTREAM_RETRIES = 10;
const MAX_RETRY_DELAY_MS = 6e4;
const MAX_RETRY_BODY_LIMIT_BYTES = 67108864;
const MAX_STRATEGIES = 12;
const MAX_ADDRESS_INDEX = 64;
const MAX_FAILURE_BODY_BYTES = 1048576;
const RELAY_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/u;
const HOST_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/iu;
const CLOUDFLARE_BLOCK_PATTERN = /(?:Attention Required!\s*\|\s*Cloudflare|\bCloudflare\b|cf-error-details|cdn-cgi\/styles\/cf\.errors\.css)/iu;
const RETRYABLE_UPSTREAM_CODES = /* @__PURE__ */ new Set([
	"ECONNRESET",
	"ECONNREFUSED",
	"EAI_AGAIN",
	"ENETUNREACH",
	"EHOSTUNREACH",
	"ETIMEDOUT",
	"EPIPE",
	"ENOTFOUND",
	"ENODATA",
	"ERR_STREAM_PREMATURE_CLOSE"
]);
const FAILOVER_STATUSES = /* @__PURE__ */ new Set([
	408,
	425,
	429,
	500,
	502,
	503,
	504
]);
const HOP_BY_HOP_HEADERS = /* @__PURE__ */ new Set([
	"connection",
	"keep-alive",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailer",
	"transfer-encoding",
	"upgrade"
]);
const FORWARDED_HEADERS = /* @__PURE__ */ new Set([
	"forwarded",
	"x-forwarded-for",
	"x-forwarded-host",
	"x-forwarded-proto",
	"x-real-ip"
]);
const DEFAULT_BAI_STRATEGIES = [
	{
		id: "aws-global-accelerator",
		upstreamHost: BAI_UPSTREAM_HOST,
		hostHeader: BAI_HOST_HEADER,
		tlsServerName: BAI_UPSTREAM_HOST,
		certificateHost: BAI_HOST_HEADER,
		addressIndex: 0
	},
	{
		id: "aws-global-accelerator-next-address",
		upstreamHost: BAI_UPSTREAM_HOST,
		hostHeader: BAI_HOST_HEADER,
		tlsServerName: BAI_UPSTREAM_HOST,
		certificateHost: BAI_HOST_HEADER,
		addressIndex: 1
	},
	{
		id: "direct-api",
		upstreamHost: BAI_HOST_HEADER,
		hostHeader: BAI_HOST_HEADER,
		tlsServerName: BAI_HOST_HEADER,
		certificateHost: BAI_HOST_HEADER,
		addressIndex: 0
	}
];
/** Register the loopback-only B.AI relay used when direct DNS or TLS routing is unavailable. */
function registerBaiRelay(ctx, rawConfig = {}) {
	const config = resolveConfig(rawConfig, {
		upstreamHost: BAI_UPSTREAM_HOST,
		hostHeader: BAI_HOST_HEADER,
		strategies: DEFAULT_BAI_STRATEGIES
	}, "baiRelay");
	if (!config.enabled) return;
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: BAI_RELAY_PATH,
		handler: createRelayHandler(BAI_RELAY_PATH, config, "B.AI")
	}), "dsh-model-palette: loopback B.AI relay");
}
/** Register user-configured fixed-destination relays for providers with unreachable canonical routes. */
function registerProviderRelays(ctx, rawConfig = {}) {
	for (const relay of resolveProviderRelays(rawConfig)) {
		if (!relay.config.enabled) continue;
		const path = `${PROVIDER_RELAY_PATH}/${relay.id}`;
		ctx.effect(() => ctx.webServer.register({
			kind: "prefix",
			path,
			handler: createRelayHandler(path, relay.config, relay.id)
		}), `dsh-model-palette: loopback provider relay ${relay.id}`);
	}
}
function createRelayHandler(basePath, config, label) {
	const runtime = {
		preferredStrategy: 0,
		addressIndexes: config.strategies.map((strategy) => strategy.addressIndex)
	};
	return async (req, res) => {
		if (!isLoopbackRequest$1(req) || hasForwardedHeader(req)) {
			writeJson$2(res, 403, {
				ok: false,
				error: { message: `${label} relay is available only to direct loopback requests` }
			});
			return;
		}
		let parsed;
		try {
			parsed = new URL(req.url ?? "/", "http://dsh.internal");
		} catch {
			writeJson$2(res, 400, {
				ok: false,
				error: { message: "invalid relay request path" }
			});
			return;
		}
		const relativePath = parsed.pathname.slice(basePath.length);
		if (!relativePath.startsWith(config.allowedPathPrefix)) {
			writeJson$2(res, 404, {
				ok: false,
				error: `${label} relay accepts only ${config.allowedPathPrefix}* paths`
			});
			return;
		}
		await proxyRequest(req, res, config, `${relativePath}${parsed.search}`, label, runtime);
	};
}
function resolveProviderRelays(rawConfig) {
	if (rawConfig === void 0) return [];
	if (rawConfig === null || typeof rawConfig !== "object" || Array.isArray(rawConfig)) throw new Error("dsh-model-palette: providerRelays must be an object keyed by relay id");
	return Object.entries(rawConfig).map(([id, config]) => {
		const relayId = requireRelayId(id);
		return {
			id: relayId,
			config: resolveConfig(config, {}, `providerRelays.${relayId}`)
		};
	});
}
function requireRelayId(value) {
	if (typeof value !== "string" || !RELAY_ID_PATTERN.test(value)) throw new Error("dsh-model-palette: provider relay ids must use lowercase letters, numbers, and hyphens");
	return value;
}
function resolveConfig(rawConfig, defaults, label) {
	const value = rawConfig !== null && typeof rawConfig === "object" ? rawConfig : {};
	const hasLegacyRoute = [
		"upstreamHost",
		"hostHeader",
		"tlsServerName",
		"certificateHost"
	].some((key) => Object.hasOwn(value, key));
	const legacyRoute = {
		upstreamHost: value.upstreamHost ?? defaults.upstreamHost,
		hostHeader: value.hostHeader ?? defaults.hostHeader,
		tlsServerName: value.tlsServerName ?? value.upstreamHost ?? defaults.upstreamHost,
		certificateHost: value.certificateHost ?? value.hostHeader ?? defaults.hostHeader
	};
	const routeDefaults = hasLegacyRoute ? [{ id: "configured" }] : defaults.strategies ?? [{ id: "configured" }];
	const strategies = resolveStrategies(value.strategies ?? routeDefaults, legacyRoute, label);
	const primary = strategies[0];
	const upstreamHost = primary.upstreamHost;
	const hostHeader = primary.hostHeader;
	const tlsServerName = primary.tlsServerName;
	const certificateHost = primary.certificateHost;
	const allowedPathPrefix = resolvePathPrefix(value.allowedPathPrefix, `${label}.allowedPathPrefix`);
	const timeoutMs = value.timeoutMs === void 0 ? DEFAULT_TIMEOUT_MS : value.timeoutMs;
	if (!Number.isInteger(timeoutMs) || timeoutMs < 1e3 || timeoutMs > 9e5) throw new Error(`dsh-model-palette: ${label}.timeoutMs must be an integer from 1000 to 900000`);
	const upstreamRetries = value.upstreamRetries === void 0 ? DEFAULT_UPSTREAM_RETRIES : value.upstreamRetries;
	if (!Number.isInteger(upstreamRetries) || upstreamRetries < 0 || upstreamRetries > MAX_UPSTREAM_RETRIES) throw new Error(`dsh-model-palette: ${label}.upstreamRetries must be an integer from 0 to ${MAX_UPSTREAM_RETRIES}`);
	const retryDelaysMs = resolveRetryDelays(value.retryDelaysMs, `${label}.retryDelaysMs`);
	const retryBodyLimitBytes = value.retryBodyLimitBytes === void 0 ? DEFAULT_RETRY_BODY_LIMIT_BYTES : value.retryBodyLimitBytes;
	if (!Number.isInteger(retryBodyLimitBytes) || retryBodyLimitBytes < 0 || retryBodyLimitBytes > MAX_RETRY_BODY_LIMIT_BYTES) throw new Error(`dsh-model-palette: ${label}.retryBodyLimitBytes must be an integer from 0 to ${MAX_RETRY_BODY_LIMIT_BYTES}`);
	return {
		enabled: value.enabled !== false,
		upstreamHost,
		hostHeader,
		tlsServerName,
		certificateHost,
		strategies,
		allowedPathPrefix,
		timeoutMs,
		upstreamRetries,
		retryDelaysMs,
		retryBodyLimitBytes
	};
}
function resolveStrategies(rawStrategies, legacyRoute, label) {
	if (!Array.isArray(rawStrategies) || rawStrategies.length === 0 || rawStrategies.length > MAX_STRATEGIES) throw new Error(`dsh-model-palette: ${label}.strategies must contain 1 to ${MAX_STRATEGIES} entries`);
	const ids = /* @__PURE__ */ new Set();
	return rawStrategies.map((rawStrategy, index) => {
		const value = rawStrategy !== null && typeof rawStrategy === "object" ? rawStrategy : {};
		const id = typeof value.id === "string" && value.id.trim() !== "" ? value.id.trim() : `strategy-${index + 1}`;
		if (!RELAY_ID_PATTERN.test(id) || ids.has(id)) throw new Error(`dsh-model-palette: ${label}.strategies contains an invalid or duplicate id`);
		ids.add(id);
		const upstreamHost = resolveHost(value.upstreamHost, index === 0 ? legacyRoute.upstreamHost : void 0, `${label}.strategies[${index}].upstreamHost`);
		const hostHeader = resolveHost(value.hostHeader, index === 0 ? legacyRoute.hostHeader : void 0, `${label}.strategies[${index}].hostHeader`);
		const tlsServerName = resolveHost(value.tlsServerName, index === 0 ? legacyRoute.tlsServerName : upstreamHost, `${label}.strategies[${index}].tlsServerName`);
		const certificateHost = resolveHost(value.certificateHost, index === 0 ? legacyRoute.certificateHost : hostHeader, `${label}.strategies[${index}].certificateHost`);
		const addressIndex = value.addressIndex === void 0 ? 0 : value.addressIndex;
		if (!Number.isInteger(addressIndex) || addressIndex < 0 || addressIndex > MAX_ADDRESS_INDEX) throw new Error(`dsh-model-palette: ${label}.strategies[${index}].addressIndex must be an integer from 0 to ${MAX_ADDRESS_INDEX}`);
		return {
			id,
			upstreamHost,
			hostHeader,
			tlsServerName,
			certificateHost,
			addressIndex
		};
	});
}
function resolveHost(value, fallback, label) {
	const candidate = typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
	if (typeof candidate !== "string" || !HOST_PATTERN.test(candidate)) throw new Error(`dsh-model-palette: ${label} must be a valid DNS hostname`);
	return candidate.toLocaleLowerCase();
}
function resolvePathPrefix(value, label) {
	const prefix = value === void 0 ? DEFAULT_ALLOWED_PATH_PREFIX : value;
	if (typeof prefix !== "string" || prefix === "/" || !prefix.startsWith("/") || !prefix.endsWith("/") || prefix.includes("..") || prefix.includes("?") || prefix.includes("#")) throw new Error(`dsh-model-palette: ${label} must start and end with / and contain no traversal or query characters`);
	return prefix;
}
function isLoopbackRequest$1(req) {
	const address = req.socket?.remoteAddress;
	return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}
function hasForwardedHeader(req) {
	return Object.keys(req.headers ?? {}).some((name) => FORWARDED_HEADERS.has(name.toLocaleLowerCase()));
}
async function proxyRequest(req, res, config, path, label, runtime) {
	let body;
	try {
		body = await readRequestBody(req, MAX_RETRY_BODY_LIMIT_BYTES);
	} catch (error) {
		if (error?.code === "REQUEST_BODY_TOO_LARGE") writeJson$2(res, 413, {
			ok: false,
			error: {
				code: error.code,
				message: error.message
			}
		});
		else if (!req.aborted && !res.writableEnded) writeJson$2(res, 400, {
			ok: false,
			error: { message: `${label} relay could not read the request body` }
		});
		return;
	}
	const canReplay = body.length <= config.retryBodyLimitBytes;
	let lastFailure;
	const attemptedStrategies = [];
	let strategyIndex = runtime.preferredStrategy;
	let lastSelectedIndex = strategyIndex;
	const attempts = config.upstreamRetries + 1;
	for (let attempt = 0; attempt < attempts; attempt += 1) {
		if (req.aborted || res.writableEnded) return;
		const selectedIndex = strategyIndex % config.strategies.length;
		lastSelectedIndex = selectedIndex;
		const strategy = config.strategies[selectedIndex];
		attemptedStrategies.push(strategy.id);
		const result = await sendUpstreamRequest(req, res, config, path, body, label, strategy, runtime.addressIndexes[selectedIndex], (nextIndex) => {
			runtime.addressIndexes[selectedIndex] = nextIndex;
		});
		if (result.ok) {
			runtime.preferredStrategy = selectedIndex;
			return;
		}
		if (result.clientDisconnected) return;
		lastFailure = result.error;
		if (!canReplay || !isFailoverFailure(result.error) || attempt >= attempts - 1 || res.headersSent) break;
		strategyIndex = (selectedIndex + 1) % config.strategies.length;
		const delayMs = config.retryDelaysMs[Math.min(attempt, config.retryDelaysMs.length - 1)];
		if (!await waitForRetry(delayMs, req, res)) return;
	}
	if (res.headersSent || res.writableEnded || req.aborted) return;
	if (canReplay && isFailoverFailure(lastFailure) && config.upstreamRetries > 0) {
		runtime.preferredStrategy = (lastSelectedIndex + 1) % config.strategies.length;
		writeJson$2(res, 503, {
			ok: false,
			error: {
				code: "UPSTREAM_TRANSIENT",
				message: `${label} relay could not reach the upstream after ${attempts} attempts across connection strategies (${attemptedStrategies.join(", ")}): ${errorMessage$1(lastFailure)}`
			}
		}, { "retry-after": "1" });
		return;
	}
	if (hasBufferedResponse(lastFailure)) {
		res.writeHead(lastFailure.status, lastFailure.statusMessage, lastFailure.headers);
		res.end(lastFailure.responseBody);
		return;
	}
	writeJson$2(res, errorCode(lastFailure), {
		ok: false,
		error: { message: `${label} relay failed: ${errorMessage$1(lastFailure)}` }
	});
}
async function readRequestBody(req, limitBytes) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += buffer.length;
		if (size > limitBytes) {
			const error = /* @__PURE__ */ new Error(`request body exceeds relay body safety limit (${limitBytes})`);
			error.code = "REQUEST_BODY_TOO_LARGE";
			throw error;
		}
		chunks.push(buffer);
	}
	return Buffer.concat(chunks, size);
}
function sendUpstreamRequest(req, res, config, path, body, label, strategy, addressIndex, onAddressIndex) {
	return new Promise((resolve) => {
		let finished = false;
		let upstreamResponseReceived = false;
		let responseEnded = false;
		const headers = forwardRequestHeaders(req.headers ?? {}, strategy.hostHeader, body.length);
		const upstreamRequest = https.request({
			agent: false,
			hostname: strategy.upstreamHost,
			port: 443,
			method: req.method,
			path,
			headers,
			servername: strategy.tlsServerName,
			lookup: createRotatingLookup(strategy.upstreamHost, addressIndex, (nextAddressIndex) => {
				onAddressIndex(nextAddressIndex);
			}),
			checkServerIdentity: (_host, certificate) => tls.checkServerIdentity(strategy.certificateHost, certificate)
		}, (upstreamResponse) => {
			upstreamResponseReceived = true;
			const status = upstreamResponse.statusCode ?? 502;
			if (isFailoverStatus(status) || status === 403) {
				collectFailureResponse(upstreamResponse).then(({ body: responseBody, error }) => {
					if (error !== void 0) {
						finish({
							ok: false,
							error: {
								code: error.code,
								message: errorMessage$1(error),
								status,
								statusMessage: upstreamResponse.statusMessage,
								headers: filterResponseHeaders(upstreamResponse.headers),
								responseBody
							},
							responseReceived: true
						});
						return;
					}
					const responseText = responseBody.toString("utf8");
					const cloudflare = isCloudflareResponse(status, upstreamResponse.headers, responseText);
					if (!isFailoverStatus(status) && !cloudflare) {
						if (!res.headersSent) {
							res.writeHead(status, upstreamResponse.statusMessage, filterResponseHeaders(upstreamResponse.headers));
							res.end(responseBody);
						}
						finish({
							ok: true,
							responseReceived: true
						});
						return;
					}
					finish({
						ok: false,
						error: {
							status,
							statusMessage: upstreamResponse.statusMessage,
							headers: filterResponseHeaders(upstreamResponse.headers),
							code: "UPSTREAM_HTTP",
							message: responseFailureMessage(status, responseText),
							responseBody: responseText,
							cloudflare
						},
						responseReceived: true
					});
				});
				return;
			}
			if (!res.headersSent) res.writeHead(status, upstreamResponse.statusMessage, filterResponseHeaders(upstreamResponse.headers));
			upstreamResponse.once("error", failResponse);
			upstreamResponse.once("aborted", () => failResponse(/* @__PURE__ */ new Error("upstream response aborted")));
			upstreamResponse.once("close", () => {
				if (!responseEnded) failResponse(/* @__PURE__ */ new Error("upstream response closed before end"));
			});
			upstreamResponse.once("end", () => {
				responseEnded = true;
				finish({ ok: true });
			});
			upstreamResponse.pipe(res);
		});
		const abort = () => {
			if (!finished) {
				const error = /* @__PURE__ */ new Error(`${label} relay client disconnected`);
				error.code = "CLIENT_DISCONNECTED";
				upstreamRequest.destroy(error);
			}
		};
		const close = () => {
			if (!res.writableEnded && !finished) abort();
		};
		const finish = (result) => {
			if (finished) return;
			finished = true;
			req.removeListener("aborted", abort);
			res.removeListener("close", close);
			resolve(result);
		};
		const failResponse = (error) => {
			if (finished) return;
			if (res.headersSent && !res.writableEnded) res.destroy(error);
			finish({
				ok: false,
				error,
				responseReceived: true
			});
		};
		upstreamRequest.once("error", (error) => {
			if (finished) return;
			if (upstreamResponseReceived && res.headersSent && !res.writableEnded) res.destroy(error);
			finish({
				ok: false,
				error,
				responseReceived: upstreamResponseReceived,
				clientDisconnected: error?.code === "CLIENT_DISCONNECTED"
			});
		});
		upstreamRequest.setTimeout(config.timeoutMs, () => {
			const error = /* @__PURE__ */ new Error(`upstream idle timeout after ${config.timeoutMs}ms`);
			error.code = "ETIMEDOUT";
			upstreamRequest.destroy(error);
		});
		req.once("aborted", abort);
		res.once("close", close);
		upstreamRequest.end(body);
	});
}
function resolveRetryDelays(value, label) {
	const delays = value === void 0 ? DEFAULT_RETRY_DELAYS_MS : value;
	if (!Array.isArray(delays) || delays.length === 0 || delays.some((delay) => !Number.isInteger(delay) || delay < 0 || delay > MAX_RETRY_DELAY_MS)) throw new Error(`dsh-model-palette: ${label} must be a non-empty array of integers from 0 to ${MAX_RETRY_DELAY_MS}`);
	return [...delays];
}
function isRetryableUpstreamError(error) {
	const code = typeof error?.code === "string" ? error.code.toLocaleUpperCase() : "";
	if (RETRYABLE_UPSTREAM_CODES.has(code)) return true;
	return errorMessage$1(error).toLocaleLowerCase().includes("socket hang up");
}
function isFailoverFailure(error) {
	return isRetryableUpstreamError(error) || isFailoverStatus(error?.status) || error?.cloudflare === true;
}
function isFailoverStatus(status) {
	return typeof status === "number" && (FAILOVER_STATUSES.has(status) || status >= 500 && status <= 599);
}
function isCloudflareResponse(status, headers = {}, body = "") {
	if (status !== 403) return false;
	const contentType = Object.entries(headers).find(([name]) => name.toLocaleLowerCase() === "content-type")?.[1];
	const server = Object.entries(headers).find(([name]) => name.toLocaleLowerCase() === "server")?.[1];
	return CLOUDFLARE_BLOCK_PATTERN.test(String(body)) || CLOUDFLARE_BLOCK_PATTERN.test(String(server)) && /text\/html/iu.test(String(contentType ?? ""));
}
function hasBufferedResponse(error) {
	return Number.isInteger(error?.status) && (typeof error?.responseBody === "string" || Buffer.isBuffer(error?.responseBody));
}
function collectFailureResponse(response) {
	return new Promise((resolve) => {
		const chunks = [];
		let size = 0;
		let settled = false;
		const finish = (value) => {
			if (settled) return;
			settled = true;
			resolve(value);
		};
		response.on("data", (chunk) => {
			if (size >= MAX_FAILURE_BODY_BYTES) return;
			const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
			const remaining = MAX_FAILURE_BODY_BYTES - size;
			chunks.push(buffer.subarray(0, remaining));
			size += Math.min(buffer.length, remaining);
		});
		response.once("error", (error) => finish({
			body: Buffer.alloc(0),
			error
		}));
		response.once("aborted", () => finish({
			body: Buffer.concat(chunks, size),
			error: prematureCloseError()
		}));
		response.once("end", () => finish({ body: Buffer.concat(chunks, size) }));
		response.once("close", () => {
			if (!settled) finish({
				body: Buffer.concat(chunks, size),
				error: prematureCloseError()
			});
		});
	});
}
function prematureCloseError() {
	const error = /* @__PURE__ */ new Error("upstream response closed before end");
	error.code = "ERR_STREAM_PREMATURE_CLOSE";
	return error;
}
function responseFailureMessage(status, body) {
	const detail = body.trim().replace(/\s+/gu, " ").slice(0, 300);
	return detail === "" ? `upstream returned HTTP ${status}` : `upstream returned HTTP ${status}: ${detail}`;
}
function createRotatingLookup(host, initialIndex, onIndex) {
	return (_hostname, options = {}, callback) => {
		dns.lookup(host, {
			all: true,
			verbatim: true
		}, (error, addresses) => {
			if (error) {
				callback(error);
				return;
			}
			const values = Array.isArray(addresses) ? addresses.filter((address) => address && typeof address.address === "string") : [];
			if (values.length === 0) {
				callback(/* @__PURE__ */ new Error(`DNS lookup returned no addresses for ${host}`));
				return;
			}
			const start = (initialIndex % values.length + values.length) % values.length;
			const ordered = values.slice(start).concat(values.slice(0, start));
			onIndex((start + 1) % values.length);
			if (options?.all === true) {
				callback(null, ordered);
				return;
			}
			callback(null, ordered[0].address, ordered[0].family);
		});
	};
}
function waitForRetry(delayMs, req, res) {
	if (req.aborted || res.writableEnded) return Promise.resolve(false);
	return new Promise((resolve) => {
		let settled = false;
		const finish = (value) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			req.removeListener("aborted", abort);
			res.removeListener("close", abort);
			resolve(value);
		};
		const abort = () => finish(false);
		const timer = setTimeout(() => finish(true), delayMs);
		req.once("aborted", abort);
		res.once("close", abort);
	});
}
function forwardRequestHeaders(input, hostHeader, bodyLength) {
	const headers = {};
	for (const [name, value] of Object.entries(input)) {
		const lower = name.toLocaleLowerCase();
		if (lower === "host" || lower === "content-length" || HOP_BY_HOP_HEADERS.has(lower) || FORWARDED_HEADERS.has(lower)) continue;
		if (typeof value === "string") headers[name] = value;
		else if (Array.isArray(value)) headers[name] = value.join(", ");
	}
	headers.host = hostHeader;
	headers["content-length"] = String(bodyLength);
	return headers;
}
function filterResponseHeaders(input) {
	return Object.fromEntries(Object.entries(input).filter(([name]) => !HOP_BY_HOP_HEADERS.has(name.toLocaleLowerCase())));
}
function errorCode(error) {
	return error?.code === "ETIMEDOUT" ? 504 : 502;
}
function errorMessage$1(error) {
	return error instanceof Error ? error.message : String(error);
}
function writeJson$2(res, status, value, headers = {}) {
	if (res.headersSent) return;
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		...headers
	});
	res.end(JSON.stringify(value));
}
//#endregion
//#region src/openrouter-free-sync.js
const LLM_SETTINGS_NAMESPACE = "llm-pi-ai";
const SYNC_API_PATH = "/model-palette/api/free-sync";
const OPENROUTER_HOST_PATTERN = /(^|\.)openrouter\.ai$/iu;
/** Reasoning levels OpenRouter documents for its unified reasoning parameter. */
const FREE_REASONING_EFFORTS = {
	off: null,
	minimal: "minimal",
	low: "low",
	medium: "medium",
	high: "high"
};
const TICK_INTERVAL_MS = 18e5;
const STARTUP_DELAY_MS = 8e3;
const CATALOG_TIMEOUT_MS$1 = 2e4;
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
/** Register startup free-model synchronization for OpenRouter free-only provider routes. */
function registerOpenRouterFreeSync(ctx, settings) {
	const runtime = createFreeSyncRuntime(ctx, settings);
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: SYNC_API_PATH,
		handler: createFreeSyncHandler(runtime)
	}), "dsh-model-palette: free-sync API");
	ctx.effect(() => {
		const startupTimer = setTimeout(() => {
			runtime.syncDueProviders("startup");
		}, STARTUP_DELAY_MS);
		startupTimer.unref?.();
		const tickTimer = setInterval(() => {
			runtime.syncDueProviders("interval");
		}, TICK_INTERVAL_MS);
		tickTimer.unref?.();
		return async () => {
			clearTimeout(startupTimer);
			clearInterval(tickTimer);
			await runtime.dispose();
		};
	}, "dsh-model-palette: free-sync timers");
}
/** Create the free-sync runtime so provider synchronization stays unit-testable. */
function createFreeSyncRuntime(ctx, settingsApi) {
	const inFlight = /* @__PURE__ */ new Map();
	const controller = new AbortController();
	let stopped = false;
	async function pluginSettings() {
		return settingsApi.get(REQUEST_RETRY_SETTINGS_NAMESPACE);
	}
	function dueProviders(settings) {
		return isRecord$2(settings?.freeSync) && isRecord$2(settings.freeSync.providers) ? Object.keys(settings.freeSync.providers).filter((id) => resolveFreeSyncRule(settings, id) !== void 0) : [];
	}
	function isDue(settings, provider) {
		const rule = resolveFreeSyncRule(settings, provider);
		if (rule === void 0) return false;
		const state = resolveFreeSyncState(settings, provider);
		if (state === void 0 || typeof state.lastSyncAt !== "string") return true;
		const last = Date.parse(state.lastSyncAt);
		if (!Number.isFinite(last)) return true;
		if (rule.intervalHours === 0) return false;
		return Date.now() - last >= rule.intervalHours * 36e5;
	}
	async function syncDueProviders(trigger) {
		if (stopped) return;
		let settings;
		try {
			settings = await pluginSettings();
		} catch (error) {
			if (!stopped) ctx.logger?.warn?.(`dsh-model-palette: ${trigger} free-sync settings failed: ${errorMessage(error)}`);
			return;
		}
		const due = dueProviders(settings).filter((provider) => trigger === "startup" && resolveFreeSyncRule(settings, provider)?.intervalHours === 0 || isDue(settings, provider));
		for (const provider of due) {
			if (stopped) return;
			try {
				await syncProvider(provider);
			} catch (error) {
				ctx.logger?.warn?.(`dsh-model-palette: ${trigger} free-sync for "${provider}" failed: ${errorMessage(error)}`);
			}
		}
	}
	async function syncProvider(providerId, options = {}) {
		if (stopped) throw new Error("free sync is disposed");
		const pending = inFlight.get(providerId);
		if (pending !== void 0) return pending;
		const manual = options.manual === true;
		const task = (async () => {
			try {
				const settings = await pluginSettings();
				if (!manual && resolveFreeSyncRule(settings, providerId) === void 0) throw new Error(`free sync is not enabled for provider "${providerId}"`);
				const { profile } = await providerSnapshot(settingsApi, providerId);
				if (profile === void 0) throw new Error(`provider "${providerId}" is not configured`);
				if (!isOpenRouterRoute(profile)) throw new Error(`provider "${providerId}" does not point at openrouter.ai`);
				const live = await fetchLiveFreeModels(controller.signal);
				if (stopped) throw new Error("free sync is disposed");
				const currentSettings = await pluginSettings();
				const { profile: currentProfile, revision } = await providerSnapshot(settingsApi, providerId);
				if (stopped) throw new Error("free sync is disposed");
				if (!manual && resolveFreeSyncRule(currentSettings, providerId) === void 0 || currentProfile === void 0 || !isOpenRouterRoute(currentProfile)) throw new Error(`provider "${providerId}" changed during free sync; retry after reviewing its settings`);
				const previous = Array.isArray(currentProfile.models) ? currentProfile.models.filter(isRecord$2) : [];
				if (live.length === 0) throw new Error("OpenRouter returned no compatible free models; keeping the configured list");
				const merged = mergeFreeSyncModels(previous, live, stringField(currentProfile, "api") || "openai-completions");
				await settingsApi.mutate(LLM_SETTINGS_NAMESPACE, [{
					op: "set",
					path: [
						"providers",
						providerId,
						"models"
					],
					value: merged.models
				}], revision);
				const state = {
					lastSyncAt: (/* @__PURE__ */ new Date()).toISOString(),
					total: merged.models.length,
					added: merged.added,
					removed: merged.removed
				};
				if (stopped) throw new Error("free sync is disposed");
				await settingsApi.mutate(REQUEST_RETRY_SETTINGS_NAMESPACE, [{
					op: "set",
					path: [
						"freeSync",
						"state",
						providerId
					],
					value: state
				}]);
				ctx.logger?.info?.(`dsh-model-palette: free-sync "${providerId}" now serves ${state.total} free models (+${state.added}/-${state.removed})`);
				return {
					provider: providerId,
					...state
				};
			} catch (error) {
				if (stopped) throw error;
				const message = errorMessage(error);
				try {
					await settingsApi.mutate(REQUEST_RETRY_SETTINGS_NAMESPACE, [{
						op: "set",
						path: [
							"freeSync",
							"state",
							providerId
						],
						value: {
							lastSyncAt: (/* @__PURE__ */ new Date()).toISOString(),
							error: message
						}
					}]);
				} catch (stateError) {
					ctx.logger?.warn?.(`dsh-model-palette: free-sync state write failed for "${providerId}": ${errorMessage(stateError)}`);
				}
				throw error;
			} finally {
				inFlight.delete(providerId);
			}
		})();
		inFlight.set(providerId, task);
		return task;
	}
	async function dispose() {
		stopped = true;
		controller.abort();
		await Promise.allSettled([...inFlight.values()]);
	}
	return {
		syncDueProviders,
		syncProvider,
		dispose,
		dueProviders,
		isDue
	};
}
/**
* Merge the live free catalog into the provider's model list. The list becomes
* exactly the live free models: stale entries vanish, manual capacity and
* compatibility fields on surviving ids are kept.
*/
function mergeFreeSyncModels(previous, live, protocol) {
	const priorById = new Map(previous.filter((model) => typeof model.id === "string" && model.id !== "").map((model) => [model.id, model]));
	const seen = /* @__PURE__ */ new Set();
	let added = 0;
	const models = [];
	for (const candidate of live) {
		if (typeof candidate.id !== "string" || candidate.id === "" || seen.has(candidate.id)) continue;
		seen.add(candidate.id);
		const prior = priorById.get(candidate.id);
		if (prior === void 0) added += 1;
		const next = prior === void 0 ? {} : structuredClone(prior);
		next.id = candidate.id;
		if (typeof next.name !== "string" || next.name === "") next.name = candidate.name ?? candidate.id;
		if (!Number.isInteger(next.contextWindow) || next.contextWindow <= 0) {
			if (Number.isInteger(candidate.contextWindow) && candidate.contextWindow > 0) next.contextWindow = candidate.contextWindow;
			else delete next.contextWindow;
		}
		if (!Number.isInteger(next.maxTokens) || next.maxTokens <= 0) {
			if (Number.isInteger(candidate.maxTokens) && candidate.maxTokens > 0) next.maxTokens = candidate.maxTokens;
			else delete next.maxTokens;
		}
		if (!Array.isArray(next.input) || next.input.length === 0) {
			if (Array.isArray(candidate.input) && candidate.input.length > 0) next.input = [...candidate.input];
			else delete next.input;
		}
		if (candidate.reasoning === true && next.reasoningEfforts === void 0) next.reasoningEfforts = structuredClone(FREE_REASONING_EFFORTS);
		if (protocol === "openai-completions") next.compat = deepSeekCompat(next);
		else delete next.compat;
		models.push(next);
	}
	const removed = previous.length + added - models.length;
	return {
		models,
		added,
		removed: Math.max(0, removed)
	};
}
/** Add the DeepSeek replay compatibility fields when the free model is a DeepSeek model. */
function deepSeekCompat(model) {
	const compat = isRecord$2(model.compat) ? structuredClone(model.compat) : {};
	const identity = `${model.id} ${model.name}`.toLocaleLowerCase();
	if (compat.thinkingFormat === void 0 && identity.includes("deepseek")) compat.thinkingFormat = "deepseek";
	if (compat.thinkingFormat === "deepseek") {
		if (compat.requiresReasoningContentOnAssistantMessages === void 0) compat.requiresReasoningContentOnAssistantMessages = true;
		if (compat.supportsDeveloperRole === void 0) compat.supportsDeveloperRole = false;
	}
	return Object.keys(compat).length === 0 ? void 0 : compat;
}
function createFreeSyncHandler(runtime) {
	return async (req, res) => {
		if (req.method !== "POST") {
			writeJson$1(res, 405, {
				ok: false,
				error: { message: "method not allowed" }
			});
			return;
		}
		if (!isTrustedBrowserRequest(req)) {
			writeJson$1(res, 403, {
				ok: false,
				error: { message: "cross-site request rejected" }
			});
			return;
		}
		let body;
		try {
			body = await readJsonBody(req);
		} catch (error) {
			writeJson$1(res, 400, {
				ok: false,
				error: { message: errorMessage(error) }
			});
			return;
		}
		const provider = typeof body?.provider === "string" ? body.provider.trim() : "";
		if (!/^[a-z0-9][a-z0-9-]*$/u.test(provider)) {
			writeJson$1(res, 400, {
				ok: false,
				error: { message: "provider is required" }
			});
			return;
		}
		try {
			writeJson$1(res, 200, {
				ok: true,
				value: await runtime.syncProvider(provider, { manual: body?.manual === true })
			});
		} catch (error) {
			writeJson$1(res, 502, {
				ok: false,
				error: { message: `free sync failed: ${errorMessage(error)}` }
			});
		}
	};
}
async function providerSnapshot(settingsApi, providerId) {
	const section = await settingsApi.snapshot(LLM_SETTINGS_NAMESPACE);
	const providers = isRecord$2(section?.value?.providers) ? section.value.providers : void 0;
	return {
		profile: isRecord$2(providers?.[providerId]) ? providers[providerId] : void 0,
		revision: section?.revision
	};
}
function isOpenRouterRoute(profile) {
	const baseURL = stringField(profile, "baseURL");
	if (baseURL === "") return true;
	try {
		return OPENROUTER_HOST_PATTERN.test(new URL(baseURL).hostname);
	} catch {
		return false;
	}
}
async function fetchLiveFreeModels(signal) {
	const response = await fetch(OPENROUTER_MODELS_URL, {
		headers: {
			"accept": "application/json",
			"user-agent": "DSH-Model-Palette/0.11"
		},
		signal: AbortSignal.any([signal, AbortSignal.timeout(CATALOG_TIMEOUT_MS$1)])
	});
	if (!response.ok) throw new Error(`OpenRouter catalog returned HTTP ${response.status}`);
	return parseOpenRouterFreeModels(await response.json());
}
function stringField(value, key) {
	return typeof value?.[key] === "string" ? value[key] : "";
}
function isRecord$2(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isTrustedBrowserRequest(req) {
	const site = req.headers["sec-fetch-site"];
	return site === void 0 || site === "same-origin" || site === "same-site" || site === "none";
}
async function readJsonBody(req) {
	let text = "";
	for await (const chunk of req) {
		text += chunk;
		if (Buffer.byteLength(text) > 65536) throw new Error("request body is too large");
	}
	if (text.trim() === "") return {};
	try {
		return JSON.parse(text);
	} catch {
		throw new Error("request body must be valid JSON");
	}
}
function writeJson$1(res, status, value) {
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
		"x-content-type-options": "nosniff"
	});
	res.end(JSON.stringify(value));
}
function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
//#endregion
//#region src/free-gateway.ts
/**
* Loopback OpenAI-compatible gateway for the keyless free-model adapter.
*/
const REQUEST_BODY_LIMIT = 8388608;
/** Register a loopback-only OpenAI-compatible listener. */
function registerFreeGateway(ctx, adapter, runtime, config) {
	let server;
	let settled = false;
	server = createServer((req, res) => {
		handleRequest(ctx, adapter, runtime, config, req, res).catch((error) => {
			if (!res.headersSent) res.writeHead(error?.status && error.status >= 400 ? error.status : 500, { "content-type": "application/json" });
			res.end(JSON.stringify({ error: {
				message: String(error?.message ?? error),
				type: "gateway_error"
			} }));
		});
	});
	server.once("close", () => {
		settled = true;
	});
	const port = Number(config.port ?? 4180);
	new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(Number.isInteger(port) && port >= 0 ? port : 4180, "127.0.0.1", () => {
			server.removeListener("error", reject);
			resolve();
		});
	}).then(() => {
		const actual = (server?.address())?.port;
		ctx.logger?.info?.(`dsh-model-palette: free-model OpenAI gateway listening on http://127.0.0.1:${String(actual)}/v1`);
	}, (error) => {
		ctx.logger?.warn?.(`dsh-model-palette: free-model gateway failed to start: ${String(error?.message ?? error)}`);
	});
	return {
		dispose: async () => {
			if (server === void 0 || settled) return;
			await new Promise((resolve, reject) => server.close((error) => error === void 0 ? resolve() : reject(error)));
		},
		port: () => (server?.address())?.port
	};
}
async function handleRequest(ctx, adapter, runtime, config, req, res) {
	if (!isLoopbackRequest(req)) throw Object.assign(/* @__PURE__ */ new Error("the free-model gateway listens on loopback only"), { status: 403 });
	if (req.method === "OPTIONS") {
		res.writeHead(204, corsHeaders());
		res.end();
		return;
	}
	const url = new URL(req.url ?? "/", "http://127.0.0.1");
	if (req.method === "GET" && (url.pathname === "/v1/models" || url.pathname === "/models")) {
		await authorize(ctx, config, req);
		const models = runtime.snapshot().models;
		res.writeHead(200, jsonHeaders());
		res.end(JSON.stringify({
			object: "list",
			data: models.map((model) => ({
				id: model.id,
				object: "model",
				owned_by: model.channel,
				context_window: model.contextWindow,
				max_output_tokens: model.maxOutput
			}))
		}));
		return;
	}
	if (req.method !== "POST" || !/\/v1\/chat\/completions$/u.test(url.pathname)) throw Object.assign(/* @__PURE__ */ new Error("unknown OpenAI-compatible route"), { status: 404 });
	await authorize(ctx, config, req);
	const body = await readJson(req);
	const modelId = requireString(body.model, "model");
	if (runtime.entry(modelId) === void 0) throw Object.assign(/* @__PURE__ */ new Error(`model '${modelId}' is unavailable`), { status: 404 });
	const options = openAiToDshOptions(body, modelId, req);
	const stream = body.stream !== false;
	res.writeHead(200, {
		...stream ? sseHeaders() : jsonHeaders(),
		...corsHeaders()
	});
	if (!stream) {
		const outcome = {
			text: "",
			reasoning: "",
			toolCalls: [],
			usage: void 0,
			finish: "stop"
		};
		try {
			for await (const chunk of adapter.stream(options)) updateOutcome(outcome, chunk);
		} catch (error) {
			runtime.markFailure(modelId, error);
			throw error;
		}
		res.end(JSON.stringify({
			id: `chatcmpl-free-${crypto.randomUUID()}`,
			object: "chat.completion",
			created: Math.floor(Date.now() / 1e3),
			model: modelId,
			choices: [{
				index: 0,
				message: {
					role: "assistant",
					content: outcome.text,
					...outcome.reasoning === "" ? {} : { reasoning_content: outcome.reasoning },
					...outcome.toolCalls.length === 0 ? {} : { tool_calls: outcome.toolCalls }
				},
				finish_reason: outcome.finish
			}],
			...outcome.usage === void 0 ? {} : { usage: outcome.usage }
		}));
		return;
	}
	const id = `chatcmpl-free-${crypto.randomUUID()}`;
	try {
		let sentFinish = false;
		for await (const chunk of adapter.stream(options)) {
			const rows = chunkToOpenAi(id, modelId, chunk);
			sentFinish ||= chunk.type === "finish";
			for (const row of rows) res.write(`data: ${JSON.stringify(row)}\n\n`);
		}
		if (!sentFinish) res.write(`data: ${JSON.stringify({
			id,
			object: "chat.completion.chunk",
			created: Math.floor(Date.now() / 1e3),
			model: modelId,
			choices: [{
				index: 0,
				delta: {},
				finish_reason: "stop"
			}]
		})}\n\n`);
	} catch (error) {
		runtime.markFailure(modelId, error);
		res.write(`data: ${JSON.stringify({ error: {
			message: String(error?.message ?? error),
			type: "upstream_error"
		} })}\n\n`);
	}
	res.end("data: [DONE]\n\n");
}
function openAiToDshOptions(body, model, req) {
	const system = [];
	const messages = [];
	for (const row of Array.isArray(body.messages) ? body.messages : []) {
		if (!isRecord$1(row)) continue;
		const content = openAiContent(row.content);
		if (row.role === "system" || row.role === "developer") {
			if (content !== "") system.push(content);
			continue;
		}
		if (row.role === "tool") {
			messages.push({
				role: "user",
				content: [{
					type: "tool-result",
					toolCallId: String(row.tool_call_id ?? ""),
					content: [{
						type: "text",
						text: content
					}]
				}],
				source: {
					kind: "tool",
					callId: String(row.tool_call_id ?? "")
				}
			});
			continue;
		}
		const assistant = row.role === "assistant";
		const blocks = content === "" ? [] : [{
			type: "text",
			text: content
		}];
		if (assistant && Array.isArray(row.tool_calls)) for (const call of row.tool_calls) {
			if (!isRecord$1(call) || !isRecord$1(call.function)) continue;
			blocks.push({
				type: "tool-call",
				id: String(call.id ?? ""),
				name: String(call.function.name ?? ""),
				arguments: String(call.function.arguments ?? "{}")
			});
		}
		if (blocks.length === 0) continue;
		messages.push({
			role: assistant ? "assistant" : "user",
			content: blocks,
			...assistant ? { source: {
				kind: "model",
				provider: "dsh-free-models",
				model
			} } : {}
		});
	}
	const tools = Array.isArray(body.tools) ? body.tools.filter(isRecord$1).map((tool) => ({
		name: requireString(isRecord$1(tool.function) ? tool.function.name : tool.name, "tools[].function.name"),
		description: String((isRecord$1(tool.function) ? tool.function.description : tool.description) ?? ""),
		parameters: isRecord$1(isRecord$1(tool.function) ? tool.function.parameters : tool.parameters) ? isRecord$1(tool.function) ? tool.function.parameters : tool.parameters : {
			type: "object",
			properties: {}
		}
	})) : [];
	return {
		provider: "dsh-free-models",
		model,
		messages,
		...system.length === 0 ? {} : { system: system.join("\n\n") },
		...tools.length === 0 ? {} : { tools },
		...body.temperature === void 0 ? {} : { temperature: body.temperature },
		...body.max_tokens === void 0 ? {} : { maxTokens: body.max_tokens },
		...body.reasoning_effort === void 0 ? {} : { reasoningEffort: body.reasoning_effort },
		signal: AbortSignal.timeout(3e5),
		sessionId: `gateway:${String(body.user ?? req.headers["x-request-id"] ?? "shared")}`
	};
}
function updateOutcome(outcome, chunk) {
	if (chunk.type === "text-delta") outcome.text += chunk.text;
	else if (chunk.type === "reasoning-delta") outcome.reasoning += chunk.text;
	else if (chunk.type === "tool-call-delta") {
		let call = outcome.toolCalls.find((row) => row.index === chunk.index);
		if (call === void 0) {
			call = {
				index: chunk.index,
				id: chunk.id,
				type: "function",
				function: {
					name: chunk.name ?? "",
					arguments: ""
				}
			};
			outcome.toolCalls.push(call);
		}
		if (typeof chunk.name === "string") call.function.name = chunk.name;
		call.function.arguments += chunk.argumentsDelta;
	} else if (chunk.type === "usage") outcome.usage = chunk.usage;
	else if (chunk.type === "finish") outcome.finish = chunk.reason.kind === "tool-calls" ? "tool_calls" : chunk.reason.kind === "max-tokens" ? "length" : "stop";
}
function chunkToOpenAi(id, model, chunk) {
	if (chunk.type === "text-delta" || chunk.type === "reasoning-delta") {
		const delta = chunk.type === "text-delta" ? { content: chunk.text } : { reasoning_content: chunk.text };
		return [{
			id,
			object: "chat.completion.chunk",
			created: Math.floor(Date.now() / 1e3),
			model,
			choices: [{
				index: 0,
				delta,
				finish_reason: null
			}]
		}];
	}
	if (chunk.type === "tool-call-delta") return [{
		id,
		object: "chat.completion.chunk",
		created: Math.floor(Date.now() / 1e3),
		model,
		choices: [{
			index: 0,
			delta: { tool_calls: [{
				index: chunk.index,
				id: chunk.id,
				type: "function",
				function: {
					name: chunk.name ?? "",
					arguments: chunk.argumentsDelta
				}
			}] },
			finish_reason: null
		}]
	}];
	if (chunk.type === "usage") return [{
		id,
		object: "chat.completion.chunk",
		created: Math.floor(Date.now() / 1e3),
		model,
		choices: [{
			index: 0,
			delta: {},
			finish_reason: null
		}],
		usage: chunk.usage
	}];
	if (chunk.type === "finish") {
		const finish = chunk.reason.kind === "tool-calls" ? "tool_calls" : chunk.reason.kind === "max-tokens" ? "length" : "stop";
		return [{
			id,
			object: "chat.completion.chunk",
			created: Math.floor(Date.now() / 1e3),
			model,
			choices: [{
				index: 0,
				delta: {},
				finish_reason: finish
			}]
		}];
	}
	return [];
}
async function authorize(ctx, config, req) {
	const ref = typeof config.credentialRef === "string" ? config.credentialRef.trim() : "";
	if (ref === "") return;
	const resolved = await ctx.credentials.resolve(ref);
	if (resolved?.value === void 0) throw Object.assign(/* @__PURE__ */ new Error(`credential ${ref} is not configured`), { status: 503 });
	if (String(req.headers.authorization ?? "") !== `Bearer ${resolved.value}`) throw Object.assign(/* @__PURE__ */ new Error("invalid gateway bearer token"), { status: 401 });
}
async function readJson(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += buffer.byteLength;
		if (size > REQUEST_BODY_LIMIT) throw Object.assign(/* @__PURE__ */ new Error("request body exceeds 8 MiB"), { status: 413 });
		chunks.push(buffer);
	}
	try {
		return JSON.parse(Buffer.concat(chunks).toString("utf8"));
	} catch {
		throw Object.assign(/* @__PURE__ */ new Error("request body must be JSON"), { status: 400 });
	}
}
function openAiContent(value) {
	if (typeof value === "string") return value;
	if (!Array.isArray(value)) return "";
	return value.map((part) => {
		if (typeof part === "string") return part;
		if (!isRecord$1(part)) return "";
		const text = part.text ?? part.input_text ?? part.output_text;
		return typeof text === "string" ? text : "";
	}).filter((text) => text !== "").join("\n");
}
function isLoopbackRequest(req) {
	const remote = String(req.socket.remoteAddress ?? "").replace(/^::ffff:/iu, "").toLocaleLowerCase();
	if (remote !== "127.0.0.1" && remote !== "::1") return false;
	try {
		return new URL(req.url ?? "/", `http://${String(req.headers.host ?? "127.0.0.1")}`).hostname === "127.0.0.1";
	} catch {
		return false;
	}
}
function jsonHeaders() {
	return {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	};
}
function sseHeaders() {
	return {
		"content-type": "text/event-stream; charset=utf-8",
		"cache-control": "no-store",
		connection: "keep-alive"
	};
}
function corsHeaders() {
	return {
		"access-control-allow-origin": "*",
		"access-control-allow-headers": "authorization,content-type",
		"access-control-allow-methods": "GET,POST,OPTIONS"
	};
}
function requireString(value, field) {
	if (typeof value !== "string" || value.trim() === "") throw Object.assign(/* @__PURE__ */ new Error(`${field} is required`), { status: 400 });
	return value.trim();
}
function isRecord$1(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
//#endregion
//#region src/free-model.ts
/**
* Keyless free-model lanes and the DSH LLM adapter.
*
* Kilo contributes rows its catalog marks `isFree`; OpenCode contributes its
* explicit public-pool ids. Catalog refresh never mutates user provider settings;
* availability is runtime-local so an egress-specific refusal cannot delete a route.
*/
const FREE_MODEL_PROVIDER_ID = "dsh-free-models";
const DEFAULT_FREE_MODEL_BASE = "https://ai-gateway.kilo.ai/api/v1";
const DEFAULT_OPENCODE_BASE = "https://opencode.ai";
const FREE_MODELS_API_PATH = "/model-palette/api/free-models";
/** Host-config surface for the keyless lane and loopback OpenAI gateway. */
const FreeModelsConfigSchema = z.object({
	enabled: z.boolean().default(true),
	baseURL: z.string().default(DEFAULT_FREE_MODEL_BASE),
	opencodeBaseURL: z.string().default(DEFAULT_OPENCODE_BASE),
	probeOnStartup: z.boolean().default(true),
	probeIntervalMinutes: z.number().step(1).min(0).max(1440).default(60),
	probeConcurrency: z.number().step(1).min(1).max(8).default(2),
	gateway: z.object({
		enabled: z.boolean().default(true),
		port: z.number().step(1).min(0).max(65535).default(4180),
		credentialRef: z.string().default("")
	}).default({})
});
const CATALOG_TIMEOUT_MS = 2e4;
const TURN_TIMEOUT_MS = 3e5;
const PROBE_TIMEOUT_MS = 45e3;
/** Public capability catalog (same source the opencode ecosystem uses) backing context/reasoning enrichment. */
const MODELS_DEV_URL = "https://models.dev/api.json";
const MODELS_DEV_TIMEOUT_MS = 2e4;
const MODELS_DEV_TTL_MS = 432e5;
const OPENCODE_EFFORT_LADDER = [
	"off",
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"max"
];
const USER_AGENT = "dsh-model-palette/0.20";
const ATTRIBUTION_HEADERS = Object.freeze({
	"http-referer": "https://kilo.ai/",
	"x-title": "DSH Model Palette"
});
const OPENCODE_ALWAYS_FREE = /* @__PURE__ */ new Set(["big-pickle", "space-bunny-free"]);
const OPENCODE_NON_CHAT = /* @__PURE__ */ new Set([
	"union-alpha",
	"muse-spark-1.2-contributor-free",
	"muse-spark-1.3-contributor-free"
]);
const BOOT_NONCE = crypto$1.randomUUID();
function opencodeSession(seed) {
	const digest = crypto$1.createHash("sha256").update(`ses\0${BOOT_NONCE}\0${seed}`).digest();
	const midnight = Math.floor(Date.now() / 864e5) * 864e5;
	const offset = digest.readUInt32BE(0) % 2592e6;
	const inverted = ~(BigInt(midnight - offset) << 12n | 1n) & 281474976710655n;
	const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	let value = digest.subarray(6, 16).reduce((sum, byte) => sum << 8n | BigInt(byte), 0n);
	let random = "";
	for (let index = 0; index < 14; index++) {
		random += alphabet[Number(value % 62n)];
		value /= 62n;
	}
	return `ses_${inverted.toString(16).padStart(12, "0")}${random}`;
}
function opencodeHeaders(session, accept) {
	const project = crypto$1.createHash("sha256").update(`opencode-project\0${session}`).digest().subarray(0, 20).toString("hex");
	const trace = crypto$1.randomBytes(16).toString("hex");
	const span = crypto$1.randomBytes(8).toString("hex");
	return {
		authorization: "Bearer public",
		"user-agent": "opencode/latest/2.2.3/cli",
		"x-opencode-client": "cli",
		"x-session-affinity": session,
		"x-session-id": session,
		"x-opencode-session": session,
		"x-opencode-session-id": session,
		"x-opencode-project": project,
		traceparent: `00-${trace}-${span}-01`,
		b3: `${trace}-${span}-1`,
		accept
	};
}
/** Validate and project the Kilo listing's free rows. */
function parseFreeModelCatalog(value) {
	const rows = Array.isArray(value?.data) ? value.data : [];
	const entries = [];
	const seen = /* @__PURE__ */ new Set();
	for (const row of rows) {
		if (!isRecord(row) || row.isFree !== true || typeof row.id !== "string" || row.id.trim() === "") continue;
		const id = row.id.trim();
		if (seen.has(id)) continue;
		const supported = Array.isArray(row.supported_parameters) ? row.supported_parameters : [];
		const modalities = isRecord(row.architecture) && Array.isArray(row.architecture.input_modalities) ? row.architecture.input_modalities.filter((item) => item === "text" || item === "image") : ["text"];
		const top = isRecord(row.top_provider) ? row.top_provider : {};
		const reasoning = supported.includes("reasoning");
		entries.push({
			id,
			name: displayName(row, id),
			contextWindow: positiveInteger(row.context_length) ?? positiveInteger(top.context_length) ?? 131072,
			maxOutput: positiveInteger(top.max_completion_tokens) ?? 32768,
			input: modalities.length === 0 ? ["text"] : modalities,
			efforts: reasoning ? reasoningEfforts(id) : [],
			canDisableReasoning: reasoning && !/^stepfun\//iu.test(id) && !/^liquid\//iu.test(id) && id !== "kilo-auto/free" && id !== "openrouter/free",
			channel: "kilo"
		});
		seen.add(id);
	}
	return entries;
}
/** Project the OpenCode free lane's id-only listing. */
function parseOpenCodeCatalog(value) {
	const rows = Array.isArray(value?.data) ? value.data : [];
	const entries = [];
	const seen = /* @__PURE__ */ new Set();
	for (const row of rows) {
		if (!isRecord(row) || typeof row.id !== "string") continue;
		const id = row.id.trim();
		if (id === "" || seen.has(id) || OPENCODE_NON_CHAT.has(id) || !(OPENCODE_ALWAYS_FREE.has(id) || /(?:^|[-_])free(?:$|[-_.])/iu.test(id))) continue;
		const deep = /deepseek|glm|kimi/iu.test(id);
		const contextWindow = /^mimo.*v2\.6/iu.test(id) || /^muse.?spark/iu.test(id) || deep ? 1048576 : /^mimo.*v2\.5/iu.test(id) ? 1048576 : /^space.?bunny/iu.test(id) ? 262144 : /^nemotron|^ling/iu.test(id) ? 128e3 : /^jev/iu.test(id) ? 32768 : 131072;
		entries.push({
			id,
			name: typeof row.name === "string" && row.name.trim() !== "" ? row.name.trim() : id,
			contextWindow,
			maxOutput: 32768,
			input: ["text"],
			efforts: deep ? [
				"off",
				"minimal",
				"low",
				"medium",
				"high",
				"xhigh",
				"max"
			] : [],
			canDisableReasoning: deep,
			channel: "opencode"
		});
		seen.add(id);
	}
	return entries;
}
/**
* Index the models.dev document by normalized model id. Aliases cover the
* `-free` suffix variants the OpenCode lane uses, and entries from the
* opencode/kilo namespaces win over same-id rows from other aggregators.
*/
function parseModelsDevCatalog(value) {
	const index = /* @__PURE__ */ new Map();
	if (!isRecord(value)) return index;
	const register = (id, model, strong) => {
		if (typeof id !== "string" || id.trim() === "" || !isRecord(model)) return;
		const record = {};
		const limit = isRecord(model.limit) ? model.limit : {};
		const context = positiveInteger(limit.context);
		const output = positiveInteger(limit.output);
		if (context !== void 0) record.contextWindow = context;
		if (output !== void 0) record.maxOutput = output;
		if (model.reasoning === true || model.reasoning === false) record.reasoning = model.reasoning;
		if (typeof model.name === "string" && model.name.trim() !== "") record.name = model.name.trim();
		if (Object.keys(record).length === 0) return;
		const normalized = normalizeModelsDevId(id);
		const withoutFree = normalized.replace(/-free$/u, "");
		for (const key of /* @__PURE__ */ new Set([normalized, withoutFree])) if (strong || !index.has(key)) index.set(key, record);
	};
	const preferred = [
		"opencode",
		"kilo",
		"kilo-ai",
		"kiloai"
	];
	for (const [providerId, provider] of Object.entries(value)) {
		if (preferred.includes(providerId.toLocaleLowerCase())) continue;
		if (!isRecord(provider)) continue;
		for (const [id, model] of Object.entries(isRecord(provider.models) ? provider.models : {})) register(id, model, false);
	}
	for (const providerId of preferred) {
		const provider = value[providerId];
		if (!isRecord(provider)) continue;
		for (const [id, model] of Object.entries(isRecord(provider.models) ? provider.models : {})) register(id, model, true);
	}
	return index;
}
function normalizeModelsDevId(id) {
	return id.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/gu, "-");
}
/** Fill context, output, reasoning, and display name facts the upstream listings omit. */
function enrichFreeModelEntries(entries, facts) {
	return entries.map((entry) => {
		const record = facts.get(normalizeModelsDevId(entry.id)) ?? facts.get(normalizeModelsDevId(entry.id.replace(/[-_.]?free$/iu, ""))) ?? facts.get(normalizeModelsDevId(entry.id.split("/").at(-1) ?? entry.id));
		if (record === void 0) return entry;
		const next = { ...entry };
		if (record.contextWindow !== void 0) next.contextWindow = record.contextWindow;
		if (record.maxOutput !== void 0) next.maxOutput = record.maxOutput;
		if (record.reasoning === true && next.efforts.length === 0) {
			next.efforts = [...OPENCODE_EFFORT_LADDER];
			next.canDisableReasoning = true;
		}
		if (record.name !== void 0 && (next.name === next.id || next.name === "")) next.name = record.name;
		return next;
	});
}
/** Classify whether an upstream answer proves this exact model cannot route. */
function freeModelUnavailable(error) {
	const status = error?.status;
	const message = String(error?.message ?? "");
	if (status === 400 || status === 404 || status === 422) return true;
	return !Number.isInteger(status) && /model is unavailable|no such model|unknown model|invalid model|not supported/iu.test(message);
}
/** Determine the payload shape from leading bytes, independently of Content-Type. */
function sniffBodyShape(text) {
	const lead = text.slice(0, 512).trimStart();
	if (lead === "") return "empty";
	if (/^(?:data:|event:|id:|:|retry:)/iu.test(lead)) return "sse";
	return "json";
}
/**
* Post one Chat Completions request and yield each SSE data payload.
* A 2xx JSON document is also yielded once; the decision is made from body bytes,
* so a gateway that labels an SSE stream as application/json remains readable.
*/
async function* streamChatPayloads(options) {
	const fetchImpl = options.fetchImpl ?? fetch;
	const timeout = options.signal === void 0 ? AbortSignal.timeout(options.timeoutMs ?? TURN_TIMEOUT_MS) : AbortSignal.any([options.signal, AbortSignal.timeout(options.timeoutMs ?? TURN_TIMEOUT_MS)]);
	const opencode = options.entry.channel === "opencode";
	const session = opencodeSession(`turn:${options.entry.id}:${String(options.body.user ?? options.entry.id)}`);
	const body = opencode ? (() => {
		const { max_tokens: _ignored, ...rest } = options.body;
		return {
			...rest,
			max_completion_tokens: options.body.max_tokens ?? 32e3,
			stream_options: { include_usage: true }
		};
	})() : options.body;
	const response = await fetchImpl(opencode ? `${(options.opencodeBaseURL ?? "https://opencode.ai").replace(/\/+$/u, "")}/inference/openai/v1/chat/completions` : `${options.baseURL.replace(/\/+$/u, "")}/chat/completions`, {
		method: "POST",
		headers: opencode ? {
			"content-type": "application/json",
			...opencodeHeaders(session, "text/event-stream")
		} : {
			"content-type": "application/json",
			accept: "text/event-stream",
			"user-agent": USER_AGENT,
			...ATTRIBUTION_HEADERS
		},
		body: JSON.stringify(body),
		signal: timeout,
		redirect: "error"
	});
	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw Object.assign(new Error(errorDetail(response.status, text)), { status: response.status });
	}
	if (response.body === null) throw new Error("free-model stream returned no body");
	let shape;
	let json = "";
	let sse = "";
	const decoder = new TextDecoder();
	for await (const chunk of response.body) {
		const bytes = chunk instanceof Uint8Array ? chunk : new TextEncoder().encode(String(chunk));
		const text = decoder.decode(bytes, { stream: true });
		if (shape === void 0) {
			shape = sniffBodyShape(text);
			if (shape === "empty") continue;
		}
		if (shape === "json") {
			json += text;
			continue;
		}
		sse += text;
		let boundary;
		while ((boundary = /(?:\r\n|\r|\n){2}/u.exec(sse)) !== null) {
			const frame = sse.slice(0, boundary.index);
			sse = sse.slice(boundary.index + boundary[0].length);
			const data = frame.split(/(?:\r\n|\r|\n)/u).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
			if (data !== "") yield data;
		}
	}
	const tail = decoder.decode();
	if (shape === "json") {
		json += tail;
		if (json.trim() !== "") yield json;
		return;
	}
	sse += tail;
	const data = sse.split(/(?:\r\n|\r|\n)/u).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
	if (data !== "") yield data;
}
/** Map OpenAI usage facts to DSH's disjoint token counters. */
function mapChatUsage(value) {
	if (!isRecord(value)) return void 0;
	const prompt = positiveInteger(value.prompt_tokens) ?? positiveInteger(value.input_tokens);
	const completion = positiveInteger(value.completion_tokens) ?? positiveInteger(value.output_tokens);
	if (prompt === void 0 && completion === void 0) return void 0;
	const cached = positiveInteger(isRecord(value.prompt_tokens_details) ? value.prompt_tokens_details.cached_tokens : void 0) ?? positiveInteger(isRecord(value.input_tokens_details) ? value.input_tokens_details.cached_tokens : void 0) ?? 0;
	const reasoning = positiveInteger(isRecord(value.completion_tokens_details) ? value.completion_tokens_details.reasoning_tokens : void 0) ?? positiveInteger(isRecord(value.output_tokens_details) ? value.output_tokens_details.reasoning_tokens : void 0);
	const result = {
		inputTokens: Math.max(0, (prompt ?? 0) - cached),
		outputTokens: completion ?? 0,
		totalTokens: (prompt ?? 0) + (completion ?? 0)
	};
	if (cached > 0) result.cacheReadTokens = cached;
	if (reasoning !== void 0 && reasoning > 0) result.reasoningTokens = reasoning;
	return result;
}
/** Convert DSH request messages to an OpenAI Chat Completions body. */
function toChatBody(options, entry) {
	const messages = [];
	if (typeof options.system === "string" && options.system !== "") messages.push({
		role: "system",
		content: options.system
	});
	for (const message of options.messages ?? []) {
		const blocks = Array.isArray(message.content) ? message.content : [];
		const text = blocks.filter(isRecord).map((block) => {
			if (block.type === "text" && typeof block.text === "string") return block.text;
			if (block.type === "reasoning" && typeof block.text === "string") return `<thinking>${block.text}</thinking>`;
			if (block.type === "tool-call") return `<tool-call>${block.name ?? ""} ${block.arguments ?? ""}</tool-call>`;
			if (block.type === "tool-result") return `<tool-result>${contentText(block.content)}</tool-result>`;
			return "";
		}).filter((text) => text !== "").join("\n");
		if (message.source?.kind === "tool") {
			messages.push({
				role: "tool",
				tool_call_id: String(message.source.callId ?? ""),
				content: text
			});
			continue;
		}
		const row = {
			role: message.role === "assistant" ? "assistant" : "user",
			content: text
		};
		if (message.role === "assistant") {
			const calls = blocks.filter(isRecord).filter((block) => block.type === "tool-call");
			if (calls.length > 0) row.tool_calls = calls.map((call) => ({
				id: String(call.id ?? ""),
				type: "function",
				function: {
					name: String(call.name ?? ""),
					arguments: String(call.arguments ?? "{}")
				}
			}));
			const reasoning = blocks.filter(isRecord).find((block) => block.type === "reasoning" && typeof block.text === "string");
			if (reasoning !== void 0) row.reasoning_content = reasoning.text;
		}
		if (!(typeof row.content === "string" && row.content === "" && row.tool_calls === void 0)) messages.push(row);
	}
	const tools = Array.isArray(options.tools) ? options.tools.filter(isRecord).map((tool) => ({
		type: "function",
		function: {
			name: String(tool.name ?? ""),
			description: String(tool.description ?? ""),
			parameters: isRecord(tool.parameters) ? tool.parameters : {
				type: "object",
				properties: {}
			}
		}
	})) : [];
	const body = {
		model: entry.id,
		messages,
		stream: true,
		...options.temperature === void 0 ? {} : { temperature: options.temperature },
		...options.maxTokens === void 0 ? {} : { max_tokens: options.maxTokens },
		...options.stop === void 0 ? {} : { stop: options.stop },
		...tools.length === 0 ? {} : {
			tools,
			tool_choice: "auto"
		},
		...options.sessionId === void 0 ? {} : { user: `dsh:${String(options.sessionId)}` }
	};
	if (typeof options.reasoningEffort === "string" && entry.efforts.length > 0) {
		if (entry.channel === "opencode") body.reasoning_effort = options.reasoningEffort === "off" && entry.canDisableReasoning ? "none" : options.reasoningEffort;
		else body.reasoning = options.reasoningEffort === "off" && entry.canDisableReasoning ? { enabled: false } : { effort: options.reasoningEffort };
	}
	return body;
}
/** Adapt keyless free models to the structural DSH LlmAdapter contract. */
var FreeModelAdapter = class {
	runtime;
	constructor(runtime) {
		this.runtime = runtime;
	}
	providerInfo(provider) {
		return {
			id: provider,
			name: "Free Models"
		};
	}
	providerRetryPolicy(_provider) {}
	async listModels() {
		return this.runtime.availableEntries().map((entry) => ({
			provider: FREE_MODEL_PROVIDER_ID,
			id: entry.id,
			name: entry.name,
			inputModalities: entry.input
		}));
	}
	async resolveModel(_provider, model) {
		const entry = this.runtime.entry(model);
		if (entry === void 0) throw new Error(`free model "${model}" is not loaded`);
		const efforts = entry.efforts.map((id) => ({
			id,
			name: id.charAt(0).toLocaleUpperCase() + id.slice(1)
		}));
		return {
			provider: FREE_MODEL_PROVIDER_ID,
			id: entry.id,
			name: entry.name,
			inputModalities: entry.input,
			context: { contextWindow: entry.contextWindow },
			defaultMaxTokens: entry.maxOutput,
			...efforts.length === 0 ? {} : { reasoning: {
				efforts,
				defaultEffort: entry.efforts.at(-1)
			} }
		};
	}
	async *stream(options) {
		const entry = this.runtime.entry(options.model);
		if (entry === void 0) throw new Error(`free model "${options.model}" is not loaded`);
		try {
			yield* chatPayloadsToChunks(streamChatPayloads({
				baseURL: this.runtime.baseURL,
				opencodeBaseURL: this.runtime.opencodeBaseURL,
				entry,
				body: toChatBody(options, entry),
				signal: options.signal,
				fetchImpl: this.runtime.fetchImpl
			}), this.runtime, entry);
		} catch (error) {
			this.runtime.markFailure(entry.id, error);
			throw error;
		}
	}
};
/** Convert OpenAI stream payloads into DSH raw chunks. */
async function* chatPayloadsToChunks(payloads, runtime, entry) {
	const blocks = /* @__PURE__ */ new Map();
	let nextIndex = 0;
	let finish;
	let usage;
	const slot = function* (key, type, id, name) {
		let block = blocks.get(key);
		if (block === void 0) {
			block = {
				index: nextIndex++,
				type,
				text: "",
				id,
				name,
				arguments: ""
			};
			blocks.set(key, block);
			yield {
				type: "block-start",
				index: block.index,
				blockType: type
			};
		}
		return block;
	};
	for await (const payloadText of payloads) {
		if (payloadText === "[DONE]") break;
		let payload;
		try {
			payload = JSON.parse(payloadText);
		} catch {
			continue;
		}
		if (!isRecord(payload)) continue;
		if (payload.error !== void 0 || payload.type === "error") {
			const error = isRecord(payload.error) ? payload.error : payload;
			throw Object.assign(new Error(String(error.message ?? "free-model stream error")), { status: positiveInteger(payload.code) });
		}
		const choice = Array.isArray(payload.choices) ? payload.choices.find(isRecord) : void 0;
		const delta = choice !== void 0 && isRecord(choice.delta) ? choice.delta : {};
		const reasoning = firstString(delta, [
			"reasoning",
			"reasoning_content",
			"reasoning_text",
			"thinking"
		]);
		if (reasoning !== void 0) {
			const generator = slot("reasoning", "reasoning");
			for (const chunk of generator) yield chunk;
			const block = blocks.get("reasoning");
			block.text += reasoning;
			yield {
				type: "reasoning-delta",
				index: block.index,
				text: reasoning
			};
		}
		if (typeof delta.content === "string" && delta.content !== "") {
			const generator = slot("text", "text");
			for (const chunk of generator) yield chunk;
			const block = blocks.get("text");
			block.text += delta.content;
			yield {
				type: "text-delta",
				index: block.index,
				text: delta.content
			};
		}
		if (Array.isArray(delta.tool_calls)) for (const rawCall of delta.tool_calls) {
			if (!isRecord(rawCall)) continue;
			const key = `tool:${positiveInteger(rawCall.index) ?? blocks.size}`;
			const generator = slot(key, "tool-call", typeof rawCall.id === "string" ? rawCall.id : void 0, isRecord(rawCall.function) && typeof rawCall.function.name === "string" ? rawCall.function.name : void 0);
			for (const chunk of generator) yield chunk;
			const block = blocks.get(key);
			if (block.id === void 0 && typeof rawCall.id === "string") block.id = rawCall.id;
			if (block.name === void 0 && isRecord(rawCall.function) && typeof rawCall.function.name === "string") block.name = rawCall.function.name;
			if (isRecord(rawCall.function) && typeof rawCall.function.arguments === "string") block.arguments += rawCall.function.arguments;
			yield {
				type: "tool-call-delta",
				index: block.index,
				id: block.id ?? `call-${block.index}`,
				...block.name === void 0 ? {} : { name: block.name },
				argumentsDelta: isRecord(rawCall.function) && typeof rawCall.function.arguments === "string" ? rawCall.function.arguments : ""
			};
		}
		if (payload.usage !== void 0) usage = mapChatUsage(payload.usage);
		if (choice !== void 0 && typeof choice.finish_reason === "string" && choice.finish_reason !== "") finish = choice.finish_reason;
	}
	for (const block of [...blocks.values()].sort((left, right) => left.index - right.index)) if (block.type === "tool-call") yield {
		type: "block-end",
		index: block.index,
		block: {
			type: "tool-call",
			id: block.id ?? `call-${block.index}`,
			name: block.name ?? "",
			arguments: block.arguments === "" ? "{}" : block.arguments
		}
	};
	else yield {
		type: "block-end",
		index: block.index,
		block: {
			type: block.type,
			text: block.text
		}
	};
	if (usage !== void 0) yield {
		type: "usage",
		usage
	};
	const sawToolCall = [...blocks.values()].some((block) => block.type === "tool-call");
	yield {
		type: "finish",
		reason: { kind: finish === "length" ? "max-tokens" : finish === "tool_calls" || sawToolCall ? "tool-calls" : "stop" }
	};
}
/** Mutable runtime state shared by the LLM adapter and local gateway. */
var FreeModelRuntime = class {
	baseURL;
	opencodeBaseURL;
	entries = [];
	unavailable = /* @__PURE__ */ new Set();
	verdicts = /* @__PURE__ */ new Map();
	handle;
	capabilityCache;
	fetchImpl;
	constructor(baseURL, fetchImpl = fetch, opencodeBaseURL = DEFAULT_OPENCODE_BASE) {
		this.baseURL = baseURL;
		this.opencodeBaseURL = opencodeBaseURL;
		this.fetchImpl = fetchImpl;
	}
	setHandle(handle) {
		this.handle = handle;
	}
	availableEntries() {
		return this.entries.filter((entry) => !this.unavailable.has(entry.id));
	}
	entry(id) {
		return this.availableEntries().find((entry) => entry.id === id);
	}
	snapshot() {
		return {
			models: this.availableEntries().map((entry) => ({ ...entry })),
			verdicts: Object.fromEntries(this.verdicts)
		};
	}
	async refresh(signal, options = {}) {
		const deadline = signal ?? AbortSignal.timeout(CATALOG_TIMEOUT_MS);
		const [kilo, opencode, capabilities] = await Promise.allSettled([
			this.fetchImpl(`${this.baseURL.replace(/\/+$/u, "")}/models`, {
				headers: {
					accept: "application/json",
					"user-agent": USER_AGENT,
					...ATTRIBUTION_HEADERS
				},
				signal: deadline,
				redirect: "error"
			}).then(async (response) => {
				if (!response.ok) throw new Error(`Kilo catalog returned HTTP ${response.status}`);
				return parseFreeModelCatalog(await response.json());
			}),
			this.fetchImpl(`${this.opencodeBaseURL.replace(/\/+$/u, "")}/inference/v1/models`, {
				headers: opencodeHeaders(opencodeSession("catalog"), "application/json"),
				signal: deadline,
				redirect: "error"
			}).then(async (response) => {
				if (!response.ok) throw new Error(`OpenCode catalog returned HTTP ${response.status}`);
				return parseOpenCodeCatalog(await response.json());
			}),
			this.loadCapabilityFacts(options.force === true, signal)
		]);
		if (kilo.status === "rejected" && opencode.status === "rejected") throw kilo.reason;
		const merged = /* @__PURE__ */ new Map();
		for (const entry of [...kilo.status === "fulfilled" ? kilo.value : [], ...opencode.status === "fulfilled" ? opencode.value : []]) merged.set(entry.id, entry);
		const facts = capabilities.status === "fulfilled" ? capabilities.value : void 0;
		const previous = new Set(this.entries.map((entry) => entry.id));
		this.entries = facts === void 0 ? [...merged.values()] : enrichFreeModelEntries([...merged.values()], facts);
		for (const id of [...this.unavailable]) if (!this.entries.some((entry) => entry.id === id)) this.unavailable.delete(id);
		this.announce();
		const ids = new Set(this.entries.map((entry) => entry.id));
		return {
			total: this.entries.length,
			available: this.availableEntries().length,
			added: [...ids].filter((id) => !previous.has(id)).length,
			removed: [...previous].filter((id) => !ids.has(id)).length,
			checkedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
	}
	/** Cached models.dev capability index; refreshes at most twice a day unless forced. */
	async loadCapabilityFacts(force, signal) {
		if (!force && this.capabilityCache !== void 0 && Date.now() - this.capabilityCache.fetchedAt < MODELS_DEV_TTL_MS) return this.capabilityCache.facts;
		const response = await this.fetchImpl(MODELS_DEV_URL, {
			headers: {
				accept: "application/json",
				"user-agent": USER_AGENT
			},
			signal: signal ?? AbortSignal.timeout(MODELS_DEV_TIMEOUT_MS),
			redirect: "error"
		});
		if (!response.ok) throw new Error(`models.dev returned HTTP ${response.status}`);
		const facts = parseModelsDevCatalog(await response.json());
		this.capabilityCache = {
			facts,
			fetchedAt: Date.now()
		};
		return facts;
	}
	async probeAll(concurrency = 2, signal) {
		const cursor = { index: 0 };
		await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, this.entries.length)) }, async () => {
			while (cursor.index < this.entries.length) {
				const entry = this.entries[cursor.index++];
				await this.probe(entry.id, signal);
			}
		}));
		this.announce();
		return this.snapshot();
	}
	async probe(id, signal) {
		const entry = this.entries.find((item) => item.id === id);
		if (entry === void 0) throw new Error(`free model "${id}" is not loaded`);
		try {
			for await (const payload of streamChatPayloads({
				baseURL: this.baseURL,
				opencodeBaseURL: this.opencodeBaseURL,
				entry,
				body: {
					model: entry.id,
					messages: [{
						role: "user",
						content: "ping"
					}],
					stream: true,
					max_tokens: 16
				},
				signal,
				fetchImpl: this.fetchImpl,
				timeoutMs: PROBE_TIMEOUT_MS
			})) if (/"(?:type"\s*:\s*"error"|"error"\s*:)/u.test(payload)) throw new Error(payload.slice(0, 240));
			this.unavailable.delete(id);
			this.verdicts.set(id, {
				state: "available",
				checkedAt: (/* @__PURE__ */ new Date()).toISOString()
			});
			return "available";
		} catch (error) {
			const unavailable = freeModelUnavailable(error);
			if (unavailable) this.unavailable.add(id);
			this.verdicts.set(id, {
				state: unavailable ? "unavailable" : "unknown",
				...String(error?.message ?? error) === "" ? {} : { detail: String(error?.message ?? error).slice(0, 240) },
				checkedAt: (/* @__PURE__ */ new Date()).toISOString()
			});
			return unavailable ? "unavailable" : "unknown";
		}
	}
	markFailure(id, error) {
		if (!freeModelUnavailable(error)) return false;
		this.unavailable.add(id);
		this.verdicts.set(id, {
			state: "unavailable",
			detail: String(error?.message ?? error).slice(0, 240),
			checkedAt: (/* @__PURE__ */ new Date()).toISOString()
		});
		this.announce();
		return true;
	}
	announce() {
		this.handle?.replace([FREE_MODEL_PROVIDER_ID]);
	}
};
/** Register adapter, background availability maintenance, and the local gateway. */
function registerFreeModels(ctx, config = {}) {
	const runtime = new FreeModelRuntime(String(config.baseURL ?? "https://ai-gateway.kilo.ai/api/v1"), config.fetch ?? fetch, String(config.opencodeBaseURL ?? "https://opencode.ai"));
	const adapter = new FreeModelAdapter(runtime);
	const handle = ctx.llm.registerAdapter([FREE_MODEL_PROVIDER_ID], adapter);
	runtime.setHandle(handle);
	const gateway = config.gateway?.enabled === false ? {
		dispose: async () => {},
		port: () => void 0
	} : registerFreeGateway(ctx, adapter, runtime, config.gateway ?? {});
	let stopped = false;
	const controller = new AbortController();
	let timer;
	const bootstrap = async () => {
		while (!stopped) try {
			await runtime.refresh(controller.signal);
			if (config.probeOnStartup !== false) await runtime.probeAll(Number(config.probeConcurrency ?? 2), controller.signal);
			break;
		} catch (error) {
			if (stopped || controller.signal.aborted) break;
			ctx.logger?.warn?.(`dsh-model-palette: free-model catalog refresh failed: ${String(error?.message ?? error)}`);
			await sleep(6e4, controller.signal);
		}
		const interval = Number(config.probeIntervalMinutes ?? 60);
		if (!stopped && Number.isInteger(interval) && interval > 0) {
			timer = setInterval(() => {
				runtime.refresh(controller.signal).catch((error) => ctx.logger?.warn?.(`dsh-model-palette: scheduled free-model catalog refresh failed: ${String(error?.message ?? error)}`)).then(() => runtime.probeAll(Number(config.probeConcurrency ?? 2), controller.signal).catch(() => {}));
			}, interval * 6e4);
			timer.unref?.();
		}
	};
	bootstrap();
	ctx.effect(() => {
		const disposeApi = registerFreeModelsRefreshApi(ctx, runtime);
		return async () => {
			stopped = true;
			controller.abort();
			if (timer !== void 0) clearInterval(timer);
			await disposeApi();
			await gateway.dispose();
			handle();
		};
	}, "dsh-model-palette: free models");
}
/** Serve GET/POST under /model-palette/api/free-models so the palette can read and refresh the keyless lane. */
function registerFreeModelsRefreshApi(ctx, runtime) {
	const registered = ctx.webServer?.register?.({
		kind: "prefix",
		path: FREE_MODELS_API_PATH,
		handler: async (req, res) => {
			try {
				const site = req.headers?.["sec-fetch-site"];
				if (site !== void 0 && site !== "same-origin" && site !== "same-site" && site !== "none") {
					writeJson(res, 403, {
						ok: false,
						error: { message: "cross-site request rejected" }
					});
					return;
				}
				let pathname = FREE_MODELS_API_PATH;
				try {
					pathname = new URL(req.url ?? "/", "http://dsh.internal").pathname;
				} catch {}
				if (pathname === `/model-palette/api/free-models/snapshot` && req.method === "GET") {
					writeJson(res, 200, {
						ok: true,
						value: {
							...runtime.snapshot(),
							provider: FREE_MODEL_PROVIDER_ID
						}
					});
					return;
				}
				if (req.method !== "POST") {
					writeJson(res, 405, {
						ok: false,
						error: { message: "method not allowed" }
					});
					return;
				}
				if (pathname !== `/model-palette/api/free-models/refresh`) {
					writeJson(res, 404, {
						ok: false,
						error: { message: "unknown free-models action" }
					});
					return;
				}
				let body = {};
				try {
					const text = await new Promise((resolve, reject) => {
						let buffer = "";
						req.on("data", (chunk) => {
							buffer += chunk.toString();
							if (buffer.length > 65536) reject(/* @__PURE__ */ new Error("request body is too large"));
						});
						req.on("end", () => resolve(buffer));
						req.on("error", reject);
					});
					if (text.trim() !== "") body = JSON.parse(text);
				} catch (error) {
					writeJson(res, 400, {
						ok: false,
						error: { message: `invalid request body: ${String(error?.message ?? error)}` }
					});
					return;
				}
				writeJson(res, 200, {
					ok: true,
					value: await runtime.refresh(void 0, { force: body?.force === true })
				});
			} catch (error) {
				writeJson(res, 502, {
					ok: false,
					error: { message: `free-model catalog refresh failed: ${String(error?.message ?? error)}` }
				});
			}
		}
	});
	return async () => {
		registered?.();
	};
}
function writeJson(res, status, value) {
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
		"x-content-type-options": "nosniff"
	});
	res.end(JSON.stringify(value));
}
function sleep(ms, signal) {
	return new Promise((resolve, reject) => {
		if (signal.aborted) return reject(/* @__PURE__ */ new Error("aborted"));
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		timer.unref?.();
		function onAbort() {
			clearTimeout(timer);
			reject(/* @__PURE__ */ new Error("aborted"));
		}
		signal.addEventListener("abort", onAbort, { once: true });
	});
}
function displayName(row, id) {
	return (typeof row.name === "string" && row.name.trim() !== "" ? row.name.trim() : id).replace(/^[^:]{1,40}:\s*/u, "").replace(/\s*\(free\)\s*$/iu, "").trim() || id;
}
function reasoningEfforts(id) {
	return /^stepfun\//iu.test(id) || /^liquid\//iu.test(id) || id === "kilo-auto/free" || id === "openrouter/free" ? [
		"low",
		"medium",
		"high"
	] : [
		"off",
		"low",
		"medium",
		"high"
	];
}
function firstString(value, fields) {
	for (const field of fields) if (typeof value[field] === "string" && value[field] !== "") return value[field];
}
function contentText(value) {
	return Array.isArray(value) ? value.filter(isRecord).map((block) => typeof block.text === "string" ? block.text : "").join("\n") : String(value ?? "");
}
function errorDetail(status, text) {
	try {
		const value = JSON.parse(text);
		return String(value?.error?.message ?? value?.message ?? `HTTP ${status}`);
	} catch {
		return text.slice(0, 240) || `HTTP ${status}`;
	}
}
function positiveInteger(value) {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : void 0;
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
//#endregion
//#region src/settings-namespace.ts
function record(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function schemaRoot(value) {
	if (!record(value)) return void 0;
	if (record(value.refs) && (typeof value.uid === "number" || typeof value.uid === "string")) {
		const root = value.refs[String(value.uid)];
		return record(root) ? root : void 0;
	}
	return value;
}
/**
* Resolve canonical namespaces or one renamed profile entry by its editable fields.
* Ambiguous instances require the canonical entry id; substring matches are never used.
* @param entries Active settings descriptors.
* @param ns Canonical namespace or explicit profile entry id.
* @returns The matching entry, or undefined when it is not active.
*/
function settingsEntry(entries, ns) {
	const exact = entries.find((entry) => entry.ns === ns);
	if (exact !== void 0) return exact;
	const fields = ns === "dsh-model-palette" ? ["requestRetries", "freeSync"] : ns === "llm-pi-ai" ? ["providers"] : void 0;
	if (fields === void 0) return void 0;
	const matches = entries.filter((entry) => {
		const root = schemaRoot(entry.schema);
		const dict = record(root?.dict) ? root.dict : void 0;
		return dict !== void 0 && fields.every((field) => Object.hasOwn(dict, field));
	});
	if (matches.length > 1) throw new Error(`Multiple settings entries match "${ns}": ${matches.map((entry) => entry.ns).join(", ")}`);
	return matches[0];
}
//#endregion
//#region src/compat/settings-backend.js
/**
* Adapt native DSH 0.1 settings and DSH 0.2 SettingsForms to live read/write handles.
* @param ctx Plugin context with its owning profile entry and settings service.
* @returns Namespace registration, synchronous reads, and revision-aware mutations.
*/
function createSettingsBackend(ctx) {
	const settings = ctx.settings;
	if (settings && typeof settings.register === "function" && typeof settings.get === "function" && typeof settings.mutate === "function") return {
		mode: "native",
		register: (ns, schema, opts) => settings.register(ns, schema, opts),
		get: (ns) => settings.get(ns),
		snapshot: (ns) => settings.describe({ redactSecrets: false }).find((entry) => entry.ns === ns),
		mutate: (ns, ops, revision) => settings.mutate(ns, ops, revision)
	};
	if (!settings || typeof settings.describe !== "function" || typeof settings.mutate !== "function") throw new Error("dsh-model-palette requires native settings or SettingsForms describe/mutate support");
	const ownNs = ctx.fiber?.entry?.options?.id ?? "dsh-model-palette";
	function findEntry(ns) {
		const target = ns === "dsh-model-palette" ? ownNs : ns;
		return settingsEntry(settings.describe({ redactSecrets: false }), target);
	}
	return {
		mode: "compat-0.2",
		register(ns) {
			return {
				get: () => findEntry(ns)?.value,
				dispose: () => {}
			};
		},
		get(ns) {
			return findEntry(ns)?.value;
		},
		snapshot: (ns) => findEntry(ns),
		async mutate(ns, ops, revision) {
			const entry = findEntry(ns);
			if (!entry) throw new Error(`settings namespace "${ns}" is not loaded`);
			await settings.mutate(entry.ns, ops, revision);
		}
	};
}
//#endregion
//#region src/index.js
const name = "dsh-model-palette";
const inject = [
	"tools",
	"credentials",
	"webServer",
	"llm",
	"settings"
];
/**
* dsh 0.2 config surface: composed per profile entry, auto-presented in the
* settings UI, and served through the official settings describe API — which
* is exactly the surface the client panel reads. Sections the palette manages
* through its own panel are declared loosely so legacy entry config survives.
*/
const Config = z.object({
	requestRetries: RequestRetrySectionSchema.default(structuredClone(DEFAULT_REQUEST_RETRY_SETTINGS.requestRetries)).volatile(),
	freeSync: FreeSyncSectionSchema.default(structuredClone(DEFAULT_REQUEST_RETRY_SETTINGS.freeSync)).volatile(),
	openrouterMedia: z.any().required(false),
	baiRelay: z.any().required(false),
	providerRelays: z.any().required(false),
	gatewayRecovery: z.any().required(false),
	freeModels: FreeModelsConfigSchema.default({})
});
function apply(ctx, config = {}) {
	const settings = createSettingsBackend(ctx);
	ctx.logger?.debug?.(`dsh-model-palette: settings backend ${settings.mode}`);
	const retrySettings = registerRequestRetrySettings(settings);
	ctx.effect(() => () => retrySettings.dispose(), "dsh-model-palette: settings registration");
	registerModelConfigApi(ctx);
	registerOpenRouterFreeSync(ctx, settings);
	if (config.openrouterMedia?.enabled !== false) registerOpenRouterMedia(ctx, config.openrouterMedia);
	registerBaiRelay(ctx, config.baiRelay);
	registerProviderRelays(ctx, config.providerRelays);
	registerGatewayRecovery(ctx, config.gatewayRecovery, retrySettings);
	if (config.freeModels?.enabled !== false) registerFreeModels(ctx, config.freeModels);
}
//#endregion
export { Config, apply, inject, name };
