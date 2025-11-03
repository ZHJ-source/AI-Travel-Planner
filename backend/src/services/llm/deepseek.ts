import axios from 'axios';
import { ENV } from '../../config/env';
import { apiKeyManager } from '../../config/apiKeyManager';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * 调用DeepSeek API
 */
export async function callDeepSeek(
  prompt: string,
  systemPrompt: string = '你是一个专业的旅行规划助手，精通全球各地的旅游信息。',
  customApiKey?: string,
  customApiUrl?: string
): Promise<string> {
  try {
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    // 获取API Key（优先使用自定义Key）
    const apiKey = apiKeyManager.getKey('DEEPSEEK_API_KEY', customApiKey);
    
    if (!apiKey) {
      throw new Error('DeepSeek API Key not configured');
    }

    // 获取API URL（优先使用自定义URL）
    const apiUrl = apiKeyManager.getKey('DEEPSEEK_API_URL', customApiUrl) || ENV.DEEPSEEK_API_URL;

    const response = await axios.post<DeepSeekResponse>(
      apiUrl,
      {
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60秒超时
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    throw new Error('Failed to call DeepSeek API');
  }
}

/**
 * 流式调用DeepSeek API（用于行程生成）
 */
export async function callDeepSeekStream(
  prompt: string,
  systemPrompt: string = '你是一个专业的旅行规划助手，精通全球各地的旅游信息。',
  customApiKey?: string,
  customApiUrl?: string
): Promise<ReadableStream> {
  try {
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ];

    // 获取API Key（优先使用自定义Key）
    const apiKey = apiKeyManager.getKey('DEEPSEEK_API_KEY', customApiKey);
    
    if (!apiKey) {
      throw new Error('DeepSeek API Key not configured');
    }

    // 获取API URL（优先使用自定义URL）
    const apiUrl = apiKeyManager.getKey('DEEPSEEK_API_URL', customApiUrl) || ENV.DEEPSEEK_API_URL;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    return response.body;
  } catch (error) {
    console.error('DeepSeek Stream API Error:', error);
    throw new Error('Failed to call DeepSeek Stream API');
  }
}

