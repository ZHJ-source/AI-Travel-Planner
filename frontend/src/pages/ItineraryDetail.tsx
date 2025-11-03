import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import MapContainer from '../components/MapContainer';
import ItineraryView from '../components/ItineraryView';
import { Itinerary, Marker } from '../types';
import { getItinerary, deleteItinerary } from '../services/itinerary';

const ItineraryDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null);

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
            {/* 头部操作栏 */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{itinerary.title}</h2>
                <p className="text-gray-600 mt-1">
                  {itinerary.destination} · {itinerary.days?.length || 0}天
                  {itinerary.travelers && ` · ${itinerary.travelers}人`}
                  {itinerary.budget && ` · ¥${itinerary.budget}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="btn btn-secondary"
                >
                  删除行程
                </button>
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
            <ItineraryView 
              itinerary={itinerary}
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
      </main>
    </div>
  );
};

export default ItineraryDetail;

