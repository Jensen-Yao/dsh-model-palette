<div align="center">
  <img src="assets/icon.svg" width="96" height="96" alt="DSH Model Palette" />
  <h1>dsh-model-palette</h1>
  <p>
    <strong>DeepSeek Harness Web 的全局供应商感知模型命令面板</strong>
  </p>
  <p>
    <a href="https://github.com/Jensen-Yao/dsh-model-palette/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
    <a href="https://github.com/Jensen-Yao/dsh-model-palette/releases"><img src="https://img.shields.io/github/v/release/Jensen-Yao/dsh-model-palette" alt="Latest Release" /></a>
    <a href="https://www.npmjs.com/package/dsh-model-palette"><img src="https://img.shields.io/badge/dsh-plugin-4.0.1+-6a4cff" alt="DSH Plugin" /></a>
    <a href="https://github.com/Jensen-Yao/dsh-model-palette/blob/main/README.md"><img src="https://img.shields.io/badge/English-Doc-0078ff" alt="English Doc" /></a>
  </p>
  <p>
    <kbd>Alt+M</kbd> &nbsp;·&nbsp; 模糊搜索 &nbsp;·&nbsp; 供应商筛选 &nbsp;·&nbsp; 模型配置 &nbsp;·&nbsp; OpenRouter 媒体工具
  </p>
</div>

---

**dsh-model-palette** 是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的一款插件，用强大的全局命令面板取代原生模型选择器。在 Web 界面的任意位置按下 **Alt+M**，或点击输入框的模型触发器，即可跨所有供应商即时搜索、筛选、收藏和切换模型。

项目展示页：[jensen-yao.github.io/dsh-model-palette](https://jensen-yao.github.io/dsh-model-palette/)

当前版本：[v0.5.4](https://github.com/Jensen-Yao/dsh-model-palette/releases/tag/v0.5.4)

## ✨ 功能特性

<table>
<tr>
<td width="50%">

### 🎯 全局命令面板
- 任意位置可用 **<kbd>Alt+M</kbd>** 快捷键唤起
- 对话框渲染在文档层，隐藏原生输入控件的皮肤无法一并隐藏面板
- 统一的模糊搜索：模型名、模型 ID、供应商名、供应商 ID 一次搜索搞定
- 方向键导航 + 回车选择

</td>
<td width="50%">

### 🏷️ 供应商筛选栏
- 侧边栏列出所有供应商及实时模型数量
- 点击任意供应商筛选；点击「全部供应商」重置
- 当前供应商自动置顶高亮
- 供应商目录加载失败有可见提示

</td>
</tr>
<tr>
<td width="50%">

### ⭐ 收藏与最近使用
- 为任意模型点亮星标加入收藏
- 最近使用过的模型优先排序
- 当前模型始终置顶
- 侧栏提供「仅看收藏」和「最近使用」快捷筛选
- 收藏与最近记录保存在 `localStorage`，跨会话持久化

</td>
<td width="50%">

### 🧠 推理档位选择器
- 当活动模型支持推理档位时，底部出现下拉选择器
- 随时切换推理档位（低 / 中 / 高）
- 自动应用供应商特定的默认档位

</td>
</tr>
<tr>
<td width="50%">

### ⚙️ 供应商与模型配置
直接在界面中新增、编辑或删除供应商：
- 配置 **供应商 ID**、**显示名称**、**Base URL** 与 **协议类型**（`openai-completions`、`openai-responses`、`anthropic-messages`）
- 设置 **凭据引用** 与 **API key**（默认掩码显示）
- 通过 `llm.discoverModels` **测试连接**，并可一键导入探测到的模型
- 可复制已有供应商，自动生成独立的凭据引用草稿，避免覆盖原线路
- 可筛选长模型列表、复制模型参数，并在保存前拒绝重复模型 ID
- 已知需要该字段的 DeepSeek 方言模型会在切换前自动补齐历史回传兼容项
- 配置页会列出这类模型缺失的 `thinkingFormat` / `reasoning_content` 设置，并支持一键修复应用
- 切换供应商、重新读取或离开页面前会提示未保存修改
- 安全设计：已存的 key 仅在直连 `127.0.0.1` / `localhost` 时可查看

</td>
<td width="50%">

### 📦 模型预置
- **内置预置**：已核验的上下文窗口、最大输出与输入类型
- **在线刷新**：从 GitHub 拉取最新预置数据
- **自动补全**：为精确匹配的模型自动填充缺失参数
- **手动选择**：私有网关别名可手动选择官方预置
- 绝不猜测未知别名，只应用经过核验的数据

</td>
</tr>
<tr>
<td width="50%">

### 🖼️ OpenRouter 媒体工具（可选）
- **图像生成** — 选模型、写提示词、直接生成
- **视频生成** — 提交异步任务，支持时长控制
- **任务管理** — 查询状态、下载完成的视频
- 所有操作直接执行，不向会话发送提示词
- **默认阻止付费生成**，可通过配置放开

</td>
<td width="50%">

### 🔒 安全与隐私
- API key 默认掩码，存入 DSH credentials 服务
- 凭据查看仅限回环连接，杜绝局域网/反向代理泄露
- 所有插件 API 均有跨站请求伪造防护
- OpenRouter 凭据由宿主解析，绝不下发浏览器
- 非免费媒体模型需逐次确认可能扣费

</td>
</tr>
</table>

## Skin Center v2 兼容

本项目仍然是标准 DSH 客户端插件。`skin.json`、`skin.css`、`patches.css` 和 `hooks.mjs` 由 Skin Center v2 统一拥有和加载；`dsh-model-palette` 不冒充皮肤，也不再自创第二套皮肤清单。启用 v2 皮肤后，模型面板仍通过原生插槽、文档级 Portal 和快捷键工作。

插件会在入口和对话框根节点输出 `data-dsh-plugin="dsh-model-palette"`，皮肤可以据此稳定覆盖插件区域，而不必依赖构建生成的 class 名。插件仍由普通 DSH `dsh.client` 协议发现和挂载；v2 桥接会在插件激活时安装，即使对话区稍后才挂载也能工作。v2 皮肤可以通过下面的稳定浏览器事件打开模型、媒体或配置页：

```js
window.dispatchEvent(new CustomEvent('dsh-model-palette:open', { detail: { view: 'media' } }))
```

`view` 可选值为 `models`、`media`、`config`；省略或传入未知值时打开模型页。也可以调用页面桥接，适合需要直接切页的 v2 `hooks.mjs`：

```js
window.__DSH_MODEL_PALETTE__?.open('config')
```

如果皮肤可能早于本插件激活，请使用 `dsh-model-palette:ready` 做一次就绪握手，而不要只调用一次可选链：

```js
function openModelPaletteWhenReady(view = 'models') {
  const retry = () => window.__DSH_MODEL_PALETTE__?.open(view)
  window.addEventListener('dsh-model-palette:ready', retry, { once: true })
  if (retry() === true) window.removeEventListener('dsh-model-palette:ready', retry)
}

openModelPaletteWhenReady('media')
```

`ready` 事件在插件组件挂载后发出；如果桥接已安装但组件尚未挂载，`open()` 会先排队。事件和页面桥接只在当前浏览器页面内传播，不携带密钥或对话内容。入口 class 刻意不再包含 `seat`，因为 Excel 工作簿皮肤可能使用 `[class*="seat"]` 隐藏原生输入区的布局载体；此前的 `dmp-seat` 会因此被误隐藏。`skinManifestVersion: 2` 仍只属于皮肤的 `skin.json`，本项目仍按 DSH 的 `dsh.client` 插件协议加载，不把普通插件伪装成皮肤。

## 🚀 快速开始

### 安装

```sh
dsh plugin --profile web add github:Jensen-Yao/dsh-model-palette#v0.5.4
```

重启 `dsh web`，然后按下 **<kbd>Alt+M</kbd>**，或点击输入区里的模型触发器。

### 启用 OpenRouter 媒体工具（可选）

如需启用可选的图像 / 视频生成工具，在配置文件中加入以下补丁：

```yaml
# cordis.patch.yml 或你的 profile 补丁文件
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

注册的五个 Agent 工具：

| 工具 | 说明 |
|------|------|
| `openrouter_media_models` | 浏览 OpenRouter 实时图像 / 视频模型与价格 |
| `openrouter_generate_image` | 通过 OpenRouter 生成图像 |
| `openrouter_generate_video` | 提交异步视频生成任务 |
| `openrouter_video_status` | 查询视频任务状态 |
| `openrouter_download_video` | 下载已完成的视频到配置的输出目录 |

## 🎮 使用面板

### 基本操作

| 操作 | 方式 |
|------|------|
| 打开面板 | 按 **<kbd>Alt+M</kbd>** 或点击 ⌘ 模型触发器 |
| 关闭面板 | 按 **<kbd>Esc</kbd>** 或点击对话框外部 |
| 搜索 | 在搜索框输入——匹配模型名、模型 ID、供应商名、供应商 ID 与描述 |
| 导航 | **<kbd>↑</kbd>** / **<kbd>↓</kbd>** 方向键 |
| 选择 | 高亮行按 **<kbd>Enter</kbd>** |
| 供应商筛选 | 点击左侧栏中的供应商 |
| 仅看收藏 | 点击左侧栏「仅看收藏」 |
| 查看最近模型 | 点击左侧栏「最近使用」 |
| 收藏 / 取消收藏 | 点击模型行的 ★ 星标 |
| 切换推理档位 | 使用底部下拉框（活动模型支持时显示） |

### 配置面板

按 **<kbd>Alt+M</kbd>**，在左侧栏选择「模型配置」，即可：

1. **选择或新建供应商** — 从下拉框选择，或点击「新增供应商」
2. **复制已有供应商（可选）** — 从可用线路生成新草稿，凭据引用自动分离
3. **配置端点** — 设置 Base URL、协议类型与凭据引用
4. **管理 API key** — 输入新 key 或读取已存 key（仅回环）
5. **测试连接** — 点击「检查连接」探测模型
6. **验证 API key** — 优先请求带鉴权的 `/models`，端点不提供模型目录时再使用所选模型发送最小请求
7. **检测实际协议** — 使用一个模型分别测试 `/chat/completions` 与 `/responses`，显示真实可用结果
8. **配置模型** — 筛选长列表、复制参数，逐个设置上下文窗口、最大输出、输入类型
9. **应用预置** — 从注册表自动补全或手动选择
10. **修复已知方言兼容项** — DeepSeek 兼容端点缺少历史 `reasoning_content` 回传配置时，点击「修复并应用」；正常切换模型时插件也会自动预检
11. **保存** — 重复模型 ID 会被拒绝，未保存修改会明确显示
12. **删除供应商** — 二次确认后删除配置；关联 credential 会保留，不会误删密钥

API key 验证会明确区分“可用”“无效”“被供应商或网关拒绝”“可能因额度/限流暂不可用”和“无法判断”（例如端点或模型不支持该检查）。key 只在插件后端使用；如果 `/models` 不可用，回退的最小模型请求可能产生少量费用。

协议检测会产生真实的最小 API 请求，可能产生少量费用；插件不会根据“是否推理”自动更改协议。

### 媒体工具面板

按 **<kbd>Alt+M</kbd>**，在左侧栏选择「媒体工具」，即可：

1. 面板自动加载 OpenRouter 实时图像 / 视频目录
2. 标记为**免费**的模型可正常使用
3. 未被价格接口识别为**免费**的模型，每次提交前需勾选可能扣费确认
4. 图像生成同步执行，保存到输出目录
5. 视频生成提交异步任务——完成后查询状态并下载

## 🛠️ 开发

```sh
# 克隆仓库
git clone https://github.com/Jensen-Yao/dsh-model-palette.git
cd dsh-model-palette

# 安装依赖
pnpm install

# 类型检查 + 测试 + 构建
pnpm check

# 仅构建
pnpm build

# 仅测试
pnpm test
```

仓库已提交预构建的 `lib/` 文件，GitHub 安装无需构建脚本。

### 项目结构

```
dsh-model-palette/
├── src/
│   ├── client/              # 前端 React 组件
│   │   ├── index.tsx        # 客户端入口与插槽注册
│   │   ├── ModelPalette.tsx  # 主面板组件
│   │   ├── ConfigPanel.tsx   # 供应商与模型配置界面
│   │   ├── MediaPanel.tsx    # OpenRouter 媒体工具界面
│   │   ├── model.ts          # 搜索、排序、收藏逻辑
│   │   ├── model-config.ts   # 配置数据工具函数
│   │   ├── selection-compatibility.ts # 切换模型前的 DeepSeek 兼容预检
│   │   ├── model-presets.ts  # 预置注册表管理
│   │   ├── config-api.ts     # 配置 API 客户端
│   │   ├── media-api.ts      # 媒体 API 客户端
│   │   ├── skin-v2.ts         # Skin Center v2 页面桥接
│   │   ├── locales.ts        # i18n（中 / 英）
│   │   ├── types.ts          # TypeScript 类型定义
│   │   └── style.css         # 组件样式
│   ├── index.js              # 插件入口（服务端）
│   ├── openrouter-media.js   # OpenRouter 媒体后端
│   ├── model-config-api.js   # 模型配置 API 后端
│   └── media-protocol.ts     # 共享协议常量
├── assets/
│   ├── icon.svg              # 插件图标
│   └── model-presets.json    # 内置模型预置
├── docs/
│   └── openrouter-media.zh-CN.md  # 媒体工具说明文档（中文）
├── tests/                    # 单元测试
├── lib/                      # 预构建产物
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── cordis.patch.yml
```

## 📋 环境要求

- **Node.js** >= 22.19
- **DeepSeek Harness** >= 4.0.1
- **pnpm** >= 11.21（开发用）

## 📄 许可证

[MIT](LICENSE) © Jensen Yao

---

<div align="center">
  <sub>为 DeepSeek Harness 生态用心打造 ❤️</sub>
</div>
