window.__ModuleLoader__.load({
	id: "dsh-model-palette",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
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
		function ModelPalette({ locked, available, directory, load, select, t }) {
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
								}), view === "media" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MediaPanel, { t }) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("main", {
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
		const css = ".dmp-seat { display: inline-flex; min-width: 0; }\n.dmp-trigger { height: 28px; max-width: 340px; display: inline-flex; align-items: center; gap: 5px; padding: 0 8px; border: 0; border-radius: 16px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 13px; }\n.dmp-trigger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dmp-trigger:focus-visible { outline: 2px solid var(--dsw-alias-border-l2); outline-offset: 1px; }\n.dmp-trigger:disabled { color: var(--dsw-alias-label-dimmed); cursor: default; }\n.dmp-trigger-icon { color: var(--dsw-alias-brand-primary); font-weight: 700; }\n.dmp-trigger-model, .dmp-trigger-provider { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-trigger-model { max-width: 150px; font-weight: 600; }\n.dmp-trigger-provider { max-width: 110px; color: var(--dsw-alias-label-caption); }\n.dmp-trigger kbd { padding: 1px 5px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 5px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-family: inherit; }\n.dmp-overlay { position: fixed; inset: 0; z-index: 10020; display: grid; place-items: center; padding: 24px; background: color-mix(in srgb, var(--dsw-alias-bg-mask, #000) 46%, transparent); backdrop-filter: blur(8px); }\n.dmp-dialog { width: min(920px, calc(100vw - 32px)); height: min(720px, calc(100vh - 48px)); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 18px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); box-shadow: 0 24px 80px rgb(0 0 0 / 28%); }\n.dmp-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 20px 22px 14px; }\n.dmp-header h2 { margin: 0; font-size: 18px; line-height: 24px; }\n.dmp-header p { margin: 3px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; }\n.dmp-close { width: 30px; height: 30px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font-size: 22px; }\n.dmp-close:hover { background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-search-wrap { display: flex; align-items: center; gap: 9px; margin: 0 22px 12px; padding: 0 12px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 11px; background: var(--dsw-alias-bg-layer-1); }\n.dmp-search-wrap:focus-within { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); }\n.dmp-search-wrap input { flex: 1; min-width: 0; height: 42px; border: 0; outline: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 14px; }\n.dmp-search-wrap input::placeholder { color: var(--dsw-alias-label-tertiary); }\n.dmp-search-wrap button { border: 0; background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; font-size: 18px; }\n.dmp-error { display: flex; align-items: center; gap: 12px; margin: 0 22px 10px; padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-state-error-secondary); color: var(--dsw-alias-state-error-primary); font-size: 12px; }\n.dmp-error button { margin-left: auto; border: 1px solid currentColor; border-radius: 12px; background: transparent; color: inherit; cursor: pointer; }\n.dmp-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 190px minmax(0, 1fr); border-top: 1px solid var(--dsw-alias-border-inverted); border-bottom: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-providers { min-height: 0; overflow-y: auto; padding: 10px; border-right: 1px solid var(--dsw-alias-border-inverted); background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 72%, transparent); }\n.dmp-providers button { width: 100%; display: flex; align-items: center; gap: 8px; min-height: 34px; padding: 7px 9px; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; text-align: left; font: inherit; font-size: 12.5px; }\n.dmp-providers button:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }\n.dmp-providers button.is-active { background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); }\n.dmp-providers button span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-providers button small { color: var(--dsw-alias-label-tertiary); }\n.dmp-providers .dmp-media-nav { color: var(--dsw-alias-brand-primary); font-weight: 600; }\n.dmp-provider-divider { height: 1px; margin: 8px 4px; background: var(--dsw-alias-border-inverted); }\n.dmp-results { min-height: 0; overflow-y: auto; padding: 10px; }\n.dmp-result { width: 100%; display: flex; align-items: center; gap: 2px; border-radius: 10px; background: transparent; color: var(--dsw-alias-label-primary); }\n.dmp-result:hover, .dmp-result.is-cursor { background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-result.is-current { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent); }\n.dmp-result-select { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; padding: 10px 5px 10px 11px; border: 0; background: transparent; color: inherit; cursor: pointer; text-align: left; font: inherit; }\n.dmp-result-select:focus-visible, .dmp-star:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }\n.dmp-result-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }\n.dmp-result-title { display: flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 600; }\n.dmp-result-title em { padding: 1px 6px; border-radius: 999px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 10px; font-style: normal; font-weight: 500; }\n.dmp-result-meta { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--dsw-alias-label-tertiary); font-size: 11.5px; }\n.dmp-result-meta strong { color: var(--dsw-alias-label-secondary); font-weight: 500; }\n.dmp-result-meta span, .dmp-result-description { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.dmp-result-description { color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-reasoning { width: 21px; height: 21px; display: grid; place-items: center; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 6px; color: var(--dsw-alias-label-tertiary); font-size: 10px; font-weight: 700; }\n.dmp-star { margin-right: 7px; padding: 4px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-dimmed); cursor: pointer; font: inherit; font-size: 16px; }\n.dmp-star:hover, .dmp-star.is-favorite { color: var(--dsw-alias-state-warn-primary); background: var(--dsw-alias-interactive-bg-hover); }\n.dmp-empty { display: grid; min-height: 220px; place-items: center; color: var(--dsw-alias-label-tertiary); font-size: 13px; }\n.dmp-footer { min-height: 62px; display: flex; align-items: center; gap: 16px; padding: 10px 18px; }\n.dmp-current { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 7px; }\n.dmp-current span { color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-current strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12.5px; }\n.dmp-current small { color: var(--dsw-alias-label-tertiary); }\n.dmp-effort { display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-tertiary); font-size: 11px; }\n.dmp-effort select { height: 30px; max-width: 170px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); padding: 0 8px; }\n.dmp-failures { color: var(--dsw-alias-state-warn-primary); font-size: 11px; }\n.dmp-media { min-height: 0; overflow-y: auto; padding: 12px; background: color-mix(in srgb, var(--dsw-alias-bg-layer-1) 32%, transparent); }\n.dmp-media-intro { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 10px; padding: 11px 13px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 28%, var(--dsw-alias-border-inverted)); border-radius: 11px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, transparent); }\n.dmp-media-intro div { display: flex; flex-direction: column; gap: 2px; }\n.dmp-media-intro strong { font-size: 13px; }\n.dmp-media-intro span { color: var(--dsw-alias-label-tertiary); font-size: 11.5px; line-height: 17px; }\n.dmp-media-intro .dmp-media-safety { flex: none; padding: 4px 8px; border-radius: 999px; background: color-mix(in srgb, #22a06b 15%, transparent); color: #22a06b; font-size: 10px; font-weight: 600; }\n.dmp-media-catalog { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; padding: 9px 11px; border-bottom: 1px solid var(--dsw-alias-border-inverted); }\n.dmp-media-catalog div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-media-catalog strong { font-size: 12px; }\n.dmp-media-catalog span { color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-media-catalog button { flex: none; min-height: 29px; padding: 0 9px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 10.5px; }\n.dmp-media-catalog button:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-media-catalog button:disabled { opacity: .5; cursor: default; }\n.dmp-media-error { margin-bottom: 10px; padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-state-error-secondary); color: var(--dsw-alias-state-error-primary); font-size: 12px; }\n.dmp-media-feedback { margin-bottom: 10px; padding: 9px 10px; border-radius: 8px; background: color-mix(in srgb, #22a06b 11%, var(--dsw-alias-bg-layer-2)); color: var(--dsw-alias-label-primary); font-size: 11px; }\n.dmp-media-feedback strong { display: block; margin-bottom: 4px; color: #22a06b; }\n.dmp-media-feedback pre { max-height: 110px; margin: 0; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--dsw-alias-label-secondary); font: inherit; line-height: 16px; }\n.dmp-media-card { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 12px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 12px; background: var(--dsw-alias-bg-layer-2); }\n.dmp-media-card-heading { display: flex; align-items: flex-start; gap: 9px; }\n.dmp-media-card-heading div { min-width: 0; }\n.dmp-media-card-heading h3 { margin: 0; font-size: 13px; line-height: 18px; }\n.dmp-media-card-heading p { margin: 2px 0 0; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; line-height: 15px; }\n.dmp-media-icon { width: 25px; height: 25px; flex: none; display: grid; place-items: center; border-radius: 7px; background: var(--dsw-alias-interactive-bg-hover-accent); color: var(--dsw-alias-brand-primary); font-size: 14px; font-weight: 700; }\n.dmp-media-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 10px; }\n.dmp-media-fields { display: grid; grid-template-columns: minmax(0, 1fr) 120px; gap: 8px; }\n.dmp-media-field { min-width: 0; display: flex; flex-direction: column; gap: 4px; color: var(--dsw-alias-label-tertiary); font-size: 10.5px; }\n.dmp-media-field input, .dmp-media-field textarea, .dmp-media-field select { width: 100%; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; outline: 0; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; }\n.dmp-media-field input, .dmp-media-field select { height: 32px; padding: 0 9px; }\n.dmp-media-field textarea { min-height: 58px; resize: vertical; padding: 8px 9px; line-height: 17px; }\n.dmp-media-field input:focus, .dmp-media-field textarea:focus, .dmp-media-field select:focus { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent); }\n.dmp-media-field input::placeholder, .dmp-media-field textarea::placeholder { color: var(--dsw-alias-label-dimmed); }\n.dmp-media-paid-confirm { display: flex; align-items: flex-start; gap: 8px; padding: 8px 9px; border: 1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 46%, var(--dsw-alias-border-inverted)); border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 9%, transparent); color: var(--dsw-alias-label-secondary); cursor: pointer; }\n.dmp-media-paid-confirm input { width: 14px; height: 14px; flex: none; margin: 2px 0 0; accent-color: var(--dsw-alias-state-warn-primary, #d97706); }\n.dmp-media-paid-confirm span { display: flex; flex-direction: column; gap: 2px; min-width: 0; }\n.dmp-media-paid-confirm strong { color: var(--dsw-alias-state-warn-primary, #d97706); font-size: 10.5px; line-height: 15px; }\n.dmp-media-paid-confirm small { color: var(--dsw-alias-label-tertiary); font-size: 9.5px; line-height: 14px; }\n.dmp-media-actions { display: flex; flex-wrap: wrap; gap: 7px; }\n.dmp-media-actions button, .dmp-media-primary { min-height: 31px; padding: 0 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary); cursor: pointer; font: inherit; font-size: 11px; }\n.dmp-media-actions button:hover:not(:disabled), .dmp-media-primary:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-primary); }\n.dmp-media-actions button.dmp-media-primary, .dmp-media-primary { align-self: flex-end; border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 50%, var(--dsw-alias-border-l2)); background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-on-primary, #fff); font-weight: 600; }\n.dmp-media-actions button.dmp-media-primary:hover:not(:disabled), .dmp-media-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 88%, #000); color: var(--dsw-alias-label-on-primary, #fff); }\n.dmp-media-actions button:disabled, .dmp-media-primary:disabled { opacity: .5; cursor: default; }\n.dmp-media-job-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; align-items: end; gap: 8px; }\n.dmp-media-job-actions { flex-wrap: nowrap; }\n@media (max-width: 680px) { .dmp-overlay { padding: 8px; } .dmp-dialog { width: 100%; height: min(680px, calc(100vh - 16px)); border-radius: 14px; } .dmp-body { grid-template-columns: 125px minmax(0, 1fr); } .dmp-providers { padding: 7px; } .dmp-result-description, .dmp-trigger kbd { display: none; } .dmp-footer { flex-wrap: wrap; } }\n@media (max-width: 760px) { .dmp-media-grid { grid-template-columns: 1fr; } .dmp-media-job-row { grid-template-columns: 1fr; } .dmp-media-job-actions { flex-wrap: wrap; } }\n";
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
