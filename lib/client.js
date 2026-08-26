window.__ModuleLoader__.load({
	id: "dsh-model-palette",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_dom = require("react-dom");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/config-api.ts
		const CONFIG_API_BASE = "/model-palette/api/config";
		/** Reveal one stored credential through the plugin's direct-loopback-only route. */
		async function revealCredential(ref) {
			const response = await fetch(`${CONFIG_API_BASE}/credentials/reveal`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ ref })
			});
			let payload;
			try {
				payload = await response.json();
			} catch {
				throw new Error(`Configuration API returned HTTP ${response.status}`);
			}
			if (!response.ok || !payload.ok) throw new Error(payload.ok ? `Configuration API returned HTTP ${response.status}` : payload.error?.message ?? `Configuration API returned HTTP ${response.status}`);
			return payload.value.value;
		}
		//#endregion
		//#region assets/model-presets.json
		var model_presets_default = {
			version: 1,
			updatedAt: "2026-08-26",
			presets: [
				{
					"id": "openai-gpt-5.6-sol",
					"name": "OpenAI GPT-5.6 Sol",
					"aliases": ["gpt-5.6-sol", "openai/gpt-5.6-sol"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://developers.openai.com/api/docs/models/gpt-5.6-sol"
				},
				{
					"id": "openai-gpt-5.6-terra",
					"name": "OpenAI GPT-5.6 Terra",
					"aliases": ["gpt-5.6-terra", "openai/gpt-5.6-terra"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://developers.openai.com/api/docs/models/gpt-5.6-terra"
				},
				{
					"id": "openai-gpt-5.6-luna",
					"name": "OpenAI GPT-5.6 Luna",
					"aliases": ["gpt-5.6-luna", "openai/gpt-5.6-luna"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://developers.openai.com/api/docs/models/gpt-5.6-luna"
				},
				{
					"id": "openai-gpt-5.5",
					"name": "OpenAI GPT-5.5",
					"aliases": ["gpt-5.5", "openai/gpt-5.5"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://developers.openai.com/api/docs/models/gpt-5.5"
				},
				{
					"id": "anthropic-claude-fable-5",
					"name": "Anthropic Claude Fable 5",
					"aliases": ["claude-fable-5", "anthropic/claude-fable-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-opus-5",
					"name": "Anthropic Claude Opus 5",
					"aliases": ["claude-opus-5", "anthropic/claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-sonnet-5",
					"name": "Anthropic Claude Sonnet 5",
					"aliases": ["claude-sonnet-5", "anthropic/claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-opus-4.8",
					"name": "Anthropic Claude Opus 4.8",
					"aliases": [
						"claude-opus-4.8",
						"claude-opus-4-8",
						"anthropic/claude-opus-4.8"
					],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "deepseek-v4-flash",
					"name": "DeepSeek V4 Flash",
					"aliases": ["deepseek-v4-flash", "deepseek/deepseek-v4-flash"],
					"contextWindow": 1e6,
					"maxTokens": 384e3,
					"input": ["text"],
					"sourceLabel": "DeepSeek API docs",
					"sourceUrl": "https://api-docs.deepseek.com/quick_start/pricing"
				},
				{
					"id": "deepseek-v4-flash-vision-exp",
					"name": "DeepSeek V4 Flash Vision Exp",
					"aliases": ["deepseek-v4-flash-vision-exp"],
					"contextWindow": 1e6,
					"maxTokens": 384e3,
					"input": ["text", "image"],
					"sourceLabel": "DeepSeek API docs",
					"sourceUrl": "https://api-docs.deepseek.com/quick_start/pricing"
				},
				{
					"id": "deepseek-v4-pro",
					"name": "DeepSeek V4 Pro",
					"aliases": ["deepseek-v4-pro", "deepseek/deepseek-v4-pro"],
					"contextWindow": 1e6,
					"maxTokens": 384e3,
					"input": ["text"],
					"sourceLabel": "DeepSeek API docs",
					"sourceUrl": "https://api-docs.deepseek.com/quick_start/pricing"
				},
				{
					"id": "google-gemini-3.6-flash",
					"name": "Google Gemini 3.6 Flash",
					"aliases": ["gemini-3.6-flash", "google/gemini-3.6-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models/gemini"
				},
				{
					"id": "zai-glm-5.3",
					"name": "Z.ai GLM-5.3",
					"aliases": ["glm-5.3", "z-ai/glm-5.3"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
				},
				{
					"id": "zai-glm-5.2",
					"name": "Z.ai GLM-5.2",
					"aliases": ["glm-5.2", "z-ai/glm-5.2"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.2"
				},
				{
					"id": "zai-glm-5.1",
					"name": "Z.ai GLM-5.1",
					"aliases": ["glm-5.1", "z-ai/glm-5.1"],
					"contextWindow": 2e5,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.1"
				},
				{
					"id": "zai-glm-5",
					"name": "Z.ai GLM-5",
					"aliases": ["glm-5", "z-ai/glm-5"],
					"contextWindow": 2e5,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5"
				},
				{
					"id": "minimax-m3",
					"name": "MiniMax M3",
					"aliases": ["minimax-m3", "minimax/minimax-m3"],
					"contextWindow": 1e6,
					"maxTokens": 524288,
					"input": ["text", "image"],
					"sourceLabel": "MiniMax model docs",
					"sourceUrl": "https://platform.minimax.io/docs/guides/models-text"
				},
				{
					"id": "minimax-m2.7",
					"name": "MiniMax M2.7",
					"aliases": ["minimax-m2.7", "minimax/minimax-m2.7"],
					"contextWindow": 204800,
					"maxTokens": 204800,
					"input": ["text"],
					"sourceLabel": "MiniMax model docs",
					"sourceUrl": "https://platform.minimax.io/docs/guides/models-text"
				},
				{
					"id": "minimax-m2.5",
					"name": "MiniMax M2.5",
					"aliases": ["minimax-m2.5", "minimax/minimax-m2.5"],
					"contextWindow": 204800,
					"maxTokens": 204800,
					"input": ["text"],
					"sourceLabel": "MiniMax model docs",
					"sourceUrl": "https://platform.minimax.io/docs/guides/models-text"
				},
				{
					"id": "moonshot-kimi-k3",
					"name": "Moonshot Kimi K3",
					"aliases": ["kimi-k3", "moonshotai/kimi-k3"],
					"contextWindow": 1048576,
					"maxTokens": 1048576,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models/kimi-k3"
				},
				{
					"id": "moonshot-kimi-k2.7-code",
					"name": "Moonshot Kimi K2.7 Code",
					"aliases": ["kimi-k2.7-code", "moonshotai/kimi-k2.7-code"],
					"contextWindow": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshot-kimi-k2.6",
					"name": "Moonshot Kimi K2.6",
					"aliases": ["kimi-k2.6", "moonshotai/kimi-k2.6"],
					"contextWindow": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshot-kimi-k2.5",
					"name": "Moonshot Kimi K2.5",
					"aliases": ["kimi-k2.5", "moonshotai/kimi-k2.5"],
					"contextWindow": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "xiaomi-mimo-v2.5-pro",
					"name": "Xiaomi MiMo V2.5 Pro",
					"aliases": ["mimo-v2.5-pro", "xiaomi/mimo-v2.5-pro"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Xiaomi MiMo repository",
					"sourceUrl": "https://github.com/XiaomiMiMo/MiMo-V2.5"
				},
				{
					"id": "xiaomi-mimo-v2.5",
					"name": "Xiaomi MiMo V2.5",
					"aliases": ["mimo-v2.5", "xiaomi/mimo-v2.5"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "Xiaomi MiMo repository",
					"sourceUrl": "https://github.com/XiaomiMiMo/MiMo-V2.5"
				}
			]
		};
		//#endregion
		//#region src/client/model-presets.ts
		const ONLINE_PRESET_URL = "https://raw.githubusercontent.com/Jensen-Yao/dsh-model-palette/main/assets/model-presets.json";
		const BUNDLED_PRESET_REGISTRY = validateRegistry(model_presets_default);
		/** Normalize model aliases without guessing across different model families. */
		function normalizeModelAlias(value) {
			return value.trim().toLocaleLowerCase().replace(/:free$/u, "").replace(/[._\s]+/gu, "-").replace(/-+/gu, "-");
		}
		/** Find a trustworthy exact alias match, including the final segment of provider/model ids. */
		function matchModelPreset(modelId, presets) {
			const normalized = normalizeModelAlias(modelId);
			const tail = normalizeModelAlias(modelId.split("/").at(-1) ?? modelId);
			return presets.find((preset) => preset.aliases.some((alias) => {
				const candidate = normalizeModelAlias(alias);
				return candidate === normalized || candidate === tail;
			}));
		}
		/** Apply a preset to one model while retaining every unrelated compatibility field. */
		function applyModelPreset(model, preset, overwrite) {
			const next = structuredClone(model);
			if (preset.contextWindow !== void 0 && (overwrite || positiveInteger(next.contextWindow) === void 0)) next.contextWindow = preset.contextWindow;
			if (preset.maxTokens !== void 0 && (overwrite || positiveInteger(next.maxTokens) === void 0)) next.maxTokens = preset.maxTokens;
			if (preset.input !== void 0 && (overwrite || !Array.isArray(next.input) || next.input.length === 0)) next.input = [...preset.input];
			return next;
		}
		/** Load the current GitHub registry, retaining the bundled registry as an offline fallback. */
		async function loadOnlinePresetRegistry(fetcher = fetch) {
			const response = await fetcher(ONLINE_PRESET_URL, {
				cache: "no-store",
				signal: AbortSignal.timeout(8e3)
			});
			if (!response.ok) throw new Error(`preset registry returned HTTP ${response.status}`);
			return validateRegistry(await response.json());
		}
		function validateRegistry(value) {
			if (!isRecord$1(value) || typeof value.version !== "number" || !Number.isInteger(value.version) || typeof value.updatedAt !== "string" || !Array.isArray(value.presets)) throw new TypeError("invalid model preset registry");
			const presets = value.presets.map((entry) => {
				if (!isRecord$1(entry) || typeof entry.id !== "string" || typeof entry.name !== "string" || !Array.isArray(entry.aliases) || entry.aliases.some((alias) => typeof alias !== "string") || typeof entry.sourceLabel !== "string" || typeof entry.sourceUrl !== "string") throw new TypeError("invalid model preset entry");
				const contextWindow = optionalPositiveInteger(entry.contextWindow, "contextWindow");
				const maxTokens = optionalPositiveInteger(entry.maxTokens, "maxTokens");
				const input = entry.input === void 0 ? void 0 : validateInput(entry.input);
				return {
					id: entry.id,
					name: entry.name,
					aliases: [...entry.aliases],
					...contextWindow === void 0 ? {} : { contextWindow },
					...maxTokens === void 0 ? {} : { maxTokens },
					...input === void 0 ? {} : { input },
					sourceLabel: entry.sourceLabel,
					sourceUrl: entry.sourceUrl
				};
			});
			return {
				version: value.version,
				updatedAt: value.updatedAt,
				presets
			};
		}
		function optionalPositiveInteger(value, label) {
			if (value === void 0) return void 0;
			const parsed = positiveInteger(value);
			if (parsed === void 0) throw new TypeError(`${label} must be a positive integer`);
			return parsed;
		}
		function positiveInteger(value) {
			return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : void 0;
		}
		function validateInput(value) {
			if (!Array.isArray(value) || value.some((item) => item !== "text" && item !== "image")) throw new TypeError("input must contain only text or image");
			return [...new Set(value)];
		}
		function isRecord$1(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		//#endregion
		//#region src/client/model-config.ts
		const PROVIDER_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
		const CREDENTIAL_REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
		function isRecord(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		function recordAt(value, path) {
			let current = value;
			for (const part of path) {
				if (!isRecord(current)) return void 0;
				current = current[part];
			}
			return isRecord(current) ? current : void 0;
		}
		function providerProfiles(value) {
			const providers = recordAt(value, ["providers"]);
			if (providers === void 0) return {};
			return Object.fromEntries(Object.entries(providers).filter((entry) => isRecord(entry[1])));
		}
		function deriveCredentialRef(provider) {
			return `${provider.toUpperCase().replace(/[^A-Z0-9]+/gu, "_")}_API_KEY`;
		}
		function stringField(value, key) {
			return typeof value[key] === "string" ? value[key] : "";
		}
		function modelRecords(profile) {
			if (!Array.isArray(profile.models)) return [];
			return profile.models.filter(isRecord).map((model) => structuredClone(model));
		}
		function setOptionalString(source, key, value) {
			const next = structuredClone(source);
			const normalized = value.trim();
			if (normalized === "") delete next[key];
			else next[key] = normalized;
			return next;
		}
		function setOptionalPositiveInteger(source, key, value) {
			const next = structuredClone(source);
			if (value.trim() === "") {
				delete next[key];
				return next;
			}
			const parsed = Number(value);
			if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${key} must be a positive integer`);
			next[key] = parsed;
			return next;
		}
		function setInputModality(source, modality, enabled) {
			const next = structuredClone(source);
			const current = Array.isArray(next.input) ? next.input.filter((value) => value === "text" || value === "image") : [];
			const values = enabled ? [.../* @__PURE__ */ new Set([...current, modality])] : current.filter((value) => value !== modality);
			if (values.length === 0) delete next.input;
			else next.input = values;
			return next;
		}
		function setCompatField(source, key, value) {
			const next = structuredClone(source);
			const compat = isRecord(next.compat) ? structuredClone(next.compat) : {};
			if (value === void 0 || value === "") delete compat[key];
			else compat[key] = value;
			if (Object.keys(compat).length === 0) delete next.compat;
			else next.compat = compat;
			return next;
		}
		function compatValue(source, key) {
			return isRecord(source.compat) ? source.compat[key] : void 0;
		}
		function applyMissingPresets(models, presets) {
			let applied = 0;
			return {
				models: models.map((model) => {
					const preset = matchModelPreset(typeof model.id === "string" ? model.id : "", presets);
					if (preset === void 0) return structuredClone(model);
					const updated = applyModelPreset(model, preset, false);
					if (JSON.stringify(updated) !== JSON.stringify(model)) applied += 1;
					return updated;
				}),
				applied
			};
		}
		function mergeDiscoveredModels(models, discovered) {
			const next = models.map((model) => structuredClone(model));
			const index = new Map(next.map((model, position) => [typeof model.id === "string" ? model.id : "", position]));
			let added = 0;
			let enriched = 0;
			for (const candidate of discovered) {
				const position = index.get(candidate.id);
				if (position === void 0) {
					next.push({
						id: candidate.id,
						...candidate.name === void 0 ? {} : { name: candidate.name },
						...candidate.contextWindow === void 0 ? {} : { contextWindow: candidate.contextWindow },
						...candidate.maxTokens === void 0 ? {} : { maxTokens: candidate.maxTokens }
					});
					index.set(candidate.id, next.length - 1);
					added += 1;
					continue;
				}
				const current = next[position];
				let changed = false;
				if (candidate.name !== void 0 && typeof current.name !== "string") {
					current.name = candidate.name;
					changed = true;
				}
				if (candidate.contextWindow !== void 0 && typeof current.contextWindow !== "number") {
					current.contextWindow = candidate.contextWindow;
					changed = true;
				}
				if (candidate.maxTokens !== void 0 && typeof current.maxTokens !== "number") {
					current.maxTokens = candidate.maxTokens;
					changed = true;
				}
				if (changed) enriched += 1;
			}
			return {
				models: next,
				added,
				enriched
			};
		}
		//#endregion
		//#region src/client/ConfigPanel.tsx
		const SETTINGS_NAMESPACE = "llm-pi-ai";
		const PROTOCOLS = [
			"openai-completions",
			"openai-responses",
			"anthropic-messages"
		];
		const THINKING_FORMATS = [
			"openai",
			"deepseek",
			"openrouter",
			"together",
			"zai",
			"qwen",
			"chat-template",
			"qwen-chat-template",
			"string-thinking",
			"ant-ling"
		];
		const LEGAL_API_KEY = /^[\x21-\x7E]+$/;
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		function cloneProfile(value) {
			return isRecord(value) ? structuredClone(value) : {
				api: "openai-completions",
				models: []
			};
		}
		function positiveIntegerText(value) {
			return typeof value === "number" && Number.isInteger(value) && value > 0 ? String(value) : "";
		}
		function booleanChoice(value) {
			return value === true ? "true" : value === false ? "false" : "";
		}
		function sourcePreset(model, presets) {
			return typeof model.id === "string" ? matchModelPreset(model.id, presets) : void 0;
		}
		function ConfigPanel({ api, isLoopback, t }) {
			const [namespace, setNamespace] = (0, react.useState)(null);
			const [providerId, setProviderId] = (0, react.useState)("");
			const [creating, setCreating] = (0, react.useState)(false);
			const [draft, setDraft] = (0, react.useState)({
				api: "openai-completions",
				models: []
			});
			const [credential, setCredential] = (0, react.useState)(null);
			const [keyDraft, setKeyDraft] = (0, react.useState)("");
			const [keyVisible, setKeyVisible] = (0, react.useState)(false);
			const [registry, setRegistry] = (0, react.useState)(BUNDLED_PRESET_REGISTRY);
			const [presetState, setPresetState] = (0, react.useState)("bundled");
			const [manualPresets, setManualPresets] = (0, react.useState)({});
			const [discovered, setDiscovered] = (0, react.useState)([]);
			const [busy, setBusy] = (0, react.useState)("load");
			const [error, setError] = (0, react.useState)(null);
			const [feedback, setFeedback] = (0, react.useState)(null);
			const profiles = (0, react.useMemo)(() => namespace === null ? {} : providerProfiles(namespace.user ?? namespace.value), [namespace]);
			const providerIds = (0, react.useMemo)(() => Object.keys(profiles).sort((left, right) => left.localeCompare(right)), [profiles]);
			const models = (0, react.useMemo)(() => modelRecords(draft), [draft]);
			const protocol = stringField(draft, "api");
			const credentialRef = stringField(draft, "apiKeyEnv") || deriveCredentialRef(providerId || "provider");
			const describeCredential = (0, react.useCallback)(async (ref) => {
				if (!CREDENTIAL_REF_PATTERN.test(ref)) {
					setCredential(null);
					return;
				}
				const response = await api.credentials.describe({ refs: [ref] });
				if (!response.result.ok) throw new Error(response.result.error.message);
				setCredential(response.result.value.credentials[ref] ?? null);
			}, [api.credentials]);
			const selectProvider = (0, react.useCallback)((id, view = namespace) => {
				if (view === null) return;
				const profile = cloneProfile(providerProfiles(view.user ?? view.value)[id]);
				const ref = stringField(profile, "apiKeyEnv") || deriveCredentialRef(id);
				setProviderId(id);
				setCreating(false);
				setDraft(profile);
				setKeyDraft("");
				setKeyVisible(false);
				setManualPresets({});
				setDiscovered([]);
				setError(null);
				setFeedback(null);
				describeCredential(ref).catch((cause) => setError(messageOf(cause)));
			}, [describeCredential, namespace]);
			const load = (0, react.useCallback)(async () => {
				setBusy("load");
				setError(null);
				try {
					const response = await api.settings.describe({});
					if (!response.result.ok) throw new Error(response.result.error.message);
					const view = response.result.value.namespaces.find((candidate) => candidate.ns === SETTINGS_NAMESPACE);
					if (view === void 0) throw new Error(t("config.namespaceMissing"));
					setNamespace(view);
					const ids = Object.keys(providerProfiles(view.user ?? view.value)).sort((left, right) => left.localeCompare(right));
					const selected = ids.includes(providerId) ? providerId : ids[0];
					if (selected !== void 0) selectProvider(selected, view);
					else {
						setProviderId("");
						setCreating(true);
						setDraft({
							api: "openai-completions",
							models: []
						});
					}
				} catch (cause) {
					setError(messageOf(cause));
				} finally {
					setBusy(null);
				}
			}, [
				api.settings,
				providerId,
				selectProvider,
				t
			]);
			const refreshPresets = (0, react.useCallback)(async () => {
				setPresetState("loading");
				setBusy((current) => current ?? "presets");
				try {
					setRegistry(await loadOnlinePresetRegistry());
					setPresetState("online");
				} catch {
					setRegistry(BUNDLED_PRESET_REGISTRY);
					setPresetState("error");
				} finally {
					setBusy((current) => current === "presets" ? null : current);
				}
			}, []);
			(0, react.useEffect)(() => {
				load();
			}, []);
			(0, react.useEffect)(() => {
				refreshPresets();
			}, [refreshPresets]);
			const startCreate = () => {
				setCreating(true);
				setProviderId("");
				setDraft({
					api: "openai-completions",
					models: []
				});
				setCredential(null);
				setKeyDraft("");
				setKeyVisible(false);
				setManualPresets({});
				setDiscovered([]);
				setError(null);
				setFeedback(null);
			};
			const updateProfileString = (key, value) => {
				setDraft((current) => setOptionalString(current, key, value));
				if (key === "apiKeyEnv") {
					setKeyDraft("");
					setKeyVisible(false);
					describeCredential(value.trim()).catch((cause) => setError(messageOf(cause)));
				}
			};
			const setModels = (next) => {
				setDraft((current) => ({
					...structuredClone(current),
					models: next
				}));
			};
			const updateModel = (index, next) => {
				setModels(models.map((model, position) => position === index ? next : model));
			};
			const addModel = () => {
				setModels([...models, { id: "" }]);
				setManualPresets((current) => ({
					...current,
					[models.length]: ""
				}));
			};
			const removeModel = (index) => {
				setModels(models.filter((_model, position) => position !== index));
				setManualPresets({});
			};
			const autoApplyPresets = () => {
				const result = applyMissingPresets(models, registry.presets);
				setModels(result.models);
				setFeedback(t("config.presetsApplied", { count: result.applied }));
			};
			const applyPreset = (index, presetId) => {
				const preset = registry.presets.find((candidate) => candidate.id === presetId);
				if (preset === void 0) return;
				updateModel(index, applyModelPreset(models[index] ?? {}, preset, true));
				setManualPresets((current) => ({
					...current,
					[index]: preset.id
				}));
			};
			const probe = async () => {
				if (busy !== null) return;
				setBusy("probe");
				setError(null);
				setFeedback(null);
				try {
					const id = providerId.trim();
					const baseURL = stringField(draft, "baseURL").trim();
					const apiProtocol = stringField(draft, "api").trim();
					if (!PROVIDER_ID_PATTERN.test(id)) throw new Error(t("config.providerIdInvalid"));
					if (baseURL === "") throw new Error(t("config.baseUrlRequired"));
					if (apiProtocol === "") throw new Error(t("config.protocolRequired"));
					const key = keyDraft.trim();
					const response = await api.llm.discoverModels({
						settingsNs: SETTINGS_NAMESPACE,
						provider: id,
						baseURL,
						api: apiProtocol,
						...key === "" ? {} : { apiKey: key }
					});
					if (!response.result.ok) throw new Error(response.result.error.message);
					setDiscovered(response.result.value.models);
					setFeedback(t("config.probeSuccess", { count: response.result.value.models.length }));
				} catch (cause) {
					setError(messageOf(cause));
				} finally {
					setBusy(null);
				}
			};
			const importDiscovered = () => {
				const result = mergeDiscoveredModels(models, discovered);
				setModels(result.models);
				setFeedback(t("config.discoveryApplied", {
					added: result.added,
					enriched: result.enriched
				}));
			};
			const reveal = async () => {
				if (busy !== null) return;
				if (!isLoopback) {
					setError(t("config.revealLoopbackOnly"));
					return;
				}
				setBusy("reveal");
				setError(null);
				try {
					setKeyDraft(await revealCredential(credentialRef));
					setKeyVisible(true);
					setFeedback(t("config.revealSuccess"));
				} catch (cause) {
					setError(messageOf(cause));
				} finally {
					setBusy(null);
				}
			};
			const save = async () => {
				if (namespace === null || busy !== null) return;
				setBusy("save");
				setError(null);
				setFeedback(null);
				try {
					const id = providerId.trim();
					const ref = credentialRef.trim();
					if (!PROVIDER_ID_PATTERN.test(id)) throw new Error(t("config.providerIdInvalid"));
					if (!CREDENTIAL_REF_PATTERN.test(ref)) throw new Error(t("config.credentialRefInvalid"));
					if (stringField(draft, "baseURL").trim() === "") throw new Error(t("config.baseUrlRequired"));
					if (!PROTOCOLS.includes(stringField(draft, "api"))) throw new Error(t("config.protocolRequired"));
					if (models.length === 0 || models.some((model) => typeof model.id !== "string" || model.id.trim() === "")) throw new Error(t("config.modelIdRequired"));
					const key = keyDraft.trim();
					if (key !== "" && !LEGAL_API_KEY.test(key)) throw new Error(t("config.keyInvalid"));
					const profile = structuredClone(draft);
					profile.apiKeyEnv = ref;
					profile.models = models.map((model) => ({
						...model,
						id: String(model.id).trim()
					}));
					const response = await api.settings.mutate({
						ns: SETTINGS_NAMESPACE,
						ops: [{
							op: "set",
							path: ["providers", id],
							value: profile
						}],
						expectedRevision: namespace.revision
					});
					if (!response.result.ok) throw new Error(response.result.error.message);
					setNamespace(response.result.value);
					if (key !== "") {
						const stored = await api.credentials.set({
							ref,
							value: key
						});
						if (!stored.result.ok) throw new Error(`${t("config.settingsSavedKeyFailed")}: ${stored.result.error.message}`);
					}
					setCreating(false);
					setKeyDraft("");
					setKeyVisible(false);
					await describeCredential(ref);
					setFeedback(t("config.saved"));
				} catch (cause) {
					setError(messageOf(cause));
				} finally {
					setBusy(null);
				}
			};
			const readOnly = namespace === null || busy !== null;
			const presetStatusText = presetState === "online" ? t("config.presetsOnline", {
				date: registry.updatedAt,
				count: registry.presets.length
			}) : presetState === "loading" ? t("config.presetsLoading") : presetState === "error" ? t("config.presetsFallback", {
				date: registry.updatedAt,
				count: registry.presets.length
			}) : t("config.presetsBundled", {
				date: registry.updatedAt,
				count: registry.presets.length
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("main", {
				className: "dmp-config",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-config-toolbar",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("config.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.intro") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dmp-config-toolbar-actions",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: busy !== null,
								onClick: () => void load(),
								children: t("config.reload")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: busy !== null,
								onClick: startCreate,
								children: t("config.addProvider")
							})]
						})]
					}),
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dmp-media-error",
						role: "alert",
						children: error
					}),
					feedback !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dmp-media-feedback",
						"aria-live": "polite",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("config.done") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: feedback })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-config-card",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-config-card-heading",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("config.providerTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("config.providerDescription") })] }), !creating && providerIds.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
									value: providerId,
									onChange: (event) => selectProvider(event.currentTarget.value),
									disabled: busy !== null,
									children: providerIds.map((id) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: id,
										children: stringField(profiles[id] ?? {}, "displayName") || id
									}, id))
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-config-provider-grid",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-media-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.providerId") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: providerId,
											disabled: !creating || busy !== null,
											onChange: (event) => setProviderId(event.currentTarget.value.toLocaleLowerCase()),
											placeholder: "my-provider"
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-media-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.displayName") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: stringField(draft, "displayName"),
											disabled: readOnly,
											onChange: (event) => updateProfileString("displayName", event.currentTarget.value),
											placeholder: providerId || "My Provider"
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-media-field dmp-config-span-2",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.baseUrl") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: stringField(draft, "baseURL"),
											disabled: readOnly,
											onChange: (event) => updateProfileString("baseURL", event.currentTarget.value),
											placeholder: "https://api.example.com/v1"
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-media-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.protocol") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
											value: protocol,
											disabled: readOnly,
											onChange: (event) => updateProfileString("api", event.currentTarget.value),
											children: PROTOCOLS.map((value) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value,
												children: value
											}, value))
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dmp-config-protocol-note",
										children: t("config.protocolNote")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-media-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.credentialRef") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: credentialRef,
											disabled: readOnly,
											onChange: (event) => updateProfileString("apiKeyEnv", event.currentTarget.value),
											placeholder: deriveCredentialRef(providerId || "provider")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-media-field dmp-config-key-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.apiKey") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "dmp-config-key-input",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: keyVisible ? "text" : "password",
													value: keyDraft,
													disabled: readOnly || credential?.writable === false,
													onChange: (event) => setKeyDraft(event.currentTarget.value),
													autoComplete: "off",
													placeholder: credential?.configured ? t("config.keyConfigured") : t("config.keyNotConfigured")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													disabled: busy !== null || keyDraft === "",
													onClick: () => setKeyVisible((value) => !value),
													children: keyVisible ? t("config.hide") : t("config.show")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													disabled: busy !== null || !isLoopback || credential?.configured !== true,
													onClick: () => void reveal(),
													children: t("config.loadStoredKey")
												})
											]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-config-status-row",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: credential?.configured ? "is-ok" : "",
										children: credential?.configured ? t("config.credentialStatusConfigured", { source: credential.source ?? "?" }) : t("config.credentialStatusMissing")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: isLoopback ? t("config.revealLocalReady") : t("config.revealLoopbackOnly") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== null,
											onClick: () => void probe(),
											children: busy === "probe" ? t("config.probing") : t("config.probe")
										}),
										discovered.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== null,
											onClick: importDiscovered,
											children: t("config.importDiscovery", { count: discovered.length })
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											className: "dmp-media-primary",
											type: "button",
											disabled: busy !== null,
											onClick: () => void save(),
											children: busy === "save" ? t("config.saving") : t("config.save")
										})
									] })
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-config-card dmp-config-model-card",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-config-card-heading",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("config.modelsTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("config.modelsDescription") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dmp-config-heading-actions",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: presetStatusText }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== null,
											onClick: () => void refreshPresets(),
											children: t("config.refreshPresets")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== null || models.length === 0,
											onClick: autoApplyPresets,
											children: t("config.autoPreset")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== null,
											onClick: addModel,
											children: t("config.addModel")
										})
									]
								})]
							}),
							models.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dmp-config-empty",
								children: t("config.noModels")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dmp-config-models",
								children: models.map((model, index) => {
									const automatic = sourcePreset(model, registry.presets);
									const selectedPresetId = manualPresets[index] ?? automatic?.id ?? "";
									const selectedPreset = registry.presets.find((preset) => preset.id === selectedPresetId);
									const input = Array.isArray(model.input) ? model.input : [];
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
										className: "dmp-config-model",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "dmp-config-model-top",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: typeof model.name === "string" && model.name !== "" ? model.name : typeof model.id === "string" && model.id !== "" ? model.id : `${t("config.model")} ${index + 1}` }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													disabled: busy !== null,
													onClick: () => removeModel(index),
													children: t("config.remove")
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "dmp-config-model-grid",
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
														className: "dmp-media-field dmp-config-span-2",
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.modelId") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															value: typeof model.id === "string" ? model.id : "",
															disabled: readOnly,
															onChange: (event) => updateModel(index, setOptionalString(model, "id", event.currentTarget.value))
														})]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
														className: "dmp-media-field dmp-config-span-2",
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.modelName") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															value: typeof model.name === "string" ? model.name : "",
															disabled: readOnly,
															onChange: (event) => updateModel(index, setOptionalString(model, "name", event.currentTarget.value)),
															placeholder: t("config.optional")
														})]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
														className: "dmp-media-field",
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.contextWindow") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															inputMode: "numeric",
															value: positiveIntegerText(model.contextWindow),
															disabled: readOnly,
															onChange: (event) => {
																try {
																	updateModel(index, setOptionalPositiveInteger(model, "contextWindow", event.currentTarget.value));
																	setError(null);
																} catch (cause) {
																	setError(messageOf(cause));
																}
															},
															placeholder: "262144"
														})]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
														className: "dmp-media-field",
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.maxTokens") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															inputMode: "numeric",
															value: positiveIntegerText(model.maxTokens),
															disabled: readOnly,
															onChange: (event) => {
																try {
																	updateModel(index, setOptionalPositiveInteger(model, "maxTokens", event.currentTarget.value));
																	setError(null);
																} catch (cause) {
																	setError(messageOf(cause));
																}
															},
															placeholder: "32768"
														})]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
														className: "dmp-config-inputs",
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("config.inputTypes") }),
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																type: "checkbox",
																checked: input.includes("text"),
																disabled: readOnly,
																onChange: (event) => updateModel(index, setInputModality(model, "text", event.currentTarget.checked))
															}), " Text"] }),
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																type: "checkbox",
																checked: input.includes("image"),
																disabled: readOnly,
																onChange: (event) => updateModel(index, setInputModality(model, "image", event.currentTarget.checked))
															}), " Image"] }),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("config.inputInherit") })
														]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: "dmp-config-preset",
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
																className: "dmp-media-field",
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.preset") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
																	value: selectedPresetId,
																	disabled: readOnly,
																	onChange: (event) => setManualPresets((current) => ({
																		...current,
																		[index]: event.currentTarget.value
																	})),
																	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "",
																		children: t("config.noPreset")
																	}), registry.presets.map((preset) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: preset.id,
																		children: preset.name
																	}, preset.id))]
																})]
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																type: "button",
																disabled: readOnly || selectedPreset === void 0,
																onClick: () => applyPreset(index, selectedPresetId),
																children: t("config.applyPreset")
															}),
															selectedPreset !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
																href: selectedPreset.sourceUrl,
																target: "_blank",
																rel: "noreferrer",
																children: selectedPreset.sourceLabel
															})
														]
													})
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
												className: "dmp-config-compat",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("config.compatibility") }), protocol === "openai-completions" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "dmp-config-compat-grid",
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
															className: "dmp-media-field",
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "supportsDeveloperRole" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
																value: booleanChoice(compatValue(model, "supportsDeveloperRole")),
																disabled: readOnly,
																onChange: (event) => updateModel(index, setCompatField(model, "supportsDeveloperRole", event.currentTarget.value === "" ? void 0 : event.currentTarget.value === "true")),
																children: [
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "",
																		children: t("config.inherit")
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "true",
																		children: "true"
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "false",
																		children: "false"
																	})
																]
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
															className: "dmp-media-field",
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "supportsReasoningEffort" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
																value: booleanChoice(compatValue(model, "supportsReasoningEffort")),
																disabled: readOnly,
																onChange: (event) => updateModel(index, setCompatField(model, "supportsReasoningEffort", event.currentTarget.value === "" ? void 0 : event.currentTarget.value === "true")),
																children: [
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "",
																		children: t("config.inherit")
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "true",
																		children: "true"
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "false",
																		children: "false"
																	})
																]
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
															className: "dmp-media-field",
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "maxTokensField" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
																value: typeof compatValue(model, "maxTokensField") === "string" ? String(compatValue(model, "maxTokensField")) : "",
																disabled: readOnly,
																onChange: (event) => updateModel(index, setCompatField(model, "maxTokensField", event.currentTarget.value || void 0)),
																children: [
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "",
																		children: t("config.inherit")
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "max_tokens",
																		children: "max_tokens"
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "max_completion_tokens",
																		children: "max_completion_tokens"
																	})
																]
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
															className: "dmp-media-field",
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "thinkingFormat" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
																value: typeof compatValue(model, "thinkingFormat") === "string" ? String(compatValue(model, "thinkingFormat")) : "",
																disabled: readOnly,
																onChange: (event) => updateModel(index, setCompatField(model, "thinkingFormat", event.currentTarget.value || void 0)),
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																	value: "",
																	children: t("config.inherit")
																}), THINKING_FORMATS.map((value) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																	value,
																	children: value
																}, value))]
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
															className: "dmp-media-field",
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "requiresReasoningContentOnAssistantMessages" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
																value: booleanChoice(compatValue(model, "requiresReasoningContentOnAssistantMessages")),
																disabled: readOnly,
																onChange: (event) => updateModel(index, setCompatField(model, "requiresReasoningContentOnAssistantMessages", event.currentTarget.value === "" ? void 0 : event.currentTarget.value === "true")),
																children: [
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "",
																		children: t("config.inherit")
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "true",
																		children: "true"
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "false",
																		children: "false"
																	})
																]
															})]
														})
													]
												}) : protocol === "openai-responses" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: "dmp-config-compat-grid",
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
														className: "dmp-media-field",
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "supportsDeveloperRole" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
															value: booleanChoice(compatValue(model, "supportsDeveloperRole")),
															disabled: readOnly,
															onChange: (event) => updateModel(index, setCompatField(model, "supportsDeveloperRole", event.currentTarget.value === "" ? void 0 : event.currentTarget.value === "true")),
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																	value: "",
																	children: t("config.inherit")
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																	value: "true",
																	children: "true"
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																	value: "false",
																	children: "false"
																})
															]
														})]
													})
												}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("config.compatNone") })]
											})
										]
									}, `${String(model.id)}-${index}`);
								})
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/media-protocol.ts
		const MANUAL_PAID_ACKNOWLEDGEMENT = "accept-possible-openrouter-charge";
		//#endregion
		//#region src/client/media-api.ts
		const API_BASE = "/model-palette/api/media";
		function mediaModelNeedsConfirmation(model, allowPaid) {
			return !model.free && !allowPaid;
		}
		function pickDefaultMediaModel(models, allowPaid) {
			const available = models.filter((model) => !mediaModelNeedsConfirmation(model, allowPaid));
			return available.find((model) => model.free && model.preferred)?.id ?? available.find((model) => model.free)?.id ?? available.find((model) => model.preferred)?.id ?? available[0]?.id ?? "";
		}
		async function listMediaModels() {
			return mediaApiRequest("/models", {
				kind: "all",
				preferred_only: false,
				free_only: false
			});
		}
		async function generateImage(input) {
			return mediaApiRequest("/images/generate", {
				model: input.model,
				prompt: input.prompt,
				...input.outputName === void 0 ? {} : { output_name: input.outputName },
				...input.acknowledgePossibleCharge === true ? { manual_paid_acknowledgement: MANUAL_PAID_ACKNOWLEDGEMENT } : {}
			});
		}
		async function generateVideo(input) {
			return mediaApiRequest("/videos/generate", {
				model: input.model,
				prompt: input.prompt,
				...input.duration === void 0 ? {} : { duration: input.duration },
				...input.acknowledgePossibleCharge === true ? { manual_paid_acknowledgement: MANUAL_PAID_ACKNOWLEDGEMENT } : {}
			});
		}
		async function getVideoStatus(jobId) {
			return mediaApiRequest("/videos/status", { job_id: jobId });
		}
		async function downloadVideo(jobId, outputName) {
			return mediaApiRequest("/videos/download", {
				job_id: jobId,
				...outputName === void 0 ? {} : { output_name: outputName }
			});
		}
		async function mediaApiRequest(path, body) {
			const response = await fetch(`${API_BASE}${path}`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body)
			});
			let payload;
			try {
				payload = await response.json();
			} catch {
				throw new Error(`Media API returned HTTP ${response.status}`);
			}
			if (!response.ok || !payload.ok) throw new Error(payload.ok ? `Media API returned HTTP ${response.status}` : payload.error?.message ?? `Media API returned HTTP ${response.status}`);
			return payload.value;
		}
		//#endregion
		//#region src/client/MediaPanel.tsx
		function errorMessage(error) {
			return error instanceof Error ? error.message : String(error);
		}
		function selectedModel(current, models, allowPaid) {
			return models.some((model) => model.id === current) ? current : pickDefaultMediaModel(models, allowPaid);
		}
		function modelLabel(model, allowPaid, t) {
			const name = model.name?.trim();
			const identity = name === void 0 || name === "" || name === model.id ? model.id : `${name} · ${model.id}`;
			const price = model.free ? t("media.free") : allowPaid ? t("media.paidAllowed") : t("media.unverifiedFree");
			return `${model.preferred ? "★ " : ""}${identity} · ${price}`;
		}
		function MediaPanel({ t }) {
			const [catalog, setCatalog] = (0, react.useState)(null);
			const [imagePrompt, setImagePrompt] = (0, react.useState)("");
			const [imageModel, setImageModel] = (0, react.useState)("");
			const [imageOutputName, setImageOutputName] = (0, react.useState)("");
			const [imageChargeConfirmed, setImageChargeConfirmed] = (0, react.useState)(false);
			const [videoPrompt, setVideoPrompt] = (0, react.useState)("");
			const [videoModel, setVideoModel] = (0, react.useState)("");
			const [videoDuration, setVideoDuration] = (0, react.useState)("");
			const [videoChargeConfirmed, setVideoChargeConfirmed] = (0, react.useState)(false);
			const [jobId, setJobId] = (0, react.useState)("");
			const [videoOutputName, setVideoOutputName] = (0, react.useState)("");
			const [pending, setPending] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [feedback, setFeedback] = (0, react.useState)(null);
			const loadCatalog = (0, react.useCallback)(async () => {
				setPending("catalog");
				setError(null);
				try {
					const next = await listMediaModels();
					setCatalog(next);
					setImageModel((current) => selectedModel(current, next.images, next.paid_images_enabled));
					setVideoModel((current) => selectedModel(current, next.videos, next.paid_videos_enabled));
					setImageChargeConfirmed(false);
					setVideoChargeConfirmed(false);
				} catch (cause) {
					setError(errorMessage(cause));
				} finally {
					setPending(null);
				}
			}, []);
			(0, react.useEffect)(() => {
				loadCatalog();
			}, [loadCatalog]);
			const run = async (action, operation) => {
				if (pending !== null) return;
				setPending(action);
				setError(null);
				setFeedback(null);
				try {
					setFeedback(await operation());
				} catch (cause) {
					setError(errorMessage(cause));
				} finally {
					setPending(null);
				}
			};
			const submitImage = () => run("image", async () => {
				if (imageModel === "") throw new Error(t("media.modelRequired"));
				if (imageNeedsConfirmation && !imageChargeConfirmed) throw new Error(t("media.manualPaidRequired"));
				if (imagePrompt.trim() === "") throw new Error(t("media.promptRequired"));
				const acknowledgePossibleCharge = imageNeedsConfirmation && imageChargeConfirmed;
				if (acknowledgePossibleCharge) setImageChargeConfirmed(false);
				const result = await generateImage({
					model: imageModel,
					prompt: imagePrompt.trim(),
					...imageOutputName.trim() === "" ? {} : { outputName: imageOutputName.trim() },
					...acknowledgePossibleCharge ? { acknowledgePossibleCharge: true } : {}
				});
				return {
					title: t("media.imageDone"),
					detail: `${result.manual_paid_override ? `${t("media.manualPaidUsed")}\n` : ""}${result.files.map((file) => file.path).join("\n")}`
				};
			});
			const submitVideo = () => run("video", async () => {
				if (videoModel === "") throw new Error(t("media.modelRequired"));
				if (videoNeedsConfirmation && !videoChargeConfirmed) throw new Error(t("media.manualPaidRequired"));
				if (videoPrompt.trim() === "") throw new Error(t("media.promptRequired"));
				const duration = videoDuration.trim() === "" ? void 0 : Number(videoDuration);
				if (duration !== void 0 && (!Number.isInteger(duration) || duration < 1 || duration > 60)) throw new Error(t("media.durationInvalid"));
				const acknowledgePossibleCharge = videoNeedsConfirmation && videoChargeConfirmed;
				if (acknowledgePossibleCharge) setVideoChargeConfirmed(false);
				const result = await generateVideo({
					model: videoModel,
					prompt: videoPrompt.trim(),
					...duration === void 0 ? {} : { duration },
					...acknowledgePossibleCharge ? { acknowledgePossibleCharge: true } : {}
				});
				setJobId(result.id);
				return {
					title: t("media.videoSubmitted"),
					detail: `${result.manual_paid_override ? `${t("media.manualPaidUsed")}\n` : ""}${result.id}${result.status === void 0 ? "" : ` · ${result.status}`}`
				};
			});
			const checkStatus = () => run("status", async () => {
				if (jobId.trim() === "") throw new Error(t("media.jobRequired"));
				const result = await getVideoStatus(jobId.trim());
				return {
					title: t("media.statusDone"),
					detail: JSON.stringify(result, null, 2)
				};
			});
			const download = () => run("download", async () => {
				if (jobId.trim() === "") throw new Error(t("media.jobRequired"));
				const result = await downloadVideo(jobId.trim(), videoOutputName.trim() === "" ? void 0 : videoOutputName.trim());
				return {
					title: t("media.downloadDone"),
					detail: result.path
				};
			});
			const busy = pending !== null;
			const images = catalog?.images ?? [];
			const videos = catalog?.videos ?? [];
			const freeImages = images.filter((model) => model.free).length;
			const freeVideos = videos.filter((model) => model.free).length;
			const imageSelectionAvailable = imageModel !== "";
			const videoSelectionAvailable = videoModel !== "";
			const paidImagesEnabled = catalog?.paid_images_enabled === true;
			const paidVideosEnabled = catalog?.paid_videos_enabled === true;
			const selectedImage = images.find((model) => model.id === imageModel);
			const selectedVideo = videos.find((model) => model.id === videoModel);
			const imageNeedsConfirmation = selectedImage !== void 0 && mediaModelNeedsConfirmation(selectedImage, paidImagesEnabled);
			const videoNeedsConfirmation = selectedVideo !== void 0 && mediaModelNeedsConfirmation(selectedVideo, paidVideosEnabled);
			const imageCanSubmit = imageSelectionAvailable && (!imageNeedsConfirmation || imageChargeConfirmed);
			const videoCanSubmit = videoSelectionAvailable && (!videoNeedsConfirmation || videoChargeConfirmed);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("main", {
				className: "dmp-media",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dmp-media-intro",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("media.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.intro") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dmp-media-safety",
							children: t("media.priceProtection")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-media-catalog",
						"aria-live": "polite",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("media.catalog") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: pending === "catalog" ? t("media.catalogLoading") : `${images.length} ${t("media.imageCount")}（${freeImages} ${t("media.free")}） · ${videos.length} ${t("media.videoCount")}（${freeVideos} ${t("media.free")}）` })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: busy,
							onClick: () => void loadCatalog(),
							children: t("media.refresh")
						})]
					}),
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dmp-media-error",
						role: "alert",
						children: error
					}),
					feedback !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dmp-media-feedback",
						"aria-live": "polite",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: feedback.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", { children: feedback.detail })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dmp-media-grid",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: "dmp-media-card",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dmp-media-card-heading",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dmp-media-icon",
										"aria-hidden": "true",
										children: "▧"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("media.imageTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("media.imageDescription") })] })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dmp-media-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.model") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										value: imageModel,
										onChange: (event) => {
											setImageModel(event.currentTarget.value);
											setImageChargeConfirmed(false);
										},
										disabled: busy || images.length === 0,
										children: [
											images.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "",
												children: t("media.noModels")
											}),
											images.length > 0 && !imageSelectionAvailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "",
												children: t("media.chooseModel")
											}),
											images.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: model.id,
												children: modelLabel(model, paidImagesEnabled, t)
											}, model.id))
										]
									})]
								}),
								imageNeedsConfirmation && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dmp-media-paid-confirm",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: imageChargeConfirmed,
										onChange: (event) => setImageChargeConfirmed(event.currentTarget.checked),
										disabled: busy
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("media.manualPaidTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("media.manualPaidDescription") })] })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dmp-media-field dmp-media-field-wide",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.prompt") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										value: imagePrompt,
										onChange: (event) => setImagePrompt(event.currentTarget.value),
										placeholder: t("media.imagePromptPlaceholder")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dmp-media-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.outputOptional") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										value: imageOutputName,
										onChange: (event) => setImageOutputName(event.currentTarget.value),
										placeholder: "my-image"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: "dmp-media-primary",
									type: "button",
									disabled: busy || !imageCanSubmit,
									onClick: () => void submitImage(),
									children: pending === "image" ? t("media.running") : t("media.generateImage")
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: "dmp-media-card",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dmp-media-card-heading",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dmp-media-icon",
										"aria-hidden": "true",
										children: "▷"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("media.videoTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("media.videoDescription") })] })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dmp-media-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.model") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										value: videoModel,
										onChange: (event) => {
											setVideoModel(event.currentTarget.value);
											setVideoChargeConfirmed(false);
										},
										disabled: busy || videos.length === 0,
										children: [
											videos.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "",
												children: t("media.noModels")
											}),
											videos.length > 0 && !videoSelectionAvailable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "",
												children: t("media.chooseModel")
											}),
											videos.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: model.id,
												children: modelLabel(model, paidVideosEnabled, t)
											}, model.id))
										]
									})]
								}),
								videoNeedsConfirmation && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dmp-media-paid-confirm",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: videoChargeConfirmed,
										onChange: (event) => setVideoChargeConfirmed(event.currentTarget.checked),
										disabled: busy
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("media.manualPaidTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("media.manualPaidDescription") })] })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dmp-media-field dmp-media-field-wide",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.prompt") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										value: videoPrompt,
										onChange: (event) => setVideoPrompt(event.currentTarget.value),
										placeholder: t("media.videoPromptPlaceholder")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dmp-media-field dmp-media-duration",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.durationOptional") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "number",
										min: "1",
										max: "60",
										step: "1",
										value: videoDuration,
										onChange: (event) => setVideoDuration(event.currentTarget.value),
										placeholder: "5"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: "dmp-media-primary",
									type: "button",
									disabled: busy || !videoCanSubmit,
									onClick: () => void submitVideo(),
									children: pending === "video" ? t("media.running") : t("media.generateVideo")
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-media-card dmp-media-jobs",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dmp-media-card-heading",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dmp-media-icon",
								"aria-hidden": "true",
								children: "↓"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("media.jobsTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("media.jobsDescription") })] })]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dmp-media-job-row",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dmp-media-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.jobId") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										value: jobId,
										onChange: (event) => setJobId(event.currentTarget.value),
										placeholder: "generation-id"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dmp-media-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.outputOptional") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										value: videoOutputName,
										onChange: (event) => setVideoOutputName(event.currentTarget.value),
										placeholder: "my-video"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dmp-media-actions dmp-media-job-actions",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: busy,
										onClick: () => void checkStatus(),
										children: pending === "status" ? t("media.running") : t("media.checkStatus")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: "dmp-media-primary",
										type: "button",
										disabled: busy,
										onClick: () => void download(),
										children: pending === "download" ? t("media.running") : t("media.downloadVideo")
									})]
								})
							]
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/model.ts
		function choiceKey(providerId, modelId) {
			return `${providerId}\u0000${modelId}`;
		}
		function selectionFor(provider, model) {
			return {
				provider: provider.id,
				model: model.id,
				...model.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: model.reasoning.defaultEffort }
			};
		}
		function flattenChoices(groups) {
			let catalogIndex = 0;
			return groups.flatMap((provider) => provider.models.map((model) => ({
				key: choiceKey(provider.id, model.id),
				provider,
				model,
				selection: selectionFor(provider, model),
				catalogIndex: catalogIndex++
			})));
		}
		function currentChoice(choices, current) {
			if (current === null) return void 0;
			return choices.find((choice) => choice.provider.id === current.provider && choice.model.id === current.model);
		}
		function normalize(value) {
			return value?.trim().toLocaleLowerCase() ?? "";
		}
		function scoreField(field, token, weight) {
			if (field === token) return 1e3 + weight;
			if (field.startsWith(token)) return 700 + weight;
			if (field.split(/[^a-z0-9]+/u).some((part) => part.startsWith(token))) return 500 + weight;
			if (field.includes(token)) return 250 + weight;
			return -1;
		}
		function searchScore(choice, query) {
			const tokens = normalize(query).split(/\s+/u).filter(Boolean);
			if (tokens.length === 0) return 0;
			const fields = [
				[normalize(choice.model.name), 80],
				[normalize(choice.model.id), 70],
				[normalize(choice.provider.name), 55],
				[normalize(choice.provider.id), 45],
				[normalize(choice.model.description), 10]
			];
			let score = 0;
			for (const token of tokens) {
				let tokenScore = -1;
				for (const [field, weight] of fields) tokenScore = Math.max(tokenScore, scoreField(field, token, weight));
				if (tokenScore < 0) return null;
				score += tokenScore;
			}
			return score;
		}
		function rankChoices(choices, options) {
			const favoriteRank = new Map(options.favorites.map((key, index) => [key, index]));
			const recentRank = new Map(options.recents.map((key, index) => [key, index]));
			const currentKey = options.current === null ? null : choiceKey(options.current.provider, options.current.model);
			return choices.filter((choice) => options.providerId === null || choice.provider.id === options.providerId).map((choice) => ({
				choice,
				score: searchScore(choice, options.query)
			})).filter((entry) => entry.score !== null).sort((left, right) => {
				if (left.choice.key === currentKey) return -1;
				if (right.choice.key === currentKey) return 1;
				const leftFavorite = favoriteRank.get(left.choice.key);
				const rightFavorite = favoriteRank.get(right.choice.key);
				if (leftFavorite !== void 0 || rightFavorite !== void 0) {
					if (leftFavorite === void 0) return 1;
					if (rightFavorite === void 0) return -1;
					if (leftFavorite !== rightFavorite) return leftFavorite - rightFavorite;
				}
				const leftRecent = recentRank.get(left.choice.key);
				const rightRecent = recentRank.get(right.choice.key);
				if (leftRecent !== void 0 || rightRecent !== void 0) {
					if (leftRecent === void 0) return 1;
					if (rightRecent === void 0) return -1;
					if (leftRecent !== rightRecent) return leftRecent - rightRecent;
				}
				if (left.score !== right.score) return right.score - left.score;
				return left.choice.catalogIndex - right.choice.catalogIndex;
			}).map((entry) => entry.choice);
		}
		function pushRecent(recents, key, limit = 12) {
			return [key, ...recents.filter((entry) => entry !== key)].slice(0, limit);
		}
		function toggleFavorite(favorites, key) {
			return favorites.includes(key) ? favorites.filter((entry) => entry !== key) : [key, ...favorites];
		}
		//#endregion
		//#region src/client/ModelPalette.tsx
		const FAVORITES_KEY = "dsh-model-palette:favorites:v1";
		const RECENTS_KEY = "dsh-model-palette:recents:v1";
		function readStoredList(key) {
			try {
				const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
				return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
			} catch (error) {
				console.warn(`[dsh-model-palette] ignored invalid ${key}`, error);
				return [];
			}
		}
		function writeStoredList(key, values) {
			try {
				localStorage.setItem(key, JSON.stringify(values));
			} catch (error) {
				console.warn(`[dsh-model-palette] failed to persist ${key}`, error);
			}
		}
		function useStoredList(key) {
			const [values, setValues] = (0, react.useState)(() => readStoredList(key));
			const update = (next) => {
				setValues(next);
				writeStoredList(key, next);
			};
			return [values, update];
		}
		function isTypingTarget(target) {
			return target instanceof HTMLElement && (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");
		}
		function ModelPalette({ locked, available, directory, load, select, api, isLoopback, t }) {
			const snapshot = (0, react.useSyncExternalStore)(directory.subscribe, directory.getSnapshot, directory.getSnapshot);
			const choices = (0, react.useMemo)(() => flattenChoices(snapshot.groups), [snapshot.groups]);
			const current = currentChoice(choices, snapshot.current);
			const [open, setOpen] = (0, react.useState)(false);
			const [view, setView] = (0, react.useState)("models");
			const [query, setQuery] = (0, react.useState)("");
			const [providerId, setProviderId] = (0, react.useState)(null);
			const [cursor, setCursor] = (0, react.useState)(0);
			const [favorites, setFavorites] = useStoredList(FAVORITES_KEY);
			const [recents, setRecents] = useStoredList(RECENTS_KEY);
			const [error, setError] = (0, react.useState)(null);
			const searchRef = (0, react.useRef)(null);
			const rowRefs = (0, react.useRef)([]);
			const providers = (0, react.useMemo)(() => {
				const currentProvider = snapshot.current?.provider;
				return [...snapshot.groups].sort((left, right) => {
					if (left.id === currentProvider) return -1;
					if (right.id === currentProvider) return 1;
					return left.name.localeCompare(right.name);
				});
			}, [snapshot.groups, snapshot.current?.provider]);
			const results = (0, react.useMemo)(() => rankChoices(choices, {
				query,
				providerId,
				favorites,
				recents,
				current: snapshot.current
			}), [
				choices,
				query,
				providerId,
				favorites,
				recents,
				snapshot.current
			]);
			const show = () => {
				if (!available || locked) return;
				setOpen(true);
				setView("models");
				setQuery("");
				setProviderId(null);
				setCursor(0);
				setError(null);
				load();
			};
			const close = () => {
				setOpen(false);
				setError(null);
			};
			(0, react.useEffect)(() => {
				if (!open || view !== "models") return;
				const frame = requestAnimationFrame(() => searchRef.current?.focus());
				return () => cancelAnimationFrame(frame);
			}, [open, view]);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLocaleLowerCase() === "m") {
						event.preventDefault();
						if (open) close();
						else show();
						return;
					}
					if (!open) return;
					if (event.key === "Escape") {
						event.preventDefault();
						close();
						return;
					}
					if (view !== "models") return;
					if (event.key === "ArrowDown") {
						event.preventDefault();
						setCursor((value) => Math.min(value + 1, Math.max(0, results.length - 1)));
						return;
					}
					if (event.key === "ArrowUp") {
						event.preventDefault();
						setCursor((value) => Math.max(0, value - 1));
						return;
					}
					if (event.key === "Enter" && results[cursor] !== void 0 && !isTypingTarget(event.target)) {
						event.preventDefault();
						choose(results[cursor]);
					}
				};
				window.addEventListener("keydown", onKeyDown);
				return () => window.removeEventListener("keydown", onKeyDown);
			}, [
				open,
				locked,
				available,
				results,
				cursor,
				view
			]);
			(0, react.useEffect)(() => {
				setCursor(0);
			}, [query, providerId]);
			(0, react.useEffect)(() => {
				setCursor((value) => Math.min(value, Math.max(0, results.length - 1)));
			}, [results.length]);
			(0, react.useEffect)(() => {
				rowRefs.current[cursor]?.scrollIntoView({ block: "nearest" });
			}, [cursor]);
			const choose = async (choice) => {
				if (!await select(choice.selection)) {
					setError(t("palette.selectFailed"));
					return;
				}
				setRecents(pushRecent(recents, choice.key));
				close();
			};
			const chooseEffort = async (value) => {
				if (snapshot.current === null) return;
				if (!await select({
					provider: snapshot.current.provider,
					model: snapshot.current.model,
					...value === "" ? {} : { reasoningEffort: value }
				})) setError(t("palette.selectFailed"));
			};
			const currentLabel = current?.model.name ?? snapshot.current?.model ?? t("trigger.fallback");
			const providerLabel = current?.provider.name ?? snapshot.current?.provider;
			const currentReasoning = current?.model.reasoning;
			const currentEffort = snapshot.current?.reasoningEffort ?? currentReasoning?.defaultEffort ?? "";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dmp-seat",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "dmp-trigger",
					disabled: locked || !available,
					onClick: show,
					title: `${currentLabel}${providerLabel === void 0 ? "" : ` · ${providerLabel}`} · Alt+M`,
					"aria-label": t("trigger.aria"),
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dmp-trigger-icon",
							"aria-hidden": "true",
							children: "⌘"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dmp-trigger-model",
							children: currentLabel
						}),
						providerLabel !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dmp-trigger-provider",
							children: ["· ", providerLabel]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("kbd", { children: "Alt M" })
					]
				}), open && (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dmp-overlay",
					role: "presentation",
					onMouseDown: (event) => {
						if (event.target === event.currentTarget) close();
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-dialog",
						role: "dialog",
						"aria-modal": "true",
						"aria-label": t(view === "models" ? "palette.title" : view === "media" ? "media.title" : "config.title"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
								className: "dmp-header",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t(view === "models" ? "palette.title" : view === "media" ? "media.title" : "config.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: view === "models" ? `${choices.length} ${t("palette.models")} · ${t("palette.shortcut")}` : t(view === "media" ? "media.subtitle" : "config.subtitle") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dmp-close",
									onClick: close,
									"aria-label": t("palette.close"),
									children: "×"
								})]
							}),
							view === "models" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-search-wrap",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										"aria-hidden": "true",
										children: "⌕"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										ref: searchRef,
										value: query,
										onChange: (event) => setQuery(event.currentTarget.value),
										onKeyDown: (event) => {
											if (event.key === "Enter" && results[cursor] !== void 0) {
												event.preventDefault();
												choose(results[cursor]);
											}
										},
										placeholder: t("palette.search"),
										"aria-label": t("palette.search")
									}),
									query !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setQuery(""),
										"aria-label": t("palette.clear"),
										children: "×"
									})
								]
							}),
							view === "models" && (snapshot.error !== null || error !== null) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-error",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: error ?? snapshot.error }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: load,
									children: t("palette.retry")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-body",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("nav", {
									className: "dmp-providers",
									"aria-label": t("palette.providers"),
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: `dmp-media-nav${view === "media" ? " is-active" : ""}`,
											onClick: () => setView("media"),
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.nav") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: "5" })]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: `dmp-media-nav${view === "config" ? " is-active" : ""}`,
											onClick: () => setView("config"),
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.nav") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: "⚙" })]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dmp-provider-divider" }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: view === "models" && providerId === null ? "is-active" : "",
											onClick: () => {
												setView("models");
												setProviderId(null);
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("palette.allProviders") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: choices.length })]
										}),
										providers.map((provider) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: view === "models" && providerId === provider.id ? "is-active" : "",
											onClick: () => {
												setView("models");
												setProviderId(provider.id);
											},
											title: `${provider.name} · ${provider.id}`,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: provider.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: provider.models.length })]
										}, provider.id))
									]
								}), view === "media" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MediaPanel, { t }) : view === "config" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfigPanel, {
									api,
									isLoopback,
									t
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("main", {
									className: "dmp-results",
									children: [
										snapshot.status === "loading" && results.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "dmp-empty",
											children: t("palette.loading")
										}),
										snapshot.status !== "loading" && results.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "dmp-empty",
											children: t("palette.empty")
										}),
										results.map((choice, index) => {
											const isCurrent = snapshot.current?.provider === choice.provider.id && snapshot.current.model === choice.model.id;
											const isFavorite = favorites.includes(choice.key);
											const isRecent = recents.includes(choice.key);
											return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: `dmp-result${index === cursor ? " is-cursor" : ""}${isCurrent ? " is-current" : ""}`,
												onMouseEnter: () => setCursor(index),
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
													ref: (node) => {
														rowRefs.current[index] = node;
													},
													type: "button",
													className: "dmp-result-select",
													onClick: () => void choose(choice),
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														className: "dmp-result-main",
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																className: "dmp-result-title",
																children: [
																	choice.model.name,
																	isCurrent && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("palette.current") }),
																	isRecent && !isCurrent && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("palette.recent") })
																]
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																className: "dmp-result-meta",
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: choice.provider.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: choice.model.id })]
															}),
															choice.model.description !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: "dmp-result-description",
																children: choice.model.description
															})
														]
													}), choice.model.reasoning !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: "dmp-reasoning",
														children: "R"
													})]
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: `dmp-star${isFavorite ? " is-favorite" : ""}`,
													title: t(isFavorite ? "favorite.remove" : "favorite.add"),
													"aria-label": t(isFavorite ? "favorite.remove" : "favorite.add"),
													onClick: () => setFavorites(toggleFavorite(favorites, choice.key)),
													children: "★"
												})]
											}, choice.key);
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
								className: "dmp-footer",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dmp-current",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("palette.current") }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: currentLabel }),
											providerLabel !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: providerLabel })
										]
									}),
									currentReasoning !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-effort",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("palette.effort") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
											value: currentEffort,
											onChange: (event) => void chooseEffort(event.currentTarget.value),
											children: [currentReasoning.defaultEffort === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "",
												children: t("palette.providerDefault")
											}), currentReasoning.efforts.map((effort) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: effort.id,
												children: effort.name
											}, effort.id))]
										})]
									}),
									snapshot.failures.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "dmp-failures",
										title: snapshot.failures.map((item) => `${item.name}: ${item.message}`).join("\n"),
										children: [
											t("palette.failures"),
											" (",
											snapshot.failures.length,
											")"
										]
									})
								]
							})
						]
					})
				}), document.body)]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const NS = "dsh-model-palette";
		const zh = {
			"trigger.fallback": "选择模型",
			"trigger.aria": "打开模型命令面板",
			"palette.close": "关闭模型命令面板",
			"palette.clear": "清空搜索",
			"palette.providers": "供应商",
			"palette.title": "模型命令面板",
			"palette.search": "搜索模型、模型 ID、供应商或供应商 ID…",
			"palette.allProviders": "全部供应商",
			"palette.current": "当前",
			"palette.favorite": "收藏",
			"palette.recent": "最近",
			"palette.models": "个模型",
			"palette.empty": "没有匹配的模型",
			"palette.loading": "正在读取模型目录…",
			"palette.retry": "重试",
			"palette.failures": "部分供应商加载失败",
			"palette.shortcut": "Alt+M 随时打开",
			"palette.providerDefault": "供应商默认",
			"palette.effort": "推理档位",
			"palette.selectFailed": "切换模型失败",
			"favorite.add": "加入收藏",
			"favorite.remove": "取消收藏",
			"config.nav": "模型配置",
			"config.title": "供应商与模型配置",
			"config.subtitle": "编辑线路、密钥、模型容量与兼容参数",
			"config.intro": "直接写入 DSH settings/credentials；模型预置可从 GitHub 在线刷新。",
			"config.reload": "重新读取",
			"config.addProvider": "新增供应商",
			"config.done": "已完成",
			"config.namespaceMissing": "当前 DSH 没有加载 llm-pi-ai 配置命名空间。",
			"config.providerTitle": "供应商设置",
			"config.providerDescription": "配置线路名称、端点、协议与凭据引用。",
			"config.providerId": "供应商 ID",
			"config.providerIdInvalid": "供应商 ID 只能使用小写字母、数字和连字符，并且必须以字母或数字开头。",
			"config.displayName": "显示名称",
			"config.baseUrl": "Base URL",
			"config.baseUrlRequired": "Base URL 不能为空。",
			"config.protocol": "协议类型",
			"config.protocolRequired": "请选择有效的协议类型。",
			"config.protocolNote": "Responses 只是供应商协议，不代表 Agent 调用；按端点实际支持选择。",
			"config.credentialRef": "Credential ref",
			"config.credentialRefInvalid": "Credential ref 必须是合法的环境变量名称。",
			"config.apiKey": "API key",
			"config.keyConfigured": "已配置；留空保持不变",
			"config.keyNotConfigured": "输入新的 API key",
			"config.keyInvalid": "API key 只能包含无空格的可打印 ASCII 字符。",
			"config.show": "显示",
			"config.hide": "隐藏",
			"config.loadStoredKey": "读取已存 key",
			"config.revealLoopbackOnly": "查看已存 key 只允许在 127.0.0.1 / localhost 直接访问时使用。",
			"config.revealLocalReady": "本机直连：允许安全查看已存 key",
			"config.revealSuccess": "已从 DSH credentials 读取到输入框；离开或保存后会清空。",
			"config.credentialStatusConfigured": "凭据已配置（{source}）",
			"config.credentialStatusMissing": "凭据未配置",
			"config.probe": "检查连接",
			"config.probing": "正在检查…",
			"config.probeSuccess": "连接成功，供应商返回 {count} 个模型。",
			"config.importDiscovery": "导入探测结果（{count}）",
			"config.discoveryApplied": "新增 {added} 个模型，补全 {enriched} 个模型。",
			"config.save": "应用配置",
			"config.saving": "正在应用…",
			"config.saved": "配置已实时写入 DSH。",
			"config.settingsSavedKeyFailed": "供应商配置已保存，但 key 写入失败",
			"config.modelsTitle": "模型参数",
			"config.modelsDescription": "上下文窗口、最大输出和输入类型会直接影响 DSH 的容量判断与附件适配。",
			"config.refreshPresets": "刷新在线预置",
			"config.presetsLoading": "正在读取在线预置…",
			"config.presetsOnline": "在线预置 {date} · {count} 项",
			"config.presetsFallback": "在线失败，使用内置 {date} · {count} 项",
			"config.presetsBundled": "内置预置 {date} · {count} 项",
			"config.autoPreset": "自动补全缺失参数",
			"config.presetsApplied": "已为 {count} 个精确匹配的模型补全缺失参数。",
			"config.addModel": "新增模型",
			"config.noModels": "尚未配置模型。新增供应商至少需要一个模型。",
			"config.model": "模型",
			"config.modelId": "模型 ID",
			"config.modelIdRequired": "每个模型都必须填写模型 ID。",
			"config.modelName": "显示名称",
			"config.optional": "可选",
			"config.contextWindow": "上下文窗口",
			"config.maxTokens": "最大输出",
			"config.inputTypes": "输入类型",
			"config.inputInherit": "均不选表示继承供应商默认值",
			"config.preset": "模型预置",
			"config.noPreset": "不使用预置 / 手工配置",
			"config.applyPreset": "应用预置",
			"config.compatibility": "高级兼容参数",
			"config.compatNone": "当前协议没有需要在这里设置的常用兼容参数。",
			"config.inherit": "继承 / 自动判断",
			"config.remove": "移除",
			"media.nav": "媒体工具",
			"media.title": "OpenRouter 媒体工具",
			"media.subtitle": "直接查看并使用图像与视频能力",
			"media.intro": "直接读取 OpenRouter 实时目录并调用插件后端，不发送对话。",
			"media.priceProtection": "免费优先 · 逐次确认",
			"media.catalog": "实时模型与价格目录",
			"media.catalogLoading": "正在直接读取 OpenRouter…",
			"media.imageCount": "个图像模型",
			"media.videoCount": "个视频模型",
			"media.refresh": "刷新目录",
			"media.noModels": "当前没有模型",
			"media.chooseModel": "请选择模型",
			"media.free": "免费",
			"media.paidAllowed": "可能付费·配置允许",
			"media.unverifiedFree": "未识别为免费·可手工尝试",
			"media.model": "模型（标注实时价格状态）",
			"media.modelRequired": "请先手工选择一个模型。",
			"media.manualPaidTitle": "我理解本次请求可能扣费，仍要尝试",
			"media.manualPaidDescription": "OpenRouter 的促销免费状态可能未写入价格接口；如果实际收费，费用仍由你的账户承担。本确认仅对下一次提交有效。",
			"media.manualPaidRequired": "该模型未被 OpenRouter 价格接口识别为免费，请先勾选本次可能扣费确认。",
			"media.manualPaidUsed": "已按你的单次确认提交；是否扣费以 OpenRouter 账单为准。",
			"media.imageTitle": "生成图像",
			"media.imageDescription": "直接生成并保存到配置的输出目录。",
			"media.videoTitle": "生成视频",
			"media.videoDescription": "直接提交异步视频任务。",
			"media.jobsTitle": "视频任务",
			"media.jobsDescription": "直接查询任务状态，完成后下载到配置的输出目录。",
			"media.prompt": "生成要求",
			"media.imagePromptPlaceholder": "例如：一只坐在窗边的橘猫，电影感光影",
			"media.videoPromptPlaceholder": "例如：海面日落的电影镜头，缓慢推进",
			"media.outputOptional": "输出名称（可选）",
			"media.durationOptional": "时长秒数（可选）",
			"media.jobId": "任务 ID",
			"media.generateImage": "直接生成图像",
			"media.generateVideo": "直接提交视频",
			"media.checkStatus": "查询状态",
			"media.downloadVideo": "下载视频",
			"media.running": "正在执行…",
			"media.promptRequired": "请先填写生成要求。",
			"media.durationInvalid": "视频时长必须是 1–60 的整数。",
			"media.jobRequired": "请先填写视频任务 ID。",
			"media.imageDone": "图像已保存",
			"media.videoSubmitted": "视频任务已提交",
			"media.statusDone": "视频任务状态",
			"media.downloadDone": "视频已下载"
		};
		const en = {
			"trigger.fallback": "Select model",
			"trigger.aria": "Open model command palette",
			"palette.close": "Close model command palette",
			"palette.clear": "Clear search",
			"palette.providers": "Providers",
			"palette.title": "Model command palette",
			"palette.search": "Search model, model ID, provider, or provider ID…",
			"palette.allProviders": "All providers",
			"palette.current": "Current",
			"palette.favorite": "Favorite",
			"palette.recent": "Recent",
			"palette.models": "models",
			"palette.empty": "No matching models",
			"palette.loading": "Loading model catalog…",
			"palette.retry": "Retry",
			"palette.failures": "Some providers failed to load",
			"palette.shortcut": "Alt+M to open anywhere",
			"palette.providerDefault": "Provider default",
			"palette.effort": "Reasoning effort",
			"palette.selectFailed": "Failed to switch model",
			"favorite.add": "Add favorite",
			"favorite.remove": "Remove favorite",
			"config.nav": "Model config",
			"config.title": "Provider and model configuration",
			"config.subtitle": "Edit routes, credentials, model capacity, and compatibility",
			"config.intro": "Writes through DSH settings and credentials; model presets can refresh from GitHub.",
			"config.reload": "Reload",
			"config.addProvider": "Add provider",
			"config.done": "Done",
			"config.namespaceMissing": "The llm-pi-ai settings namespace is not loaded.",
			"config.providerTitle": "Provider settings",
			"config.providerDescription": "Configure the route name, endpoint, protocol, and credential reference.",
			"config.providerId": "Provider ID",
			"config.providerIdInvalid": "Provider ID must use lowercase letters, numbers, and hyphens and start with a letter or number.",
			"config.displayName": "Display name",
			"config.baseUrl": "Base URL",
			"config.baseUrlRequired": "Base URL is required.",
			"config.protocol": "Protocol",
			"config.protocolRequired": "Select a valid protocol.",
			"config.protocolNote": "Responses is a provider protocol, not an Agent mode; select what the endpoint actually supports.",
			"config.credentialRef": "Credential ref",
			"config.credentialRefInvalid": "Credential ref must be a valid environment variable name.",
			"config.apiKey": "API key",
			"config.keyConfigured": "Configured; leave blank to keep it",
			"config.keyNotConfigured": "Enter a new API key",
			"config.keyInvalid": "API keys may contain printable non-space ASCII characters only.",
			"config.show": "Show",
			"config.hide": "Hide",
			"config.loadStoredKey": "Load stored key",
			"config.revealLoopbackOnly": "Stored keys can be revealed only through direct 127.0.0.1 or localhost access.",
			"config.revealLocalReady": "Direct localhost access: stored-key reveal is available",
			"config.revealSuccess": "Loaded from DSH credentials; the field is cleared after leaving or saving.",
			"config.credentialStatusConfigured": "Credential configured ({source})",
			"config.credentialStatusMissing": "Credential not configured",
			"config.probe": "Check connection",
			"config.probing": "Checking…",
			"config.probeSuccess": "Connection succeeded and returned {count} models.",
			"config.importDiscovery": "Import discovered models ({count})",
			"config.discoveryApplied": "Added {added} models and enriched {enriched} models.",
			"config.save": "Apply configuration",
			"config.saving": "Applying…",
			"config.saved": "Configuration was written live to DSH.",
			"config.settingsSavedKeyFailed": "Provider settings were saved, but the key write failed",
			"config.modelsTitle": "Model parameters",
			"config.modelsDescription": "Context, maximum output, and inputs drive DSH capacity and attachment decisions.",
			"config.refreshPresets": "Refresh online presets",
			"config.presetsLoading": "Loading online presets…",
			"config.presetsOnline": "Online presets {date} · {count}",
			"config.presetsFallback": "Online failed; bundled {date} · {count}",
			"config.presetsBundled": "Bundled presets {date} · {count}",
			"config.autoPreset": "Fill missing parameters",
			"config.presetsApplied": "Filled missing parameters for {count} exact model matches.",
			"config.addModel": "Add model",
			"config.noModels": "No models are configured. A custom provider needs at least one model.",
			"config.model": "Model",
			"config.modelId": "Model ID",
			"config.modelIdRequired": "Every model needs an ID.",
			"config.modelName": "Display name",
			"config.optional": "Optional",
			"config.contextWindow": "Context window",
			"config.maxTokens": "Maximum output",
			"config.inputTypes": "Input types",
			"config.inputInherit": "Select neither to inherit the provider default",
			"config.preset": "Model preset",
			"config.noPreset": "No preset / manual configuration",
			"config.applyPreset": "Apply preset",
			"config.compatibility": "Advanced compatibility",
			"config.compatNone": "This protocol has no common compatibility switches exposed here.",
			"config.inherit": "Inherit / auto detect",
			"config.remove": "Remove",
			"media.nav": "Media tools",
			"media.title": "OpenRouter media tools",
			"media.subtitle": "Direct access to image and video capabilities",
			"media.intro": "Reads the live OpenRouter catalog and calls the plugin backend without sending a conversation message.",
			"media.priceProtection": "Free first · confirm each attempt",
			"media.catalog": "Live model and pricing catalog",
			"media.catalogLoading": "Reading OpenRouter directly…",
			"media.imageCount": "image models",
			"media.videoCount": "video models",
			"media.refresh": "Refresh catalog",
			"media.noModels": "No models are available",
			"media.chooseModel": "Select a model",
			"media.free": "free",
			"media.paidAllowed": "possibly paid · enabled by config",
			"media.unverifiedFree": "not reported free · manual attempt available",
			"media.model": "Model (live pricing status)",
			"media.modelRequired": "Select a model first.",
			"media.manualPaidTitle": "I understand this request may be charged and still want to try",
			"media.manualPaidDescription": "Promotional free access may not appear in OpenRouter pricing data. If the request is charged, your account remains responsible. This confirmation applies only to the next submission.",
			"media.manualPaidRequired": "OpenRouter does not report this model as free. Confirm the possible charge for this attempt first.",
			"media.manualPaidUsed": "Submitted with your one-time confirmation. Check OpenRouter billing for the final charge.",
			"media.imageTitle": "Generate image",
			"media.imageDescription": "Generates directly and saves into the configured output directory.",
			"media.videoTitle": "Generate video",
			"media.videoDescription": "Submits an asynchronous video job directly.",
			"media.jobsTitle": "Video jobs",
			"media.jobsDescription": "Checks job status directly and downloads completed videos.",
			"media.prompt": "Prompt",
			"media.imagePromptPlaceholder": "Example: an orange cat by a window, cinematic lighting",
			"media.videoPromptPlaceholder": "Example: a cinematic sunset over the ocean, slow push in",
			"media.outputOptional": "Output name (optional)",
			"media.durationOptional": "Duration in seconds (optional)",
			"media.jobId": "Job ID",
			"media.generateImage": "Generate image directly",
			"media.generateVideo": "Submit video directly",
			"media.checkStatus": "Check status",
			"media.downloadVideo": "Download video",
			"media.running": "Running…",
			"media.promptRequired": "Enter a prompt first.",
			"media.durationInvalid": "Video duration must be an integer from 1 to 60.",
			"media.jobRequired": "Enter a video job ID first.",
			"media.imageDone": "Image saved",
			"media.videoSubmitted": "Video job submitted",
			"media.statusDone": "Video job status",
			"media.downloadDone": "Video downloaded"
		};
		//#endregion
		//#region \0dsh-model-palette-css:src/client/style.css.mjs
		const css = ".dmp-seat { display: inline-flex; min-width: 0; }\n.dmp-trigger { height: 28px; max-width: 340px; display: inline-flex; align-items: center; gap: 5px; padding: 0 8px; border: 0; border-radius: 16px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 13px; }\n.dmp-trigger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dmp-trigger:focus-visible { outline: 2px solid var(--dsw-alias-border-l2); outline-offset: 1px; }\n.dmp-trigger:disabled { color: var(--dsw-alias-label-dimmed); cursor: default; }\n.dmp-trigger-icon { color: var(--dsw-alias-brand-primary); font-weight: 700; }\n.dmp-trigger-model, .dmp-trigger-provider { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-trigger-model { max-width: 150px; font-weight: 600; }\n.dmp-trigger-provider { max-width: 110px; color: var(--dsw-alias-label-caption); }\n.dmp-trigger kbd { padding: 1px 5px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 5px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-family: inherit; }\n.dmp-overlay { position: fixed; inset: 0; z-index: 10020; display: grid; place-items: center; padding: 24px; background: color-mix(in srgb, var(--dsw-alias-bg-mask, #000) 46%, transparent); backdrop-filter: blur(8px); }\n.dmp-dialog { width: min(920px, calc(100vw - 32px)); height: min(720px, calc(100vh - 48px)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 18px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); box-shadow: 0 24px 80px rgb(0 0 0 / 28%); }\n.dmp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px 14px; }\n.dmp-header h2 { margin: 0; font-size: 18px; line-height: 24px; }\n.dmp-header p { margin: 3px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; }\n.dmp-close { width: 30px; height: 30px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 22px; }\n.dmp-close:hover { background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-search-wrap { display: flex; align-items: center; gap: 9px; margin: 0 22px 12px; padding: 0 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 11px; background: var(--dsw-alias-bg-layer-1); }\n.dmp-search-wrap:focus-within { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); }\n.dmp-search-wrap input { flex: 1; min-width: 0; height: 42px; border: 0; outline: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 14px; }\n.dmp-search-wrap input::placeholder { color: var(--dsw-alias-label-tertiary); }\n.dmp-search-wrap button { border: 0; background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; font-size: 18px; }\n.dmp-error { display: flex; align-items: center; gap: 12px; margin: 0 22px 10px; padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-state-error-secondary); color: var(--dsw-alias-state-error-primary); font-size: 12px; }\n.dmp-error button { margin-left: auto; border: 1px solid currentColor; border-radius: 12px; background: transparent; color: inherit; cursor: pointer; }\n.dmp-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 190px minmax(0, 1fr); border-top: 1px solid var(--dsw-alias-border-inverted); border-bottom: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-providers { min-height: 0; overflow-y: auto; padding: 10px; border-right: 1px solid var(--dsw-alias-border-inverted); background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 72%, transparent); }\n.dmp-providers button { width: 100%; display: flex; align-items: center; gap: 8px; min-height: 34px; padding: 7px 9px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; text-align: left; font: inherit; font-size: 12.5px; }\n.dmp-providers button:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dmp-providers button.is-active { background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); }\n.dmp-providers button span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-providers button small { color: var(--dsw-alias-label-tertiary); }\n.dmp-providers .dmp-media-nav { color: var(--dsw-alias-brand-primary); font-weight: 600; }\n.dmp-provider-divider { height: 1px; margin: 8px 4px; background: var(--dsw-alias-border-inverted); }\n.dmp-results { min-height: 0; overflow-y: auto; padding: 10px; }\n.dmp-result { width: 100%; display: flex; align-items: center; gap: 2px; border-radius: 10px; background: transparent; color: var(--dsw-alias-label-primary); }\n.dmp-result:hover, .dmp-result.is-cursor { background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-result.is-current { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent); }\n.dmp-result-select { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 10px 5px 10px 11px; border: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; font: inherit; }\n.dmp-result-select:focus-visible, .dmp-star:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }\n.dmp-result-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }\n.dmp-result-title { display: flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 600; }\n.dmp-result-title em { padding: 1px 6px; border-radius: 999px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 10px; font-style: normal; font-weight: 500; }\n.dmp-result-meta { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--dsw-alias-label-tertiary); font-size: 11.5px; }\n.dmp-result-meta strong { color: var(--dsw-alias-label-secondary); font-weight: 500; }\n.dmp-result-meta span, .dmp-result-description { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-result-description { color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-reasoning { width: 21px; height: 21px; display: grid; place-items: center; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 6px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-weight: 700; }\n.dmp-star { margin-right: 7px; padding: 4px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-dimmed); cursor: pointer; font: inherit; font-size: 16px; }\n.dmp-star:hover, .dmp-star.is-favorite { color: var(--dsw-alias-state-warn-primary); background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-empty { display: grid; min-height: 220px; place-items: center; color: var(--dsw-alias-label-tertiary); font-size: 13px; }\n.dmp-footer { min-height: 62px; display: flex; align-items: center; gap: 16px; padding: 10px 18px; }\n.dmp-current { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 7px; }\n.dmp-current span { color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-current strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }\n.dmp-current small { color: var(--dsw-alias-label-tertiary); }\n.dmp-effort { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-effort select { height: 30px; max-width: 170px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; }\n.dmp-failures { color: var(--dsw-alias-state-warn-primary); font-size: 11px; }\n.dmp-media { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dmp-media-intro { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 10px; padding: 11px 13px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }\n.dmp-media-intro div { display: flex; flex-direction: column; gap: 2px; }\n.dmp-media-intro strong { font-size: 13px; }\n.dmp-media-intro span { color: var(--dsw-alias-label-tertiary); font-size: 11.5px; line-height: 17px; }\n.dmp-media-intro .dmp-media-safety { flex: none; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, #22a06b 15%, transparent); color: #22a06b; font-size: 10px; font-weight: 600; }\n.dmp-media-catalog { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; padding: 9px 11px; border-bottom: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-media-catalog div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-media-catalog strong { font-size: 12px; }\n.dmp-media-catalog span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-media-catalog button { flex: none; min-height: 29px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 10.5px; }\n.dmp-media-catalog button:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-media-catalog button:disabled { opacity: .5; cursor: default; }\n.dmp-media-error { margin-bottom: 10px; padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-state-error-secondary); color: var(--dsw-alias-state-error-primary); font-size: 12px; }\n.dmp-media-feedback { margin-bottom: 10px; padding: 9px 10px; border-radius: 8px; background: color-mix(in srgb, #22a06b 11%, var(--dsw-alias-bg-layer-2)); color: var(--dsw-alias-label-primary); font-size: 11px; }\n.dmp-media-feedback strong { display: block; margin-bottom: 4px; color: #22a06b; }\n.dmp-media-feedback pre { max-height: 110px; margin: 0; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--dsw-alias-label-secondary); font: inherit; line-height: 16px; }\n.dmp-media-card { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dmp-media-card-heading { display: flex; align-items: flex-start; gap: 9px; }\n.dmp-media-card-heading div { min-width: 0; }\n.dmp-media-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dmp-media-card-heading p { margin: 2px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-media-icon { width: 25px; height: 25px; flex: none; display: grid; place-items: center; border-radius: 7px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 14px; font-weight: 700; }\n.dmp-media-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 10px; }\n.dmp-media-fields { display: grid; grid-template-columns: minmax(0, 1fr) 120px; gap: 8px; }\n.dmp-media-field { min-width: 0; display: flex; flex-direction: column; gap: 4px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-media-field input, .dmp-media-field textarea, .dmp-media-field select { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }\n.dmp-media-field input, .dmp-media-field select { height: 32px; padding: 0 9px; }\n.dmp-media-field textarea { min-height: 58px; resize: vertical; padding: 8px 9px; line-height: 17px; }\n.dmp-media-field input:focus, .dmp-media-field textarea:focus, .dmp-media-field select:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }\n.dmp-media-field input::placeholder, .dmp-media-field textarea::placeholder { color: var(--dsw-alias-label-dimmed); }\n.dmp-media-paid-confirm { display: flex; align-items: flex-start; gap: 8px; padding: 8px 9px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 46%, var(--dsw-alias-border-inverted)); border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 9%, transparent); color: var(--dsw-alias-label-secondary); cursor: pointer; }\n.dmp-media-paid-confirm input { width: 14px; height: 14px; flex: none; margin: 2px 0 0; accent-color: var(--dsw-alias-state-warn-primary, #d97706); }\n.dmp-media-paid-confirm span { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-media-paid-confirm strong { color: var(--dsw-alias-state-warn-primary, #d97706); font-size: 10.5px; line-height: 15px; }\n.dmp-media-paid-confirm small { color: var(--dsw-alias-label-tertiary); font-size: 9.5px; line-height: 14px; }\n.dmp-media-actions { display: flex; flex-wrap: wrap; gap: 7px; }\n.dmp-media-actions button, .dmp-media-primary { min-height: 31px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 11px; }\n.dmp-media-actions button:hover:not(:disabled), .dmp-media-primary:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-media-actions button.dmp-media-primary, .dmp-media-primary { align-self: flex-end; border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 50%, var(--dsw-alias-border-l2)); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); font-weight: 600; }\n.dmp-media-actions button.dmp-media-primary:hover:not(:disabled), .dmp-media-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 88%, #000); color: var(--dsw-alias-label-on-primary, #fff); }\n.dmp-media-actions button:disabled, .dmp-media-primary:disabled { opacity: .5; cursor: default; }\n.dmp-media-job-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; align-items: end; gap: 8px; }\n.dmp-media-job-actions { flex-wrap: nowrap; }\n.dmp-config { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dmp-config-toolbar, .dmp-config-card-heading, .dmp-config-status-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }\n.dmp-config-toolbar { margin-bottom: 10px; padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent); }\n.dmp-config-toolbar > div:first-child { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-config-toolbar strong { font-size: 13px; }\n.dmp-config-toolbar span, .dmp-config-card-heading p, .dmp-config-status-row, .dmp-config-heading-actions > span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-config-toolbar-actions, .dmp-config-heading-actions, .dmp-config-status-row > div, .dmp-config-key-input, .dmp-config-preset { display: flex; align-items: center; gap: 7px; }\n.dmp-config button, .dmp-config select { font: inherit; }\n.dmp-config-toolbar button, .dmp-config-card-heading button, .dmp-config-status-row button, .dmp-config-preset button, .dmp-config-model-top button { min-height: 29px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10.5px; }\n.dmp-config-toolbar button:hover:not(:disabled), .dmp-config-card-heading button:hover:not(:disabled), .dmp-config-status-row button:hover:not(:disabled), .dmp-config-preset button:hover:not(:disabled), .dmp-config-model-top button:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-config button:disabled { opacity: .5; cursor: default; }\n.dmp-config-card { margin-bottom: 10px; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dmp-config-card-heading { align-items: flex-start; margin-bottom: 11px; }\n.dmp-config-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dmp-config-card-heading p { margin: 2px 0 0; }\n.dmp-config-card-heading > select { min-width: 190px; height: 31px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; }\n.dmp-config-provider-grid, .dmp-config-model-grid, .dmp-config-compat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; }\n.dmp-config-span-2 { grid-column: span 2; }\n.dmp-config-protocol-note { grid-column: span 3; align-self: end; min-height: 32px; display: flex; align-items: center; padding: 0 9px; border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 14px; }\n.dmp-config-key-field { grid-column: span 3; }\n.dmp-config-key-input input { flex: 1; min-width: 0; }\n.dmp-config-key-input button { flex: none; min-height: 30px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10px; }\n.dmp-config-status-row { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-config-status-row > span.is-ok { color: #22a06b; }\n.dmp-config-status-row > div { margin-left: auto; }\n.dmp-config-status-row button.dmp-media-primary { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); }\n.dmp-config-heading-actions { flex-wrap: wrap; justify-content: flex-end; }\n.dmp-config-models { display: flex; flex-direction: column; gap: 9px; }\n.dmp-config-empty { min-height: 90px; display: grid; place-items: center; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-config-model { padding: 10px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 70%, transparent); }\n.dmp-config-model-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }\n.dmp-config-model-top strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }\n.dmp-config-model-top button { min-height: 25px; color: var(--dsw-alias-state-error-primary); }\n.dmp-config-inputs { grid-column: span 2; min-width: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 9px; margin: 0; padding: 5px 8px 7px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; }\n.dmp-config-inputs legend { padding: 0 4px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-config-inputs label { display: flex; align-items: center; gap: 4px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; }\n.dmp-config-inputs input { accent-color: var(--dsw-alias-brand-primary); }\n.dmp-config-inputs small { color: var(--dsw-alias-label-dimmed); font-size: 9.5px; }\n.dmp-config-preset { grid-column: span 2; align-items: end; min-width: 0; }\n.dmp-config-preset .dmp-media-field { flex: 1; }\n.dmp-config-preset a { flex: none; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-brand-primary); font-size: 9.5px; text-decoration: none; }\n.dmp-config-compat { margin-top: 8px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-config-compat summary { padding-top: 8px; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10.5px; }\n.dmp-config-compat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); padding-top: 8px; }\n.dmp-config-compat p { margin: 8px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10px; }\n@media (max-width: 680px) { .dmp-overlay { padding: 8px; } .dmp-dialog { width: 100%; height: min(680px, calc(100vh - 16px)); border-radius: 14px; } .dmp-body { grid-template-columns: 125px minmax(0, 1fr); } .dmp-providers { padding: 7px; } .dmp-result-description, .dmp-trigger kbd { display: none; } .dmp-footer { flex-wrap: wrap; } }\n@media (max-width: 760px) { .dmp-media-grid { grid-template-columns: 1fr; } .dmp-media-job-row { grid-template-columns: 1fr; } .dmp-media-job-actions { flex-wrap: wrap; } }\n@media (max-width: 820px) { .dmp-config-provider-grid, .dmp-config-model-grid, .dmp-config-compat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .dmp-config-span-2, .dmp-config-key-field, .dmp-config-protocol-note, .dmp-config-inputs, .dmp-config-preset { grid-column: span 2; } .dmp-config-toolbar, .dmp-config-card-heading, .dmp-config-status-row { align-items: stretch; flex-direction: column; } .dmp-config-status-row > div { margin-left: 0; flex-wrap: wrap; } }\n";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"dsh-model-palette/style.css\"]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-model-palette";
			tag.dataset.pluginCss = "dsh-model-palette/style.css";
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/index.tsx
		const inject = [
			"locale",
			"sessions",
			"slots",
			"modelDirectories",
			"connection"
		];
		function apply(ctx) {
			const connection = ctx.get("connection");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-model-palette: dictionaries");
			ctx.inject([
				"slots",
				"modelDirectories",
				"sessions"
			], (scope) => {
				scope.slots.inject("conversation.input.model", () => scope.slots.register({
					name: "conversation.input.model",
					locale: NS,
					priority: -2,
					registrant: "dsh-model-palette",
					inject: (sessionId) => {
						const directory = scope.modelDirectories.directoryFor(sessionId);
						const available = scope.sessions.subagentAddress(sessionId) === void 0;
						return {
							available,
							directory: directory.store,
							load: () => {
								if (available) directory.load().catch((error) => {
									console.error("[dsh-model-palette] model directory load failed", error);
								});
							},
							select: async (selection) => {
								if (!available) return false;
								try {
									await directory.select(selection);
									return true;
								} catch (error) {
									console.error("[dsh-model-palette] model selection failed", error);
									return false;
								}
							},
							api: connection.api,
							isLoopback: connection.isLoopback
						};
					}
				}, ModelPalette), "dsh-model-palette: composer model seat");
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
