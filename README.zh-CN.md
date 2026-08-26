# dsh-model-palette

DeepSeek Harness Web 的全局模型命令面板。按 **Alt+M**，或点击输入框上方的模型按钮，即可在一个搜索框里按供应商名称、供应商 ID、模型名称、模型 ID 或描述查找模型。

## 功能

- **Alt+M** 全局快捷键。
- 供应商和模型共用一个模糊搜索入口。
- 左侧供应商快速筛选，并显示各供应商模型数量。
- 当前模型、收藏和最近使用自动排在前面。
- 相同名称的模型仍按供应商隔离，不会切错线路。
- 当前模型的推理档位可直接切换。
- 显示加载失败的供应商并支持重试。
- 可选集成 OpenRouter 图像/视频工具，默认禁止付费生成。
- 模型面板内置“媒体工具”入口，可查询免费模型、提交图像/视频生成、查询视频状态并下载结果。

## 安装

```sh
dsh plugin --profile web add github:Jensen-Yao/dsh-model-palette
```

重启 `dsh web` 后按 **Alt+M**。

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

启用后注册五个 agent 工具：模型与价格查询、生图、视频任务提交、视频状态查询和视频下载。生成前会读取实时价格；除非显式打开对应开关，否则所有付费图像/视频请求都会在提交前被拒绝。

按 **Alt+M** 打开模型面板，再点击左侧 **媒体工具**。快捷表单会把结构化请求发送到当前对话，由 Agent 调用上述工具；浏览器不会读取 OpenRouter 密钥。模型 ID 留空时，Agent 会先查询当前免费模型再执行生成。

这就是前面所说的“轻量 DSH 原生媒体工具包”：它注册的是 agent 工具，不是额外页面或新的供应商。完整说明见 [`docs/openrouter-media.zh-CN.md`](docs/openrouter-media.zh-CN.md)。

## 开发

```sh
pnpm install
pnpm check
```

仓库提交预构建的 `lib/`，从 GitHub 安装时不需要执行构建脚本。

## 许可

MIT
