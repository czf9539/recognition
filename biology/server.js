// server.js - 生物识别服务（阿里云百炼兼容 OpenAI 模式）
const express = require('express');
const cors = require('cors');
const OpenAI = require("openai"); // 引入 openai 库
const app = express();
const PORT = 3000;

// 假设前端文件在项目的public目录下
app.use(express.static('public')); 
// 或直接指定index.html的路径
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 初始化 OpenAI 客户端（兼容模式连接阿里云百炼）
const openai = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || "sk-17443f3d39974202a54d922093a78cbc", // 你的百炼 API Key
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1" // 百炼兼容 OpenAI 的 endpoint
});

// 生物识别核心接口
app.post('/api/biology-detect', async (req, res) => {
  console.log('\n===== 收到新的识别请求 =====');
  try {
    const { imageData } = req.body;

    // 1. 打印接收到的原始数据（仅前50字符）
    console.log('1. 接收到的 imageData (前50字符):', imageData ? imageData.substring(0, 50) : 'undefined');

    // 2. 基础参数校验
    if (!imageData) {
      console.error('错误：缺少 imageData 参数');
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        data: { is_biological: false, detail: '缺少图片数据（imageData）' }
      });
    }

    // 3. Base64 格式处理
    let pureBase64;
    if (imageData.startsWith('data:')) {
      console.log('检测到 data URL 前缀，正在剥离...');
      const base64PrefixRegex = /^data:image\/\w+;base64,/;
      pureBase64 = imageData.replace(base64PrefixRegex, '');
    } else {
      pureBase64 = imageData.trim();
    }
    console.log('2. 处理后的 pureBase64 (前50字符):', pureBase64.substring(0, 50));

    // 4. Base64 合法性校验
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(pureBase64)) {
      console.error('错误：处理后的 Base64 字符串格式不合法');
      return res.status(400).json({
        code: 400,
        message: '格式错误',
        data: {
          is_biological: false,
          detail: '仅支持纯 Base64 字符串或 HTTP/HTTPS 图片URL，请上传正确格式的图片数据'
        }
      });
    }

    // 5. 构造请求体（兼容 OpenAI 格式）
    const messages = [
      {
        role: "user",
        content: [
          { 
            type: "image_url", 
            image_url: { url: `data:image/png;base64,${pureBase64}` } // 包装为 data URL 格式
          },
          {
            type: "text",
            text: `请严格按照以下要求返回结果：
1. 判断图片是否包含生物（动物、植物、微生物等）；
2. 若是生物，请精确识别到物种级别，并返回 JSON 格式：{
   "is_biological": true, 
   "name": "生物常用名称（如：德国牧羊犬）", 
   "scientific_name": "科学学名（如：Canis lupus familiaris）",
   "type": "详细分类（如：mammal|bird|flower|tree等）", 
   "confidence": 0.99（0-1之间的置信度）, 
   "habitat": "分布区域",
   "description": "详细生物学描述，包括形态特征、生活习性、分布范围等（至少50字）"
}；
3. 若不是生物或无法识别，返回 JSON 格式：{"is_biological": false, "message": "图片与生物无关或无法识别"}；
4. 仅返回 JSON 字符串，不要添加任何额外内容（如解释、换行等）。`
          }
        ]
      }
    ];

    console.log('3. 准备发送给阿里云百炼 API 的请求体构造完成。');
    console.log('   - 模型 ID:', "qwen-vl-max");
    console.log('   - 发送的图片 Base64 (前50字符):', pureBase64.substring(0, 50));

    // 6. 调用阿里云百炼 API（兼容 OpenAI 格式）
    console.log('正在调用阿里云百炼 API...');
    const response = await openai.chat.completions.create({
      model: "qwen-vl-max", // 使用百炼的多模态模型
      messages: messages,
      max_tokens: 1024, // 增加 tokens 限制以获取更详细的描述
      temperature: 0.1
    });

    // 7. 处理响应结果
    console.log('4. 百炼 API 调用成功，收到响应。');
    const rawContent = response.choices[0].message.content.trim();
    console.log('   - API 返回的原始内容:', rawContent);

    // 8. 解析 JSON 结果
    let result;
    try {
      result = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('JSON 解析失败:', parseError.message, '原始内容:', rawContent);
      return res.status(200).json({
        code: 200,
        message: '结果解析失败',
        data: { is_biological: false, message: '识别结果格式异常，请上传清晰图片重试' }
      });
    }

    // 9. 返回最终结果
    res.status(200).json({
      code: 200,
      message: '识别成功',
      data: result
    });

  } catch (error) {
    // 10. 错误处理
    console.error('\n❗️ 发生错误 ❗️');
    console.error('   - 错误类型:', error.name);
    console.error('   - 错误信息:', error.message);
    
    let errorDetail = '识别服务异常，请稍后重试';
    if (error.message.includes('401')) {
      errorDetail = 'API Key 无效，请检查配置';
    } else if (error.message.includes('404')) {
      errorDetail = '模型不存在或无权限，请更换模型或检查权限';
    } else if (error.message.includes('invalid argument')) {
      errorDetail = '图片格式不支持，请上传正确的 Base64 或 URL';
    }

    res.status(500).json({
      code: 500,
      message: '服务异常',
      data: { 
        is_biological: false, 
        detail: errorDetail
      }
    });
  }
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.status(200).json({
    code: 200,
    message: '服务运行正常',
    data: { port: PORT, timestamp: new Date().toISOString() }
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`✅ 生物识别服务已启动：http://localhost:${PORT}`);
  console.log(`🔍 健康检查：http://localhost:${PORT}/health`);
  console.log(`⚠️  请确保阿里云百炼 API Key 已正确配置`);
});