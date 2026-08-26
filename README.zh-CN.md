# dsh-model-palette

DeepSeek Harness Web 的全局模型命令面板。按 **Alt+M**，或点击输入框上方的模型按钮，即可在一个搜索框里按供应商名称、供应商 ID、模型名称、模型 ID 或描述查找模型。

## 功能

- **Alt+M** 全局快捷键。
- 弹窗挂载在页面顶层，不会被 Deepcel 等隐藏原生输入栏控件的皮肤一起隐藏。
- 供应商和模型共用一个模糊搜索入口。
- 左侧供应商快速筛选，并显示各供应商模型数量。
- 当前模型、收藏和最近使用自动排在前面。
- 相同名称的模型仍按供应商隔离，不会切错线路。
- 当前模型的推理档位可直接切换。
- 显示加载失败的供应商并支持重试。
- 内置“模型配置”面板，可编辑自定义供应商名称、Base URL、协议、Credential ref 和模型参数。
- API key 默认遮罩；可修改、检查连接，并且只有从 `127.0.0.1` / `localhost` 直连时才允许读取已存 key。LAN 与反向代理访问不能显露密钥。
- 模型预置包含经官方资料核验的上下文窗口、最大输出和 Text/Image 输入能力；支持从 GitHub 刷新，未知别名不会自动猜测，也可以手工指定预置。
- 可选集成 OpenRouter 图像/视频工具，默认禁止付费生成。
- 模型面板内置“媒体工具”入口，直接读取完整实时目录；对未识别为免费的模型提供逐次人工确认后尝试，并可提交生成、查询视频状态和下载结果，不写入对话。

## 安装

```sh
dsh plugin --profile web add github:Jensen-Yao/dsh-model-palette
```

重启 `dsh web` 后按 **Alt+M**。

## 供应商与模型配置

按 **Alt+M**，点击左侧 **模型配置**：

1. 选择已有自定义供应商，或点击“新增供应商”。
2. 编辑显示名称、Base URL、协议和 Credential ref。`openai-responses` 只是线路协议，不代表 Agent 模式；必须按供应商端点实际支持选择。
3. API key 留空会保留原值；输入新值后由 DSH `credentials.set` 保存。点击“检查连接”会通过 DSH `llm.discoverModels` 读取供应商模型目录，不发送对话或模型推理请求。
4. 每个模型可编辑上下文窗口、最大输出、Text/Image 输入类型和常用兼容开关。点击“自动补全缺失参数”只应用精确匹配；供应商私有别名可在模型行中手工选择对应官方预置。
5. 点击“应用配置”，插件通过 DSH `settings.mutate` 实时写入，未知高级字段会保留。

插件不会通过 DSH 公共 credentials RPC 读取 key。为了满足本机检查需求，读取已存 key 使用插件自己的严格直连本机路由：请求来源、Host、Origin 和远端地址都必须是 loopback，并拒绝 `Forwarded`、`X-Forwarded-For` 和 Cloudflare 代理头。通过局域网地址或 Tunnel 打开的页面只能修改 key，不能看到旧值。

## 可选 OpenRouter 媒体工具

插件市场安装后不会默认要求其他用户配置 OpenRouter。需要时在 profile 的 `cordis.patch.yml` 中加入：

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

启用后注册五个 agent 工具：模型与价格查询、生图、视频任务提交、视频状态查询和视频下载。生成前会读取实时价格；除非显式打开对应开关，否则 agent 发起的付费图像/视频请求都会在提交前被拒绝。模型无法使用面板专属的人工确认绕过该限制。

按 **Alt+M** 打开模型面板，再点击左侧 **媒体工具**。面板会通过插件自己的同源 API 直接读取 OpenRouter 完整实时目录。价格接口识别为免费的模型可以直接使用；未识别为免费的模型仍能手工选择，因为部分促销限免可能没有进入价格数据。当全局付费开关关闭时，每次提交前都必须勾选“本次请求可能扣费”确认，点击提交后确认立即重置；如果实际收费，费用仍由你的 OpenRouter 账户承担。生成、状态查询和下载直接调用插件后端，不会向当前对话发送提示词；每次生成前，服务端还会再次查询实时价格。OpenRouter 密钥只由 DSH credentials 服务在服务端解析，浏览器不会读取密钥。

五个 agent 工具仍然保留，模型需要时可以调用；媒体面板不再依赖当前模型或 agent 是否理解这些工具。完整说明见 [`docs/openrouter-media.zh-CN.md`](docs/openrouter-media.zh-CN.md)。

## 开发

```sh
pnpm install
pnpm check
```

仓库提交预构建的 `lib/`，从 GitHub 安装时不需要执行构建脚本。

## 许可

MIT
