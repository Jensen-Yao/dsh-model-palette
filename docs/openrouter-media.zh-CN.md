# OpenRouter 媒体工具包

这里的“轻量 DSH 原生媒体工具包”不是另一个模型供应商。它同时提供一组 DSH agent 工具和模型面板内的直连媒体界面：模型可以像调用 shell 或 web 工具一样调用工具，用户也可以绕过对话直接操作媒体能力。

## 工具

- `openrouter_media_models`：读取 OpenRouter 实时图像/视频模型和价格。
- `openrouter_generate_image`：生成或编辑图像，并保存到本地目录。
- `openrouter_generate_video`：提交异步视频生成任务。
- `openrouter_video_status`：查询视频任务状态。
- `openrouter_download_video`：下载已完成的视频。

## 费用保护

工具不会相信模型名中的 `:free` 文本，而是在提交生成前读取 OpenRouter 当前接口返回的价格。`allowPaidImages` 和 `allowPaidVideos` 默认应保持 `false`；没有实时免费端点时，请求会在扣费前失败。

## 面板直连

打开模型面板的“媒体工具”后，浏览器通过插件的同源 JSON API 读取完整实时模型目录。图像与视频模型直接显示在下拉框中，并标注免费或付费状态；当对应的付费开关关闭时，付费模型仍可见，但不能选择或提交。生成、任务状态查询和下载请求由插件后端执行，不会创建用户消息，也不依赖当前对话选择的供应商或模型。服务端会在每次生成前再次查询实时价格，因此目录加载后的价格变化也会被拦截。

浏览器只接收模型目录和操作结果。`credentialRef` 由 DSH credentials 服务在服务端解析，API key 不会进入客户端 bundle 或 API 响应。浏览器跨站请求会被拒绝，普通本地脚本仍可在显式发送 JSON 时调用接口。

## 为什么放进模型面板插件

模型选择和媒体生成都依赖供应商与模型能力目录。合并后只需维护一个 DSH 插件，旧的本地 `dsh-openrouter-media` 包可以卸载，同时仍保留独立的开关、密钥引用、输出目录、付费保护和 agent 工具调用能力。

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
