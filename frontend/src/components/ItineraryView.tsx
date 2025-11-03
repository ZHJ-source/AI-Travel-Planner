import React from 'react';
import { Itinerary, Event } from '../types';

interface ItineraryViewProps {
  itinerary: Itinerary;
  selectedDay?: number;
  onEventClick?: (event: Event) => void;
  onLocationClick?: (lat: number, lng: number) => void;
}

const ItineraryView: React.FC<ItineraryViewProps> = ({ 
  itinerary, 
  selectedDay,
  onEventClick,
  onLocationClick 
}) => {
  if (!itinerary) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500">暂无行程数据</p>
      </div>
    );
  }

  // 如果指定了selectedDay，只显示该天的行程
  const daysToShow = selectedDay 
    ? itinerary.days?.filter((day: any) => day.dayNumber === selectedDay) || []
    : itinerary.days || [];

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      attraction: '景点',
      restaurant: '餐厅',
      hotel: '酒店',
      transportation: '交通',
      entertainment: '娱乐',
      shopping: '购物',
    };
    return labels[type] || type;
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      attraction: 'bg-blue-100 text-blue-800',
      restaurant: 'bg-orange-100 text-orange-800',
      hotel: 'bg-purple-100 text-purple-800',
      transportation: 'bg-gray-100 text-gray-800',
      entertainment: 'bg-pink-100 text-pink-800',
      shopping: 'bg-green-100 text-green-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* 行程头部信息 */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">{itinerary.title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">目的地：</span>
            <span className="font-medium">{itinerary.destination}</span>
          </div>
          <div>
            <span className="text-gray-500">天数：</span>
            <span className="font-medium">{itinerary.days?.length || 0}天</span>
          </div>
          {itinerary.travelers && (
            <div>
              <span className="text-gray-500">人数：</span>
              <span className="font-medium">{itinerary.travelers}人</span>
            </div>
          )}
          {itinerary.budget && (
            <div>
              <span className="text-gray-500">预算：</span>
              <span className="font-medium">¥{itinerary.budget}</span>
            </div>
          )}
        </div>
      </div>

      {/* 交通和住宿信息 */}
      {(itinerary.transportation || itinerary.accommodation) && (
        <div className="grid md:grid-cols-2 gap-4">
          {itinerary.transportation && (
            <div className="card">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                交通
              </h3>
              <p className="text-sm text-gray-600">{itinerary.transportation.details}</p>
              <p className="text-sm font-medium mt-2">¥{itinerary.transportation.estimatedCost}</p>
            </div>
          )}
          {itinerary.accommodation && (
            <div className="card">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                住宿
              </h3>
              <p className="text-sm text-gray-600">{itinerary.accommodation.details}</p>
              <p className="text-sm font-medium mt-2">¥{itinerary.accommodation.estimatedCost}</p>
            </div>
          )}
        </div>
      )}

      {/* 每日行程 */}
      {daysToShow && daysToShow.length > 0 ? (
        daysToShow.map((day, dayIndex) => (
          <div key={dayIndex} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                D{day.dayNumber}
              </div>
              <div>
                <h3 className="font-bold text-lg">第{day.dayNumber}天</h3>
                {day.date && <p className="text-sm text-gray-500">{day.date}</p>}
              </div>
            </div>

            <div className="space-y-4">
              {day.events && day.events.length > 0 ? (
                day.events.map((event, eventIndex) => (
              <div
                key={eventIndex}
                onClick={() => {
                  console.log(`点击主事件: ${event.name}`, {
                    lat: event.latitude,
                    lng: event.longitude
                  });
                  if (onEventClick) onEventClick(event);
                  if (onLocationClick && event.latitude && event.longitude) {
                    onLocationClick(parseFloat(event.latitude), parseFloat(event.longitude));
                  }
                }}
                className="border-l-4 border-primary-500 pl-4 hover:bg-gray-50 rounded cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-3">
                  {event.startTime && (
                    <span className="text-sm font-medium text-gray-500 min-w-[60px]">
                      {event.startTime}
                    </span>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{event.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${getEventTypeColor(event.type)}`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    )}
                    {event.address && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.address}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {event.estimatedDuration && (
                        <span>⏱️ {event.estimatedDuration}分钟</span>
                      )}
                      {event.estimatedCost && (
                        <span>💰 ¥{event.estimatedCost}</span>
                      )}
                    </div>

                    {/* 附属事件 */}
                    {event.subEvents && event.subEvents.length > 0 && (
                      <div className="mt-3 ml-4 space-y-2">
                        {event.subEvents.map((subEvent, subIndex) => (
                          <div 
                            key={subIndex} 
                            className="text-sm bg-gray-50 p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={(e) => {
                              e.stopPropagation(); // 阻止冒泡到主事件
                              console.log(`点击附属事件: ${subEvent.name}`, {
                                lat: subEvent.latitude,
                                lng: subEvent.longitude
                              });
                              if (onLocationClick && subEvent.latitude && subEvent.longitude) {
                                onLocationClick(parseFloat(subEvent.latitude), parseFloat(subEvent.longitude));
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">↳</span>
                              <span className="font-medium">{subEvent.name}</span>
                              <span className={`px-2 py-0.5 text-xs rounded ${getEventTypeColor(subEvent.type)}`}>
                                {getEventTypeLabel(subEvent.type)}
                              </span>
                            </div>
                            {subEvent.description && (
                              <p className="text-xs text-gray-500 ml-5 mt-1">{subEvent.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">当天暂无活动安排</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="card text-center py-8">
          <p className="text-gray-500">暂无行程安排</p>
        </div>
      )}
    </div>
  );
};

export default ItineraryView;

