# dsh-model-palette

A global model command palette for DeepSeek Harness Web. Press **Alt+M** or click the composer trigger, then find a route by provider name, provider ID, model name, model ID, or description in one search field.

## Features

- Global **Alt+M** shortcut.
- One fuzzy search surface for providers and models.
- Provider filter rail with model counts.
- Current model, favorites, and recently used routes ranked first.
- Provider-scoped identities keep same-named models separate.
- Reasoning effort selector for the active model.
- Visible provider catalog failures and retry.
- Optional OpenRouter image/video tools with paid generation blocked by default.
- A media-tools view that reads the full live catalog, permits explicit one-time manual attempts for models not reported free, and runs actions without writing conversation messages.

## Install

```sh
dsh plugin --profile web add github:Jensen-Yao/dsh-model-palette
```

Restart `dsh web`, then press **Alt+M**.

## Optional OpenRouter media tools

The bundle does not enable media tools for other users by default. Add a profile patch when needed:

```yaml
- id: dsh-model-palette
  config:
    openrouterMedia:
      enabled: true
      credentialRef: OPENROUTER_API_KEY
      outputDir: 'D:\AI\openrouter\outputs'
      allowPaidImages: false
      allowPaidVideos: false
      preferredImageModels: []
      preferredVideoModels: []
```

This registers:

- `openrouter_media_models`
- `openrouter_generate_image`
- `openrouter_generate_video`
- `openrouter_video_status`
- `openrouter_download_video`

The generation tools query live pricing before submission. Agent tool calls are rejected unless the corresponding paid-generation flag is explicitly enabled. The direct media panel can make a one-time manual attempt without changing that global setting, but only after the user acknowledges that the request may be charged.

Press **Alt+M** and select **Media tools** in the left rail. The panel calls the plugin's same-origin API and loads the full live OpenRouter catalog into model selectors. Models reported free run normally. Models not reported free remain selectable because promotional access may not appear in pricing data; when the global paid-generation flag is off, the panel requires a visible possible-charge acknowledgement for every individual submission. That acknowledgement resets after the request and is unavailable to agent tools. Generation, status, and download actions run directly without sending prompts to the current conversation. The backend checks live pricing again before each generation. The OpenRouter credential is resolved only by the DSH credentials service on the host and is never returned to the browser.

The five agent tools remain registered for model-driven workflows, but the media panel no longer depends on the active model understanding or calling them. See [`docs/openrouter-media.zh-CN.md`](docs/openrouter-media.zh-CN.md) for the Chinese explanation and safety model.

## Development

```sh
pnpm install
pnpm check
```

Prebuilt `lib/` files are committed so GitHub installs do not need build scripts.

## License

MIT
