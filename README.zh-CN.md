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

当前版本：[v0.10.1](https://github.com/Jensen-Yao/dsh-model-palette/releases/tag/v0.10.1)

## ✨ 功能特性

<table>
<tr>
<td width="50%">

### 🎯 全局命令面板
- 任意位置可用 **<kbd>Alt+M</kbd>** 快捷键唤起
- 对话框渲染在文档层，不依赖输入区内部布局
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

### 🧠 全模型推理档位选择器
- 底部始终提供 `off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`
- 模型尚未声明档位时，第一次选择会先实时写入 `reasoningEfforts` 再切换
- 可以逐模型编辑档位与供应商 wire value，也可以一键为当前线路全部已声明模型启用
- 自动适配 OpenAI、OpenRouter、DeepSeek、Qwen、GLM/Z.AI、Together，并保留手工修正入口

</td>
</tr>
<tr>
<td width="50%">

### ⚙️ 供应商与模型配置
直接在界面中新增、编辑或删除供应商：
- 配置 **供应商 ID**、**显示名称**、**Base URL** 与 **协议类型**（`openai-completions`、`openai-responses`、`anthropic-messages`）
- 新建 OpenAI 兼容供应商时默认优先使用 `openai-responses`
- 对显式模型、DSH 实时目录模型和 `modelOverrides` 发送真实 Responses / Chat Completions 请求分类，并可确认后把仅支持 Chat Completions 的模型自动切分到 `provider-completions` 分支
- 只修改供应商字段时继续保留目录与 `modelOverrides`；编辑模型或切分协议时，安全物化完整目录并补齐容量与输入类型
- 设置 **凭据引用** 与 **API key**（默认掩码显示）
- 一键检查全部运行时 API key，并从结果直接跳到有问题的供应商修改
- 通过 `llm.discoverModels` **测试连接**，探测到的模型会立即加入草稿，并自动补齐实时元数据与精确匹配预置
- OpenRouter 线路提供 **检查免费模型**：读取公开实时目录，可搜索并手工勾选要导入的 `:free` 文本模型
- 可复制已有供应商，自动生成独立的凭据引用草稿，避免覆盖原线路
- 可筛选长模型列表、复制模型参数，并在保存前拒绝重复模型 ID
- 已知需要该字段的 DeepSeek 方言模型会在切换前自动补齐历史回传兼容项
- 配置页会列出这类模型缺失的 `thinkingFormat` / `reasoning_content` 设置，并支持一键修复应用
- 可按供应商设置瞬态请求重试次数，并按模型覆盖；B.AI 与 BankOfAI 常见线路 ID 默认预置 50 次
- 未选中的线路继续使用 DSH 原有恢复策略；401、余额不足、参数错误、模型不存在与上下文超限不会重试
- 明确的 Cloudflare/WAF 403 最终仍失败时显示网关拦截，不再误报 key 无效
- 侧栏提供独立的「中继配置」页：说明内置 B.AI 中继、复制当前端口的 Base URL 与配置模板，并支持为其他供应商声明固定目标中继
- 切换供应商、重新读取或离开页面前会提示未保存修改
- 安全设计：已存的 key 仅在直连 `127.0.0.1` / `localhost` 时可查看

</td>
<td width="50%">

### 📦 模型预置
- **44 项内置预置**：上下文窗口、最大输出、文本/视觉输入类型与已知推理档位
- **在线刷新**：从 GitHub 拉取最新预置数据
- **自动补全**：为精确匹配的模型自动填充缺失参数
- **手动选择**：私有网关别名可手动选择官方预置
- 供应商默认输入与单模型输入均可选继承、纯文本、文本 + 图片或仅图片
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
dsh plugin --profile web add github:Jensen-Yao/dsh-model-palette#v0.10.1
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

### B.AI 无 VPN 连接修复

如果本机访问 `https://api.b.ai/v1/models` 超时，但 key 本身确认有效，通常是当前网络对 `api.b.ai` 的 DNS 或 TLS 路由不可达。插件内置了仅限本机回环访问的 B.AI 中继：它把 DSH 的 `/v1/*` 请求转发到 B.AI 的可达入口，并使用 `api.b.ai` 的 Host 与证书名称完成校验；不需要 VPN，也不会把 key 写入插件配置。这里的“策略切换”始终发生在 B.AI 内部：请求的 provider、模型、API key 和请求路径都不变，只更换连接主机、DNS 地址或直连方式。中继每次尝试都会新建 HTTPS 连接，会动态读取并轮换 DNS 地址，对可重放请求体自动尝试下一条 B.AI 策略。按 `Alt+M` 后打开侧栏「中继配置」，可以直接复制适配当前 DSH 端口的 `127.0.0.1` Base URL 与 provider 模板。

把对应 B.AI provider 的 `baseURL` 改为下面的值，然后重启 `dsh web`：

```yaml
llm-pi-ai:
  providers:
    bailsb:
      apiKeyEnv: BAILSB_API_KEY
      api: openai-responses
      baseURL: http://127.0.0.1:3080/model-palette/api/bai-relay/v1
      models:
        - id: deepseek-v4-flash
    baiwhr:
      apiKeyEnv: BAIWHR_API_KEY
      api: openai-responses
      baseURL: http://127.0.0.1:3080/model-palette/api/bai-relay/v1
      models:
        - id: deepseek-v4-flash
```

中继只接受直接来自 `127.0.0.1` / `::1` 的请求，并固定目标为 B.AI，不是通用开放代理。默认策略依次是：AWS Global Accelerator 的当前 DNS 地址、同一加速域名的下一个 DNS 地址、`api.b.ai` 直连。`503`、`502`、`504`、明确的 Cloudflare 403、限流和 `ECONNRESET` 等瞬态失败会转到下一条 B.AI 策略；只有全部策略失败后才返回 `503 UPSTREAM_TRANSIENT`。`/v1/models` 返回 401 时表示已经到达 B.AI，优先检查 credential，不应把它当作线路失败。不可重放的大请求不会伪造重试，而是保留 B.AI 原始 HTTP 错误。若 B.AI 更换加速入口，可通过插件配置中的 `baiRelay.strategies` 覆盖整条策略链。

内置中继的重试参数属于插件配置，不属于 provider 配置：

```yaml
- id: dsh-model-palette
  config:
    baiRelay:
      upstreamRetries: 2
      retryDelaysMs: [250, 1000]
      retryBodyLimitBytes: 16777216
      strategies:
        - id: aws-global-accelerator
          upstreamHost: a18ccd091ab831ac3.awsglobalaccelerator.com
          hostHeader: api.b.ai
          tlsServerName: a18ccd091ab831ac3.awsglobalaccelerator.com
          certificateHost: api.b.ai
          addressIndex: 0
        - id: aws-global-accelerator-next-address
          upstreamHost: a18ccd091ab831ac3.awsglobalaccelerator.com
          hostHeader: api.b.ai
          tlsServerName: a18ccd091ab831ac3.awsglobalaccelerator.com
          certificateHost: api.b.ai
          addressIndex: 1
        - id: direct-api
          upstreamHost: api.b.ai
          hostHeader: api.b.ai
          tlsServerName: api.b.ai
          certificateHost: api.b.ai
          addressIndex: 0
```

`upstreamRetries` 表示在同一 B.AI 请求中最多额外尝试多少次；默认的 `2` 会依次覆盖上面三条策略。中继自身的传输恢复与下面的供应商/模型请求重试是两层机制；前者处理建立上游连接时的 socket 错误或 B.AI 网关瞬态响应，后者处理 DSH 请求路径已经收到的失败。两者都不会把请求切换到其他 provider。

### 扩展到其他供应商

遇到其他「key 有效但官方域名在本机无法访问」的供应商时，可在插件配置中声明具名固定目标中继。每个中继都有独立 ID、固定 HTTPS 连接主机、原 API Host、TLS SNI、证书校验名称和允许路径；插件不会接受浏览器动态指定目标。

```yaml
- id: dsh-model-palette
  config:
    providerRelays:
      example-provider:
        upstreamHost: reachable-entry.example.net
        hostHeader: api.provider.example
        tlsServerName: reachable-entry.example.net
        certificateHost: api.provider.example
        allowedPathPrefix: /v1/
        timeoutMs: 180000
        upstreamRetries: 2
        retryDelaysMs: [250, 1000]
        retryBodyLimitBytes: 16777216
```

重启 `dsh web` 后，把对应 provider 的 Base URL 改为 `http://127.0.0.1:3080/model-palette/api/relay/example-provider/v1`。如果 DSH 不是运行在 `3080` 端口，以「中继配置」页显示的当前回环地址为准。只应配置经过核验、确实连接到同一供应商 API 的替代入口；不要把未知网站、密钥或动态 URL 写入中继配置。

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
| 切换推理档位 | 使用底部下拉框；缺失的模型声明会实时补齐 |

### 配置面板

按 **<kbd>Alt+M</kbd>**，在左侧栏选择「模型配置」，即可：

1. **选择或新建供应商** — 从下拉框选择，或点击「新增供应商」
2. **复制已有供应商（可选）** — 从可用线路生成新草稿，凭据引用自动分离
3. **配置端点** — 设置 Base URL、协议类型与凭据引用
4. **管理 API key** — 输入新 key 或读取已存 key（仅回环）
5. **检查连接** — 点击「检查连接」探测模型，并立即填入接口返回或预置提供的上下文、最大输出、输入与推理信息
6. **选择 OpenRouter 免费模型** — 扫描当前可用 `:free` 目录，搜索并查看容量后，只导入手工勾选的模型
7. **验证 API key** — 使用所选模型和协议发送最小请求，并区分 DSH 当前运行时凭据与输入框中不同的待保存 key
8. **一键检查全部 API key** — 依次测试每个运行时凭据，并从结果直接打开失败供应商
9. **检测单个模型协议** — 使用一个模型分别测试 `/chat/completions` 与 `/responses`，显示真实可用结果
10. **检查全部模型协议** — 对显式模型、DSH 实时目录和 `modelOverrides` 一起分类；模型很多时自动分批，确认前不会修改配置
11. **切分 Re/CC 协议** — 原供应商保留 Responses 可用模型，新建 `-completions` 分支并只放入仅支持 Chat Completions 的模型；写入前会解析容量与文本/图片输入
12. **配置供应商重试** — 保持 DSH 原策略，或为当前线路设置精确的瞬态失败重试次数
13. **按模型覆盖重试** — 可继承、明确禁用，或为单个模型设置独立次数
14. **配置模型** — 筛选长列表、复制参数，设置上下文窗口、最大输出、输入模态与推理 wire value
15. **启用全档推理** — 为单模型或当前线路全部已声明模型补齐七个 DSH 推理档位
16. **应用预置** — 从 44 项注册表自动补全或手动选择，连同文本/视觉输入和已知推理档位一起适配
17. **修复已知方言兼容项** — DeepSeek 兼容端点缺少历史 `reasoning_content` 回传配置时，点击「修复并应用」；正常切换模型时插件也会自动预检
18. **保存** — 重复模型 ID 会被拒绝，未保存修改会明确显示
19. **删除供应商** — 二次确认后删除配置；关联 credential 会保留，不会误删密钥

API key 验证会明确区分“可用”“无效”“被供应商或网关拒绝”“暂不可用”“未配置”和“无法判断”。插件不会把公开 `/models` 成功当成 key 可用于对话的证明，而是使用与 DSH 对话一致的最小流式请求；“一键检查全部 API key”会依次测试运行时凭据以降低限流压力，并显示供应商、credential ref、来源、协议、模型与诊断。DSH 当前运行时凭据与输入框中不同的待保存 key 会分开验证，且 key 始终只在插件后端使用。每次请求可能产生少量费用。

选择性重试规则保存在插件自己的 `dsh-model-palette` settings 命名空间并实时生效。供应商规则只接管该线路，精确模型覆盖优先于供应商规则。B.AI / BankOfAI 常见 ID（`b.ai`、`bai`、`bailsb`、`baiwhr`、`bankofai`）默认预置 50 次。`N` 表示第一次失败后的重试次数，因此 `50` 最多可能产生 `51` 次可计费请求。只有网络错误、超时、限流、服务器错误、空响应和明确的 Cloudflare/WAF 403 会重试；无效凭据、余额或配额耗尽、请求参数错误、模型不存在和上下文超限会直接结束。模型覆盖设为 `0` 时会明确禁止该模型恢复；没有插件规则的线路继续走 DSH 原有恢复链路。这套供应商/模型重试与中继自身的传输恢复是两层机制：中继先处理建立连接阶段的 socket 错误，DSH 收到请求失败后才使用这里的规则。

明确的 Cloudflare/WAF 403 用尽重试次数后，会把错误改标为“供应商网关拦截”，避免 DSH 因上游将 403 归类为 `AUTH` 而显示 `API key is invalid`。重试不能绕过永久 WAF 规则；请求内容、体积、频率、账户策略或网关本身仍可能需要调整。

推理档位是模型能力声明，不等于协议选择。新建 OpenAI 兼容线路默认使用 `openai-responses`，但最终仍以真实端点检查为准。「检查全部模型协议」会对显式模型以及从 DSH 实时目录继承的模型发送受限请求，`modelOverrides` 里的定制也会合并参与；Responses 成功的模型留在主线路，即使两个协议都成功也优先 Responses；只有 Responses 失败且 Chat Completions 成功的模型，才会在预览和二次确认后移动到自动生成且不会覆盖同名供应商的 `provider-completions` 分支。目录线路切分前，插件会从正在运行的适配器解析上下文容量、已配置输出上限和文本/图片输入，并补齐精确预置；解析失败时会取消切分，而不是写入不准确的分支。只修改供应商字段时仍保留紧凑目录和 `modelOverrides`；编辑模型或切分时才物化完整列表。两个协议都失败的模型不会自动移动。切分会保留 Base URL、credential ref、上下文、最大输出、输入、推理声明、协议有效的兼容参数以及供应商/模型重试规则。

OpenRouter 免费模型检查使用公开 `/api/v1/models` 目录，只接收带明确 `:free` 标识、输出文本且至少支持一种 DSH 输入（`text` 或 `image`）的模型。检查不需要 API key，也不会直接修改供应商配置。选择器默认全部不勾选，支持搜索、手工勾选，并展示上下文、最大输出和输入类型；只有勾选的条目才会导入。导入只补全缺失元数据和能力预置，不覆盖手工字段，也不删除未选中的本地模型。

协议检测会发送真实请求并将最大输出限制为 16 token，可能产生少量费用；该上限可避免部分网关拒绝单 token 探测而造成误判。完整目录检查每个后端批次最多 100 个模型，每个模型最多发送两次请求。插件不会根据“是否推理”自动更改协议，也不会在用户明确确认前写入切分结果。

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
│   │   ├── locales.ts        # i18n（中 / 英）
│   │   ├── types.ts          # TypeScript 类型定义
│   │   └── style.css         # 组件样式
│   ├── index.js              # 插件入口（服务端）
│   ├── openrouter-media.js   # OpenRouter 媒体后端
│   ├── model-config-api.js   # 模型配置 API 后端
│   ├── request-retry-settings.js # 实时供应商 / 模型重试设置
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
