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
		/** Classify every configured model by real Responses and Chat Completions requests. */
		async function probeProviderModelProtocols(input) {
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
		/** Resolve configured model capacities and input modalities from the running DSH adapter. */
		async function resolveProviderModels(input) {
			const response = await fetch(`${CONFIG_API_BASE}/models/resolve`, {
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
			return payload.value.models;
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
		/** Synchronize one provider's model list to the live OpenRouter :free catalog right now. */
		async function syncProviderFreeModels(provider) {
			const response = await fetch("/model-palette/api/free-sync", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ provider })
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
		//#region src/client/ProviderIcon.tsx
		/** Inline monochrome brand glyphs; every path inherits currentColor. */
		const GLYPHS = {
			openai: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3.2 15 5v3.2l2.8 1.6v3.6L15 15v3.2l-3 1.8-3-1.8V15l-2.8-1.6V9.8L9 8.2V5l3-1.8Zm0 2.2-1 .6v2.6l-2.8 1.6v2.4L11 14.2v2.6l1 .6 1-.6v-2.6l2.8-1.6v-2.4L13 8.6V6l-1-.6Z" }),
			anthropic: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M13.8 5h2.9L21 19h-3l-1-3.4h-4.6L11.3 19H8.4L13.8 5Zm.4 4.6-1.4 4.6h3.4l-1.5-4.6h-.5ZM5 15.2 9.4 5h2.4L7.4 15.2H5Z",
				transform: "translate(-1.2 0)"
			}),
			google: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M12 10.2v3.4h4.9c-.2 1.3-1.5 3.8-4.9 3.8-3 0-5.4-2.5-5.4-5.4S9 6.6 12 6.6c1.7 0 2.8.7 3.5 1.3l2.4-2.3C16.4 4.2 14.4 3.4 12 3.4 6.9 3.4 2.8 7.5 2.8 12.4S6.9 21.6 12 21.6c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1-.1-1.5H12Z",
				transform: "scale(.92) translate(1 .4)"
			}),
			deepseek: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M20.2 6.6c-.5-.3-1.2-.2-1.6.1-.3-.9-1-1.7-2-2.1-.5-.2-1 .1-1.1.5l-.3 1.3c-2.7.5-4.9 2-6.3 4.3-.9 1.5-2.4 2.3-4 2.1-.5-.1-.9.2-1 .6-.1.3 0 .7.3 1 1.7 1.4 4 1.9 6.3 1.2 3-1 5.2-3.4 6-6.4.6.2 1.3.1 1.9-.3.8-.5 1.4-1.3 1.8-2.3ZM9.4 16.4c-1 .3-2 .4-3 .1.5.6 1.3 1 2.2 1.1 1.9.2 3.8-.5 5.4-1.9-.7.4-1.5.7-2.3.8-.8.1-1.6 0-2.3-.1Z" }),
			openrouter: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 4h2.4v6.2L18 4.6v6.3l2-.9V14l-2-.9v6.3L6.4 13.8V20H4V4Zm2.4 8.7 9.2 4.6V6.7L6.4 11.3Z" }),
			moonshot: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 7.4-5H14a4 4 0 0 1-6.9-4A4 4 0 0 1 14 9h5.4A8 8 0 0 0 12 4Zm4.9 7h2.8a8.2 8.2 0 0 0 0 0Z" }),
			kimi: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 4h2.6v7.1L14 4h3.3l-6 6.9 6.2 9.1h-3.3l-4.9-7.3-2.7 3.1V20H5V4Zm13.8.6a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Z" }),
			minimax: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 10h2v4H4v-4Zm3.5-3h2v10h-2V7ZM11 4.5h2v15h-2v-15Zm3.5 2.5h2v10h-2V7ZM18 10h2v4h-2v-4Z" }),
			zai: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 5h14v2.4l-8.6 8.2H19V18H5v-2.4l8.6-8.2H5V5Zm7.6-1.6 1.5 2-1.5 2-1.5-2 1.5-2Z" }),
			qwen: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4a8 8 0 0 1 8 8c0 2.5-1.2 4.8-3 6.2l1.6 2.4-1.9 1.2-1.8-2.7c-.9.3-1.9.5-2.9.5a8 8 0 0 1 0-16Zm0 2.6a5.4 5.4 0 1 0 0 10.8c.5 0 1-.1 1.4-.2l-1.2-1.8 1.9-1.2 1.3 1.9A5.4 5.4 0 0 0 12 6.6Z" }),
			xai: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 4h3.4l4.6 6.6L16.6 4H20l-6.3 8.8L20 20h-3.4L12 13.4 7.4 20H4l6.3-7.2L4 4Z" }),
			xiaomi: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 7h9.5c3.6 0 6.5 2.2 6.5 5s-2.9 5-6.5 5H4v-2.6h9.3c2.1 0 3.7-1 3.7-2.4s-1.6-2.4-3.7-2.4H6.6V17H4V7Zm2.6 2.6v4.8h2.3V9.6H6.6Z" }),
			together: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4.5a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8ZM6.4 13a2.4 2.4 0 1 1 4.8 0 2.4 2.4 0 0 1-4.8 0Zm6.4 0a2.4 2.4 0 1 1 4.8 0 2.4 2.4 0 0 1-4.8 0ZM12 15.8a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8Z" }),
			fireworks: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3l1.7 4.9L18.6 6l-3.4 3.8 4 2.9-4.9.5.9 4.9-3.2-3.8-3.2 3.8.9-4.9-4.9-.5 4-2.9L5.4 6l4.9 1.9L12 3Z" }),
			groq: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 7h13.5A2.5 2.5 0 0 1 20 9.5V13a4 4 0 0 1-4 4H9.5v-2.6H16a1.4 1.4 0 0 0 1.4-1.4v-.4H12v-2.4h5.4V9.6H4V7Zm5.5 2.6v2.4H4V9.6h5.5Z" }),
			mistral: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M4 6h3v3H4V6Zm4.3 0h3v3h-3V6ZM12.7 6h3v3h-3V6ZM17 6h3v3h-3V6ZM4 9.7h3v3.6H4V9.7Zm12.9 0h3v3.6h-3V9.7ZM4 13.3h3v3.6H4v-3.6Zm4.3 0h3v3.6h-3v-3.6Zm4.4 0h3v3.6h-3v-3.6Zm4.3 0h3v3.6h-3v-3.6ZM8.3 17h3v1.6h-3V17Zm4.4 0h3v1.6h-3V17Z",
				transform: "scale(.9) translate(1.2 1.2)"
			}),
			nvidia: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 6.6c4.3 0 7.6 2.3 9 5.4-1.4 3.1-4.7 5.4-9 5.4-4.3 0-7.6-2.3-9-5.4 1.4-3.1 4.7-5.4 9-5.4Zm0 2.2c-2.6 0-4.9 1.2-6.2 3.2 1.3 2 3.6 3.2 6.2 3.2s4.9-1.2 6.2-3.2c-1.3-2-3.6-3.2-6.2-3.2Zm0 1.2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" }),
			azure: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M10.2 4 5 18.6h4.3l1-2.8 4 2.8h4.9L13.4 4h-3.2Zm.8 4.5 2.5 7.6-3.4-2.4.9-5.2Z" }),
			bedrock: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 5h6v6H5V5Zm8 0h6v6h-6V5ZM5 13h6v6H5v-6Zm8 3h6v3h-6v-3Z" }),
			cloudflare: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M16.9 15.4c.2-2-1.2-3.7-3.4-4.1-.3-1.8-1.9-3.2-4-3.2-2.4 0-4.3 1.8-4.5 4.1-1.6.3-2.7 1.6-2.7 3.2 0 1.8 1.5 3.2 3.4 3.2h10.4c1.6 0 2.9-1.2 2.9-2.8 0-1.4-1-2.6-2.4-2.9l.3 2.5Z",
				transform: "scale(.94) translate(.6 1)"
			}),
			vercel: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4.5 20.5 19h-17L12 4.5Z" }),
			baseten: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 5h3.4v4.6H5V5Zm0 6.2h3.4V19H5v-7.8ZM10.3 5h3.4v8.4h-3.4V5Zm0 10h3.4V19h-3.4v-4ZM15.6 5H19v11h-3.4V5Zm0 12.6H19V19h-3.4v-1.4Z" }),
			cerebras: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4a8 8 0 0 1 6.9 4l-2.2 1.3A5.6 5.6 0 0 0 12 6.4 5.6 5.6 0 0 0 6.4 12 5.6 5.6 0 0 0 12 17.6a5.6 5.6 0 0 0 4.7-2.9l2.2 1.3A8 8 0 1 1 12 4Z" }),
			huggingface: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8ZM9.3 8.6a1 1 0 0 1 1 1v1.2a1 1 0 1 1-2 0V9.6a1 1 0 0 1 1-1Zm5.4 0a1 1 0 0 1 1 1v1.2a1 1 0 1 1-2 0V9.6a1 1 0 0 1 1-1ZM8 13.4c1 1.4 2.4 2.1 4 2.1s3-.7 4-2.1c.3.9-.1 1.7-1 2.4a5 5 0 0 1-3 .9 5 5 0 0 1-3-.9c-.9-.7-1.3-1.5-1-2.4Z" }),
			copilot: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9 4h6c.6 2.4.9 5 .9 8S15.6 17.6 15 20H9c-.6-2.4-.9-5-.9-8S8.4 6.4 9 4Zm-3.2 2c-.4 1.9-.6 4-.6 6s.2 4.1.6 6H4.4C3.5 16.2 3 14.2 3 12s.5-4.2 1.4-6h1.4Zm12.4 0h1.4c.9 1.8 1.4 3.8 1.4 6s-.5 4.2-1.4 6h-1.4c.4-1.9.6-4 .6-6s-.2-4.1-.6-6Z" }),
			opencode: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 5h6.4v2.6H7.6v8.8h3.8V19H5V5Zm7.6 0H19v14h-6.4v-2.6h3.8V7.6h-3.8V5Z" }),
			antling: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3.4c.9 0 1.6.7 1.6 1.6 0 .6-.3 1.1-.8 1.4l.8 1.6h4.6l2 8.8c.2 1-.4 1.8-1.4 1.8H5.2c-1 0-1.6-.8-1.4-1.8l2-8.8h4.6l.8-1.6c-.5-.3-.8-.8-.8-1.4 0-.9.7-1.6 1.6-1.6ZM6.2 10.2l-1.4 6.2h14.4l-1.4-6.2H6.2Zm2.3 2.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Zm7 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" }),
			sensenova: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4a8 8 0 0 1 8 8h-2.6A5.4 5.4 0 0 0 12 6.6 5.4 5.4 0 0 0 6.6 12H4a8 8 0 0 1 8-8Zm0 5.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6ZM4 12h2.6A5.4 5.4 0 0 0 12 17.4 5.4 5.4 0 0 0 17.4 12H20a8 8 0 0 1-16 0Z" }),
			scnet: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M4 6h7v2.4H6.4v2.2H11V13H6.4v2.6H11V18H4V6Zm9 0h7v2.4h-4.6v2.2H20V13h-4.6v5H13V6Z",
				transform: "scale(.98)"
			}),
			stepfun: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M5 5h9.4a4.6 4.6 0 0 1 0 9.2H8.4V19H5V5Zm3.4 2.6v4h5.8a2 2 0 0 0 0-4H8.4Z" }),
			tencent: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4c4.4 0 8 2.9 8 6.5 0 3.1-2.6 5.7-6.1 6.4l-.3 2.7c0 .5-.6.8-1 .5l-3.4-2.6C6 16.4 4 13.9 4 10.5 4 6.9 7.6 4 12 4Z" }),
			responses: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 4a8 8 0 1 1-7.4 5H2.8L6 5l3.2 4H6.9A5.6 5.6 0 1 0 12 6.4c-1.7 0-3.2.7-4.2 1.9L6 6.5A8 8 0 0 1 12 4Z" }),
			completions: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M4 5h16v11H9.8L6 19.4V16H4V5Zm2.4 2.4v6.2h11.2V7.4H6.4Z" }),
			anthropiccompat: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
				d: "M6.4 4h11.2c1.3 0 2.4 1.1 2.4 2.4v7.2c0 1.3-1.1 2.4-2.4 2.4H10l-4.2 3.6V16H6.4A2.4 2.4 0 0 1 4 13.6V6.4C4 5.1 5.1 4 6.4 4Z",
				transform: "scale(.92) translate(1 1)"
			}),
			radius: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8Zm0 2.4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 3.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z" }),
			generic: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M10.6 4h2.8l.4 2.3c.6.2 1.2.5 1.7.9l2.2-.8 1.4 2.4-1.7 1.6a7 7 0 0 1 0 2l1.7 1.6-1.4 2.4-2.2-.8c-.5.4-1.1.7-1.7.9l-.4 2.3h-2.8l-.4-2.3a6.6 6.6 0 0 1-1.7-.9l-2.2.8-1.4-2.4 1.7-1.6a7 7 0 0 1 0-2L3.2 8.8l1.4-2.4 2.2.8c.5-.4 1.1-.7 1.7-.9L10.6 4ZM12 9.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z" })
		};
		function ProviderIcon({ id, size = 20 }) {
			const glyph = GLYPHS[id] ?? GLYPHS.generic;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 24 24",
				fill: "currentColor",
				"aria-hidden": "true",
				focusable: "false",
				className: "dmp-provider-icon",
				children: glyph
			});
		}
		//#endregion
		//#region src/client/provider-catalog.ts
		const CUSTOM_TEMPLATES = [
			{
				id: "openai-compatible",
				displayName: "OpenAI Compatible",
				category: "custom",
				icon: "completions",
				baseURL: "https://api.example.com/v1",
				api: "openai-completions",
				hint: "/v1/chat/completions · openai-completions"
			},
			{
				id: "anthropic-compatible",
				displayName: "Anthropic Compatible",
				category: "custom",
				icon: "anthropiccompat",
				baseURL: "https://api.example.com/v1",
				api: "anthropic-messages",
				hint: "/v1/messages · anthropic-messages"
			},
			{
				id: "openai-responses",
				displayName: "OpenAI Responses",
				category: "custom",
				icon: "responses",
				baseURL: "https://api.example.com/v1",
				api: "openai-responses",
				hint: "Responses API · openai-responses"
			},
			{
				id: "openrouter-free",
				displayName: "OpenRouter Free（仅免费）",
				category: "custom",
				icon: "openrouter",
				baseURL: "https://openrouter.ai/api/v1",
				api: "openai-completions",
				credentialRef: "OPENROUTER_API_KEY",
				hint: "启动时自动同步 :free 模型"
			}
		];
		const SUBSCRIPTION_TEMPLATES = [
			{
				id: "github-copilot",
				displayName: "GitHub Copilot",
				category: "subscription",
				icon: "copilot",
				oauthOnly: true
			},
			{
				id: "kimi-for-coding",
				displayName: "Kimi For Coding",
				category: "subscription",
				icon: "kimi",
				oauthOnly: true
			},
			{
				id: "chatgpt-plus-pro",
				displayName: "ChatGPT Plus/Pro",
				category: "subscription",
				icon: "openai",
				oauthOnly: true
			},
			{
				id: "openrouter-oauth",
				displayName: "OpenRouter",
				category: "subscription",
				icon: "openrouter",
				oauthOnly: true
			},
			{
				id: "radius-oauth",
				displayName: "Radius",
				category: "subscription",
				icon: "radius",
				oauthOnly: true
			},
			{
				id: "xai-oauth",
				displayName: "xAI",
				category: "subscription",
				icon: "xai",
				oauthOnly: true
			}
		];
		/** The full DSH built-in provider directory; each adds a catalog-backed route. */
		const CATALOG_TEMPLATES = [
			{
				id: "openai",
				displayName: "OpenAI",
				category: "api-key",
				icon: "openai",
				credentialRef: "OPENAI_API_KEY",
				models: 39,
				hint: "内置目录 · 39 个模型",
				catalog: true
			},
			{
				id: "anthropic",
				displayName: "Anthropic",
				category: "api-key",
				icon: "anthropic",
				credentialRef: "ANTHROPIC_API_KEY",
				models: 11,
				hint: "内置目录 · 11 个模型",
				catalog: true
			},
			{
				id: "deepseek",
				displayName: "DeepSeek",
				category: "api-key",
				icon: "deepseek",
				credentialRef: "DEEPSEEK_API_KEY",
				models: 6,
				hint: "内置目录 · 6 个模型",
				catalog: true
			},
			{
				id: "openrouter",
				displayName: "OpenRouter",
				category: "api-key",
				icon: "openrouter",
				credentialRef: "OPENROUTER_API_KEY",
				models: 362,
				hint: "内置目录 · 362 个模型",
				catalog: true
			},
			{
				id: "google",
				displayName: "Google",
				category: "api-key",
				icon: "google",
				credentialRef: "GEMINI_API_KEY",
				models: 22,
				hint: "内置目录 · 22 个模型",
				catalog: true
			},
			{
				id: "google-vertex",
				displayName: "Google Vertex AI",
				category: "api-key",
				icon: "google",
				models: 9,
				hint: "内置目录 · 需配置项目与凭据",
				catalog: true
			},
			{
				id: "amazon-bedrock",
				displayName: "Amazon Bedrock",
				category: "api-key",
				icon: "bedrock",
				models: 121,
				hint: "内置目录 · 需 AWS 凭据",
				catalog: true
			},
			{
				id: "azure-openai-responses",
				displayName: "Azure OpenAI",
				category: "api-key",
				icon: "azure",
				credentialRef: "AZURE_OPENAI_API_KEY",
				models: 38,
				hint: "内置目录 · 38 个模型",
				catalog: true
			},
			{
				id: "moonshotai",
				displayName: "Moonshot AI",
				category: "api-key",
				icon: "moonshot",
				credentialRef: "MOONSHOT_API_KEY",
				models: 10,
				hint: "内置目录 · 10 个模型",
				catalog: true
			},
			{
				id: "moonshotai-cn",
				displayName: "Moonshot AI CN",
				category: "api-key",
				icon: "moonshot",
				credentialRef: "MOONSHOT_CN_API_KEY",
				models: 10,
				hint: "内置目录 · 中国站",
				catalog: true
			},
			{
				id: "kimi-for-coding-api",
				displayName: "Kimi For Coding",
				category: "api-key",
				icon: "kimi",
				credentialRef: "KIMI_API_KEY",
				models: 4,
				hint: "内置目录 · anthropic-messages",
				catalog: true
			},
			{
				id: "minimax",
				displayName: "MiniMax",
				category: "api-key",
				icon: "minimax",
				credentialRef: "MINIMAX_API_KEY",
				models: 3,
				hint: "内置目录 · 国际站",
				catalog: true
			},
			{
				id: "minimax-cn",
				displayName: "MiniMax CN",
				category: "api-key",
				icon: "minimax",
				credentialRef: "MINIMAX_CN_API_KEY",
				models: 3,
				hint: "内置目录 · 中国站",
				catalog: true
			},
			{
				id: "zai",
				displayName: "Z.AI",
				category: "api-key",
				icon: "zai",
				credentialRef: "ZAI_API_KEY",
				models: 7,
				hint: "内置目录 · GLM 系列",
				catalog: true
			},
			{
				id: "zai-coding-cn",
				displayName: "Z.AI Coding CN",
				category: "api-key",
				icon: "zai",
				credentialRef: "ZAI_CODING_CN_API_KEY",
				models: 10,
				hint: "内置目录 · bigmodel.cn",
				catalog: true
			},
			{
				id: "qwen-token-plan",
				displayName: "Qwen Token Plan",
				category: "api-key",
				icon: "qwen",
				credentialRef: "QWEN_TOKEN_PLAN_API_KEY",
				models: 18,
				hint: "内置目录 · 国际站",
				catalog: true
			},
			{
				id: "qwen-token-plan-cn",
				displayName: "Qwen Token Plan CN",
				category: "api-key",
				icon: "qwen",
				credentialRef: "QWEN_TOKEN_PLAN_CN_API_KEY",
				models: 18,
				hint: "内置目录 · 中国站",
				catalog: true
			},
			{
				id: "qwen-token-plan-individual",
				displayName: "Qwen Token Plan Individual",
				category: "api-key",
				icon: "qwen",
				credentialRef: "QWEN_TOKEN_PLAN_API_KEY",
				models: 9,
				hint: "内置目录 · 个人版",
				catalog: true
			},
			{
				id: "xiaomi",
				displayName: "Xiaomi",
				category: "api-key",
				icon: "xiaomi",
				credentialRef: "XIAOMI_API_KEY",
				models: 3,
				hint: "内置目录 · MiMo 系列",
				catalog: true
			},
			{
				id: "xiaomi-token-plan-ams",
				displayName: "Xiaomi Token Plan AMS",
				category: "api-key",
				icon: "xiaomi",
				credentialRef: "XIAOMI_TOKEN_PLAN_AMS_API_KEY",
				models: 2,
				hint: "内置目录 · 阿姆斯特丹",
				catalog: true
			},
			{
				id: "xiaomi-token-plan-cn",
				displayName: "Xiaomi Token Plan CN",
				category: "api-key",
				icon: "xiaomi",
				credentialRef: "XIAOMI_TOKEN_PLAN_CN_API_KEY",
				models: 2,
				hint: "内置目录 · 中国站",
				catalog: true
			},
			{
				id: "xiaomi-token-plan-sgp",
				displayName: "Xiaomi Token Plan SGP",
				category: "api-key",
				icon: "xiaomi",
				credentialRef: "XIAOMI_TOKEN_PLAN_SGP_API_KEY",
				models: 2,
				hint: "内置目录 · 新加坡",
				catalog: true
			},
			{
				id: "xai",
				displayName: "xAI",
				category: "api-key",
				icon: "xai",
				credentialRef: "XAI_API_KEY",
				models: 3,
				hint: "内置目录 · Grok 系列",
				catalog: true
			},
			{
				id: "mistral",
				displayName: "Mistral",
				category: "api-key",
				icon: "mistral",
				credentialRef: "MISTRAL_API_KEY",
				models: 32,
				hint: "内置目录 · 32 个模型",
				catalog: true
			},
			{
				id: "nvidia",
				displayName: "NVIDIA",
				category: "api-key",
				icon: "nvidia",
				credentialRef: "NVIDIA_API_KEY",
				models: 20,
				hint: "内置目录 · NIM 目录",
				catalog: true
			},
			{
				id: "together",
				displayName: "Together",
				category: "api-key",
				icon: "together",
				credentialRef: "TOGETHER_API_KEY",
				models: 21,
				hint: "内置目录 · 21 个模型",
				catalog: true
			},
			{
				id: "fireworks",
				displayName: "Fireworks",
				category: "api-key",
				icon: "fireworks",
				credentialRef: "FIREWORKS_API_KEY",
				models: 19,
				hint: "内置目录 · 19 个模型",
				catalog: true
			},
			{
				id: "groq",
				displayName: "Groq",
				category: "api-key",
				icon: "groq",
				credentialRef: "GROQ_API_KEY",
				models: 9,
				hint: "内置目录 · 9 个模型",
				catalog: true
			},
			{
				id: "baseten",
				displayName: "Baseten",
				category: "api-key",
				icon: "baseten",
				credentialRef: "BASETEN_API_KEY",
				models: 20,
				hint: "内置目录 · 20 个模型",
				catalog: true
			},
			{
				id: "cerebras",
				displayName: "Cerebras",
				category: "api-key",
				icon: "cerebras",
				credentialRef: "CEREBRAS_API_KEY",
				models: 2,
				hint: "内置目录 · 2 个模型",
				catalog: true
			},
			{
				id: "huggingface",
				displayName: "Hugging Face",
				category: "api-key",
				icon: "huggingface",
				credentialRef: "HF_TOKEN",
				models: 71,
				hint: "内置目录 · Inference Providers",
				catalog: true
			},
			{
				id: "ant-ling",
				displayName: "Ant Ling",
				category: "api-key",
				icon: "antling",
				credentialRef: "ANT_LING_API_KEY",
				models: 3,
				hint: "内置目录 · 3 个模型",
				catalog: true
			},
			{
				id: "opencode",
				displayName: "OpenCode Zen",
				category: "api-key",
				icon: "opencode",
				credentialRef: "OPENCODE_API_KEY",
				models: 63,
				hint: "内置目录 · 63 个模型",
				catalog: true
			},
			{
				id: "opencode-go",
				displayName: "OpenCode Go",
				category: "api-key",
				icon: "opencode",
				credentialRef: "OPENCODE_API_KEY",
				models: 27,
				hint: "内置目录 · 27 个模型",
				catalog: true
			},
			{
				id: "vercel-ai-gateway",
				displayName: "Vercel AI Gateway",
				category: "api-key",
				icon: "vercel",
				credentialRef: "AI_GATEWAY_API_KEY",
				models: 233,
				hint: "内置目录 · 233 个模型",
				catalog: true
			},
			{
				id: "cloudflare-ai-gateway",
				displayName: "Cloudflare AI Gateway",
				category: "api-key",
				icon: "cloudflare",
				models: 50,
				hint: "内置目录 · 需账号与网关 ID",
				catalog: true
			},
			{
				id: "cloudflare-workers-ai",
				displayName: "Cloudflare Workers AI",
				category: "api-key",
				icon: "cloudflare",
				models: 18,
				hint: "内置目录 · 18 个模型",
				catalog: true
			},
			{
				id: "radius",
				displayName: "Radius",
				category: "api-key",
				icon: "radius",
				models: 0,
				hint: "内置目录 · 0 个模型",
				catalog: true
			},
			{
				id: "github-copilot-api",
				displayName: "GitHub Copilot",
				category: "api-key",
				icon: "copilot",
				credentialRef: "COPILOT_GITHUB_TOKEN",
				models: 60,
				hint: "内置目录 · 支持令牌接入",
				catalog: true
			}
		];
		[
			...CUSTOM_TEMPLATES,
			...SUBSCRIPTION_TEMPLATES,
			...CATALOG_TEMPLATES
		];
		/** Fuzzy filter across display name, id, hint, and endpoint. */
		function filterTemplates(templates, query) {
			const needle = query.trim().toLocaleLowerCase();
			if (needle === "") return [...templates];
			return templates.filter((template) => `${template.displayName} ${template.id} ${template.hint ?? ""} ${template.baseURL ?? ""}`.toLocaleLowerCase().includes(needle));
		}
		const BRAND_RULES = [
			{
				icon: "openrouter",
				brandName: "OpenRouter",
				patterns: [/openrouter/iu]
			},
			{
				icon: "deepseek",
				brandName: "DeepSeek",
				patterns: [/deepseek/iu]
			},
			{
				icon: "anthropic",
				brandName: "Anthropic",
				patterns: [/anthropic|claude/iu]
			},
			{
				icon: "openai",
				brandName: "OpenAI",
				patterns: [/openai|chatgpt|gpt-|^o[134](-|$)/iu]
			},
			{
				icon: "google",
				brandName: "Google",
				patterns: [/google|gemini|generativelanguage|vertex/iu]
			},
			{
				icon: "moonshot",
				brandName: "Moonshot AI",
				patterns: [/moonshot|kimi/iu]
			},
			{
				icon: "minimax",
				brandName: "MiniMax",
				patterns: [/minimax/iu]
			},
			{
				icon: "zai",
				brandName: "Z.AI",
				patterns: [/z-?ai|bigmodel|glm|zhipu/iu]
			},
			{
				icon: "qwen",
				brandName: "Qwen",
				patterns: [/qwen|alibaba|aliyun|dashscope|token-plan/iu]
			},
			{
				icon: "xai",
				brandName: "xAI",
				patterns: [/^x-?ai$|grok|x\.ai/iu]
			},
			{
				icon: "xiaomi",
				brandName: "Xiaomi",
				patterns: [/xiaomi|mimo/iu]
			},
			{
				icon: "mistral",
				brandName: "Mistral",
				patterns: [/mistral/iu]
			},
			{
				icon: "nvidia",
				brandName: "NVIDIA",
				patterns: [/nvidia|nemotron/iu]
			},
			{
				icon: "together",
				brandName: "Together",
				patterns: [/together/iu]
			},
			{
				icon: "fireworks",
				brandName: "Fireworks",
				patterns: [/fireworks/iu]
			},
			{
				icon: "groq",
				brandName: "Groq",
				patterns: [/groq/iu]
			},
			{
				icon: "azure",
				brandName: "Azure OpenAI",
				patterns: [/azure/iu]
			},
			{
				icon: "bedrock",
				brandName: "Amazon Bedrock",
				patterns: [/bedrock|amazon/iu]
			},
			{
				icon: "cloudflare",
				brandName: "Cloudflare",
				patterns: [/cloudflare/iu]
			},
			{
				icon: "vercel",
				brandName: "Vercel",
				patterns: [/vercel/iu]
			},
			{
				icon: "baseten",
				brandName: "Baseten",
				patterns: [/baseten/iu]
			},
			{
				icon: "cerebras",
				brandName: "Cerebras",
				patterns: [/cerebras/iu]
			},
			{
				icon: "huggingface",
				brandName: "Hugging Face",
				patterns: [/huggingface|hf[-_]/iu]
			},
			{
				icon: "copilot",
				brandName: "GitHub Copilot",
				patterns: [/copilot/iu]
			},
			{
				icon: "opencode",
				brandName: "OpenCode",
				patterns: [/opencode/iu]
			},
			{
				icon: "antling",
				brandName: "Ant Ling",
				patterns: [/ant-?ling/iu]
			},
			{
				icon: "kimi",
				brandName: "Kimi",
				patterns: [/kimi/iu]
			},
			{
				icon: "stepfun",
				brandName: "StepFun",
				patterns: [/stepfun|step-/iu]
			},
			{
				icon: "tencent",
				brandName: "Tencent",
				patterns: [/tencent|hy[34]/iu]
			},
			{
				icon: "sensenova",
				brandName: "SenseNova",
				patterns: [/sensenova|sensecore/iu]
			},
			{
				icon: "scnet",
				brandName: "国家超算",
				patterns: [/scnet|超算/iu]
			},
			{
				icon: "generic",
				brandName: "",
				patterns: []
			}
		];
		/** Resolve the icon (and optional brand name) for a configured provider. */
		function providerMeta(providerId, profile) {
			const id = providerId.toLocaleLowerCase();
			const host = hostOf(profile?.baseURL);
			for (const rule of BRAND_RULES) {
				if (rule.patterns.length === 0) continue;
				if (rule.patterns.some((pattern) => pattern.test(id) || host !== "" && pattern.test(host))) return {
					icon: rule.icon,
					brandName: rule.brandName === "" ? void 0 : rule.brandName
				};
			}
			return { icon: "generic" };
		}
		function hostOf(value) {
			if (typeof value !== "string" || value.trim() === "") return "";
			try {
				return new URL(value).hostname;
			} catch {
				return value.toLocaleLowerCase();
			}
		}
		//#endregion
		//#region assets/model-presets.json
		var model_presets_default = {
			version: 4,
			updatedAt: "2026-09-19",
			presets: [
				{
					"id": "amazon-bedrock-amazon-nova-2-lite-v1:0",
					"name": "Amazon Bedrock: Nova 2 Lite",
					"aliases": ["amazon-nova-2-lite-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-amazon-nova-lite-v1:0",
					"name": "Amazon Bedrock: Nova Lite",
					"aliases": ["amazon-nova-lite-v1:0"],
					"contextWindow": 3e5,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-amazon-nova-micro-v1:0",
					"name": "Amazon Bedrock: Nova Micro",
					"aliases": ["amazon-nova-micro-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-amazon-nova-pro-v1:0",
					"name": "Amazon Bedrock: Nova Pro",
					"aliases": ["amazon-nova-pro-v1:0"],
					"contextWindow": 3e5,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-fable-5",
					"name": "Amazon Bedrock: Claude Fable 5",
					"aliases": ["anthropic-claude-fable-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-fable-5-1",
					"name": "Amazon Bedrock: Claude Fable 5.1",
					"aliases": ["anthropic-claude-fable-5-1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-haiku-4-5-20251001-v1:0",
					"name": "Amazon Bedrock: Claude Haiku 4.5",
					"aliases": ["anthropic-claude-haiku-4-5-20251001-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-opus-4-1-20250805-v1:0",
					"name": "Amazon Bedrock: Claude Opus 4.1",
					"aliases": ["anthropic-claude-opus-4-1-20250805-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-opus-4-5-20251101-v1:0",
					"name": "Amazon Bedrock: Claude Opus 4.5",
					"aliases": ["anthropic-claude-opus-4-5-20251101-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-opus-4-6-v1",
					"name": "Amazon Bedrock: Claude Opus 4.6",
					"aliases": ["anthropic-claude-opus-4-6-v1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-opus-4-7",
					"name": "Amazon Bedrock: Claude Opus 4.7",
					"aliases": ["anthropic-claude-opus-4-7"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-opus-4-8",
					"name": "Amazon Bedrock: Claude Opus 4.8",
					"aliases": ["anthropic-claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-sonnet-4-5-20250929-v1:0",
					"name": "Amazon Bedrock: Claude Sonnet 4.5",
					"aliases": ["anthropic-claude-sonnet-4-5-20250929-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-sonnet-4-6",
					"name": "Amazon Bedrock: Claude Sonnet 4.6",
					"aliases": ["anthropic-claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-anthropic-claude-sonnet-5",
					"name": "Amazon Bedrock: Claude Sonnet 5",
					"aliases": ["anthropic-claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-haiku-4-5-20251001-v1:0",
					"name": "Amazon Bedrock: Claude Haiku 4.5 (AU)",
					"aliases": ["au-anthropic-claude-haiku-4-5-20251001-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-opus-4-6-v1",
					"name": "Amazon Bedrock: AU Anthropic Claude Opus 4.6",
					"aliases": ["au-anthropic-claude-opus-4-6-v1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-opus-4-8",
					"name": "Amazon Bedrock: Claude Opus 4.8 (AU)",
					"aliases": ["au-anthropic-claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-opus-5",
					"name": "Amazon Bedrock: Claude Opus 5 (AU)",
					"aliases": ["au-anthropic-claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-sonnet-4-5-20250929-v1:0",
					"name": "Amazon Bedrock: Claude Sonnet 4.5 (AU)",
					"aliases": ["au-anthropic-claude-sonnet-4-5-20250929-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-sonnet-4-6",
					"name": "Amazon Bedrock: AU Anthropic Claude Sonnet 4.6",
					"aliases": ["au-anthropic-claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-au-anthropic-claude-sonnet-5",
					"name": "Amazon Bedrock: Claude Sonnet 5 (AU)",
					"aliases": ["au-anthropic-claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-deepseek-r1-v1:0",
					"name": "Amazon Bedrock: DeepSeek-R1",
					"aliases": ["deepseek-r1-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-deepseek-v3-v1:0",
					"name": "Amazon Bedrock: DeepSeek-V3.1",
					"aliases": ["deepseek-v3-v1:0"],
					"contextWindow": 163840,
					"maxTokens": 81920,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-fable-5",
					"name": "Amazon Bedrock: Claude Fable 5 (EU)",
					"aliases": ["eu-anthropic-claude-fable-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-haiku-4-5-20251001-v1:0",
					"name": "Amazon Bedrock: Claude Haiku 4.5 (EU)",
					"aliases": ["eu-anthropic-claude-haiku-4-5-20251001-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-opus-4-5-20251101-v1:0",
					"name": "Amazon Bedrock: Claude Opus 4.5 (EU)",
					"aliases": ["eu-anthropic-claude-opus-4-5-20251101-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-opus-4-6-v1",
					"name": "Amazon Bedrock: Claude Opus 4.6 (EU)",
					"aliases": ["eu-anthropic-claude-opus-4-6-v1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-opus-4-7",
					"name": "Amazon Bedrock: Claude Opus 4.7 (EU)",
					"aliases": ["eu-anthropic-claude-opus-4-7"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-opus-4-8",
					"name": "Amazon Bedrock: Claude Opus 4.8 (EU)",
					"aliases": ["eu-anthropic-claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-opus-5",
					"name": "Amazon Bedrock: Claude Opus 5 (EU)",
					"aliases": ["eu-anthropic-claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-sonnet-4-5-20250929-v1:0",
					"name": "Amazon Bedrock: Claude Sonnet 4.5 (EU)",
					"aliases": ["eu-anthropic-claude-sonnet-4-5-20250929-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-sonnet-4-6",
					"name": "Amazon Bedrock: Claude Sonnet 4.6 (EU)",
					"aliases": ["eu-anthropic-claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-eu-anthropic-claude-sonnet-5",
					"name": "Amazon Bedrock: Claude Sonnet 5 (EU)",
					"aliases": ["eu-anthropic-claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-fable-5",
					"name": "Amazon Bedrock: Claude Fable 5 (Global)",
					"aliases": ["global-anthropic-claude-fable-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-fable-5-1",
					"name": "Amazon Bedrock: Claude Fable 5.1 (Global)",
					"aliases": ["global-anthropic-claude-fable-5-1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-haiku-4-5-20251001-v1:0",
					"name": "Amazon Bedrock: Claude Haiku 4.5 (Global)",
					"aliases": ["global-anthropic-claude-haiku-4-5-20251001-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-opus-4-5-20251101-v1:0",
					"name": "Amazon Bedrock: Claude Opus 4.5 (Global)",
					"aliases": ["global-anthropic-claude-opus-4-5-20251101-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-opus-4-6-v1",
					"name": "Amazon Bedrock: Claude Opus 4.6 (Global)",
					"aliases": ["global-anthropic-claude-opus-4-6-v1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-opus-4-7",
					"name": "Amazon Bedrock: Claude Opus 4.7 (Global)",
					"aliases": ["global-anthropic-claude-opus-4-7"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-opus-4-8",
					"name": "Amazon Bedrock: Claude Opus 4.8 (Global)",
					"aliases": ["global-anthropic-claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-opus-5",
					"name": "Amazon Bedrock: Claude Opus 5 (Global)",
					"aliases": ["global-anthropic-claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-sonnet-4-5-20250929-v1:0",
					"name": "Amazon Bedrock: Claude Sonnet 4.5 (Global)",
					"aliases": ["global-anthropic-claude-sonnet-4-5-20250929-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-sonnet-4-6",
					"name": "Amazon Bedrock: Claude Sonnet 4.6 (Global)",
					"aliases": ["global-anthropic-claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-anthropic-claude-sonnet-5",
					"name": "Amazon Bedrock: Claude Sonnet 5 (Global)",
					"aliases": ["global-anthropic-claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-openai-gpt-5-6-luna",
					"name": "Amazon Bedrock: GPT-5.6 Luna (Global)",
					"aliases": ["global-openai-gpt-5-6-luna"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-openai-gpt-5-6-sol",
					"name": "Amazon Bedrock: GPT-5.6 Sol (Global)",
					"aliases": ["global-openai-gpt-5-6-sol"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-global-openai-gpt-5-6-terra",
					"name": "Amazon Bedrock: GPT-5.6 Terra (Global)",
					"aliases": ["global-openai-gpt-5-6-terra"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-google-gemma-3-27b-it",
					"name": "Amazon Bedrock: Google Gemma 3 27B Instruct",
					"aliases": ["google-gemma-3-27b-it"],
					"contextWindow": 202752,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-google-gemma-3-4b-it",
					"name": "Amazon Bedrock: Gemma 3 4B IT",
					"aliases": ["google-gemma-3-4b-it"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-haiku-4-5-20251001-v1:0",
					"name": "Amazon Bedrock: Claude Haiku 4.5 (JP)",
					"aliases": ["jp-anthropic-claude-haiku-4-5-20251001-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-opus-4-7",
					"name": "Amazon Bedrock: Claude Opus 4.7 (JP)",
					"aliases": ["jp-anthropic-claude-opus-4-7"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-opus-4-8",
					"name": "Amazon Bedrock: Claude Opus 4.8 (JP)",
					"aliases": ["jp-anthropic-claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-opus-5",
					"name": "Amazon Bedrock: Claude Opus 5 (JP)",
					"aliases": ["jp-anthropic-claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-sonnet-4-5-20250929-v1:0",
					"name": "Amazon Bedrock: Claude Sonnet 4.5 (JP)",
					"aliases": ["jp-anthropic-claude-sonnet-4-5-20250929-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-sonnet-4-6",
					"name": "Amazon Bedrock: Claude Sonnet 4.6 (JP)",
					"aliases": ["jp-anthropic-claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-jp-anthropic-claude-sonnet-5",
					"name": "Amazon Bedrock: Claude Sonnet 5 (JP)",
					"aliases": ["jp-anthropic-claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-meta-llama3-1-70b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 3.1 70B Instruct",
					"aliases": ["meta-llama3-1-70b-instruct-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-meta-llama3-1-8b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 3.1 8B Instruct",
					"aliases": ["meta-llama3-1-8b-instruct-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-meta-llama3-3-70b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 3.3 70B Instruct",
					"aliases": ["meta-llama3-3-70b-instruct-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-meta-llama4-maverick-17b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 4 Maverick 17B Instruct",
					"aliases": ["meta-llama4-maverick-17b-instruct-v1:0"],
					"contextWindow": 1e6,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-meta-llama4-scout-17b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 4 Scout 17B Instruct",
					"aliases": ["meta-llama4-scout-17b-instruct-v1:0"],
					"contextWindow": 35e5,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-minimax-minimax-m2",
					"name": "Amazon Bedrock: MiniMax M2",
					"aliases": ["minimax-minimax-m2"],
					"contextWindow": 204608,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-minimax-minimax-m2-1",
					"name": "Amazon Bedrock: MiniMax M2.1",
					"aliases": ["minimax-minimax-m2-1"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-minimax-minimax-m2-5",
					"name": "Amazon Bedrock: MiniMax M2.5",
					"aliases": ["minimax-minimax-m2-5"],
					"contextWindow": 196608,
					"maxTokens": 98304,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-devstral-2-123b",
					"name": "Amazon Bedrock: Devstral 2 123B",
					"aliases": ["mistral-devstral-2-123b"],
					"contextWindow": 256e3,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-magistral-small-2509",
					"name": "Amazon Bedrock: Magistral Small 1.2",
					"aliases": ["mistral-magistral-small-2509"],
					"contextWindow": 128e3,
					"maxTokens": 4e4,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-ministral-3-14b-instruct",
					"name": "Amazon Bedrock: Ministral 14B 3.0",
					"aliases": ["mistral-ministral-3-14b-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-ministral-3-3b-instruct",
					"name": "Amazon Bedrock: Ministral 3 3B",
					"aliases": ["mistral-ministral-3-3b-instruct"],
					"contextWindow": 256e3,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-ministral-3-8b-instruct",
					"name": "Amazon Bedrock: Ministral 3 8B",
					"aliases": ["mistral-ministral-3-8b-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-mistral-large-3-675b-instruct",
					"name": "Amazon Bedrock: Mistral Large 3",
					"aliases": ["mistral-mistral-large-3-675b-instruct"],
					"contextWindow": 256e3,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-pixtral-large-2502-v1:0",
					"name": "Amazon Bedrock: Pixtral Large (25.02)",
					"aliases": ["mistral-pixtral-large-2502-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-voxtral-mini-3b-2507",
					"name": "Amazon Bedrock: Voxtral Mini 3B 2507",
					"aliases": ["mistral-voxtral-mini-3b-2507"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-mistral-voxtral-small-24b-2507",
					"name": "Amazon Bedrock: Voxtral Small 24B 2507",
					"aliases": ["mistral-voxtral-small-24b-2507"],
					"contextWindow": 32e3,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-moonshot-kimi-k2-thinking",
					"name": "Amazon Bedrock: Kimi K2 Thinking",
					"aliases": ["moonshot-kimi-k2-thinking"],
					"contextWindow": 262143,
					"maxTokens": 16e3,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-moonshotai-kimi-k2-5",
					"name": "Amazon Bedrock: Kimi K2.5",
					"aliases": ["moonshotai-kimi-k2-5"],
					"contextWindow": 262143,
					"maxTokens": 16e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-nvidia-nemotron-nano-12b-v2",
					"name": "Amazon Bedrock: NVIDIA Nemotron Nano 12B v2 VL BF16",
					"aliases": ["nvidia-nemotron-nano-12b-v2"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-nvidia-nemotron-nano-3-30b",
					"name": "Amazon Bedrock: NVIDIA Nemotron Nano 3 30B",
					"aliases": ["nvidia-nemotron-nano-3-30b"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-nvidia-nemotron-nano-9b-v2",
					"name": "Amazon Bedrock: NVIDIA Nemotron Nano 9B v2",
					"aliases": ["nvidia-nemotron-nano-9b-v2"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-nvidia-nemotron-super-3-120b",
					"name": "Amazon Bedrock: NVIDIA Nemotron 3 Super 120B A12B",
					"aliases": ["nvidia-nemotron-super-3-120b"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-5-4",
					"name": "Amazon Bedrock: GPT-5.4",
					"aliases": ["openai-gpt-5-4"],
					"contextWindow": 272e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-5-5",
					"name": "Amazon Bedrock: GPT-5.5",
					"aliases": ["openai-gpt-5-5"],
					"contextWindow": 272e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-5-6-luna",
					"name": "Amazon Bedrock: GPT-5.6 Luna",
					"aliases": ["openai-gpt-5-6-luna"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-5-6-sol",
					"name": "Amazon Bedrock: GPT-5.6 Sol",
					"aliases": ["openai-gpt-5-6-sol"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-5-6-terra",
					"name": "Amazon Bedrock: GPT-5.6 Terra",
					"aliases": ["openai-gpt-5-6-terra"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-oss-120b",
					"name": "Amazon Bedrock: gpt-oss-120b",
					"aliases": ["openai-gpt-oss-120b"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-oss-120b-1:0",
					"name": "Amazon Bedrock: gpt-oss-120b",
					"aliases": ["openai-gpt-oss-120b-1:0"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-oss-20b",
					"name": "Amazon Bedrock: gpt-oss-20b",
					"aliases": ["openai-gpt-oss-20b"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-oss-20b-1:0",
					"name": "Amazon Bedrock: gpt-oss-20b",
					"aliases": ["openai-gpt-oss-20b-1:0"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-oss-safeguard-120b",
					"name": "Amazon Bedrock: GPT OSS Safeguard 120B",
					"aliases": ["openai-gpt-oss-safeguard-120b"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-openai-gpt-oss-safeguard-20b",
					"name": "Amazon Bedrock: GPT OSS Safeguard 20B",
					"aliases": ["openai-gpt-oss-safeguard-20b"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-235b-a22b-2507-v1:0",
					"name": "Amazon Bedrock: Qwen3 235B A22B 2507",
					"aliases": ["qwen-qwen3-235b-a22b-2507-v1:0"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-32b-v1:0",
					"name": "Amazon Bedrock: Qwen3 32B (dense)",
					"aliases": ["qwen-qwen3-32b-v1:0"],
					"contextWindow": 16384,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-coder-30b-a3b-v1:0",
					"name": "Amazon Bedrock: Qwen3 Coder 30B A3B Instruct",
					"aliases": ["qwen-qwen3-coder-30b-a3b-v1:0"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-coder-480b-a35b-v1:0",
					"name": "Amazon Bedrock: Qwen3 Coder 480B A35B Instruct",
					"aliases": ["qwen-qwen3-coder-480b-a35b-v1:0"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-coder-next",
					"name": "Amazon Bedrock: Qwen3 Coder Next",
					"aliases": ["qwen-qwen3-coder-next"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-next-80b-a3b",
					"name": "Amazon Bedrock: Qwen/Qwen3-Next-80B-A3B-Instruct",
					"aliases": ["qwen-qwen3-next-80b-a3b"],
					"contextWindow": 262e3,
					"maxTokens": 262e3,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-qwen-qwen3-vl-235b-a22b",
					"name": "Amazon Bedrock: Qwen/Qwen3-VL-235B-A22B-Instruct",
					"aliases": ["qwen-qwen3-vl-235b-a22b"],
					"contextWindow": 262e3,
					"maxTokens": 262e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-fable-5",
					"name": "Amazon Bedrock: Claude Fable 5 (US)",
					"aliases": ["us-anthropic-claude-fable-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-fable-5-1",
					"name": "Amazon Bedrock: Claude Fable 5.1 (US)",
					"aliases": ["us-anthropic-claude-fable-5-1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-haiku-4-5-20251001-v1:0",
					"name": "Amazon Bedrock: Claude Haiku 4.5 (US)",
					"aliases": ["us-anthropic-claude-haiku-4-5-20251001-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-opus-4-1-20250805-v1:0",
					"name": "Amazon Bedrock: Claude Opus 4.1 (US)",
					"aliases": ["us-anthropic-claude-opus-4-1-20250805-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-opus-4-5-20251101-v1:0",
					"name": "Amazon Bedrock: Claude Opus 4.5 (US)",
					"aliases": ["us-anthropic-claude-opus-4-5-20251101-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-opus-4-6-v1",
					"name": "Amazon Bedrock: Claude Opus 4.6 (US)",
					"aliases": ["us-anthropic-claude-opus-4-6-v1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-opus-4-7",
					"name": "Amazon Bedrock: Claude Opus 4.7 (US)",
					"aliases": ["us-anthropic-claude-opus-4-7"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-opus-4-8",
					"name": "Amazon Bedrock: Claude Opus 4.8 (US)",
					"aliases": ["us-anthropic-claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-opus-5",
					"name": "Amazon Bedrock: Claude Opus 5 (US)",
					"aliases": ["us-anthropic-claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-sonnet-4-5-20250929-v1:0",
					"name": "Amazon Bedrock: Claude Sonnet 4.5 (US)",
					"aliases": ["us-anthropic-claude-sonnet-4-5-20250929-v1:0"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-sonnet-4-6",
					"name": "Amazon Bedrock: Claude Sonnet 4.6 (US)",
					"aliases": ["us-anthropic-claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-anthropic-claude-sonnet-5",
					"name": "Amazon Bedrock: Claude Sonnet 5 (US)",
					"aliases": ["us-anthropic-claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-deepseek-r1-v1:0",
					"name": "Amazon Bedrock: DeepSeek-R1 (US)",
					"aliases": ["us-deepseek-r1-v1:0"],
					"contextWindow": 128e3,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-meta-llama4-maverick-17b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 4 Maverick 17B Instruct (US)",
					"aliases": ["us-meta-llama4-maverick-17b-instruct-v1:0"],
					"contextWindow": 1e6,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-us-meta-llama4-scout-17b-instruct-v1:0",
					"name": "Amazon Bedrock: Llama 4 Scout 17B Instruct (US)",
					"aliases": ["us-meta-llama4-scout-17b-instruct-v1:0"],
					"contextWindow": 35e5,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-writer-palmyra-x4-v1:0",
					"name": "Amazon Bedrock: Palmyra X4",
					"aliases": ["writer-palmyra-x4-v1:0"],
					"contextWindow": 122880,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-writer-palmyra-x5-v1:0",
					"name": "Amazon Bedrock: Palmyra X5",
					"aliases": ["writer-palmyra-x5-v1:0"],
					"contextWindow": 104e4,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-xai-grok-4-3",
					"name": "Amazon Bedrock: Grok 4.3",
					"aliases": ["xai-grok-4-3"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-xai-grok-4-6",
					"name": "Amazon Bedrock: Grok 4.6",
					"aliases": ["xai-grok-4-6"],
					"contextWindow": 5e5,
					"maxTokens": 5e5,
					"input": ["text", "image"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-zai-glm-4-7",
					"name": "Amazon Bedrock: GLM-4.7",
					"aliases": ["zai-glm-4-7"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-zai-glm-4-7-flash",
					"name": "Amazon Bedrock: GLM-4.7-Flash",
					"aliases": ["zai-glm-4-7-flash"],
					"contextWindow": 2e5,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "amazon-bedrock-zai-glm-5",
					"name": "Amazon Bedrock: GLM-5",
					"aliases": ["zai-glm-5"],
					"contextWindow": 202752,
					"maxTokens": 101376,
					"input": ["text"],
					"sourceLabel": "AWS Bedrock docs",
					"sourceUrl": "https://docs.aws.amazon.com/bedrock/"
				},
				{
					"id": "ant-ling-ling-2-6-1t",
					"name": "Ant Ling: Ling 2.6 1T",
					"aliases": ["ling-2-6-1t"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "Ant Ling docs",
					"sourceUrl": "https://ling.antgroup.com/"
				},
				{
					"id": "ant-ling-ling-2-6-flash",
					"name": "Ant Ling: Ling 2.6 Flash",
					"aliases": ["ling-2-6-flash"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "Ant Ling docs",
					"sourceUrl": "https://ling.antgroup.com/"
				},
				{
					"id": "ant-ling-ring-2-6-1t",
					"name": "Ant Ling: Ring 2.6 1T",
					"aliases": ["ring-2-6-1t"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "Ant Ling docs",
					"sourceUrl": "https://ling.antgroup.com/"
				},
				{
					"id": "anthropic-claude-fable-5",
					"name": "Anthropic Claude Fable 5",
					"aliases": ["claude-fable-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-fable-5-1",
					"name": "Anthropic: Claude Fable 5.1",
					"aliases": ["claude-fable-5-1"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-haiku-4-5-20251001",
					"name": "Anthropic: Claude Haiku 4.5",
					"aliases": ["claude-haiku-4-5-20251001"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-haiku-4.5",
					"name": "Anthropic Claude Haiku 4.5",
					"aliases": ["claude-haiku-4-5"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "anthropic-claude-opus-4-5",
					"name": "Anthropic: Claude Opus 4.5 (latest)",
					"aliases": ["claude-opus-4-5"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-opus-4-5-20251101",
					"name": "Anthropic: Claude Opus 4.5",
					"aliases": ["claude-opus-4-5-20251101"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-opus-4-7",
					"name": "Anthropic: Claude Opus 4.7",
					"aliases": ["claude-opus-4-7"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-opus-4.6",
					"name": "Anthropic Claude Opus 4.6",
					"aliases": ["claude-opus-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "anthropic-claude-opus-4.8",
					"name": "Anthropic Claude Opus 4.8",
					"aliases": ["claude-opus-4-8"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-opus-5",
					"name": "Anthropic Claude Opus 5",
					"aliases": ["claude-opus-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-sonnet-4-5",
					"name": "Anthropic: Claude Sonnet 4.5 (latest)",
					"aliases": ["claude-sonnet-4-5"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-sonnet-4-5-20250929",
					"name": "Anthropic: Claude Sonnet 4.5",
					"aliases": ["claude-sonnet-4-5-20250929"],
					"contextWindow": 1e6,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "anthropic-claude-sonnet-4.6",
					"name": "Anthropic Claude Sonnet 4.6",
					"aliases": ["claude-sonnet-4-6"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "max": "max" },
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "anthropic-claude-sonnet-5",
					"name": "Anthropic Claude Sonnet 5",
					"aliases": ["claude-sonnet-5"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "Anthropic model overview",
					"sourceUrl": "https://docs.anthropic.com/en/docs/about-claude/models/overview"
				},
				{
					"id": "baseten-glm-5-2-fast",
					"name": "Baseten: GLM 5.2 Fast",
					"aliases": ["glm-5-2-fast", "zai-org/glm-5-2-fast"],
					"contextWindow": 1048576,
					"maxTokens": 262144,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Baseten model docs",
					"sourceUrl": "https://docs.baseten.co/"
				},
				{
					"id": "baseten-glm-5-3-fast",
					"name": "Baseten: GLM 5.3 Fast",
					"aliases": ["glm-5-3-fast", "zai-org/glm-5-3-fast"],
					"contextWindow": 1048576,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Baseten model docs",
					"sourceUrl": "https://docs.baseten.co/"
				},
				{
					"id": "baseten-nemotron-120b-a12b",
					"name": "Baseten: Nemotron Super",
					"aliases": ["nemotron-120b-a12b", "nvidia/nemotron-120b-a12b"],
					"contextWindow": 202800,
					"maxTokens": 202800,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "off",
						"high": "high"
					},
					"sourceLabel": "Baseten model docs",
					"sourceUrl": "https://docs.baseten.co/"
				},
				{
					"id": "baseten-nvidia-nemotron-3-ultra-550b-a55b",
					"name": "Baseten: Nemotron Ultra",
					"aliases": ["nvidia-nemotron-3-ultra-550b-a55b", "nvidia/nvidia-nemotron-3-ultra-550b-a55b"],
					"contextWindow": 202800,
					"maxTokens": 202800,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "off",
						"high": "high"
					},
					"sourceLabel": "Baseten model docs",
					"sourceUrl": "https://docs.baseten.co/"
				},
				{
					"id": "cerebras-gemma-4-31b",
					"name": "Cerebras: Gemma 4 31B IT",
					"aliases": ["gemma-4-31b"],
					"contextWindow": 131072,
					"maxTokens": 40960,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "Cerebras model docs",
					"sourceUrl": "https://inference-docs.cerebras.ai/models/overview"
				},
				{
					"id": "cloudflare-workers-ai-granite-4-0-h-micro",
					"name": "Cloudflare Workers AI: Granite 4.0 H Micro",
					"aliases": ["granite-4-0-h-micro", "@cf/ibm-granite/granite-4-0-h-micro"],
					"contextWindow": 131e3,
					"maxTokens": 131e3,
					"input": ["text"],
					"sourceLabel": "Cloudflare Workers AI docs",
					"sourceUrl": "https://developers.cloudflare.com/workers-ai/"
				},
				{
					"id": "cloudflare-workers-ai-llama-3-3-70b-instruct-fp8-fast",
					"name": "Cloudflare Workers AI: Llama 3.3 70B Instruct fp8 Fast",
					"aliases": ["llama-3-3-70b-instruct-fp8-fast", "@cf/meta/llama-3-3-70b-instruct-fp8-fast"],
					"contextWindow": 24e3,
					"maxTokens": 24e3,
					"input": ["text"],
					"sourceLabel": "Cloudflare Workers AI docs",
					"sourceUrl": "https://developers.cloudflare.com/workers-ai/"
				},
				{
					"id": "cloudflare-workers-ai-llama-4-scout-17b-16e-instruct",
					"name": "Cloudflare Workers AI: Llama 4 Scout 17B 16E Instruct",
					"aliases": ["llama-4-scout-17b-16e-instruct", "@cf/meta/llama-4-scout-17b-16e-instruct"],
					"contextWindow": 131e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "Cloudflare Workers AI docs",
					"sourceUrl": "https://developers.cloudflare.com/workers-ai/"
				},
				{
					"id": "cloudflare-workers-ai-mistral-small-3-1-24b-instruct",
					"name": "Cloudflare Workers AI: Mistral Small 3.1 24B Instruct",
					"aliases": ["mistral-small-3-1-24b-instruct", "@cf/mistralai/mistral-small-3-1-24b-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Cloudflare Workers AI docs",
					"sourceUrl": "https://developers.cloudflare.com/workers-ai/"
				},
				{
					"id": "cloudflare-workers-ai-nemotron-3-120b-a12b",
					"name": "Cloudflare Workers AI: Nemotron 3 Super 120B",
					"aliases": ["nemotron-3-120b-a12b", "@cf/nvidia/nemotron-3-120b-a12b"],
					"contextWindow": 256e3,
					"maxTokens": 256e3,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "Cloudflare Workers AI docs",
					"sourceUrl": "https://developers.cloudflare.com/workers-ai/"
				},
				{
					"id": "cloudflare-workers-ai-qwen3-30b-a3b-fp8",
					"name": "Cloudflare Workers AI: Qwen3 30B A3b fp8",
					"aliases": ["qwen3-30b-a3b-fp8", "@cf/qwen/qwen3-30b-a3b-fp8"],
					"contextWindow": 32768,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "Cloudflare Workers AI docs",
					"sourceUrl": "https://developers.cloudflare.com/workers-ai/"
				},
				{
					"id": "deepseek-v4-flash",
					"name": "DeepSeek V4 Flash",
					"aliases": ["deepseek-v4-flash"],
					"contextWindow": 1e6,
					"maxTokens": 384e3,
					"input": ["text"],
					"reasoningEfforts": {
						"low": "low",
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
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "DeepSeek API docs",
					"sourceUrl": "https://api-docs.deepseek.com/quick_start/pricing"
				},
				{
					"id": "deepseek-v4-pro",
					"name": "DeepSeek V4 Pro",
					"aliases": ["deepseek-v4-pro"],
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
					"id": "fireworks-glm-5p2",
					"name": "Fireworks: GLM 5.2",
					"aliases": ["glm-5p2", "accounts/fireworks/models/glm-5p2"],
					"contextWindow": 1048575,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"low": "high",
						"medium": "high",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-glm-5p2-fast",
					"name": "Fireworks: GLM 5.2 Fast",
					"aliases": ["glm-5p2-fast", "accounts/fireworks/routers/glm-5p2-fast"],
					"contextWindow": 1048575,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"low": "high",
						"medium": "high",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-glm-5p3",
					"name": "Fireworks: GLM 5.3",
					"aliases": ["glm-5p3", "accounts/fireworks/models/glm-5p3"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-glm-5p3-flash",
					"name": "Fireworks: GLM 5.3 Flash",
					"aliases": ["glm-5p3-flash", "accounts/fireworks/models/glm-5p3-flash"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-kimi-k2p6",
					"name": "Fireworks: Kimi K2.6",
					"aliases": ["kimi-k2p6", "accounts/fireworks/models/kimi-k2p6"],
					"contextWindow": 262e3,
					"maxTokens": 262e3,
					"input": ["text", "image"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-kimi-k2p7-code",
					"name": "Fireworks: Kimi K2.7 Code",
					"aliases": ["kimi-k2p7-code", "accounts/fireworks/models/kimi-k2p7-code"],
					"contextWindow": 262e3,
					"maxTokens": 262e3,
					"input": ["text", "image"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-kimi-k3-fast",
					"name": "Fireworks: Kimi K3 Fast",
					"aliases": ["kimi-k3-fast", "accounts/fireworks/routers/kimi-k3-fast"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-muse-glimmer-30b",
					"name": "Fireworks: Muse Glimmer 30B",
					"aliases": ["muse-glimmer-30b", "accounts/fireworks/models/muse-glimmer-30b"],
					"contextWindow": 131072,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-nemotron-3-ultra-nvfp4",
					"name": "Fireworks: Nemotron 3 Ultra 550B A55B",
					"aliases": ["nemotron-3-ultra-nvfp4", "accounts/fireworks/models/nemotron-3-ultra-nvfp4"],
					"contextWindow": 262144,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-nemotron-lightning-3p5-30b-a3b",
					"name": "Fireworks: Nemotron 3.5 Lightning 30B A3B",
					"aliases": ["nemotron-lightning-3p5-30b-a3b", "accounts/fireworks/models/nemotron-lightning-3p5-30b-a3b"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-qwen3p7-plus",
					"name": "Fireworks: Qwen 3.7 Plus",
					"aliases": ["qwen3p7-plus", "accounts/fireworks/models/qwen3p7-plus"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-qwen3p8-2p4t-a95b",
					"name": "Fireworks: Qwen3.8 2.4T A95B",
					"aliases": ["qwen3p8-2p4t-a95b", "accounts/fireworks/models/qwen3p8-2p4t-a95b"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "fireworks-qwen3p8-max",
					"name": "Fireworks: Qwen3.8 Max",
					"aliases": ["qwen3p8-max", "accounts/fireworks/models/qwen3p8-max"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Fireworks model docs",
					"sourceUrl": "https://docs.fireworks.ai/guides/querying-models"
				},
				{
					"id": "github-copilot-mai-code-1-1-flash",
					"name": "GitHub Copilot: MAI-Code-1.1-Flash",
					"aliases": ["mai-code-1-1-flash"],
					"contextWindow": 256e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "GitHub Copilot docs",
					"sourceUrl": "https://docs.github.com/en/copilot"
				},
				{
					"id": "github-copilot-mai-code-1-flash-picker",
					"name": "GitHub Copilot: MAI-Code-1-Flash",
					"aliases": ["mai-code-1-flash-picker"],
					"contextWindow": 256e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "GitHub Copilot docs",
					"sourceUrl": "https://docs.github.com/en/copilot"
				},
				{
					"id": "google-deep-research-max-preview-04-2026",
					"name": "Google: Deep Research Max Preview (Apr-21-2026)",
					"aliases": ["deep-research-max-preview-04-2026"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-deep-research-preview-04-2026",
					"name": "Google: Deep Research Preview (Apr-21-2026)",
					"aliases": ["deep-research-preview-04-2026"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-2-5-computer-use-preview-10-2025",
					"name": "Google: Gemini 2.5 Computer Use Preview 10-2025",
					"aliases": ["gemini-2-5-computer-use-preview-10-2025"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-2-5-flash-lite",
					"name": "Google: Gemini 2.5 Flash-Lite",
					"aliases": ["gemini-2-5-flash-lite"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-2.5-flash",
					"name": "Google Gemini 2.5 Flash",
					"aliases": ["gemini-2-5-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "google-gemini-2.5-pro",
					"name": "Google Gemini 2.5 Pro",
					"aliases": ["gemini-2-5-pro"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "google-gemini-3-1-flash-lite",
					"name": "Google: Gemini 3.1 Flash Lite",
					"aliases": ["gemini-3-1-flash-lite"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-1-flash-lite-image",
					"name": "Google: Nano Banana 2 Lite",
					"aliases": ["gemini-3-1-flash-lite-image"],
					"contextWindow": 65536,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-1-flash-lite-preview",
					"name": "Google: Gemini 3.1 Flash Lite Preview",
					"aliases": ["gemini-3-1-flash-lite-preview"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-1-flash-live-preview",
					"name": "Google: Gemini 3.1 Flash Live Preview",
					"aliases": ["gemini-3-1-flash-live-preview"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-1-pro-preview",
					"name": "Google: Gemini 3.1 Pro Preview",
					"aliases": ["gemini-3-1-pro-preview"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "LOW",
						"high": "HIGH"
					},
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-1-pro-preview-customtools",
					"name": "Google: Gemini 3.1 Pro Preview Custom Tools",
					"aliases": ["gemini-3-1-pro-preview-customtools"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "LOW",
						"high": "HIGH"
					},
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-5-flash",
					"name": "Google: Gemini 3.5 Flash",
					"aliases": ["gemini-3-5-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-5-flash-lite",
					"name": "Google: Gemini 3.5 Flash Lite",
					"aliases": ["gemini-3-5-flash-lite"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-7-flash",
					"name": "Google: Gemini 3.7 Flash",
					"aliases": ["gemini-3-7-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-8-flash",
					"name": "Google: Gemini 3.8 Flash",
					"aliases": ["gemini-3-8-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3-flash-preview",
					"name": "Google: Gemini 3 Flash Preview",
					"aliases": ["gemini-3-flash-preview"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-3.6-flash",
					"name": "Google Gemini 3.6 Flash",
					"aliases": ["gemini-3-6-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models/gemini"
				},
				{
					"id": "google-gemini-flash-latest",
					"name": "Google: Gemini Flash Latest",
					"aliases": ["gemini-flash-latest"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemini-flash-lite-latest",
					"name": "Google: Gemini Flash-Lite Latest",
					"aliases": ["gemini-flash-lite-latest"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemma-4-26b-a4b-it",
					"name": "Google: Gemma 4 26B A4B IT",
					"aliases": ["gemma-4-26b-a4b-it"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "MINIMAL",
						"high": "HIGH"
					},
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "google-gemma-4-31b-it",
					"name": "Google: Gemma 4 31B IT",
					"aliases": ["gemma-4-31b-it"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "MINIMAL",
						"high": "HIGH"
					},
					"sourceLabel": "Google Gemini model docs",
					"sourceUrl": "https://ai.google.dev/gemini-api/docs/models"
				},
				{
					"id": "groq-llama-3-1-8b-instant",
					"name": "Groq: Llama 3.1 8B",
					"aliases": ["llama-3-1-8b-instant"],
					"contextWindow": 131072,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Groq model docs",
					"sourceUrl": "https://console.groq.com/docs/models"
				},
				{
					"id": "groq-llama-3-3-70b-versatile",
					"name": "Groq: Llama 3.3 70B",
					"aliases": ["llama-3-3-70b-versatile"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "Groq model docs",
					"sourceUrl": "https://console.groq.com/docs/models"
				},
				{
					"id": "huggingface-deepseek-v3",
					"name": "Hugging Face: DeepSeek-V3",
					"aliases": ["deepseek-v3", "deepseek-ai/deepseek-v3"],
					"contextWindow": 64e3,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-deepseek-v3-0324",
					"name": "Hugging Face: DeepSeek V3 0324",
					"aliases": ["deepseek-v3-0324", "deepseek-ai/deepseek-v3-0324"],
					"contextWindow": 163840,
					"maxTokens": 163840,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-deepseek-v3-1",
					"name": "Hugging Face: DeepSeek-V3.1",
					"aliases": ["deepseek-v3-1", "deepseek-ai/deepseek-v3-1"],
					"contextWindow": 131072,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-glm-4-6v-flash",
					"name": "Hugging Face: GLM-4.6V-Flash",
					"aliases": ["glm-4-6v-flash", "zai-org/glm-4-6v-flash"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-kimi-k2-instruct",
					"name": "Hugging Face: Kimi-K2-Instruct",
					"aliases": ["kimi-k2-instruct", "moonshotai/kimi-k2-instruct"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-kimi-k2-instruct-0905",
					"name": "Hugging Face: Kimi-K2-Instruct-0905",
					"aliases": ["kimi-k2-instruct-0905", "moonshotai/kimi-k2-instruct-0905"],
					"contextWindow": 262144,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-llama-3-1-8b-instruct",
					"name": "Hugging Face: Llama-3.1-8B-Instruct",
					"aliases": ["llama-3-1-8b-instruct", "meta-llama/llama-3-1-8b-instruct"],
					"contextWindow": 131072,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-llama-3-3-70b-instruct",
					"name": "Hugging Face: Llama-3.3-70B-Instruct",
					"aliases": ["llama-3-3-70b-instruct", "meta-llama/llama-3-3-70b-instruct"],
					"contextWindow": 131072,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-mimo-v2-flash",
					"name": "Hugging Face: MiMo-V2-Flash",
					"aliases": ["mimo-v2-flash", "xiaomimimo/mimo-v2-flash"],
					"contextWindow": 262144,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-qwen2-5-coder-32b-instruct",
					"name": "Hugging Face: Qwen2.5-Coder-32B-Instruct",
					"aliases": ["qwen2-5-coder-32b-instruct", "qwen/qwen2-5-coder-32b-instruct"],
					"contextWindow": 131072,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-qwen3-235b-a22b-instruct-2507",
					"name": "Hugging Face: Qwen3 235B-A22B Instruct 2507",
					"aliases": ["qwen3-235b-a22b-instruct-2507", "qwen/qwen3-235b-a22b-instruct-2507"],
					"contextWindow": 262144,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "huggingface-qwen3-coder-480b-a35b-instruct",
					"name": "Hugging Face: Qwen3-Coder-480B-A35B-Instruct",
					"aliases": ["qwen3-coder-480b-a35b-instruct", "qwen/qwen3-coder-480b-a35b-instruct"],
					"contextWindow": 262144,
					"maxTokens": 66536,
					"input": ["text"],
					"sourceLabel": "Hugging Face router docs",
					"sourceUrl": "https://huggingface.co/docs/inference-providers/"
				},
				{
					"id": "kimi-coding-k3",
					"name": "Kimi For Coding: Kimi K3",
					"aliases": ["k3"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Kimi For Coding docs",
					"sourceUrl": "https://www.kimi.com/coding"
				},
				{
					"id": "kimi-coding-k3-256k",
					"name": "Kimi For Coding: Kimi K3-256K",
					"aliases": ["k3-256k"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Kimi For Coding docs",
					"sourceUrl": "https://www.kimi.com/coding"
				},
				{
					"id": "kimi-coding-kimi-for-coding",
					"name": "Kimi For Coding: Kimi K2.7 Code",
					"aliases": ["kimi-for-coding"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "Kimi For Coding docs",
					"sourceUrl": "https://www.kimi.com/coding"
				},
				{
					"id": "kimi-coding-kimi-for-coding-highspeed",
					"name": "Kimi For Coding: Kimi For Coding HighSpeed",
					"aliases": ["kimi-for-coding-highspeed"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "Kimi For Coding docs",
					"sourceUrl": "https://www.kimi.com/coding"
				},
				{
					"id": "minimax-m2.5",
					"name": "MiniMax M2.5",
					"aliases": ["minimax-m2-5"],
					"contextWindow": 196608,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "MiniMax model docs",
					"sourceUrl": "https://platform.minimax.io/docs/guides/models-text"
				},
				{
					"id": "minimax-m2.7",
					"name": "MiniMax M2.7",
					"aliases": ["minimax-m2-7"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "MiniMax model docs",
					"sourceUrl": "https://platform.minimax.io/docs/guides/models-text"
				},
				{
					"id": "minimax-m3",
					"name": "MiniMax M3",
					"aliases": ["minimax-m3"],
					"contextWindow": 1048576,
					"maxTokens": 512e3,
					"input": ["text", "image"],
					"sourceLabel": "MiniMax model docs",
					"sourceUrl": "https://platform.minimax.io/docs/guides/models-text"
				},
				{
					"id": "minimax-minimax-m2-7-highspeed",
					"name": "MiniMax: MiniMax-M2.7-highspeed",
					"aliases": ["minimax-m2-7-highspeed"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "MiniMax model docs",
					"sourceUrl": "https://platform.minimax.io/docs/guides/models-text"
				},
				{
					"id": "mistral-codestral-latest",
					"name": "Mistral: Codestral (latest)",
					"aliases": ["codestral-latest"],
					"contextWindow": 256e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-devstral-2512",
					"name": "Mistral: Devstral 2",
					"aliases": ["devstral-2512"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-devstral-latest",
					"name": "Mistral: Devstral 2",
					"aliases": ["devstral-latest"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-devstral-medium-2507",
					"name": "Mistral: Devstral Medium",
					"aliases": ["devstral-medium-2507"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-devstral-medium-latest",
					"name": "Mistral: Devstral 2 (latest)",
					"aliases": ["devstral-medium-latest"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-devstral-small-2505",
					"name": "Mistral: Devstral Small 2505",
					"aliases": ["devstral-small-2505"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-devstral-small-2507",
					"name": "Mistral: Devstral Small",
					"aliases": ["devstral-small-2507"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-labs-devstral-small-2512",
					"name": "Mistral: Devstral Small 2",
					"aliases": ["labs-devstral-small-2512"],
					"contextWindow": 256e3,
					"maxTokens": 256e3,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-magistral-medium-latest",
					"name": "Mistral: Magistral Medium (latest)",
					"aliases": ["magistral-medium-latest"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-magistral-small",
					"name": "Mistral: Magistral Small",
					"aliases": ["magistral-small"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-ministral-3b-latest",
					"name": "Mistral: Ministral 3B (latest)",
					"aliases": ["ministral-3b-latest"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-ministral-8b-latest",
					"name": "Mistral: Ministral 8B (latest)",
					"aliases": ["ministral-8b-latest"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-large-2411",
					"name": "Mistral: Mistral Large 2.1",
					"aliases": ["mistral-large-2411"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-large-2512",
					"name": "Mistral: Mistral Large 3",
					"aliases": ["mistral-large-2512"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-large-latest",
					"name": "Mistral: Mistral Large (latest)",
					"aliases": ["mistral-large-latest"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-medium-2505",
					"name": "Mistral: Mistral Medium 3",
					"aliases": ["mistral-medium-2505"],
					"contextWindow": 131072,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-medium-2508",
					"name": "Mistral: Mistral Medium 3.1",
					"aliases": ["mistral-medium-2508"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-medium-2604",
					"name": "Mistral: Mistral Medium 3.5",
					"aliases": ["mistral-medium-2604"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-medium-3-5",
					"name": "Mistral: Mistral Medium 3.5",
					"aliases": ["mistral-medium-3-5"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-medium-latest",
					"name": "Mistral: Mistral Medium (latest)",
					"aliases": ["mistral-medium-latest"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-nemo",
					"name": "Mistral: Mistral Nemo",
					"aliases": ["mistral-nemo"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-small-2506",
					"name": "Mistral: Mistral Small 3.2",
					"aliases": ["mistral-small-2506"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-small-2603",
					"name": "Mistral: Mistral Small 4",
					"aliases": ["mistral-small-2603"],
					"contextWindow": 256e3,
					"maxTokens": 256e3,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-mistral-small-latest",
					"name": "Mistral: Mistral Small (latest)",
					"aliases": ["mistral-small-latest"],
					"contextWindow": 256e3,
					"maxTokens": 256e3,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-open-mistral-7b",
					"name": "Mistral: Mistral 7B",
					"aliases": ["open-mistral-7b"],
					"contextWindow": 8e3,
					"maxTokens": 8e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-open-mistral-nemo",
					"name": "Mistral: Open Mistral Nemo",
					"aliases": ["open-mistral-nemo"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-open-mixtral-8x22b",
					"name": "Mistral: Mixtral 8x22B",
					"aliases": ["open-mixtral-8x22b"],
					"contextWindow": 64e3,
					"maxTokens": 64e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-open-mixtral-8x7b",
					"name": "Mistral: Mixtral 8x7B",
					"aliases": ["open-mixtral-8x7b"],
					"contextWindow": 32e3,
					"maxTokens": 32e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-pixtral-12b",
					"name": "Mistral: Pixtral 12B",
					"aliases": ["pixtral-12b"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-pixtral-large-latest",
					"name": "Mistral: Pixtral Large (latest)",
					"aliases": ["pixtral-large-latest"],
					"contextWindow": 128e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-voxtral-small-latest",
					"name": "Mistral: Voxtral Small (latest)",
					"aliases": ["voxtral-small-latest"],
					"contextWindow": 32e3,
					"maxTokens": 32e3,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "mistral-zai-glm-5-2",
					"name": "Mistral: GLM-5.2",
					"aliases": ["zai-glm-5-2"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Mistral model docs",
					"sourceUrl": "https://docs.mistral.ai/getting-started/models/"
				},
				{
					"id": "moonshot-kimi-k2.5",
					"name": "Moonshot Kimi K2.5",
					"aliases": ["kimi-k2-5"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshot-kimi-k2.6",
					"name": "Moonshot Kimi K2.6",
					"aliases": ["kimi-k2-6"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshot-kimi-k2.7-code",
					"name": "Moonshot Kimi K2.7 Code",
					"aliases": ["kimi-k2-7-code"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshot-kimi-k3",
					"name": "Moonshot Kimi K3",
					"aliases": ["kimi-k3"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models/kimi-k3"
				},
				{
					"id": "moonshotai-kimi-k2-0711-preview",
					"name": "Moonshot AI: Kimi K2 0711",
					"aliases": ["kimi-k2-0711-preview"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshotai-kimi-k2-0905-preview",
					"name": "Moonshot AI: Kimi K2 0905",
					"aliases": ["kimi-k2-0905-preview"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshotai-kimi-k2-7-code-highspeed",
					"name": "Moonshot AI: Kimi K2.7 Code HighSpeed",
					"aliases": ["kimi-k2-7-code-highspeed"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshotai-kimi-k2-thinking",
					"name": "Moonshot AI: Kimi K2 Thinking",
					"aliases": ["kimi-k2-thinking"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshotai-kimi-k2-thinking-turbo",
					"name": "Moonshot AI: Kimi K2 Thinking Turbo",
					"aliases": ["kimi-k2-thinking-turbo"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "moonshotai-kimi-k2-turbo-preview",
					"name": "Moonshot AI: Kimi K2 Turbo",
					"aliases": ["kimi-k2-turbo-preview"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "Moonshot model docs",
					"sourceUrl": "https://platform.moonshot.ai/docs/models"
				},
				{
					"id": "nvidia-cosmos-reason2-8b",
					"name": "NVIDIA: Cosmos Reason2 8B",
					"aliases": ["cosmos-reason2-8b", "nvidia/cosmos-reason2-8b"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-gemma-3-4b-it",
					"name": "NVIDIA: Gemma 3 4B IT",
					"aliases": ["gemma-3-4b-it", "google/gemma-3-4b-it"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-llama-3-1-nemotron-70b-instruct",
					"name": "NVIDIA: Llama 3.1 Nemotron 70B Instruct",
					"aliases": ["llama-3-1-nemotron-70b-instruct", "nvidia/llama-3-1-nemotron-70b-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-llama-3-1-nemotron-ultra-253b-v1",
					"name": "NVIDIA: Llama 3.1 Nemotron Ultra 253B",
					"aliases": ["llama-3-1-nemotron-ultra-253b-v1", "nvidia/llama-3-1-nemotron-ultra-253b-v1"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-llama-3-2-11b-vision-instruct",
					"name": "NVIDIA: Llama 3.2 11b Vision Instruct",
					"aliases": ["llama-3-2-11b-vision-instruct", "meta/llama-3-2-11b-vision-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-llama-3-2-90b-vision-instruct",
					"name": "NVIDIA: Llama-3.2-90B-Vision-Instruct",
					"aliases": ["llama-3-2-90b-vision-instruct", "meta/llama-3-2-90b-vision-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 8192,
					"input": ["text", "image"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-mistral-7b-instruct-v0-3",
					"name": "NVIDIA: Mistral-7B-Instruct-v0.3",
					"aliases": ["mistral-7b-instruct-v0-3", "mistralai/mistral-7b-instruct-v0-3"],
					"contextWindow": 65536,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-nemotron-3-5-lightning-30b-a3b",
					"name": "NVIDIA: Nemotron 3.5 Lightning 30B A3B",
					"aliases": ["nemotron-3-5-lightning-30b-a3b", "nvidia/nemotron-3-5-lightning-30b-a3b"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "nvidia-nemotron-3-nano-omni-30b-a3b-reasoning",
					"name": "NVIDIA: Nemotron 3 Nano Omni",
					"aliases": ["nemotron-3-nano-omni-30b-a3b-reasoning", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"],
					"contextWindow": 256e3,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "NVIDIA NIM model docs",
					"sourceUrl": "https://docs.api.nvidia.com/"
				},
				{
					"id": "openai-gpt-4",
					"name": "OpenAI: GPT-4",
					"aliases": ["gpt-4"],
					"contextWindow": 8192,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4-1",
					"name": "OpenAI: GPT-4.1",
					"aliases": ["gpt-4-1"],
					"contextWindow": 1047576,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4-1-mini",
					"name": "OpenAI: GPT-4.1 mini",
					"aliases": ["gpt-4-1-mini"],
					"contextWindow": 1047576,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4-1-nano",
					"name": "OpenAI: GPT-4.1 nano",
					"aliases": ["gpt-4-1-nano"],
					"contextWindow": 1047576,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4-turbo",
					"name": "OpenAI: GPT-4 Turbo",
					"aliases": ["gpt-4-turbo"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4o",
					"name": "OpenAI: GPT-4o",
					"aliases": ["gpt-4o"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4o-2024-05-13",
					"name": "OpenAI: GPT-4o (2024-05-13)",
					"aliases": ["gpt-4o-2024-05-13"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4o-2024-08-06",
					"name": "OpenAI: GPT-4o (2024-08-06)",
					"aliases": ["gpt-4o-2024-08-06"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4o-2024-11-20",
					"name": "OpenAI: GPT-4o (2024-11-20)",
					"aliases": ["gpt-4o-2024-11-20"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-4o-mini",
					"name": "OpenAI: GPT-4o mini",
					"aliases": ["gpt-4o-mini"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5",
					"name": "OpenAI GPT-5",
					"aliases": ["gpt-5"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-gpt-5-1",
					"name": "OpenAI: GPT-5.1",
					"aliases": ["gpt-5-1"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-2-chat-latest",
					"name": "OpenAI: GPT-5.2 Chat",
					"aliases": ["gpt-5-2-chat-latest"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"medium": "medium",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-2-pro",
					"name": "OpenAI: GPT-5.2 Pro",
					"aliases": ["gpt-5-2-pro"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-3-chat-latest",
					"name": "OpenAI: GPT-5.3 Chat (latest)",
					"aliases": ["gpt-5-3-chat-latest"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-3-codex-spark",
					"name": "OpenAI: GPT-5.3 Codex Spark",
					"aliases": ["gpt-5-3-codex-spark"],
					"contextWindow": 128e3,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-4-mini",
					"name": "OpenAI: GPT-5.4 mini",
					"aliases": ["gpt-5-4-mini"],
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
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-4-nano",
					"name": "OpenAI: GPT-5.4 nano",
					"aliases": ["gpt-5-4-nano"],
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
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-5-pro",
					"name": "OpenAI: GPT-5.5 Pro",
					"aliases": ["gpt-5-5-pro"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-chat-latest",
					"name": "OpenAI: GPT-5 Chat Latest",
					"aliases": ["gpt-5-chat-latest"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-mini",
					"name": "OpenAI: GPT-5 Mini",
					"aliases": ["gpt-5-mini"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-nano",
					"name": "OpenAI: GPT-5 Nano",
					"aliases": ["gpt-5-nano"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5-pro",
					"name": "OpenAI: GPT-5 Pro",
					"aliases": ["gpt-5-pro"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-5.2",
					"name": "OpenAI GPT-5.2",
					"aliases": ["gpt-5-2"],
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
					"aliases": ["gpt-5-3-codex"],
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
					"aliases": ["gpt-5-4"],
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
					"aliases": ["gpt-5-4-pro"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-gpt-5.5",
					"name": "OpenAI GPT-5.5",
					"aliases": ["gpt-5-5"],
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
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://developers.openai.com/api/docs/models/gpt-5.5"
				},
				{
					"id": "openai-gpt-5.6-luna",
					"name": "OpenAI GPT-5.6 Luna",
					"aliases": ["gpt-5-6-luna"],
					"contextWindow": 272e3,
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
					"id": "openai-gpt-5.6-sol",
					"name": "OpenAI GPT-5.6 Sol",
					"aliases": ["gpt-5-6-sol"],
					"contextWindow": 272e3,
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
					"aliases": ["gpt-5-6-terra"],
					"contextWindow": 272e3,
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
					"id": "openai-gpt-6-astra",
					"name": "OpenAI: GPT-6 Astra",
					"aliases": ["gpt-6-astra"],
					"contextWindow": 272e3,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-gpt-realtime-2-1",
					"name": "OpenAI: GPT-Realtime-2.1",
					"aliases": ["gpt-realtime-2-1"],
					"contextWindow": 128e3,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-o1",
					"name": "OpenAI: o1",
					"aliases": ["o1"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-o1-pro",
					"name": "OpenAI: o1-pro",
					"aliases": ["o1-pro"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-o3",
					"name": "OpenAI o3",
					"aliases": ["o3"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
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
					"aliases": ["o3-mini"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "openai-o3-pro",
					"name": "OpenAI: o3-pro",
					"aliases": ["o3-pro"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenAI model docs",
					"sourceUrl": "https://platform.openai.com/docs/models"
				},
				{
					"id": "openai-o4-mini",
					"name": "OpenAI o4-mini",
					"aliases": ["o4-mini"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "opencode-big-pickle",
					"name": "OpenCode Zen: Big Pickle",
					"aliases": ["big-pickle"],
					"contextWindow": 2e5,
					"maxTokens": 32e3,
					"input": ["text"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-gemini-3-1-pro",
					"name": "OpenCode Zen: Gemini 3.1 Pro Preview",
					"aliases": ["gemini-3-1-pro"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "LOW",
						"high": "HIGH"
					},
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-gemini-3-flash",
					"name": "OpenCode Zen: Gemini 3 Flash",
					"aliases": ["gemini-3-flash"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-go-longcat-2-0",
					"name": "OpenCode Go: LongCat-2.0",
					"aliases": ["longcat-2-0"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenCode Go docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-go-muse-spark-1-2-contributor",
					"name": "OpenCode Go: Muse Spark 1.2 Contributor",
					"aliases": ["muse-spark-1-2-contributor"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenCode Go docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-go-muse-spark-1-3-contributor",
					"name": "OpenCode Go: Muse Spark 1.3 Contributor",
					"aliases": ["muse-spark-1-3-contributor"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenCode Go docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-go-omen-alpha",
					"name": "OpenCode Go: Omen Alpha",
					"aliases": ["omen-alpha"],
					"contextWindow": 5e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high"
					},
					"sourceLabel": "OpenCode Go docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-gpt-5-codex",
					"name": "OpenCode Zen: GPT-5 Codex",
					"aliases": ["gpt-5-codex"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-ling-3-0-flash-fin-free",
					"name": "OpenCode Zen: Ling 3.0 Flash Fin Free",
					"aliases": ["ling-3-0-flash-fin-free"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-mimo-v2-5-free",
					"name": "OpenCode Zen: MiMo V2.5 Free",
					"aliases": ["mimo-v2-5-free"],
					"contextWindow": 2e5,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-muse-spark-1-2",
					"name": "OpenCode Zen: Muse Spark 1.2",
					"aliases": ["muse-spark-1-2"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-muse-spark-1-2-contributor-free",
					"name": "OpenCode Zen: Muse Spark 1.2 Free",
					"aliases": ["muse-spark-1-2-contributor-free"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-muse-spark-1-3",
					"name": "OpenCode Zen: Muse Spark 1.3",
					"aliases": ["muse-spark-1-3"],
					"contextWindow": 1048576,
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
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-muse-spark-1-3-contributor-free",
					"name": "OpenCode Zen: Muse Spark 1.3 Free",
					"aliases": ["muse-spark-1-3-contributor-free"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-nemotron-3-5-lightning-free",
					"name": "OpenCode Zen: Nemotron 3.5 Lightning Free",
					"aliases": ["nemotron-3-5-lightning-free"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-nemotron-3-ultra-free",
					"name": "OpenCode Zen: Nemotron 3 Ultra Free",
					"aliases": ["nemotron-3-ultra-free"],
					"contextWindow": 1e6,
					"maxTokens": 128e3,
					"input": ["text"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "opencode-qwen3-5-plus",
					"name": "OpenCode Zen: Qwen3.5 Plus",
					"aliases": ["qwen3-5-plus"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenCode Zen docs",
					"sourceUrl": "https://opencode.ai/docs/"
				},
				{
					"id": "openrouter-claude-3-haiku",
					"name": "OpenRouter: Anthropic: Claude 3 Haiku",
					"aliases": ["claude-3-haiku", "anthropic/claude-3-haiku"],
					"contextWindow": 2e5,
					"maxTokens": 4096,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-claude-opus-4",
					"name": "OpenRouter: Anthropic: Claude Opus 4",
					"aliases": ["claude-opus-4", "anthropic/claude-opus-4"],
					"contextWindow": 2e5,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-claude-opus-4-1",
					"name": "OpenRouter: Anthropic: Claude Opus 4.1",
					"aliases": ["claude-opus-4-1", "anthropic/claude-opus-4-1"],
					"contextWindow": 2e5,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-claude-sonnet-4",
					"name": "OpenRouter: Anthropic: Claude Sonnet 4",
					"aliases": ["claude-sonnet-4"],
					"contextWindow": 2e5,
					"maxTokens": 64e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-codestral-2508",
					"name": "OpenRouter: Mistral: Codestral 2508",
					"aliases": ["codestral-2508", "mistralai/codestral-2508"],
					"contextWindow": 256e3,
					"maxTokens": 204800,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-chat",
					"name": "OpenRouter: DeepSeek: DeepSeek V3",
					"aliases": ["deepseek-chat", "deepseek/deepseek-chat"],
					"contextWindow": 163840,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-chat-v3-0324",
					"name": "OpenRouter: DeepSeek: DeepSeek V3 0324",
					"aliases": ["deepseek-chat-v3-0324", "deepseek/deepseek-chat-v3-0324"],
					"contextWindow": 163840,
					"maxTokens": 147456,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-chat-v3-1",
					"name": "OpenRouter: DeepSeek: DeepSeek V3.1",
					"aliases": ["deepseek-chat-v3-1", "deepseek/deepseek-chat-v3-1"],
					"contextWindow": 161e3,
					"maxTokens": 144900,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-r1",
					"name": "OpenRouter: DeepSeek: R1",
					"aliases": ["deepseek-r1", "deepseek-ai/deepseek-r1"],
					"contextWindow": 64e3,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-r1-0528",
					"name": "OpenRouter: DeepSeek: R1 0528",
					"aliases": ["deepseek-r1-0528", "deepseek-ai/deepseek-r1-0528"],
					"contextWindow": 163840,
					"maxTokens": 163840,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-v3-1-terminus",
					"name": "OpenRouter: DeepSeek: DeepSeek V3.1 Terminus",
					"aliases": ["deepseek-v3-1-terminus", "deepseek/deepseek-v3-1-terminus"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-deepseek-v3-2-exp",
					"name": "OpenRouter: DeepSeek: DeepSeek V3.2 Exp",
					"aliases": ["deepseek-v3-2-exp", "deepseek/deepseek-v3-2-exp"],
					"contextWindow": 163840,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gemini-2-5-pro-preview",
					"name": "OpenRouter: Google: Gemini 2.5 Pro Preview 06-05",
					"aliases": ["gemini-2-5-pro-preview", "google/gemini-2-5-pro-preview"],
					"contextWindow": 1048576,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gemini-2-5-pro-preview-05-06",
					"name": "OpenRouter: Google: Gemini 2.5 Pro Preview 05-06",
					"aliases": ["gemini-2-5-pro-preview-05-06", "google/gemini-2-5-pro-preview-05-06"],
					"contextWindow": 1048576,
					"maxTokens": 65535,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gemini-3-pro-image",
					"name": "OpenRouter: Google: Nano Banana Pro (Gemini 3 Pro Image)",
					"aliases": ["gemini-3-pro-image", "google/gemini-3-pro-image"],
					"contextWindow": 65536,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gemma-3-12b-it",
					"name": "OpenRouter: Google: Gemma 3 12B",
					"aliases": ["gemma-3-12b-it", "google/gemma-3-12b-it"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gemma-3-27b-it",
					"name": "OpenRouter: Google: Gemma 3 27B",
					"aliases": ["gemma-3-27b-it", "google/gemma-3-27b-it"],
					"contextWindow": 131072,
					"maxTokens": 117964,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-4-5",
					"name": "OpenRouter: Z.ai: GLM 4.5",
					"aliases": ["glm-4-5", "zai-org/glm-4-5"],
					"contextWindow": 131072,
					"maxTokens": 98304,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-4-5-air",
					"name": "OpenRouter: Z.ai: GLM 4.5 Air",
					"aliases": ["glm-4-5-air", "zai-org/glm-4-5-air"],
					"contextWindow": 131072,
					"maxTokens": 98304,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-4-5v",
					"name": "OpenRouter: Z.ai: GLM 4.5V",
					"aliases": ["glm-4-5v", "zai-org/glm-4-5v"],
					"contextWindow": 65536,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-4-6",
					"name": "OpenRouter: Z.ai: GLM 4.6",
					"aliases": ["glm-4-6", "zai-org/glm-4-6"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-4-6v",
					"name": "OpenRouter: Z.ai: GLM 4.6V",
					"aliases": ["glm-4-6v"],
					"contextWindow": 128e3,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-4-7-flash",
					"name": "OpenRouter: Z.ai: GLM 4.7 Flash",
					"aliases": ["glm-4-7-flash", "@cf/zai-org/glm-4-7-flash"],
					"contextWindow": 131072,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-glm-5v-turbo",
					"name": "OpenRouter: Z.ai: GLM 5V Turbo",
					"aliases": ["glm-5v-turbo"],
					"contextWindow": 2e5,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-3-5-turbo",
					"name": "OpenRouter: OpenAI: GPT-3.5 Turbo",
					"aliases": ["gpt-3-5-turbo", "openai/gpt-3-5-turbo"],
					"contextWindow": 16385,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-3-5-turbo-0613",
					"name": "OpenRouter: OpenAI: GPT-3.5 Turbo (older v0613)",
					"aliases": ["gpt-3-5-turbo-0613", "openai/gpt-3-5-turbo-0613"],
					"contextWindow": 4095,
					"maxTokens": 3685,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-3-5-turbo-16k",
					"name": "OpenRouter: OpenAI: GPT-3.5 Turbo 16k",
					"aliases": ["gpt-3-5-turbo-16k", "openai/gpt-3-5-turbo-16k"],
					"contextWindow": 16385,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-4-turbo-preview",
					"name": "OpenRouter: OpenAI: GPT-4 Turbo Preview",
					"aliases": ["gpt-4-turbo-preview", "openai/gpt-4-turbo-preview"],
					"contextWindow": 128e3,
					"maxTokens": 4096,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-4o-mini-2024-07-18",
					"name": "OpenRouter: OpenAI: GPT-4o-mini (2024-07-18)",
					"aliases": ["gpt-4o-mini-2024-07-18", "openai/gpt-4o-mini-2024-07-18"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-1-codex",
					"name": "OpenRouter: OpenAI: GPT-5.1-Codex",
					"aliases": ["gpt-5-1-codex"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-1-codex-max",
					"name": "OpenRouter: OpenAI: GPT-5.1-Codex-Max",
					"aliases": ["gpt-5-1-codex-max"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-1-codex-mini",
					"name": "OpenRouter: OpenAI: GPT-5.1-Codex-Mini",
					"aliases": ["gpt-5-1-codex-mini"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-2-chat",
					"name": "OpenRouter: OpenAI: GPT-5.2 Chat",
					"aliases": ["gpt-5-2-chat", "openai/gpt-5-2-chat"],
					"contextWindow": 128e3,
					"maxTokens": 32e3,
					"input": ["text", "image"],
					"reasoningEfforts": { "xhigh": "xhigh" },
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-2-codex",
					"name": "OpenRouter: OpenAI: GPT-5.2-Codex",
					"aliases": ["gpt-5-2-codex"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-6-luna-pro",
					"name": "OpenRouter: OpenAI: GPT-5.6 Luna Pro",
					"aliases": ["gpt-5-6-luna-pro", "openai/gpt-5-6-luna-pro"],
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
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-6-sol-pro",
					"name": "OpenRouter: OpenAI: GPT-5.6 Sol Pro",
					"aliases": ["gpt-5-6-sol-pro", "openai/gpt-5-6-sol-pro"],
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
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-5-6-terra-pro",
					"name": "OpenRouter: OpenAI: GPT-5.6 Terra Pro",
					"aliases": ["gpt-5-6-terra-pro", "openai/gpt-5-6-terra-pro"],
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
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-6-astra-pro",
					"name": "OpenRouter: OpenAI: GPT-6 Astra Pro",
					"aliases": ["gpt-6-astra-pro", "openai/gpt-6-astra-pro"],
					"contextWindow": 105e4,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh",
						"max": "max"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-audio",
					"name": "OpenRouter: OpenAI: GPT Audio",
					"aliases": ["gpt-audio", "openai/gpt-audio"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-audio-mini",
					"name": "OpenRouter: OpenAI: GPT Audio Mini",
					"aliases": ["gpt-audio-mini", "openai/gpt-audio-mini"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-chat-latest",
					"name": "OpenRouter: OpenAI: GPT Chat Latest",
					"aliases": ["gpt-chat-latest", "openai/gpt-chat-latest"],
					"contextWindow": 4e5,
					"maxTokens": 128e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-oss-120b",
					"name": "OpenRouter: OpenAI: gpt-oss-120b",
					"aliases": ["gpt-oss-120b", "@cf/openai/gpt-oss-120b"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-oss-20b",
					"name": "OpenRouter: OpenAI: gpt-oss-20b",
					"aliases": ["gpt-oss-20b", "@cf/openai/gpt-oss-20b"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-gpt-oss-safeguard-20b",
					"name": "OpenRouter: OpenAI: gpt-oss-safeguard-20b",
					"aliases": ["gpt-oss-safeguard-20b", "openai/gpt-oss-safeguard-20b"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-grok-4-20",
					"name": "OpenRouter: SpaceXAI: Grok 4.20",
					"aliases": ["grok-4-20", "x-ai/grok-4-20"],
					"contextWindow": 2e6,
					"maxTokens": 18e5,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-grok-build-0-1",
					"name": "OpenRouter: SpaceXAI: Grok Build 0.1",
					"aliases": ["grok-build-0-1"],
					"contextWindow": 256e3,
					"maxTokens": 256e3,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-hy3",
					"name": "OpenRouter: Tencent: Hy3",
					"aliases": ["hy3", "tencent/hy3"],
					"contextWindow": 262144,
					"maxTokens": 128e3,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-hy3-preview",
					"name": "OpenRouter: Tencent: Hy3 preview",
					"aliases": ["hy3-preview", "tencent/hy3-preview"],
					"contextWindow": 262144,
					"maxTokens": 235929,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-hy4-preview",
					"name": "OpenRouter: Tencent: Hy4 preview",
					"aliases": ["hy4-preview"],
					"contextWindow": 1024e3,
					"maxTokens": 64e3,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-inkling",
					"name": "OpenRouter: Thinking Machines: Inkling",
					"aliases": ["inkling", "thinkingmachines/inkling"],
					"contextWindow": 524288,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-inkling-small",
					"name": "OpenRouter: Thinking Machines: Inkling Small",
					"aliases": ["inkling-small", "thinkingmachines/inkling-small"],
					"contextWindow": 524288,
					"maxTokens": 1048576,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-kimi-k2",
					"name": "OpenRouter: MoonshotAI: Kimi K2 0711",
					"aliases": ["kimi-k2", "moonshotai/kimi-k2"],
					"contextWindow": 131072,
					"maxTokens": 100352,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-kimi-k2-0905",
					"name": "OpenRouter: MoonshotAI: Kimi K2 0905",
					"aliases": ["kimi-k2-0905", "moonshotai/kimi-k2-0905"],
					"contextWindow": 262144,
					"maxTokens": 100352,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-laguna-s-2-1",
					"name": "OpenRouter: Poolside: Laguna S 2.1",
					"aliases": ["laguna-s-2-1", "poolside/laguna-s-2-1"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-laguna-xs-2-1",
					"name": "OpenRouter: Poolside: Laguna XS 2.1",
					"aliases": ["laguna-xs-2-1", "poolside/laguna-xs-2-1"],
					"contextWindow": 262144,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-ling-3-0-flash",
					"name": "OpenRouter: inclusionAI: Ling 3.0 Flash",
					"aliases": ["ling-3-0-flash", "inclusionai/ling-3-0-flash"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-ling-3-0-flash-fin",
					"name": "OpenRouter: inclusionAI: Ling 3.0 Flash Fin",
					"aliases": ["ling-3-0-flash-fin", "inclusionai/ling-3-0-flash-fin"],
					"contextWindow": 262144,
					"maxTokens": 235929,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-minimax-m1",
					"name": "OpenRouter: MiniMax: MiniMax M1",
					"aliases": ["minimax-m1", "minimax/minimax-m1"],
					"contextWindow": 1e6,
					"maxTokens": 4e4,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-minimax-m2",
					"name": "OpenRouter: MiniMax: MiniMax M2",
					"aliases": ["minimax-m2", "minimaxai/minimax-m2"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-minimax-m2-1",
					"name": "OpenRouter: MiniMax: MiniMax M2.1",
					"aliases": ["minimax-m2-1", "minimaxai/minimax-m2-1"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-ministral-14b-2512",
					"name": "OpenRouter: Mistral: Ministral 3 14B 2512",
					"aliases": ["ministral-14b-2512", "mistralai/ministral-14b-2512"],
					"contextWindow": 262144,
					"maxTokens": 209715,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-ministral-3b-2512",
					"name": "OpenRouter: Mistral: Ministral 3 3B 2512",
					"aliases": ["ministral-3b-2512", "mistralai/ministral-3b-2512"],
					"contextWindow": 131072,
					"maxTokens": 104857,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-ministral-8b-2512",
					"name": "OpenRouter: Mistral: Ministral 3 8B 2512",
					"aliases": ["ministral-8b-2512", "mistralai/ministral-8b-2512"],
					"contextWindow": 262144,
					"maxTokens": 209715,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mistral-large",
					"name": "OpenRouter: Mistral Large",
					"aliases": ["mistral-large", "mistralai/mistral-large"],
					"contextWindow": 128e3,
					"maxTokens": 102400,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mistral-large-2407",
					"name": "OpenRouter: Mistral Large 2407",
					"aliases": ["mistral-large-2407", "mistralai/mistral-large-2407"],
					"contextWindow": 131072,
					"maxTokens": 104857,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mistral-medium-3",
					"name": "OpenRouter: Mistral: Mistral Medium 3",
					"aliases": ["mistral-medium-3", "mistralai/mistral-medium-3"],
					"contextWindow": 131072,
					"maxTokens": 104857,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mistral-medium-3-1",
					"name": "OpenRouter: Mistral: Mistral Medium 3.1",
					"aliases": ["mistral-medium-3-1", "mistralai/mistral-medium-3-1"],
					"contextWindow": 131072,
					"maxTokens": 104857,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mistral-saba",
					"name": "OpenRouter: Mistral: Saba",
					"aliases": ["mistral-saba", "mistralai/mistral-saba"],
					"contextWindow": 32768,
					"maxTokens": 26214,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mistral-small-3-2-24b-instruct",
					"name": "OpenRouter: Mistral: Mistral Small 3.2 24B",
					"aliases": ["mistral-small-3-2-24b-instruct", "mistralai/mistral-small-3-2-24b-instruct"],
					"contextWindow": 128e3,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-mixtral-8x22b-instruct",
					"name": "OpenRouter: Mistral: Mixtral 8x22B Instruct",
					"aliases": ["mixtral-8x22b-instruct", "mistralai/mixtral-8x22b-instruct"],
					"contextWindow": 65536,
					"maxTokens": 52428,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-nemotron-3-5-lightning",
					"name": "OpenRouter: NVIDIA: Nemotron 3.5 Lightning",
					"aliases": ["nemotron-3-5-lightning", "nvidia/nemotron-3-5-lightning"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-nemotron-3-nano-30b-a3b",
					"name": "OpenRouter: NVIDIA: Nemotron 3 Nano 30B A3B",
					"aliases": ["nemotron-3-nano-30b-a3b", "nvidia/nemotron-3-nano-30b-a3b"],
					"contextWindow": 262144,
					"maxTokens": 235929,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-nemotron-3-super-120b-a12b",
					"name": "OpenRouter: NVIDIA: Nemotron 3 Super",
					"aliases": ["nemotron-3-super-120b-a12b", "nvidia/nemotron-3-super-120b-a12b"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-nemotron-3-ultra-550b-a55b",
					"name": "OpenRouter: NVIDIA: Nemotron 3 Ultra",
					"aliases": ["nemotron-3-ultra-550b-a55b", "nvidia/nemotron-3-ultra-550b-a55b"],
					"contextWindow": 512300,
					"maxTokens": 512300,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-o3-mini-high",
					"name": "OpenRouter: OpenAI: o3 Mini High",
					"aliases": ["o3-mini-high", "openai/o3-mini-high"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-o4-mini-high",
					"name": "OpenRouter: OpenAI: o4 Mini High",
					"aliases": ["o4-mini-high", "openai/o4-mini-high"],
					"contextWindow": 2e5,
					"maxTokens": 1e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen-2-5-72b-instruct",
					"name": "OpenRouter: Qwen2.5 72B Instruct",
					"aliases": ["qwen-2-5-72b-instruct", "qwen/qwen-2-5-72b-instruct"],
					"contextWindow": 32768,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen-2-5-7b-instruct",
					"name": "OpenRouter: Qwen: Qwen2.5 7B Instruct",
					"aliases": ["qwen-2-5-7b-instruct", "qwen/qwen-2-5-7b-instruct"],
					"contextWindow": 32768,
					"maxTokens": 29491,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen-plus",
					"name": "OpenRouter: Qwen: Qwen-Plus",
					"aliases": ["qwen-plus", "qwen/qwen-plus"],
					"contextWindow": 1e6,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen-plus-2025-07-28",
					"name": "OpenRouter: Qwen: Qwen Plus 0728",
					"aliases": ["qwen-plus-2025-07-28", "qwen/qwen-plus-2025-07-28"],
					"contextWindow": 1e6,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-14b",
					"name": "OpenRouter: Qwen: Qwen3 14B",
					"aliases": ["qwen3-14b", "qwen/qwen3-14b"],
					"contextWindow": 40960,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-235b-a22b",
					"name": "OpenRouter: Qwen: Qwen3 235B A22B",
					"aliases": ["qwen3-235b-a22b", "qwen/qwen3-235b-a22b"],
					"contextWindow": 40960,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-235b-a22b-2507",
					"name": "OpenRouter: Qwen: Qwen3 235B A22B Instruct 2507",
					"aliases": ["qwen3-235b-a22b-2507", "qwen/qwen3-235b-a22b-2507"],
					"contextWindow": 262144,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-235b-a22b-thinking-2507",
					"name": "OpenRouter: Qwen: Qwen3 235B A22B Thinking 2507",
					"aliases": ["qwen3-235b-a22b-thinking-2507", "qwen/qwen3-235b-a22b-thinking-2507"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-30b-a3b",
					"name": "OpenRouter: Qwen: Qwen3 30B A3B",
					"aliases": ["qwen3-30b-a3b", "qwen/qwen3-30b-a3b"],
					"contextWindow": 40960,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-30b-a3b-instruct-2507",
					"name": "OpenRouter: Qwen: Qwen3 30B A3B Instruct 2507",
					"aliases": ["qwen3-30b-a3b-instruct-2507", "qwen/qwen3-30b-a3b-instruct-2507"],
					"contextWindow": 128e3,
					"maxTokens": 32e3,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-30b-a3b-thinking-2507",
					"name": "OpenRouter: Qwen: Qwen3 30B A3B Thinking 2507",
					"aliases": ["qwen3-30b-a3b-thinking-2507", "qwen/qwen3-30b-a3b-thinking-2507"],
					"contextWindow": 81920,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-32b",
					"name": "OpenRouter: Qwen: Qwen3 32B",
					"aliases": ["qwen3-32b", "qwen/qwen3-32b"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-122b-a10b",
					"name": "OpenRouter: Qwen: Qwen3.5-122B-A10B",
					"aliases": ["qwen3-5-122b-a10b", "qwen/qwen3-5-122b-a10b"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-27b",
					"name": "OpenRouter: Qwen: Qwen3.5-27B",
					"aliases": ["qwen3-5-27b", "qwen/qwen3-5-27b"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-35b-a3b",
					"name": "OpenRouter: Qwen: Qwen3.5-35B-A3B",
					"aliases": ["qwen3-5-35b-a3b", "qwen/qwen3-5-35b-a3b"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-397b-a17b",
					"name": "OpenRouter: Qwen: Qwen3.5 397B A17B",
					"aliases": ["qwen3-5-397b-a17b", "qwen/qwen3-5-397b-a17b"],
					"contextWindow": 262144,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-9b",
					"name": "OpenRouter: Qwen: Qwen3.5-9B",
					"aliases": ["qwen3-5-9b", "qwen/qwen3-5-9b"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-flash-02-23",
					"name": "OpenRouter: Qwen: Qwen3.5-Flash",
					"aliases": ["qwen3-5-flash-02-23", "qwen/qwen3-5-flash-02-23"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-plus-02-15",
					"name": "OpenRouter: Qwen: Qwen3.5 Plus 2026-02-15",
					"aliases": ["qwen3-5-plus-02-15", "qwen/qwen3-5-plus-02-15"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-5-plus-20260420",
					"name": "OpenRouter: Qwen: Qwen3.5 Plus 2026-04-20",
					"aliases": ["qwen3-5-plus-20260420", "qwen/qwen3-5-plus-20260420"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-6-27b",
					"name": "OpenRouter: Qwen: Qwen3.6 27B",
					"aliases": ["qwen3-6-27b", "qwen/qwen3-6-27b"],
					"contextWindow": 131072,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"high": "default"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-6-35b-a3b",
					"name": "OpenRouter: Qwen: Qwen3.6 35B A3B",
					"aliases": ["qwen3-6-35b-a3b", "qwen/qwen3-6-35b-a3b"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-6-max-preview",
					"name": "OpenRouter: Qwen: Qwen3.6 Max Preview",
					"aliases": ["qwen3-6-max-preview", "qwen/qwen3-6-max-preview"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-7-flash",
					"name": "OpenRouter: Qwen: Qwen3.7 Flash",
					"aliases": ["qwen3-7-flash", "qwen/qwen3-7-flash"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-8-2-4t-a95b",
					"name": "OpenRouter: Qwen: Qwen3.8 2.4T A95B",
					"aliases": ["qwen3-8-2-4t-a95b", "qwen/qwen3-8-2-4t-a95b"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-8-27b",
					"name": "OpenRouter: Qwen: Qwen3.8 27B",
					"aliases": ["qwen3-8-27b", "@cf/qwen/qwen3-8-27b"],
					"contextWindow": 262144,
					"maxTokens": 262144,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-8-max-0902",
					"name": "OpenRouter: Qwen: Qwen3.8 Max (0902)",
					"aliases": ["qwen3-8-max-0902", "qwen/qwen3-8-max-0902"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"minimal": "minimal",
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-8b",
					"name": "OpenRouter: Qwen: Qwen3 8B",
					"aliases": ["qwen3-8b", "qwen/qwen3-8b"],
					"contextWindow": 131072,
					"maxTokens": 8192,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-coder",
					"name": "OpenRouter: Qwen: Qwen3 Coder 480B A35B",
					"aliases": ["qwen3-coder", "qwen/qwen3-coder"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-coder-30b-a3b-instruct",
					"name": "OpenRouter: Qwen: Qwen3 Coder 30B A3B Instruct",
					"aliases": ["qwen3-coder-30b-a3b-instruct", "qwen/qwen3-coder-30b-a3b-instruct"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-coder-flash",
					"name": "OpenRouter: Qwen: Qwen3 Coder Flash",
					"aliases": ["qwen3-coder-flash", "qwen/qwen3-coder-flash"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-coder-next",
					"name": "OpenRouter: Qwen: Qwen3 Coder Next",
					"aliases": ["qwen3-coder-next", "qwen/qwen3-coder-next"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-coder-plus",
					"name": "OpenRouter: Qwen: Qwen3 Coder Plus",
					"aliases": ["qwen3-coder-plus", "qwen/qwen3-coder-plus"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-max",
					"name": "OpenRouter: Qwen: Qwen3 Max",
					"aliases": ["qwen3-max", "qwen/qwen3-max"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-max-thinking",
					"name": "OpenRouter: Qwen: Qwen3 Max Thinking",
					"aliases": ["qwen3-max-thinking", "qwen/qwen3-max-thinking"],
					"contextWindow": 262144,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-next-80b-a3b-instruct",
					"name": "OpenRouter: Qwen: Qwen3 Next 80B A3B Instruct",
					"aliases": ["qwen3-next-80b-a3b-instruct", "qwen/qwen3-next-80b-a3b-instruct"],
					"contextWindow": 262144,
					"maxTokens": 66536,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-next-80b-a3b-thinking",
					"name": "OpenRouter: Qwen: Qwen3 Next 80B A3B Thinking",
					"aliases": ["qwen3-next-80b-a3b-thinking", "qwen/qwen3-next-80b-a3b-thinking"],
					"contextWindow": 262144,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-235b-a22b-instruct",
					"name": "OpenRouter: Qwen: Qwen3 VL 235B A22B Instruct",
					"aliases": ["qwen3-vl-235b-a22b-instruct", "qwen/qwen3-vl-235b-a22b-instruct"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-235b-a22b-thinking",
					"name": "OpenRouter: Qwen: Qwen3 VL 235B A22B Thinking",
					"aliases": ["qwen3-vl-235b-a22b-thinking", "qwen/qwen3-vl-235b-a22b-thinking"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-30b-a3b-instruct",
					"name": "OpenRouter: Qwen: Qwen3 VL 30B A3B Instruct",
					"aliases": ["qwen3-vl-30b-a3b-instruct", "qwen/qwen3-vl-30b-a3b-instruct"],
					"contextWindow": 262144,
					"maxTokens": 16384,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-30b-a3b-thinking",
					"name": "OpenRouter: Qwen: Qwen3 VL 30B A3B Thinking",
					"aliases": ["qwen3-vl-30b-a3b-thinking", "qwen/qwen3-vl-30b-a3b-thinking"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-32b-instruct",
					"name": "OpenRouter: Qwen: Qwen3 VL 32B Instruct",
					"aliases": ["qwen3-vl-32b-instruct", "qwen/qwen3-vl-32b-instruct"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-8b-instruct",
					"name": "OpenRouter: Qwen: Qwen3 VL 8B Instruct",
					"aliases": ["qwen3-vl-8b-instruct", "qwen/qwen3-vl-8b-instruct"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-qwen3-vl-8b-thinking",
					"name": "OpenRouter: Qwen: Qwen3 VL 8B Thinking",
					"aliases": ["qwen3-vl-8b-thinking", "qwen/qwen3-vl-8b-thinking"],
					"contextWindow": 131072,
					"maxTokens": 32768,
					"input": ["text", "image"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-solar-pro-3",
					"name": "OpenRouter: Upstage: Solar Pro 3",
					"aliases": ["solar-pro-3", "upstage/solar-pro-3"],
					"contextWindow": 131072,
					"maxTokens": 117964,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-solar-pro4",
					"name": "OpenRouter: Upstage: Solar Pro 4",
					"aliases": ["solar-pro4", "upstage/solar-pro4"],
					"contextWindow": 524288,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-step-3-5-flash",
					"name": "OpenRouter: StepFun: Step 3.5 Flash",
					"aliases": ["step-3-5-flash", "stepfun-ai/step-3-5-flash"],
					"contextWindow": 262144,
					"maxTokens": 256e3,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-step-3-7-flash",
					"name": "OpenRouter: StepFun: Step 3.7 Flash",
					"aliases": ["step-3-7-flash", "stepfun-ai/step-3-7-flash"],
					"contextWindow": 262144,
					"maxTokens": 256e3,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "openrouter-voxtral-small-24b-2507",
					"name": "OpenRouter: Mistral: Voxtral Small 24B 2507",
					"aliases": ["voxtral-small-24b-2507", "mistralai/voxtral-small-24b-2507"],
					"contextWindow": 32768,
					"maxTokens": 26214,
					"input": ["text"],
					"sourceLabel": "OpenRouter models",
					"sourceUrl": "https://openrouter.ai/models"
				},
				{
					"id": "qwen-qwen3.6-flash",
					"name": "Qwen 3.6 Flash",
					"aliases": ["qwen3-6-flash"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-qwen3.6-plus",
					"name": "Qwen 3.6 Plus",
					"aliases": ["qwen3-6-plus"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-qwen3.7-max",
					"name": "Qwen 3.7 Max",
					"aliases": ["qwen3-7-max"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "qwen-qwen3.7-plus",
					"name": "Qwen 3.7 Plus",
					"aliases": ["qwen3-7-plus"],
					"contextWindow": 1e6,
					"maxTokens": 65536,
					"input": ["text", "image"],
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
					"id": "qwen-token-plan-deepseek-v3-2",
					"name": "Qwen Token Plan: DeepSeek V3.2",
					"aliases": ["deepseek-v3-2"],
					"contextWindow": 131072,
					"maxTokens": 65536,
					"input": ["text"],
					"sourceLabel": "Qwen Token Plan docs",
					"sourceUrl": "https://www.alibabacloud.com/help/en/model-studio"
				},
				{
					"id": "qwen-token-plan-deepseek-v4-flash-0731",
					"name": "Qwen Token Plan: DeepSeek V4 Flash 0731",
					"aliases": ["deepseek-v4-flash-0731"],
					"contextWindow": 1e6,
					"maxTokens": 384e3,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Qwen Token Plan docs",
					"sourceUrl": "https://www.alibabacloud.com/help/en/model-studio"
				},
				{
					"id": "qwen-token-plan-deepseek-v4-pro-0813",
					"name": "Qwen Token Plan: DeepSeek V4 Pro 0813",
					"aliases": ["deepseek-v4-pro-0813"],
					"contextWindow": 1e6,
					"maxTokens": 384e3,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Qwen Token Plan docs",
					"sourceUrl": "https://www.alibabacloud.com/help/en/model-studio"
				},
				{
					"id": "qwen-token-plan-qwen3-8-flash",
					"name": "Qwen Token Plan: Qwen3.8 Flash",
					"aliases": ["qwen3-8-flash"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"xhigh": "xhigh"
					},
					"sourceLabel": "Qwen Token Plan docs",
					"sourceUrl": "https://www.alibabacloud.com/help/en/model-studio"
				},
				{
					"id": "qwen-token-plan-qwen3-8-max",
					"name": "Qwen Token Plan: Qwen3.8 Max",
					"aliases": ["qwen3-8-max"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"xhigh": "xhigh"
					},
					"sourceLabel": "Qwen Token Plan docs",
					"sourceUrl": "https://www.alibabacloud.com/help/en/model-studio"
				},
				{
					"id": "together-llama-3-3-70b-instruct-turbo",
					"name": "Together: Llama 3.3 70B",
					"aliases": ["llama-3-3-70b-instruct-turbo", "meta-llama/llama-3-3-70b-instruct-turbo"],
					"contextWindow": 131072,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Together model docs",
					"sourceUrl": "https://docs.together.ai/docs/inference-models"
				},
				{
					"id": "together-qwen2-5-7b-instruct-turbo",
					"name": "Together: Qwen 2.5 7B Instruct Turbo",
					"aliases": ["qwen2-5-7b-instruct-turbo", "qwen/qwen2-5-7b-instruct-turbo"],
					"contextWindow": 32768,
					"maxTokens": 32768,
					"input": ["text"],
					"sourceLabel": "Together model docs",
					"sourceUrl": "https://docs.together.ai/docs/inference-models"
				},
				{
					"id": "xai-grok-4-3",
					"name": "xAI: Grok 4.3",
					"aliases": ["grok-4-3"],
					"contextWindow": 1e6,
					"maxTokens": 3e4,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": "none",
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "xAI model docs",
					"sourceUrl": "https://docs.x.ai/docs/models"
				},
				{
					"id": "xai-grok-4-6",
					"name": "xAI: Grok 4.6",
					"aliases": ["grok-4-6"],
					"contextWindow": 5e5,
					"maxTokens": 5e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high",
						"xhigh": "xhigh"
					},
					"sourceLabel": "xAI model docs",
					"sourceUrl": "https://docs.x.ai/docs/models"
				},
				{
					"id": "xai-grok-4.5",
					"name": "xAI Grok 4.5",
					"aliases": ["grok-4-5"],
					"contextWindow": 5e5,
					"maxTokens": 5e5,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"medium": "medium",
						"high": "high"
					},
					"sourceLabel": "DSH bundled pi-ai catalog",
					"sourceUrl": "https://github.com/deepseek-ai/deepseek-harness/tree/main/packages/llm/llm-pi-ai"
				},
				{
					"id": "xiaomi-mimo-v2-5-pro-ultraspeed",
					"name": "Xiaomi: MiMo-V2.5-Pro-UltraSpeed",
					"aliases": ["mimo-v2-5-pro-ultraspeed"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Xiaomi MiMo repository",
					"sourceUrl": "https://github.com/XiaomiMiMo/MiMo"
				},
				{
					"id": "xiaomi-mimo-v2.5",
					"name": "Xiaomi MiMo V2.5",
					"aliases": ["mimo-v2-5"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"sourceLabel": "Xiaomi MiMo repository",
					"sourceUrl": "https://github.com/XiaomiMiMo/MiMo-V2.5"
				},
				{
					"id": "xiaomi-mimo-v2.5-pro",
					"name": "Xiaomi MiMo V2.5 Pro",
					"aliases": ["mimo-v2-5-pro"],
					"contextWindow": 1048576,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Xiaomi MiMo repository",
					"sourceUrl": "https://github.com/XiaomiMiMo/MiMo-V2.5"
				},
				{
					"id": "zai-glm-4-7",
					"name": "Z.AI: GLM-4.7",
					"aliases": ["glm-4-7"],
					"contextWindow": 204800,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
				},
				{
					"id": "zai-glm-5",
					"name": "Z.ai GLM-5",
					"aliases": ["glm-5"],
					"contextWindow": 202752,
					"maxTokens": 16384,
					"input": ["text"],
					"reasoningEfforts": {
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5"
				},
				{
					"id": "zai-glm-5-2-highspeed",
					"name": "Z.AI: GLM-5.2 Highspeed",
					"aliases": ["glm-5-2-highspeed"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
				},
				{
					"id": "zai-glm-5-3-flash",
					"name": "Z.AI: GLM-5.3-Flash",
					"aliases": ["glm-5-3-flash"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text", "image"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
				},
				{
					"id": "zai-glm-5-3-highspeed",
					"name": "Z.AI: GLM-5.3 Highspeed",
					"aliases": ["glm-5-3-highspeed"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
				},
				{
					"id": "zai-glm-5-turbo",
					"name": "Z.AI: GLM-5-Turbo",
					"aliases": ["glm-5-turbo"],
					"contextWindow": 2e5,
					"maxTokens": 131072,
					"input": ["text"],
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
				},
				{
					"id": "zai-glm-5.1",
					"name": "Z.ai GLM-5.1",
					"aliases": ["glm-5-1"],
					"contextWindow": 202752,
					"maxTokens": 128e3,
					"input": ["text"],
					"reasoningEfforts": {
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.1"
				},
				{
					"id": "zai-glm-5.2",
					"name": "Z.ai GLM-5.2",
					"aliases": ["glm-5-2"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": "none",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.2"
				},
				{
					"id": "zai-glm-5.3",
					"name": "Z.ai GLM-5.3",
					"aliases": ["glm-5-3"],
					"contextWindow": 1e6,
					"maxTokens": 131072,
					"input": ["text"],
					"reasoningEfforts": {
						"off": null,
						"low": "low",
						"high": "high",
						"max": "max"
					},
					"sourceLabel": "Z.ai model docs",
					"sourceUrl": "https://docs.z.ai/guides/llm/glm-5.3"
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
		/** Allocate a Completions branch id without replacing an existing provider. */
		function nextProtocolBranchId(sourceId, existingIds) {
			const base = `${sourceId || "provider"}-completions`;
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
		/** Materialize a provider's effective model list and remove catalog-only overrides. */
		function materializeProviderModels(profile, models) {
			const next = structuredClone(profile);
			next.models = models.map((model) => structuredClone(model));
			delete next.modelOverrides;
			return next;
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
			if (isRecord(next.modelOverrides)) {
				const overrides = Object.fromEntries(Object.entries(next.modelOverrides).map(([id, value]) => {
					if (!isRecord(value) || modelId !== void 0 && id !== modelId) return [id, value];
					const result = applyReasoningCompatibilityDefaults(protocol, {
						id,
						...value
					});
					const updated = structuredClone(result.model);
					delete updated.id;
					if (result.changed) repairedModels.push(id.trim() || "unknown model");
					return [id, updated];
				}));
				if (repairedModels.length > 0) next.modelOverrides = overrides;
			}
			return {
				profile: next,
				changed: repairedModels.length > 0,
				repairedModels
			};
		}
		const COMPLETIONS_COMPAT_FIELDS = /* @__PURE__ */ new Set([
			"supportsStore",
			"supportsDeveloperRole",
			"supportsReasoningEffort",
			"supportsUsageInStreaming",
			"maxTokensField",
			"requiresToolResultName",
			"requiresAssistantAfterToolResult",
			"requiresThinkingAsText",
			"requiresReasoningContentOnAssistantMessages",
			"thinkingFormat",
			"chatTemplateKwargs",
			"supportsStrictMode",
			"cacheControlFormat",
			"supportsLongCacheRetention"
		]);
		const RESPONSES_COMPAT_FIELDS = /* @__PURE__ */ new Set([
			"supportsDeveloperRole",
			"supportsStrictMode",
			"supportsLongCacheRetention"
		]);
		function retainProtocolCompat(source, allowed) {
			const next = structuredClone(source);
			if (!isRecord(next.compat)) return next;
			const compat = Object.fromEntries(Object.entries(next.compat).filter(([key]) => allowed.has(key)));
			if (Object.keys(compat).length === 0) delete next.compat;
			else next.compat = compat;
			return next;
		}
		function protocolProfile(providerId, profile, api, models) {
			const allowed = api === "openai-responses" ? RESPONSES_COMPAT_FIELDS : COMPLETIONS_COMPAT_FIELDS;
			let next = retainProtocolCompat(profile, allowed);
			next.api = api;
			next.models = models.map((model) => retainProtocolCompat(model, allowed));
			delete next.modelOverrides;
			if (api === "openai-completions") {
				next.models = modelRecords(next).map((model) => applyReasoningDispatchDefaults(providerId, next, model));
				next = repairProviderCompatibility(next).profile;
			}
			return next;
		}
		/** Split one explicit model route into Responses-first and Completions-only providers. */
		function splitProviderByProtocol(input) {
			const models = modelRecords(input.profile);
			if (models.length === 0) throw new Error("protocol splitting requires explicitly configured models");
			const completionsOnly = new Set(input.completionsOnlyIds.map((id) => id.trim()).filter((id) => id !== ""));
			const responsesModels = models.filter((model) => !completionsOnly.has(stringField(model, "id").trim()));
			const completionsModels = models.filter((model) => completionsOnly.has(stringField(model, "id").trim()));
			if (completionsModels.length === 0) throw new Error("protocol splitting found no Completions-only models");
			if (responsesModels.length === 0) throw new Error("protocol splitting requires at least one Responses-capable model");
			const completionsProviderId = nextProtocolBranchId(input.providerId, input.existingProviderIds);
			const responsesProfile = protocolProfile(input.providerId, input.profile, "openai-responses", responsesModels);
			const completionsProfile = protocolProfile(completionsProviderId, input.profile, "openai-completions", completionsModels);
			completionsProfile.displayName = `${stringField(input.profile, "displayName") || input.providerId} Completions`;
			const retryEntries = Object.entries(input.retry.models);
			const responsesRetry = {
				...structuredClone(input.retry),
				models: Object.fromEntries(retryEntries.filter(([modelId]) => !completionsOnly.has(modelId)))
			};
			const completionsRetry = {
				...structuredClone(input.retry),
				models: Object.fromEntries(retryEntries.filter(([modelId]) => completionsOnly.has(modelId)))
			};
			return {
				responsesProviderId: input.providerId,
				responsesProfile,
				completionsProviderId,
				completionsProfile,
				responsesRetry,
				completionsRetry
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
		const RETRY_SETTINGS_NAMESPACE = "dsh-model-palette";
		const MAX_REQUEST_RETRIES = 1e3;
		const PROTOCOL_SCAN_BATCH_SIZE = 100;
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
				api: "openai-responses",
				models: []
			};
		}
		function requestRetryProfiles(value) {
			if (!isRecord(value) || !isRecord(value.requestRetries) || !isRecord(value.requestRetries.providers)) return {};
			return Object.fromEntries(Object.entries(value.requestRetries.providers).filter((entry) => isRecord(entry[1])));
		}
		function cloneRequestRetryDraft(value) {
			if (!isRecord(value)) return {
				enabled: false,
				maxRetries: 0,
				models: {}
			};
			const models = isRecord(value.models) ? Object.fromEntries(Object.entries(value.models).filter((entry) => typeof entry[1] === "number" && Number.isInteger(entry[1]) && entry[1] >= 0 && entry[1] <= MAX_REQUEST_RETRIES)) : {};
			return {
				enabled: value.enabled !== false,
				maxRetries: typeof value.maxRetries === "number" && Number.isInteger(value.maxRetries) && value.maxRetries >= 0 && value.maxRetries <= MAX_REQUEST_RETRIES ? value.maxRetries : 0,
				models
			};
		}
		function requestRetrySignature(value) {
			return JSON.stringify(value);
		}
		function parseRequestRetryCount(value) {
			const parsed = Number(value);
			if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_REQUEST_RETRIES) throw new Error(`request retries must be an integer from 0 to ${MAX_REQUEST_RETRIES}`);
			return parsed;
		}
		function modelRetryMode(value, modelId) {
			if (!Object.hasOwn(value.models, modelId)) return "inherit";
			return value.models[modelId] === 0 ? "disabled" : "custom";
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
		/** Resolve free-typed preset text by exact id, exact name, or unique name substring. */
		function resolvePresetInput(text, presets) {
			const needle = text.trim();
			if (needle === "") return void 0;
			const lower = needle.toLocaleLowerCase();
			const byId = presets.find((preset) => preset.id === needle);
			if (byId !== void 0) return byId;
			const byName = presets.find((preset) => preset.name.toLocaleLowerCase() === lower);
			if (byName !== void 0) return byName;
			const contains = presets.filter((preset) => preset.name.toLocaleLowerCase().includes(lower) || preset.id.toLocaleLowerCase().includes(lower));
			return contains.length === 1 ? contains[0] : void 0;
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
		function protocolClassificationLabel(classification) {
			switch (classification) {
				case "responses-preferred": return "config.protocolScanResponses";
				case "completions-only": return "config.protocolScanCompletionsOnly";
				case "both": return "config.protocolScanBoth";
				case "unsupported": return "config.protocolScanUnsupported";
			}
		}
		function protocolProbeFailureFeedback(results) {
			if (results.some((result) => result.failure === "authentication")) return "config.protocolProbeAuthentication";
			if (results.some((result) => result.failure === "blocked")) return "config.protocolProbeBlocked";
			if (results.some((result) => result.failure === "unavailable" || result.failure === "transport")) return "config.protocolProbeTransient";
			return "config.protocolProbeNone";
		}
		function firstConfiguredModelId(profile) {
			const declared = modelRecords(profile).find((model) => typeof model.id === "string" && model.id.trim() !== "");
			if (typeof declared?.id === "string") return declared.id.trim();
			return (isRecord(profile.modelOverrides) ? Object.keys(profile.modelOverrides) : []).find((id) => id.trim() !== "")?.trim() ?? "";
		}
		function liveCatalogCandidates(value) {
			if (!isRecord(value) || !Array.isArray(value.groups)) return {};
			return Object.fromEntries(value.groups.filter(isRecord).flatMap((group) => {
				const provider = stringField(group, "id");
				if (provider === "" || !Array.isArray(group.models)) return [];
				return [[provider, group.models.filter(isRecord).flatMap((model) => {
					const id = stringField(model, "id").trim();
					if (id === "") return [];
					return [{
						id,
						...stringField(model, "name") === "" ? {} : { name: stringField(model, "name") }
					}];
				})]];
			}));
		}
		function mergeCatalogOverrides(models, profile) {
			const overrides = isRecord(profile.modelOverrides) ? profile.modelOverrides : {};
			const merged = new Map(models.map((model) => {
				const id = stringField(model, "id");
				const configured = overrides[id];
				return [id, {
					...structuredClone(model),
					...isRecord(configured) ? structuredClone(configured) : {},
					id
				}];
			}));
			for (const [id, value] of Object.entries(overrides)) if (!merged.has(id) && isRecord(value)) merged.set(id, {
				id,
				...structuredClone(value)
			});
			return [...merged.values()];
		}
		const MODEL_OVERRIDE_FIELDS = [
			"name",
			"contextWindow",
			"maxTokens",
			"input",
			"reasoningEfforts",
			"compat"
		];
		function cloneFreeSyncDraft(value) {
			if (!isRecord(value)) return {
				enabled: false,
				intervalHours: 6
			};
			const interval = typeof value.intervalHours === "number" && Number.isInteger(value.intervalHours) && value.intervalHours >= 0 && value.intervalHours <= 168 ? value.intervalHours : 6;
			return {
				enabled: value.enabled === true,
				intervalHours: interval
			};
		}
		function freeSyncProviders(value) {
			if (!isRecord(value) || !isRecord(value.freeSync) || !isRecord(value.freeSync.providers)) return {};
			return Object.fromEntries(Object.entries(value.freeSync.providers).filter((entry) => isRecord(entry[1])));
		}
		function freeSyncStates(value) {
			if (!isRecord(value) || !isRecord(value.freeSync) || !isRecord(value.freeSync.state)) return {};
			return Object.fromEntries(Object.entries(value.freeSync.state).filter((entry) => isRecord(entry[1])));
		}
		function catalogOverrides(catalog, models) {
			const catalogIds = new Set(catalog.map((model) => stringField(model, "id")));
			const modelIds = new Set(models.flatMap((model) => typeof model.id === "string" && model.id.trim() !== "" ? [model.id.trim()] : []));
			if (catalogIds.size !== modelIds.size || [...catalogIds].some((id) => !modelIds.has(id))) return void 0;
			const defaults = new Map(catalog.map((model) => [stringField(model, "id"), model]));
			const overrides = {};
			for (const model of models) {
				const id = typeof model.id === "string" ? model.id.trim() : "";
				const base = defaults.get(id);
				if (base === void 0) return void 0;
				const override = {};
				for (const field of MODEL_OVERRIDE_FIELDS) if (model[field] !== void 0 && JSON.stringify(model[field]) !== JSON.stringify(base[field])) override[field] = structuredClone(model[field]);
				if (Object.keys(override).length > 0) overrides[id] = override;
			}
			return overrides;
		}
		function mergeModelCandidates(...groups) {
			const merged = /* @__PURE__ */ new Map();
			for (const group of groups) for (const candidate of group) {
				const id = stringField(candidate, "id");
				if (id !== "") merged.set(id, {
					...merged.get(id) ?? { id },
					...structuredClone(candidate),
					id
				});
			}
			return [...merged.values()];
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
			const [retryNamespace, setRetryNamespace] = (0, react.useState)(null);
			const [providerId, setProviderId] = (0, react.useState)("");
			const [creating, setCreating] = (0, react.useState)(false);
			const [draft, setDraft] = (0, react.useState)({
				api: "openai-responses",
				models: []
			});
			const [baselineSignature, setBaselineSignature] = (0, react.useState)("");
			const [retryDraft, setRetryDraft] = (0, react.useState)({
				enabled: false,
				maxRetries: 0,
				models: {}
			});
			const [retryBaselineSignature, setRetryBaselineSignature] = (0, react.useState)("");
			const [previousProviderId, setPreviousProviderId] = (0, react.useState)("");
			const [modelQuery, setModelQuery] = (0, react.useState)("");
			const [credential, setCredential] = (0, react.useState)(null);
			const [keyDraft, setKeyDraft] = (0, react.useState)("");
			const [keyVisible, setKeyVisible] = (0, react.useState)(false);
			const [registry, setRegistry] = (0, react.useState)(BUNDLED_PRESET_REGISTRY);
			const [presetState, setPresetState] = (0, react.useState)("bundled");
			const [manualPresets, setManualPresets] = (0, react.useState)({});
			const [protocolResults, setProtocolResults] = (0, react.useState)(null);
			const [modelProtocolResults, setModelProtocolResults] = (0, react.useState)(null);
			const [protocolTestModelId, setProtocolTestModelId] = (0, react.useState)("");
			const [apiKeyValidation, setApiKeyValidation] = (0, react.useState)(null);
			const [batchApiKeyValidation, setBatchApiKeyValidation] = (0, react.useState)(null);
			const [openRouterFreeCatalog, setOpenRouterFreeCatalog] = (0, react.useState)(null);
			const [openRouterFreeSelection, setOpenRouterFreeSelection] = (0, react.useState)([]);
			const [openRouterFreeQuery, setOpenRouterFreeQuery] = (0, react.useState)("");
			const [liveCatalogModels, setLiveCatalogModels] = (0, react.useState)({});
			const [busy, setBusy] = (0, react.useState)("load");
			const [providerQuery, setProviderQuery] = (0, react.useState)("");
			const [templateCatalogOpen, setTemplateCatalogOpen] = (0, react.useState)(false);
			const [templateQuery, setTemplateQuery] = (0, react.useState)("");
			const [freeSyncDraft, setFreeSyncDraft] = (0, react.useState)(null);
			const [freeSyncInfo, setFreeSyncInfo] = (0, react.useState)(void 0);
			const [modelImport, setModelImport] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [feedback, setFeedback] = (0, react.useState)(null);
			const profiles = (0, react.useMemo)(() => namespace === null ? {} : providerProfiles(namespace.user ?? namespace.value), [namespace]);
			const providerIds = (0, react.useMemo)(() => Object.keys(profiles).sort((left, right) => left.localeCompare(right)), [profiles]);
			const explicitModels = (0, react.useMemo)(() => modelRecords(draft), [draft]);
			const models = (0, react.useMemo)(() => explicitModels.length > 0 ? explicitModels : mergeCatalogOverrides(liveCatalogModels[providerId] ?? [], draft), [
				draft,
				explicitModels,
				liveCatalogModels,
				providerId
			]);
			const catalogBacked = !creating && explicitModels.length === 0;
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
			const retryDirty = retryBaselineSignature !== "" && requestRetrySignature(retryDraft) !== retryBaselineSignature;
			const dirty = baselineSignature !== "" && (draftSignature(providerId, draft) !== baselineSignature || keyDraft !== "" || retryDirty);
			const batchProblemCount = batchApiKeyValidation?.filter((result) => result.status !== "valid").length ?? 0;
			const openRouterProfile = isOpenRouterProfile(providerId, draft);
			const configuredProviderCards = (0, react.useMemo)(() => providerIds.map((id) => {
				const profile = profiles[id] ?? {};
				const meta = providerMeta(id, profile);
				const declared = modelRecords(profile);
				const count = declared.length > 0 ? declared.length : liveCatalogModels[id]?.length ?? (isRecord(profile.modelOverrides) ? Object.keys(profile.modelOverrides).length : 0);
				return {
					id,
					displayName: stringField(profile, "displayName") || meta.brandName || id,
					icon: meta.icon,
					modelCount: count,
					protocol: stringField(profile, "api"),
					freeSync: cloneFreeSyncDraft(freeSyncProviders(retryNamespace?.value)[id] ?? void 0) && freeSyncProviders(retryNamespace?.value)[id]?.enabled === true,
					active: id === providerId
				};
			}), [
				liveCatalogModels,
				profiles,
				providerIds,
				providerId,
				retryNamespace
			]);
			const filteredProviderCards = (0, react.useMemo)(() => {
				const needle = providerQuery.trim().toLocaleLowerCase();
				if (needle === "") return configuredProviderCards;
				return configuredProviderCards.filter((card) => `${card.displayName} ${card.id} ${card.protocol}`.toLocaleLowerCase().includes(needle));
			}, [configuredProviderCards, providerQuery]);
			const configuredModelIds = (0, react.useMemo)(() => /* @__PURE__ */ new Set([...models.flatMap((model) => typeof model.id === "string" ? [model.id] : []), ...isRecord(draft.modelOverrides) ? Object.keys(draft.modelOverrides) : []]), [draft, models]);
			const visibleOpenRouterFreeModels = (0, react.useMemo)(() => {
				const query = openRouterFreeQuery.trim().toLocaleLowerCase();
				return (openRouterFreeCatalog?.models ?? []).filter((model) => query === "" || [model.id, model.name].some((value) => typeof value === "string" && value.toLocaleLowerCase().includes(query)));
			}, [openRouterFreeCatalog, openRouterFreeQuery]);
			const visibleModelImport = (0, react.useMemo)(() => {
				if (modelImport === null) return [];
				const query = modelImport.query.trim().toLocaleLowerCase();
				return modelImport.models.filter((model) => query === "" || [model.id, model.name].some((value) => typeof value === "string" && value.toLocaleLowerCase().includes(query)));
			}, [modelImport]);
			const modelProtocolSummary = (0, react.useMemo)(() => ({
				responses: modelProtocolResults?.filter((result) => result.classification === "responses-preferred" || result.classification === "both").length ?? 0,
				completionsOnly: modelProtocolResults?.filter((result) => result.classification === "completions-only").length ?? 0,
				unsupported: modelProtocolResults?.filter((result) => result.classification === "unsupported").length ?? 0
			}), [modelProtocolResults]);
			const protocolSplitPreview = (0, react.useMemo)(() => {
				if (modelProtocolResults === null || modelProtocolSummary.responses === 0 || modelProtocolSummary.completionsOnly === 0) return null;
				try {
					return splitProviderByProtocol({
						providerId: providerId.trim(),
						profile: materializeProviderModels(draft, models),
						retry: retryDraft,
						completionsOnlyIds: modelProtocolResults.filter((result) => result.classification === "completions-only").map((result) => result.model),
						existingProviderIds: providerIds
					});
				} catch {
					return null;
				}
			}, [
				draft,
				modelProtocolResults,
				modelProtocolSummary.completionsOnly,
				modelProtocolSummary.responses,
				models,
				providerId,
				providerIds,
				retryDraft
			]);
			const describeCredential = (0, react.useCallback)(async (ref) => {
				if (!CREDENTIAL_REF_PATTERN.test(ref)) {
					setCredential(null);
					return;
				}
				const response = await api.credentials.describe({ refs: [ref] });
				if (!response.result.ok) throw new Error(response.result.error.message);
				setCredential(response.result.value.credentials[ref] ?? null);
			}, [api.credentials]);
			const enrichCatalogModels = (0, react.useCallback)(async (id, current) => {
				const discoveredResponse = await api.llm.discoverModels({
					settingsNs: SETTINGS_NAMESPACE$1,
					provider: id
				});
				if (!discoveredResponse.result.ok) throw new Error(discoveredResponse.result.error.message);
				const discovered = discoveredResponse.result.value.models.map((model) => ({ ...model }));
				const ids = discovered.flatMap((model) => model.id.trim() === "" ? [] : [model.id.trim()]);
				const resolved = [];
				for (let offset = 0; offset < ids.length; offset += PROTOCOL_SCAN_BATCH_SIZE) resolved.push(...await resolveProviderModels({
					provider: id,
					models: ids.slice(offset, offset + PROTOCOL_SCAN_BATCH_SIZE)
				}));
				return mergeModelCandidates(current, discovered, resolved);
			}, [api.llm]);
			const confirmDiscard = (0, react.useCallback)(() => !dirty || window.confirm(t("config.discardConfirm")), [dirty, t]);
			const openProvider = (0, react.useCallback)((id, view = namespace, nextRetryNamespace = retryNamespace) => {
				if (view === null || nextRetryNamespace === null) return;
				const profile = cloneProfile(providerProfiles(view.user ?? view.value)[id]);
				const nextRetryDraft = cloneRequestRetryDraft(requestRetryProfiles(nextRetryNamespace.value)[id]);
				const ref = stringField(profile, "apiKeyEnv") || deriveCredentialRef(id);
				setProviderId(id);
				setCreating(false);
				setDraft(profile);
				setBaselineSignature(draftSignature(id, profile));
				setRetryDraft(nextRetryDraft);
				setRetryBaselineSignature(requestRetrySignature(nextRetryDraft));
				setPreviousProviderId(id);
				setModelQuery("");
				setKeyDraft("");
				setKeyVisible(false);
				setManualPresets({});
				setProtocolResults(null);
				setModelProtocolResults(null);
				setProtocolTestModelId("");
				setApiKeyValidation(null);
				setOpenRouterFreeCatalog(null);
				setOpenRouterFreeSelection([]);
				setOpenRouterFreeQuery("");
				setModelImport(null);
				setError(null);
				setFeedback(null);
				describeCredential(ref).catch((cause) => setError(messageOf$1(cause)));
			}, [
				describeCredential,
				namespace,
				retryNamespace
			]);
			const selectProvider = (id) => {
				if (confirmDiscard()) openProvider(id);
			};
			(0, react.useEffect)(() => {
				if (creating || providerId === "") {
					setFreeSyncDraft(null);
					setFreeSyncInfo(void 0);
					return;
				}
				setFreeSyncDraft(cloneFreeSyncDraft(freeSyncProviders(retryNamespace?.value)[providerId] ?? void 0));
				setFreeSyncInfo(freeSyncStates(retryNamespace?.value)[providerId]);
			}, [
				creating,
				providerId,
				retryNamespace
			]);
			(0, react.useEffect)(() => {
				if (!templateCatalogOpen) return;
				const onKeyDown = (event) => {
					if (event.key === "Escape") {
						event.stopPropagation();
						setTemplateCatalogOpen(false);
						setTemplateQuery("");
					}
				};
				window.addEventListener("keydown", onKeyDown, true);
				return () => window.removeEventListener("keydown", onKeyDown, true);
			}, [templateCatalogOpen]);
			const writeFreeSyncRule = async (next) => {
				if (retryNamespace === null || providerId.trim() === "") return;
				const id = providerId.trim();
				if (!PROVIDER_ID_PATTERN.test(id)) throw new Error(t("config.providerIdInvalid"));
				const response = await api.settings.mutate({
					ns: RETRY_SETTINGS_NAMESPACE,
					ops: [{
						op: "set",
						path: [
							"freeSync",
							"providers",
							id
						],
						value: next
					}],
					expectedRevision: retryNamespace.revision
				});
				if (!response.result.ok) throw new Error(response.result.error.message);
				setRetryNamespace(response.result.value);
				setFreeSyncDraft(next);
			};
			const toggleFreeSync = (enabled) => {
				setBusy("free-sync");
				setError(null);
				setFeedback(null);
				const next = {
					enabled,
					intervalHours: freeSyncDraft?.intervalHours ?? 6
				};
				writeFreeSyncRule(next).then(() => setFeedback(t(enabled ? "config.freeSyncEnabled" : "config.freeSyncDisabled"))).catch((cause) => setError(messageOf$1(cause))).finally(() => setBusy(null));
			};
			const updateFreeSyncInterval = (hours) => {
				const next = {
					enabled: freeSyncDraft?.enabled ?? false,
					intervalHours: hours
				};
				setFreeSyncDraft(next);
				if (freeSyncDraft?.enabled !== true) return;
				setBusy("free-sync");
				writeFreeSyncRule(next).then(() => setFeedback(t("config.freeSyncIntervalSaved", { hours }))).catch((cause) => setError(messageOf$1(cause))).finally(() => setBusy(null));
			};
			const runFreeSyncNow = async () => {
				if (busy !== null || providerId.trim() === "") return;
				setBusy("free-sync");
				setError(null);
				setFeedback(null);
				try {
					const summary = await syncProviderFreeModels(providerId.trim());
					setFreeSyncInfo({
						lastSyncAt: summary.lastSyncAt,
						total: summary.total,
						added: summary.added,
						removed: summary.removed
					});
					setFeedback(t("config.freeSyncDone", {
						total: summary.total,
						added: summary.added,
						removed: summary.removed
					}));
					load(true);
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			};
			const startCreateFromTemplate = (template) => {
				if (template.oauthOnly === true) {
					setFeedback(t("config.templateOauthOnly", { name: template.displayName }));
					return;
				}
				if (!confirmDiscard()) return;
				let targetId = template.id;
				if (PROVIDER_ID_PATTERN.test(targetId) && profiles[targetId] !== void 0) targetId = nextProviderCopyId(targetId, providerIds);
				const draftFromTemplate = template.catalog === true ? { models: [] } : {
					api: template.api ?? "openai-responses",
					models: []
				};
				if (template.baseURL !== void 0) draftFromTemplate.baseURL = template.baseURL;
				if (template.displayName !== void 0) draftFromTemplate.displayName = template.displayName;
				if (template.credentialRef !== void 0) draftFromTemplate.apiKeyEnv = template.credentialRef;
				const emptyRetry = {
					enabled: false,
					maxRetries: 0,
					models: {}
				};
				setPreviousProviderId(creating ? previousProviderId : providerId);
				setCreating(true);
				setProviderId(targetId);
				setDraft(draftFromTemplate);
				setBaselineSignature(draftSignature(targetId, draftFromTemplate));
				setRetryDraft(emptyRetry);
				setRetryBaselineSignature(requestRetrySignature(emptyRetry));
				setModelQuery("");
				setCredential(null);
				setKeyDraft("");
				setKeyVisible(false);
				setManualPresets({});
				setProtocolResults(null);
				setModelProtocolResults(null);
				setProtocolTestModelId("");
				setApiKeyValidation(null);
				setOpenRouterFreeCatalog(null);
				setOpenRouterFreeSelection([]);
				setOpenRouterFreeQuery("");
				setModelImport(null);
				setTemplateCatalogOpen(false);
				setTemplateQuery("");
				setError(null);
				setFeedback(t(template.catalog === true ? "config.templateReadyCatalog" : "config.templateReady", { name: template.displayName }));
				if (draftFromTemplate.apiKeyEnv !== void 0) describeCredential(String(draftFromTemplate.apiKeyEnv)).catch((cause) => setError(messageOf$1(cause)));
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
					const nextRetryNamespace = response.result.value.namespaces.find((candidate) => candidate.ns === RETRY_SETTINGS_NAMESPACE);
					if (nextRetryNamespace === void 0) throw new Error(t("config.retryNamespaceMissing"));
					const catalogResponse = await api.llm.models({});
					if (!catalogResponse.result.ok) throw new Error(catalogResponse.result.error.message);
					setNamespace(view);
					setRetryNamespace(nextRetryNamespace);
					setLiveCatalogModels(liveCatalogCandidates(catalogResponse.result.value));
					const ids = Object.keys(providerProfiles(view.user ?? view.value)).sort((left, right) => left.localeCompare(right));
					const selected = ids.includes(providerId) ? providerId : ids[0];
					if (selected !== void 0) openProvider(selected, view, nextRetryNamespace);
					else {
						const empty = {
							api: "openai-responses",
							models: []
						};
						const emptyRetry = {
							enabled: false,
							maxRetries: 0,
							models: {}
						};
						setProviderId("");
						setCreating(true);
						setDraft(empty);
						setBaselineSignature(draftSignature("", empty));
						setRetryDraft(emptyRetry);
						setRetryBaselineSignature(requestRetrySignature(emptyRetry));
						setPreviousProviderId("");
						setModelQuery("");
						setProtocolResults(null);
						setModelProtocolResults(null);
						setProtocolTestModelId("");
						setApiKeyValidation(null);
					}
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			}, [
				api.llm,
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
				if (creating || explicitModels.length > 0 || providerId === "") return;
				const current = liveCatalogModels[providerId] ?? [];
				enrichCatalogModels(providerId, current).then((resolved) => {
					setLiveCatalogModels((catalog) => ({
						...catalog,
						[providerId]: resolved
					}));
				}).catch((cause) => {
					console.error("[dsh-model-palette] catalog metadata resolution failed", cause);
				});
			}, [
				creating,
				enrichCatalogModels,
				explicitModels.length,
				providerId
			]);
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
					api: "openai-responses",
					models: []
				};
				const emptyRetry = {
					enabled: false,
					maxRetries: 0,
					models: {}
				};
				setPreviousProviderId(creating ? previousProviderId : providerId);
				setCreating(true);
				setProviderId("");
				setDraft(empty);
				setBaselineSignature(draftSignature("", empty));
				setRetryDraft(emptyRetry);
				setRetryBaselineSignature(requestRetrySignature(emptyRetry));
				setModelQuery("");
				setCredential(null);
				setKeyDraft("");
				setKeyVisible(false);
				setManualPresets({});
				setProtocolResults(null);
				setModelProtocolResults(null);
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
				setRetryDraft(structuredClone(retryDraft));
				setRetryBaselineSignature(requestRetrySignature({
					enabled: false,
					maxRetries: 0,
					models: {}
				}));
				setModelQuery("");
				setCredential(null);
				setKeyDraft("");
				setKeyVisible(false);
				setManualPresets({});
				setProtocolResults(null);
				setModelProtocolResults(null);
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
				setModelProtocolResults(null);
				setApiKeyValidation(null);
				if (key === "apiKeyEnv") {
					setKeyDraft("");
					setKeyVisible(false);
					describeCredential(value.trim()).catch((cause) => setError(messageOf$1(cause)));
				}
			};
			const setModels = (next) => {
				setDraft((current) => materializeProviderModels(current, next));
				setProtocolResults(null);
				setModelProtocolResults(null);
				setApiKeyValidation(null);
			};
			const updateModel = (index, next) => {
				setModels(models.map((model, position) => position === index ? next : model));
			};
			const updateProviderRetryCount = (value) => {
				try {
					setRetryDraft((current) => ({
						...current,
						maxRetries: parseRequestRetryCount(value)
					}));
					setError(null);
				} catch {
					setError(t("config.retryCountInvalid", { max: MAX_REQUEST_RETRIES }));
				}
			};
			const updateModelRetryMode = (modelId, mode) => {
				setRetryDraft((current) => {
					const models = { ...current.models };
					if (mode === "inherit") delete models[modelId];
					else if (mode === "disabled") models[modelId] = 0;
					else models[modelId] = models[modelId] !== void 0 && models[modelId] > 0 ? models[modelId] : current.enabled && current.maxRetries > 0 ? current.maxRetries : 3;
					return {
						...current,
						models
					};
				});
			};
			const updateModelRetryCount = (modelId, value) => {
				try {
					const maxRetries = parseRequestRetryCount(value);
					setRetryDraft((current) => ({
						...current,
						models: {
							...current.models,
							[modelId]: maxRetries
						}
					}));
					setError(null);
				} catch {
					setError(t("config.retryCountInvalid", { max: MAX_REQUEST_RETRIES }));
				}
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
				const modelId = typeof models[index]?.id === "string" ? models[index].id.trim() : "";
				setModels(models.filter((_model, position) => position !== index));
				if (modelId !== "") setRetryDraft((current) => {
					const nextModels = { ...current.models };
					delete nextModels[modelId];
					return {
						...current,
						models: nextModels
					};
				});
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
			/** Fetch the provider's live model list and open a selective import picker. */
			const readModelList = async () => {
				if (busy !== null) return;
				setBusy("probe");
				setError(null);
				setFeedback(null);
				try {
					const id = providerId.trim();
					if (!PROVIDER_ID_PATTERN.test(id)) throw new Error(t("config.providerIdInvalid"));
					const baseURL = stringField(draft, "baseURL").trim();
					const key = keyDraft.trim();
					const response = await api.llm.discoverModels({
						settingsNs: SETTINGS_NAMESPACE$1,
						provider: id,
						...baseURL === "" ? {} : { baseURL },
						...key === "" ? {} : { apiKey: key }
					});
					if (!response.result.ok) throw new Error(response.result.error.message);
					const discovered = response.result.value.models.map((model) => ({ ...model }));
					let resolved = discovered;
					if (baseURL !== "") {
						const ids = discovered.flatMap((model) => typeof model.id === "string" && model.id.trim() !== "" ? [model.id.trim()] : []);
						resolved = [];
						for (let offset = 0; offset < ids.length; offset += PROTOCOL_SCAN_BATCH_SIZE) resolved.push(...await resolveProviderModels({
							provider: id,
							models: ids.slice(offset, offset + PROTOCOL_SCAN_BATCH_SIZE)
						}));
					}
					setModelImport({
						models: resolved,
						query: "",
						selection: []
					});
					setFeedback(t("config.modelListReadDone", { count: resolved.length }));
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			};
			const importSelectedModels = () => {
				if (modelImport === null) return;
				const selected = modelImport.models.filter((model) => typeof model.id === "string" && modelImport.selection.includes(model.id));
				if (selected.length === 0) return;
				const candidates = selected.map((model) => {
					const candidate = { id: String(model.id) };
					if (typeof model.name === "string" && model.name !== "") candidate.name = model.name;
					if (typeof model.contextWindow === "number" && Number.isInteger(model.contextWindow)) candidate.contextWindow = model.contextWindow;
					if (typeof model.maxTokens === "number" && Number.isInteger(model.maxTokens)) candidate.maxTokens = model.maxTokens;
					if (Array.isArray(model.input)) candidate.input = model.input.filter((item) => item === "text" || item === "image");
					return candidate;
				});
				const result = mergeDiscoveredModelsWithPresets(models, candidates, registry.presets);
				const prepared = result.models.map((model) => model.reasoningEfforts === void 0 ? model : applyReasoningDispatchDefaults(providerId || "provider", draft, model));
				setDraft(materializeProviderModels(draft, prepared));
				setModelImport(null);
				setFeedback(t("config.modelImportDone", {
					count: selected.length,
					added: result.added,
					enriched: result.enriched,
					presets: result.presetsApplied
				}));
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
				setModelProtocolResults(null);
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
					setFeedback(t(available.length === 0 ? protocolProbeFailureFeedback(results) : available.length === 1 ? "config.protocolProbeOne" : "config.protocolProbeBoth", { protocol: available[0]?.protocol ?? "" }));
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			};
			const probeAllModelProtocols = async () => {
				if (busy !== null) return;
				const baseURL = stringField(draft, "baseURL").trim();
				const modelIds = models.flatMap((model) => typeof model.id === "string" && model.id.trim() !== "" ? [model.id.trim()] : []);
				if (baseURL === "") {
					setError(t("config.baseUrlRequired"));
					return;
				}
				if (!hasApiKey) {
					setError(t("config.apiKeyValidationKeyRequired"));
					return;
				}
				if (modelIds.length === 0) {
					setError(t("config.protocolProbeModelRequired"));
					return;
				}
				if (!window.confirm(t("config.protocolScanConfirm", {
					count: modelIds.length,
					requests: modelIds.length * 2
				}))) return;
				setBusy("protocol-scan");
				setError(null);
				setFeedback(null);
				try {
					const results = [];
					for (let offset = 0; offset < modelIds.length; offset += PROTOCOL_SCAN_BATCH_SIZE) results.push(...await probeProviderModelProtocols({
						baseURL,
						credentialRef,
						models: modelIds.slice(offset, offset + PROTOCOL_SCAN_BATCH_SIZE),
						...keyDraft.trim() === "" ? {} : { apiKey: keyDraft.trim() }
					}));
					setModelProtocolResults(results);
					const completionsOnly = results.filter((result) => result.classification === "completions-only").length;
					const unsupported = results.filter((result) => result.classification === "unsupported").length;
					const authenticationFailure = results.some((result) => result.responses.failure === "authentication" || result.completions.failure === "authentication");
					setFeedback(t(authenticationFailure ? "config.protocolScanAuthentication" : "config.protocolScanDone", {
						count: results.length,
						completionsOnly,
						unsupported
					}));
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			};
			const applyWholeRouteCompletions = () => {
				const profile = {
					...materializeProviderModels(draft, models),
					api: "openai-completions"
				};
				profile.models = models.map((model) => applyReasoningDispatchDefaults(providerId || "provider", profile, model));
				setDraft(repairProviderCompatibility(profile).profile);
				setProtocolResults(null);
				setApiKeyValidation(null);
				setFeedback(t("config.protocolWholeCompletionsApplied"));
			};
			const splitProtocols = async () => {
				if (namespace === null || retryNamespace === null || busy !== null || protocolSplitPreview === null) return;
				const id = providerId.trim();
				const ref = credentialRef.trim();
				let splitModels = models;
				if (catalogBacked) try {
					splitModels = await enrichCatalogModels(id, models);
				} catch (cause) {
					setError(t("config.protocolCatalogMetadataFailed", { error: messageOf$1(cause) }));
					return;
				}
				const normalizedModels = applyMissingPresets(splitModels, registry.presets).models.map((model) => ({
					...model,
					id: String(model.id).trim()
				}));
				if (!PROVIDER_ID_PATTERN.test(id)) {
					setError(t("config.providerIdInvalid"));
					return;
				}
				if (creating && profiles[id] !== void 0) {
					setError(t("config.providerExists"));
					return;
				}
				if (!CREDENTIAL_REF_PATTERN.test(ref)) {
					setError(t("config.credentialRefInvalid"));
					return;
				}
				if (stringField(draft, "baseURL").trim() === "") {
					setError(t("config.baseUrlRequired"));
					return;
				}
				if (normalizedModels.some((model) => typeof model.id !== "string" || model.id === "")) {
					setError(t("config.modelIdRequired"));
					return;
				}
				const duplicateIds = duplicateModelIds(normalizedModels);
				if (duplicateIds.length > 0) {
					setError(t("config.modelIdDuplicate", { ids: duplicateIds.join(", ") }));
					return;
				}
				const key = keyDraft.trim();
				if (key !== "" && !LEGAL_API_KEY.test(key)) {
					setError(t("config.keyInvalid"));
					return;
				}
				const split = splitProviderByProtocol({
					providerId: id,
					profile: {
						...materializeProviderModels(draft, normalizedModels),
						apiKeyEnv: ref
					},
					retry: retryDraft,
					completionsOnlyIds: modelProtocolResults?.filter((result) => result.classification === "completions-only").map((result) => result.model) ?? [],
					existingProviderIds: providerIds
				});
				if (!window.confirm(t("config.protocolSplitConfirm", {
					provider: split.completionsProviderId,
					count: modelProtocolSummary.completionsOnly
				}))) return;
				setBusy("protocol-split");
				setError(null);
				setFeedback(null);
				try {
					if (key !== "") {
						const stored = await api.credentials.set({
							ref,
							value: key
						});
						if (!stored.result.ok) throw new Error(stored.result.error.message);
					}
					const response = await api.settings.mutate({
						ns: SETTINGS_NAMESPACE$1,
						ops: [{
							op: "set",
							path: ["providers", split.responsesProviderId],
							value: split.responsesProfile
						}, {
							op: "set",
							path: ["providers", split.completionsProviderId],
							value: split.completionsProfile
						}],
						expectedRevision: namespace.revision
					});
					if (!response.result.ok) throw new Error(response.result.error.message);
					let nextRetryNamespace = retryNamespace;
					let retryWarning = "";
					const retryResponse = await api.settings.mutate({
						ns: RETRY_SETTINGS_NAMESPACE,
						ops: [{
							op: "set",
							path: [
								"requestRetries",
								"providers",
								split.responsesProviderId
							],
							value: split.responsesRetry
						}, {
							op: "set",
							path: [
								"requestRetries",
								"providers",
								split.completionsProviderId
							],
							value: split.completionsRetry
						}],
						expectedRevision: retryNamespace.revision
					});
					if (retryResponse.result.ok) nextRetryNamespace = retryResponse.result.value;
					else retryWarning = t("config.protocolSplitRetryWarning", { error: retryResponse.result.error.message });
					setNamespace(response.result.value);
					setRetryNamespace(nextRetryNamespace);
					openProvider(split.responsesProviderId, response.result.value, nextRetryNamespace);
					const splitFeedback = t("config.protocolSplitDone", {
						responses: split.responsesProviderId,
						completions: split.completionsProviderId,
						count: modelProtocolSummary.completionsOnly
					});
					setFeedback(retryWarning === "" ? splitFeedback : `${splitFeedback} ${retryWarning}`);
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
								protocol: PROTOCOLS.includes(apiProtocol) ? apiProtocol : "openai-responses",
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
					setModelProtocolResults(null);
					setFeedback(t("config.revealSuccess"));
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			};
			const deleteProvider = async () => {
				if (namespace === null || retryNamespace === null || creating || busy !== null || !confirmDiscard()) return;
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
					const retryResponse = await api.settings.mutate({
						ns: RETRY_SETTINGS_NAMESPACE,
						ops: [{
							op: "unset",
							path: [
								"requestRetries",
								"providers",
								providerId
							]
						}],
						expectedRevision: retryNamespace.revision
					});
					if (!retryResponse.result.ok) throw new Error(retryResponse.result.error.message);
					setNamespace(response.result.value);
					setRetryNamespace(retryResponse.result.value);
					const next = Object.keys(providerProfiles(response.result.value.user ?? response.result.value.value)).filter((id) => id !== providerId).sort((left, right) => left.localeCompare(right))[0];
					if (next === void 0) {
						const empty = {
							api: "openai-responses",
							models: []
						};
						const emptyRetry = {
							enabled: false,
							maxRetries: 0,
							models: {}
						};
						setCreating(true);
						setProviderId("");
						setDraft(empty);
						setBaselineSignature(draftSignature("", empty));
						setRetryDraft(emptyRetry);
						setRetryBaselineSignature(requestRetrySignature(emptyRetry));
						setPreviousProviderId("");
						setModelQuery("");
						setCredential(null);
						setKeyDraft("");
						setKeyVisible(false);
						setProtocolResults(null);
						setModelProtocolResults(null);
						setProtocolTestModelId("");
						setApiKeyValidation(null);
					} else openProvider(next, response.result.value, retryResponse.result.value);
					setFeedback(t("config.deleted"));
				} catch (cause) {
					setError(messageOf$1(cause));
				} finally {
					setBusy(null);
				}
			};
			const save = async () => {
				if (namespace === null || retryNamespace === null || busy !== null) return;
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
					const normalizedModels = models.map((model) => ({
						...model,
						id: String(model.id).trim()
					}));
					const overrides = catalogBacked ? catalogOverrides(liveCatalogModels[id] ?? [], normalizedModels) : void 0;
					if (catalogBacked && overrides !== void 0) {
						delete profile.models;
						if (Object.keys(overrides).length === 0) delete profile.modelOverrides;
						else profile.modelOverrides = overrides;
					} else {
						profile.models = normalizedModels;
						delete profile.modelOverrides;
					}
					const savedModelIds = new Set(normalizedModels.map((model) => String(model.id)));
					const savedRetryDraft = {
						...retryDraft,
						models: Object.fromEntries(Object.entries(retryDraft.models).filter(([modelId]) => savedModelIds.has(modelId.trim())).map(([modelId, maxRetries]) => [modelId.trim(), maxRetries]))
					};
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
					let nextRetryNamespace = retryNamespace;
					if (retryDirty) {
						const retryResponse = await api.settings.mutate({
							ns: RETRY_SETTINGS_NAMESPACE,
							ops: [{
								op: "set",
								path: [
									"requestRetries",
									"providers",
									id
								],
								value: savedRetryDraft
							}],
							expectedRevision: retryNamespace.revision
						});
						if (!retryResponse.result.ok) throw new Error(retryResponse.result.error.message);
						nextRetryNamespace = retryResponse.result.value;
						setRetryNamespace(nextRetryNamespace);
					}
					setNamespace(response.result.value);
					setDraft(savedProfile);
					setBaselineSignature(draftSignature(id, savedProfile));
					const appliedRetryDraft = cloneRequestRetryDraft(requestRetryProfiles(nextRetryNamespace.value)[id]);
					setRetryDraft(appliedRetryDraft);
					setRetryBaselineSignature(requestRetrySignature(appliedRetryDraft));
					setApiKeyValidation(null);
					setModelProtocolResults(null);
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
			const readOnly = namespace === null || retryNamespace === null || busy !== null;
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
									onClick: () => setTemplateCatalogOpen((value) => !value),
									children: templateCatalogOpen ? t("config.addProviderClose") : t("config.addProvider")
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
									children: [!creating && providerIds.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: busy !== null,
										onClick: duplicateProvider,
										children: t("config.duplicateProvider")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "dmp-danger",
										disabled: busy !== null,
										onClick: () => void deleteProvider(),
										children: busy === "delete" ? t("config.deleting") : t("config.deleteProvider")
									})] }), creating && providerIds.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: busy !== null,
										onClick: cancelCreate,
										children: t("config.cancelCreate")
									})]
								})]
							}),
							providerIds.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-config-provider-browser",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dmp-config-provider-browser-bar",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										value: providerQuery,
										onChange: (event) => setProviderQuery(event.currentTarget.value),
										placeholder: t("config.providerSearch"),
										"aria-label": t("config.providerSearch")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.providerCount", { count: providerIds.length }) })]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dmp-config-provider-cards",
									children: [filteredProviderCards.map((card) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: `dmp-config-provider-card${card.active ? " is-active" : ""}`,
										disabled: busy !== null,
										onClick: () => selectProvider(card.id),
										title: `${card.displayName} · ${card.id}`,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: "dmp-config-provider-card-icon",
												children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
													id: card.icon,
													size: 22
												})
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
												className: "dmp-config-provider-card-main",
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: card.displayName }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("config.providerCardMeta", {
													count: card.modelCount,
													protocol: card.protocol || "—"
												}) })]
											}),
											card.freeSync && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", {
												className: "dmp-config-provider-card-free",
												children: t("config.freeBadge")
											})
										]
									}, card.id)), filteredProviderCards.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dmp-config-empty",
										children: t("config.providerSearchEmpty")
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
												setModelProtocolResults(null);
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
														setModelProtocolResults(null);
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
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== null,
											onClick: () => void readModelList(),
											children: t("config.modelListRead")
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
											type: "button",
											disabled: busy !== null || models.length === 0 || !hasApiKey,
											onClick: () => void probeAllModelProtocols(),
											children: busy === "protocol-scan" ? t("config.protocolScanning") : t("config.protocolScan")
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
							modelImport !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: "dmp-config-free-picker dmp-config-import-picker",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dmp-config-free-picker-heading",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("config.modelImportTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.modelImportSummary", {
											count: modelImport.models.length,
											selected: modelImport.selection.length
										}) })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setModelImport(null),
											children: t("config.openRouterFreeClose")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dmp-config-free-picker-toolbar",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												value: modelImport.query,
												onChange: (event) => setModelImport((current) => current === null ? null : {
													...current,
													query: event.currentTarget.value
												}),
												placeholder: t("config.modelImportSearch")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setModelImport((current) => current === null ? null : {
													...current,
													selection: [.../* @__PURE__ */ new Set([...current.selection, ...visibleModelImport.map((model) => String(model.id))])]
												}),
												children: t("config.openRouterFreeSelectVisible")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setModelImport((current) => current === null ? null : {
													...current,
													selection: visibleModelImport.map((model) => String(model.id)).filter((id) => !configuredModelIds.has(id))
												}),
												children: t("config.openRouterFreeSelectNew")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: modelImport.selection.length === 0,
												onClick: () => setModelImport((current) => current === null ? null : {
													...current,
													selection: []
												}),
												children: t("config.openRouterFreeClear")
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dmp-config-free-picker-list",
										children: [visibleModelImport.map((model) => {
											const id = String(model.id);
											return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: modelImport.selection.includes(id),
													onChange: () => setModelImport((current) => current === null ? null : {
														...current,
														selection: current.selection.includes(id) ? current.selection.filter((item) => item !== id) : [...current.selection, id]
													})
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dmp-config-free-picker-model",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: typeof model.name === "string" && model.name !== "" ? model.name : id }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: id })]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dmp-config-free-picker-meta",
													children: [
														configuredModelIds.has(id) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: t("config.openRouterFreeConfigured") }),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("config.openRouterFreeContext", { value: typeof model.contextWindow === "number" ? model.contextWindow.toLocaleString() : "?" }) }),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("config.openRouterFreeOutput", { value: typeof model.maxTokens === "number" ? model.maxTokens.toLocaleString() : "?" }) }),
														Array.isArray(model.input) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: model.input.join(" + ") })
													]
												})
											] }, id);
										}), visibleModelImport.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "dmp-config-empty",
											children: t("config.openRouterFreeEmpty")
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dmp-config-free-picker-footer",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.modelImportHint") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											className: "dmp-media-primary",
											type: "button",
											disabled: modelImport.selection.length === 0,
											onClick: importSelectedModels,
											children: t("config.modelImportSelected", { count: modelImport.selection.length })
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
							modelProtocolResults !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: "dmp-config-protocol-scan",
								"aria-label": t("config.protocolScanResults"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dmp-config-protocol-scan-heading",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("config.protocolScanResults") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.protocolScanSummary", {
											responses: modelProtocolSummary.responses,
											completionsOnly: modelProtocolSummary.completionsOnly,
											unsupported: modelProtocolSummary.unsupported
										}) })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [protocolSplitPreview !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											className: "dmp-media-primary",
											type: "button",
											disabled: busy !== null,
											onClick: () => void splitProtocols(),
											children: busy === "protocol-split" ? t("config.protocolSplitting") : t("config.protocolSplit")
										}), modelProtocolSummary.completionsOnly === modelProtocolResults.length && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== null,
											onClick: applyWholeRouteCompletions,
											children: t("config.protocolWholeCompletions")
										})] })]
									}),
									protocolSplitPreview !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("config.protocolSplitPreview", {
										responses: protocolSplitPreview.responsesProviderId,
										completions: protocolSplitPreview.completionsProviderId,
										count: modelProtocolSummary.completionsOnly
									}) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "dmp-config-protocol-scan-list",
										children: modelProtocolResults.map((result) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("article", {
											className: `is-${result.classification}`,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: result.model }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(protocolClassificationLabel(result.classification)) })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", { children: [
												"Responses: ",
												result.responses.available ? t("config.protocolAvailable") : result.responses.error ?? "?",
												" · Completions: ",
												result.completions.available ? t("config.protocolAvailable") : result.completions.error ?? "?"
											] })]
										}, result.model))
									})
								]
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
						className: "dmp-config-card dmp-config-retry-card",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dmp-config-card-heading",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("config.retryTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("config.retryDescription") })] }), retryDraft.enabled && retryDraft.maxRetries === 50 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dmp-config-retry-preset",
								children: t("config.retryPreset50")
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dmp-config-provider-grid",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dmp-media-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.retryProviderMode") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										value: retryDraft.enabled ? "custom" : "inherit",
										disabled: readOnly,
										onChange: (event) => setRetryDraft((current) => ({
											...current,
											enabled: event.currentTarget.value === "custom",
											maxRetries: event.currentTarget.value === "custom" && current.maxRetries === 0 ? 3 : current.maxRetries
										})),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "inherit",
											children: t("config.retryProviderInherit")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "custom",
											children: t("config.retryProviderCustom")
										})]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: "dmp-media-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.retryProviderCount") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "number",
										min: "0",
										max: MAX_REQUEST_RETRIES,
										step: "1",
										value: retryDraft.maxRetries,
										disabled: readOnly || !retryDraft.enabled,
										onChange: (event) => updateProviderRetryCount(event.currentTarget.value)
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dmp-config-retry-note dmp-config-span-2",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("config.retrySafetyTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.retrySafetyDescription", {
										retries: retryDraft.maxRetries,
										attempts: retryDraft.maxRetries + 1
									}) })]
								})
							]
						})]
					}),
					openRouterProfile && !creating && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-config-card dmp-config-freesync-card",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-config-card-heading",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("config.freeSyncTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("config.freeSyncDescription") })] }), freeSyncInfo?.lastSyncAt !== void 0 && typeof freeSyncInfo.lastSyncAt === "string" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dmp-config-freesync-state",
									children: typeof freeSyncInfo.total === "number" ? t("config.freeSyncStateOk", {
										time: new Date(String(freeSyncInfo.lastSyncAt)).toLocaleString(),
										total: freeSyncInfo.total,
										added: typeof freeSyncInfo.added === "number" ? freeSyncInfo.added : 0,
										removed: typeof freeSyncInfo.removed === "number" ? freeSyncInfo.removed : 0
									}) : t("config.freeSyncStateAt", { time: new Date(String(freeSyncInfo.lastSyncAt)).toLocaleString() })
								})]
							}),
							typeof freeSyncInfo?.error === "string" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dmp-media-error",
								role: "alert",
								children: freeSyncInfo.error
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-config-provider-grid",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-media-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.freeSyncToggle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
											value: freeSyncDraft?.enabled ? "on" : "off",
											disabled: readOnly,
											onChange: (event) => toggleFreeSync(event.currentTarget.value === "on"),
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "off",
												children: t("config.freeSyncOff")
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "on",
												children: t("config.freeSyncOn")
											})]
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-media-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.freeSyncInterval") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "number",
											min: "1",
											max: "168",
											step: "1",
											value: freeSyncDraft?.intervalHours ?? 6,
											disabled: readOnly || freeSyncDraft?.enabled !== true,
											onChange: (event) => updateFreeSyncInterval(Number(event.currentTarget.value))
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dmp-config-retry-note dmp-config-span-2",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("config.freeSyncBehaviorTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.freeSyncBehaviorDescription") })]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-config-status-row",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: freeSyncDraft?.enabled ? "is-ok" : "",
									children: freeSyncDraft?.enabled === true ? t("config.freeSyncActive") : t("config.freeSyncIdle")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: busy !== null,
									onClick: () => void runFreeSyncNow(),
									children: busy === "free-sync" ? t("config.freeSyncRunning") : t("config.freeSyncRun")
								}) })]
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
							catalogBacked && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dmp-config-catalog-note",
								children: t("config.catalogModelsManaged")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("datalist", {
								id: "dmp-preset-options",
								children: registry.presets.map((preset) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: preset.name,
									children: preset.name
								}, preset.id))
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
									const modelId = typeof model.id === "string" ? model.id.trim() : "";
									const retryMode = modelRetryMode(retryDraft, modelId);
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
														className: "dmp-config-model-retry",
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
															className: "dmp-media-field",
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.retryModelMode") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
																value: retryMode,
																disabled: readOnly || modelId === "",
																onChange: (event) => updateModelRetryMode(modelId, event.currentTarget.value),
																children: [
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "inherit",
																		children: t("config.retryModelInherit")
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "disabled",
																		children: t("config.retryModelDisabled")
																	}),
																	/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
																		value: "custom",
																		children: t("config.retryModelCustom")
																	})
																]
															})]
														}), retryMode === "custom" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															type: "number",
															min: "1",
															max: MAX_REQUEST_RETRIES,
															step: "1",
															value: retryDraft.models[modelId],
															disabled: readOnly || modelId === "",
															onChange: (event) => updateModelRetryCount(modelId, event.currentTarget.value),
															"aria-label": t("config.retryModelCount")
														})]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														className: "dmp-config-preset",
														children: [
															/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
																className: "dmp-media-field",
																children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("config.preset") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																	list: "dmp-preset-options",
																	value: selectedPreset !== void 0 ? selectedPreset.name : selectedPresetId,
																	disabled: readOnly,
																	onChange: (event) => {
																		const preset = resolvePresetInput(event.currentTarget.value, registry.presets);
																		setManualPresets((current) => ({
																			...current,
																			[index]: preset?.id ?? ""
																		}));
																	},
																	placeholder: t("config.noPreset")
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
															selectedPreset !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: [
																selectedPreset.input?.join(" + "),
																selectedPreset.contextWindow === void 0 ? void 0 : t("config.presetContext", { value: selectedPreset.contextWindow.toLocaleString() }),
																selectedPreset.maxTokens === void 0 ? void 0 : t("config.presetMaxTokens", { value: selectedPreset.maxTokens.toLocaleString() }),
																selectedPreset.reasoningEfforts === void 0 ? void 0 : t("config.presetReasoningLevels", { count: Object.keys(selectedPreset.reasoningEfforts).length })
															].filter(Boolean).join(" · ") })
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
					}),
					templateCatalogOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dmp-overlay",
						role: "dialog",
						"aria-modal": "true",
						"aria-label": t("config.templateTitle"),
						onClick: (event) => {
							if (event.target === event.currentTarget) {
								setTemplateCatalogOpen(false);
								setTemplateQuery("");
							}
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
							className: "dmp-dialog dmp-config-template-dialog",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
								className: "dmp-header",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t("config.templateTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("config.templateHint") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dmp-close",
									onClick: () => {
										setTemplateCatalogOpen(false);
										setTemplateQuery("");
									},
									"aria-label": t("config.openRouterFreeClose"),
									children: "×"
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-config-template-dialog-body",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dmp-config-template-toolbar",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										autoFocus: true,
										value: templateQuery,
										onChange: (event) => setTemplateQuery(event.currentTarget.value),
										placeholder: t("config.templateSearch"),
										"aria-label": t("config.templateSearch")
									})
								}), [
									{
										key: "custom",
										label: t("config.templateCustom"),
										templates: filterTemplates(CUSTOM_TEMPLATES, templateQuery),
										blank: true
									},
									{
										key: "subscription",
										label: t("config.templateSubscription"),
										templates: filterTemplates(SUBSCRIPTION_TEMPLATES, templateQuery),
										blank: false
									},
									{
										key: "catalog",
										label: t("config.templateCatalog"),
										templates: filterTemplates(CATALOG_TEMPLATES, templateQuery),
										blank: false
									}
								].map((group) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dmp-config-template-group",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: group.label }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dmp-config-template-grid",
										children: [
											group.templates.map((template) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "dmp-config-provider-card",
												disabled: busy !== null,
												onClick: () => startCreateFromTemplate(template),
												title: `${template.displayName}${template.hint === void 0 ? "" : ` · ${template.hint}`}`,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dmp-config-provider-card-icon",
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProviderIcon, {
														id: template.icon,
														size: 22
													})
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dmp-config-provider-card-main",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: template.displayName }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: template.hint ?? (template.models === void 0 ? t("config.templateOauth") : t("config.templateModelCount", { count: template.models })) })]
												})]
											}, template.id)),
											group.blank && templateQuery.trim() === "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "dmp-config-provider-card is-blank",
												disabled: busy !== null,
												onClick: startCreate,
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dmp-config-provider-card-icon",
													children: "＋"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dmp-config-provider-card-main",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("config.templateBlank") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: t("config.templateBlankHint") })]
												})]
											}),
											group.templates.length === 0 && !group.blank && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: "dmp-config-empty",
												children: t("config.providerSearchEmpty")
											})
										]
									})]
								}, group.key))]
							})]
						})
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
      upstreamRetries: 2
      retryDelaysMs: [250, 1000]
      retryBodyLimitBytes: 16777216
      strategies:
        - id: aws-global-accelerator
          upstreamHost: a18ccd091ab831ac3.awsglobalaccelerator.com
          hostHeader: api.b.ai
          tlsServerName: a18ccd091ab831ac3.awsglobalaccelerator.com
          certificateHost: api.b.ai
          addressIndex: 0
        - id: aws-global-accelerator-next-address
          upstreamHost: a18ccd091ab831ac3.awsglobalaccelerator.com
          hostHeader: api.b.ai
          tlsServerName: a18ccd091ab831ac3.awsglobalaccelerator.com
          certificateHost: api.b.ai
          addressIndex: 1
        - id: direct-api
          upstreamHost: api.b.ai
          hostHeader: api.b.ai
          tlsServerName: api.b.ai
          certificateHost: api.b.ai
          addressIndex: 0`;
		const GENERIC_RELAY_CONFIG = `- id: dsh-model-palette
  config:
    providerRelays:
      example-provider:
        upstreamHost: reachable-entry.example.net
        hostHeader: api.provider.example
        tlsServerName: reachable-entry.example.net
        certificateHost: api.provider.example
        allowedPathPrefix: /v1/
        timeoutMs: 180000
        upstreamRetries: 2
        retryDelaysMs: [250, 1000]
        retryBodyLimitBytes: 16777216`;
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
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("relay.upstream") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "a18ccd091ab831ac3.awsglobalaccelerator.com → api.b.ai" }) })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("relay.hostHeader") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "api.b.ai" }) })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("relay.allowedPath") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "/v1/*" }) })] })
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dmp-relay-strategies",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("relay.strategyTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("ol", { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "aws-global-accelerator" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("relay.strategyAccelerator") })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "aws-global-accelerator-next-address" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("relay.strategyNextAddress") })] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "direct-api" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("relay.strategyDirect") })] })
								] })]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dmp-relay-note",
								children: t("relay.retryPolicy")
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
		/** Codex-style discrete reasoning-effort slider: provider default plus the seven levels. */
		function EffortSlider({ value, options, defaultLabel, label, disabled, onChange }) {
			const stops = ["", ...options.map((option) => option.id)];
			const index = value === "" ? 0 : Math.max(0, stops.indexOf(value));
			const activeName = value === "" ? defaultLabel : options.find((option) => option.id === value)?.name ?? value;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: `dmp-effort-slider${disabled ? " is-busy" : ""}`,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dmp-effort-slider-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: activeName })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "range",
						min: 0,
						max: stops.length - 1,
						step: 1,
						value: Math.min(index, stops.length - 1),
						disabled,
						"aria-label": label,
						onChange: (event) => onChange(stops[Number(event.currentTarget.value)])
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dmp-effort-slider-scale",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: value === "" ? "is-on" : "",
							children: defaultLabel
						}), options.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: option.id === value ? "is-on" : "",
							children: option.name
						}, option.id))]
					})
				]
			});
		}
		function ModelPalette({ locked, available, directory, load, select, api, isLoopback, t }) {
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
				const outcome = await select(choice.selection);
				if (outcome === void 0 || outcome.ok !== true) {
					const reason = outcome?.error?.message ?? "";
					setError(reason === "" ? t("palette.selectFailed") : t("palette.selectFailedReason", { message: reason }));
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
					const outcome = await select({
						provider: snapshot.current.provider,
						model: snapshot.current.model,
						...value === "" ? {} : { reasoningEffort: value }
					});
					if (outcome === void 0 || outcome.ok !== true) {
						const reason = outcome?.error?.message ?? "";
						setError(reason === "" ? t("palette.selectFailed") : t("palette.selectFailedReason", { message: reason }));
					}
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
					role: "presentation",
					onMouseDown: (event) => {
						if (event.target === event.currentTarget) close();
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-dialog",
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
									snapshot.current !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(EffortSlider, {
										value: currentEffort,
										options: reasoningOptions,
										defaultLabel: t("palette.providerDefault"),
										label: t("palette.effort"),
										disabled: effortBusy,
										onChange: (value) => void chooseEffort(value)
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
			"palette.selectFailedReason": "切换模型失败：{message}",
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
			"config.addProviderClose": "收起新增目录",
			"config.providerSearch": "搜索已配置供应商…",
			"config.providerCount": "{count} 个供应商",
			"config.providerCardMeta": "{count} 个模型 · {protocol}",
			"config.providerSearchEmpty": "没有匹配的供应商",
			"config.freeBadge": "免费同步",
			"config.templateTitle": "从模板新增供应商",
			"config.templateHint": "选择一个模板自动填好端点、协议与密钥引用；OAuth 订阅需在 DSH 官方设置中添加。",
			"config.templateSearch": "搜索模板…",
			"config.templateCustom": "自定义",
			"config.templateSubscription": "订阅（OAuth）",
			"config.templateApiKey": "API 密钥",
			"config.templateOauth": "OAuth 登录 · 由 DSH 官方设置管理",
			"config.templateOauthOnly": "{name} 使用 OAuth 登录，请在 DSH 官方设置的模型页添加。",
			"config.templateModelCount": "{count} 个内置模型",
			"config.templateBlank": "空白供应商",
			"config.templateBlankHint": "手动填写全部配置",
			"config.templateReady": "已按「{name}」模板预填，检查后保存即可。",
			"config.freeSyncTitle": "OpenRouter 免费线路自动同步",
			"config.freeSyncDescription": "每次 DSH 启动与按间隔自动把该线路替换为当前可用的 :free 模型，只显示免费模型。",
			"config.freeSyncToggle": "自动同步",
			"config.freeSyncOn": "开启（启动 + 定时）",
			"config.freeSyncOff": "关闭",
			"config.freeSyncInterval": "同步间隔（小时）",
			"config.freeSyncEnabled": "已开启免费模型自动同步。",
			"config.freeSyncDisabled": "已关闭免费模型自动同步。",
			"config.freeSyncIntervalSaved": "同步间隔已保存为 {hours} 小时。",
			"config.freeSyncRun": "立即同步免费模型",
			"config.freeSyncRunning": "正在同步…",
			"config.freeSyncDone": "同步完成：共 {total} 个免费模型（新增 {added}，移除 {removed}）。",
			"config.freeSyncActive": "自动同步已开启：DSH 启动时与每个间隔自动更新。",
			"config.freeSyncIdle": "自动同步未开启。",
			"config.freeSyncStateOk": "上次同步 {time}：{total} 个模型（+{added} / -{removed}）",
			"config.freeSyncStateAt": "上次尝试 {time}",
			"config.presetContext": "上下文 {value}",
			"config.presetMaxTokens": "输出 {value}",
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
			"config.retryNamespaceMissing": "当前 DSH 没有加载模型选择插件的重试配置命名空间。",
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
			"config.protocolNote": "OpenAI 兼容供应商默认优先 Responses；推理能力不等于 Responses 支持，插件会用真实请求检测并可拆分仅支持 Chat Completions 的模型。",
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
			"config.modelListRead": "读取模型列表",
			"config.modelListReadDone": "已读取 {count} 个模型，请勾选要导入的模型。",
			"config.modelImportTitle": "导入供应商模型列表",
			"config.modelImportSummary": "共 {count} 个 · 已选 {selected} 个",
			"config.modelImportSearch": "搜索模型名称或 ID",
			"config.modelImportHint": "默认不勾选；导入会自动补全容量、输入类型与精确预置。",
			"config.modelImportSelected": "导入选中（{count}）",
			"config.modelImportDone": "已导入 {count} 个模型（新增 {added}，补全 {enriched}，应用预置 {presets}）。",
			"config.templateCatalog": "API 密钥 · 内置目录",
			"config.templateReadyCatalog": "已按「{name}」创建内置目录线路：端点、协议与模型列表来自 DSH 内置目录，填好密钥即可使用。",
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
			"config.protocolProbeAuthentication": "API Key 认证失败，因此无法判断协议支持。请先验证或更新凭据，再重新测试。",
			"config.protocolProbeBlocked": "供应商或网关拒绝了请求，因此无法判断协议支持。请先处理 403/WAF 阻断。",
			"config.protocolProbeTransient": "供应商暂时不可达、限流或连接失败，因此无法判断协议支持，请稍后重试。",
			"config.protocolProbeOne": "仅 {protocol} 通过实际请求测试，建议使用该协议。",
			"config.protocolProbeBoth": "Completions 和 Responses 均通过实际请求测试；优先使用 Responses。",
			"config.protocolAvailable": "可用",
			"config.protocolUnavailable": "不可用：{error}",
			"config.protocolApplyRecommended": "采用 {protocol}",
			"config.protocolApplied": "已将协议草稿切换为 {protocol}，点击“应用配置”后生效。",
			"config.protocolScan": "检查全部模型协议",
			"config.protocolScanning": "正在检查全部协议…",
			"config.protocolScanConfirm": "将对 {count} 个模型分别发送 Responses 和 Chat Completions 最小请求，最多 {requests} 次，可能产生少量费用。插件只分类，不会自动修改配置。继续吗？",
			"config.protocolScanDone": "已检查 {count} 个模型：{completionsOnly} 个仅支持 Chat Completions，{unsupported} 个暂时无法判断。",
			"config.protocolScanAuthentication": "模型协议批量检查遇到 API Key 认证失败；本次结果只能视为无法判断，不会自动切分或移动模型。",
			"config.protocolScanResults": "全部模型协议检查",
			"config.protocolScanSummary": "Responses 优先 {responses} 个 · 仅 Completions {completionsOnly} 个 · 无法判断 {unsupported} 个",
			"config.protocolScanResponses": "仅 Responses 可用，保留在主线路",
			"config.protocolScanCompletionsOnly": "仅 Chat Completions 可用，需要分支",
			"config.protocolScanBoth": "两个协议都可用，优先 Responses",
			"config.protocolScanUnsupported": "两个协议均未成功，不自动移动",
			"config.protocolSplit": "切分 Re/CC 协议",
			"config.protocolSplitting": "正在切分…",
			"config.protocolSplitPreview": "安全预览：{responses} 保持 Responses；新建 {completions}，只放入 {count} 个仅支持 Chat Completions 的模型。Base URL、credential ref、容量、输入、推理和重试设置会继承。",
			"config.protocolSplitConfirm": "将立即写入 DSH：新建供应商 {provider}，并移动 {count} 个仅支持 Chat Completions 的模型；原供应商改为 Responses。继续吗？",
			"config.protocolSplitDone": "已完成协议切分：{responses} 使用 Responses，{completions} 使用 Chat Completions，共移动 {count} 个模型。",
			"config.protocolSplitRetryWarning": "供应商已切分，但重试规则复制失败：{error}",
			"config.protocolCatalogMetadataFailed": "无法完整读取目录模型的容量与输入类型，已取消切分，避免创建错误分支：{error}",
			"config.protocolWholeCompletions": "整条线路改用 Completions",
			"config.protocolWholeCompletionsApplied": "所有已检查模型都仅支持 Chat Completions，已切换当前草稿并补齐兼容项；点击“应用配置”后生效。",
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
			"config.catalogModelsManaged": "当前显示的是 DSH 运行时目录模型；仅修改供应商字段会继续保留 modelOverrides。编辑、增删或批量修改模型时，插件会把完整目录安全转换为显式 models。",
			"config.retryTitle": "模型请求重试",
			"config.retryDescription": "只为当前供应商或指定模型接管瞬态失败；其他线路继续使用 DSH 原有策略。",
			"config.retryPreset50": "B.AI / BankOfAI 预置 50 次",
			"config.retryProviderMode": "供应商默认规则",
			"config.retryProviderInherit": "保持 DSH 原有策略",
			"config.retryProviderCustom": "使用插件重试规则",
			"config.retryProviderCount": "失败后重试次数",
			"config.retrySafetyTitle": "费用与等待时间提示",
			"config.retrySafetyDescription": "N 表示首次失败后的重试次数；当前最多会发送 {attempts} 次请求（{retries} 次重试）。仅网络、超时、429、5xx、空响应和明确 Cloudflare/WAF 403 会重试，401、余额不足、参数错误、模型不存在和上下文超限不会重试。",
			"config.retryCountInvalid": "重试次数必须是 0 到 {max} 的整数。",
			"config.retryModelMode": "模型重试覆盖",
			"config.retryModelInherit": "继承供应商 / DSH",
			"config.retryModelDisabled": "明确不重试",
			"config.retryModelCustom": "自定义次数",
			"config.retryModelCount": "模型失败后重试次数",
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
			"relay.howDescription": "不是另一款插件，也不是 VPN。DSH 把原始 API 请求发送到本机中继，中继只访问同一个供应商；针对 B.AI 只切换连接策略，不切换 provider 或模型。",
			"relay.routeAria": "中继请求路径",
			"relay.routeDsh": "DSH provider",
			"relay.routeLocal": "本机插件中继",
			"relay.routeProvider": "供应商可达入口",
			"relay.security": "API key 仍由 DSH credentials 管理，只在请求转发时经过本机进程。中继拒绝非回环和带转发头的请求，不会变成局域网开放代理。",
			"relay.baiTitle": "内置 B.AI 中继",
			"relay.baiDescription": "只访问 B.AI，不切换 provider 或模型；失败时依次尝试不同的 B.AI 连接策略。",
			"relay.localBaseUrl": "Provider Base URL",
			"relay.upstream": "连接上游",
			"relay.hostHeader": "HTTP Host / 证书名称",
			"relay.allowedPath": "允许路径",
			"relay.strategyTitle": "B.AI 内部访问策略（不换 provider）",
			"relay.strategyAccelerator": "AWS Global Accelerator 的当前 DNS 地址，Host/SNI 仍指向 B.AI。",
			"relay.strategyNextAddress": "同一 B.AI 加速域名的下一个 DNS 地址，避开上一条坏线路。",
			"relay.strategyDirect": "最后尝试 api.b.ai 直连；仍然是同一个 B.AI provider 和模型。",
			"relay.statusHint": "返回 401 表示已经到达 B.AI，应检查 credential；503、502、504、Cloudflare 403 和 ECONNRESET 会切换到下一条 B.AI 策略，不会改用其他 provider。所有策略失败后才返回 503。",
			"relay.retryPolicy": "每次策略都会新建 HTTPS 连接；动态读取 DNS 地址并轮换，不写死 IP；不超过 16 MiB 的请求体可以在 B.AI 策略之间重放。",
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
			"palette.selectFailedReason": "Failed to switch model: {message}",
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
			"config.addProviderClose": "Close catalog",
			"config.providerSearch": "Search configured providers…",
			"config.providerCount": "{count} providers",
			"config.providerCardMeta": "{count} models · {protocol}",
			"config.providerSearchEmpty": "No matching providers",
			"config.freeBadge": "free sync",
			"config.templateTitle": "Add provider from a template",
			"config.templateHint": "Pick a template to prefill the endpoint, protocol, and credential reference; OAuth subscriptions are managed in the official DSH settings.",
			"config.templateSearch": "Search templates…",
			"config.templateCustom": "Custom",
			"config.templateSubscription": "Subscription (OAuth)",
			"config.templateApiKey": "API key",
			"config.templateOauth": "OAuth login · managed by official DSH settings",
			"config.templateOauthOnly": "{name} uses OAuth login. Add it on the official DSH models settings page.",
			"config.templateModelCount": "{count} built-in models",
			"config.templateBlank": "Blank provider",
			"config.templateBlankHint": "Fill in every field manually",
			"config.templateReady": "Prefilled from the \"{name}\" template. Review and save.",
			"config.freeSyncTitle": "OpenRouter free-model auto sync",
			"config.freeSyncDescription": "On every DSH start and on an interval, this route is replaced with the currently available :free models — free models only.",
			"config.freeSyncToggle": "Auto sync",
			"config.freeSyncOn": "On (startup + interval)",
			"config.freeSyncOff": "Off",
			"config.freeSyncInterval": "Interval (hours)",
			"config.freeSyncEnabled": "Free-model auto sync enabled.",
			"config.freeSyncDisabled": "Free-model auto sync disabled.",
			"config.freeSyncIntervalSaved": "Sync interval saved: {hours} h.",
			"config.freeSyncRun": "Sync free models now",
			"config.freeSyncRunning": "Syncing…",
			"config.freeSyncDone": "Sync complete: {total} free models (+{added} / -{removed}).",
			"config.freeSyncActive": "Auto sync is on: DSH updates this route at startup and on each interval.",
			"config.freeSyncIdle": "Auto sync is off.",
			"config.freeSyncStateOk": "Last sync {time}: {total} models (+{added} / -{removed})",
			"config.freeSyncStateAt": "Last attempt {time}",
			"config.presetContext": "context {value}",
			"config.presetMaxTokens": "output {value}",
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
			"config.retryNamespaceMissing": "The model palette retry settings namespace is not loaded.",
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
			"config.protocolNote": "OpenAI-compatible providers default to Responses. Reasoning capability does not prove Responses support; live checks can split Chat Completions-only models.",
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
			"config.modelListRead": "Read model list",
			"config.modelListReadDone": "Fetched {count} models. Select the ones to import.",
			"config.modelImportTitle": "Import provider model list",
			"config.modelImportSummary": "{count} total · {selected} selected",
			"config.modelImportSearch": "Search model name or ID",
			"config.modelImportHint": "Nothing selected by default; import auto-fills capacities, inputs, and exact presets.",
			"config.modelImportSelected": "Import selected ({count})",
			"config.modelImportDone": "Imported {count} models (added {added}, enriched {enriched}, presets {presets}).",
			"config.templateCatalog": "API key · built-in catalog",
			"config.templateReadyCatalog": "Created the \"{name}\" catalog-backed route: endpoint, protocol, and the model list come from the DSH built-in catalog. Add the key and it is ready.",
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
			"config.protocolProbeAuthentication": "API key authentication failed, so protocol support cannot be determined. Validate or update the credential, then retry.",
			"config.protocolProbeBlocked": "The provider or gateway rejected the requests, so protocol support cannot be determined. Resolve the 403/WAF block first.",
			"config.protocolProbeTransient": "The provider was temporarily unavailable, rate-limited, or unreachable. Protocol support cannot be determined; retry later.",
			"config.protocolProbeOne": "Only {protocol} passed the live request test; use that protocol.",
			"config.protocolProbeBoth": "Both Completions and Responses passed the live request test; prefer Responses.",
			"config.protocolAvailable": "available",
			"config.protocolUnavailable": "unavailable: {error}",
			"config.protocolApplyRecommended": "Use {protocol}",
			"config.protocolApplied": "Changed the draft protocol to {protocol}. Apply configuration to save it.",
			"config.protocolScan": "Check every model protocol",
			"config.protocolScanning": "Checking every protocol…",
			"config.protocolScanConfirm": "This sends minimal Responses and Chat Completions requests for {count} models, up to {requests} requests total. It may incur a small charge. The plugin only classifies models until you confirm a change. Continue?",
			"config.protocolScanDone": "Checked {count} models: {completionsOnly} are Chat Completions-only and {unsupported} could not be determined.",
			"config.protocolScanAuthentication": "The all-model protocol check hit API key authentication failures. Treat these results as undetermined; no model will be split or moved automatically.",
			"config.protocolScanResults": "All-model protocol results",
			"config.protocolScanSummary": "Responses-first {responses} · Completions-only {completionsOnly} · undetermined {unsupported}",
			"config.protocolScanResponses": "Responses only; keep on the primary route",
			"config.protocolScanCompletionsOnly": "Chat Completions only; branch required",
			"config.protocolScanBoth": "Both protocols work; prefer Responses",
			"config.protocolScanUnsupported": "Neither protocol succeeded; do not move automatically",
			"config.protocolSplit": "Split Re/CC protocols",
			"config.protocolSplitting": "Splitting…",
			"config.protocolSplitPreview": "Safe preview: {responses} stays on Responses. A new {completions} route receives only the {count} Chat Completions-only models. Base URL, credential ref, capacities, inputs, reasoning, and retry settings are preserved.",
			"config.protocolSplitConfirm": "Write the split to DSH now? This creates {provider}, moves {count} Chat Completions-only models, and changes the original provider to Responses.",
			"config.protocolSplitDone": "Protocol split completed: {responses} uses Responses and {completions} uses Chat Completions; {count} models moved.",
			"config.protocolSplitRetryWarning": "The providers were split, but retry rules could not be copied: {error}",
			"config.protocolCatalogMetadataFailed": "Could not fully resolve catalog capacities and input modalities, so the split was cancelled instead of creating an inaccurate branch: {error}",
			"config.protocolWholeCompletions": "Use Completions for this route",
			"config.protocolWholeCompletionsApplied": "Every checked model is Chat Completions-only. The draft now uses Completions with compatibility defaults; apply configuration to save it.",
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
			"config.catalogModelsManaged": "These models come from the live DSH catalog. Provider-only edits preserve modelOverrides; editing, adding, removing, or bulk-changing a model safely materializes the complete catalog as explicit models.",
			"config.retryTitle": "Model request retries",
			"config.retryDescription": "Take over transient failures only for this provider or selected models; every other route keeps its existing DSH policy.",
			"config.retryPreset50": "B.AI / BankOfAI preset: 50",
			"config.retryProviderMode": "Provider default rule",
			"config.retryProviderInherit": "Keep the DSH policy",
			"config.retryProviderCustom": "Use plugin retry rules",
			"config.retryProviderCount": "Retries after failure",
			"config.retrySafetyTitle": "Cost and wait warning",
			"config.retrySafetyDescription": "N counts retries after the first failure, so this setting can send up to {attempts} requests ({retries} retries). Only network, timeout, 429, 5xx, empty-response, and explicit Cloudflare/WAF 403 failures retry; 401, quota, bad parameters, missing models, and context overflow do not.",
			"config.retryCountInvalid": "Retry count must be an integer from 0 to {max}.",
			"config.retryModelMode": "Model retry override",
			"config.retryModelInherit": "Inherit provider / DSH",
			"config.retryModelDisabled": "Never retry",
			"config.retryModelCustom": "Custom count",
			"config.retryModelCount": "Retries after this model fails",
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
			"relay.howDescription": "It is not another plugin or a VPN. DSH sends the original API request to the local relay, which stays with the same provider; B.AI changes only the connection strategy, never the provider or model.",
			"relay.routeAria": "Relay request route",
			"relay.routeDsh": "DSH provider",
			"relay.routeLocal": "Local plugin relay",
			"relay.routeProvider": "Reachable provider entry",
			"relay.security": "The API key remains in DSH credentials and passes only through the local process during forwarding. The relay rejects non-loopback and forwarded requests, so it is not a LAN-accessible open proxy.",
			"relay.baiTitle": "Built-in B.AI relay",
			"relay.baiDescription": "It stays on B.AI and does not switch provider or model; transient failures move through alternate B.AI connection strategies.",
			"relay.localBaseUrl": "Provider Base URL",
			"relay.upstream": "Connection upstream",
			"relay.hostHeader": "HTTP Host / certificate name",
			"relay.allowedPath": "Allowed path",
			"relay.strategyTitle": "B.AI internal connection strategies (no provider switch)",
			"relay.strategyAccelerator": "The current DNS address for B.AI AWS Global Accelerator; Host and SNI remain B.AI.",
			"relay.strategyNextAddress": "The next DNS address for the same B.AI accelerator, avoiding the previous bad route.",
			"relay.strategyDirect": "A final direct api.b.ai attempt; it is still the same B.AI provider and model.",
			"relay.statusHint": "HTTP 401 means the request reached B.AI, so check the credential. 503, 502, 504, Cloudflare 403, and ECONNRESET move to the next B.AI strategy instead of another provider. The relay returns 503 only after all attempts fail.",
			"relay.retryPolicy": "Each strategy opens a fresh HTTPS connection, resolves and rotates DNS addresses dynamically, and never hardcodes an IP. Bodies up to 16 MiB can be replayed between B.AI strategies.",
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
		//#region src/client/remote-compat.ts
		function jsonValue(value, location) {
			if (value === null || typeof value === "string" || typeof value === "boolean") return value;
			if (typeof value === "number") {
				if (!Number.isFinite(value)) throw new TypeError(`${location} must contain only finite JSON numbers`);
				return value;
			}
			if (Array.isArray(value)) return value.map((item, index) => jsonValue(item, `${location}[${index}]`));
			if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, jsonValue(item, `${location}.${key}`)]));
			throw new TypeError(`${location} must be JSON-compatible`);
		}
		function settingsPathOps(ops) {
			return ops.map((op, index) => op.op === "unset" ? {
				op: "unset",
				path: [...op.path]
			} : {
				op: "set",
				path: [...op.path],
				value: jsonValue(op.value, `settings operation ${index} value`)
			});
		}
		/** Adapt DSH alpha.3 positional Remote methods to the palette's request objects. */
		function paletteApi(remote) {
			return {
				settings: {
					describe: async () => ({ result: await remote.settings.describe() }),
					mutate: async (request) => ({ result: await remote.settings.mutate(request.ns, settingsPathOps(request.ops), request.expectedRevision) })
				},
				credentials: {
					describe: async (request) => {
						const result = await remote.credentials.describe(request.refs);
						return { result: result.ok ? {
							ok: true,
							value: { credentials: result.value }
						} : result };
					},
					set: async (request) => ({ result: await remote.credentials.set(request.ref, request.value) })
				},
				llm: {
					discoverModels: async ({ settingsNs, ...request }) => {
						const result = await remote.llm.discoverModels(settingsNs, request);
						return { result: result.ok ? {
							ok: true,
							value: { models: result.value }
						} : result };
					},
					models: async () => ({ result: await remote.session.modelCatalog() })
				}
			};
		}
		//#endregion
		//#region \0dsh-model-palette-css:src/client/style.css.mjs
		const css = ".dmp-launcher { display: inline-flex; min-width: 0; }\n.dmp-trigger { height: 28px; max-width: 340px; display: inline-flex; align-items: center; gap: 5px; padding: 0 8px; border: 0; border-radius: 16px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 13px; }\n.dmp-trigger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dmp-trigger:focus-visible { outline: 2px solid var(--dsw-alias-border-l2); outline-offset: 1px; }\n.dmp-trigger:disabled { color: var(--dsw-alias-label-dimmed); cursor: default; }\n.dmp-trigger-icon { color: var(--dsw-alias-brand-primary); font-weight: 700; }\n.dmp-trigger-model, .dmp-trigger-provider { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-trigger-model { max-width: 150px; font-weight: 600; }\n.dmp-trigger-provider { max-width: 110px; color: var(--dsw-alias-label-caption); }\n.dmp-trigger kbd { padding: 1px 5px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 5px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-family: inherit; }\n.dmp-overlay { position: fixed; inset: 0; z-index: 10020; display: grid; place-items: center; padding: 24px; background: color-mix(in srgb, var(--dsw-alias-bg-mask, #000) 46%, transparent); backdrop-filter: blur(8px); }\n.dmp-dialog { width: min(920px, calc(100vw - 32px)); height: min(720px, calc(100vh - 48px)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 18px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); box-shadow: 0 24px 80px rgb(0 0 0 / 28%); }\n.dmp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px 14px; }\n.dmp-header h2 { margin: 0; font-size: 18px; line-height: 24px; }\n.dmp-header p { margin: 3px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; }\n.dmp-close { width: 30px; height: 30px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 22px; }\n.dmp-close:hover { background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-search-wrap { display: flex; align-items: center; gap: 9px; margin: 0 22px 12px; padding: 0 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 11px; background: var(--dsw-alias-bg-layer-1); }\n.dmp-search-wrap:focus-within { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); }\n.dmp-search-wrap input { flex: 1; min-width: 0; height: 42px; border: 0; outline: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 14px; }\n.dmp-search-wrap input::placeholder { color: var(--dsw-alias-label-tertiary); }\n.dmp-search-wrap button { border: 0; background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; font-size: 18px; }\n.dmp-error { display: flex; align-items: center; gap: 12px; margin: 0 22px 10px; padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-state-error-secondary); color: var(--dsw-alias-state-error-primary); font-size: 12px; }\n.dmp-error button { margin-left: auto; border: 1px solid currentColor; border-radius: 12px; background: transparent; color: inherit; cursor: pointer; }\n.dmp-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 190px minmax(0, 1fr); border-top: 1px solid var(--dsw-alias-border-inverted); border-bottom: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-providers { min-height: 0; overflow-y: auto; padding: 10px; border-right: 1px solid var(--dsw-alias-border-inverted); background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 72%, transparent); }\n.dmp-providers button { width: 100%; display: flex; align-items: center; gap: 8px; min-height: 34px; padding: 7px 9px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; text-align: left; font: inherit; font-size: 12.5px; }\n.dmp-providers button:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dmp-providers button.is-active { background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); }\n.dmp-providers button span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-providers button small { color: var(--dsw-alias-label-tertiary); }\n.dmp-providers .dmp-media-nav { color: var(--dsw-alias-brand-primary); font-weight: 600; }\n.dmp-provider-divider { height: 1px; margin: 8px 4px; background: var(--dsw-alias-border-inverted); }\n.dmp-results { min-height: 0; overflow-y: auto; padding: 10px; }\n.dmp-result { width: 100%; display: flex; align-items: center; gap: 2px; border-radius: 10px; background: transparent; color: var(--dsw-alias-label-primary); }\n.dmp-result:hover, .dmp-result.is-cursor { background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-result.is-current { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent); }\n.dmp-result-select { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 10px 5px 10px 11px; border: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; font: inherit; }\n.dmp-result-select:focus-visible, .dmp-star:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }\n.dmp-result-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }\n.dmp-result-title { display: flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 600; }\n.dmp-result-title em { padding: 1px 6px; border-radius: 999px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 10px; font-style: normal; font-weight: 500; }\n.dmp-result-meta { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--dsw-alias-label-tertiary); font-size: 11.5px; }\n.dmp-result-meta strong { color: var(--dsw-alias-label-secondary); font-weight: 500; }\n.dmp-result-meta span, .dmp-result-description { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-result-description { color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-reasoning { width: 21px; height: 21px; display: grid; place-items: center; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 6px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-weight: 700; }\n.dmp-star { margin-right: 7px; padding: 4px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-dimmed); cursor: pointer; font: inherit; font-size: 16px; }\n.dmp-star:hover, .dmp-star.is-favorite { color: var(--dsw-alias-state-warn-primary); background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-empty { display: grid; min-height: 220px; place-items: center; color: var(--dsw-alias-label-tertiary); font-size: 13px; }\n.dmp-footer { min-height: 62px; display: flex; align-items: center; gap: 16px; padding: 10px 18px; }\n.dmp-current { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 7px; }\n.dmp-current span { color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-current strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }\n.dmp-current small { color: var(--dsw-alias-label-tertiary); }\n.dmp-effort { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-effort select { height: 30px; max-width: 170px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; }\n.dmp-failures { color: var(--dsw-alias-state-warn-primary); font-size: 11px; }\n.dmp-media { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dmp-media-intro { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 10px; padding: 11px 13px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }\n.dmp-media-intro div { display: flex; flex-direction: column; gap: 2px; }\n.dmp-media-intro strong { font-size: 13px; }\n.dmp-media-intro span { color: var(--dsw-alias-label-tertiary); font-size: 11.5px; line-height: 17px; }\n.dmp-media-intro .dmp-media-safety { flex: none; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, #22a06b 15%, transparent); color: #22a06b; font-size: 10px; font-weight: 600; }\n.dmp-media-catalog { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; padding: 9px 11px; border-bottom: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-media-catalog div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-media-catalog strong { font-size: 12px; }\n.dmp-media-catalog span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-media-catalog button { flex: none; min-height: 29px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 10.5px; }\n.dmp-media-catalog button:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-media-catalog button:disabled { opacity: .5; cursor: default; }\n.dmp-media-error { margin-bottom: 10px; padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-state-error-secondary); color: var(--dsw-alias-state-error-primary); font-size: 12px; }\n.dmp-media-feedback { margin-bottom: 10px; padding: 9px 10px; border-radius: 8px; background: color-mix(in srgb, #22a06b 11%, var(--dsw-alias-bg-layer-2)); color: var(--dsw-alias-label-primary); font-size: 11px; }\n.dmp-media-feedback strong { display: block; margin-bottom: 4px; color: #22a06b; }\n.dmp-media-feedback pre { max-height: 110px; margin: 0; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--dsw-alias-label-secondary); font: inherit; line-height: 16px; }\n.dmp-media-card { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dmp-media-card-heading { display: flex; align-items: flex-start; gap: 9px; }\n.dmp-media-card-heading div { min-width: 0; }\n.dmp-media-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dmp-media-card-heading p { margin: 2px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-media-icon { width: 25px; height: 25px; flex: none; display: grid; place-items: center; border-radius: 7px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 14px; font-weight: 700; }\n.dmp-media-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 10px; }\n.dmp-media-fields { display: grid; grid-template-columns: minmax(0, 1fr) 120px; gap: 8px; }\n.dmp-media-field { min-width: 0; display: flex; flex-direction: column; gap: 4px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-media-field input, .dmp-media-field textarea, .dmp-media-field select { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }\n.dmp-media-field input, .dmp-media-field select { height: 32px; padding: 0 9px; }\n.dmp-media-field textarea { min-height: 58px; resize: vertical; padding: 8px 9px; line-height: 17px; }\n.dmp-media-field input:focus, .dmp-media-field textarea:focus, .dmp-media-field select:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }\n.dmp-media-field input::placeholder, .dmp-media-field textarea::placeholder { color: var(--dsw-alias-label-dimmed); }\n.dmp-media-paid-confirm { display: flex; align-items: flex-start; gap: 8px; padding: 8px 9px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 46%, var(--dsw-alias-border-inverted)); border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 9%, transparent); color: var(--dsw-alias-label-secondary); cursor: pointer; }\n.dmp-media-paid-confirm input { width: 14px; height: 14px; flex: none; margin: 2px 0 0; accent-color: var(--dsw-alias-state-warn-primary, #d97706); }\n.dmp-media-paid-confirm span { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-media-paid-confirm strong { color: var(--dsw-alias-state-warn-primary, #d97706); font-size: 10.5px; line-height: 15px; }\n.dmp-media-paid-confirm small { color: var(--dsw-alias-label-tertiary); font-size: 9.5px; line-height: 14px; }\n.dmp-media-actions { display: flex; flex-wrap: wrap; gap: 7px; }\n.dmp-media-actions button, .dmp-media-primary { min-height: 31px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 11px; }\n.dmp-media-actions button:hover:not(:disabled), .dmp-media-primary:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-media-actions button.dmp-media-primary, .dmp-media-primary { align-self: flex-end; border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 50%, var(--dsw-alias-border-l2)); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); font-weight: 600; }\n.dmp-media-actions button.dmp-media-primary:hover:not(:disabled), .dmp-media-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 88%, #000); color: var(--dsw-alias-label-on-primary, #fff); }\n.dmp-media-actions button:disabled, .dmp-media-primary:disabled { opacity: .5; cursor: default; }\n.dmp-media-job-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; align-items: end; gap: 8px; }\n.dmp-media-job-actions { flex-wrap: nowrap; }\n.dmp-relay { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dmp-relay-intro { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 10px; padding: 11px 13px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }\n.dmp-relay-intro div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-relay-intro strong { font-size: 13px; }\n.dmp-relay-intro span { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; }\n.dmp-relay-intro .dmp-relay-status { flex: none; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, #22a06b 15%, transparent); color: #22a06b; font-size: 10px; font-weight: 600; }\n.dmp-relay-card { position: relative; display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dmp-relay-card-heading { display: flex; align-items: flex-start; gap: 9px; }\n.dmp-relay-card-heading div { min-width: 0; }\n.dmp-relay-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dmp-relay-card-heading p { margin: 2px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-relay-icon { width: 25px; height: 25px; flex: none; display: grid; place-items: center; border-radius: 7px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 13px; font-weight: 700; }\n.dmp-relay-route { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 7px; }\n.dmp-relay-route span { min-width: 0; padding: 8px; border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); text-align: center; font-size: 10.5px; }\n.dmp-relay-route b { color: var(--dsw-alias-brand-primary); font-size: 12px; }\n.dmp-relay-note, .dmp-relay-warning, .dmp-relay-base-example { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-relay-details { display: grid; gap: 1px; margin: 0; overflow: hidden; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 9px; background: var(--dsw-alias-border-inverted); }\n.dmp-relay-details > div { min-width: 0; display: grid; grid-template-columns: 145px minmax(0, 1fr); align-items: center; gap: 10px; padding: 8px 9px; background: var(--dsw-alias-bg-layer-1); }\n.dmp-relay-details dt { color: var(--dsw-alias-label-tertiary); font-size: 10px; }\n.dmp-relay-details dd { min-width: 0; display: flex; align-items: center; gap: 7px; margin: 0; color: var(--dsw-alias-label-secondary); font-size: 10.5px; }\n.dmp-relay-details code, .dmp-relay-base-example code { min-width: 0; overflow: hidden; color: var(--dsw-alias-label-primary); text-overflow: ellipsis; white-space: nowrap; }\n.dmp-relay-strategies { display: grid; gap: 7px; padding: 9px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 9px; background: var(--dsw-alias-bg-layer-1); }\n.dmp-relay-strategies strong { color: var(--dsw-alias-label-secondary); font-size: 10.5px; }\n.dmp-relay-strategies ol { display: grid; gap: 5px; margin: 0; padding-left: 20px; color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 15px; }\n.dmp-relay-strategies li { padding-left: 2px; }\n.dmp-relay-strategies li code { margin-right: 6px; color: var(--dsw-alias-brand-primary); }\n.dmp-relay-strategies li span { color: var(--dsw-alias-label-tertiary); }\n.dmp-relay-details button, .dmp-relay-actions button, .dmp-relay-copy-code { flex: none; min-height: 29px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 10.5px; }\n.dmp-relay-details button:hover, .dmp-relay-actions button:hover, .dmp-relay-copy-code:hover { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-relay-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; }\n.dmp-relay-actions button.dmp-relay-primary { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); font-weight: 600; }\n.dmp-relay-code { max-height: 230px; margin: 0; overflow: auto; padding: 10px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 9px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 15px; white-space: pre; }\n.dmp-relay-copy-code { align-self: flex-end; }\n.dmp-relay-expand ol { margin: 0; padding-left: 21px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; line-height: 16px; }\n.dmp-relay-warning { padding: 8px 9px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 44%, var(--dsw-alias-border-inverted)); border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 8%, transparent); color: var(--dsw-alias-state-warn-primary, #d97706); }\n.dmp-config { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dmp-config-toolbar, .dmp-config-card-heading, .dmp-config-status-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }\n.dmp-config-toolbar { margin-bottom: 10px; padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent); }\n.dmp-config-toolbar > div:first-child { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-config-toolbar strong { font-size: 13px; }\n.dmp-config-toolbar span, .dmp-config-card-heading p, .dmp-config-status-row, .dmp-config-heading-actions > span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-config-toolbar-actions, .dmp-config-heading-actions, .dmp-config-provider-actions, .dmp-config-status-row > div, .dmp-config-key-input, .dmp-config-preset, .dmp-config-model-top > div { display: flex; align-items: center; gap: 7px; }\n.dmp-config-dirty { padding: 3px 7px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 12%, transparent); color: var(--dsw-alias-state-warn-primary, #d97706) !important; font-size: 9.5px !important; font-weight: 600; }\n.dmp-config-compat-warning { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 44%, var(--dsw-alias-border-inverted)); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 9%, var(--dsw-alias-bg-layer-2)); }\n.dmp-config-compat-warning > div { min-width: 0; display: flex; flex-direction: column; gap: 3px; }\n.dmp-config-compat-warning strong { color: var(--dsw-alias-state-warn-primary, #d97706); font-size: 11.5px; }\n.dmp-config-compat-warning span { color: var(--dsw-alias-label-secondary); font-size: 10.5px; line-height: 15px; overflow-wrap: anywhere; }\n.dmp-config-compat-warning button { flex: none; min-height: 31px; padding: 0 10px; border: 1px solid var(--dsw-alias-state-warn-primary, #d97706); border-radius: 8px; background: var(--dsw-alias-state-warn-primary, #d97706); color: #fff; cursor: pointer; font-size: 10.5px; font-weight: 600; }\n.dmp-config button, .dmp-config select { font: inherit; }\n.dmp-config-toolbar button, .dmp-config-card-heading button, .dmp-config-provider-actions button, .dmp-config-status-row button, .dmp-config-preset button, .dmp-config-model-top button { min-height: 29px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10.5px; }\n.dmp-config-toolbar button:hover:not(:disabled), .dmp-config-card-heading button:hover:not(:disabled), .dmp-config-provider-actions button:hover:not(:disabled), .dmp-config-status-row button:hover:not(:disabled), .dmp-config-preset button:hover:not(:disabled), .dmp-config-model-top button:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-config button.dmp-danger { color: var(--dsw-alias-state-error-primary); }\n.dmp-config button.dmp-danger:hover:not(:disabled) { border-color: var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }\n.dmp-config button:disabled { opacity: .5; cursor: default; }\n.dmp-config-card { margin-bottom: 10px; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dmp-config-card-heading { align-items: flex-start; margin-bottom: 11px; }\n.dmp-config-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dmp-config-card-heading p { margin: 2px 0 0; }\n.dmp-config-retry-preset { flex: none; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); color: var(--dsw-alias-brand-primary); font-size: 10px; font-weight: 650; }\n.dmp-config-retry-note { display: flex; flex-direction: column; justify-content: center; gap: 2px; min-height: 54px; padding: 8px 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 38%, var(--dsw-alias-border-inverted)); border-radius: 9px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 7%, transparent); }\n.dmp-config-retry-note strong { color: var(--dsw-alias-state-warn-primary, #d97706); font-size: 10.5px; }\n.dmp-config-retry-note span { color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 14px; }\n.dmp-config-model-retry { display: flex; align-items: end; gap: 6px; }\n.dmp-config-model-retry > label { flex: 1; }\n.dmp-config-model-retry > input { width: 76px; height: 32px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; }\n.dmp-config-provider-actions { flex-wrap: wrap; justify-content: flex-end; }\n.dmp-config-provider-actions select { min-width: 190px; height: 31px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; }\n.dmp-config-provider-grid, .dmp-config-model-grid, .dmp-config-compat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; }\n.dmp-config-span-2 { grid-column: span 2; }\n.dmp-config-protocol-note { grid-column: span 3; align-self: end; min-height: 32px; display: flex; align-items: center; padding: 0 9px; border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 14px; }\n.dmp-config-key-field { grid-column: span 3; }\n.dmp-config-key-input input { flex: 1; min-width: 0; }\n.dmp-config-key-input button { flex: none; min-height: 30px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10px; }\n.dmp-config-status-row { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-config-status-row > span.is-ok { color: #22a06b; }\n.dmp-config-status-row > div { margin-left: auto; }\n.dmp-config-protocol-model { display: flex; align-items: center; gap: 6px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-config-protocol-model select { max-width: 190px; height: 29px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 7px; font: inherit; font-size: 10.5px; }\n.dmp-config-status-row button.dmp-media-primary { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); }\n.dmp-config-protocol-results { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--dsw-alias-border-inverted); font-size: 10.5px; }\n.dmp-config-protocol-results span { display: inline-flex; align-items: baseline; gap: 4px; color: var(--dsw-alias-label-secondary); }\n.dmp-config-protocol-results span.is-ok { color: #22a06b; }\n.dmp-config-protocol-results span.is-error { color: var(--dsw-alias-state-error-primary); }\n.dmp-config-protocol-results button { min-height: 27px; padding: 0 8px; border: 1px solid var(--dsw-alias-brand-primary); border-radius: 7px; background: transparent; color: var(--dsw-alias-brand-primary); cursor: pointer; font-size: 10px; }\n.dmp-config-protocol-scan { margin-top: 9px; padding: 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, var(--dsw-alias-border-inverted)); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, var(--dsw-alias-bg-layer-2)); }\n.dmp-config-protocol-scan-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }\n.dmp-config-protocol-scan-heading > div { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }\n.dmp-config-protocol-scan-heading > div:first-child { min-width: 0; flex-direction: column; align-items: flex-start; gap: 2px; }\n.dmp-config-protocol-scan-heading strong { font-size: 11.5px; }\n.dmp-config-protocol-scan-heading span, .dmp-config-protocol-scan > p { color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 14px; }\n.dmp-config-protocol-scan-heading button { min-height: 27px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10px; }\n.dmp-config-protocol-scan-heading button.dmp-media-primary { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); }\n.dmp-config-protocol-scan > p { margin: 8px 0 0; padding: 7px 8px; border-radius: 7px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent); }\n.dmp-config-protocol-scan-list { display: flex; flex-direction: column; gap: 5px; max-height: 300px; overflow-y: auto; margin-top: 8px; }\n.dmp-config-protocol-scan-list article { padding: 7px 8px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); }\n.dmp-config-protocol-scan-list article > div { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.dmp-config-protocol-scan-list article strong, .dmp-config-protocol-scan-list article span { font-size: 10px; }\n.dmp-config-protocol-scan-list article span { color: var(--dsw-alias-label-secondary); }\n.dmp-config-protocol-scan-list article small { display: block; margin-top: 3px; color: var(--dsw-alias-label-tertiary); font-size: 9px; line-height: 13px; overflow-wrap: anywhere; }\n.dmp-config-protocol-scan-list article.is-responses-preferred, .dmp-config-protocol-scan-list article.is-both { border-color: color-mix(in srgb, #22a06b 44%, var(--dsw-alias-border-inverted)); }\n.dmp-config-protocol-scan-list article.is-completions-only { border-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 48%, var(--dsw-alias-border-inverted)); }\n.dmp-config-protocol-scan-list article.is-unsupported { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 42%, var(--dsw-alias-border-inverted)); }\n.dmp-config-catalog-note { margin: 0 0 10px; padding: 8px 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, var(--dsw-alias-border-inverted)); border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, var(--dsw-alias-bg-layer-2)); color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-config-key-validation { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--dsw-alias-border-inverted); font-size: 10.5px; }\n.dmp-config-key-validation strong { font-weight: 600; }\n.dmp-config-key-validation span { color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }\n.dmp-config-key-validation.is-valid strong { color: #22a06b; }\n.dmp-config-key-validation.is-invalid strong, .dmp-config-key-validation.is-blocked strong { color: var(--dsw-alias-state-error-primary); }\n.dmp-config-key-validation.is-unavailable strong { color: var(--dsw-alias-state-warn-primary, #d97706); }\n.dmp-config-key-validation.is-unknown strong { color: var(--dsw-alias-label-tertiary); }\n.dmp-config-batch-results { margin-bottom: 10px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 11px; background: var(--dsw-alias-bg-layer-2); }\n.dmp-config-batch-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }\n.dmp-config-batch-heading > div { display: flex; flex-direction: column; gap: 2px; }\n.dmp-config-batch-heading strong { font-size: 12px; }\n.dmp-config-batch-heading span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-config-batch-heading button, .dmp-config-batch-list button, .dmp-config-reasoning-toolbar button { min-height: 27px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10px; }\n.dmp-config-batch-list { display: flex; flex-direction: column; gap: 6px; }\n.dmp-config-batch-list article { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 9px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; }\n.dmp-config-batch-list article > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-config-batch-list article > div:last-child { align-items: flex-end; flex: none; }\n.dmp-config-batch-list article strong, .dmp-config-batch-list article > div:last-child > span { font-size: 10.5px; }\n.dmp-config-batch-list article span, .dmp-config-batch-list article small { color: var(--dsw-alias-label-tertiary); font-size: 9.5px; overflow-wrap: anywhere; }\n.dmp-config-batch-list article.is-valid { border-color: color-mix(in srgb, #22a06b 48%, var(--dsw-alias-border-inverted)); }\n.dmp-config-batch-list article.is-valid > div:last-child > span { color: #22a06b; }\n.dmp-config-batch-list article.is-invalid, .dmp-config-batch-list article.is-blocked, .dmp-config-batch-list article.is-missing { border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 48%, var(--dsw-alias-border-inverted)); }\n.dmp-config-batch-list article.is-invalid > div:last-child > span, .dmp-config-batch-list article.is-blocked > div:last-child > span, .dmp-config-batch-list article.is-missing > div:last-child > span { color: var(--dsw-alias-state-error-primary); }\n.dmp-config-free-picker { margin-top: 10px; padding: 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 32%, var(--dsw-alias-border-inverted)); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, var(--dsw-alias-bg-layer-2)); }\n.dmp-config-free-picker-heading, .dmp-config-free-picker-toolbar, .dmp-config-free-picker-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }\n.dmp-config-free-picker-heading > div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-config-free-picker-heading strong { font-size: 12px; }\n.dmp-config-free-picker-heading span, .dmp-config-free-picker-footer span { color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 14px; }\n.dmp-config-free-picker button { min-height: 27px; padding: 0 8px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10px; }\n.dmp-config-free-picker button:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-config-free-picker button:disabled { opacity: .5; cursor: default; }\n.dmp-config-free-picker-toolbar { justify-content: flex-start; flex-wrap: wrap; margin-top: 9px; }\n.dmp-config-free-picker-toolbar input { width: min(260px, 100%); height: 29px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 7px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; font: inherit; font-size: 10.5px; }\n.dmp-config-free-picker-toolbar input:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }\n.dmp-config-free-picker-list { display: flex; flex-direction: column; gap: 5px; max-height: 310px; overflow-y: auto; margin-top: 9px; padding-right: 2px; }\n.dmp-config-free-picker-list > label { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 7px 8px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); cursor: pointer; }\n.dmp-config-free-picker-list > label:hover { border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 48%, var(--dsw-alias-border-inverted)); }\n.dmp-config-free-picker-list input { accent-color: var(--dsw-alias-brand-primary); }\n.dmp-config-free-picker-model, .dmp-config-free-picker-meta { display: flex; min-width: 0; }\n.dmp-config-free-picker-model { flex-direction: column; gap: 1px; }\n.dmp-config-free-picker-model strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10.5px; }\n.dmp-config-free-picker-model small, .dmp-config-free-picker-meta small { color: var(--dsw-alias-label-tertiary); font-size: 9px; }\n.dmp-config-free-picker-model small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-config-free-picker-meta { align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 5px 8px; }\n.dmp-config-free-picker-meta em { padding: 1px 5px; border-radius: 999px; background: color-mix(in srgb, #22a06b 12%, transparent); color: #22a06b; font-size: 8.5px; font-style: normal; font-weight: 700; }\n.dmp-config-free-picker-footer { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-config-free-picker-footer button.dmp-media-primary { flex: none; border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); }\n.dmp-config-heading-actions { flex-wrap: wrap; justify-content: flex-end; }\n.dmp-config-model-search { width: 190px; height: 29px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 9px; font: inherit; font-size: 10.5px; }\n.dmp-config-model-search:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }\n.dmp-config-models { display: flex; flex-direction: column; gap: 9px; }\n.dmp-config-empty { min-height: 90px; display: grid; place-items: center; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-config-model { padding: 10px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 70%, transparent); }\n.dmp-config-model-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }\n.dmp-config-model-title { display: flex; align-items: center; gap: 7px; min-width: 0; }\n.dmp-config-model-title > strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }\n.dmp-config-model-title > small { flex: 0 0 auto; padding: 1px 6px; border: 1px solid color-mix(in srgb, #22a06b 38%, transparent); border-radius: 999px; background: color-mix(in srgb, #22a06b 12%, transparent); color: #22a06b; font-size: 9px; font-weight: 700; line-height: 15px; text-transform: uppercase; }\n.dmp-config-model-top button { min-height: 25px; color: var(--dsw-alias-state-error-primary); }\n.dmp-config-inputs { grid-column: span 2; min-width: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 9px; margin: 0; padding: 5px 8px 7px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; }\n.dmp-config-inputs legend { padding: 0 4px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-config-inputs label { display: flex; align-items: center; gap: 4px; color: var(--dsw-alias-label-secondary); font-size: 10.5px; }\n.dmp-config-inputs input { accent-color: var(--dsw-alias-brand-primary); }\n.dmp-config-inputs small { color: var(--dsw-alias-label-dimmed); font-size: 9.5px; }\n.dmp-config-preset { grid-column: span 2; align-items: end; min-width: 0; }\n.dmp-config-preset .dmp-media-field { flex: 1; }\n.dmp-config-preset a { flex: none; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-brand-primary); font-size: 9.5px; text-decoration: none; }\n.dmp-config-preset > small { flex: none; max-width: 150px; color: var(--dsw-alias-label-tertiary); font-size: 9.5px; line-height: 13px; }\n.dmp-config-compat { margin-top: 8px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-config-compat summary { padding-top: 8px; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10.5px; }\n.dmp-config-compat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); padding-top: 8px; }\n.dmp-config-compat p { margin: 8px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10px; }\n.dmp-config-reasoning { margin-top: 8px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-config-reasoning summary { padding-top: 8px; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 10.5px; }\n.dmp-config-reasoning-toolbar { display: flex; align-items: end; gap: 8px; padding-top: 8px; }\n.dmp-config-reasoning-toolbar > label { width: 190px; flex: none; }\n.dmp-config-reasoning-toolbar small { color: var(--dsw-alias-label-tertiary); font-size: 9.5px; line-height: 14px; }\n.dmp-config-reasoning-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin-top: 8px; }\n.dmp-config-reasoning-grid > label { display: flex; flex-direction: column; gap: 4px; padding: 7px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 7px; }\n.dmp-config-reasoning-grid span { color: var(--dsw-alias-label-secondary); font-size: 10px; }\n.dmp-config-reasoning-grid input[type='text'], .dmp-config-reasoning-grid > label > input { width: 100%; min-width: 0; height: 27px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 7px; font: inherit; font-size: 10px; }\n@media (max-width: 680px) { .dmp-overlay { padding: 8px; } .dmp-dialog { width: 100%; height: min(680px, calc(100vh - 16px)); border-radius: 14px; } .dmp-body { grid-template-columns: 125px minmax(0, 1fr); } .dmp-providers { padding: 7px; } .dmp-result-description, .dmp-trigger kbd { display: none; } .dmp-footer { flex-wrap: wrap; } }\n@media (max-width: 760px) { .dmp-media-grid { grid-template-columns: 1fr; } .dmp-media-job-row { grid-template-columns: 1fr; } .dmp-media-job-actions { flex-wrap: wrap; } }\n@media (max-width: 760px) { .dmp-relay-route { grid-template-columns: 1fr; } .dmp-relay-route b { transform: rotate(90deg); text-align: center; } .dmp-relay-details > div { grid-template-columns: 1fr; gap: 4px; } .dmp-relay-details dd { align-items: stretch; flex-direction: column; } .dmp-relay-details code { white-space: normal; overflow-wrap: anywhere; } }\n@media (max-width: 820px) { .dmp-config-provider-grid, .dmp-config-model-grid, .dmp-config-compat-grid, .dmp-config-reasoning-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .dmp-config-span-2, .dmp-config-key-field, .dmp-config-protocol-note, .dmp-config-inputs, .dmp-config-preset { grid-column: span 2; } .dmp-config-toolbar, .dmp-config-card-heading, .dmp-config-status-row, .dmp-config-compat-warning, .dmp-config-batch-list article, .dmp-config-reasoning-toolbar, .dmp-config-free-picker-heading, .dmp-config-free-picker-footer, .dmp-config-protocol-scan-heading { align-items: stretch; flex-direction: column; } .dmp-config-toolbar-actions, .dmp-config-heading-actions, .dmp-config-provider-actions, .dmp-config-status-row > div, .dmp-config-protocol-scan-heading > div { justify-content: flex-start; margin-left: 0; flex-wrap: wrap; } .dmp-config-model-search, .dmp-config-reasoning-toolbar > label { width: min(100%, 260px); } .dmp-config-batch-list article > div:last-child { align-items: flex-start; } .dmp-config-free-picker-list > label { grid-template-columns: auto minmax(0, 1fr); } .dmp-config-free-picker-meta { grid-column: 2; justify-content: flex-start; } }\n\n/* ---- provider catalog cards + template gallery + free sync (v0.11) ---- */\n.dmp-config-provider-browser { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }\n.dmp-config-provider-browser-bar { display: flex; align-items: center; gap: 10px; }\n.dmp-config-provider-browser-bar input { flex: 1; min-width: 0; height: 32px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 9px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 10px; font: inherit; font-size: 12px; }\n.dmp-config-provider-browser-bar input:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -1px; }\n.dmp-config-provider-browser-bar span { flex: none; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-config-provider-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; max-height: 240px; overflow-y: auto; }\n.dmp-config-provider-card { display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 9px 11px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 11px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); cursor: pointer; text-align: left; font: inherit; }\n.dmp-config-provider-card:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-config-provider-card.is-active { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent); }\n.dmp-config-provider-card.is-blank { border-style: dashed; color: var(--dsw-alias-label-secondary); }\n.dmp-config-provider-card:disabled { opacity: 0.55; cursor: default; }\n.dmp-config-provider-card-icon { flex: none; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-brand-primary); font-size: 18px; font-weight: 700; }\n.dmp-config-provider-card-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }\n.dmp-config-provider-card-main strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }\n.dmp-config-provider-card-main small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-config-provider-card-free { flex: none; padding: 1px 7px; border-radius: 999px; background: color-mix(in srgb, var(--dsw-alias-state-ok-primary, #2e9e5b) 16%, transparent); color: var(--dsw-alias-state-ok-primary, #2e9e5b); font-size: 9.5px; font-style: normal; font-weight: 600; }\n.dmp-config-template-dialog { width: min(880px, calc(100vw - 48px)); height: min(680px, calc(100vh - 64px)); }\n.dmp-config-template-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }\n.dmp-config-template-heading strong { font-size: 12.5px; }\n.dmp-config-template-heading span { display: block; margin-top: 2px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-config-template-toolbar { display: flex; align-items: center; gap: 8px; }\n.dmp-config-template-toolbar input { width: min(240px, 100%); height: 30px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 9px; font: inherit; font-size: 11.5px; }\n.dmp-config-template-group h4 { margin: 2px 0 6px; color: var(--dsw-alias-label-secondary); font-size: 11px; font-weight: 600; }\n.dmp-config-template-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }\n.dmp-config-freesync-state { flex: none; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n@media (max-width: 820px) { .dmp-config-provider-cards, .dmp-config-template-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }\n\n/* ---- effort slider (Codex-style) + import picker polish (v0.12) ---- */\n.dmp-footer { flex-wrap: wrap; row-gap: 8px; }\n.dmp-effort-slider { flex: 1 1 250px; min-width: 250px; max-width: 430px; display: flex; flex-direction: column; gap: 2px; padding: 6px 10px 4px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 72%, transparent); }\n.dmp-effort-slider-head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }\n.dmp-effort-slider-head span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-effort-slider-head strong { color: var(--dsw-alias-brand-primary); font-size: 11.5px; }\n.dmp-effort-slider input[type='range'] { -webkit-appearance: none; appearance: none; width: 100%; height: 16px; margin: 0; background: transparent; cursor: pointer; }\n.dmp-effort-slider input[type='range']:focus-visible { outline: none; }\n.dmp-effort-slider input[type='range']::-webkit-slider-runnable-track { height: 5px; border-radius: 3px; background: linear-gradient(90deg, var(--dsw-alias-brand-primary), color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, #8b5cf6)); }\n.dmp-effort-slider input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 13px; height: 13px; margin-top: -4px; border-radius: 50%; background: var(--dsw-alias-bg-layer-2); border: 2px solid var(--dsw-alias-brand-primary); box-shadow: 0 1px 4px rgb(0 0 0 / 35%); transition: transform .12s ease; }\n.dmp-effort-slider input[type='range']:hover::-webkit-slider-thumb { transform: scale(1.18); }\n.dmp-effort-slider input[type='range']:focus-visible::-webkit-slider-thumb { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }\n.dmp-effort-slider input[type='range']::-moz-range-track { height: 5px; border-radius: 3px; background: linear-gradient(90deg, var(--dsw-alias-brand-primary), color-mix(in srgb, var(--dsw-alias-brand-primary) 35%, #8b5cf6)); }\n.dmp-effort-slider input[type='range']::-moz-range-thumb { width: 13px; height: 13px; border-radius: 50%; background: var(--dsw-alias-bg-layer-2); border: 2px solid var(--dsw-alias-brand-primary); box-shadow: 0 1px 4px rgb(0 0 0 / 35%); }\n.dmp-effort-slider input[type='range']:disabled { opacity: .5; cursor: default; }\n.dmp-effort-slider-scale { display: flex; justify-content: space-between; gap: 2px; }\n.dmp-effort-slider-scale span { flex: 1 1 0; min-width: 0; overflow: hidden; text-align: center; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-tertiary); font-size: 8.5px; line-height: 12px; }\n.dmp-effort-slider-scale span.is-on { color: var(--dsw-alias-brand-primary); font-weight: 700; }\n.dmp-effort-slider.is-busy { opacity: .6; pointer-events: none; }\n.dmp-config-import-picker .dmp-config-free-picker-list { max-height: 300px; }\n.dmp-config-import-picker .dmp-config-free-picker-list label { cursor: pointer; transition: background .1s ease; }\n.dmp-config-import-picker .dmp-config-free-picker-list label:hover { background: var(--dsw-alias-interactive-bg-hover); }\n\n\n.dmp-config-template-dialog-body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding: 0 22px 20px; }\n.dmp-config-template-dialog .dmp-config-template-toolbar input { width: min(320px, 100%); height: 34px; }\n.dmp-config-template-dialog .dmp-config-template-group h4 { margin: 4px 0 6px; padding-top: 2px; border-top: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-config-template-dialog .dmp-config-provider-card { background: var(--dsw-alias-bg-layer-1); }\n\n";
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
			"connection",
			"remote",
			"remote.settings",
			"remote.credentials",
			"remote.llm",
			"remote.session"
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
								if (!available) return void 0;
								try {
									return await directory.select(selection);
								} catch (error) {
									console.error("[dsh-model-palette] model selection failed", error);
									return;
								}
							},
							api: paletteApi(ctx.remote),
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
