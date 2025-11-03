import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ApiKeys {
  deepseekApiKey: string;
  deepseekApiUrl: string;
  amapWebApiKey: string;
  amapJsApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    deepseekApiKey: '',
    deepseekApiUrl: '',
    amapWebApiKey: '',
    amapJsApiKey: '',
    supabaseUrl: '',
    supabaseAnonKey: '',
    supabaseServiceRoleKey: '',
  });
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{
    deepseek: string;
    amap: string;
    supabase: string;
  }>({
    deepseek: '',
    amap: '',
    supabase: '',
  });

  useEffect(() => {
    // 从localStorage加载已保存的Key
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        setApiKeys({
          deepseekApiKey: parsed.deepseekApiKey || '',
          deepseekApiUrl: parsed.deepseekApiUrl || '',
          amapWebApiKey: parsed.amapWebApiKey || '',
          amapJsApiKey: parsed.amapJsApiKey || '',
          supabaseUrl: parsed.supabaseUrl || '',
          supabaseAnonKey: parsed.supabaseAnonKey || '',
          supabaseServiceRoleKey: '', // 不从localStorage读取，仅用于输入
        });
      } catch (error) {
        console.error('Failed to parse saved API keys:', error);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApiKeys(prev => ({
      ...prev,
      [name]: value,
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      // 1. 如果有Service Role Key，发送到后端保存
      if (apiKeys.supabaseServiceRoleKey) {
        const response = await fetch('http://localhost:3000/api/config/service-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            supabaseServiceRoleKey: apiKeys.supabaseServiceRoleKey,
          }),
        });

        if (!response.ok) {
          throw new Error('Service Role Key 保存失败');
        }
      }

      // 2. 其他配置保存到localStorage（不包括Service Role Key）
      const localConfig = {
        deepseekApiKey: apiKeys.deepseekApiKey,
        deepseekApiUrl: apiKeys.deepseekApiUrl,
        amapWebApiKey: apiKeys.amapWebApiKey,
        amapJsApiKey: apiKeys.amapJsApiKey,
        supabaseUrl: apiKeys.supabaseUrl,
        supabaseAnonKey: apiKeys.supabaseAnonKey,
        // supabaseServiceRoleKey 不保存到前端
      };
      
      localStorage.setItem('apiKeys', JSON.stringify(localConfig));
      setSaved(true);
      
      // 提示用户需要刷新页面
      if (apiKeys.supabaseUrl || apiKeys.supabaseAnonKey || apiKeys.amapJsApiKey) {
        alert('⚠️ Supabase配置和高德JS API Key需要刷新页面才能生效！\n\n✅ Service Role Key已安全保存到后端服务器');
      } else if (apiKeys.supabaseServiceRoleKey) {
        alert('✅ Service Role Key已安全保存到后端服务器');
      }
      
      // 清空Service Role Key输入框
      setApiKeys(prev => ({ ...prev, supabaseServiceRoleKey: '' }));
      
      // 3秒后隐藏提示
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert('❌ 保存失败：' + error);
    }
  };

  const handleTest = async () => {
    setTestResult({ deepseek: '测试中...', amap: '测试中...', supabase: '测试中...' });

    // 测试DeepSeek API
    try {
      const response = await fetch('http://localhost:3000/api/test/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKeys.deepseekApiKey,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTestResult(prev => ({ ...prev, deepseek: '✅ 连接成功' }));
      } else {
        setTestResult(prev => ({ ...prev, deepseek: `❌ ${data.error || '连接失败'}` }));
      }
    } catch (error) {
      setTestResult(prev => ({ ...prev, deepseek: '❌ 连接失败' }));
    }

    // 测试高德地图API
    try {
      const response = await fetch('http://localhost:3000/api/test/amap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKeys.amapWebApiKey,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTestResult(prev => ({ ...prev, amap: '✅ 连接成功' }));
      } else {
        setTestResult(prev => ({ ...prev, amap: `❌ ${data.error || '连接失败'}` }));
      }
    } catch (error) {
      setTestResult(prev => ({ ...prev, amap: '❌ 连接失败' }));
    }

    // 测试Supabase连接
    try {
      const url = apiKeys.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
      const key = apiKeys.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        setTestResult(prev => ({ ...prev, supabase: '❌ 配置不完整' }));
      } else {
        const response = await fetch(`${url}/rest/v1/`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
          },
        });

        if (response.ok || response.status === 404) {
          setTestResult(prev => ({ ...prev, supabase: '✅ 连接成功' }));
        } else {
          setTestResult(prev => ({ ...prev, supabase: `❌ 连接失败 (${response.status})` }));
        }
      }
    } catch (error) {
      setTestResult(prev => ({ ...prev, supabase: '❌ 连接失败' }));
    }
  };

  const handleClear = () => {
    if (confirm('确定要清除所有配置吗？此操作不可恢复。')) {
      setApiKeys({
        deepseekApiKey: '',
        deepseekApiUrl: '',
        amapWebApiKey: '',
        amapJsApiKey: '',
        supabaseUrl: '',
        supabaseAnonKey: '',
        supabaseServiceRoleKey: '',
      });
      localStorage.removeItem('apiKeys');
      setSaved(false);
      setTestResult({ deepseek: '', amap: '', supabase: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                🌏 AI旅行规划师
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ 开发者设置</h1>
            <p className="text-gray-600">
              配置API密钥以使用第三方服务。密钥将安全地存储在浏览器本地。
            </p>
          </div>

          {/* AI服务配置 */}
          <div className="mb-8 p-6 bg-purple-50 rounded-xl">
            <h2 className="text-xl font-semibold text-purple-900 mb-4">🤖 AI服务配置</h2>
            
            {/* DeepSeek API Key */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DeepSeek API Key
              </label>
              <input
                type="password"
                name="deepseekApiKey"
                value={apiKeys.deepseekApiKey}
                onChange={handleInputChange}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
              <p className="mt-2 text-sm text-gray-500">
                用于AI行程生成。获取密钥：
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  DeepSeek平台
                </a>
              </p>
              {testResult.deepseek && (
                <p className="mt-2 text-sm font-medium">{testResult.deepseek}</p>
              )}
            </div>

            {/* DeepSeek API URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DeepSeek API URL（可选）
              </label>
              <input
                type="text"
                name="deepseekApiUrl"
                value={apiKeys.deepseekApiUrl}
                onChange={handleInputChange}
                placeholder="https://api.deepseek.com/v1/chat/completions"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
              <p className="mt-2 text-sm text-gray-500">
                DeepSeek API端点地址，默认为官方地址，通常不需要修改
              </p>
            </div>
          </div>

          {/* 地图服务配置 */}
          <div className="mb-8 p-6 bg-green-50 rounded-xl">
            <h2 className="text-xl font-semibold text-green-900 mb-4">🗺️ 地图服务配置</h2>
            
            {/* 高德地图 Web API Key */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                高德地图 Web API Key（后端服务）
              </label>
              <input
                type="password"
                name="amapWebApiKey"
                value={apiKeys.amapWebApiKey}
                onChange={handleInputChange}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              />
              <p className="mt-2 text-sm text-gray-500">
                用于后端地点搜索和POI查询。类型：<span className="font-semibold">Web服务</span>
              </p>
              {testResult.amap && (
                <p className="mt-2 text-sm font-medium">{testResult.amap}</p>
              )}
            </div>

            {/* 高德地图 JS API Key */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                高德地图 JavaScript API Key（前端地图）
              </label>
              <input
                type="password"
                name="amapJsApiKey"
                value={apiKeys.amapJsApiKey}
                onChange={handleInputChange}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              />
              <p className="mt-2 text-sm text-gray-500">
                用于前端地图展示。类型：<span className="font-semibold">Web端(JS API)</span>
              </p>
              <p className="mt-1 text-xs text-orange-600">
                ⚠️ 修改后需要刷新页面才能生效
              </p>
            </div>

            <div className="mt-3 text-xs text-gray-600 bg-white p-3 rounded border border-gray-200">
              <p className="font-semibold mb-1">📝 获取密钥：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>访问 <a href="https://console.amap.com/dev/key/app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">高德开放平台</a></li>
                <li>创建应用，需要申请<span className="font-semibold text-red-600">两个不同类型</span>的Key：
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><span className="font-semibold">Web服务</span> - 用于后端API调用</li>
                    <li><span className="font-semibold">Web端(JS API)</span> - 用于前端地图显示</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>

          {/* 数据库配置 */}
          <div className="mb-8 p-6 bg-blue-50 rounded-xl">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">💾 数据库配置 (Supabase)</h2>
            
            {/* Supabase URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase URL
              </label>
              <input
                type="text"
                name="supabaseUrl"
                value={apiKeys.supabaseUrl}
                onChange={handleInputChange}
                placeholder="https://your-project.supabase.co"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <p className="mt-2 text-sm text-gray-500">
                Supabase项目的API URL
              </p>
            </div>

            {/* Supabase Anon Key */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Anon Key（前端使用）
              </label>
              <input
                type="password"
                name="supabaseAnonKey"
                value={apiKeys.supabaseAnonKey}
                onChange={handleInputChange}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <p className="mt-2 text-sm text-gray-500">
                Supabase项目的匿名密钥（Anon/Public Key），用于前端和用户认证
              </p>
              <p className="mt-1 text-xs text-orange-600">
                ⚠️ 修改后需要刷新页面才能生效
              </p>
              {testResult.supabase && (
                <p className="mt-2 text-sm font-medium">{testResult.supabase}</p>
              )}
            </div>

            {/* Supabase Service Role Key */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supabase Service Role Key（后端管理员密钥）
              </label>
              <input
                type="password"
                name="supabaseServiceRoleKey"
                value={apiKeys.supabaseServiceRoleKey}
                onChange={handleInputChange}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  🔒 <span className="font-semibold">安全说明：</span>此密钥输入后将<span className="font-semibold">直接保存到后端服务器</span>，
                  不会存储在浏览器中，确保安全。
                </p>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-600 bg-white p-3 rounded border border-gray-200">
              <p className="font-semibold mb-1">📝 获取配置：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>访问 <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a></li>
                <li>选择您的项目</li>
                <li>进入 Settings → API</li>
                <li>复制 <span className="font-semibold">Project URL</span>、<span className="font-semibold">anon/public key</span> 和 <span className="font-semibold">service_role key</span></li>
                <li>✅ 所有密钥都可以在此页面配置</li>
              </ol>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSave}
              className="flex-1 min-w-[120px] bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
            >
              💾 保存配置
            </button>
            <button
              onClick={handleTest}
              className="flex-1 min-w-[120px] bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
            >
              🔍 测试连接
            </button>
            <button
              onClick={handleClear}
              className="flex-1 min-w-[120px] bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg"
            >
              🗑️ 清除配置
            </button>
          </div>

          {/* 保存成功提示 */}
          {saved && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">✅ 配置已保存成功！</p>
              <p className="text-sm text-green-700 mt-1">
                部分配置需要刷新页面才能生效
              </p>
            </div>
          )}

          {/* 使用说明 */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">📋 重要说明</h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• <span className="font-semibold">优先级</span>：系统优先使用此处配置的Key，未配置则使用环境变量</li>
              <li>• <span className="font-semibold">存储位置</span>：
                <ul className="ml-4 mt-1">
                  <li>- Service Role Key：保存到后端服务器内存（重启后需重新配置）</li>
                  <li>- 其他Key：保存到浏览器localStorage</li>
                </ul>
              </li>
              <li>• <span className="font-semibold">高德地图需要两个Key</span>：Web服务Key用于后端API，JS API Key用于前端地图显示</li>
              <li>• <span className="font-semibold">刷新页面</span>：Supabase和高德JS API配置修改后需刷新页面</li>
              <li>• <span className="font-semibold">安全保障</span>：Service Role Key不会存储在浏览器中</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

