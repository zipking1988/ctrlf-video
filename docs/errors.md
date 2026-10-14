# 错误与恢复（D1）

## Gemini 与 Google Cloud 入口（2026-10-11）

- `google_media_not_enabled` / `gemini_endpoint_not_allowed` / `invalid_gemini_model`：私有runtime尚未明确启用Google帧发送，或端点/模型ID非法；不会dispatch。不要从浏览器解除保护。
- `gemini_embedding_input_limit` / `gemini_request_limit`：完整窗口批次超过100，或inline请求超过19MiB；显式拒绝，不截尾发布ready。选择较短素材或以后实现经评审的完整有界批次方案。
- `gemini_inline_jpeg_required`：只允许本机解码的inline JPEG，不抓取外部媒体URL。
- `gemini_incomplete_response` / `invalid_gemini_response`：模型安全阻断、输出截短或格式无效。若已dispatch则作为 `model_unknown` 保留费用，禁止自动重发；已有verified部分按原恢复协议保留。
- `gemini_asr_not_supported` / `audio_channel_unavailable`：当前Gemini路线只有视觉，音轨问题不能用视觉回答冒充。
- `gateway_auth_required`（401）：后端未收到有效私有入口token；token不能替代用户cookie/CSRF/拥有权。只由操作者检查服务端配置。
- `workspace_backend_unavailable`（502）：入口无法连接持久后端；不切换fixture，不重试模型请求。
- `gateway_upload_limit_30_mib`（413）：Cloud Run HTTP/1入口只接收≤30MiB请求体，本地直接上传仍保留500MiB上限。
- workspace在`K_SERVICE`环境启动拒绝：必须使用无状态gateway和持久单后端，不把SQLite预算/调查放进Cloud Run临时盘。


| 当前入口 | 原因 | 恢复动作 |
|---|---|---|
| invalid_config / 退出码2 | TOML不可读、未知字段、非法类型或保护限额 | 检查配置名称/类型；不通过普通配置批准新额度 |
| real预检 / 退出码2 | model、权限、预算、GPU费用上界及媒体保护未就绪 | 补实际信息并完成校准/实现，不能自动fixture代替real |
| BudgetDenied（内部） | 缺批准、额度不足、币种/载荷冲突、撤销或非法状态 | 不dispatch；重新核对有效批准与同请求身份 |
| unknown attempt（内部） | dispatch前后结果不确定 | 保留预算，禁止自动重新dispatch；供应商验证复取或明确新尝试尚待接入 |

当前model adapter不存在，以上不会发出付费请求。配置错误不输出输入值、密钥或路径。SQLite繁忙有1秒有限等待，异常不得绕过预算开启模型调用。

后续HTTP四状态与400/401/403/404/409/410/429/502/504映射、query pending/unknown恢复及UI保留草稿仍未实现；按X03/E17交付时同时验证。`/docs/errors`当前提供本地简要说明。
