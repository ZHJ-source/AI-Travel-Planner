import React, { useEffect, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { Marker } from '../types';

interface RouteInfo {
  distance: number;
  duration: number;
  strategy: string;
  path: Array<{ lng: number; lat: number }>;
}

interface MapContainerProps {
  markers?: Marker[];
  center?: { lng: number; lat: number };
  zoom?: number;
  onMarkerClick?: (marker: Marker) => void;
  className?: string;
  focusLocation?: { lat: number; lng: number } | null;
  routes?: RouteInfo[];
  showSimplePath?: boolean; // 是否显示简单路径（仅连线）
}

const MapContainer: React.FC<MapContainerProps> = ({
  markers = [],
  center = { lng: 116.397428, lat: 39.90923 }, // 默认北京
  zoom = 11,
  onMarkerClick,
  className = 'w-full h-full',
  focusLocation,
  routes = [],
  showSimplePath = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<any[]>([]);
  const previousMarkersCount = useRef<number>(0); // 记录上一次的标记数量

  // 初始化地图
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let mounted = true;
    let cancelled = false;

    const initMap = async () => {
      if (cancelled) {
        console.log('MapContainer: 初始化已取消（cleanup）');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // 从localStorage或环境变量获取API Key
        let apiKey = import.meta.env.VITE_AMAP_JS_API_KEY;
        try {
          const savedKeys = localStorage.getItem('apiKeys');
          if (savedKeys) {
            const parsed = JSON.parse(savedKeys);
            if (parsed.amapJsApiKey) {
              apiKey = parsed.amapJsApiKey;
              console.log('MapContainer: 使用localStorage中的API Key');
            }
          }
        } catch (error) {
          console.error('Failed to parse saved API keys:', error);
        }
        
        console.log('MapContainer: Initializing map with API key:', apiKey ? '已配置' : '未配置');
        
        if (!apiKey) {
          throw new Error('高德地图 JS API Key 未配置，请在设置页面配置或在 .env 文件中设置 VITE_AMAP_JS_API_KEY');
        }
        
        if (cancelled) {
          console.log('MapContainer: 加载前检测到取消');
          return;
        }

        // 设置超时
        timeoutId = setTimeout(() => {
          console.warn('MapContainer: 加载超时！10秒内未完成');
          if (mounted && loading) {
            setError('地图加载超时（10秒），请检查网络连接或 API Key 是否有效');
            setLoading(false);
          }
        }, 10000);

        console.log('MapContainer: Loading AMap SDK...');
        console.log('MapContainer: 开始加载时间:', new Date().toLocaleTimeString());
        
        const AMap = await AMapLoader.load({
          key: apiKey,
          version: '2.0',
          plugins: ['AMap.Marker', 'AMap.Polyline'],
        });
        
        console.log('MapContainer: 加载完成时间:', new Date().toLocaleTimeString());
        clearTimeout(timeoutId);

        if (cancelled) {
          console.log('MapContainer: 加载完成后检测到取消');
          return;
        }

        console.log('MapContainer: 检查状态 - mounted:', mounted, 'cancelled:', cancelled, 'mapRef.current:', !!mapRef.current);

        if (!mounted) {
          console.warn('MapContainer: 组件已卸载，取消创建地图');
          return;
        }

        console.log('MapContainer: AMap SDK loaded successfully');

        if (mapRef.current) {
          console.log('MapContainer: Creating map instance...');
          const mapInstance = new AMap.Map(mapRef.current, {
            zoom,
            center: [center.lng, center.lat],
            viewMode: '3D',
          });

          setMap(mapInstance);
          setLoading(false);
          console.log('MapContainer: Map initialized successfully');
        } else {
          console.error('MapContainer: mapRef.current 为空，无法创建地图实例！');
          setError('地图容器未就绪');
          setLoading(false);
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('MapContainer: Failed to load map:', error);
        
        let errorMessage = '地图加载失败';
        if (error.message) {
          errorMessage = error.message;
        } else if (error.info === 'INVALID_USER_KEY') {
          errorMessage = '高德地图 API Key 无效，请检查配置';
        }
        
        if (mounted) {
          setError(errorMessage);
          setLoading(false);
        }
      }
    };

    initMap();

    return () => {
      console.log('MapContainer: cleanup 函数执行');
      mounted = false;
      cancelled = true;
      clearTimeout(timeoutId);
      if (map) {
        try {
          console.log('MapContainer: 销毁地图实例');
          map.destroy();
        } catch (e) {
          console.error('Failed to destroy map:', e);
        }
      }
    };
  }, []);

  // 更新标记
  useEffect(() => {
    if (!map) return;

    console.log('MapContainer: 更新标记，收到', markers.length, '个标记');

    // 清除旧标记
    markersRef.current.forEach((marker) => {
      map.remove(marker);
    });
    markersRef.current = [];

    // 过滤有效标记（验证坐标）
    const validMarkers = markers.filter((marker) => {
      const lat = marker.position.lat;
      const lng = marker.position.lng;
      const isValid = !isNaN(lat) && !isNaN(lng) && 
                      lat >= -90 && lat <= 90 && 
                      lng >= -180 && lng <= 180;
      
      if (!isValid) {
        console.warn('MapContainer: 无效标记坐标', marker.title, { lat, lng });
      }
      return isValid;
    });

    console.log('MapContainer: 有效标记数量', validMarkers.length);
    console.log('MapContainer: 有效标记详情:', validMarkers.map(m => ({
      title: m.title,
      lat: m.position.lat,
      lng: m.position.lng
    })));

    // 添加新标记
    validMarkers.forEach((marker, index) => {
      try {
        const aMapMarker = new (window as any).AMap.Marker({
          position: [marker.position.lng, marker.position.lat],
          title: marker.title,
          label: {
            content: `<div style="background: white; padding: 4px 8px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); font-size: 12px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${marker.title}</div>`,
            offset: new (window as any).AMap.Pixel(0, -30),
          },
        });

        aMapMarker.on('click', () => {
          if (onMarkerClick) {
            onMarkerClick(marker);
          }
        });

        map.add(aMapMarker);
        markersRef.current.push(aMapMarker);
      } catch (error) {
        console.error('MapContainer: 添加标记失败', marker.title, error);
      }
    });

    // 如果有路线规划数据，绘制详细路线
    if (routes && routes.length > 0) {
      try {
        console.log('MapContainer: 绘制详细路线', routes.length);
        routes.forEach((route, index) => {
          if (route.path && route.path.length > 0) {
            const path = route.path.map((p) => [p.lng, p.lat]);
            const polyline = new (window as any).AMap.Polyline({
              path,
              strokeColor: '#3b82f6',
              strokeWeight: 5,
              strokeOpacity: 0.9,
              showDir: true,
            });
            map.add(polyline);
            markersRef.current.push(polyline);
            
            // 添加路线信息标签（在路线中点）
            if (path.length > 0) {
              const midPoint = path[Math.floor(path.length / 2)];
              const infoText = `${(route.distance / 1000).toFixed(1)}km · ${Math.round(route.duration / 60)}分钟`;
              const text = new (window as any).AMap.Text({
                text: infoText,
                position: midPoint,
                style: {
                  'background-color': 'rgba(59, 130, 246, 0.9)',
                  'border': 'none',
                  'color': 'white',
                  'font-size': '12px',
                  'padding': '4px 8px',
                  'border-radius': '4px',
                },
              });
              map.add(text);
              markersRef.current.push(text);
            }
          }
        });
      } catch (error) {
        console.error('MapContainer: 绘制详细路线失败', error);
      }
    } else if (showSimplePath && validMarkers.length > 1) {
      // 如果没有详细路线但有多个标记，绘制简单路线
      try {
        const path = validMarkers.map((m) => [m.position.lng, m.position.lat]);
        const polyline = new (window as any).AMap.Polyline({
          path,
          strokeColor: '#3b82f6',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        });
        map.add(polyline);
        markersRef.current.push(polyline);
      } catch (error) {
        console.error('MapContainer: 绘制简单路线失败', error);
      }
    }

    // 自动调整视野（仅当标记数量变化时，说明切换了天数）
    const shouldAutoFit = validMarkers.length > 0 && validMarkers.length !== previousMarkersCount.current;
    
    if (shouldAutoFit) {
      console.log(`MapContainer: 标记数量变化 ${previousMarkersCount.current} → ${validMarkers.length}，自动调整视野`);
      previousMarkersCount.current = validMarkers.length;
      
      // 延迟执行，避免与聚焦冲突
      setTimeout(() => {
        try {
          if (validMarkers.length === 1) {
            // 只有一个标记，直接设置中心点
            const marker = validMarkers[0];
            map.setZoomAndCenter(14, [marker.position.lng, marker.position.lat]);
            console.log('MapContainer: 单个标记，设置中心点');
          } else {
            // 多个标记，使用 setFitView 自动调整
            map.setFitView(null, false, [100, 100, 100, 100]);
            console.log('MapContainer: 多个标记，自动调整视野');
          }
        } catch (error) {
          console.error('MapContainer: 调整视野失败', error);
        }
      }, 100);
    } else if (validMarkers.length > 0) {
      console.log('MapContainer: 标记数量未变化，保持当前视野');
    }
  }, [map, markers, onMarkerClick, routes, showSimplePath]);

  // 注意：不再自动更新 center，避免干扰用户的缩放和聚焦操作
  // center 只在地图初始化时使用

  // 聚焦到指定位置
  useEffect(() => {
    if (map && focusLocation) {
      console.log('MapContainer: 聚焦到位置', focusLocation);
      try {
        // 使用平滑动画移动到目标位置
        map.setZoomAndCenter(16, [focusLocation.lng, focusLocation.lat], false, 500);
        console.log('MapContainer: 地图移动命令已执行');
      } catch (error) {
        console.error('MapContainer: 聚焦失败', error);
        // 备用方案：不使用动画直接跳转
        try {
          map.setCenter([focusLocation.lng, focusLocation.lat]);
          map.setZoom(16);
        } catch (e) {
          console.error('MapContainer: 备用聚焦方案也失败', e);
        }
      }
    }
  }, [map, focusLocation]);

  return (
    <div ref={mapRef} className={`${className} relative`}>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center p-6 max-w-md">
            <p className="text-red-600 font-semibold mb-2">😕 地图加载失败</p>
            <p className="text-sm text-gray-600 mb-3">{error}</p>
            
            {(error.includes('API Key') || error.includes('未配置')) && (
              <div className="text-left bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
                <p className="font-semibold mb-2">📝 配置方法（两种方式任选其一）：</p>
                <div className="mb-2">
                  <p className="font-semibold text-blue-600">方式一：通过设置页面（推荐）</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-2">
                    <li>点击导航栏的"设置"按钮</li>
                    <li>在"地图服务配置"中填入高德地图 JavaScript API Key</li>
                    <li>保存并刷新页面</li>
                  </ol>
                </div>
                <div>
                  <p className="font-semibold text-green-600">方式二：通过环境变量</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-2">
                    <li>访问 <a href="https://console.amap.com/dev/key/app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">高德开放平台</a></li>
                    <li>申请 Web 端（JS API）Key</li>
                    <li>在项目 frontend 目录创建 .env 文件</li>
                    <li>添加：VITE_AMAP_JS_API_KEY=你的key</li>
                    <li>重启开发服务器</li>
                  </ol>
                </div>
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              重试
            </button>
          </div>
        </div>
      )}
      
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 mb-3">加载地图中...</p>
            <button
              onClick={() => {
                console.log('手动触发重新加载...');
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              加载太久？点击刷新
            </button>
            <div className="mt-2 text-xs text-gray-500">
              提示：打开控制台（F12）查看详细日志
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer;

