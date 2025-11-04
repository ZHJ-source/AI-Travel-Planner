import React, { useState } from 'react';
import { searchLocation, POI } from '../services/location';

interface MapSearchProps {
  city: string;
  onSelectPlace: (poi: POI) => void;
  className?: string;
}

const MapSearch: React.FC<MapSearchProps> = ({ city, onSelectPlace, className = '' }) => {
  const [keywords, setKeywords] = useState('');
  const [searchResults, setSearchResults] = useState<POI[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async () => {
    if (!keywords.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchLocation(keywords, city);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
      alert('搜索失败，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectPOI = (poi: POI) => {
    onSelectPlace(poi);
    setShowResults(false);
    setKeywords('');
    setSearchResults([]);
  };

  return (
    <div className={`relative ${className}`}>
      {/* 搜索框 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`在${city}搜索地点...`}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !keywords.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>搜索中...</span>
            </div>
          ) : (
            '搜索'
          )}
        </button>
      </div>

      {/* 搜索结果 */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {searchResults.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {searchResults.map((poi) => (
                <div
                  key={poi.id}
                  onClick={() => handleSelectPOI(poi)}
                  className="p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{poi.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{poi.address}</p>
                      {poi.tel && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {poi.tel}
                          </span>
                        </p>
                      )}
                      {poi.distance && (
                        <p className="text-xs text-blue-600 mt-1">距离: {poi.distance}米</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>未找到相关地点</p>
              <p className="text-sm mt-1">尝试使用不同的关键词</p>
            </div>
          )}
          
          {/* 关闭按钮 */}
          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowResults(false)}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSearch;

