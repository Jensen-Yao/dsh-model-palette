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

## 🚀 快速开始

### 安装

```sh
dsh plugin --profile web add github:Jensen-Yao/dsh-model-palette
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
6. **配置模型** — 筛选长列表、复制参数，逐个设置上下文窗口、最大输出、输入类型
7. **应用预置** — 从注册表自动补全或手动选择
8. **保存** — 重复模型 ID 会被拒绝，未保存修改会明确显示
9. **删除供应商** — 二次确认后删除配置；关联 credential 会保留，不会误删密钥

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
│   │   ├── model-presets.ts  # 预置注册表管理
│   │   ├── config-api.ts     # 配置 API 客户端
│   │   ├── media-api.ts      # 媒体 API 客户端
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
