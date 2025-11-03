import axios from 'axios';
import { supabase } from '../config/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动添加认证token和自定义API Key
api.interceptors.request.use(
  async (config) => {
    try {
      // 添加认证token
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('API request - Session check:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
      });
      
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      } else {
        console.warn('No valid session found for API request');
      }

      // 添加自定义API Key（如果配置了）
    const apiKeysStr = localStorage.getItem('apiKeys');
    if (apiKeysStr) {
      try {
        const apiKeys = JSON.parse(apiKeysStr);
        if (apiKeys.deepseekApiKey) {
          config.headers['x-deepseek-api-key'] = apiKeys.deepseekApiKey;
        }
        if (apiKeys.deepseekApiUrl) {
          config.headers['x-deepseek-api-url'] = apiKeys.deepseekApiUrl;
        }
        if (apiKeys.amapWebApiKey) {
          config.headers['x-amap-api-key'] = apiKeys.amapWebApiKey;
        }
      } catch (e) {
        console.error('Failed to parse API keys:', e);
      }
    }
    } catch (error) {
      console.error('Error getting session:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期，跳转到登录页
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

