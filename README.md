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
- A media-tools view inside the palette for free-model discovery, image/video requests, video status, and downloads.

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

The generation tools query live pricing before submission. Paid image/video calls are rejected unless the corresponding configuration flag is explicitly enabled.

Press **Alt+M** and select **Media tools** in the left rail. The forms send structured requests to the current conversation so the agent can call the tools; the browser never reads the OpenRouter credential. Leave the model ID blank to let the agent inspect the current free catalog first.

This optional feature is the lightweight native DSH media toolkit: it registers agent tools rather than adding another page or provider. See [`docs/openrouter-media.zh-CN.md`](docs/openrouter-media.zh-CN.md) for the Chinese explanation and safety model.

## Development

```sh
pnpm install
pnpm check
```

Prebuilt `lib/` files are committed so GitHub installs do not need build scripts.

## License

MIT
