# recognition
生物信息学作业
# 可运行网站 http://120.26.21.47:3000/
# 生物识别 —— 基于 AI 的图片生物物种分析工具

本项目是一个轻量级 Web 应用，使用阿里云百炼的 `qwen-vl-max` 多模态大模型，通过上传图片识别其中的动植物、微生物等生物，并返回物种名称、学名、分类、分布区域与详细描述。前端采用 HTML + Tailwind CSS + 原生 JavaScript，后端基于 Node.js 与 Express，整体结构简洁，部署灵活。

---

## 本地运行说明

在本地开发或测试时，您只需确保 Node.js 环境已安装（建议版本 18 或以上）。克隆项目后，将 `index.html`与 `server.js` 放在同一目录下。安装依赖后，配置 API Key 并启动服务即可。本地测试需修改`index.html`中635行域名为localhost

### Windows 系统配置方法

在 Windows 上打开命令提示符（CMD）或 PowerShell，进入项目目录后执行以下命令：

```powershell
npm install express cors openai
```

设置环境变量（PowerShell）：
```powershell
$env:DASHSCOPE_API_KEY="sk-您的阿里云百炼API密钥"
```

然后运行服务：
```powershell
node server.js
```

服务启动后，访问 `http://localhost:3000` 即可使用。注意：Windows 对文件路径和环境变量的处理与类 Unix 系统略有不同，但本项目使用标准 Node.js API，兼容性良好。

### macOS / Linux 系统配置方法

在终端中进入项目目录，执行依赖安装：
```bash
npm install express cors openai
```

设置 API Key（临时环境变量）：
```bash
export DASHSCOPE_API_KEY="sk-您的阿里云百炼API密钥"
```

启动服务：
```bash
node server.js
```

您也可以将 API Key 写入 `.bashrc`、`.zshrc` 或使用 `.env` 文件配合 `dotenv` 包实现持久化配置（本项目未引入 `dotenv`，如需可自行添加）。

---

## 移动端使用注意事项

本项目前端已适配移动端，用户在手机浏览器中访问时，可通过点击上传区域选择相册中的图片。由于移动端浏览器不支持拖拽操作，拖拽功能在手机上将自动失效，这属于正常现象。

---
