# Translation Agent — 浏览器插件版项目规格文档

## 项目概述

一个基于 Chrome 浏览器扩展的**专业领域划词翻译 Agent**。用户在任意网页上划选文本，选区旁弹出浮动气泡展示翻译结果。内置轻量术语库（RAG）保证专业术语翻译一致性，后端代理统一管理 Claude API 调用。

### 用户画像

在爱沙尼亚生活的中国人，日常需要处理中文、英文、爱沙尼亚语之间的翻译，偶尔涉及法律/医学/技术领域文档。

### 项目演进

| 阶段 | 形态 | 状态 |
|---|---|---|
| v0 | Claude Artifact 原型 | ✅ 已完成 |
| v1 | Chrome 扩展 + 后端代理 | 🚧 当前阶段 |
| v2 | 多模型支持 / 高级功能 | 📋 规划中 |

---

## 架构设计

### 系统架构总览

```
┌─────────────────────────────────────────────────┐
│                  Chrome Extension                │
│                                                  │
│  ┌──────────────┐  ┌───────────┐  ┌───────────┐ │
│  │Content Script │  │ Popup UI  │  │Options Page│ │
│  │              │  │           │  │           │ │
│  │ - 划词监听    │  │ - 语言设置 │  │ - 术语管理 │ │
│  │ - 气泡渲染    │  │ - 领域切换 │  │ - 导入导出 │ │
│  │ - 选区定位    │  │ - 快捷操作 │  │ - 高级设置 │ │
│  └──────┬───────┘  └─────┬─────┘  └─────┬─────┘ │
│         │                │              │        │
│         └────────┬───────┘──────────────┘        │
│                  │                                │
│         ┌───────┴────────┐                       │
│         │Service Worker  │                       │
│         │(Background)    │                       │
│         │                │                       │
│         │ - API 请求调度  │                       │
│         │ - 术语库管理    │                       │
│         │ - 消息中转      │                       │
│         └───────┬────────┘                       │
│                 │                                 │
└─────────────────┼─────────────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────────────┐
│              Backend Proxy (API Gateway)          │
│                                                  │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │ Rate Limiter│ │ Auth       │ │ Request      │ │
│  │            │ │ Middleware │ │ Transformer  │ │
│  └─────┬──────┘ └─────┬──────┘ └──────┬───────┘ │
│        └──────────┬────┘───────────────┘         │
│                   ▼                               │
│          ┌────────────────┐                      │
│          │  Claude API    │                      │
│          │  (Sonnet 4.6)  │                      │
│          └────────────────┘                      │
└─────────────────────────────────────────────────┘
```

### 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 扩展框架 | Chrome Extension Manifest V3 | 当前 Chrome 标准，安全性更高 |
| 扩展构建 | Vite + React + TypeScript | 类型安全，组件化开发，HMR 提升开发体验 |
| 样式方案 | CSS Modules + Shadow DOM | Shadow DOM 隔离宿主页面样式，避免冲突 |
| 后端 | Cloudflare Workers | 免费额度充裕，边缘部署延迟低，零冷启动 |
| 后端框架 | Hono | 轻量，TypeScript 原生，完美适配 Workers |
| 翻译引擎 | Claude API (claude-sonnet-4-6) | 多语言能力强，指令跟随好 |
| 术语存储 | chrome.storage.local | 无需后端，容量 10MB 足够 |
| 测试 | Vitest + Playwright | 单元测试 + E2E，覆盖完整链路 |
| CI/CD | GitHub Actions | 自动测试 → 构建 → 发布到 Chrome Web Store |
| 代码质量 | ESLint + Prettier + Husky | pre-commit 检查，统一代码风格 |

### 扩展组件职责

#### Content Script

注入到所有网页，负责用户交互的核心链路：

```
用户在任意网页划选文本
    ↓
mouseup / keyup 事件触发
    ↓
window.getSelection() 获取选区文本
    ↓
getClientRects() 计算选区坐标
    ↓
在 Shadow DOM 中渲染浮动气泡
    ↓
发送消息到 Service Worker 请求翻译
    ↓
展示译文 + 术语高亮
```

**关键技术点：**
- Shadow DOM 封装全部 UI，与宿主页面样式完全隔离
- 气泡定位：基于 `getClientRects()` + 视口边界检测，自动调整上下左右
- 长文本处理：超过阈值时分段翻译，流式渲染
- 性能：划词防抖 300ms，避免频繁触发

#### Service Worker (Background)

扩展的中枢，管理状态和通信：

- 接收 Content Script 的翻译请求，转发到后端代理
- 管理术语库的 CRUD 操作（chrome.storage.local）
- 翻译前执行术语匹配，注入 system prompt
- 缓存最近翻译结果（LRU，减少重复请求）
- 处理扩展安装/更新事件，初始化预置术语库

#### Popup UI

点击扩展图标弹出的快捷面板：

- 当前目标语言切换
- 当前领域切换（通用/法律/医学/技术）
- 翻译开关（全局启用/禁用）
- 当前页面翻译统计

#### Options Page

完整的设置和术语管理界面：

- 术语库管理：按领域分类，增删改查
- 术语导入/导出（JSON / CSV）
- 快捷键自定义
- 气泡外观设置（主题、字体大小）
- 翻译历史记录查看与搜索

---

## 后端代理设计

### API 设计

```
POST /api/v1/translate
```

**Request:**
```json
{
  "text": "选中的文本",
  "source_lang": "auto",
  "target_lang": "zh",
  "domain": "legal",
  "terms": [
    { "source": "consideration", "target": "对价" }
  ]
}
```

**Response (streaming):**
```
data: {"type": "text_delta", "text": "这是"}
data: {"type": "text_delta", "text": "翻译"}
data: {"type": "text_delta", "text": "结果"}
data: {"type": "message_stop", "usage": {"input_tokens": 42, "output_tokens": 15}}
```

### 安全与限流

| 策略 | 实现 |
|---|---|
| 身份验证 | 扩展安装时生成匿名 device_id，存入 chrome.storage.sync |
| 速率限制 | 每 device_id 每分钟 30 次，每天 500 次 |
| 请求验证 | 校验 Origin（chrome-extension://），拒绝非扩展请求 |
| 文本长度限制 | 单次最大 5000 字符 |
| API Key 保护 | Key 仅存于 Workers 环境变量，不暴露给客户端 |
| 滥用检测 | 异常频率自动封禁，Cloudflare WAF 兜底 |

### Prompt 工程

翻译请求构造的 system prompt 模板：

```
You are a professional translator specializing in {domain} domain.

Source language: {source_lang}
Target language: {target_lang}

Mandatory terminology (MUST use these exact translations):
{matched_terms}

Rules:
1. Translate naturally, preserving the original tone and style
2. Use the mandatory terminology exactly as specified
3. If the text contains technical terms not in the terminology list,
   translate them according to {domain} domain conventions
4. Output ONLY the translation, no explanations
```

---

## 术语库 RAG 设计

### 数据结构

```typescript
interface Term {
  id: string;                    // nanoid 生成
  domain: Domain;                // 'general' | 'legal' | 'medical' | 'tech'
  translations: {
    [lang: string]: string;      // { en: "consideration", zh: "对价", et: "vastuandmine" }
  };
  note?: string;                 // 用户备注
  createdAt: number;             // 时间戳
  updatedAt: number;
}

type Domain = 'general' | 'legal' | 'medical' | 'tech';
```

### 存储结构

```
chrome.storage.local:
  terms:legal    → Term[]
  terms:medical  → Term[]
  terms:tech     → Term[]
  terms:general  → Term[]
```

### 术语匹配流程

```
translateText(selectedText, sourceLang, targetLang, domain)
    ↓
loadTerms(domain) → 从 chrome.storage.local 加载术语表
    ↓
matchTerms(selectedText, terms, sourceLang, targetLang)
    ↓
  对每个 term:
    if term.translations[sourceLang] exists:
      if selectedText.toLowerCase().includes(term.translations[sourceLang].toLowerCase()):
        命中 → 收集 { source: term[sourceLang], target: term[targetLang] }
    ↓
将命中术语注入 prompt → 发送翻译请求
```

### 预置术语库

每个领域预置 20-30 条高频术语，覆盖：

- **法律**: consideration/对价, jurisdiction/管辖权, liability/责任, plaintiff/原告 ...
- **医学**: diagnosis/诊断, prescription/处方, symptom/症状 ...
- **技术**: API/接口, deployment/部署, middleware/中间件 ...

---

## 功能清单

### v1 — MVP

- [ ] **任意网页划词翻译**: Content Script 注入，mouseup/keyup 监听，浮动气泡展示
- [ ] **Shadow DOM 样式隔离**: 气泡 UI 不受宿主页面影响，也不影响宿主
- [ ] **12 种语言**: 中/英/爱沙尼亚/日/韩/法/德/西/俄/葡/意/阿拉伯
- [ ] **4 个领域**: 通用、法律、医学、技术
- [ ] **语言自动检测**: Unicode 范围 + 语言特征词
- [ ] **流式翻译**: SSE 流式响应，打字机效果逐字展示
- [ ] **术语库匹配**: 翻译前自动匹配术语，注入 prompt
- [ ] **术语管理**: Options Page 中增删改查，按领域分类
- [ ] **气泡智能定位**: 视口边界自适应，跟随滚动
- [ ] **复制译文**: 一键复制
- [ ] **后端代理**: Cloudflare Workers + Hono，统一 API Key
- [ ] **速率限制**: 匿名 device_id，分钟/日限额
- [ ] **Popup 快捷面板**: 语言/领域切换，全局开关

### v1.1 — 体验优化

- [ ] **翻译缓存**: LRU 缓存最近 100 条翻译，相同文本秒出
- [ ] **翻译历史**: 记录历史翻译，支持搜索和重新查看
- [ ] **术语导入/导出**: JSON / CSV 格式
- [ ] **快捷键**: 可自定义的键盘快捷键（如双击翻译、Alt+T 翻译选中）
- [ ] **深色模式**: 跟随系统或手动切换
- [ ] **右键菜单**: 选中文本后右键 → 翻译

### v2 — 高级功能

- [ ] **回译审校**: 翻译 → 回译 → 与原文对比，评估翻译质量
- [ ] **全文翻译**: 翻译整个页面或选定区域的全部文本
- [ ] **PDF 页面支持**: 识别 PDF 查看器中的文本选择
- [ ] **多模型切换**: 支持 Claude / GPT / DeepL 等多引擎
- [ ] **术语自动发现**: 翻译时自动识别可能的专业术语，建议添加到术语库
- [ ] **团队协作**: 术语库云同步，团队共享

---

## 关键设计决策

| 决策点 | 选择 | 备选项 & 放弃理由 |
|---|---|---|
| 扩展标准 | Manifest V3 | V2 已废弃，Chrome Web Store 不再接受 |
| UI 隔离 | Shadow DOM | iframe（通信复杂，性能差）、直接注入（样式冲突） |
| 构建工具 | Vite | Webpack（配置繁琐）、Rollup（插件生态弱）、CRXJS 基于 Vite |
| 后端部署 | Cloudflare Workers | Vercel Edge（冷启动偶发）、自建服务器（运维成本） |
| 后端框架 | Hono | Express（不适配 Workers）、itty-router（功能简陋） |
| 流式传输 | SSE | WebSocket（双向通信多余）、轮询（延迟高） |
| 状态管理 | Zustand | Redux（模板代码多）、Context（跨组件通信弱） |
| 术语存储 | chrome.storage.local | IndexedDB（API 复杂）、云端（增加后端复杂度） |

---

## 项目结构

```
translation-agent/
├── extension/                    # Chrome 扩展
│   ├── src/
│   │   ├── content/              # Content Script
│   │   │   ├── index.tsx         # 入口，事件监听
│   │   │   ├── SelectionHandler.ts    # 选区检测与坐标计算
│   │   │   ├── Bubble.tsx        # 翻译气泡组件
│   │   │   └── shadow.ts        # Shadow DOM 挂载
│   │   ├── background/           # Service Worker
│   │   │   ├── index.ts          # 入口，消息路由
│   │   │   ├── translator.ts     # 翻译请求 & 流式处理
│   │   │   ├── terms.ts          # 术语库 CRUD & 匹配
│   │   │   └── cache.ts          # LRU 翻译缓存
│   │   ├── popup/                # Popup 弹窗
│   │   │   ├── Popup.tsx
│   │   │   └── index.html
│   │   ├── options/              # 设置页
│   │   │   ├── Options.tsx
│   │   │   ├── TermManager.tsx   # 术语管理组件
│   │   │   └── index.html
│   │   ├── shared/               # 共享模块
│   │   │   ├── types.ts          # 类型定义
│   │   │   ├── constants.ts      # 语言列表、领域列表
│   │   │   ├── detectLanguage.ts # 语言检测
│   │   │   ├── messaging.ts      # 扩展消息通信封装
│   │   │   └── storage.ts        # chrome.storage 封装
│   │   └── assets/               # 图标等静态资源
│   │       ├── icon-16.png
│   │       ├── icon-48.png
│   │       └── icon-128.png
│   ├── public/
│   │   └── manifest.json         # Manifest V3 配置
│   ├── tests/
│   │   ├── unit/                 # 单元测试
│   │   │   ├── detectLanguage.test.ts
│   │   │   ├── terms.test.ts
│   │   │   ├── cache.test.ts
│   │   │   └── translator.test.ts
│   │   └── e2e/                  # E2E 测试
│   │       ├── translation.spec.ts
│   │       ├── termManager.spec.ts
│   │       └── fixtures/
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── worker/                       # 后端代理
│   ├── src/
│   │   ├── index.ts              # Hono 入口
│   │   ├── routes/
│   │   │   └── translate.ts      # /api/v1/translate
│   │   ├── middleware/
│   │   │   ├── auth.ts           # device_id 验证
│   │   │   ├── rateLimit.ts      # 速率限制
│   │   │   └── cors.ts           # CORS 配置
│   │   ├── services/
│   │   │   └── claude.ts         # Claude API 调用封装
│   │   └── types.ts
│   ├── tests/
│   │   └── translate.test.ts
│   ├── wrangler.toml             # Cloudflare Workers 配置
│   ├── tsconfig.json
│   └── package.json
├── docs/                         # 项目文档
│   ├── ARCHITECTURE.md           # 架构设计文档
│   ├── API.md                    # 后端 API 文档
│   ├── DEVELOPMENT.md            # 开发指南
│   └── DEPLOYMENT.md             # 部署指南
├── .github/
│   └── workflows/
│       ├── ci.yml                # PR 检查：lint + test + build
│       ├── release-extension.yml # 扩展发布到 Chrome Web Store
│       └── release-worker.yml    # Worker 部署到 Cloudflare
├── .eslintrc.cjs
├── .prettierrc
├── LICENSE
└── README.md
```

---

## 测试策略

### 单元测试 (Vitest)

| 模块 | 覆盖重点 |
|---|---|
| `detectLanguage` | 12 种语言检测、混合语言、空输入、短文本边界 |
| `terms` | CRUD 操作、匹配逻辑、大小写、多术语命中、缺失语言回退 |
| `cache` | LRU 淘汰、命中/未命中、容量上限 |
| `translator` | prompt 构造、流式解析、错误处理、超时 |
| `SelectionHandler` | 选区提取、坐标计算、边界检测 |
| `messaging` | 消息序列化/反序列化、错误传播 |

**目标覆盖率: > 80%**

### E2E 测试 (Playwright)

使用 Playwright 的 [Chrome Extension Testing](https://playwright.dev/docs/chrome-extensions) 支持：

| 场景 | 测试内容 |
|---|---|
| 基础划词 | 打开测试页面 → 划选文本 → 气泡出现 → 展示翻译 |
| 语言切换 | 气泡内切换目标语言 → 重新翻译 |
| 领域切换 | Popup 切换领域 → 划词 → 验证术语命中 |
| 术语管理 | Options → 添加术语 → 划词翻译 → 验证术语被使用 |
| 样式隔离 | 在有强样式覆盖的页面上验证气泡渲染正常 |
| 边界情况 | 超长文本、跨段落选择、iframe 内选择、空选择 |
| 流式渲染 | 验证翻译结果逐字出现，非一次性加载 |
| 错误处理 | 后端不可用 → 展示友好错误信息 |

### 后端测试

| 类型 | 覆盖 |
|---|---|
| 单元测试 | prompt 构造、速率限制逻辑、请求校验 |
| 集成测试 | 完整翻译流程（mock Claude API）、SSE 流式响应 |
| 压力测试 | 并发请求、限流触发、异常恢复 |

---

## CI/CD 流程

### PR 检查 (ci.yml)

```
Push / PR → Lint → Type Check → Unit Tests → Build → E2E Tests
```

- 全部通过才允许合并
- 测试覆盖率低于阈值时 PR 标记 warning

### 扩展发布 (release-extension.yml)

```
Tag v*.*.* → Build → Zip → Upload to Chrome Web Store → 自动审核
```

- 语义化版本管理（semver）
- 自动生成 changelog
- Chrome Web Store API 自动上传

### Worker 部署 (release-worker.yml)

```
main 分支 push → Test → wrangler deploy → Smoke Test
```

- 部署后自动发送测试请求验证可用性
- 失败自动回滚到上一版本

---

## 性能指标

| 指标 | 目标 |
|---|---|
| 划词到气泡出现 | < 200ms |
| 翻译首字延迟 (TTFB) | < 800ms |
| 翻译完成（50 字以内） | < 2s |
| Content Script 注入耗时 | < 50ms |
| 扩展内存占用 | < 30MB |
| 术语匹配耗时（100 条术语） | < 5ms |

---

## 安全考量

| 风险 | 应对措施 |
|---|---|
| API Key 泄露 | Key 仅存于 Cloudflare 环境变量，客户端零接触 |
| XSS 攻击 | Shadow DOM 隔离；翻译结果使用 textContent，不用 innerHTML |
| CSRF | 校验请求 Origin 必须为 chrome-extension:// |
| 数据隐私 | 翻译文本仅在请求时传输，后端不持久化任何用户数据 |
| 滥用/盗刷 | device_id 限流 + Cloudflare WAF + 异常检测 |
| 中间人攻击 | 全链路 HTTPS，Workers 自带 TLS |

---

## 无障碍 (Accessibility)

- 气泡支持键盘导航（Tab 切换、Escape 关闭）
- 所有交互元素有 `aria-label`
- 气泡角色设为 `role="tooltip"` / `role="dialog"`
- 颜色对比度符合 WCAG 2.1 AA 标准
- 支持屏幕阅读器朗读翻译结果

---

## 开发里程碑

| 里程碑 | 内容 | 预期产出 |
|---|---|---|
| M1: 骨架搭建 | 扩展项目初始化、Vite 构建配置、Manifest V3、基础 Content Script 注入 | 扩展可加载，Content Script 注入成功 |
| M2: 核心翻译链路 | 划词检测 → 气泡渲染 → Service Worker 转发 → 后端代理 → Claude API → 流式返回 | 端到端翻译跑通 |
| M3: 术语库 RAG | 术语存储、匹配逻辑、prompt 注入、Options Page 管理界面 | 术语影响翻译结果 |
| M4: 体验打磨 | Shadow DOM 隔离、气泡定位优化、Popup UI、深色模式、快捷键 | 可日常使用 |
| M5: 工程化 | 单元测试、E2E 测试、CI/CD、lint、覆盖率 | 测试全绿，CI 流程完整 |
| M6: 发布 | Chrome Web Store 上架、Worker 生产部署、README 和文档 | 公开可用 |

---

## 已知约束与权衡

- **Manifest V3 限制**: Service Worker 非持久化，空闲后会被销毁，需要在消息触发时重新初始化状态
- **chrome.storage.local 容量**: 10MB 上限，术语库规模受限，但当前场景足够
- **Claude API 成本**: 统一 API Key 意味着由项目方承担费用，需要严格限流控制成本
- **iframe 内文本**: 跨域 iframe 内无法注入 Content Script，这是浏览器安全限制，暂不处理
- **PDF 支持**: 浏览器内置 PDF 查看器的文本选择行为不一致，列为 v2 计划

---

## Manifest V3 配置

```json
{
  "manifest_version": 3,
  "name": "Translation Agent",
  "version": "1.0.0",
  "description": "Professional domain-aware translation with terminology management",
  "permissions": [
    "storage",
    "activeTab",
    "contextMenus"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/index.tsx"],
      "css": [],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": {
      "16": "assets/icon-16.png",
      "48": "assets/icon-48.png",
      "128": "assets/icon-128.png"
    }
  },
  "options_page": "src/options/index.html",
  "icons": {
    "16": "assets/icon-16.png",
    "48": "assets/icon-48.png",
    "128": "assets/icon-128.png"
  },
  "commands": {
    "toggle-translation": {
      "suggested_key": { "default": "Alt+T" },
      "description": "Toggle translation on/off"
    }
  }
}
```

---

## 扩展内部消息协议

Content Script、Service Worker、Popup、Options Page 之间通过 `chrome.runtime.sendMessage` 通信。定义统一的消息类型：

```typescript
// 消息类型枚举
type MessageType =
  | 'TRANSLATE_REQUEST'
  | 'TRANSLATE_RESPONSE'
  | 'TRANSLATE_STREAM_CHUNK'
  | 'TRANSLATE_STREAM_END'
  | 'TRANSLATE_ERROR'
  | 'TERMS_GET'
  | 'TERMS_ADD'
  | 'TERMS_DELETE'
  | 'TERMS_UPDATE'
  | 'TERMS_IMPORT'
  | 'TERMS_EXPORT'
  | 'SETTINGS_GET'
  | 'SETTINGS_UPDATE'
  | 'CACHE_CLEAR';

// 基础消息结构
interface Message<T = unknown> {
  type: MessageType;
  payload: T;
  requestId: string;   // nanoid，用于匹配请求和响应
  timestamp: number;
}

// 翻译请求
interface TranslateRequest {
  text: string;
  sourceLang: 'auto' | LangCode;
  targetLang: LangCode;
  domain: Domain;
}

// 流式翻译 — 通过 chrome.runtime.Port 长连接
// Content Script:
//   const port = chrome.runtime.connect({ name: 'translate-stream' });
//   port.postMessage({ type: 'TRANSLATE_REQUEST', payload: { ... } });
//   port.onMessage.addListener((msg) => {
//     if (msg.type === 'TRANSLATE_STREAM_CHUNK') updateBubble(msg.payload.text);
//     if (msg.type === 'TRANSLATE_STREAM_END') finalizeBubble(msg.payload);
//   });
```

### 消息流转图

```
┌─────────────────┐    Port (长连接)     ┌─────────────────┐
│  Content Script  │◄───────────────────►│  Service Worker  │
│                  │  stream chunks       │                  │
└─────────────────┘                      └────────┬─────────┘
                                                  │
┌─────────────────┐  chrome.runtime      │
│    Popup UI      │◄────────────────────►│
└─────────────────┘  sendMessage          │
                                                  │
┌─────────────────┐  chrome.runtime      │
│  Options Page    │◄────────────────────►│
└─────────────────┘  sendMessage          │
```

- **翻译请求**: Content Script → Service Worker（Port 长连接，支持流式）
- **设置/术语操作**: Popup / Options → Service Worker（sendMessage 单次请求响应）
- **状态广播**: Service Worker → 所有 Content Script（`chrome.tabs.sendMessage`）

---

## 状态管理

### 扩展全局状态 (chrome.storage.local)

```typescript
interface StorageSchema {
  // 术语库
  'terms:general': Term[];
  'terms:legal': Term[];
  'terms:medical': Term[];
  'terms:tech': Term[];

  // 用户设置
  'settings': {
    enabled: boolean;           // 全局翻译开关
    defaultTargetLang: LangCode;
    defaultDomain: Domain;
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    triggerMode: 'select' | 'double-click' | 'hotkey';
    showTermHighlight: boolean;
  };

  // 设备标识
  'device_id': string;

  // 翻译历史
  'history': TranslationRecord[];

  // 存储版本号（用于 migration）
  'schema_version': number;
}

interface TranslationRecord {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: LangCode;
  targetLang: LangCode;
  domain: Domain;
  matchedTerms: { source: string; target: string }[];
  url: string;            // 翻译时所在页面
  timestamp: number;
}
```

### Storage Migration 策略

扩展更新时可能需要变更存储结构。通过 `schema_version` 字段管理迁移：

```typescript
const CURRENT_SCHEMA_VERSION = 1;

const migrations: Record<number, (data: any) => any> = {
  // v0 → v1: 术语增加 note 字段
  1: (data) => {
    for (const key of ['terms:general', 'terms:legal', 'terms:medical', 'terms:tech']) {
      if (data[key]) {
        data[key] = data[key].map((t: any) => ({ ...t, note: t.note ?? '' }));
      }
    }
    return data;
  },
};

async function runMigrations() {
  const { schema_version = 0 } = await chrome.storage.local.get('schema_version');
  if (schema_version >= CURRENT_SCHEMA_VERSION) return;

  const data = await chrome.storage.local.get(null);
  let migrated = data;
  for (let v = schema_version + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    if (migrations[v]) migrated = migrations[v](migrated);
  }
  migrated.schema_version = CURRENT_SCHEMA_VERSION;
  await chrome.storage.local.set(migrated);
}
```

在 Service Worker 的 `chrome.runtime.onInstalled` 中调用 `runMigrations()`。

---

## 错误处理策略

### 错误分类

```typescript
enum ErrorCode {
  // 网络层
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',

  // 后端层
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  API_UNAVAILABLE = 'API_UNAVAILABLE',

  // 翻译层
  TEXT_TOO_LONG = 'TEXT_TOO_LONG',
  UNSUPPORTED_LANG = 'UNSUPPORTED_LANG',
  TRANSLATION_FAILED = 'TRANSLATION_FAILED',

  // 存储层
  STORAGE_FULL = 'STORAGE_FULL',
  STORAGE_CORRUPTED = 'STORAGE_CORRUPTED',
}
```

### 用户侧错误展示

| 错误 | 气泡中展示 | 自动重试 |
|---|---|---|
| 网络离线 | "No network connection" + 重试按钮 | 否，等用户手动触发 |
| 请求超时 | "Translation timed out" + 重试按钮 | 自动重试 1 次 |
| 限流 | "Too many requests, try in {n}s" | 否，倒计时后可重试 |
| 服务端错误 | "Service temporarily unavailable" | 自动重试 1 次，间隔 2s |
| 文本过长 | "Text too long (max 5000 chars)" | 否 |

### Service Worker 容错

Manifest V3 的 Service Worker 随时可能被浏览器终止。关键应对：

```typescript
// 1. 不依赖内存状态，所有持久数据走 chrome.storage
// 2. Port 断开时 Content Script 自动重连
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    // 清理该 port 关联的流式请求
  });
});

// 3. 安装/更新时重新初始化
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await initDefaultSettings();
    await loadPresetTerms();
  }
  await runMigrations();
});
```

---

## 监控与可观测性

### 后端 (Cloudflare Workers)

| 指标 | 采集方式 | 告警阈值 |
|---|---|---|
| 请求量 (QPS) | Cloudflare Analytics | > 100 QPS |
| 错误率 (5xx) | Cloudflare Analytics | > 5% |
| P95 延迟 | Workers Metrics | > 3s |
| Claude API 错误率 | 自定义 counter | > 10% |
| 限流触发次数 | 自定义 counter | 日均 > 1000 次 |

### 扩展侧

通过 `chrome.storage.local` 记录本地统计（不上报，仅用户自查）：

```typescript
interface LocalStats {
  totalTranslations: number;
  translationsByLang: Record<LangCode, number>;
  translationsByDomain: Record<Domain, number>;
  cacheHits: number;
  cacheMisses: number;
  errors: { code: ErrorCode; count: number; lastOccurred: number }[];
}
```

在 Options Page 中以图表形式展示使用统计，帮助用户了解自己的使用模式。

---

## 国际化 (i18n)

扩展 UI 本身支持多语言，使用 Chrome 内置的 `chrome.i18n` API：

```
extension/
└── _locales/
    ├── en/
    │   └── messages.json
    ├── zh_CN/
    │   └── messages.json
    └── et/
        └── messages.json
```

```json
// _locales/zh_CN/messages.json
{
  "extName": { "message": "划词翻译 Agent" },
  "extDescription": { "message": "专业领域划词翻译，内置术语库" },
  "popupTitle": { "message": "翻译设置" },
  "targetLang": { "message": "目标语言" },
  "domain": { "message": "专业领域" },
  "domainGeneral": { "message": "通用" },
  "domainLegal": { "message": "法律" },
  "domainMedical": { "message": "医学" },
  "domainTech": { "message": "技术" },
  "copySuccess": { "message": "已复制" },
  "retryButton": { "message": "重试" },
  "errorRateLimit": { "message": "请求过于频繁，请 $1 秒后重试" }
}
```

默认跟随浏览器语言，用户可在 Options 中手动覆盖。

---

## 语言检测算法

从 Artifact 版迁移，增强为分层检测策略：

```typescript
function detectLanguage(text: string): LangCode {
  // Layer 1: Unicode 范围快速判定
  //   CJK Unified Ideographs (4E00-9FFF) → 可能是中文/日文
  //   Hiragana (3040-309F) / Katakana (30A0-30FF) → 日文
  //   Hangul (AC00-D7AF) → 韩文
  //   Arabic (0600-06FF) → 阿拉伯文
  //   Cyrillic (0400-04FF) → 俄文

  // Layer 2: 语言特征字符
  //   爱沙尼亚语: š, ž, õ, ä, ö, ü (优先于德语检测)
  //   德语: ß, ä, ö, ü + 关键词 (der, die, das, und, ist)
  //   法语: ç, è, é, ê, ë, à, â
  //   西班牙语: ñ, ¿, ¡
  //   葡萄牙语: ã, õ, ç + 关键词 (não, são, também)

  // Layer 3: 高频词匹配（Latin 系语言区分）
  //   英语: the, is, and, of, to
  //   法语: le, la, les, de, et, est
  //   德语: der, die, das, und, ist, ein
  //   意大利语: il, la, di, che, è, un

  // Layer 4: 默认回退 → 英语
}
```

### 已知边界情况

| 情况 | 处理方式 |
|---|---|
| 中日混合文本 | 有假名 → 日文；纯汉字 → 中文 |
| 中文繁体 vs 简体 | 统一归为 `zh`，不区分 |
| 极短文本 (< 5 字符) | 准确率下降，标记为 `low_confidence`，UI 提示用户确认 |
| 纯数字/符号 | 回退为用户默认源语言 |
| 多语言混排 | 取占比最高的语言 |

---

## Prompt 工程详解

### 基础翻译 Prompt

```typescript
function buildTranslatePrompt(params: {
  text: string;
  sourceLang: string;
  targetLang: string;
  domain: Domain;
  matchedTerms: { source: string; target: string }[];
}): { system: string; user: string } {
  const system = [
    `You are a professional ${params.domain} translator.`,
    `Source language: ${params.sourceLang}`,
    `Target language: ${params.targetLang}`,
    '',
    params.matchedTerms.length > 0
      ? [
          'Mandatory terminology (you MUST use these exact translations):',
          ...params.matchedTerms.map(t => `  "${t.source}" → "${t.target}"`),
        ].join('\n')
      : '',
    '',
    'Rules:',
    '1. Output ONLY the translation. No explanations, notes, or alternatives.',
    '2. Preserve original formatting: line breaks, punctuation style, capitalization patterns.',
    '3. Use mandatory terminology exactly as specified.',
    '4. For terms not in the list, follow standard conventions of the specified domain.',
    '5. Maintain the register and tone of the original text.',
  ].filter(Boolean).join('\n');

  return { system, user: params.text };
}
```

### Prompt 优化策略

| 策略 | 说明 |
|---|---|
| 术语硬约束 | "Mandatory" + "MUST" 确保模型不自行替换术语 |
| 零解释输出 | 明确 "ONLY the translation"，避免模型输出多余内容 |
| 领域锚定 | system prompt 首句声明领域，引导模型使用领域词汇 |
| 格式保留 | 要求保留换行和标点，适配多种文本格式 |
| 语域匹配 | 要求保持原文的正式/非正式程度 |

### 回译审校 Prompt (v2)

```
Step 1: Translate "{original}" from {source} to {target}
Step 2: Back-translate your translation from {target} to {source}
Step 3: Compare the back-translation with the original
Step 4: Output JSON:
{
  "translation": "...",
  "back_translation": "...",
  "confidence": 0.0-1.0,
  "discrepancies": ["..."]
}
```

---

## 竞品分析

| 功能 | Translation Agent | 沉浸式翻译 | 划词翻译 | DeepL 插件 |
|---|---|---|---|---|
| 划词翻译 | ✅ | ✅ | ✅ | ✅ |
| 术语库 (RAG) | ✅ 内置 | ❌ | ❌ | ❌ (仅付费版) |
| 专业领域切换 | ✅ 4 领域 | ❌ | ❌ | ❌ |
| 流式翻译 | ✅ | ❌ | ❌ | ❌ |
| AI 翻译引擎 | ✅ Claude | ✅ 多引擎 | ✅ 多引擎 | ✅ DeepL |
| 免费使用 | ✅ | 部分免费 | ✅ | 部分免费 |
| 开源 | ✅ | ✅ | ✅ | ❌ |
| 术语导入导出 | ✅ | ❌ | ❌ | ❌ |
| 翻译历史 | ✅ | ❌ | ✅ | ❌ |
| 回译审校 | ✅ (v2) | ❌ | ❌ | ❌ |

### 差异化定位

> **Translation Agent 的核心差异化不在于"又一个划词翻译"，而在于术语库驱动的专业翻译一致性。** 面向需要跨语言处理专业文档的用户（法律工作者、医学翻译、技术文档编写者），解决"同一术语每次翻译结果不同"的痛点。

---

## 用户交互详解

### 划词翻译交互流程

```
                            ┌──────────────────────┐
                            │     用户划选文本       │
                            └──────────┬───────────┘
                                       │
                              mouseup / keyup
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │   防抖 300ms          │
                            │   过滤空选/重复选      │
                            └──────────┬───────────┘
                                       │
                                       ▼
                  ┌────────────────────────────────────────┐
                  │           气泡出现 (翻译中...)          │
                  │  ┌──────────────────────────────────┐  │
                  │  │  Loading skeleton animation      │  │
                  │  │                                  │  │
                  │  │  源语言: 自动检测 (EN)    ▼      │  │
                  │  │  目标语言: 中文           ▼      │  │
                  │  └──────────────────────────────────┘  │
                  └────────────────────────────────────────┘
                                       │
                              流式响应到达
                                       │
                                       ▼
                  ┌────────────────────────────────────────┐
                  │           气泡 (翻译完成)               │
                  │  ┌──────────────────────────────────┐  │
                  │  │  "This is a contract"             │  │
                  │  │  ─────────────────────            │  │
                  │  │  这是一份合同                      │  │
                  │  │                                  │  │
                  │  │  📋 Copy                         │  │
                  │  │                                  │  │
                  │  │  ┌─ Matched Terms ─────────────┐ │  │
                  │  │  │ contract → 合同              │ │  │
                  │  │  └─────────────────────────────┘ │  │
                  │  │                                  │  │
                  │  │  源: EN (auto) ▼  目标: ZH ▼    │  │
                  │  │  领域: Legal ▼                   │  │
                  │  └──────────────────────────────────┘  │
                  └────────────────────────────────────────┘
```

### 气泡关闭逻辑

| 触发 | 行为 |
|---|---|
| 点击气泡外部 | 关闭 |
| 按 Escape | 关闭 |
| 划选新文本 | 关闭旧气泡 → 打开新气泡 |
| 页面滚动 | 气泡跟随滚动（position: absolute + 滚动偏移补偿） |
| 切换 Tab | 保留气泡状态，切回时仍在 |

---

## 从 Artifact 版迁移清单

| 模块 | Artifact 版 | 插件版改动 |
|---|---|---|
| 文本输入 | textarea 固定区域 | 任意网页 `window.getSelection()` |
| 气泡渲染 | 直接 DOM 操作 | Shadow DOM 封装 |
| 翻译调用 | 内置 Claude API | 后端代理 + SSE 流式 |
| 术语存储 | Persistent Storage | chrome.storage.local |
| 样式 | 内联样式 | CSS Modules in Shadow DOM |
| 状态管理 | React useState | Zustand + chrome.storage |
| 语言检测 | 可直接复用 | 提取为独立模块 |
| 术语匹配 | 可直接复用 | 提取为独立模块 |

---

## 附录：类型定义汇总

```typescript
// 支持的语言
type LangCode =
  | 'zh' | 'en' | 'et' | 'ja' | 'ko'
  | 'fr' | 'de' | 'es' | 'ru' | 'pt'
  | 'it' | 'ar';

// 语言元信息
interface Language {
  code: LangCode;
  name: string;        // English name
  nativeName: string;  // 本地名称
  direction: 'ltr' | 'rtl';
}

const LANGUAGES: Language[] = [
  { code: 'zh', name: 'Chinese',    nativeName: '中文',       direction: 'ltr' },
  { code: 'en', name: 'English',    nativeName: 'English',    direction: 'ltr' },
  { code: 'et', name: 'Estonian',   nativeName: 'Eesti',      direction: 'ltr' },
  { code: 'ja', name: 'Japanese',   nativeName: '日本語',     direction: 'ltr' },
  { code: 'ko', name: 'Korean',     nativeName: '한국어',     direction: 'ltr' },
  { code: 'fr', name: 'French',     nativeName: 'Français',   direction: 'ltr' },
  { code: 'de', name: 'German',     nativeName: 'Deutsch',    direction: 'ltr' },
  { code: 'es', name: 'Spanish',    nativeName: 'Español',    direction: 'ltr' },
  { code: 'ru', name: 'Russian',    nativeName: 'Русский',    direction: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português',  direction: 'ltr' },
  { code: 'it', name: 'Italian',    nativeName: 'Italiano',   direction: 'ltr' },
  { code: 'ar', name: 'Arabic',     nativeName: 'العربية',    direction: 'rtl' },
];

// 专业领域
type Domain = 'general' | 'legal' | 'medical' | 'tech';

// 术语
interface Term {
  id: string;
  domain: Domain;
  translations: Partial<Record<LangCode, string>>;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

// 翻译请求
interface TranslateRequest {
  text: string;
  sourceLang: 'auto' | LangCode;
  targetLang: LangCode;
  domain: Domain;
  terms?: { source: string; target: string }[];
}

// 翻译响应（完整）
interface TranslateResponse {
  translatedText: string;
  detectedLang: LangCode;
  matchedTerms: { source: string; target: string }[];
  usage: { inputTokens: number; outputTokens: number };
}
```
