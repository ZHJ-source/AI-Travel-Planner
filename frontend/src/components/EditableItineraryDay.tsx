import React, { useState } from 'react';
import { Event, EventType } from '../types';
import { POI } from '../services/location';

interface EditableItineraryDayProps {
  dayNumber: number;
  date?: string;
  events: Event[];
  onEventsChange: (events: Event[]) => void;
  onEventClick?: (event: Event) => void;
  onLocationClick?: (lat: number, lng: number) => void;
  onAddFromMap?: (dayNumber: number) => void;
}

const EditableItineraryDay: React.FC<EditableItineraryDayProps> = ({
  dayNumber,
  date,
  events,
  onEventsChange,
  onEventClick,
  onLocationClick,
  onAddFromMap,
}) => {
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    type: 'attraction',
    name: '',
    description: '',
    estimatedDuration: 60,
    estimatedCost: 0,
    isMainEvent: true,
  });

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

  const handleAddEvent = () => {
    if (!newEvent.name?.trim()) {
      alert('请输入活动名称');
      return;
    }

    const eventToAdd: Event = {
      eventOrder: events.length + 1,
      type: newEvent.type as EventType,
      name: newEvent.name,
      description: newEvent.description,
      startTime: newEvent.startTime,
      estimatedDuration: newEvent.estimatedDuration,
      estimatedCost: newEvent.estimatedCost,
      address: newEvent.address,
      latitude: newEvent.latitude,
      longitude: newEvent.longitude,
      isMainEvent: true,
    };

    onEventsChange([...events, eventToAdd]);
    setIsAddingEvent(false);
    setNewEvent({
      type: 'attraction',
      name: '',
      description: '',
      estimatedDuration: 60,
      estimatedCost: 0,
      isMainEvent: true,
    });
  };

  const handleDeleteEvent = (index: number) => {
    if (confirm('确定要删除这个活动吗？')) {
      const updatedEvents = events.filter((_, i) => i !== index);
      // 重新排序
      updatedEvents.forEach((event, i) => {
        event.eventOrder = i + 1;
      });
      onEventsChange(updatedEvents);
    }
  };

  const handleEditEvent = (index: number, updatedEvent: Event) => {
    const updatedEvents = [...events];
    updatedEvents[index] = updatedEvent;
    onEventsChange(updatedEvents);
    setEditingEventIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updatedEvents = [...events];
    [updatedEvents[index - 1], updatedEvents[index]] = [updatedEvents[index], updatedEvents[index - 1]];
    // 更新顺序
    updatedEvents.forEach((event, i) => {
      event.eventOrder = i + 1;
    });
    onEventsChange(updatedEvents);
  };

  const handleMoveDown = (index: number) => {
    if (index === events.length - 1) return;
    const updatedEvents = [...events];
    [updatedEvents[index], updatedEvents[index + 1]] = [updatedEvents[index + 1], updatedEvents[index]];
    // 更新顺序
    updatedEvents.forEach((event, i) => {
      event.eventOrder = i + 1;
    });
    onEventsChange(updatedEvents);
  };

  const addEventFromPOI = (poi: POI) => {
    const [lng, lat] = poi.location.split(',').map(parseFloat);
    const eventToAdd: Event = {
      eventOrder: events.length + 1,
      type: 'attraction',
      name: poi.name,
      address: poi.address,
      latitude: lat,
      longitude: lng,
      poiId: poi.id,
      isMainEvent: true,
    };
    onEventsChange([...events, eventToAdd]);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
            D{dayNumber}
          </div>
          <div>
            <h3 className="font-bold text-lg">第{dayNumber}天</h3>
            {date && <p className="text-sm text-gray-500">{date}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddingEvent(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 添加活动
          </button>
          {onAddFromMap && (
            <button
              onClick={() => onAddFromMap(dayNumber)}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              📍 从地图选择
            </button>
          )}
        </div>
      </div>

      {/* 活动列表 */}
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="border-l-4 border-primary-500 pl-4 bg-gray-50 rounded p-3">
            {editingEventIndex === index ? (
              <EventEditor
                event={event}
                onSave={(updated) => handleEditEvent(index, updated)}
                onCancel={() => setEditingEventIndex(null)}
              />
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      if (onEventClick) onEventClick(event);
                      if (onLocationClick && event.latitude && event.longitude) {
                        onLocationClick(event.latitude, event.longitude);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {event.startTime && (
                        <span className="text-sm font-medium text-gray-500">{event.startTime}</span>
                      )}
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
                      {event.estimatedDuration && <span>⏱️ {event.estimatedDuration}分钟</span>}
                      {event.estimatedCost && <span>💰 ¥{event.estimatedCost}</span>}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-1 ml-2">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="上移"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === events.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="下移"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditingEventIndex(index)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="编辑"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(index)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded"
                      title="删除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {events.length === 0 && !isAddingEvent && (
          <p className="text-gray-500 text-sm text-center py-8">当天暂无活动安排，点击"添加活动"开始规划</p>
        )}
      </div>

      {/* 添加活动表单 */}
      {isAddingEvent && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold mb-3">添加新活动</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">活动类型</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="attraction">景点</option>
                <option value="restaurant">餐厅</option>
                <option value="hotel">酒店</option>
                <option value="transportation">交通</option>
                <option value="entertainment">娱乐</option>
                <option value="shopping">购物</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">活动名称 *</label>
              <input
                type="text"
                value={newEvent.name || ''}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="例如：故宫博物院"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">描述</label>
              <textarea
                value={newEvent.description || ''}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                placeholder="简要描述这个活动..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">开始时间</label>
                <input
                  type="time"
                  value={newEvent.startTime || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">时长（分钟）</label>
                <input
                  type="number"
                  value={newEvent.estimatedDuration || 60}
                  onChange={(e) => setNewEvent({ ...newEvent, estimatedDuration: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">预计费用（元）</label>
              <input
                type="number"
                value={newEvent.estimatedCost || 0}
                onChange={(e) => setNewEvent({ ...newEvent, estimatedCost: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddEvent}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                确认添加
              </button>
              <button
                onClick={() => {
                  setIsAddingEvent(false);
                  setNewEvent({
                    type: 'attraction',
                    name: '',
                    description: '',
                    estimatedDuration: 60,
                    estimatedCost: 0,
                    isMainEvent: true,
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 事件编辑器组件
const EventEditor: React.FC<{
  event: Event;
  onSave: (event: Event) => void;
  onCancel: () => void;
}> = ({ event, onSave, onCancel }) => {
  const [editedEvent, setEditedEvent] = useState<Event>({ ...event });

  return (
    <div className="space-y-3 bg-white p-3 rounded">
      <div>
        <label className="block text-sm font-medium mb-1">活动名称</label>
        <input
          type="text"
          value={editedEvent.name}
          onChange={(e) => setEditedEvent({ ...editedEvent, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">描述</label>
        <textarea
          value={editedEvent.description || ''}
          onChange={(e) => setEditedEvent({ ...editedEvent, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          rows={2}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">开始时间</label>
          <input
            type="time"
            value={editedEvent.startTime || ''}
            onChange={(e) => setEditedEvent({ ...editedEvent, startTime: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">时长（分钟）</label>
          <input
            type="number"
            value={editedEvent.estimatedDuration || 0}
            onChange={(e) => setEditedEvent({ ...editedEvent, estimatedDuration: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">预计费用（元）</label>
        <input
          type="number"
          value={editedEvent.estimatedCost || 0}
          onChange={(e) => setEditedEvent({ ...editedEvent, estimatedCost: parseFloat(e.target.value) })}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(editedEvent)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          保存
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          取消
        </button>
      </div>
    </div>
  );
};

export default EditableItineraryDay;

