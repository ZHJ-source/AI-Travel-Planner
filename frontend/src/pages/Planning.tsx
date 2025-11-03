import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput';
import LoadingSpinner from '../components/LoadingSpinner';
import MapContainer from '../components/MapContainer';
import ItineraryView from '../components/ItineraryView';
import { Itinerary, TravelRequirements, Marker } from '../types';
import { generateItinerary, saveItinerary } from '../services/itinerary';
import { useAuthStore } from '../stores/authStore';

const Planning: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [input, setInput] = useState('');
  const [requirements, setRequirements] = useState<TravelRequirements>({
    destination: '',
    days: 5,
    travelers: 1,
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [generatedItinerary, setGeneratedItinerary] = useState<Itinerary | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1); // 当前选择的天数
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null); // 需要聚焦的位置
  
  // 监听全局错误
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setRenderError(`页面错误: ${event.error?.message || '未知错误'}`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setRenderError(`异步错误: ${event.reason?.message || event.reason || '未知错误'}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // 组件挂载时尝试恢复之前的行程
  React.useEffect(() => {
    console.log('Planning component mounted');
    console.log('Environment check:', {
      hasAmapKey: !!import.meta.env.VITE_AMAP_JS_API_KEY,
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    });
    
    try {
      const savedItinerary = sessionStorage.getItem('tempItinerary');
      
      if (savedItinerary) {
        console.log('Restoring saved itinerary from sessionStorage');
        const parsed = JSON.parse(savedItinerary);
        console.log('Parsed itinerary:', parsed);
        setGeneratedItinerary(parsed);
        setSelectedDay(1); // 默认显示第一天
      }
    } catch (error) {
      console.error('Failed to restore itinerary:', error);
      // 清除损坏的数据
      try {
        sessionStorage.removeItem('tempItinerary');
      } catch (e) {
        console.error('Failed to clear corrupted sessionStorage:', e);
      }
    }
  }, []); // 只在首次挂载时执行
  
  // 监听状态变化（用于调试）
  React.useEffect(() => {
    console.log('Planning state updated:', {
      isGenerating,
      hasItinerary: !!generatedItinerary,
      progress,
      selectedDay
    });
  }, [isGenerating, generatedItinerary, progress, selectedDay]);

  // 根据选中的天数生成标记
  React.useEffect(() => {
    if (!generatedItinerary || !generatedItinerary.days) return;

    const currentDay = generatedItinerary.days.find(day => day.dayNumber === selectedDay);
    if (!currentDay) return;

    const newMarkers: Marker[] = [];
    if (currentDay.events) {
      currentDay.events.forEach((event: any) => {
        const lat = parseFloat(event.latitude);
        const lng = parseFloat(event.longitude);
        
        if (!isNaN(lat) && !isNaN(lng) && 
            lat >= -90 && lat <= 90 && 
            lng >= -180 && lng <= 180) {
          newMarkers.push({
            id: event.id || `${currentDay.dayNumber}-${event.eventOrder}`,
            position: { lat, lng },
            title: event.name,
            type: event.type,
          });
        } else {
          console.warn(`Invalid coordinates for ${event.name}:`, { lat: event.latitude, lng: event.longitude });
        }
      });
    }

    console.log(`Day ${selectedDay} markers:`, newMarkers);
    setMarkers(newMarkers);
  }, [generatedItinerary, selectedDay]);

  // 处理点击地点事件
  const handleLocationClick = (lat: number, lng: number) => {
    console.log('Planning: 点击地点，准备聚焦:', { lat, lng });
    setFocusLocation({ lat, lng });
    // 延迟清除焦点（让地图有足够时间响应并保持视图）
    setTimeout(() => {
      console.log('Planning: 清除聚焦状态');
      setFocusLocation(null);
    }, 1000);
  };

  const handleVoiceTranscript = (text: string) => {
    setInput(text);
  };

  const handleGenerate = async () => {
    if (!requirements.destination) {
      alert('请输入目的地');
      return;
    }

    console.log('Starting generation...');
    setIsGenerating(true);
    setProgress(0);
    setGeneratedItinerary(null);
    setMarkers([]);
    setProgressMessage('开始生成行程...');

    try {
      await generateItinerary(requirements, (update) => {
        console.log('Progress update:', update);
        
        if (update.step === 'error') {
          console.error('Generation error:', update.error);
          alert('生成失败: ' + update.error);
          setIsGenerating(false);
          return;
        }
        
        setProgress(update.progress || 0);
        setProgressMessage(getProgressMessage(update.step));
        
        if (update.step === 'complete' && update.data) {
          console.log('✅ Itinerary generation complete!');
          console.log('Itinerary data:', update.data);
          
          // 立即更新状态
          setGeneratedItinerary(update.data);
          setIsGenerating(false);
          
          // 初始化时默认显示第一天
          setSelectedDay(1);
          
          // 🔥 关键修复：保存到sessionStorage，防止丢失
          try {
            sessionStorage.setItem('tempItinerary', JSON.stringify(update.data));
            console.log('✅ Saved itinerary to sessionStorage');
          } catch (error) {
            console.error('Failed to save to sessionStorage:', error);
          }
        }
      });
    } catch (error: any) {
      console.error('Generate itinerary error:', error);
      alert('生成行程失败: ' + (error.message || '请稍后重试'));
      setIsGenerating(false);
    }
  };

  const getProgressMessage = (step: string) => {
    const messages: Record<string, string> = {
      generating: '正在生成行程...',
      validating: '验证地点信息...',
      enriching: '丰富行程内容...',
      finalizing: '最后整理...',
      complete: '生成完成！',
    };
    return messages[step] || '处理中...';
  };

  const handleSave = async () => {
    if (!generatedItinerary) return;
    
    if (!isAuthenticated) {
      alert('请先登录');
      navigate('/login');
      return;
    }

    try {
      console.log('💾 Saving itinerary:', {
        title: generatedItinerary.title,
        destination: generatedItinerary.destination,
        daysCount: generatedItinerary.days?.length,
      });
      
      await saveItinerary(generatedItinerary);
      alert('行程保存成功！');
      // 保存成功后清除临时数据
      sessionStorage.removeItem('tempItinerary');
      sessionStorage.removeItem('tempMarkers');
      navigate('/itineraries');
    } catch (error: any) {
      console.error('❌ 保存行程失败:', error);
      console.log('错误响应:', error.response);
      
      // 显示详细的错误信息
      let errorMessage = '保存失败，请稍后重试';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          errorMessage = `保存失败: ${data.message}`;
          if (data.details) {
            errorMessage += `\n详情: ${JSON.stringify(data.details, null, 2)}`;
          }
        } else if (data.error) {
          errorMessage = `保存失败: ${data.error}`;
        }
      }
      
      alert(errorMessage);
    }
  };
  
  const handleReset = () => {
    setGeneratedItinerary(null);
    setMarkers([]);
    setSelectedDay(1);
    sessionStorage.removeItem('tempItinerary');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/')} className="text-2xl font-bold text-gray-900">
              AI旅行规划师
            </button>
            <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-900">
              返回首页
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 错误显示 */}
        {renderError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <div className="flex items-start gap-3">
              <span className="text-red-600 text-xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-1">页面出现错误</h3>
                <p className="text-red-700 text-sm mb-3">{renderError}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    刷新页面
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.clear();
                      window.location.reload();
                    }}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                  >
                    清除缓存并刷新
                  </button>
                  <button
                    onClick={() => setRenderError(null)}
                    className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                  >
                    关闭提示
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <strong>调试信息:</strong> 
            isGenerating: {isGenerating.toString()}, 
            hasItinerary: {(!!generatedItinerary).toString()}, 
            progress: {progress}%
            {!import.meta.env.VITE_AMAP_JS_API_KEY && (
              <span className="text-red-600 ml-2">| ⚠️ 高德地图 API Key 未配置</span>
            )}
          </div>
        )}
        
        {!generatedItinerary ? (
          <div className="max-w-3xl mx-auto">
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">规划您的旅行</h2>
              
              {/* 语音输入 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  语音输入（可选）
                </label>
                <VoiceInput onTranscript={handleVoiceTranscript} />
              </div>

              {/* 文字输入 */}
              <div className="mb-6">
                <label htmlFor="input" className="block text-sm font-medium text-gray-700 mb-2">
                  或者直接输入您的旅行需求
                </label>
                <textarea
                  id="input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="例如：我想去日本，5天，预算1万元，喜欢美食和动漫，带孩子"
                />
              </div>

              {/* 结构化输入 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目的地 *
                  </label>
                  <input
                    type="text"
                    value={requirements.destination}
                    onChange={(e) => setRequirements({ ...requirements, destination: e.target.value })}
                    className="input"
                    placeholder="如：东京、巴黎"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    天数 *
                  </label>
                  <input
                    type="number"
                    value={requirements.days}
                    onChange={(e) => setRequirements({ ...requirements, days: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                    max="30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    人数
                  </label>
                  <input
                    type="number"
                    value={requirements.travelers}
                    onChange={(e) => setRequirements({ ...requirements, travelers: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    预算（元）
                  </label>
                  <input
                    type="number"
                    value={requirements.budget || ''}
                    onChange={(e) => setRequirements({ ...requirements, budget: parseInt(e.target.value) || undefined })}
                    className="input"
                    placeholder="可选"
                  />
                </div>
              </div>

              {isGenerating ? (
                <div className="text-center py-8">
                  <LoadingSpinner message={progressMessage} />
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{progress}%</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={!requirements.destination}
                  className="w-full btn btn-primary disabled:opacity-50"
                >
                  开始生成行程
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：行程详情 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 头部操作栏 */}
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">生成的行程</h2>
                <div className="flex gap-2">
                  <button onClick={handleSave} className="btn btn-primary">
                    保存行程
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn btn-secondary"
                  >
                    重新规划
                  </button>
                </div>
              </div>

              {/* 天数切换标签 */}
              {generatedItinerary?.days && generatedItinerary.days.length > 1 && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex flex-wrap gap-2">
                    {generatedItinerary.days.map((day: any) => (
                      <button
                        key={day.dayNumber}
                        onClick={() => setSelectedDay(day.dayNumber)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedDay === day.dayNumber
                            ? 'bg-primary-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        第 {day.dayNumber} 天
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 当前天的行程 */}
              <ItineraryView 
                itinerary={generatedItinerary}
                selectedDay={selectedDay}
                onLocationClick={handleLocationClick}
              />
            </div>

            {/* 右侧：地图 */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-[600px]">
                  <MapContainer 
                    markers={markers} 
                    focusLocation={focusLocation}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Planning;

