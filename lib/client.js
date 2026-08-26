window.__ModuleLoader__.load({
	id: "dsh-model-palette",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/media.ts
		function required(value, field) {
			const normalized = value.trim();
			if (normalized === "") throw new Error(`${field} is required`);
			return normalized;
		}
		function optional(value) {
			const normalized = value?.trim();
			return normalized === void 0 || normalized === "" ? void 0 : normalized;
		}
		function mediaModelsRequest(kind) {
			return [
				"请调用 `openrouter_media_models` 查询 OpenRouter 媒体模型。",
				`参数：${JSON.stringify({
					kind,
					preferred_only: false,
					free_only: true
				})}。`,
				"请用简洁表格列出模型 ID、类型、是否为首选模型和可用规格，不要发起生成。"
			].join("\n");
		}
		function imageGenerationRequest(input) {
			const prompt = required(input.prompt, "prompt");
			const model = optional(input.model);
			const outputName = optional(input.outputName);
			const generation = {
				...model === void 0 ? {} : { model },
				prompt,
				...outputName === void 0 ? {} : { output_name: outputName }
			};
			if (model !== void 0) return [
				"请调用 `openrouter_generate_image` 生成图像。",
				`参数：${JSON.stringify(generation)}。`,
				"完成后告诉我生成文件的绝对路径。"
			].join("\n");
			return [
				"请完成一次 OpenRouter 免费图像生成。",
				`生成要求：${JSON.stringify(generation)}。`,
				"先调用 `openrouter_media_models`，参数为 {\"kind\":\"image\",\"preferred_only\":true,\"free_only\":true}；如果没有结果，再把 preferred_only 改为 false 查询。",
				"从结果中选择当前可用的免费模型，再调用 `openrouter_generate_image`。不要改用付费模型。完成后告诉我生成文件的绝对路径。"
			].join("\n");
		}
		function videoGenerationRequest(input) {
			const prompt = required(input.prompt, "prompt");
			const model = optional(input.model);
			if (input.duration !== void 0 && (!Number.isInteger(input.duration) || input.duration < 1 || input.duration > 60)) throw new Error("duration must be an integer from 1 to 60");
			const generation = {
				...model === void 0 ? {} : { model },
				prompt,
				...input.duration === void 0 ? {} : { duration: input.duration }
			};
			if (model !== void 0) return [
				"请调用 `openrouter_generate_video` 提交视频生成任务。",
				`参数：${JSON.stringify(generation)}。`,
				"提交后告诉我任务 ID 和当前状态，不要自动重复提交。"
			].join("\n");
			return [
				"请完成一次 OpenRouter 免费视频生成任务提交。",
				`生成要求：${JSON.stringify(generation)}。`,
				"先调用 `openrouter_media_models`，参数为 {\"kind\":\"video\",\"preferred_only\":true,\"free_only\":true}；如果没有结果，再把 preferred_only 改为 false 查询。",
				"从结果中选择当前可用的免费模型，再调用 `openrouter_generate_video`。不要改用付费模型。提交后告诉我任务 ID 和当前状态，不要自动重复提交。"
			].join("\n");
		}
		function videoStatusRequest(jobId) {
			return [
				"请调用 `openrouter_video_status` 查询视频任务。",
				`参数：${JSON.stringify({ job_id: required(jobId, "job_id") })}。`,
				"请报告任务状态；如果尚未完成，不要重新提交生成任务。"
			].join("\n");
		}
		function videoDownloadRequest(jobId, outputName) {
			const normalizedOutputName = optional(outputName);
			const args = {
				job_id: required(jobId, "job_id"),
				...normalizedOutputName === void 0 ? {} : { output_name: normalizedOutputName }
			};
			return [
				"请调用 `openrouter_download_video` 下载已完成的视频任务。",
				`参数：${JSON.stringify(args)}。`,
				"完成后告诉我视频文件的绝对路径。"
			].join("\n");
		}
		//#endregion
		//#region src/client/MediaPanel.tsx
		function MediaPanel({ locked, sendPrompt, onSubmitted, t }) {
			const [imagePrompt, setImagePrompt] = (0, react.useState)("");
			const [imageModel, setImageModel] = (0, react.useState)("");
			const [imageOutputName, setImageOutputName] = (0, react.useState)("");
			const [videoPrompt, setVideoPrompt] = (0, react.useState)("");
			const [videoModel, setVideoModel] = (0, react.useState)("");
			const [videoDuration, setVideoDuration] = (0, react.useState)("");
			const [jobId, setJobId] = (0, react.useState)("");
			const [videoOutputName, setVideoOutputName] = (0, react.useState)("");
			const [pending, setPending] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const submit = async (action, request) => {
				if (locked || pending !== null) return;
				setError(null);
				let prompt;
				try {
					prompt = request();
				} catch {
					setError(action === "image" || action === "video" ? t("media.promptRequired") : t("media.jobRequired"));
					return;
				}
				setPending(action);
				const accepted = await sendPrompt(prompt);
				setPending(null);
				if (!accepted) {
					setError(t("media.sendFailed"));
					return;
				}
				onSubmitted();
			};
			const parsedDuration = videoDuration.trim() === "" ? void 0 : Number(videoDuration);
			const busy = pending !== null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("main", {
				className: "dmp-media",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dmp-media-intro",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("media.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.intro") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dmp-media-safety",
							children: t("media.freeOnly")
						})]
					}),
					error !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dmp-media-error",
						children: error
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-media-card dmp-media-models",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dmp-media-card-heading",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dmp-media-icon",
								"aria-hidden": "true",
								children: "⌕"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("media.modelsTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("media.modelsDescription") })] })]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dmp-media-actions",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: locked || busy,
									onClick: () => void submit("models", () => mediaModelsRequest("image")),
									children: t("media.imageModels")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: locked || busy,
									onClick: () => void submit("models", () => mediaModelsRequest("video")),
									children: t("media.videoModels")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: locked || busy,
									onClick: () => void submit("models", () => mediaModelsRequest("all")),
									children: t("media.allModels")
								})
							]
						})]
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
									className: "dmp-media-field dmp-media-field-wide",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.prompt") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										value: imagePrompt,
										onChange: (event) => setImagePrompt(event.currentTarget.value),
										placeholder: t("media.imagePromptPlaceholder")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dmp-media-fields",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-media-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.modelOptional") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: imageModel,
											onChange: (event) => setImageModel(event.currentTarget.value),
											placeholder: t("media.autoFreeModel")
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-media-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.outputOptional") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: imageOutputName,
											onChange: (event) => setImageOutputName(event.currentTarget.value),
											placeholder: "my-image"
										})]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: "dmp-media-primary",
									type: "button",
									disabled: locked || busy,
									onClick: () => void submit("image", () => imageGenerationRequest({
										prompt: imagePrompt,
										model: imageModel,
										outputName: imageOutputName
									})),
									children: pending === "image" ? t("media.sending") : t("media.generateImage")
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
									className: "dmp-media-field dmp-media-field-wide",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.prompt") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										value: videoPrompt,
										onChange: (event) => setVideoPrompt(event.currentTarget.value),
										placeholder: t("media.videoPromptPlaceholder")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dmp-media-fields",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dmp-media-field",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("media.modelOptional") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											value: videoModel,
											onChange: (event) => setVideoModel(event.currentTarget.value),
											placeholder: t("media.autoFreeModel")
										})]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
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
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									className: "dmp-media-primary",
									type: "button",
									disabled: locked || busy,
									onClick: () => void submit("video", () => videoGenerationRequest({
										prompt: videoPrompt,
										model: videoModel,
										duration: parsedDuration
									})),
									children: pending === "video" ? t("media.sending") : t("media.generateVideo")
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
										disabled: locked || busy,
										onClick: () => void submit("status", () => videoStatusRequest(jobId)),
										children: pending === "status" ? t("media.sending") : t("media.checkStatus")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: "dmp-media-primary",
										type: "button",
										disabled: locked || busy,
										onClick: () => void submit("download", () => videoDownloadRequest(jobId, videoOutputName)),
										children: pending === "download" ? t("media.sending") : t("media.downloadVideo")
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
		function ModelPalette({ locked, available, directory, load, select, sendPrompt, t }) {
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
				}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dmp-overlay",
					role: "presentation",
					onMouseDown: (event) => {
						if (event.target === event.currentTarget) close();
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dmp-dialog",
						role: "dialog",
						"aria-modal": "true",
						"aria-label": t(view === "models" ? "palette.title" : "media.title"),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
								className: "dmp-header",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", { children: t(view === "models" ? "palette.title" : "media.title") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: view === "models" ? `${choices.length} ${t("palette.models")} · ${t("palette.shortcut")}` : t("media.subtitle") })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
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
								}), view === "media" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MediaPanel, {
									locked,
									sendPrompt,
									onSubmitted: close,
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
				})]
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
			"media.nav": "媒体工具",
			"media.title": "OpenRouter 媒体工具",
			"media.subtitle": "用快捷表单调用图像与视频 Agent 工具",
			"media.intro": "填写生成要求后发送到当前对话，由 Agent 查询模型并调用对应工具。",
			"media.freeOnly": "仅免费模型",
			"media.modelsTitle": "查询媒体模型",
			"media.modelsDescription": "调用 openrouter_media_models，不会产生生成费用。",
			"media.imageModels": "免费图像模型",
			"media.videoModels": "免费视频模型",
			"media.allModels": "全部免费模型",
			"media.imageTitle": "生成图像",
			"media.imageDescription": "调用 openrouter_generate_image 并保存到配置的输出目录。",
			"media.videoTitle": "生成视频",
			"media.videoDescription": "调用 openrouter_generate_video 提交异步任务。",
			"media.jobsTitle": "视频任务",
			"media.jobsDescription": "查询任务状态，完成后下载到配置的输出目录。",
			"media.prompt": "生成要求",
			"media.imagePromptPlaceholder": "例如：一只坐在窗边的橘猫，电影感光影",
			"media.videoPromptPlaceholder": "例如：海面日落的电影镜头，缓慢推进",
			"media.modelOptional": "模型 ID（可选）",
			"media.autoFreeModel": "留空自动选择免费模型",
			"media.outputOptional": "输出名称（可选）",
			"media.durationOptional": "时长秒数（可选）",
			"media.jobId": "任务 ID",
			"media.generateImage": "发送生图请求",
			"media.generateVideo": "提交视频任务",
			"media.checkStatus": "查询状态",
			"media.downloadVideo": "下载视频",
			"media.sending": "正在发送…",
			"media.promptRequired": "请先填写生成要求，并确认视频时长为 1–60 的整数。",
			"media.jobRequired": "请先填写视频任务 ID。",
			"media.sendFailed": "请求未能发送到当前对话，请稍后重试。"
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
			"media.nav": "Media tools",
			"media.title": "OpenRouter media tools",
			"media.subtitle": "Quick forms for image and video agent tools",
			"media.intro": "Send a structured request to the current conversation; the agent selects models and calls the tools.",
			"media.freeOnly": "Free models only",
			"media.modelsTitle": "Browse media models",
			"media.modelsDescription": "Calls openrouter_media_models without creating media charges.",
			"media.imageModels": "Free image models",
			"media.videoModels": "Free video models",
			"media.allModels": "All free models",
			"media.imageTitle": "Generate image",
			"media.imageDescription": "Calls openrouter_generate_image and saves into the configured output directory.",
			"media.videoTitle": "Generate video",
			"media.videoDescription": "Calls openrouter_generate_video to submit an asynchronous job.",
			"media.jobsTitle": "Video jobs",
			"media.jobsDescription": "Check job status and download completed videos.",
			"media.prompt": "Prompt",
			"media.imagePromptPlaceholder": "Example: an orange cat by a window, cinematic lighting",
			"media.videoPromptPlaceholder": "Example: a cinematic sunset over the ocean, slow push in",
			"media.modelOptional": "Model ID (optional)",
			"media.autoFreeModel": "Leave blank to choose a free model",
			"media.outputOptional": "Output name (optional)",
			"media.durationOptional": "Duration in seconds (optional)",
			"media.jobId": "Job ID",
			"media.generateImage": "Send image request",
			"media.generateVideo": "Submit video job",
			"media.checkStatus": "Check status",
			"media.downloadVideo": "Download video",
			"media.sending": "Sending…",
			"media.promptRequired": "Enter a prompt and keep video duration as an integer from 1 to 60.",
			"media.jobRequired": "Enter a video job ID first.",
			"media.sendFailed": "The request could not be sent to the current conversation. Try again."
		};
		//#endregion
		//#region \0dsh-model-palette-css:src/client/style.css.mjs
		const css = ".dmp-seat { display: inline-flex; min-width: 0; }\n.dmp-trigger { height: 28px; max-width: 340px; display: inline-flex; align-items: center; gap: 5px; padding: 0 8px; border: 0; border-radius: 16px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 13px; }\n.dmp-trigger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dmp-trigger:focus-visible { outline: 2px solid var(--dsw-alias-border-l2); outline-offset: 1px; }\n.dmp-trigger:disabled { color: var(--dsw-alias-label-dimmed); cursor: default; }\n.dmp-trigger-icon { color: var(--dsw-alias-brand-primary); font-weight: 700; }\n.dmp-trigger-model, .dmp-trigger-provider { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-trigger-model { max-width: 150px; font-weight: 600; }\n.dmp-trigger-provider { max-width: 110px; color: var(--dsw-alias-label-caption); }\n.dmp-trigger kbd { padding: 1px 5px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 5px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-family: inherit; }\n.dmp-overlay { position: fixed; inset: 0; z-index: 10020; display: grid; place-items: center; padding: 24px; background: color-mix(in srgb, var(--dsw-alias-bg-mask, #000) 46%, transparent); backdrop-filter: blur(8px); }\n.dmp-dialog { width: min(920px, calc(100vw - 32px)); height: min(720px, calc(100vh - 48px)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 18px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); box-shadow: 0 24px 80px rgb(0 0 0 / 28%); }\n.dmp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px 14px; }\n.dmp-header h2 { margin: 0; font-size: 18px; line-height: 24px; }\n.dmp-header p { margin: 3px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; }\n.dmp-close { width: 30px; height: 30px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 22px; }\n.dmp-close:hover { background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-search-wrap { display: flex; align-items: center; gap: 9px; margin: 0 22px 12px; padding: 0 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 11px; background: var(--dsw-alias-bg-layer-1); }\n.dmp-search-wrap:focus-within { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); }\n.dmp-search-wrap input { flex: 1; min-width: 0; height: 42px; border: 0; outline: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 14px; }\n.dmp-search-wrap input::placeholder { color: var(--dsw-alias-label-tertiary); }\n.dmp-search-wrap button { border: 0; background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; font-size: 18px; }\n.dmp-error { display: flex; align-items: center; gap: 12px; margin: 0 22px 10px; padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-state-error-secondary); color: var(--dsw-alias-state-error-primary); font-size: 12px; }\n.dmp-error button { margin-left: auto; border: 1px solid currentColor; border-radius: 12px; background: transparent; color: inherit; cursor: pointer; }\n.dmp-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 190px minmax(0, 1fr); border-top: 1px solid var(--dsw-alias-border-inverted); border-bottom: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-providers { min-height: 0; overflow-y: auto; padding: 10px; border-right: 1px solid var(--dsw-alias-border-inverted); background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 72%, transparent); }\n.dmp-providers button { width: 100%; display: flex; align-items: center; gap: 8px; min-height: 34px; padding: 7px 9px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; text-align: left; font: inherit; font-size: 12.5px; }\n.dmp-providers button:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dmp-providers button.is-active { background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); }\n.dmp-providers button span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-providers button small { color: var(--dsw-alias-label-tertiary); }\n.dmp-providers .dmp-media-nav { color: var(--dsw-alias-brand-primary); font-weight: 600; }\n.dmp-provider-divider { height: 1px; margin: 8px 4px; background: var(--dsw-alias-border-inverted); }\n.dmp-results { min-height: 0; overflow-y: auto; padding: 10px; }\n.dmp-result { width: 100%; display: flex; align-items: center; gap: 2px; border-radius: 10px; background: transparent; color: var(--dsw-alias-label-primary); }\n.dmp-result:hover, .dmp-result.is-cursor { background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-result.is-current { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent); }\n.dmp-result-select { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 10px 5px 10px 11px; border: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; font: inherit; }\n.dmp-result-select:focus-visible, .dmp-star:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }\n.dmp-result-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }\n.dmp-result-title { display: flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 600; }\n.dmp-result-title em { padding: 1px 6px; border-radius: 999px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 10px; font-style: normal; font-weight: 500; }\n.dmp-result-meta { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--dsw-alias-label-tertiary); font-size: 11.5px; }\n.dmp-result-meta strong { color: var(--dsw-alias-label-secondary); font-weight: 500; }\n.dmp-result-meta span, .dmp-result-description { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-result-description { color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-reasoning { width: 21px; height: 21px; display: grid; place-items: center; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 6px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-weight: 700; }\n.dmp-star { margin-right: 7px; padding: 4px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-dimmed); cursor: pointer; font: inherit; font-size: 16px; }\n.dmp-star:hover, .dmp-star.is-favorite { color: var(--dsw-alias-state-warn-primary); background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-empty { display: grid; min-height: 220px; place-items: center; color: var(--dsw-alias-label-tertiary); font-size: 13px; }\n.dmp-footer { min-height: 62px; display: flex; align-items: center; gap: 16px; padding: 10px 18px; }\n.dmp-current { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 7px; }\n.dmp-current span { color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-current strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }\n.dmp-current small { color: var(--dsw-alias-label-tertiary); }\n.dmp-effort { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-effort select { height: 30px; max-width: 170px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; }\n.dmp-failures { color: var(--dsw-alias-state-warn-primary); font-size: 11px; }\n.dmp-media { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dmp-media-intro { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 10px; padding: 11px 13px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }\n.dmp-media-intro div { display: flex; flex-direction: column; gap: 2px; }\n.dmp-media-intro strong { font-size: 13px; }\n.dmp-media-intro span { color: var(--dsw-alias-label-tertiary); font-size: 11.5px; line-height: 17px; }\n.dmp-media-intro .dmp-media-safety { flex: none; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, #22a06b 15%, transparent); color: #22a06b; font-size: 10px; font-weight: 600; }\n.dmp-media-error { margin-bottom: 10px; padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-state-error-secondary); color: var(--dsw-alias-state-error-primary); font-size: 12px; }\n.dmp-media-card { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dmp-media-models { margin-bottom: 10px; }\n.dmp-media-card-heading { display: flex; align-items: flex-start; gap: 9px; }\n.dmp-media-card-heading div { min-width: 0; }\n.dmp-media-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dmp-media-card-heading p { margin: 2px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-media-icon { width: 25px; height: 25px; flex: none; display: grid; place-items: center; border-radius: 7px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 14px; font-weight: 700; }\n.dmp-media-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 10px; }\n.dmp-media-fields { display: grid; grid-template-columns: minmax(0, 1fr) 120px; gap: 8px; }\n.dmp-media-field { min-width: 0; display: flex; flex-direction: column; gap: 4px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-media-field input, .dmp-media-field textarea { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }\n.dmp-media-field input { height: 32px; padding: 0 9px; }\n.dmp-media-field textarea { min-height: 58px; resize: vertical; padding: 8px 9px; line-height: 17px; }\n.dmp-media-field input:focus, .dmp-media-field textarea:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }\n.dmp-media-field input::placeholder, .dmp-media-field textarea::placeholder { color: var(--dsw-alias-label-dimmed); }\n.dmp-media-actions { display: flex; flex-wrap: wrap; gap: 7px; }\n.dmp-media-actions button, .dmp-media-primary { min-height: 31px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 11px; }\n.dmp-media-actions button:hover:not(:disabled), .dmp-media-primary:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-media-actions button.dmp-media-primary, .dmp-media-primary { align-self: flex-end; border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 50%, var(--dsw-alias-border-l2)); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); font-weight: 600; }\n.dmp-media-actions button.dmp-media-primary:hover:not(:disabled), .dmp-media-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 88%, #000); color: var(--dsw-alias-label-on-primary, #fff); }\n.dmp-media-actions button:disabled, .dmp-media-primary:disabled { opacity: .5; cursor: default; }\n.dmp-media-job-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; align-items: end; gap: 8px; }\n.dmp-media-job-actions { flex-wrap: nowrap; }\n@media (max-width: 680px) { .dmp-overlay { padding: 8px; } .dmp-dialog { width: 100%; height: min(680px, calc(100vh - 16px)); border-radius: 14px; } .dmp-body { grid-template-columns: 125px minmax(0, 1fr); } .dmp-providers { padding: 7px; } .dmp-result-description, .dmp-trigger kbd { display: none; } .dmp-footer { flex-wrap: wrap; } }\n@media (max-width: 760px) { .dmp-media-grid { grid-template-columns: 1fr; } .dmp-media-job-row { grid-template-columns: 1fr; } .dmp-media-job-actions { flex-wrap: wrap; } }\n";
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
			"modelDirectories"
		];
		function apply(ctx) {
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
							sendPrompt: async (prompt) => {
								if (!available) return false;
								const binding = scope.sessions.binding(sessionId);
								if (binding === void 0) return false;
								try {
									const result = await binding.session.prompt([{
										type: "text",
										text: prompt
									}], "queue");
									if (!result.ok) console.error("[dsh-model-palette] media request rejected", result.error);
									return result.ok;
								} catch (error) {
									console.error("[dsh-model-palette] media request failed", error);
									return false;
								}
							}
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
