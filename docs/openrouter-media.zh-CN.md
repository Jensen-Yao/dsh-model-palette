# OpenRouter 媒体工具包

这里的“轻量 DSH 原生媒体工具包”不是独立界面，也不是另一个模型供应商。它是一组直接注册到 DSH agent 工具目录的 OpenRouter 图像/视频工具，模型可以像调用 shell 或 web 工具一样调用它们。

## 工具

- `openrouter_media_models`：读取 OpenRouter 实时图像/视频模型和价格。
- `openrouter_generate_image`：生成或编辑图像，并保存到本地目录。
- `openrouter_generate_video`：提交异步视频生成任务。
- `openrouter_video_status`：查询视频任务状态。
- `openrouter_download_video`：下载已完成的视频。

## 费用保护

工具不会相信模型名中的 `:free` 文本，而是在提交生成前读取 OpenRouter 当前接口返回的价格。`allowPaidImages` 和 `allowPaidVideos` 默认应保持 `false`；没有实时免费端点时，请求会在扣费前失败。

## 为什么放进模型面板插件

模型选择和媒体生成都依赖供应商与模型能力目录。合并后只需维护一个 DSH 插件，旧的本地 `dsh-openrouter-media` 包可以卸载，同时仍保留独立的开关、密钥引用、输出目录和付费保护。

## 配置

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

`credentialRef` 是 DSH credentials 服务中的引用名，不应把 API key 直接写进 YAML。
