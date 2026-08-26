# OpenRouter 媒体工具包

这里的“轻量 DSH 原生媒体工具包”不是另一个模型供应商。它同时提供一组 DSH agent 工具和模型面板内的直连媒体界面：模型可以像调用 shell 或 web 工具一样调用工具，用户也可以绕过对话直接操作媒体能力。

## 工具

- `openrouter_media_models`：读取 OpenRouter 实时图像/视频模型和价格。
- `openrouter_generate_image`：生成或编辑图像，并保存到本地目录。
- `openrouter_generate_video`：提交异步视频生成任务。
- `openrouter_video_status`：查询视频任务状态。
- `openrouter_download_video`：下载已完成的视频。

## 费用保护

工具不会相信模型名中的 `:free` 文本，而是在提交生成前读取 OpenRouter 当前接口返回的价格。`allowPaidImages` 和 `allowPaidVideos` 默认应保持 `false`；没有实时免费端点时，agent 工具请求会在扣费前失败。面板的人工确认不会加入 agent 工具参数，因此模型无法自行绕过这两个全局开关。

## 面板直连

打开模型面板的“媒体工具”后，浏览器通过插件的同源 JSON API 读取完整实时模型目录。图像与视频模型直接显示在下拉框中，并标注“免费”“可能付费·配置允许”或“未识别为免费·可手工尝试”。价格接口未识别为免费的模型仍可选择，因为促销限免有可能没有及时写入价格数据；当对应的付费开关关闭时，用户必须为每次提交单独勾选可能扣费确认。确认只对下一次提交有效，发起请求后立即重置。如果 OpenRouter 实际收费，插件无法撤销费用。

生成、任务状态查询和下载请求由插件后端执行，不会创建用户消息，也不依赖当前对话选择的供应商或模型。服务端会在每次生成前再次查询实时价格：若此时出现免费端点，会固定使用免费端点；若仍未识别为免费，则只有本次请求携带正确人工确认时才允许直连面板继续提交。

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
