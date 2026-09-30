# 安全反馈

请勿在公开 Issue 披露可利用的漏洞、密钥或个人信息。若仓库 Security → Report a vulnerability 可用，使用该私密渠道；否则使用维护者 GitHub 资料公开列出的联系渠道。项目处于早期阶段，没有响应时限承诺。

## 设计边界

v0.1 只提供静态文件与审核后的 HTML/CSS 预览。预览 iframe 使用空 sandbox 权限；示例有 CSP，但这不使任意贡献源码自动安全。资源校验为辅助检查，不能替代人工审核。

PR CI 使用 `pull_request` 和只读权限，不使用 `pull_request_target` 执行贡献者代码，不向贡献者构建暴露生产密钥。Pages 发布只针对维护者合并后的 main，或由维护者手动触发。

后续允许 JavaScript 预览前，必须先部署独立 origin 的预览环境并审查网络、存储、导航、资源和运行时间限制。
