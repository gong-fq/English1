// Netlify Function for secure DeepSeek API calls
const https = require('https');

// System prompt for English teaching
const SYSTEM_PROMPT = `你是专业的英语AI教师助手。用户只能用英文向你提问。你的任务是：

1. 提供详细、有帮助的英语学习内容（词汇、语法、写作、发音等）
2. 给出具体例句和使用场景
3. 提供完整的中文翻译
4. 鼓励和教育性的语气
5. 如果被问词汇含义，提供定义、用法和例句
6. 如果被问语法，清楚解释规则并举例
7. 如果被问写作，给出结构化指导
8. 回复要全面但简洁

请按以下格式回复：
[英文回复内容，包含详细解释和例句]

然后在最后添加：
<div class="translation">[对应的中文翻译]</div>

记住：用户只能用英文提问，你要用中英双语回答，帮助用户学好英语！重点突出实用性和教育价值。`;

exports.handler = async (event, context) => {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // 解析请求体
    const { message } = JSON.parse(event.body);
    
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // 从环境变量获取API密钥（安全！）
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY environment variable is not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // 调用DeepSeek API
    const deepseekResponse = await callDeepSeekAPI(apiKey, message);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(deepseekResponse)
    };

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};

// 调用DeepSeek API的辅助函数
function callDeepSeekAPI(apiKey, userMessage) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      max_tokens: 1200,
      temperature: 0.7,
      stream: false
    });

    const options = {
      hostname: 'api.deepseek.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'English-Learning-App/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`DeepSeek API returned status ${res.statusCode}: ${data}`));
            return;
          }
          
          const jsonData = JSON.parse(data);
          
          if (!jsonData.choices || !jsonData.choices[0] || !jsonData.choices[0].message) {
            reject(new Error('Invalid response format from DeepSeek API'));
            return;
          }
          
          const aiContent = jsonData.choices[0].message.content;
          
          // 分离英文和中文翻译
          let englishPart = aiContent;
          let chinesePart = "中文翻译未能正确提取，请查看英文回复内容。";
          
          if (aiContent.includes('<div class="translation">')) {
            const parts = aiContent.split('<div class="translation">');
            englishPart = parts[0].trim();
            chinesePart = parts[1].replace('</div>', '').trim();
          } else {
            const lines = aiContent.split('\n');
            if (lines.length > 1) {
              englishPart = lines.slice(0, -1).join('\n').trim();
              chinesePart = lines[lines.length - 1].trim();
            }
          }
          
          resolve({
            text: englishPart,
            translation: chinesePart,
            success: true
          });
          
        } catch (parseError) {
          reject(new Error(`Failed to parse DeepSeek response: ${parseError.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`HTTP request failed: ${error.message}`));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// 处理OPTIONS预检请求
exports.handler.options = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: ''
  };
};