import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import MapContainer from '../components/MapContainer';
import ItineraryView from '../components/ItineraryView';
import EditableItineraryDay from '../components/EditableItineraryDay';
import MapSearch from '../components/MapSearch';
import CostAnalysis from '../components/CostAnalysis';
import { Itinerary, Marker, Event } from '../types';
import { getItinerary, deleteItinerary, updateItinerary } from '../services/itinerary';
import { POI, batchRoutes, RouteInfo } from '../services/location';

const ItineraryDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [showMapSearch, setShowMapSearch] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [routeMode, setRouteMode] = useState<'walking' | 'driving' | 'transit'>('walking');
  const [showRoutes, setShowRoutes] = useState(true);

  // 加载行程数据
  useEffect(() => {
    const loadItinerary = async () => {
      if (!id) {
        setError('无效的行程ID');
        setIsLoading(false);
        return;
      }

      try {
        console.log('📖 Loading itinerary:', id);
        const data = await getItinerary(id);
        console.log('✅ Itinerary loaded:', data);
        setItinerary(data);
        setSelectedDay(1); // 默认显示第一天
      } catch (err: any) {
        console.error('❌ Failed to load itinerary:', err);
        setError(err.response?.data?.error || '加载行程失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadItinerary();
  }, [id]);

  // 根据选中的天数生成地图标记
  useEffect(() => {
    if (!itinerary || !itinerary.days) return;

    const currentDay = itinerary.days.find(day => day.dayNumber === selectedDay);
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
        }
      });
    }

    console.log(`📍 Day ${selectedDay} markers:`, newMarkers);
    setMarkers(newMarkers);
  }, [itinerary, selectedDay]);

  // 当标记变化或路线模式变化时，重新计算路线
  useEffect(() => {
    if (!showRoutes || markers.length < 2) {
      setRoutes([]);
      return;
    }

    const calculateRoutes = async () => {
      setIsCalculatingRoute(true);
      try {
        const locations = markers.map(m => ({ lng: m.position.lng, lat: m.position.lat }));
        const city = itinerary?.destination;
        const calculatedRoutes = await batchRoutes(locations, routeMode, city);
        setRoutes(calculatedRoutes);
        console.log('✅ 路线计算完成:', calculatedRoutes);
      } catch (error) {
        console.error('❌ 路线计算失败:', error);
      } finally {
        setIsCalculatingRoute(false);
      }
    };

    // 延迟计算，避免频繁调用
    const timer = setTimeout(calculateRoutes, 500);
    return () => clearTimeout(timer);
  }, [markers, routeMode, showRoutes, itinerary?.destination]);

  // 处理点击地点事件
  const handleLocationClick = (lat: number, lng: number) => {
    console.log('🗺️ Focus on location:', { lat, lng });
    setFocusLocation({ lat, lng });
    setTimeout(() => {
      setFocusLocation(null);
    }, 1000);
  };

  // 处理删除
  const handleDelete = async () => {
    if (!id || !confirm('确定要删除这个行程吗？')) return;

    try {
      await deleteItinerary(id);
      alert('行程已删除');
      navigate('/itineraries');
    } catch (error) {
      console.error('Delete error:', error);
      alert('删除失败，请稍后重试');
    }
  };

  // 处理保存
  const handleSave = async () => {
    if (!id || !itinerary) return;

    setIsSaving(true);
    try {
      await updateItinerary(id, itinerary);
      alert('行程已保存');
      setHasUnsavedChanges(false);
      setIsEditMode(false);
    } catch (error) {
      console.error('Save error:', error);
      alert('保存失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 处理天数的事件变化
  const handleDayEventsChange = (dayNumber: number, newEvents: Event[]) => {
    if (!itinerary) return;

    const updatedDays = itinerary.days.map(day => {
      if (day.dayNumber === dayNumber) {
        return { ...day, events: newEvents };
      }
      return day;
    });

    setItinerary({ ...itinerary, days: updatedDays });
    setHasUnsavedChanges(true);
  };

  // 从地图选择地点
  const handleSelectPlaceFromMap = (poi: POI) => {
    if (!itinerary) return;

    const currentDay = itinerary.days.find(day => day.dayNumber === selectedDay);
    if (!currentDay) return;

    const [lng, lat] = poi.location.split(',').map(parseFloat);
    const newEvent: Event = {
      eventOrder: currentDay.events.length + 1,
      type: 'attraction',
      name: poi.name,
      address: poi.address,
      latitude: lat,
      longitude: lng,
      poiId: poi.id,
      isMainEvent: true,
    };

    handleDayEventsChange(selectedDay, [...currentDay.events, newEvent]);
    setShowMapSearch(false);
    
    // 聚焦到新添加的地点
    setFocusLocation({ lat, lng });
    setTimeout(() => setFocusLocation(null), 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="加载行程中..." />
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <button onClick={() => navigate('/')} className="text-2xl font-bold text-gray-900">
                AI旅行规划师
              </button>
              <button onClick={() => navigate('/itineraries')} className="text-gray-600 hover:text-gray-900">
                返回列表
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-medium">加载失败</p>
            <p className="text-sm">{error || '未找到行程'}</p>
            <button
              onClick={() => navigate('/itineraries')}
              className="mt-4 btn btn-primary"
            >
              返回行程列表
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => navigate('/')} className="text-2xl font-bold text-gray-900">
              AI旅行规划师
            </button>
            <button onClick={() => navigate('/itineraries')} className="text-gray-600 hover:text-gray-900">
              返回列表
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：行程详情 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 开销分析 */}
            <CostAnalysis itinerary={itinerary} />
            {/* 头部操作栏 */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{itinerary.title}</h2>
                <p className="text-gray-600 mt-1">
                  {itinerary.destination} · {itinerary.days?.length || 0}天
                  {itinerary.travelers && ` · ${itinerary.travelers}人`}
                  {itinerary.budget && ` · ¥${itinerary.budget}`}
                </p>
                {hasUnsavedChanges && (
                  <p className="text-orange-600 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    有未保存的更改
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!isEditMode ? (
                  <>
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      ✏️ 编辑行程
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      🗑️ 删除行程
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !hasUnsavedChanges}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? '保存中...' : '💾 保存更改'}
                    </button>
                    <button
                      onClick={() => {
                        if (hasUnsavedChanges && !confirm('有未保存的更改，确定要退出编辑模式吗？')) {
                          return;
                        }
                        setIsEditMode(false);
                        setHasUnsavedChanges(false);
                        // 重新加载数据
                        window.location.reload();
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      ❌ 取消编辑
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 天数切换标签 */}
            {itinerary.days && itinerary.days.length > 1 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex flex-wrap gap-2">
                  {itinerary.days.map((day: any) => (
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
            {isEditMode ? (
              <EditableItineraryDay
                dayNumber={selectedDay}
                date={itinerary.days.find(d => d.dayNumber === selectedDay)?.date}
                events={itinerary.days.find(d => d.dayNumber === selectedDay)?.events || []}
                onEventsChange={(newEvents) => handleDayEventsChange(selectedDay, newEvents)}
                onLocationClick={handleLocationClick}
                onAddFromMap={() => setShowMapSearch(true)}
              />
            ) : (
              <ItineraryView 
                itinerary={itinerary}
                selectedDay={selectedDay}
                onLocationClick={handleLocationClick}
              />
            )}
          </div>

          {/* 右侧：地图 */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* 地图搜索 */}
              {isEditMode && showMapSearch && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">搜索地点</h3>
                    <button
                      onClick={() => setShowMapSearch(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <MapSearch
                    city={itinerary.destination}
                    onSelectPlace={handleSelectPlaceFromMap}
                  />
                </div>
              )}

              {/* 地图 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* 路线控制栏 */}
                <div className="border-b border-gray-200 p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm text-gray-700">路线规划</h4>
                    <button
                      onClick={() => setShowRoutes(!showRoutes)}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        showRoutes
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {showRoutes ? '✓ 显示路线' : '隐藏路线'}
                    </button>
                  </div>
                  {showRoutes && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRouteMode('walking')}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                          routeMode === 'walking'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        🚶 步行
                      </button>
                      <button
                        onClick={() => setRouteMode('transit')}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                          routeMode === 'transit'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        🚌 公交
                      </button>
                      <button
                        onClick={() => setRouteMode('driving')}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                          routeMode === 'driving'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        🚗 驾车
                      </button>
                    </div>
                  )}
                </div>

                {isCalculatingRoute && (
                  <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    正在规划路线...
                  </div>
                )}
                <div className="h-[600px]">
                  <MapContainer 
                    markers={markers} 
                    focusLocation={focusLocation}
                    routes={routes}
                    showSimplePath={false}
                  />
                </div>
                {/* 路线信息 */}
                {routes.length > 0 && showRoutes && (
                  <div className="border-t border-gray-200 p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <h4 className="text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      路线统计
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">总距离</div>
                        <div className="text-lg font-bold text-blue-600">
                          {(routes.reduce((sum, r) => sum + r.distance, 0) / 1000).toFixed(1)} 
                          <span className="text-sm font-normal ml-1">km</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-500 mb-1">预计时间</div>
                        <div className="text-lg font-bold text-green-600">
                          {Math.round(routes.reduce((sum, r) => sum + r.duration, 0) / 60)}
                          <span className="text-sm font-normal ml-1">分钟</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-600 bg-white rounded-lg p-2 flex items-center gap-2">
                      <span className="font-medium">出行方式：</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {routeMode === 'walking' && '🚶 步行'}
                        {routeMode === 'transit' && '🚌 公交'}
                        {routeMode === 'driving' && '🚗 驾车'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ItineraryDetail;

