import React from 'react';
import { Itinerary } from '../types';

interface CostAnalysisProps {
  itinerary: Itinerary;
}

const CostAnalysis: React.FC<CostAnalysisProps> = ({ itinerary }) => {
  // 计算各项费用
  const calculateCosts = () => {
    let totalEventCost = 0;
    let attractionCost = 0;
    let restaurantCost = 0;
    let hotelCost = 0;
    let transportationCost = 0;
    let entertainmentCost = 0;
    let shoppingCost = 0;

    itinerary.days?.forEach(day => {
      day.events?.forEach(event => {
        const cost = event.estimatedCost || 0;
        totalEventCost += cost;

        switch (event.type) {
          case 'attraction':
            attractionCost += cost;
            break;
          case 'restaurant':
            restaurantCost += cost;
            break;
          case 'hotel':
            hotelCost += cost;
            break;
          case 'transportation':
            transportationCost += cost;
            break;
          case 'entertainment':
            entertainmentCost += cost;
            break;
          case 'shopping':
            shoppingCost += cost;
            break;
        }
      });
    });

    // 大交通和住宿费用
    const majorTransportation = itinerary.transportation?.estimatedCost || 0;
    const accommodation = itinerary.accommodation?.estimatedCost || 0;

    const totalCost = totalEventCost + majorTransportation + accommodation;

    return {
      totalCost,
      majorTransportation,
      accommodation,
      attractionCost,
      restaurantCost,
      hotelCost,
      transportationCost,
      entertainmentCost,
      shoppingCost,
      totalEventCost,
    };
  };

  const costs = calculateCosts();
  const budget = itinerary.budget || 0;
  const budgetRemaining = budget - costs.totalCost;
  const budgetUsagePercent = budget > 0 ? (costs.totalCost / budget) * 100 : 0;

  const costItems = [
    { label: '大交通', value: costs.majorTransportation, icon: '✈️', color: 'blue' },
    { label: '住宿', value: costs.accommodation, icon: '🏨', color: 'purple' },
    { label: '景点门票', value: costs.attractionCost, icon: '🎫', color: 'green' },
    { label: '餐饮', value: costs.restaurantCost, icon: '🍴', color: 'orange' },
    { label: '交通', value: costs.transportationCost, icon: '🚌', color: 'gray' },
    { label: '娱乐', value: costs.entertainmentCost, icon: '🎪', color: 'pink' },
    { label: '购物', value: costs.shoppingCost, icon: '🛍️', color: 'yellow' },
  ].filter(item => item.value > 0);

  const getBudgetStatusColor = () => {
    if (budgetUsagePercent > 100) return 'text-red-600';
    if (budgetUsagePercent > 80) return 'text-orange-600';
    return 'text-green-600';
  };

  const getBudgetBarColor = () => {
    if (budgetUsagePercent > 100) return 'bg-red-500';
    if (budgetUsagePercent > 80) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        开销分析
      </h3>

      {/* 总费用和预算 */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <div>
            <span className="text-3xl font-bold text-gray-900">¥{costs.totalCost.toLocaleString()}</span>
            <span className="text-sm text-gray-500 ml-2">预计总费用</span>
          </div>
          {budget > 0 && (
            <div className={`text-right ${getBudgetStatusColor()}`}>
              <div className="text-lg font-semibold">
                {budgetRemaining >= 0 ? '剩余' : '超出'} ¥{Math.abs(budgetRemaining).toLocaleString()}
              </div>
              <div className="text-sm">预算: ¥{budget.toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* 预算使用进度条 */}
        {budget > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>预算使用率</span>
              <span className={getBudgetStatusColor()}>{budgetUsagePercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${getBudgetBarColor()} transition-all duration-500`}
                style={{ width: `${Math.min(budgetUsagePercent, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* 费用明细 */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-700 mb-3">费用明细</h4>
        {costItems.map((item, index) => {
          const percentage = costs.totalCost > 0 ? (item.value / costs.totalCost) * 100 : 0;
          
          return (
            <div key={index} className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 rounded">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">¥{item.value.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full bg-${item.color}-500`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 人均费用 */}
      {itinerary.travelers && itinerary.travelers > 1 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium text-gray-700">人均费用</span>
              <span className="text-sm text-gray-500">({itinerary.travelers}人)</span>
            </div>
            <span className="text-xl font-bold text-blue-600">
              ¥{(costs.totalCost / itinerary.travelers).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}

      {/* 费用建议 */}
      {budget > 0 && budgetUsagePercent > 90 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">预算提醒</p>
              {budgetUsagePercent > 100 ? (
                <p>您的预计花费已超出预算 ¥{Math.abs(budgetRemaining).toLocaleString()}，建议调整行程或增加预算。</p>
              ) : (
                <p>您的预算即将用完，剩余 ¥{budgetRemaining.toLocaleString()}，请注意控制开支。</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostAnalysis;

