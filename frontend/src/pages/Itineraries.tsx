import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItineraryStore } from '../stores/itineraryStore';
import LoadingSpinner from '../components/LoadingSpinner';

const Itineraries: React.FC = () => {
  const navigate = useNavigate();
  const { itineraries, isLoading, fetchItineraries, deleteItinerary } = useItineraryStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItineraries = async () => {
      try {
        console.log('Fetching itineraries...');
        await fetchItineraries();
      } catch (err: any) {
        console.error('Failed to fetch itineraries:', err);
        setError(err.message || '加载行程失败');
      }
    };
    
    loadItineraries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 当行程数据更新后，输出调试信息
  useEffect(() => {
    if (itineraries.length > 0) {
      console.log('✅ Itineraries loaded:', itineraries.length);
      console.log('📊 First itinerary sample:', {
        id: itineraries[0].id,
        title: itineraries[0].title,
        destination: itineraries[0].destination,
        daysType: typeof itineraries[0].days,
        daysValue: itineraries[0].days,
        daysIsArray: Array.isArray(itineraries[0].days),
      });
    }
  }, [itineraries]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个行程吗？')) return;
    
    setDeletingId(id);
    try {
      await deleteItinerary(id);
    } catch (error) {
      alert('删除失败，请稍后重试');
    } finally {
      setDeletingId(null);
    }
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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">我的行程</h2>
          <button
            onClick={() => navigate('/planning')}
            className="btn btn-primary"
          >
            创建新行程
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">加载失败</p>
            <p className="text-sm">{error}</p>
            <p className="text-sm mt-2">请确认您已登录。如果问题持续，请刷新页面重试。</p>
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner message="加载行程中..." />
        ) : itineraries.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-24 w-24 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">还没有行程</h3>
            <p className="mt-2 text-sm text-gray-500">创建您的第一个旅行计划吧！</p>
            <button
              onClick={() => navigate('/planning')}
              className="mt-6 btn btn-primary"
            >
              开始规划
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {itineraries.map((itinerary: any) => (
              <div key={itinerary.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{itinerary.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    itinerary.status === 'completed' ? 'bg-green-100 text-green-800' :
                    itinerary.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {itinerary.status === 'completed' ? '已完成' :
                     itinerary.status === 'confirmed' ? '已确认' : '草稿'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {itinerary.destination}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {Array.isArray(itinerary.days) ? itinerary.days.length : itinerary.days || 0}天
                  </div>
                  {itinerary.budget && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ¥{itinerary.budget}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/itinerary/${itinerary.id}`)}
                    className="flex-1 btn btn-primary"
                  >
                    查看详情
                  </button>
                  <button
                    onClick={() => handleDelete(itinerary.id)}
                    disabled={deletingId === itinerary.id}
                    className="btn btn-secondary disabled:opacity-50"
                  >
                    {deletingId === itinerary.id ? '删除中...' : '删除'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Itineraries;

