import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { basename, extname, isAbsolute, join, resolve } from "node:path";
import z from "@deepseek-ai/schemastery";
import https from "node:https";
import tls from "node:tls";
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
const REQUEST_BODY_LIMIT$1 = 1048576;
const CREDENTIAL_PATTERN$1 = /^[A-Za-z_][A-Za-z0-9_]*$/;
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
			writeJson$2(res, 405, {
				ok: false,
				error: { message: "method not allowed" }
			});
			return;
		}
		if (!isTrustedBrowserRequest$1(req)) {
			writeJson$2(res, 403, {
				ok: false,
				error: { message: "cross-site request rejected" }
			});
			return;
		}
		if (!String(req.headers["content-type"] ?? "").toLocaleLowerCase().startsWith("application/json")) {
			writeJson$2(res, 415, {
				ok: false,
				error: { message: "application/json is required" }
			});
			return;
		}
		let pathname;
		try {
			pathname = new URL(req.url ?? "/", "http://dsh.internal").pathname;
		} catch {
			writeJson$2(res, 400, {
				ok: false,
				error: { message: "invalid request path" }
			});
			return;
		}
		const action = routes.get(pathname);
		if (action === void 0) {
			writeJson$2(res, 404, {
				ok: false,
				error: { message: "unknown media action" }
			});
			return;
		}
		const controller = new AbortController();
		const abort = () => controller.abort();
		req.once("aborted", abort);
		try {
			writeJson$2(res, 200, {
				ok: true,
				value: await action(await readJsonBody$1(req), controller.signal)
			});
		} catch (error) {
			writeJson$2(res, mediaErrorStatus(error), {
				ok: false,
				error: { message: errorMessage$2(error) }
			});
		} finally {
			req.removeListener("aborted", abort);
		}
	};
}
function isTrustedBrowserRequest$1(req) {
	const site = req.headers["sec-fetch-site"];
	return site === void 0 || site === "same-origin" || site === "same-site" || site === "none";
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
function writeJson$2(res, status, value) {
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
		"x-content-type-options": "nosniff"
	});
	res.end(JSON.stringify(value));
}
function mediaErrorStatus(error) {
	const message = errorMessage$2(error);
	if (message.startsWith("OpenRouter ")) return 502;
	if (message.includes("not configured in DSH")) return 503;
	return 400;
}
function errorMessage$2(error) {
	return error instanceof Error ? error.message : String(error);
}
function resolveConfig$1(rawConfig) {
	const credentialRef = requireString(rawConfig.credentialRef, "credentialRef");
	if (!CREDENTIAL_PATTERN$1.test(credentialRef)) throw new TypeError(`credentialRef must match ${String(CREDENTIAL_PATTERN$1)}`);
	const rawOutputDir = requireString(rawConfig.outputDir, "outputDir");
	if (!isAbsolute(rawOutputDir)) throw new TypeError("outputDir must be absolute");
	return {
		credentialRef,
		outputDir: resolve(rawOutputDir),
		allowPaidImages: requireBoolean(rawConfig.allowPaidImages, "allowPaidImages"),
		allowPaidVideos: requireBoolean(rawConfig.allowPaidVideos, "allowPaidVideos"),
		preferredImageModels: optionalStringArray(rawConfig.preferredImageModels, "preferredImageModels"),
		preferredVideoModels: optionalStringArray(rawConfig.preferredVideoModels, "preferredVideoModels")
	};
}
function requireString(value, field) {
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
	const normalized = value.map((entry) => requireString(entry, field));
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
	const model = requireString(args?.model, "model");
	const prompt = requireString(args?.prompt, "prompt");
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
	const model = requireString(args?.model, "model");
	const prompt = requireString(args?.prompt, "prompt");
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
	const source = requireString(rawSource, "image source");
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
	const jobId = requireString(value, "job_id");
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
const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const REQUEST_BODY_LIMIT = 65536;
const PROBE_MAX_OUTPUT_TOKENS = 16;
const CATALOG_TIMEOUT_MS = 2e4;
const BATCH_PROVIDER_LIMIT = 100;
const DIAGNOSTIC_LENGTH_LIMIT = 240;
const CLOUDFLARE_BLOCK_PATTERN$1 = /(?:Attention Required!\s*\|\s*Cloudflare|cdn-cgi\/styles\/cf\.errors\.css|cf-error-details)/iu;
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
		if (!String(req.headers["content-type"] ?? "").toLocaleLowerCase().startsWith("application/json")) {
			writeJson$1(res, 415, {
				ok: false,
				error: { message: "application/json is required" }
			});
			return;
		}
		let pathname;
		try {
			pathname = new URL(req.url ?? "/", "http://dsh.internal").pathname;
		} catch {
			writeJson$1(res, 400, {
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
		if (pathname !== `${CONFIG_API_PATH}/credentials/reveal`) {
			writeJson$1(res, 404, {
				ok: false,
				error: { message: "unknown configuration action" }
			});
			return;
		}
		if (!isDirectLoopbackRequest(req)) {
			writeJson$1(res, 403, {
				ok: false,
				error: { message: "credential reveal is available only on direct localhost access" }
			});
			return;
		}
		try {
			const ref = requireCredentialRef((await readJsonBody(req))?.ref);
			const resolved = await ctx.credentials.resolve(ref);
			if (resolved === void 0) {
				writeJson$1(res, 404, {
					ok: false,
					error: { message: `credential ${ref} is not configured` }
				});
				return;
			}
			writeJson$1(res, 200, {
				ok: true,
				value: { value: resolved.value }
			});
		} catch (error) {
			writeJson$1(res, 400, {
				ok: false,
				error: { message: errorMessage$1(error) }
			});
		}
	};
}
async function listOpenRouterFreeModels(res) {
	try {
		const response = await fetch(OPENROUTER_MODELS_URL, {
			headers: {
				"accept": "application/json",
				"user-agent": "DSH-Model-Palette/0.7"
			},
			signal: AbortSignal.timeout(CATALOG_TIMEOUT_MS)
		});
		if (!response.ok) throw new Error(await responseMessage(response));
		const models = parseOpenRouterFreeModels(await response.json());
		writeJson$1(res, 200, {
			ok: true,
			value: {
				checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
				models
			}
		});
	} catch (error) {
		writeJson$1(res, 502, {
			ok: false,
			error: { message: `OpenRouter model catalog failed: ${errorMessage$1(error)}` }
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
		const contextWindow = positiveInteger(entry.context_length);
		const maxTokens = positiveInteger(topProvider.max_completion_tokens);
		models.push({
			id,
			...typeof entry.name === "string" && entry.name.trim() !== "" ? { name: entry.name.trim() } : {},
			...contextWindow === void 0 ? {} : { contextWindow },
			...maxTokens === void 0 ? {} : { maxTokens },
			input,
			free: true
		});
		seen.add(id);
	}
	return models;
}
function stringArray(value) {
	return Array.isArray(value) ? [...new Set(value.filter((entry) => typeof entry === "string"))] : [];
}
function positiveInteger(value) {
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : void 0;
}
async function probeProtocols(ctx, req, res) {
	try {
		const body = await readJsonBody(req);
		const baseURL = requireBaseURL(body?.baseURL);
		const model = requireNonEmptyString(body?.model, "model");
		const ref = requireCredentialRef(body?.credentialRef);
		const apiKey = optionalApiKey(body?.apiKey) ?? (await ctx.credentials.resolve(ref))?.value;
		if (apiKey === void 0) throw new Error(`credential ${ref} is not configured`);
		writeJson$1(res, 200, {
			ok: true,
			value: { results: await Promise.all(PROTOCOLS.map((protocol) => probeProtocol(baseURL, model, apiKey, protocol))) }
		});
	} catch (error) {
		writeJson$1(res, 400, {
			ok: false,
			error: { message: errorMessage$1(error) }
		});
	}
}
async function validateApiKey(ctx, req, res) {
	try {
		const body = await readJsonBody(req);
		const baseURL = requireBaseURL(body?.baseURL);
		const protocol = requireProtocol(body?.protocol);
		const model = requireNonEmptyString(body?.model, "model");
		const ref = requireCredentialRef(body?.credentialRef);
		const draftApiKey = optionalApiKey(body?.apiKey);
		const resolved = await ctx.credentials.resolve(ref);
		const runtimeApiKey = optionalApiKey(resolved?.value);
		if (runtimeApiKey === void 0 && draftApiKey === void 0) throw new Error(`credential ${ref} is not configured`);
		writeJson$1(res, 200, {
			ok: true,
			value: await validateCredential(baseURL, protocol, model, runtimeApiKey, draftApiKey, resolved?.source)
		});
	} catch (error) {
		writeJson$1(res, 400, {
			ok: false,
			error: { message: errorMessage$1(error) }
		});
	}
}
async function validateApiKeysBatch(ctx, req, res) {
	try {
		const providers = requireBatchProviders((await readJsonBody(req))?.providers);
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
						message: `could not resolve a runtime model for provider ${provider.provider}: ${errorMessage$1(error)}`
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
		writeJson$1(res, 200, {
			ok: true,
			value: { results }
		});
	} catch (error) {
		writeJson$1(res, 400, {
			ok: false,
			error: { message: errorMessage$1(error) }
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
		return {
			protocol,
			available: false,
			error: await responseMessage(response, apiKey)
		};
	} catch (error) {
		return {
			protocol,
			available: false,
			error: errorMessage$1(error, apiKey)
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
			message: errorMessage$1(error, apiKey)
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
function isAuthenticationFailure(message) {
	return /(?:api[\s_-]*key|token|credential).*(?:invalid|incorrect|unauthori[sz]ed|expired|revoked)|(?:invalid|incorrect|unauthori[sz]ed|expired|revoked).*(?:api[\s_-]*key|token|credential)/iu.test(message);
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
	if (CLOUDFLARE_BLOCK_PATTERN$1.test(text)) return "Cloudflare blocked the provider request before it reached the API; this does not prove the API key is invalid";
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
function isTrustedBrowserRequest(req) {
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
async function readJsonBody(req) {
	let text = "";
	for await (const chunk of req) {
		text += chunk;
		if (Buffer.byteLength(text) > REQUEST_BODY_LIMIT) throw new Error("request body is too large");
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
function writeJson$1(res, status, value) {
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
		"x-content-type-options": "nosniff"
	});
	res.end(JSON.stringify(value));
}
function errorMessage$1(error, secret = "") {
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
const retryCount = z.number().step(1).min(0).max(MAX_CONFIGURED_RETRIES);
const providerRule = z.object({
	enabled: z.boolean().default(true),
	maxRetries: retryCount.default(0),
	models: z.dict(retryCount).default({})
});
const RequestRetrySettingsSchema = z.object({ requestRetries: z.object({ providers: z.dict(providerRule).default({}) }) });
const DEFAULT_REQUEST_RETRY_SETTINGS = Object.freeze({ requestRetries: Object.freeze({ providers: Object.freeze(Object.fromEntries(PRESET_PROVIDERS.map((provider) => [provider, Object.freeze({
	enabled: true,
	maxRetries: 50,
	models: Object.freeze({})
})]))) }) });
/** Register live request-retry settings with B.AI and BankOfAI aliases preset to 50 retries. */
function registerRequestRetrySettings(ctx) {
	return ctx.settings.register(REQUEST_RETRY_SETTINGS_NAMESPACE, RequestRetrySettingsSchema, {
		base: structuredClone(DEFAULT_REQUEST_RETRY_SETTINGS),
		applies: "live"
	});
}
/** Resolve an exact model override before the provider-wide retry count. */
function resolveRequestRetryRule(settings, provider, model) {
	const requestRetries = isRecord(settings?.requestRetries) ? settings.requestRetries : void 0;
	const providers = isRecord(requestRetries?.providers) ? requestRetries.providers : void 0;
	const rule = isRecord(providers?.[provider]) ? providers[provider] : void 0;
	if (rule === void 0) return void 0;
	const models = isRecord(rule.models) ? rule.models : void 0;
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
function isRetryCount(value) {
	return Number.isInteger(value) && value >= 0 && value <= 1e3;
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
//#endregion
//#region src/gateway-recovery.js
const CLOUDFLARE_BLOCK_PATTERN = /(?:Attention Required!\s*\|\s*Cloudflare|\bCloudflare\b|cf-error-details|cdn-cgi\/styles\/cf\.errors\.css)/iu;
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
	return (failure.status === 403 || /\b403\b/u.test(message)) && CLOUDFLARE_BLOCK_PATTERN.test(message);
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
const RELAY_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/u;
const HOST_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/iu;
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
/** Register the loopback-only B.AI relay used when direct DNS or TLS routing is unavailable. */
function registerBaiRelay(ctx, rawConfig = {}) {
	const config = resolveConfig(rawConfig, {
		upstreamHost: BAI_UPSTREAM_HOST,
		hostHeader: BAI_HOST_HEADER
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
	return async (req, res) => {
		if (!isLoopbackRequest(req) || hasForwardedHeader(req)) {
			writeJson(res, 403, {
				ok: false,
				error: { message: `${label} relay is available only to direct loopback requests` }
			});
			return;
		}
		let parsed;
		try {
			parsed = new URL(req.url ?? "/", "http://dsh.internal");
		} catch {
			writeJson(res, 400, {
				ok: false,
				error: { message: "invalid relay request path" }
			});
			return;
		}
		const relativePath = parsed.pathname.slice(basePath.length);
		if (!relativePath.startsWith(config.allowedPathPrefix)) {
			writeJson(res, 404, {
				ok: false,
				error: `${label} relay accepts only ${config.allowedPathPrefix}* paths`
			});
			return;
		}
		await proxyRequest(req, res, config, `${relativePath}${parsed.search}`, label);
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
	const upstreamHost = resolveHost(value.upstreamHost, defaults.upstreamHost, `${label}.upstreamHost`);
	const hostHeader = resolveHost(value.hostHeader, defaults.hostHeader, `${label}.hostHeader`);
	const tlsServerName = resolveHost(value.tlsServerName, upstreamHost, `${label}.tlsServerName`);
	const certificateHost = resolveHost(value.certificateHost, hostHeader, `${label}.certificateHost`);
	const allowedPathPrefix = resolvePathPrefix(value.allowedPathPrefix, `${label}.allowedPathPrefix`);
	const timeoutMs = value.timeoutMs === void 0 ? DEFAULT_TIMEOUT_MS : value.timeoutMs;
	if (!Number.isInteger(timeoutMs) || timeoutMs < 1e3 || timeoutMs > 9e5) throw new Error(`dsh-model-palette: ${label}.timeoutMs must be an integer from 1000 to 900000`);
	return {
		enabled: value.enabled !== false,
		upstreamHost,
		hostHeader,
		tlsServerName,
		certificateHost,
		allowedPathPrefix,
		timeoutMs
	};
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
function isLoopbackRequest(req) {
	const address = req.socket?.remoteAddress;
	return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}
function hasForwardedHeader(req) {
	return Object.keys(req.headers ?? {}).some((name) => FORWARDED_HEADERS.has(name.toLocaleLowerCase()));
}
async function proxyRequest(req, res, config, path, label) {
	await new Promise((resolve) => {
		let finished = false;
		let upstreamResponseReceived = false;
		const headers = forwardRequestHeaders(req.headers ?? {}, config.hostHeader);
		const upstreamRequest = https.request({
			hostname: config.upstreamHost,
			port: 443,
			method: req.method,
			path,
			headers,
			servername: config.tlsServerName,
			checkServerIdentity: (_host, certificate) => tls.checkServerIdentity(config.certificateHost, certificate)
		}, (upstreamResponse) => {
			upstreamResponseReceived = true;
			if (!res.headersSent) res.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.statusMessage, filterResponseHeaders(upstreamResponse.headers));
			upstreamResponse.once("error", (error) => fail(error));
			upstreamResponse.once("end", finish);
			upstreamResponse.pipe(res);
		});
		const abort = () => {
			if (!finished) upstreamRequest.destroy(/* @__PURE__ */ new Error("B.AI relay client disconnected"));
		};
		const finish = () => {
			if (finished) return;
			finished = true;
			req.removeListener("aborted", abort);
			res.removeListener("close", close);
			resolve();
		};
		const fail = (error) => {
			if (finished) return;
			if (!res.headersSent) writeJson(res, errorCode(error), {
				ok: false,
				error: { message: `${label} relay failed: ${errorMessage(error)}` }
			});
			else if (!res.writableEnded) res.destroy(error);
			finish();
		};
		const close = () => {
			if (!res.writableEnded && !finished) abort();
		};
		upstreamRequest.once("error", (error) => {
			if (!upstreamResponseReceived) fail(error);
			else finish();
		});
		upstreamRequest.setTimeout(config.timeoutMs, () => {
			const error = /* @__PURE__ */ new Error(`upstream idle timeout after ${config.timeoutMs}ms`);
			error.code = "ETIMEDOUT";
			upstreamRequest.destroy(error);
		});
		req.once("aborted", abort);
		res.once("close", close);
		req.pipe(upstreamRequest);
	});
}
function forwardRequestHeaders(input, hostHeader) {
	const headers = {};
	for (const [name, value] of Object.entries(input)) {
		const lower = name.toLocaleLowerCase();
		if (lower === "host" || HOP_BY_HOP_HEADERS.has(lower) || FORWARDED_HEADERS.has(lower)) continue;
		if (typeof value === "string") headers[name] = value;
		else if (Array.isArray(value)) headers[name] = value.join(", ");
	}
	headers.host = hostHeader;
	return headers;
}
function filterResponseHeaders(input) {
	return Object.fromEntries(Object.entries(input).filter(([name]) => !HOP_BY_HOP_HEADERS.has(name.toLocaleLowerCase())));
}
function errorCode(error) {
	return error?.code === "ETIMEDOUT" ? 504 : 502;
}
function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
function writeJson(res, status, value) {
	if (res.headersSent) return;
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(value));
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
function apply(ctx, config = {}) {
	const retrySettings = registerRequestRetrySettings(ctx);
	registerModelConfigApi(ctx);
	registerBaiRelay(ctx, config.baiRelay);
	registerProviderRelays(ctx, config.providerRelays);
	registerGatewayRecovery(ctx, config.gatewayRecovery, retrySettings);
	if (config.openrouterMedia?.enabled === true) registerOpenRouterMedia(ctx, config.openrouterMedia);
}
//#endregion
export { apply, inject, name };
