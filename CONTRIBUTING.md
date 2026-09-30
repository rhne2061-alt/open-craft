# 一起建设 OpenCraft

贡献可以是一件作品、一次修复、一个更好的提示词或一份翻译。开始前请阅读 [行为准则](CODE_OF_CONDUCT.md)。

## 使用 AI 自动整理贡献

先阅读 [AI 接入与授权指南](docs/AI.md)。`npm run contribute -- --slug <slug>` 只预览；用户授权后加 `--submit --allow-publish`，工具仅提交同 slug 的 JSON、HTML 和完整许可证文件，创建 Draft PR，不自动合并。所有资源（包括对原有示例的改进）使用该工具时均需同名 `.LICENSE.txt`。

## 提交资源

1. Fork 并创建分支。复制 `resources/paper-studio.json` 作为起点。
2. 修改 slug、标题、描述、分类、tags、作者、license、source 和 prompt。文件名必须与 slug 一致。
3. 在 `public/examples/<slug>.html` 添加可直接打开的 HTML/CSS 示例，包含 `SPDX-License-Identifier: MIT`（或你的实际许可证）与版权声明。
4. 新资源采用 MIT、Apache-2.0、BSD-3-Clause 或 CC0-1.0 中一种。除项目原创 MIT 示例外，附 `public/examples/<slug>.LICENSE.txt` 写明完整许可与归属；第三方资源附原始来源和修改说明，保留 NOTICE 等要求。
5. 提示词写清布局、内容、样式、响应式、交互和限制，至少 80 个字符。不要含秘密、账号凭据、诱导 AI 执行命令或绕过权限的指令。
6. 本地执行以下检查，然后提交 PR。

```sh
npm ci
npm run validate
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

## 首版收录范围

分类为 `section`、`component`、`background`。只接收自包含、无需脚本和网络请求的 HTML/CSS。使用本地系统字体、原创几何图形和原生 HTML 交互。不要提交外部脚本、iframe、object、embed、表单、远程素材或 CSS url()/@import。

预览 iframe 无沙箱权限；示例应包含限制性 CSP。即使沙箱阻止脚本，用户下载或直接打开的文件也可能运行，所以人工源码审核不可省略。校验器只做早期拒绝，不是全面的安全保证。

## 审核关注点

- 原创或有权再分发，许可/署名/来源完整；不是从收费库搬来的资源。
- 提示词准确对应效果，标题和描述不夸大。
- 390px 和桌面可用，键盘操作正常，文字清晰。
- 源码无隐藏网络请求、脚本、追踪和其他副作用。
- 相邻资源和构建不受影响；页面未出现来源不明的商标、照片和个人信息。

维护者可请求修改或拒绝未满足要求的资源。贡献者保留作品权利；提交意味着你有权按所标明许可证贡献。

## 没有代码也能参与

通过 Issue 提交问题、资源建议或文档改进。不要在公开 Issue 中发送私密信息。安全问题见 [SECURITY.md](SECURITY.md)。
