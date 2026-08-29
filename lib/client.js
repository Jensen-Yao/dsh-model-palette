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
		/** Test both OpenAI request protocols against one model through the plugin backend. */
		async function probeProviderProtocols(input) {
			const response = await fetch(`${CONFIG_API_BASE}/protocols/probe`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(input)
			});
			let payload;
			try {
				payload = await response.json();
			} catch {
				throw new Error(`Configuration API returned HTTP ${response.status}`);
			}
			if (!response.ok || !payload.ok) throw new Error(payload.ok ? `Configuration API returned HTTP ${response.status}` : payload.error?.message ?? `Configuration API returned HTTP ${response.status}`);
			return payload.value.results;
		}
		/** Validate one provider credential without returning the credential to the browser. */
		async function validateProviderApiKey(input) {
			const response = await fetch(`${CONFIG_API_BASE}/credentials/validate`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(input)
			});
			let payload;
			try {
				payload = await response.json();
			} catch {
				throw new Error(`Configuration API returned HTTP ${response.status}`);
			}
			if (!response.ok || !payload.ok) throw new Error(payload.ok ? `Configuration API returned HTTP ${response.status}` : payload.error?.message ?? `Configuration API returned HTTP ${response.status}`);
			return payload.value;
		}
		/** Validate all configured runtime credentials without returning any credential to the browser. */
		async function validateProviderApiKeys(input) {
			const response = await fetch(`${CONFIG_API_BASE}/credentials/validate-batch`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(input)
			});
			let payload;
			try {
				payload = await response.json();
			} catch {
				throw new Error(`Configuration API returned HTTP ${response.status}`);
			}
			if (!response.ok || !payload.ok) throw new Error(payload.ok ? `Configuration API returned HTTP ${response.status}` : payload.error?.message ?? `Configuration API returned HTTP ${response.status}`);
			return payload.value.results;
		}
		/** Read the live public OpenRouter catalog and return its DSH-compatible :free variants. */
		async function fetchOpenRouterFreeModels() {
			const response = await fetch(`${CONFIG_API_BASE}/models/openrouter/free`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: "{}"
			});
			let payload;
			try {
				payload = await response.json();
			} catch {
				throw new Error(`Configuration API returned HTTP ${response.status}`);
			}
			if (!response.ok || !payload.ok) throw new Error(payload.ok ? `Configuration API returned HTTP ${response.status}` : payload.error?.message ?? `Configuration API returned HTTP ${response.status}`);
			return payload.value;
		}
		//#endregion
		//#region assets/model-presets.json
		var model_presets_default = {
			version: 2,
			updatedAt: "2026-08-28",
			presets: [
				{
					"id": "openai-gpt-5.6-sol",
					"name": "OpenAI GPT-5.6 Sol",
					"aliases": ["gpt-5.6-sol", "openai/gpt-5.6-sol"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
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
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
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
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
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
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
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
					"reasoningEfforts": {
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
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
					"reasoningEfforts": {
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
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
					"reasoningEfforts": {
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
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
					"reasoningEfforts": {
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
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
					"reasoningEfforts": {
						"high": "high",
						"max": "max"
					},
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
					"reasoningEfforts": {
						"high": "high",
						"max": "max"
					},
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
					"reasoningEfforts": {
						"high": "high",
						"max": "max"
					},
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
					"reasoningEfforts": {
						"low": "low",
						"high": "high",
						"max": "max"
					},
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
					"reasoningEfforts": {
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
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
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models/kimi-k3"
				},
				{
					"id": "moonshot-kimi-k2.7-code",
					"name": "Moonshot Kimi K2.7 Code",
					"aliases": ["kimi-k2.7-code", "moonshotai/kimi-k2.7-code"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshot-kimi-k2.6",
					"name": "Moonshot Kimi K2.6",
					"aliases": ["kimi-k2.6", "moonshotai/kimi-k2.6"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshot-kimi-k2.5",
					"name": "Moonshot Kimi K2.5",
					"aliases": ["kimi-k2.5", "moonshotai/kimi-k2.5"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "openai-gpt-5",
					"name": "OpenAI GPT-5",
					"aliases": ["gpt-5", "openai/gpt-5"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-gpt-5.2",
					"name": "OpenAI GPT-5.2",
					"aliases": ["gpt-5.2", "openai/gpt-5.2"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-gpt-5.3-codex",
					"name": "OpenAI GPT-5.3 Codex",
					"aliases": ["gpt-5.3-codex", "openai/gpt-5.3-codex"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-gpt-5.4",
					"name": "OpenAI GPT-5.4",
					"aliases": ["gpt-5.4", "openai/gpt-5.4"],
					"contextWindow": 272e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-gpt-5.4-pro",
					"name": "OpenAI GPT-5.4 Pro",
					"aliases": ["gpt-5.4-pro", "openai/gpt-5.4-pro"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-o3",
					"name": "OpenAI o3",
					"aliases": ["o3", "openai/o3"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-o3-mini",
					"name": "OpenAI o3-mini",
					"aliases": ["o3-mini", "openai/o3-mini"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text"],
					"reasoningEfforts": {
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-o4-mini",
					"name": "OpenAI o4-mini",
					"aliases": ["o4-mini", "openai/o4-mini"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "anthropic-claude-opus-4.6",
					"name": "Anthropic Claude Opus 4.6",
					"aliases": [
						"claude-opus-4.6",
						"claude-opus-4-6",
						"anthropic/claude-opus-4.6"
					],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "anthropic-claude-sonnet-4.6",
					"name": "Anthropic Claude Sonnet 4.6",
					"aliases": [
						"claude-sonnet-4.6",
						"claude-sonnet-4-6",
						"anthropic/claude-sonnet-4.6"
					],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "anthropic-claude-haiku-4.5",
					"name": "Anthropic Claude Haiku 4.5",
					"aliases": [
						"claude-haiku-4.5",
						"claude-haiku-4-5",
						"anthropic/claude-haiku-4.5"
					],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "google-gemini-2.5-flash",
					"name": "Google Gemini 2.5 Flash",
					"aliases": ["gemini-2.5-flash", "google/gemini-2.5-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "google-gemini-2.5-pro",
					"name": "Google Gemini 2.5 Pro",
					"aliases": ["gemini-2.5-pro", "google/gemini-2.5-pro"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-qwen3.6-flash",
					"name": "Qwen 3.6 Flash",
					"aliases": ["qwen3.6-flash", "qwen/qwen3.6-flash"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-qwen3.6-plus",
					"name": "Qwen 3.6 Plus",
					"aliases": ["qwen3.6-plus", "qwen/qwen3.6-plus"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-qwen3.7-max",
					"name": "Qwen 3.7 Max",
					"aliases": ["qwen3.7-max", "qwen/qwen3.7-max"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-qwen3.7-plus",
					"name": "Qwen 3.7 Plus",
					"aliases": ["qwen3.7-plus", "qwen/qwen3.7-plus"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-qwen3.8-max-preview",
					"name": "Qwen 3.8 Max Preview",
					"aliases": ["qwen3.8-max-preview", "qwen/qwen3.8-max-preview"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "xai-grok-4.5",
					"name": "xAI Grok 4.5",
					"aliases": [
						"grok-4.5",
						"x-ai/grok-4.5",
						"xai/grok-4.5"
					],
					"contextWindow": 5e5,
					"maxTokens": 5e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
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
			if (preset.reasoningEfforts !== void 0 && (overwrite || next.reasoningEfforts === void 0)) next.reasoningEfforts = structuredClone(preset.reasoningEfforts);
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
				const reasoningEfforts = entry.reasoningEfforts === void 0 ? void 0 : validateReasoningEfforts(entry.reasoningEfforts);
				return {
					id: entry.id,
					name: entry.name,
					aliases: [...entry.aliases],
					...contextWindow === void 0 ? {} : { contextWindow },
					...maxTokens === void 0 ? {} : { maxTokens },
					...input === void 0 ? {} : { input },
					...reasoningEfforts === void 0 ? {} : { reasoningEfforts },
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
		function validateReasoningEfforts(value) {
			if (!isRecord$1(value)) throw new TypeError("reasoningEfforts must be an object");
			const levels = /* @__PURE__ */ new Set([
				"off",
				"minimal",
				"low",
				"medium",
				"high",
				"xhigh",
				"max"
			]);
			const result = {};
			for (const [level, wire] of Object.entries(value)) {
				if (!levels.has(level) || wire !== null && (typeof wire !== "string" || wire === "")) throw new TypeError("reasoningEfforts contains an invalid level or wire value");
				if (wire === null && level !== "off") throw new TypeError("only reasoningEfforts.off may be null");
				result[level] = wire;
			}
			if (Object.keys(result).length === 0 || !Object.keys(result).some((level) => level !== "off")) throw new TypeError("reasoningEfforts must offer at least one enabled level");
			return result;
		}
		function isRecord$1(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		//#endregion
		//#region src/client/model-config.ts
		const PROVIDER_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
		const CREDENTIAL_REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
		const REASONING_LEVELS = [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		];
		const UNIVERSAL_REASONING_EFFORTS = {
			off: null,
			minimal: "minimal",
			low: "low",
			medium: "medium",
			high: "high",
			xhigh: "xhigh",
			max: "max"
		};
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
		function nextProviderCopyId(sourceId, existingIds) {
			const base = `${sourceId || "provider"}-copy`;
			const existing = new Set(existingIds);
			if (!existing.has(base)) return base;
			let suffix = 2;
			while (existing.has(`${base}-${suffix}`)) suffix += 1;
			return `${base}-${suffix}`;
		}
		function stringField(value, key) {
			return typeof value[key] === "string" ? value[key] : "";
		}
		function modelRecords(profile) {
			if (!Array.isArray(profile.models)) return [];
			return profile.models.filter(isRecord).map((model) => structuredClone(model));
		}
		function duplicateModelTemplate(model) {
			const next = structuredClone(model);
			delete next.id;
			delete next.name;
			return next;
		}
		function duplicateModelIds(models) {
			const counts = /* @__PURE__ */ new Map();
			for (const model of models) {
				const id = typeof model.id === "string" ? model.id.trim() : "";
				if (id !== "") counts.set(id, (counts.get(id) ?? 0) + 1);
			}
			return [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id);
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
		function inputMode(source, key = "input") {
			const input = Array.isArray(source[key]) ? source[key] : [];
			const text = input.includes("text");
			const image = input.includes("image");
			if (text && image) return "text-image";
			if (text) return "text";
			if (image) return "image";
			return "inherit";
		}
		function setInputMode(source, mode, key = "input") {
			const next = structuredClone(source);
			if (mode === "inherit") delete next[key];
			else if (mode === "text") next[key] = ["text"];
			else if (mode === "image") next[key] = ["image"];
			else next[key] = ["text", "image"];
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
		function reasoningEffortsValue(source) {
			if (source.reasoningEfforts === false) return false;
			if (!isRecord(source.reasoningEfforts)) return void 0;
			const efforts = {};
			for (const level of REASONING_LEVELS) {
				const value = source.reasoningEfforts[level];
				if (value === null || typeof value === "string") efforts[level] = value;
			}
			return efforts;
		}
		function setReasoningMode(source, mode) {
			const next = structuredClone(source);
			if (mode === "inherit") delete next.reasoningEfforts;
			else if (mode === "disabled") next.reasoningEfforts = false;
			else next.reasoningEfforts = structuredClone(UNIVERSAL_REASONING_EFFORTS);
			return next;
		}
		function setReasoningEffort(source, level, enabled, wireValue) {
			const next = structuredClone(source);
			const current = reasoningEffortsValue(next);
			const efforts = current === void 0 || current === false ? {} : structuredClone(current);
			if (!enabled) delete efforts[level];
			else if (level === "off") efforts.off = wireValue?.trim() || null;
			else efforts[level] = wireValue?.trim() || level;
			if (!REASONING_LEVELS.some((candidate) => candidate !== "off" && Object.hasOwn(efforts, candidate))) delete next.reasoningEfforts;
			else next.reasoningEfforts = efforts;
			return next;
		}
		/** Add selectable reasoning levels and provider-aware dispatch defaults without replacing manual compatibility values. */
		function applyUniversalReasoningDefaults(providerId, profile, model) {
			return applyReasoningDispatchDefaults(providerId, profile, setReasoningMode(model, "all"));
		}
		/** Add provider-aware reasoning dispatch compatibility without changing the model's offered levels. */
		function applyReasoningDispatchDefaults(providerId, profile, model) {
			let next = structuredClone(model);
			const protocol = stringField(profile, "api");
			if (protocol !== "openai-completions") return next;
			const explicitFormat = compatValue(next, "thinkingFormat");
			const format = typeof explicitFormat === "string" ? explicitFormat : inferThinkingFormat(providerId, profile, next);
			if (format !== void 0) next = setCompatDefault(next, "thinkingFormat", format);
			if (format === "qwen" || format === "qwen-chat-template" || format === "chat-template") next = setCompatDefault(next, "supportsReasoningEffort", false);
			else if (format !== "openrouter" && format !== "ant-ling" && format !== "string-thinking") next = setCompatDefault(next, "supportsReasoningEffort", true);
			return applyReasoningCompatibilityDefaults(protocol, next).model;
		}
		/** Add universal reasoning controls to every explicitly declared model or override on one route. */
		function applyUniversalReasoningToProvider(providerId, profile) {
			const next = structuredClone(profile);
			let changed = 0;
			const models = modelRecords(next).map((model) => {
				const updated = applyUniversalReasoningDefaults(providerId, next, model);
				if (JSON.stringify(updated) !== JSON.stringify(model)) changed += 1;
				return updated;
			});
			if (models.length > 0) next.models = models;
			if (isRecord(next.modelOverrides)) next.modelOverrides = Object.fromEntries(Object.entries(next.modelOverrides).map(([modelId, value]) => {
				if (!isRecord(value)) return [modelId, value];
				const updated = applyUniversalReasoningDefaults(providerId, next, {
					id: modelId,
					...value
				});
				delete updated.id;
				if (JSON.stringify(updated) !== JSON.stringify(value)) changed += 1;
				return [modelId, updated];
			}));
			return {
				profile: next,
				changed
			};
		}
		/** Ensure one selectable model has all reasoning levels, using modelOverrides for inherited catalogs. */
		function ensureModelReasoning(providerId, profile, modelId) {
			const next = structuredClone(profile);
			const models = modelRecords(next);
			const position = models.findIndex((model) => model.id === modelId);
			if (position >= 0) {
				const current = models[position] ?? {};
				const updated = applyUniversalReasoningDefaults(providerId, next, current);
				if (JSON.stringify(updated) === JSON.stringify(current)) return {
					profile: next,
					changed: false
				};
				models[position] = updated;
				next.models = models;
				return {
					profile: next,
					changed: true
				};
			}
			const overrides = isRecord(next.modelOverrides) ? structuredClone(next.modelOverrides) : {};
			const current = isRecord(overrides[modelId]) ? structuredClone(overrides[modelId]) : {};
			const updated = applyUniversalReasoningDefaults(providerId, next, {
				id: modelId,
				...current
			});
			delete updated.id;
			if (JSON.stringify(updated) === JSON.stringify(current)) return {
				profile: next,
				changed: false
			};
			overrides[modelId] = updated;
			next.modelOverrides = overrides;
			return {
				profile: next,
				changed: true
			};
		}
		function inferThinkingFormat(providerId, profile, model) {
			const identity = `${providerId} ${stringField(profile, "baseURL")} ${stringField(model, "id")} ${stringField(model, "name")}`.toLocaleLowerCase();
			if (identity.includes("openrouter")) return "openrouter";
			if (identity.includes("deepseek")) return "deepseek";
			if (identity.includes("qwen")) return "qwen";
			if (identity.includes("zhipu") || identity.includes("bigmodel") || /\bglm[-_\s]/u.test(identity)) return "zai";
			if (identity.includes("together")) return "together";
		}
		function setCompatDefault(source, key, value) {
			return compatValue(source, key) === void 0 ? setCompatField(source, key, value) : structuredClone(source);
		}
		/**
		* Add the replay fields required by DeepSeek reasoning models behind custom
		* OpenAI-compatible gateways. Explicit compatibility values always win.
		*/
		function applyReasoningCompatibilityDefaults(protocol, model) {
			const next = structuredClone(model);
			if (protocol !== "openai-completions") return {
				model: next,
				changed: false
			};
			const compat = isRecord(next.compat) ? structuredClone(next.compat) : {};
			const explicitThinkingFormat = typeof compat.thinkingFormat === "string" ? compat.thinkingFormat : void 0;
			if (explicitThinkingFormat !== void 0 && explicitThinkingFormat !== "deepseek") return {
				model: next,
				changed: false
			};
			const identity = [next.id, next.name].filter((value) => typeof value === "string").join(" ").toLocaleLowerCase();
			const isDeepSeekDialect = explicitThinkingFormat === "deepseek" || compat.requiresReasoningContentOnAssistantMessages === true || identity.includes("deepseek");
			if (!isDeepSeekDialect) return {
				model: next,
				changed: false
			};
			let changed = false;
			if (isDeepSeekDialect && compat.thinkingFormat === void 0) {
				compat.thinkingFormat = "deepseek";
				changed = true;
			}
			if (compat.requiresReasoningContentOnAssistantMessages === void 0) {
				compat.requiresReasoningContentOnAssistantMessages = true;
				changed = true;
			}
			if (compat.supportsDeveloperRole === void 0) {
				compat.supportsDeveloperRole = false;
				changed = true;
			}
			if (changed) next.compat = compat;
			return {
				model: next,
				changed
			};
		}
		/** Repair all eligible models in a provider profile without changing manual values. */
		function repairProviderCompatibility(profile, modelId) {
			const next = structuredClone(profile);
			const protocol = stringField(next, "api");
			const sourceModels = modelRecords(next);
			const repairedModels = [];
			const models = sourceModels.map((model) => {
				if (modelId !== void 0 && model.id !== modelId) return structuredClone(model);
				const result = applyReasoningCompatibilityDefaults(protocol, model);
				if (result.changed) repairedModels.push(typeof model.id === "string" && model.id.trim() !== "" ? model.id.trim() : "unknown model");
				return result.model;
			});
			if (repairedModels.length > 0) next.models = models;
			return {
				profile: next,
				changed: repairedModels.length > 0,
				repairedModels
			};
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
						...candidate.maxTokens === void 0 ? {} : { maxTokens: candidate.maxTokens },
						...candidate.input === void 0 ? {} : { input: [...candidate.input] }
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
				if (candidate.input !== void 0 && (!Array.isArray(current.input) || current.input.length === 0)) {
					current.input = [...candidate.input];
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
		/** Merge discovered endpoint metadata and immediately fill remaining known capabilities from presets. */
		function mergeDiscoveredModelsWithPresets(models, discovered, presets) {
			const merged = mergeDiscoveredModels(models, discovered);
			const presetResult = applyMissingPresets(merged.models, presets);
			return {
				...merged,
				models: presetResult.models,
				presetsApplied: presetResult.applied
			};
		}
		/** Import only the selected live OpenRouter :free variants without removing any existing model. */
		function importSelectedOpenRouterFreeModels(models, liveModels, selectedIds) {
			const selected = new Set(selectedIds);
			return mergeDiscoveredModels(models, liveModels.filter((model) => selected.has(model.id)));
		}
		//#endregion
		//#region src/client/ConfigPanel.tsx
		const SETTINGS_NAMESPACE$1 = "llm-pi-ai";
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
		function messageOf$1(error) {
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
		function draftSignature(providerId, draft) {
			return JSON.stringify({
				providerId,
				draft
			});
		}
		function apiKeyValidationLabel(status) {
			switch (status) {
				case "valid": return "config.apiKeyValidationValid";
				case "invalid": return "config.apiKeyValidationInvalid";
				case "blocked": return "config.apiKeyValidationBlocked";
				case "unavailable": return "config.apiKeyValidationUnavailable";
				case "unknown": return "config.apiKeyValidationUnknown";
				case "missing": return "config.apiKeyValidationMissing";
			}
		}
		function firstConfiguredModelId(profile) {
			const declared = modelRecords(profile).find((model) => typeof model.id === "string" && model.id.trim() !== "");
			if (typeof declared?.id === "string") return declared.id.trim();
			return (isRecord(profile.modelOverrides) ? Object.keys(profile.modelOverrides) : []).find((id) => id.trim() !== "")?.trim() ?? "";
		}
		function isOpenRouterProfile(providerId, profile) {
			if (providerId.toLocaleLowerCase().includes("openrouter")) return true;
			try {
				const hostname = new URL(stringField(profile, "baseURL")).hostname.toLocaleLowerCase();
				return hostname === "openrouter.ai" || hostname.endsWith(".openrouter.ai");
			} catch {
				return false;
			}
		}
		function ConfigPanel({ api, isLoopback, t }) {
			const [namespace, setNamespace] = (0, react.useState)(null);
			const [providerId, setProviderId] = (0, react.useState)("");
			const [creating, setCreating] = (0, react.useState)(false);
			const [draft, setDraft] = (0, react.useState)({
				api: "openai-completions",
				models: []
			});
			const [baselineSignature, setBaselineSignature] = (0, react.useState)("");
			const [previousProviderId, setPreviousProviderId] = (0, react.useState)("");
			const [modelQuery, setModelQuery] = (0, react.useState)("");
			const [credential, setCredential] = (0, react.useState)(null);
			const [keyDraft, setKeyDraft] = (0, react.useState)("");
			const [keyVisible, setKeyVisible] = (0, react.useState)(false);
			const [registry, setRegistry] = (0, react.useState)(BUNDLED_PRESET_REGISTRY);
			const [presetState, setPresetState] = (0, react.useState)("bundled");
			const [manualPresets, setManualPresets] = (0, react.useState)({});
			const [protocolResults, setProtocolResults] = (0, react.useState)(null);
			const [protocolTestModelId, setProtocolTestModelId] = (0, react.useState)("");
			const [apiKeyValidation, setApiKeyValidation] = (0, react.useState)(null);
			const [batchApiKeyValidation, setBatchApiKeyValidation] = (0, react.useState)(null);
			const [openRouterFreeCatalog, setOpenRouterFreeCatalog] = (0, react.useState)(null);
			const [openRouterFreeSelection, setOpenRouterFreeSelection] = (0, react.useState)([]);
			const [openRouterFreeQuery, setOpenRouterFreeQuery] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)("load");
			const [error, setError] = (0, react.useState)(null);
			const [feedback, setFeedback] = (0, react.useState)(null);
			const profiles = (0, react.useMemo)(() => namespace === null ? {} : providerProfiles(namespace.user ?? namespace.value), [namespace]);
			const providerIds = (0, react.useMemo)(() => Object.keys(profiles).sort((left, right) => left.localeCompare(right)), [profiles]);
			const models = (0, react.useMemo)(() => modelRecords(draft), [draft]);
			const compatibilityRepair = (0, react.useMemo)(() => repairProviderCompatibility(draft), [draft]);
			const visibleModels = (0, react.useMemo)(() => {
				const query = modelQuery.trim().toLocaleLowerCase();
				return models.map((model, index) => ({
					model,
					index
				})).filter(({ model }) => query === "" || [model.id, model.name].some((value) => typeof value === "string" && value.toLocaleLowerCase().includes(query)));
			}, [modelQuery, models]);
			const protocol = stringField(draft, "api");
			const protocolTestModel = models.find((model) => model.id === protocolTestModelId) ?? models.find((model) => typeof model.id === "string" && model.id.trim() !== "");
			const protocolTestModelValue = typeof protocolTestModel?.id === "string" ? protocolTestModel.id : "";
			const hasApiKey = keyDraft.trim() !== "" || credential?.configured === true;
			const recommendedProtocol = protocolResults?.filter((result) => result.available).length === 1 ? protocolResults.find((result) => result.available)?.protocol : void 0;
			const credentialRef = stringField(draft, "apiKeyEnv") || deriveCredentialRef(providerId || "provider");
			const dirty = baselineSignature !== "" && (draftSignature(providerId, draft) !== baselineSignature || keyDraft !== "");
			const batchProblemCount = batchApiKeyValidation?.filter((result) => result.status !== "valid").length ?? 0;
			const openRouterProfile = isOpenRouterProfile(providerId, draft);
			const configuredModelIds = (0, react.useMemo)(() => new Set(models.flatMap((model) => typeof model.id === "string" ? [model.id] : [])), [models]);
			const visibleOpenRouterFreeModels = (0, react.useMemo)(() => {
				const query = openRouterFreeQuery.trim().toLocaleLowerCase();
				return (openRouterFreeCatalog?.models ?? []).filter((model) => query === "" || [model.id, model.name].some((value) => typeof value === "string" && value.toLocaleLowerCase().includes(query)));
			}, [openRouterFreeCatalog, openRouterFreeQuery]);
			const describeCredential = (0, react.useCallback)(async (ref) => {
				if (!CREDENTIAL_REF_PATTERN.test(ref)) {
					setCredential(null);
					return;
				}
				const response = await api.credentials.describe({ refs: [ref] });
				if (!response.result.ok) throw new Error(response.result.error.message);
				setCredential(response.result.value.credentials[ref] ?? null);
			}, [api.credentials]);
			const confirmDiscard = (0, react.useCallback)(() => !dirty || window.confirm(t("config.discardConfirm")), [dirty, t]);
			const openProvider = (0, react.useCallback)((id, view = namespace) => {
				if (view === null) return;
				const profile = cloneProfile(providerProfiles(view.user ?? view.value)[id]);
				const ref = stringField(profile, "apiKeyEnv") || deriveCredentialRef(id);
				setProviderId(id);
				setCreating(false);
				setDraft(profile);
				setBaselineSignature(draftSignature(id, profile));
				setPreviousProviderId(id);
				setModelQuery("");
				setKeyDraft("");
				setKeyVisible(false);
				setManualPresets({});
				setProtocolResults(null);
				setProtocolTestModelId("");
				setApiKeyValidation(null);
				setOpenRouterFreeCatalog(null);
				setOpenRouterFreeSelection([]);
				setOpenRouterFreeQuery("");
				setError(null);
				setFeedback(null);
				describeCredential(ref).catch((cause) => setError(messageOf$1(cause)));
			}, [describeCredential, namespace]);
			const selectProvider = (id) => {
				if (confirmDiscard()) openProvider(id);
			};
			const load = (0, react.useCallback)(async (force = false) => {
				if (!force && !confirmDiscard()) return;
				setBusy("load");
				setError(null);
				setBatchApiKeyValidation(null);
				try {
					const response = await api.settings.describe({});
					if (!response.result.ok) throw new Error(response.result.error.message);
					const view = response.result.value.namespaces.find((candidate) => candidate.ns === SETTINGS_NAMESPACE$1);
					if (view === void 0) throw new Error(t("config.namespaceMissing"));
					setNamespace(view);
					const ids = Object.keys(providerProfiles(view.user ?? view.value)).sort((left, right) => left.localeCompare(right));
					const selected = ids.includes(providerId) ? providerId : ids[0];
					if (selected !== void 0) openProvider(selected, view);
					else {
						const empty = {
							api: "openai-completions",
							models: []
						};
						setProviderId("");
						setCreating(true);
						setDraft(empty);
						setBaselineSignature(draftSignature("", empty));
						setPreviousProviderId("");
						setModelQuery("");
						setProtocolResults(null);
						setProtocolTestModelId("");
						setApiKeyValidation(null);
					}
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			}, [
				api.settings,
				confirmDiscard,
				openProvider,
				providerId,
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
				load(true);
			}, []);
			(0, react.useEffect)(() => {
				refreshPresets();
			}, [refreshPresets]);
			(0, react.useEffect)(() => {
				if (!dirty) return;
				const onBeforeUnload = (event) => {
					event.preventDefault();
					event.returnValue = "";
				};
				window.addEventListener("beforeunload", onBeforeUnload);
				return () => window.removeEventListener("beforeunload", onBeforeUnload);
			}, [dirty]);
			const startCreate = () => {
				if (!confirmDiscard()) return;
				const empty = {
					api: "openai-completions",
					models: []
				};
				setPreviousProviderId(creating ? previousProviderId : providerId);
				setCreating(true);
				setProviderId("");
				setDraft(empty);
				setBaselineSignature(draftSignature("", empty));
				setModelQuery("");
				setCredential(null);
				setKeyDraft("");
				setKeyVisible(false);
				setManualPresets({});
				setProtocolResults(null);
				setProtocolTestModelId("");
				setApiKeyValidation(null);
				setOpenRouterFreeCatalog(null);
				setOpenRouterFreeSelection([]);
				setOpenRouterFreeQuery("");
				setError(null);
				setFeedback(null);
			};
			const cancelCreate = () => {
				if (!confirmDiscard()) return;
				const target = providerIds.includes(previousProviderId) ? previousProviderId : providerIds[0];
				if (target !== void 0) openProvider(target);
			};
			const duplicateProvider = () => {
				const id = nextProviderCopyId(providerId, providerIds);
				const profile = structuredClone(draft);
				profile.apiKeyEnv = deriveCredentialRef(id);
				profile.displayName = t("config.copyName", { name: stringField(profile, "displayName") || providerId });
				setPreviousProviderId(providerId);
				setCreating(true);
				setProviderId(id);
				setDraft(profile);
				setModelQuery("");
				setCredential(null);
				setKeyDraft("");
				setKeyVisible(false);
				setManualPresets({});
				setProtocolResults(null);
				setApiKeyValidation(null);
				setOpenRouterFreeCatalog(null);
				setOpenRouterFreeSelection([]);
				setOpenRouterFreeQuery("");
				setError(null);
				setFeedback(t("config.copyReady"));
			};
			const updateProfileString = (key, value) => {
				setDraft((current) => setOptionalString(current, key, value));
				setProtocolResults(null);
				setApiKeyValidation(null);
				if (key === "apiKeyEnv") {
					setKeyDraft("");
					setKeyVisible(false);
					describeCredential(value.trim()).catch((cause) => setError(messageOf$1(cause)));
				}
			};
			const setModels = (next) => {
				setDraft((current) => ({
					...structuredClone(current),
					models: next
				}));
				setProtocolResults(null);
				setApiKeyValidation(null);
			};
			const updateModel = (index, next) => {
				setModels(models.map((model, position) => position === index ? next : model));
			};
			const addModel = () => {
				setModels([...models, { id: "" }]);
				setModelQuery("");
				setManualPresets((current) => ({
					...current,
					[models.length]: ""
				}));
			};
			const duplicateModel = (index) => {
				const template = duplicateModelTemplate(models[index] ?? {});
				setModels([
					...models.slice(0, index + 1),
					template,
					...models.slice(index + 1)
				]);
				setModelQuery("");
				setManualPresets({});
				setFeedback(t("config.modelCopyReady"));
			};
			const removeModel = (index) => {
				setModels(models.filter((_model, position) => position !== index));
				setManualPresets({});
			};
			const autoApplyPresets = () => {
				const result = applyMissingPresets(models, registry.presets);
				setModels(result.models.map((model) => model.reasoningEfforts === void 0 ? model : applyReasoningDispatchDefaults(providerId || "provider", draft, model)));
				setFeedback(t("config.presetsApplied", { count: result.applied }));
			};
			const applyPreset = (index, presetId) => {
				const preset = registry.presets.find((candidate) => candidate.id === presetId);
				if (preset === void 0) return;
				const updated = applyModelPreset(models[index] ?? {}, preset, true);
				updateModel(index, updated.reasoningEfforts === void 0 ? updated : applyReasoningDispatchDefaults(providerId || "provider", draft, updated));
				setManualPresets((current) => ({
					...current,
					[index]: preset.id
				}));
			};
			const applyCandidateMetadata = (nextModels) => {
				const presetResult = applyMissingPresets(nextModels, registry.presets);
				const prepared = presetResult.models.map((model) => model.reasoningEfforts === void 0 ? model : applyReasoningDispatchDefaults(providerId || "provider", draft, model));
				setModels(prepared);
				return presetResult.applied;
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
						settingsNs: SETTINGS_NAMESPACE$1,
						provider: id,
						baseURL,
						api: apiProtocol,
						...key === "" ? {} : { apiKey: key }
					});
					if (!response.result.ok) throw new Error(response.result.error.message);
					const result = mergeDiscoveredModelsWithPresets(models, response.result.value.models, registry.presets);
					const prepared = result.models.map((model) => model.reasoningEfforts === void 0 ? model : applyReasoningDispatchDefaults(providerId || "provider", draft, model));
					setModels(prepared);
					setFeedback(t("config.probeSuccessApplied", {
						count: response.result.value.models.length,
						added: result.added,
						enriched: result.enriched,
						presets: result.presetsApplied
					}));
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			};
			const scanOpenRouterFreeModels = async () => {
				if (busy !== null) return;
				setBusy("openrouter-free");
				setError(null);
				setFeedback(null);
				try {
					const catalog = await fetchOpenRouterFreeModels();
					setOpenRouterFreeCatalog(catalog);
					setOpenRouterFreeSelection([]);
					setOpenRouterFreeQuery("");
					setFeedback(t("config.openRouterFreeScanned", {
						count: catalog.models.length,
						unconfigured: catalog.models.filter((model) => !configuredModelIds.has(model.id)).length
					}));
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			};
			const toggleOpenRouterFreeModel = (modelId) => {
				setOpenRouterFreeSelection((current) => current.includes(modelId) ? current.filter((id) => id !== modelId) : [...current, modelId]);
			};
			const selectVisibleOpenRouterFreeModels = () => {
				const visibleIds = new Set(visibleOpenRouterFreeModels.map((model) => model.id));
				setOpenRouterFreeSelection((current) => [.../* @__PURE__ */ new Set([...current, ...visibleIds])]);
			};
			const selectUnconfiguredOpenRouterFreeModels = () => {
				setOpenRouterFreeSelection((openRouterFreeCatalog?.models ?? []).filter((model) => !configuredModelIds.has(model.id)).map((model) => model.id));
			};
			const importOpenRouterFreeModels = () => {
				if (openRouterFreeCatalog === null || openRouterFreeSelection.length === 0) return;
				const result = importSelectedOpenRouterFreeModels(models, openRouterFreeCatalog.models, openRouterFreeSelection);
				const presets = applyCandidateMetadata(result.models);
				setFeedback(t("config.openRouterFreeImported", {
					selected: openRouterFreeSelection.length,
					added: result.added,
					enriched: result.enriched,
					presets
				}));
				setOpenRouterFreeSelection([]);
			};
			const enableReasoningForProvider = () => {
				const result = applyUniversalReasoningToProvider(providerId || "provider", draft);
				setDraft(result.profile);
				setProtocolResults(null);
				setApiKeyValidation(null);
				setFeedback(t("config.reasoningProviderApplied", { count: result.changed }));
			};
			const enableReasoningForModel = (index) => {
				updateModel(index, applyUniversalReasoningDefaults(providerId || "provider", draft, models[index] ?? {}));
				setFeedback(t("config.reasoningModelApplied"));
			};
			const probeProtocols = async () => {
				if (busy !== null) return;
				const model = protocolTestModel?.id;
				if (typeof model !== "string" || model.trim() === "") {
					setError(t("config.protocolProbeModelRequired"));
					return;
				}
				if (!window.confirm(t("config.protocolProbeConfirm", { model: model.trim() }))) return;
				setBusy("protocol-probe");
				setError(null);
				setFeedback(null);
				try {
					const results = await probeProviderProtocols({
						baseURL: stringField(draft, "baseURL").trim(),
						credentialRef,
						model: model.trim(),
						...keyDraft.trim() === "" ? {} : { apiKey: keyDraft.trim() }
					});
					setProtocolResults(results);
					const available = results.filter((result) => result.available);
					setFeedback(t(available.length === 0 ? "config.protocolProbeNone" : available.length === 1 ? "config.protocolProbeOne" : "config.protocolProbeBoth", { protocol: available[0]?.protocol ?? "" }));
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			};
			const applyRecommendedProtocol = () => {
				if (recommendedProtocol === void 0) return;
				updateProfileString("api", recommendedProtocol);
				setFeedback(t("config.protocolApplied", { protocol: recommendedProtocol }));
			};
			const chooseProtocolTestModel = (modelId) => {
				setProtocolTestModelId(modelId);
				setProtocolResults(null);
				setApiKeyValidation(null);
			};
			const validateApiKey = async () => {
				if (busy !== null) return;
				const baseURL = stringField(draft, "baseURL").trim();
				const apiProtocol = stringField(draft, "api").trim();
				if (baseURL === "") {
					setError(t("config.baseUrlRequired"));
					return;
				}
				if (!PROTOCOLS.includes(apiProtocol)) {
					setError(t("config.protocolRequired"));
					return;
				}
				if (!hasApiKey) {
					setError(t("config.apiKeyValidationKeyRequired"));
					return;
				}
				if (protocolTestModelValue === "") {
					setError(t("config.protocolProbeModelRequired"));
					return;
				}
				if (!window.confirm(t("config.apiKeyValidationConfirm", { model: protocolTestModelValue }))) return;
				setBusy("api-key-validation");
				setError(null);
				setFeedback(null);
				try {
					const result = await validateProviderApiKey({
						baseURL,
						credentialRef,
						protocol: apiProtocol,
						...protocolTestModelValue === "" ? {} : { model: protocolTestModelValue },
						...keyDraft.trim() === "" ? {} : { apiKey: keyDraft.trim() }
					});
					setApiKeyValidation(result);
					setFeedback(t("config.apiKeyValidationDone"));
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			};
			const validateAllApiKeys = async () => {
				if (busy !== null || providerIds.length === 0) return;
				if (!window.confirm(t("config.apiKeyBatchConfirm", { count: providerIds.length }))) return;
				setBusy("api-key-batch");
				setError(null);
				setFeedback(null);
				try {
					const localResults = [];
					const requests = [];
					for (const id of providerIds) {
						const profile = profiles[id] ?? {};
						const displayName = stringField(profile, "displayName") || id;
						const baseURL = stringField(profile, "baseURL").trim();
						const apiProtocol = stringField(profile, "api");
						const ref = stringField(profile, "apiKeyEnv") || deriveCredentialRef(id);
						const model = firstConfiguredModelId(profile);
						let localMessage = "";
						if (baseURL === "") localMessage = t("config.apiKeyBatchNoBaseUrl");
						else try {
							new URL(baseURL);
						} catch {
							localMessage = t("config.apiKeyBatchInvalidBaseUrl");
						}
						if (!PROTOCOLS.includes(apiProtocol)) localMessage = t("config.apiKeyBatchInvalidProtocol");
						if (localMessage !== "") {
							localResults.push({
								provider: id,
								displayName,
								baseURL,
								credentialRef: ref,
								protocol: PROTOCOLS.includes(apiProtocol) ? apiProtocol : "openai-completions",
								model,
								status: "unknown",
								checkedBy: "request",
								message: localMessage
							});
							continue;
						}
						requests.push({
							provider: id,
							displayName,
							baseURL,
							credentialRef: ref,
							protocol: apiProtocol,
							model
						});
					}
					const remoteResults = requests.length === 0 ? [] : await validateProviderApiKeys({ providers: requests });
					const resultByProvider = new Map([...localResults, ...remoteResults].map((result) => [result.provider, result]));
					const ordered = providerIds.flatMap((id) => resultByProvider.get(id) ?? []);
					setBatchApiKeyValidation(ordered);
					const problems = ordered.filter((result) => result.status !== "valid").length;
					setFeedback(t(problems === 0 ? "config.apiKeyBatchAllValid" : "config.apiKeyBatchProblems", { count: problems }));
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
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
					setApiKeyValidation(null);
					setFeedback(t("config.revealSuccess"));
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			};
			const deleteProvider = async () => {
				if (namespace === null || creating || busy !== null || !confirmDiscard()) return;
				if (!window.confirm(t("config.deleteConfirm", { provider: providerId }))) return;
				setBusy("delete");
				setError(null);
				setFeedback(null);
				try {
					const response = await api.settings.mutate({
						ns: SETTINGS_NAMESPACE$1,
						ops: [{
							op: "unset",
							path: ["providers", providerId]
						}],
						expectedRevision: namespace.revision
					});
					if (!response.result.ok) throw new Error(response.result.error.message);
					setNamespace(response.result.value);
					const next = Object.keys(providerProfiles(response.result.value.user ?? response.result.value.value)).filter((id) => id !== providerId).sort((left, right) => left.localeCompare(right))[0];
					if (next === void 0) {
						const empty = {
							api: "openai-completions",
							models: []
						};
						setCreating(true);
						setProviderId("");
						setDraft(empty);
						setBaselineSignature(draftSignature("", empty));
						setPreviousProviderId("");
						setModelQuery("");
						setCredential(null);
						setKeyDraft("");
						setKeyVisible(false);
						setProtocolResults(null);
						setProtocolTestModelId("");
						setApiKeyValidation(null);
					} else openProvider(next, response.result.value);
					setFeedback(t("config.deleted"));
				} catch (cause) {
					setError(messageOf$1(cause));
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
					if (creating && profiles[id] !== void 0) throw new Error(t("config.providerExists"));
					if (!CREDENTIAL_REF_PATTERN.test(ref)) throw new Error(t("config.credentialRefInvalid"));
					if (stringField(draft, "baseURL").trim() === "") throw new Error(t("config.baseUrlRequired"));
					if (!PROTOCOLS.includes(stringField(draft, "api"))) throw new Error(t("config.protocolRequired"));
					if (models.length === 0 || models.some((model) => typeof model.id !== "string" || model.id.trim() === "")) throw new Error(t("config.modelIdRequired"));
					const duplicateIds = duplicateModelIds(models);
					if (duplicateIds.length > 0) throw new Error(t("config.modelIdDuplicate", { ids: duplicateIds.join(", ") }));
					const key = keyDraft.trim();
					if (key !== "" && !LEGAL_API_KEY.test(key)) throw new Error(t("config.keyInvalid"));
					const profile = structuredClone(draft);
					profile.apiKeyEnv = ref;
					profile.models = models.map((model) => ({
						...model,
						id: String(model.id).trim()
					}));
					const repaired = repairProviderCompatibility(profile);
					const savedProfile = repaired.profile;
					const response = await api.settings.mutate({
						ns: SETTINGS_NAMESPACE$1,
						ops: [{
							op: "set",
							path: ["providers", id],
							value: savedProfile
						}],
						expectedRevision: namespace.revision
					});
					if (!response.result.ok) throw new Error(response.result.error.message);
					setNamespace(response.result.value);
					setDraft(savedProfile);
					setBaselineSignature(draftSignature(id, savedProfile));
					setApiKeyValidation(null);
					if (key !== "") {
						const stored = await api.credentials.set({
							ref,
							value: key
						});
						if (!stored.result.ok) throw new Error(`${t("config.settingsSavedKeyFailed")}: ${stored.result.error.message}`);
					}
					setCreating(false);
					setPreviousProviderId(id);
					setKeyDraft("");
					setKeyVisible(false);
					await describeCredential(ref);
					setFeedback(repaired.changed ? t("config.savedWithCompatibilityRepair", { count: repaired.repairedModels.length }) : t("config.saved"));
				} catch (cause) {
					setError(messageOf$1(cause));
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
							children: [
								dirty && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dmp-config-dirty",
									children: t("config.unsaved")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: busy !== null || providerIds.length === 0,
									onClick: () => void validateAllApiKeys(),
									children: busy === "api-key-batch" ? t("config.apiKeyBatchRunning") : t("config.apiKeyBatch")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: busy !== null,
									onClick: () => void load(),
									children: t("config.reload")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: busy !== null,
									onClick: startCreate,
									children: t("config.addProvider")
								})
							]
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
					batchApiKeyValidation !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-config-batch-results",
						"aria-label": t("config.apiKeyBatchResults"),
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dmp-config-batch-heading",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("config.apiKeyBatchResults") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: batchProblemCount === 0 ? t("config.apiKeyBatchAllValid") : t("config.apiKeyBatchProblems", { count: batchProblemCount }) })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: busy !== null,
								onClick: () => setBatchApiKeyValidation(null),
								children: t("config.apiKeyBatchClose")
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dmp-config-batch-list",
							children: batchApiKeyValidation.map((result) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
								className: `is-${result.status}`,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: result.displayName }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
										result.provider,
										" · ",
										result.credentialRef,
										" · ",
										result.protocol,
										" · ",
										result.model
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: result.message })
								] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(apiKeyValidationLabel(result.status)) }),
									result.credentialSource !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: result.credentialSource }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: busy !== null,
										onClick: () => selectProvider(result.provider),
										children: t("config.apiKeyBatchEdit")
									})
								] })]
							}, result.provider))
						})]
					}),
					compatibilityRepair.changed && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dmp-config-compat-warning",
						role: "status",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("config.reasoningRepairTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.reasoningRepairDescription", {
							count: compatibilityRepair.repairedModels.length,
							models: compatibilityRepair.repairedModels.join(", ")
						}) })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: busy !== null,
							onClick: () => void save(),
							children: busy === "save" ? t("config.saving") : t("config.reasoningRepairApply")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-config-card",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-config-card-heading",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("config.providerTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("config.providerDescription") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dmp-config-provider-actions",
									children: [!creating && providerIds.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
											value: providerId,
											onChange: (event) => selectProvider(event.currentTarget.value),
											disabled: busy !== null,
											children: providerIds.map((id) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: id,
												children: stringField(profiles[id] ?? {}, "displayName") || id
											}, id))
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== null,
											onClick: duplicateProvider,
											children: t("config.duplicateProvider")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dmp-danger",
											disabled: busy !== null,
											onClick: () => void deleteProvider(),
											children: busy === "delete" ? t("config.deleting") : t("config.deleteProvider")
										})
									] }), creating && providerIds.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: busy !== null,
										onClick: cancelCreate,
										children: t("config.cancelCreate")
									})]
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
											onChange: (event) => {
												setProviderId(event.currentTarget.value.toLocaleLowerCase());
												setProtocolResults(null);
												setApiKeyValidation(null);
											},
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
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.providerDefaultInput") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
											value: inputMode(draft, "defaultInput"),
											disabled: readOnly,
											onChange: (event) => setDraft((current) => setInputMode(current, event.currentTarget.value, "defaultInput")),
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: "inherit",
													children: t("config.inputDshDefault")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: "text",
													children: t("config.inputText")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: "text-image",
													children: t("config.inputTextImage")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
													value: "image",
													children: t("config.inputImageOnly")
												})
											]
										})]
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
													onChange: (event) => {
														setKeyDraft(event.currentTarget.value);
														setProtocolResults(null);
														setApiKeyValidation(null);
													},
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
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-config-protocol-model",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.protocolProbeModel") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
											value: protocolTestModelValue,
											disabled: busy !== null || protocolTestModel === void 0,
											onChange: (event) => chooseProtocolTestModel(event.currentTarget.value),
											children: models.filter((model) => typeof model.id === "string" && model.id.trim() !== "").map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: model.id,
												children: model.id
											}, model.id))
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== null,
											onClick: () => void probe(),
											children: busy === "probe" ? t("config.probing") : t("config.probe")
										}),
										openRouterProfile && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== null,
											onClick: () => void scanOpenRouterFreeModels(),
											children: busy === "openrouter-free" ? t("config.openRouterFreeScanning") : t("config.openRouterFreeScan")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== null || !hasApiKey,
											onClick: () => void validateApiKey(),
											children: busy === "api-key-validation" ? t("config.apiKeyValidating") : t("config.validateApiKey")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== null || protocolTestModel === void 0,
											onClick: () => void probeProtocols(),
											children: busy === "protocol-probe" ? t("config.protocolProbing") : t("config.protocolProbe")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											className: "dmp-media-primary",
											type: "button",
											disabled: busy !== null || !dirty && !compatibilityRepair.changed,
											onClick: () => void save(),
											children: busy === "save" ? t("config.saving") : t("config.save")
										})
									] })
								]
							}),
							openRouterFreeCatalog !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: "dmp-config-free-picker",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dmp-config-free-picker-heading",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("config.openRouterFreePickerTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.openRouterFreePickerSummary", {
											count: openRouterFreeCatalog.models.length,
											selected: openRouterFreeSelection.length,
											checkedAt: new Date(openRouterFreeCatalog.checkedAt).toLocaleString()
										}) })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												setOpenRouterFreeCatalog(null);
												setOpenRouterFreeSelection([]);
												setOpenRouterFreeQuery("");
											},
											children: t("config.openRouterFreeClose")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dmp-config-free-picker-toolbar",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												value: openRouterFreeQuery,
												onChange: (event) => setOpenRouterFreeQuery(event.currentTarget.value),
												placeholder: t("config.openRouterFreeSearch")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: selectVisibleOpenRouterFreeModels,
												children: t("config.openRouterFreeSelectVisible")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: selectUnconfiguredOpenRouterFreeModels,
												children: t("config.openRouterFreeSelectNew")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: openRouterFreeSelection.length === 0,
												onClick: () => setOpenRouterFreeSelection([]),
												children: t("config.openRouterFreeClear")
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dmp-config-free-picker-list",
										children: [visibleOpenRouterFreeModels.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: openRouterFreeSelection.includes(model.id),
												onChange: () => toggleOpenRouterFreeModel(model.id)
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "dmp-config-free-picker-model",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: model.name ?? model.id }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: model.id })]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "dmp-config-free-picker-meta",
												children: [
													configuredModelIds.has(model.id) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("config.openRouterFreeConfigured") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("config.openRouterFreeContext", { value: model.contextWindow?.toLocaleString() ?? "?" }) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("config.openRouterFreeOutput", { value: model.maxTokens?.toLocaleString() ?? "?" }) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: model.input.join(" + ") })
												]
											})
										] }, model.id)), visibleOpenRouterFreeModels.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "dmp-config-empty",
											children: t("config.openRouterFreeEmpty")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dmp-config-free-picker-footer",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.openRouterFreeImportHint") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											className: "dmp-media-primary",
											type: "button",
											disabled: openRouterFreeSelection.length === 0,
											onClick: importOpenRouterFreeModels,
											children: t("config.openRouterFreeImportSelected", { count: openRouterFreeSelection.length })
										})]
									})
								]
							}),
							protocolResults !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-config-protocol-results",
								children: [protocolResults.map((result) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: result.available ? "is-ok" : "is-error",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: result.protocol }), result.available ? t("config.protocolAvailable") : t("config.protocolUnavailable", { error: result.error ?? "?" })]
								}, result.protocol)), recommendedProtocol !== void 0 && recommendedProtocol !== protocol && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: busy !== null,
									onClick: applyRecommendedProtocol,
									children: t("config.protocolApplyRecommended", { protocol: recommendedProtocol })
								})]
							}),
							apiKeyValidation !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: `dmp-config-key-validation is-${apiKeyValidation.status}`,
								role: "status",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: apiKeyValidation.credentialTarget === "runtime" ? t("config.apiKeyValidationRuntimeTarget", { source: apiKeyValidation.credentialSource ?? "?" }) : t("config.apiKeyValidationDraftTarget") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(apiKeyValidationLabel(apiKeyValidation.status)) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: apiKeyValidation.message }),
									apiKeyValidation.runtimeConfigured === false && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.apiKeyValidationDraftOnly") }),
									apiKeyValidation.runtimeMatchesDraft === false && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.apiKeyValidationMismatch") }),
									apiKeyValidation.draft !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [
										t("config.apiKeyValidationDraftResult"),
										": ",
										t(apiKeyValidationLabel(apiKeyValidation.draft.status))
									] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: apiKeyValidation.draft.message })] }),
									apiKeyValidation.status === "valid" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.apiKeyValidationScope") })
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
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "dmp-config-model-search",
											value: modelQuery,
											onChange: (event) => setModelQuery(event.currentTarget.value),
											placeholder: t("config.searchModels"),
											"aria-label": t("config.searchModels")
										}),
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
											disabled: busy !== null || models.length === 0,
											onClick: enableReasoningForProvider,
											children: t("config.reasoningProviderEnable")
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
							models.length > 0 && visibleModels.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dmp-config-empty",
								children: t("config.noMatchingModels")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dmp-config-models",
								children: visibleModels.map(({ model, index }) => {
									const automatic = sourcePreset(model, registry.presets);
									const selectedPresetId = manualPresets[index] ?? automatic?.id ?? "";
									const selectedPreset = registry.presets.find((preset) => preset.id === selectedPresetId);
									const modelInputMode = inputMode(model);
									const reasoningEfforts = reasoningEffortsValue(model);
									const reasoningMode = reasoningEfforts === void 0 ? "inherit" : reasoningEfforts === false ? "disabled" : "custom";
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
										className: "dmp-config-model",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: "dmp-config-model-top",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dmp-config-model-title",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: typeof model.name === "string" && model.name !== "" ? model.name : typeof model.id === "string" && model.id !== "" ? model.id : `${t("config.model")} ${index + 1}` }), openRouterProfile && typeof model.id === "string" && model.id.toLocaleLowerCase().endsWith(":free") && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("config.freeModelBadge") })]
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													disabled: busy !== null,
													onClick: () => duplicateModel(index),
													children: t("config.duplicateModel")
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: "dmp-danger",
													disabled: busy !== null,
													onClick: () => removeModel(index),
													children: t("config.remove")
												})] })]
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
																	setError(messageOf$1(cause));
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
																	setError(messageOf$1(cause));
																}
															},
															placeholder: "32768"
														})]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
														className: "dmp-media-field",
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.inputTypes") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
															value: modelInputMode,
															disabled: readOnly,
															onChange: (event) => updateModel(index, setInputMode(model, event.currentTarget.value)),
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																	value: "inherit",
																	children: t("config.inputInherit")
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																	value: "text",
																	children: t("config.inputText")
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																	value: "text-image",
																	children: t("config.inputTextImage")
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																	value: "image",
																	children: t("config.inputImageOnly")
																})
															]
														})]
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
															}),
															selectedPreset !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: [selectedPreset.input?.join(" + "), selectedPreset.reasoningEfforts === void 0 ? void 0 : t("config.presetReasoningLevels", { count: Object.keys(selectedPreset.reasoningEfforts).length })].filter(Boolean).join(" · ") })
														]
													})
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
												className: "dmp-config-reasoning",
												open: reasoningMode === "custom",
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("config.reasoningTitle") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: "dmp-config-reasoning-toolbar",
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
																className: "dmp-media-field",
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.reasoningMode") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
																	value: reasoningMode,
																	disabled: readOnly,
																	onChange: (event) => {
																		const mode = event.currentTarget.value;
																		if (mode === "inherit" || mode === "disabled") updateModel(index, setReasoningMode(model, mode));
																		else enableReasoningForModel(index);
																	},
																	children: [
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																			value: "inherit",
																			children: t("config.reasoningInherit")
																		}),
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																			value: "disabled",
																			children: t("config.reasoningDisabled")
																		}),
																		/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																			value: "custom",
																			children: t("config.reasoningAll")
																		})
																	]
																})]
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
																type: "button",
																disabled: readOnly,
																onClick: () => enableReasoningForModel(index),
																children: t("config.reasoningEnableAll")
															}),
															/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("config.reasoningDescription") })
														]
													}),
													reasoningEfforts !== void 0 && reasoningEfforts !== false && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														className: "dmp-config-reasoning-grid",
														children: REASONING_LEVELS.map((level) => {
															const enabled = Object.hasOwn(reasoningEfforts, level);
															const wireValue = reasoningEfforts[level];
															return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																	type: "checkbox",
																	checked: enabled,
																	disabled: readOnly,
																	onChange: (event) => updateModel(index, setReasoningEffort(model, level, event.currentTarget.checked))
																}),
																" ",
																level
															] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																value: wireValue ?? "",
																disabled: readOnly || !enabled,
																onChange: (event) => updateModel(index, setReasoningEffort(model, level, true, event.currentTarget.value)),
																placeholder: level === "off" ? t("config.reasoningOffWire") : level,
																"aria-label": t("config.reasoningWireValue", { level })
															})] }, level);
														})
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
		//#region src/client/RelayPanel.tsx
		const BAI_RELAY_BASE_PATH = "/model-palette/api/bai-relay/v1";
		const BAI_RELAY_PLUGIN_CONFIG = `- id: dsh-model-palette
  config:
    baiRelay:
      enabled: true
      timeoutMs: 180000
      upstreamHost: a18ccd091ab831ac3.awsglobalaccelerator.com
      hostHeader: api.b.ai`;
		const GENERIC_RELAY_CONFIG = `- id: dsh-model-palette
  config:
    providerRelays:
      example-provider:
        upstreamHost: reachable-entry.example.net
        hostHeader: api.provider.example
        tlsServerName: reachable-entry.example.net
        certificateHost: api.provider.example
        allowedPathPrefix: /v1/
        timeoutMs: 180000`;
		/** Render the built-in fixed-destination relay instructions and copyable templates. */
		function RelayPanel({ onOpenConfig, t }) {
			const [copied, setCopied] = (0, react.useState)(null);
			const origin = loopbackOrigin();
			const baiBaseURL = `${origin}${BAI_RELAY_BASE_PATH}`;
			const genericBaseURL = `${origin}/model-palette/api/relay/example-provider/v1`;
			const baiProviderConfig = `llm-pi-ai:
  providers:
    your-bai-provider:
      api: openai-responses
      apiKeyEnv: BAI_API_KEY
      baseURL: ${baiBaseURL}
      models:
        - id: deepseek-v4-flash`;
			const copy = async (label, value) => {
				try {
					await navigator.clipboard.writeText(value);
					setCopied(label);
					window.setTimeout(() => setCopied((current) => current === label ? null : current), 1800);
				} catch {
					setCopied(null);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("main", {
				className: "dmp-relay",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-relay-intro",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("relay.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("relay.intro") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dmp-relay-status",
							children: t("relay.builtIn")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-relay-card dmp-relay-flow",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-relay-card-heading",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dmp-relay-icon",
									"aria-hidden": "true",
									children: "↗"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("relay.howTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("relay.howDescription") })] })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-relay-route",
								"aria-label": t("relay.routeAria"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("relay.routeDsh") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", {
										"aria-hidden": "true",
										children: "→"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("relay.routeLocal") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("b", {
										"aria-hidden": "true",
										children: "→"
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("relay.routeProvider") })
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dmp-relay-note",
								children: t("relay.security")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-relay-card",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-relay-card-heading",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dmp-relay-icon",
									"aria-hidden": "true",
									children: "B"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("relay.baiTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("relay.baiDescription") })] })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
								className: "dmp-relay-details",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("relay.localBaseUrl") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: baiBaseURL }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => void copy("url", baiBaseURL),
										children: copied === "url" ? t("relay.copied") : t("relay.copy")
									})] })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("relay.upstream") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "a18ccd091ab831ac3.awsglobalaccelerator.com" }) })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("relay.hostHeader") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "api.b.ai" }) })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("relay.allowedPath") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "/v1/*" }) })] })
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dmp-relay-note",
								children: t("relay.statusHint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-relay-actions",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void copy("provider", baiProviderConfig),
									children: copied === "provider" ? t("relay.copied") : t("relay.copyProvider")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: "dmp-relay-primary",
									type: "button",
									onClick: onOpenConfig,
									children: t("relay.openModelConfig")
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-relay-card",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-relay-card-heading",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dmp-relay-icon",
									"aria-hidden": "true",
									children: "⚙"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("relay.pluginConfigTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("relay.pluginConfigDescription") })] })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
								className: "dmp-relay-code",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: BAI_RELAY_PLUGIN_CONFIG })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dmp-relay-copy-code",
								onClick: () => void copy("plugin", BAI_RELAY_PLUGIN_CONFIG),
								children: copied === "plugin" ? t("relay.copied") : t("relay.copyPluginConfig")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-relay-card dmp-relay-expand",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-relay-card-heading",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dmp-relay-icon",
									"aria-hidden": "true",
									children: "+"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("relay.extendTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("relay.extendDescription") })] })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("ol", { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t("relay.extendStepOne") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t("relay.extendStepTwo") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t("relay.extendStepThree") })
							] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
								className: "dmp-relay-code",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: GENERIC_RELAY_CONFIG })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
								className: "dmp-relay-base-example",
								children: [
									t("relay.genericBaseUrl"),
									" ",
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: genericBaseURL })
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-relay-actions",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void copy("generic-url", genericBaseURL),
									children: copied === "generic-url" ? t("relay.copied") : t("relay.copyGenericBaseUrl")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void copy("generic", GENERIC_RELAY_CONFIG),
									children: copied === "generic" ? t("relay.copied") : t("relay.copyGenericConfig")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dmp-relay-warning",
								children: t("relay.extendWarning")
							})
						]
					})
				]
			});
		}
		function loopbackOrigin() {
			if (typeof window === "undefined") return "http://127.0.0.1:3080";
			const location = new URL(window.location.href);
			location.hostname = "127.0.0.1";
			return location.origin;
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
			const quickFilter = options.quickFilter ?? "all";
			const currentKey = options.current === null ? null : choiceKey(options.current.provider, options.current.model);
			return choices.filter((choice) => options.providerId === null || choice.provider.id === options.providerId).filter((choice) => quickFilter === "all" || quickFilter === "favorites" && favoriteRank.has(choice.key) || quickFilter === "recents" && recentRank.has(choice.key)).map((choice) => ({
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
		//#region src/client/selection-compatibility.ts
		const SETTINGS_NAMESPACE = "llm-pi-ai";
		/** Whether a catalog choice may need DeepSeek replay compatibility on a custom route. */
		function mayNeedReasoningCompatibility(providerId, modelId, modelName) {
			if (providerId === "deepseek") return false;
			return `${modelId} ${modelName}`.toLocaleLowerCase().includes("deepseek");
		}
		/**
		* Repair the selected user-configured model before DSH switches to it.
		* Static or inherited routes remain untouched.
		*/
		async function ensureSelectionCompatibility(api, providerId, modelId) {
			const described = await api.settings.describe({});
			if (!described.result.ok) throw new Error(described.result.error.message);
			const namespace = described.result.value.namespaces.find((candidate) => candidate.ns === SETTINGS_NAMESPACE);
			if (namespace === void 0) return [];
			const profile = providerProfiles(namespace.user ?? namespace.value)[providerId];
			if (profile === void 0) return [];
			const repaired = repairProviderCompatibility(profile, modelId);
			if (!repaired.changed) return [];
			const mutation = await api.settings.mutate({
				ns: SETTINGS_NAMESPACE,
				ops: [{
					op: "set",
					path: ["providers", providerId],
					value: repaired.profile
				}],
				expectedRevision: namespace.revision
			});
			if (!mutation.result.ok) throw new Error(mutation.result.error.message);
			return repaired.repairedModels;
		}
		/** Ensure a selected model exposes every DSH reasoning level before submitting that level. */
		async function ensureSelectionReasoning(api, providerId, modelId) {
			const described = await api.settings.describe({});
			if (!described.result.ok) throw new Error(described.result.error.message);
			const namespace = described.result.value.namespaces.find((candidate) => candidate.ns === SETTINGS_NAMESPACE);
			if (namespace === void 0) throw new Error("The llm-pi-ai settings namespace is not loaded");
			const userProfiles = providerProfiles(namespace.user);
			const effectiveProfiles = providerProfiles(namespace.value);
			const profile = userProfiles[providerId] ?? effectiveProfiles[providerId];
			if (profile === void 0) throw new Error(`Provider ${providerId} is not configurable through llm-pi-ai`);
			const updated = ensureModelReasoning(providerId, profile, modelId);
			if (!updated.changed) return false;
			const mutation = await api.settings.mutate({
				ns: SETTINGS_NAMESPACE,
				ops: [{
					op: "set",
					path: ["providers", providerId],
					value: updated.profile
				}],
				expectedRevision: namespace.revision
			});
			if (!mutation.result.ok) throw new Error(mutation.result.error.message);
			return true;
		}
		//#endregion
		//#region src/client/skin-v2.ts
		/** Stable Skin Center v2 bridge for opening the model palette from a skin. */
		const MODEL_PALETTE_PLUGIN_ID = "dsh-model-palette";
		const MODEL_PALETTE_OPEN_EVENT = "dsh-model-palette:open";
		const MODEL_PALETTE_READY_EVENT = "dsh-model-palette:ready";
		const MODEL_PALETTE_GLOBAL_KEY = "__DSH_MODEL_PALETTE__";
		const MODEL_PALETTE_BRIDGE_KEY = "__dshModelPaletteBridge";
		function normalizeView(value) {
			return value === "media" || value === "config" || value === "relay" || value === "models" ? value : "models";
		}
		function eventView(event) {
			const detail = event.detail;
			if (typeof detail !== "object" || detail === null) return "models";
			return normalizeView(detail.view);
		}
		/**
		* Install the page-level bridge consumed by Skin Center v2 hooks.
		* Requests are routed to the newest usable palette instance and retained when
		* the composer has not mounted yet or its current instance is unavailable.
		* @param target - Browser window or an EventTarget-compatible test target.
		* @returns The installed bridge and its lifecycle disposer.
		*/
		function installModelPaletteSkinBridge(target) {
			const previous = target[MODEL_PALETTE_GLOBAL_KEY];
			const previousBridge = previous?.id === "dsh-model-palette" ? previous[MODEL_PALETTE_BRIDGE_KEY] : void 0;
			if (typeof previousBridge?.dispose === "function") previousBridge.dispose();
			const launchers = [];
			const restored = target[MODEL_PALETTE_GLOBAL_KEY];
			const restorable = restored?.id === "dsh-model-palette" ? void 0 : restored;
			let pending;
			let disposed = false;
			const openMounted = (view) => {
				for (let index = launchers.length - 1; index >= 0; index -= 1) if (launchers[index]?.(view) === true) return true;
				return false;
			};
			const requestOpen = (view = "models") => {
				const normalized = normalizeView(view);
				if (openMounted(normalized)) {
					pending = void 0;
					return true;
				}
				pending = normalized;
				return false;
			};
			const api = {
				id: MODEL_PALETTE_PLUGIN_ID,
				skinBridgeVersion: 2,
				get ready() {
					return launchers.length > 0;
				},
				open: requestOpen
			};
			const listener = (event) => {
				if (target["__DSH_MODEL_PALETTE__"] !== api) return;
				requestOpen(eventView(event));
			};
			const bridge = {
				api,
				register(open) {
					if (disposed) return () => {};
					launchers.push(open);
					if (pending !== void 0 && openMounted(pending)) pending = void 0;
					target.dispatchEvent(new Event(MODEL_PALETTE_READY_EVENT));
					return () => {
						const index = launchers.lastIndexOf(open);
						if (index !== -1) launchers.splice(index, 1);
					};
				},
				dispose() {
					if (disposed) return;
					disposed = true;
					launchers.length = 0;
					pending = void 0;
					target.removeEventListener(MODEL_PALETTE_OPEN_EVENT, listener);
					const current = api;
					delete current[MODEL_PALETTE_BRIDGE_KEY];
					if (target["__DSH_MODEL_PALETTE__"] !== api) return;
					if (restorable === void 0 || restorable === api) delete target[MODEL_PALETTE_GLOBAL_KEY];
					else target[MODEL_PALETTE_GLOBAL_KEY] = restorable;
				}
			};
			Object.defineProperty(api, MODEL_PALETTE_BRIDGE_KEY, {
				configurable: true,
				value: bridge
			});
			target[MODEL_PALETTE_GLOBAL_KEY] = api;
			target.addEventListener(MODEL_PALETTE_OPEN_EVENT, listener);
			return bridge;
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
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		function ModelPalette({ locked, available, directory, load, select, api, isLoopback, skinBridge, t }) {
			const snapshot = (0, react.useSyncExternalStore)(directory.subscribe, directory.getSnapshot, directory.getSnapshot);
			const choices = (0, react.useMemo)(() => flattenChoices(snapshot.groups), [snapshot.groups]);
			const current = currentChoice(choices, snapshot.current);
			const [open, setOpen] = (0, react.useState)(false);
			const [view, setView] = (0, react.useState)("models");
			const [query, setQuery] = (0, react.useState)("");
			const [providerId, setProviderId] = (0, react.useState)(null);
			const [quickFilter, setQuickFilter] = (0, react.useState)("all");
			const [cursor, setCursor] = (0, react.useState)(0);
			const [favorites, setFavorites] = useStoredList(FAVORITES_KEY);
			const [recents, setRecents] = useStoredList(RECENTS_KEY);
			const [error, setError] = (0, react.useState)(null);
			const [effortBusy, setEffortBusy] = (0, react.useState)(false);
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
				current: snapshot.current,
				quickFilter
			}), [
				choices,
				query,
				providerId,
				favorites,
				recents,
				snapshot.current,
				quickFilter
			]);
			const favoriteCount = (0, react.useMemo)(() => choices.filter((choice) => favorites.includes(choice.key)).length, [choices, favorites]);
			const recentCount = (0, react.useMemo)(() => choices.filter((choice) => recents.includes(choice.key)).length, [choices, recents]);
			const show = (0, react.useCallback)((nextView = "models") => {
				if (!available || locked) return false;
				setOpen(true);
				setView(nextView);
				setQuery("");
				setProviderId(null);
				setQuickFilter("all");
				setCursor(0);
				setError(null);
				load();
				return true;
			}, [
				available,
				load,
				locked
			]);
			const close = () => {
				setOpen(false);
				setError(null);
			};
			(0, react.useEffect)(() => skinBridge?.register(show), [show, skinBridge]);
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
				if (mayNeedReasoningCompatibility(choice.provider.id, choice.model.id, choice.model.name)) try {
					if ((await ensureSelectionCompatibility(api, choice.provider.id, choice.model.id)).length > 0) load();
				} catch (cause) {
					setError(t("palette.compatRepairFailed", { message: messageOf(cause) }));
					return;
				}
				if (!await select(choice.selection)) {
					setError(t("palette.selectFailed"));
					return;
				}
				setRecents(pushRecent(recents, choice.key));
				close();
			};
			const chooseEffort = async (value) => {
				if (snapshot.current === null) return;
				setEffortBusy(true);
				setError(null);
				try {
					const alreadyOffered = current?.model.reasoning?.efforts.some((effort) => effort.id === value) === true;
					if (value !== "" && !alreadyOffered) {
						if (await ensureSelectionReasoning(api, snapshot.current.provider, snapshot.current.model)) load();
					}
					if (!await select({
						provider: snapshot.current.provider,
						model: snapshot.current.model,
						...value === "" ? {} : { reasoningEffort: value }
					})) setError(t("palette.selectFailed"));
				} catch (cause) {
					setError(t("palette.reasoningEnableFailed", { message: messageOf(cause) }));
				} finally {
					setEffortBusy(false);
				}
			};
			const currentLabel = current?.model.name ?? snapshot.current?.model ?? t("trigger.fallback");
			const providerLabel = current?.provider.name ?? snapshot.current?.provider;
			const currentReasoning = current?.model.reasoning;
			const currentEffort = snapshot.current?.reasoningEffort ?? currentReasoning?.defaultEffort ?? "";
			const reasoningOptions = REASONING_LEVELS.map((level) => currentReasoning?.efforts.find((effort) => effort.id === level) ?? {
				id: level,
				name: `${level.charAt(0).toUpperCase()}${level.slice(1)}`
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dmp-launcher",
				"data-dsh-plugin": MODEL_PALETTE_PLUGIN_ID,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "dmp-trigger",
					disabled: locked || !available,
					onClick: () => show(),
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
					"data-dsh-plugin": "dsh-model-palette",
					"data-dsh-model-palette-view": view,
					role: "presentation",
					onMouseDown: (event) => {
						if (event.target === event.currentTarget) close();
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-dialog",
						"data-dsh-plugin": "dsh-model-palette",
						role: "dialog",
						"aria-modal": "true",
						"aria-label": t(view === "models" ? "palette.title" : view === "media" ? "media.title" : view === "config" ? "config.title" : "relay.title"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
								className: "dmp-header",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t(view === "models" ? "palette.title" : view === "media" ? "media.title" : view === "config" ? "config.title" : "relay.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: view === "models" ? `${choices.length} ${t("palette.models")} · ${t("palette.shortcut")}` : t(view === "media" ? "media.subtitle" : view === "config" ? "config.subtitle" : "relay.subtitle") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
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
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: `dmp-media-nav${view === "relay" ? " is-active" : ""}`,
											onClick: () => setView("relay"),
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("relay.nav") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: "↗" })]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dmp-provider-divider" }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: view === "models" && providerId === null && quickFilter === "all" ? "is-active" : "",
											onClick: () => {
												setView("models");
												setProviderId(null);
												setQuickFilter("all");
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("palette.allProviders") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: choices.length })]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: view === "models" && providerId === null && quickFilter === "favorites" ? "is-active" : "",
											onClick: () => {
												setView("models");
												setProviderId(null);
												setQuickFilter("favorites");
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("palette.favorites") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: favoriteCount })]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: view === "models" && providerId === null && quickFilter === "recents" ? "is-active" : "",
											onClick: () => {
												setView("models");
												setProviderId(null);
												setQuickFilter("recents");
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("palette.recents") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: recentCount })]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: "dmp-provider-divider" }),
										providers.map((provider) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: view === "models" && providerId === provider.id ? "is-active" : "",
											onClick: () => {
												setView("models");
												setProviderId(provider.id);
												setQuickFilter("all");
											},
											title: `${provider.name} · ${provider.id}`,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: provider.name }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: provider.models.length })]
										}, provider.id))
									]
								}), view === "media" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MediaPanel, { t }) : view === "config" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfigPanel, {
									api,
									isLoopback,
									t
								}) : view === "relay" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RelayPanel, {
									onOpenConfig: () => setView("config"),
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
									snapshot.current !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-effort",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("palette.effort") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
											value: currentEffort,
											disabled: effortBusy,
											onChange: (event) => void chooseEffort(event.currentTarget.value),
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "",
												children: t("palette.providerDefault")
											}), reasoningOptions.map((effort) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
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
			"palette.favorites": "仅看收藏",
			"palette.recents": "最近使用",
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
			"palette.compatRepairFailed": "无法在切换前修复推理兼容配置：{message}",
			"palette.reasoningEnableFailed": "无法为该模型启用所选推理档位：{message}",
			"favorite.add": "加入收藏",
			"favorite.remove": "取消收藏",
			"config.nav": "模型配置",
			"config.title": "供应商与模型配置",
			"config.subtitle": "编辑线路、密钥、模型容量与兼容参数",
			"config.intro": "直接写入 DSH settings/credentials；模型预置可从 GitHub 在线刷新。",
			"config.reload": "重新读取",
			"config.addProvider": "新增供应商",
			"config.unsaved": "有未保存更改",
			"config.discardConfirm": "当前配置尚未保存，确定放弃这些更改吗？",
			"config.duplicateProvider": "复制供应商",
			"config.copyName": "{name} 副本",
			"config.copyReady": "已复制为新供应商草稿；凭据引用已自动分离，请检查后应用。",
			"config.cancelCreate": "取消新增",
			"config.deleteProvider": "删除供应商",
			"config.deleting": "正在删除…",
			"config.deleteConfirm": "确定从用户配置中删除供应商 {provider} 吗？凭据本身不会删除。",
			"config.deleted": "供应商已从用户配置中删除；关联凭据仍保留。",
			"config.done": "已完成",
			"config.namespaceMissing": "当前 DSH 没有加载 llm-pi-ai 配置命名空间。",
			"config.providerTitle": "供应商设置",
			"config.providerDescription": "配置线路名称、端点、协议与凭据引用。",
			"config.providerId": "供应商 ID",
			"config.providerIdInvalid": "供应商 ID 只能使用小写字母、数字和连字符，并且必须以字母或数字开头。",
			"config.providerExists": "该供应商 ID 已存在，请换一个 ID。",
			"config.displayName": "显示名称",
			"config.baseUrl": "Base URL",
			"config.baseUrlRequired": "Base URL 不能为空。",
			"config.protocol": "协议类型",
			"config.protocolRequired": "请选择有效的协议类型。",
			"config.protocolNote": "Responses 只是供应商协议，不代表 Agent 调用；按端点实际支持选择。",
			"config.providerDefaultInput": "供应商默认输入",
			"config.inputDshDefault": "使用 DSH 默认（纯文本）",
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
			"config.probeSuccessApplied": "连接成功，发现 {count} 个模型；已自动新增 {added} 个、补全 {enriched} 个，并应用 {presets} 个能力预置。点击“应用配置”后生效。",
			"config.openRouterFreeScan": "检查免费模型",
			"config.openRouterFreeScanning": "正在检查免费模型…",
			"config.openRouterFreeScanned": "OpenRouter 实时目录有 {count} 个可用 :free 模型，其中 {unconfigured} 个尚未配置。请在目录中选择要导入的模型。",
			"config.openRouterFreePickerTitle": "OpenRouter 免费模型目录",
			"config.openRouterFreePickerSummary": "共 {count} 个 · 已选 {selected} 个 · 检查于 {checkedAt}",
			"config.openRouterFreeSearch": "搜索模型名称或 ID",
			"config.openRouterFreeSelectVisible": "全选当前结果",
			"config.openRouterFreeSelectNew": "只选未配置",
			"config.openRouterFreeClear": "清空选择",
			"config.openRouterFreeClose": "关闭",
			"config.openRouterFreeConfigured": "已配置",
			"config.openRouterFreeContext": "上下文 {value}",
			"config.openRouterFreeOutput": "最大输出 {value}",
			"config.openRouterFreeEmpty": "没有匹配的免费模型。",
			"config.openRouterFreeImportHint": "默认不勾选；导入只补全缺失能力，不覆盖手工字段，也不会删除未选模型。",
			"config.openRouterFreeImportSelected": "导入选中（{count}）",
			"config.openRouterFreeImported": "已处理 {selected} 个选中模型：新增 {added} 个、补全 {enriched} 个，并应用 {presets} 个能力预置。点击“应用配置”后生效。",
			"config.validateApiKey": "验证 API key",
			"config.apiKeyValidating": "正在验证…",
			"config.apiKeyValidationKeyRequired": "请先输入 API key，或确认当前 credential 已配置。",
			"config.apiKeyValidationConfirm": "将使用模型 {model} 按当前协议验证 DSH 运行时 key；如果输入框中有不同的新 key，也会同时验证。请求可能产生少量费用。继续吗？",
			"config.apiKeyValidationDone": "API key 验证完成，请查看下方状态。",
			"config.apiKeyValidationRuntimeTarget": "DSH 运行时凭据（{source}）",
			"config.apiKeyValidationDraftTarget": "输入框中的待保存 key",
			"config.apiKeyValidationDraftResult": "输入框待保存 key",
			"config.apiKeyValidationDraftOnly": "当前尚无 DSH 运行时凭据；只有点击“应用配置”后，对话才会使用这条 key。",
			"config.apiKeyValidationMismatch": "输入框 key 与 DSH 当前运行时凭据不同；对话仍使用运行时凭据。请点击“应用配置”后重新验证。",
			"config.apiKeyValidationScope": "此结果只证明最小流式请求成功；完整会话仍可能因请求体内容、体积、频率或 Cloudflare/WAF 规则被拦截。",
			"config.apiKeyValidationValid": "API key 可用",
			"config.apiKeyValidationInvalid": "API key 无效或未授权",
			"config.apiKeyValidationBlocked": "请求被供应商或网关拒绝",
			"config.apiKeyValidationUnavailable": "API key 可能已识别，但当前不可用",
			"config.apiKeyValidationUnknown": "暂时无法判断 API key",
			"config.apiKeyValidationMissing": "API key 未配置",
			"config.apiKeyBatch": "一键检查全部 API key",
			"config.apiKeyBatchRunning": "正在检查全部 key…",
			"config.apiKeyBatchConfirm": "将按每个供应商配置的真实模型和协议检查 {count} 个运行时凭据，可能产生少量 API 费用，并为避免限流而依次执行。继续吗？",
			"config.apiKeyBatchResults": "全部 API key 巡检结果",
			"config.apiKeyBatchAllValid": "所有可检查的运行时凭据均可用。",
			"config.apiKeyBatchProblems": "发现 {count} 个需要处理的供应商。",
			"config.apiKeyBatchClose": "收起结果",
			"config.apiKeyBatchEdit": "编辑此供应商",
			"config.apiKeyBatchNoBaseUrl": "未配置 Base URL，无法检查。",
			"config.apiKeyBatchInvalidBaseUrl": "Base URL 格式无效。",
			"config.apiKeyBatchInvalidProtocol": "协议配置无效。",
			"config.apiKeyBatchNoModel": "未配置可用于真实请求的模型 ID。",
			"config.protocolProbe": "测试实际协议",
			"config.protocolProbeModel": "测试模型",
			"config.protocolProbing": "正在测试协议…",
			"config.protocolProbeModelRequired": "请先添加至少一个带模型 ID 的模型，用于测试实际协议。",
			"config.protocolProbeConfirm": "将使用模型 {model} 分别发送一次最小 Completions 和 Responses 请求，可能产生少量 API 费用。继续吗？",
			"config.protocolProbeNone": "两个实际协议请求均未成功，请查看下方错误信息。",
			"config.protocolProbeOne": "仅 {protocol} 通过实际请求测试，建议使用该协议。",
			"config.protocolProbeBoth": "Completions 和 Responses 均通过实际请求测试；保留当前协议即可。",
			"config.protocolAvailable": "可用",
			"config.protocolUnavailable": "不可用：{error}",
			"config.protocolApplyRecommended": "采用 {protocol}",
			"config.protocolApplied": "已将协议草稿切换为 {protocol}，点击“应用配置”后生效。",
			"config.importDiscovery": "导入探测结果（{count}）",
			"config.discoveryApplied": "新增 {added} 个模型，补全 {enriched} 个模型。",
			"config.save": "应用配置",
			"config.saving": "正在应用…",
			"config.saved": "配置已实时写入 DSH。",
			"config.savedWithCompatibilityRepair": "配置已写入 DSH，并为 {count} 个 DeepSeek 推理模型补齐历史消息回传兼容项。",
			"config.settingsSavedKeyFailed": "供应商配置已保存，但 key 写入失败",
			"config.reasoningRepairTitle": "发现 DeepSeek 推理回传兼容项缺失",
			"config.reasoningRepairDescription": "共 {count} 个模型需要补齐 thinkingFormat、reasoning_content 回传与 system role 兼容：{models}",
			"config.reasoningRepairApply": "修复并应用",
			"config.reasoningProviderEnable": "全部模型启用推理档位",
			"config.reasoningProviderApplied": "已为 {count} 个模型补齐通用推理档位；保存后生效。",
			"config.reasoningModelApplied": "已为当前模型补齐全部推理档位和供应商感知的发送方式。",
			"config.reasoningTitle": "推理档位",
			"config.reasoningMode": "模型推理能力",
			"config.reasoningInherit": "继承在线目录",
			"config.reasoningDisabled": "明确禁用",
			"config.reasoningAll": "全部档位 / 自定义",
			"config.reasoningEnableAll": "一键启用全部档位",
			"config.reasoningDescription": "档位是否显示由 reasoningEfforts 决定；wire value 是实际发给供应商的值。插件会按 OpenAI、OpenRouter、DeepSeek、Qwen、GLM 等线路自动选择常见发送方式，仍可在高级兼容参数中修正。",
			"config.reasoningOffWire": "留空表示不发送推理参数",
			"config.reasoningWireValue": "{level} 的供应商 wire value",
			"config.modelsTitle": "模型参数",
			"config.modelsDescription": "上下文窗口、最大输出和输入类型会直接影响 DSH 的容量判断与附件适配。",
			"config.freeModelBadge": "实时免费",
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
			"config.modelIdDuplicate": "模型 ID 不能重复：{ids}",
			"config.modelName": "显示名称",
			"config.searchModels": "筛选当前供应商的模型…",
			"config.noMatchingModels": "当前供应商中没有匹配的模型。",
			"config.duplicateModel": "复制参数",
			"config.modelCopyReady": "已复制模型参数；请填写新模型 ID。",
			"config.optional": "可选",
			"config.contextWindow": "上下文窗口",
			"config.maxTokens": "最大输出",
			"config.inputTypes": "输入类型",
			"config.inputInherit": "继承供应商默认输入",
			"config.inputText": "纯文本",
			"config.inputTextImage": "文本 + 图片（视觉）",
			"config.inputImageOnly": "仅图片",
			"config.preset": "模型预置",
			"config.noPreset": "不使用预置 / 手工配置",
			"config.applyPreset": "应用预置",
			"config.presetReasoningLevels": "{count} 个推理档位",
			"config.compatibility": "高级兼容参数",
			"config.compatNone": "当前协议没有需要在这里设置的常用兼容参数。",
			"config.inherit": "继承 / 自动判断",
			"config.remove": "移除",
			"relay.nav": "中继配置",
			"relay.title": "供应商中继配置",
			"relay.subtitle": "查看内置中继并配置可复用的固定目标线路",
			"relay.intro": "当供应商官方域名因本地 DNS、TLS 或线路问题不可达时，让 DSH 通过本机插件后端连接指定的可达入口。",
			"relay.builtIn": "本机回环 · 固定目标",
			"relay.howTitle": "中继由 dsh-model-palette 提供",
			"relay.howDescription": "不是另一款插件，也不是 VPN。DSH 把原始 API 请求发送到本机中继，中继再以配置的 Host、TLS SNI 和证书名称访问固定上游。",
			"relay.routeAria": "中继请求路径",
			"relay.routeDsh": "DSH provider",
			"relay.routeLocal": "本机插件中继",
			"relay.routeProvider": "供应商可达入口",
			"relay.security": "API key 仍由 DSH credentials 管理，只在请求转发时经过本机进程。中继拒绝非回环和带转发头的请求，不会变成局域网开放代理。",
			"relay.baiTitle": "内置 B.AI 中继",
			"relay.baiDescription": "适用于 api.b.ai 直连超时或异常 DNS/TLS 路由；默认通过已验证的 AWS Global Accelerator 入口访问。",
			"relay.localBaseUrl": "Provider Base URL",
			"relay.upstream": "连接上游",
			"relay.hostHeader": "HTTP Host / 证书名称",
			"relay.allowedPath": "允许路径",
			"relay.statusHint": "返回 401 表示已经到达供应商，应检查 credential；502/504 或 TLS 错误表示中继到上游仍不可达。",
			"relay.copy": "复制地址",
			"relay.copied": "已复制",
			"relay.copyProvider": "复制 B.AI provider 模板",
			"relay.openModelConfig": "打开模型配置",
			"relay.pluginConfigTitle": "B.AI 中继高级配置",
			"relay.pluginConfigDescription": "默认无需填写。只有供应商更换可达入口、Host 或超时要求时，才在 profile 补丁中覆盖。",
			"relay.copyPluginConfig": "复制 B.AI 中继配置",
			"relay.extendTitle": "扩展到其他供应商",
			"relay.extendDescription": "providerRelays 支持添加多个具名、固定目标、仅本机可用的 HTTPS 中继，无需修改插件源码。",
			"relay.extendStepOne": "先确认 key 有效，并找到可连接到同一供应商服务的替代 HTTPS 主机。",
			"relay.extendStepTwo": "在插件 providerRelays 中填写连接主机、原 API Host、TLS SNI、证书名称和允许的路径前缀。",
			"relay.extendStepThree": "重启 dsh web，再把供应商 Base URL 改为本机 /model-palette/api/relay/<id>/v1 地址，并用“检查连接”验证。",
			"relay.genericBaseUrl": "示例 Provider Base URL：",
			"relay.copyGenericBaseUrl": "复制示例 Base URL",
			"relay.copyGenericConfig": "复制通用中继模板",
			"relay.extendWarning": "不要把未知网站、动态 URL 或密钥写进中继配置。每个中继必须固定到你明确核验过的供应商入口；若替代主机并非同一 API 服务，Host/SNI 改写也无法安全解决。",
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
			"palette.favorites": "Favorites only",
			"palette.recents": "Recent models",
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
			"palette.compatRepairFailed": "Could not repair reasoning compatibility before switching: {message}",
			"palette.reasoningEnableFailed": "Could not enable the selected reasoning effort for this model: {message}",
			"favorite.add": "Add favorite",
			"favorite.remove": "Remove favorite",
			"config.nav": "Model config",
			"config.title": "Provider and model configuration",
			"config.subtitle": "Edit routes, credentials, model capacity, and compatibility",
			"config.intro": "Writes through DSH settings and credentials; model presets can refresh from GitHub.",
			"config.reload": "Reload",
			"config.addProvider": "Add provider",
			"config.unsaved": "Unsaved changes",
			"config.discardConfirm": "This configuration has unsaved changes. Discard them?",
			"config.duplicateProvider": "Duplicate provider",
			"config.copyName": "{name} copy",
			"config.copyReady": "Created a provider draft with a separate credential reference. Review it before applying.",
			"config.cancelCreate": "Cancel new provider",
			"config.deleteProvider": "Delete provider",
			"config.deleting": "Deleting…",
			"config.deleteConfirm": "Remove provider {provider} from user settings? Its credential will be kept.",
			"config.deleted": "The provider was removed from user settings; its credential was kept.",
			"config.done": "Done",
			"config.namespaceMissing": "The llm-pi-ai settings namespace is not loaded.",
			"config.providerTitle": "Provider settings",
			"config.providerDescription": "Configure the route name, endpoint, protocol, and credential reference.",
			"config.providerId": "Provider ID",
			"config.providerIdInvalid": "Provider ID must use lowercase letters, numbers, and hyphens and start with a letter or number.",
			"config.providerExists": "That provider ID already exists. Choose another ID.",
			"config.displayName": "Display name",
			"config.baseUrl": "Base URL",
			"config.baseUrlRequired": "Base URL is required.",
			"config.protocol": "Protocol",
			"config.protocolRequired": "Select a valid protocol.",
			"config.protocolNote": "Responses is a provider protocol, not an Agent mode; select what the endpoint actually supports.",
			"config.providerDefaultInput": "Provider default input",
			"config.inputDshDefault": "Use DSH default (text only)",
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
			"config.probeSuccessApplied": "Connection succeeded with {count} models; added {added}, enriched {enriched}, and applied {presets} capability presets automatically. Apply configuration to save them.",
			"config.openRouterFreeScan": "Check free models",
			"config.openRouterFreeScanning": "Checking free models…",
			"config.openRouterFreeScanned": "The live OpenRouter catalog contains {count} usable :free models, including {unconfigured} that are not configured yet. Select the models to import.",
			"config.openRouterFreePickerTitle": "OpenRouter free model catalog",
			"config.openRouterFreePickerSummary": "{count} total · {selected} selected · checked {checkedAt}",
			"config.openRouterFreeSearch": "Search model name or ID",
			"config.openRouterFreeSelectVisible": "Select visible",
			"config.openRouterFreeSelectNew": "Select unconfigured",
			"config.openRouterFreeClear": "Clear selection",
			"config.openRouterFreeClose": "Close",
			"config.openRouterFreeConfigured": "Configured",
			"config.openRouterFreeContext": "Context {value}",
			"config.openRouterFreeOutput": "Max output {value}",
			"config.openRouterFreeEmpty": "No free models match this search.",
			"config.openRouterFreeImportHint": "Nothing is selected by default. Import fills missing capabilities only; it does not overwrite manual fields or remove unselected models.",
			"config.openRouterFreeImportSelected": "Import selected ({count})",
			"config.openRouterFreeImported": "Processed {selected} selected models: added {added}, enriched {enriched}, and applied {presets} capability presets. Apply configuration to save them.",
			"config.validateApiKey": "Validate API key",
			"config.apiKeyValidating": "Validating…",
			"config.apiKeyValidationKeyRequired": "Enter an API key or confirm that the current credential is configured.",
			"config.apiKeyValidationConfirm": "This validates the DSH runtime key with {model} over the selected protocol. If the input contains a different new key, it validates that key too. Requests may incur a small charge. Continue?",
			"config.apiKeyValidationDone": "API key validation completed; review the status below.",
			"config.apiKeyValidationRuntimeTarget": "DSH runtime credential ({source})",
			"config.apiKeyValidationDraftTarget": "Unsaved key in the input",
			"config.apiKeyValidationDraftResult": "Unsaved input key",
			"config.apiKeyValidationDraftOnly": "No DSH runtime credential is configured. Conversations use this key only after you apply the configuration.",
			"config.apiKeyValidationMismatch": "The input key differs from the DSH runtime credential. Conversations still use the runtime credential; apply the configuration and validate again.",
			"config.apiKeyValidationScope": "This proves only that a minimal streaming request succeeded. A full conversation may still be blocked because of its content, size, frequency, or Cloudflare/WAF rules.",
			"config.apiKeyValidationValid": "API key is usable",
			"config.apiKeyValidationInvalid": "API key is invalid or unauthorized",
			"config.apiKeyValidationBlocked": "Request was rejected by the provider or gateway",
			"config.apiKeyValidationUnavailable": "API key may be recognized but is currently unavailable",
			"config.apiKeyValidationUnknown": "API key could not be determined",
			"config.apiKeyValidationMissing": "API key is not configured",
			"config.apiKeyBatch": "Check all API keys",
			"config.apiKeyBatchRunning": "Checking all keys…",
			"config.apiKeyBatchConfirm": "This checks {count} runtime credentials through each provider’s configured model and protocol. It may incur a small charge and runs sequentially to reduce rate-limit pressure. Continue?",
			"config.apiKeyBatchResults": "All API key results",
			"config.apiKeyBatchAllValid": "Every checkable runtime credential is usable.",
			"config.apiKeyBatchProblems": "{count} providers need attention.",
			"config.apiKeyBatchClose": "Collapse results",
			"config.apiKeyBatchEdit": "Edit provider",
			"config.apiKeyBatchNoBaseUrl": "No Base URL is configured.",
			"config.apiKeyBatchInvalidBaseUrl": "The Base URL is invalid.",
			"config.apiKeyBatchInvalidProtocol": "The protocol configuration is invalid.",
			"config.apiKeyBatchNoModel": "No model ID is configured for a live request.",
			"config.protocolProbe": "Test live protocols",
			"config.protocolProbeModel": "Test model",
			"config.protocolProbing": "Testing protocols…",
			"config.protocolProbeModelRequired": "Add at least one model ID to test the live protocols.",
			"config.protocolProbeConfirm": "This sends one minimal Completions request and one minimal Responses request with {model}. It may incur a small API charge. Continue?",
			"config.protocolProbeNone": "Neither live protocol request succeeded. Review the errors below.",
			"config.protocolProbeOne": "Only {protocol} passed the live request test; use that protocol.",
			"config.protocolProbeBoth": "Both Completions and Responses passed the live request test; keep the current protocol.",
			"config.protocolAvailable": "available",
			"config.protocolUnavailable": "unavailable: {error}",
			"config.protocolApplyRecommended": "Use {protocol}",
			"config.protocolApplied": "Changed the draft protocol to {protocol}. Apply configuration to save it.",
			"config.importDiscovery": "Import discovered models ({count})",
			"config.discoveryApplied": "Added {added} models and enriched {enriched} models.",
			"config.save": "Apply configuration",
			"config.saving": "Applying…",
			"config.saved": "Configuration was written live to DSH.",
			"config.savedWithCompatibilityRepair": "Configuration was written to DSH and repaired replay compatibility for {count} DeepSeek reasoning models.",
			"config.settingsSavedKeyFailed": "Provider settings were saved, but the key write failed",
			"config.reasoningRepairTitle": "Missing DeepSeek reasoning replay compatibility",
			"config.reasoningRepairDescription": "{count} models need thinkingFormat, reasoning_content replay, and system-role compatibility: {models}",
			"config.reasoningRepairApply": "Repair and apply",
			"config.reasoningProviderEnable": "Enable reasoning for all models",
			"config.reasoningProviderApplied": "Filled universal reasoning efforts for {count} models. Apply configuration to save them.",
			"config.reasoningModelApplied": "Filled every reasoning effort and a provider-aware dispatch format for this model.",
			"config.reasoningTitle": "Reasoning efforts",
			"config.reasoningMode": "Model reasoning capability",
			"config.reasoningInherit": "Inherit live catalog",
			"config.reasoningDisabled": "Explicitly disabled",
			"config.reasoningAll": "All efforts / custom",
			"config.reasoningEnableAll": "Enable every effort",
			"config.reasoningDescription": "reasoningEfforts controls which levels DSH offers; each wire value is sent to the provider. The plugin selects common dispatch formats for OpenAI, OpenRouter, DeepSeek, Qwen, GLM, and similar routes, while advanced compatibility remains editable.",
			"config.reasoningOffWire": "Blank omits the reasoning parameter",
			"config.reasoningWireValue": "Provider wire value for {level}",
			"config.modelsTitle": "Model parameters",
			"config.modelsDescription": "Context, maximum output, and inputs drive DSH capacity and attachment decisions.",
			"config.freeModelBadge": "live free",
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
			"config.modelIdDuplicate": "Model IDs must be unique: {ids}",
			"config.modelName": "Display name",
			"config.searchModels": "Filter this provider’s models…",
			"config.noMatchingModels": "No models in this provider match the filter.",
			"config.duplicateModel": "Copy parameters",
			"config.modelCopyReady": "Copied the model parameters. Enter the new model ID.",
			"config.optional": "Optional",
			"config.contextWindow": "Context window",
			"config.maxTokens": "Maximum output",
			"config.inputTypes": "Input types",
			"config.inputInherit": "Inherit provider default input",
			"config.inputText": "Text only",
			"config.inputTextImage": "Text + image (vision)",
			"config.inputImageOnly": "Image only",
			"config.preset": "Model preset",
			"config.noPreset": "No preset / manual configuration",
			"config.applyPreset": "Apply preset",
			"config.presetReasoningLevels": "{count} reasoning efforts",
			"config.compatibility": "Advanced compatibility",
			"config.compatNone": "This protocol has no common compatibility switches exposed here.",
			"config.inherit": "Inherit / auto detect",
			"config.remove": "Remove",
			"relay.nav": "Relay config",
			"relay.title": "Provider relay configuration",
			"relay.subtitle": "Inspect the built-in relay and configure reusable fixed routes",
			"relay.intro": "When a provider canonical domain is unreachable because of local DNS, TLS, or routing, let the DSH plugin backend connect through a verified reachable entry.",
			"relay.builtIn": "Loopback only · fixed target",
			"relay.howTitle": "The relay is provided by dsh-model-palette",
			"relay.howDescription": "It is not another plugin or a VPN. DSH sends the original API request to the local relay, which connects to a fixed upstream with the configured Host, TLS SNI, and certificate name.",
			"relay.routeAria": "Relay request route",
			"relay.routeDsh": "DSH provider",
			"relay.routeLocal": "Local plugin relay",
			"relay.routeProvider": "Reachable provider entry",
			"relay.security": "The API key remains in DSH credentials and passes only through the local process during forwarding. The relay rejects non-loopback and forwarded requests, so it is not a LAN-accessible open proxy.",
			"relay.baiTitle": "Built-in B.AI relay",
			"relay.baiDescription": "Use it when direct api.b.ai requests time out or resolve through a broken DNS/TLS route. It defaults to a verified AWS Global Accelerator entry.",
			"relay.localBaseUrl": "Provider Base URL",
			"relay.upstream": "Connection upstream",
			"relay.hostHeader": "HTTP Host / certificate name",
			"relay.allowedPath": "Allowed path",
			"relay.statusHint": "HTTP 401 means the request reached the provider, so check the credential. HTTP 502/504 or a TLS error means the relay still cannot reach its upstream.",
			"relay.copy": "Copy URL",
			"relay.copied": "Copied",
			"relay.copyProvider": "Copy B.AI provider template",
			"relay.openModelConfig": "Open model config",
			"relay.pluginConfigTitle": "Advanced B.AI relay config",
			"relay.pluginConfigDescription": "The defaults normally need no override. Change them in a profile patch only when the provider changes its reachable entry, Host, or timeout requirements.",
			"relay.copyPluginConfig": "Copy B.AI relay config",
			"relay.extendTitle": "Extend to another provider",
			"relay.extendDescription": "providerRelays adds multiple named, fixed-destination, loopback-only HTTPS relays without changing plugin source.",
			"relay.extendStepOne": "Confirm the key is valid and find an alternate HTTPS host that reaches the same provider service.",
			"relay.extendStepTwo": "Configure the connection host, original API Host, TLS SNI, certificate name, and allowed path prefix under providerRelays.",
			"relay.extendStepThree": "Restart dsh web, change the provider Base URL to the local /model-palette/api/relay/<id>/v1 address, and run Check connection.",
			"relay.genericBaseUrl": "Example Provider Base URL:",
			"relay.copyGenericBaseUrl": "Copy example Base URL",
			"relay.copyGenericConfig": "Copy generic relay template",
			"relay.extendWarning": "Do not place unknown sites, dynamic URLs, or secrets in relay configuration. Every relay must stay fixed to a provider entry you verified; Host/SNI rewriting cannot safely turn an unrelated host into the provider API.",
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
		const css = ".dmp-launcher { display: inline-flex; min-width: 0; }\n.dmp-trigger { height: 28px; max-width: 340px; display: inline-flex; align-items: center; gap: 5px; padding: 0 8px; border: 0; border-radius: 16px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 13px; }\n.dmp-trigger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dmp-trigger:focus-visible { outline: 2px solid var(--dsw-alias-border-l2); outline-offset: 1px; }\n.dmp-trigger:disabled { color: var(--dsw-alias-label-dimmed); cursor: default; }\n.dmp-trigger-icon { color: var(--dsw-alias-brand-primary); font-weight: 700; }\n.dmp-trigger-model, .dmp-trigger-provider { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-trigger-model { max-width: 150px; font-weight: 600; }\n.dmp-trigger-provider { max-width: 110px; color: var(--dsw-alias-label-caption); }\n.dmp-trigger kbd { padding: 1px 5px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 5px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-family: inherit; }\n.dmp-overlay { position: fixed; inset: 0; z-index: 10020; display: grid; place-items: center; padding: 24px; background: color-mix(in srgb, var(--dsw-alias-bg-mask, #000) 46%, transparent); backdrop-filter: blur(8px); }\n.dmp-dialog { width: min(920px, calc(100vw - 32px)); height: min(720px, calc(100vh - 48px)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 18px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); box-shadow: 0 24px 80px rgb(0 0 0 / 28%); }\n.dmp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px 14px; }\n.dmp-header h2 { margin: 0; font-size: 18px; line-height: 24px; }\n.dmp-header p { margin: 3px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; }\n.dmp-close { width: 30px; height: 30px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 22px; }\n.dmp-close:hover { background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-search-wrap { display: flex; align-items: center; gap: 9px; margin: 0 22px 12px; padding: 0 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 11px; background: var(--dsw-alias-bg-layer-1); }\n.dmp-search-wrap:focus-within { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); }\n.dmp-search-wrap input { flex: 1; min-width: 0; height: 42px; border: 0; outline: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 14px; }\n.dmp-search-wrap input::placeholder { color: var(--dsw-alias-label-tertiary); }\n.dmp-search-wrap button { border: 0; background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; font-size: 18px; }\n.dmp-error { display: flex; align-items: center; gap: 12px; margin: 0 22px 10px; padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-state-error-secondary); color: var(--dsw-alias-state-error-primary); font-size: 12px; }\n.dmp-error button { margin-left: auto; border: 1px solid currentColor; border-radius: 12px; background: transparent; color: inherit; cursor: pointer; }\n.dmp-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 190px minmax(0, 1fr); border-top: 1px solid var(--dsw-alias-border-inverted); border-bottom: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-providers { min-height: 0; overflow-y: auto; padding: 10px; border-right: 1px solid var(--dsw-alias-border-inverted); background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 72%, transparent); }\n.dmp-providers button { width: 100%; display: flex; align-items: center; gap: 8px; min-height: 34px; padding: 7px 9px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; text-align: left; font: inherit; font-size: 12.5px; }\n.dmp-providers button:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dmp-providers button.is-active { background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); }\n.dmp-providers button span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-providers button small { color: var(--dsw-alias-label-tertiary); }\n.dmp-providers .dmp-media-nav { color: var(--dsw-alias-brand-primary); font-weight: 600; }\n.dmp-provider-divider { height: 1px; margin: 8px 4px; background: var(--dsw-alias-border-inverted); }\n.dmp-results { min-height: 0; overflow-y: auto; padding: 10px; }\n.dmp-result { width: 100%; display: flex; align-items: center; gap: 2px; border-radius: 10px; background: transparent; color: var(--dsw-alias-label-primary); }\n.dmp-result:hover, .dmp-result.is-cursor { background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-result.is-current { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent); }\n.dmp-result-select { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 10px 5px 10px 11px; border: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; font: inherit; }\n.dmp-result-select:focus-visible, .dmp-star:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }\n.dmp-result-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }\n.dmp-result-title { display: flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 600; }\n.dmp-result-title em { padding: 1px 6px; border-radius: 999px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 10px; font-style: normal; font-weight: 500; }\n.dmp-result-meta { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--dsw-alias-label-tertiary); font-size: 11.5px; }\n.dmp-result-meta strong { color: var(--dsw-alias-label-secondary); font-weight: 500; }\n.dmp-result-meta span, .dmp-result-description { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-result-description { color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-reasoning { width: 21px; height: 21px; display: grid; place-items: center; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 6px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-weight: 700; }\n.dmp-star { margin-right: 7px; padding: 4px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-dimmed); cursor: pointer; font: inherit; font-size: 16px; }\n.dmp-star:hover, .dmp-star.is-favorite { color: var(--dsw-alias-state-warn-primary); background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-empty { display: grid; min-height: 220px; place-items: center; color: var(--dsw-alias-label-tertiary); font-size: 13px; }\n.dmp-footer { min-height: 62px; display: flex; align-items: center; gap: 16px; padding: 10px 18px; }\n.dmp-current { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 7px; }\n.dmp-current span { color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-current strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }\n.dmp-current small { color: var(--dsw-alias-label-tertiary); }\n.dmp-effort { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-effort select { height: 30px; max-width: 170px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; }\n.dmp-failures { color: var(--dsw-alias-state-warn-primary); font-size: 11px; }\n.dmp-media { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dmp-media-intro { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 10px; padding: 11px 13px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }\n.dmp-media-intro div { display: flex; flex-direction: column; gap: 2px; }\n.dmp-media-intro strong { font-size: 13px; }\n.dmp-media-intro span { color: var(--dsw-alias-label-tertiary); font-size: 11.5px; line-height: 17px; }\n.dmp-media-intro .dmp-media-safety { flex: none; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, #22a06b 15%, transparent); color: #22a06b; font-size: 10px; font-weight: 600; }\n.dmp-media-catalog { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; padding: 9px 11px; border-bottom: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-media-catalog div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-media-catalog strong { font-size: 12px; }\n.dmp-media-catalog span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-media-catalog button { flex: none; min-height: 29px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 10.5px; }\n.dmp-media-catalog button:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-media-catalog button:disabled { opacity: .5; cursor: default; }\n.dmp-media-error { margin-bottom: 10px; padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-state-error-secondary); color: var(--dsw-alias-state-error-primary); font-size: 12px; }\n.dmp-media-feedback { margin-bottom: 10px; padding: 9px 10px; border-radius: 8px; background: color-mix(in srgb, #22a06b 11%, var(--dsw-alias-bg-layer-2)); color: var(--dsw-alias-label-primary); font-size: 11px; }\n.dmp-media-feedback strong { display: block; margin-bottom: 4px; color: #22a06b; }\n.dmp-media-feedback pre { max-height: 110px; margin: 0; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--dsw-alias-label-secondary); font: inherit; line-height: 16px; }\n.dmp-media-card { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dmp-media-card-heading { display: flex; align-items: flex-start; gap: 9px; }\n.dmp-media-card-heading div { min-width: 0; }\n.dmp-media-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dmp-media-card-heading p { margin: 2px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-media-icon { width: 25px; height: 25px; flex: none; display: grid; place-items: center; border-radius: 7px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 14px; font-weight: 700; }\n.dmp-media-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 10px; }\n.dmp-media-fields { display: grid; grid-template-columns: minmax(0, 1fr) 120px; gap: 8px; }\n.dmp-media-field { min-width: 0; display: flex; flex-direction: column; gap: 4px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-media-field input, .dmp-media-field textarea, .dmp-media-field select { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }\n.dmp-media-field input, .dmp-media-field select { height: 32px; padding: 0 9px; }\n.dmp-media-field textarea { min-height: 58px; resize: vertical; padding: 8px 9px; line-height: 17px; }\n.dmp-media-field input:focus, .dmp-media-field textarea:focus, .dmp-media-field select:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }\n.dmp-media-field input::placeholder, .dmp-media-field textarea::placeholder { color: var(--dsw-alias-label-dimmed); }\n.dmp-media-paid-confirm { display: flex; align-items: flex-start; gap: 8px; padding: 8px 9px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 46%, var(--dsw-alias-border-inverted)); border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 9%, transparent); color: var(--dsw-alias-label-secondary); cursor: pointer; }\n.dmp-media-paid-confirm input { width: 14px; height: 14px; flex: none; margin: 2px 0 0; accent-color: var(--dsw-alias-state-warn-primary, #d97706); }\n.dmp-media-paid-confirm span { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-media-paid-confirm strong { color: var(--dsw-alias-state-warn-primary, #d97706); font-size: 10.5px; line-height: 15px; }\n.dmp-media-paid-confirm small { color: var(--dsw-alias-label-tertiary); font-size: 9.5px; line-height: 14px; }\n.dmp-media-actions { display: flex; flex-wrap: wrap; gap: 7px; }\n.dmp-media-actions button, .dmp-media-primary { min-height: 31px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 11px; }\n.dmp-media-actions button:hover:not(:disabled), .dmp-media-primary:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-media-actions button.dmp-media-primary, .dmp-media-primary { align-self: flex-end; border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 50%, var(--dsw-alias-border-l2)); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); font-weight: 600; }\n.dmp-media-actions button.dmp-media-primary:hover:not(:disabled), .dmp-media-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 88%, #000); color: var(--dsw-alias-label-on-primary, #fff); }\n.dmp-media-actions button:disabled, .dmp-media-primary:disabled { opacity: .5; cursor: default; }\n.dmp-media-job-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; align-items: end; gap: 8px; }\n.dmp-media-job-actions { flex-wrap: nowrap; }\n.dmp-relay { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dmp-relay-intro { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 10px; padding: 11px 13px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }\n.dmp-relay-intro div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-relay-intro strong { font-size: 13px; }\n.dmp-relay-intro span { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; }\n.dmp-relay-intro .dmp-relay-status { flex: none; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, #22a06b 15%, transparent); color: #22a06b; font-size: 10px; font-weight: 600; }\n.dmp-relay-card { position: relative; display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dmp-relay-card-heading { display: flex; align-items: flex-start; gap: 9px; }\n.dmp-relay-card-heading div { min-width: 0; }\n.dmp-relay-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dmp-relay-card-heading p { margin: 2px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-relay-icon { width: 25px; height: 25px; flex: none; display: grid; place-items: center; border-radius: 7px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 13px; font-weight: 700; }\n.dmp-relay-route { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 7px; }\n.dmp-relay-route span { min-width: 0; padding: 8px; border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); text-align: center; font-size: 10.5px; }\n.dmp-relay-route b { color: var(--dsw-alias-brand-primary); font-size: 12px; }\n.dmp-relay-note, .dmp-relay-warning, .dmp-relay-base-example { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-relay-details { display: grid; gap: 1px; margin: 0; overflow: hidden; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 9px; background: var(--dsw-alias-border-inverted); }\n.dmp-relay-details > div { min-width: 0; display: grid; grid-template-columns: 145px minmax(0, 1fr); align-items: center; gap: 10px; padding: 8px 9px; background: var(--dsw-alias-bg-layer-1); }\n.dmp-relay-details dt { color: var(--dsw-alias-label-tertiary); font-size: 10px; }\n.dmp-relay-details dd { min-width: 0; display: flex; align-items: center; gap: 7px; margin: 0; color: var(--dsw-alias-label-secondary); font-size: 10.5px; }\n.dmp-relay-details code, .dmp-relay-base-example code { min-width: 0; overflow: hidden; color: var(--dsw-alias-label-primary); text-overflow: ellipsis; white-space: nowrap; }\n.dmp-relay-details button, .dmp-relay-actions button, .dmp-relay-copy-code { flex: none; min-height: 29px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 10.5px; }\n.dmp-relay-details button:hover, .dmp-relay-actions button:hover, .dmp-relay-copy-code:hover { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-relay-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; }\n.dmp-relay-actions button.dmp-relay-primary { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); font-weight: 600; }\n.dmp-relay-code { max-height: 230px; margin: 0; overflow: auto; padding: 10px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 9px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 15px; white-space: pre; }\n.dmp-relay-copy-code { align-self: flex-end; }\n.dmp-relay-expand ol { margin: 0; padding-left: 21px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; line-height: 16px; }\n.dmp-relay-warning { padding: 8px 9px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 44%, var(--dsw-alias-border-inverted)); border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 8%, transparent); color: var(--dsw-alias-state-warn-primary, #d97706); }\n.dmp-config { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dmp-config-toolbar, .dmp-config-card-heading, .dmp-config-status-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }\n.dmp-config-toolbar { margin-bottom: 10px; padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent); }\n.dmp-config-toolbar > div:first-child { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-config-toolbar strong { font-size: 13px; }\n.dmp-config-toolbar span, .dmp-config-card-heading p, .dmp-config-status-row, .dmp-config-heading-actions > span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-config-toolbar-actions, .dmp-config-heading-actions, .dmp-config-provider-actions, .dmp-config-status-row > div, .dmp-config-key-input, .dmp-config-preset, .dmp-config-model-top > div { display: flex; align-items: center; gap: 7px; }\n.dmp-config-dirty { padding: 3px 7px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 12%, transparent); color: var(--dsw-alias-state-warn-primary, #d97706) !important; font-size: 9.5px !important; font-weight: 600; }\n.dmp-config-compat-warning { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 44%, var(--dsw-alias-border-inverted)); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 9%, var(--dsw-alias-bg-layer-2)); }\n.dmp-config-compat-warning > div { min-width: 0; display: flex; flex-direction: column; gap: 3px; }\n.dmp-config-compat-warning strong { color: var(--dsw-alias-state-warn-primary, #d97706); font-size: 11.5px; }\n.dmp-config-compat-warning span { color: var(--dsw-alias-label-secondary); font-size: 10.5px; line-height: 15px; overflow-wrap: anywhere; }\n.dmp-config-compat-warning button { flex: none; min-height: 31px; padding: 0 10px; border: 1px solid var(--dsw-alias-state-warn-primary, #d97706); border-radius: 8px; background: var(--dsw-alias-state-warn-primary, #d97706); color: #fff; cursor: pointer; font-size: 10.5px; font-weight: 600; }\n.dmp-config button, .dmp-config select { font: inherit; }\n.dmp-config-toolbar button, .dmp-config-card-heading button, .dmp-config-provider-actions button, .dmp-config-status-row button, .dmp-config-preset button, .dmp-config-model-top button { min-height: 29px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10.5px; }\n.dmp-config-toolbar button:hover:not(:disabled), .dmp-config-card-heading button:hover:not(:disabled), .dmp-config-provider-actions button:hover:not(:disabled), .dmp-config-status-row button:hover:not(:disabled), .dmp-config-preset button:hover:not(:disabled), .dmp-config-model-top button:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-config button.dmp-danger { color: var(--dsw-alias-state-error-primary); }\n.dmp-config button.dmp-danger:hover:not(:disabled) { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }\n.dmp-config button:disabled { opacity: .5; cursor: default; }\n.dmp-config-card { margin-bottom: 10px; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dmp-config-card-heading { align-items: flex-start; margin-bottom: 11px; }\n.dmp-config-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dmp-config-card-heading p { margin: 2px 0 0; }\n.dmp-config-provider-actions { flex-wrap: wrap; justify-content: flex-end; }\n.dmp-config-provider-actions select { min-width: 190px; height: 31px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; }\n.dmp-config-provider-grid, .dmp-config-model-grid, .dmp-config-compat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; }\n.dmp-config-span-2 { grid-column: span 2; }\n.dmp-config-protocol-note { grid-column: span 3; align-self: end; min-height: 32px; display: flex; align-items: center; padding: 0 9px; border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 14px; }\n.dmp-config-key-field { grid-column: span 3; }\n.dmp-config-key-input input { flex: 1; min-width: 0; }\n.dmp-config-key-input button { flex: none; min-height: 30px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10px; }\n.dmp-config-status-row { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-config-status-row > span.is-ok { color: #22a06b; }\n.dmp-config-status-row > div { margin-left: auto; }\n.dmp-config-protocol-model { display: flex; align-items: center; gap: 6px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-config-protocol-model select { max-width: 190px; height: 29px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 7px; font: inherit; font-size: 10.5px; }\n.dmp-config-status-row button.dmp-media-primary { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); }\n.dmp-config-protocol-results { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--dsw-alias-border-inverted); font-size: 10.5px; }\n.dmp-config-protocol-results span { display: inline-flex; align-items: baseline; gap: 4px; color: var(--dsw-alias-label-secondary); }\n.dmp-config-protocol-results span.is-ok { color: #22a06b; }\n.dmp-config-protocol-results span.is-error { color: var(--dsw-alias-state-error-primary); }\n.dmp-config-protocol-results button { min-height: 27px; padding: 0 8px; border: 1px solid var(--dsw-alias-brand-primary); border-radius: 7px; background: transparent; color: var(--dsw-alias-brand-primary); cursor: pointer; font-size: 10px; }\n.dmp-config-key-validation { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--dsw-alias-border-inverted); font-size: 10.5px; }\n.dmp-config-key-validation strong { font-weight: 600; }\n.dmp-config-key-validation span { color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }\n.dmp-config-key-validation.is-valid strong { color: #22a06b; }\n.dmp-config-key-validation.is-invalid strong, .dmp-config-key-validation.is-blocked strong { color: var(--dsw-alias-state-error-primary); }\n.dmp-config-key-validation.is-unavailable strong { color: var(--dsw-alias-state-warn-primary, #d97706); }\n.dmp-config-key-validation.is-unknown strong { color: var(--dsw-alias-label-tertiary); }\n.dmp-config-batch-results { margin-bottom: 10px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 11px; background: var(--dsw-alias-bg-layer-2); }\n.dmp-config-batch-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }\n.dmp-config-batch-heading > div { display: flex; flex-direction: column; gap: 2px; }\n.dmp-config-batch-heading strong { font-size: 12px; }\n.dmp-config-batch-heading span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-config-batch-heading button, .dmp-config-batch-list button, .dmp-config-reasoning-toolbar button { min-height: 27px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10px; }\n.dmp-config-batch-list { display: flex; flex-direction: column; gap: 6px; }\n.dmp-config-batch-list article { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 9px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; }\n.dmp-config-batch-list article > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-config-batch-list article > div:last-child { align-items: flex-end; flex: none; }\n.dmp-config-batch-list article strong, .dmp-config-batch-list article > div:last-child > span { font-size: 10.5px; }\n.dmp-config-batch-list article span, .dmp-config-batch-list article small { color: var(--dsw-alias-label-tertiary); font-size: 9.5px; overflow-wrap: anywhere; }\n.dmp-config-batch-list article.is-valid { border-color: color-mix(in srgb, #22a06b 48%, var(--dsw-alias-border-inverted)); }\n.dmp-config-batch-list article.is-valid > div:last-child > span { color: #22a06b; }\n.dmp-config-batch-list article.is-invalid, .dmp-config-batch-list article.is-blocked, .dmp-config-batch-list article.is-missing { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 48%, var(--dsw-alias-border-inverted)); }\n.dmp-config-batch-list article.is-invalid > div:last-child > span, .dmp-config-batch-list article.is-blocked > div:last-child > span, .dmp-config-batch-list article.is-missing > div:last-child > span { color: var(--dsw-alias-state-error-primary); }\n.dmp-config-free-picker { margin-top: 10px; padding: 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 32%, var(--dsw-alias-border-inverted)); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, var(--dsw-alias-bg-layer-2)); }\n.dmp-config-free-picker-heading, .dmp-config-free-picker-toolbar, .dmp-config-free-picker-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.dmp-config-free-picker-heading > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-config-free-picker-heading strong { font-size: 12px; }\n.dmp-config-free-picker-heading span, .dmp-config-free-picker-footer span { color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 14px; }\n.dmp-config-free-picker button { min-height: 27px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10px; }\n.dmp-config-free-picker button:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-config-free-picker button:disabled { opacity: .5; cursor: default; }\n.dmp-config-free-picker-toolbar { justify-content: flex-start; flex-wrap: wrap; margin-top: 9px; }\n.dmp-config-free-picker-toolbar input { width: min(260px, 100%); height: 29px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; font: inherit; font-size: 10.5px; }\n.dmp-config-free-picker-toolbar input:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }\n.dmp-config-free-picker-list { display: flex; flex-direction: column; gap: 5px; max-height: 310px; overflow-y: auto; margin-top: 9px; padding-right: 2px; }\n.dmp-config-free-picker-list > label { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 7px 8px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); cursor: pointer; }\n.dmp-config-free-picker-list > label:hover { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 48%, var(--dsw-alias-border-inverted)); }\n.dmp-config-free-picker-list input { accent-color: var(--dsw-alias-brand-primary); }\n.dmp-config-free-picker-model, .dmp-config-free-picker-meta { display: flex; min-width: 0; }\n.dmp-config-free-picker-model { flex-direction: column; gap: 1px; }\n.dmp-config-free-picker-model strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10.5px; }\n.dmp-config-free-picker-model small, .dmp-config-free-picker-meta small { color: var(--dsw-alias-label-tertiary); font-size: 9px; }\n.dmp-config-free-picker-model small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-config-free-picker-meta { align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 5px 8px; }\n.dmp-config-free-picker-meta em { padding: 1px 5px; border-radius: 999px; background: color-mix(in srgb, #22a06b 12%, transparent); color: #22a06b; font-size: 8.5px; font-style: normal; font-weight: 700; }\n.dmp-config-free-picker-footer { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-config-free-picker-footer button.dmp-media-primary { flex: none; border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); }\n.dmp-config-heading-actions { flex-wrap: wrap; justify-content: flex-end; }\n.dmp-config-model-search { width: 190px; height: 29px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 9px; font: inherit; font-size: 10.5px; }\n.dmp-config-model-search:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }\n.dmp-config-models { display: flex; flex-direction: column; gap: 9px; }\n.dmp-config-empty { min-height: 90px; display: grid; place-items: center; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-config-model { padding: 10px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 70%, transparent); }\n.dmp-config-model-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }\n.dmp-config-model-title { display: flex; align-items: center; gap: 7px; min-width: 0; }\n.dmp-config-model-title > strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }\n.dmp-config-model-title > small { flex: 0 0 auto; padding: 1px 6px; border: 1px solid color-mix(in srgb, #22a06b 38%, transparent); border-radius: 999px; background: color-mix(in srgb, #22a06b 12%, transparent); color: #22a06b; font-size: 9px; font-weight: 700; line-height: 15px; text-transform: uppercase; }\n.dmp-config-model-top button { min-height: 25px; color: var(--dsw-alias-state-error-primary); }\n.dmp-config-inputs { grid-column: span 2; min-width: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 9px; margin: 0; padding: 5px 8px 7px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; }\n.dmp-config-inputs legend { padding: 0 4px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-config-inputs label { display: flex; align-items: center; gap: 4px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; }\n.dmp-config-inputs input { accent-color: var(--dsw-alias-brand-primary); }\n.dmp-config-inputs small { color: var(--dsw-alias-label-dimmed); font-size: 9.5px; }\n.dmp-config-preset { grid-column: span 2; align-items: end; min-width: 0; }\n.dmp-config-preset .dmp-media-field { flex: 1; }\n.dmp-config-preset a { flex: none; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-brand-primary); font-size: 9.5px; text-decoration: none; }\n.dmp-config-preset > small { flex: none; max-width: 150px; color: var(--dsw-alias-label-tertiary); font-size: 9.5px; line-height: 13px; }\n.dmp-config-compat { margin-top: 8px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-config-compat summary { padding-top: 8px; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10.5px; }\n.dmp-config-compat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); padding-top: 8px; }\n.dmp-config-compat p { margin: 8px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10px; }\n.dmp-config-reasoning { margin-top: 8px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-config-reasoning summary { padding-top: 8px; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10.5px; }\n.dmp-config-reasoning-toolbar { display: flex; align-items: end; gap: 8px; padding-top: 8px; }\n.dmp-config-reasoning-toolbar > label { width: 190px; flex: none; }\n.dmp-config-reasoning-toolbar small { color: var(--dsw-alias-label-tertiary); font-size: 9.5px; line-height: 14px; }\n.dmp-config-reasoning-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin-top: 8px; }\n.dmp-config-reasoning-grid > label { display: flex; flex-direction: column; gap: 4px; padding: 7px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 7px; }\n.dmp-config-reasoning-grid span { color: var(--dsw-alias-label-secondary); font-size: 10px; }\n.dmp-config-reasoning-grid input[type='text'], .dmp-config-reasoning-grid > label > input { width: 100%; min-width: 0; height: 27px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 7px; font: inherit; font-size: 10px; }\n@media (max-width: 680px) { .dmp-overlay { padding: 8px; } .dmp-dialog { width: 100%; height: min(680px, calc(100vh - 16px)); border-radius: 14px; } .dmp-body { grid-template-columns: 125px minmax(0, 1fr); } .dmp-providers { padding: 7px; } .dmp-result-description, .dmp-trigger kbd { display: none; } .dmp-footer { flex-wrap: wrap; } }\n@media (max-width: 760px) { .dmp-media-grid { grid-template-columns: 1fr; } .dmp-media-job-row { grid-template-columns: 1fr; } .dmp-media-job-actions { flex-wrap: wrap; } }\n@media (max-width: 760px) { .dmp-relay-route { grid-template-columns: 1fr; } .dmp-relay-route b { transform: rotate(90deg); text-align: center; } .dmp-relay-details > div { grid-template-columns: 1fr; gap: 4px; } .dmp-relay-details dd { align-items: stretch; flex-direction: column; } .dmp-relay-details code { white-space: normal; overflow-wrap: anywhere; } }\n@media (max-width: 820px) { .dmp-config-provider-grid, .dmp-config-model-grid, .dmp-config-compat-grid, .dmp-config-reasoning-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .dmp-config-span-2, .dmp-config-key-field, .dmp-config-protocol-note, .dmp-config-inputs, .dmp-config-preset { grid-column: span 2; } .dmp-config-toolbar, .dmp-config-card-heading, .dmp-config-status-row, .dmp-config-compat-warning, .dmp-config-batch-list article, .dmp-config-reasoning-toolbar, .dmp-config-free-picker-heading, .dmp-config-free-picker-footer { align-items: stretch; flex-direction: column; } .dmp-config-toolbar-actions, .dmp-config-heading-actions, .dmp-config-provider-actions, .dmp-config-status-row > div { justify-content: flex-start; margin-left: 0; flex-wrap: wrap; } .dmp-config-model-search, .dmp-config-reasoning-toolbar > label { width: min(100%, 260px); } .dmp-config-batch-list article > div:last-child { align-items: flex-start; } .dmp-config-free-picker-list > label { grid-template-columns: auto minmax(0, 1fr); } .dmp-config-free-picker-meta { grid-column: 2; justify-content: flex-start; } }\n\nhtml[data-dsh-skin] [data-dsh-plugin='dsh-model-palette'] {\n  min-width: 0;\n}\n\nhtml[data-dsh-skin] .dmp-overlay[data-dsh-plugin='dsh-model-palette'] {\n  z-index: 10020;\n}\n";
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
			const skinBridge = typeof window === "undefined" ? void 0 : installModelPaletteSkinBridge(window);
			if (skinBridge !== void 0) ctx.effect(() => () => skinBridge.dispose(), "dsh-model-palette: Skin Center v2 bridge");
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
							isLoopback: connection.isLoopback,
							skinBridge
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
