/**
 * 中国城市列表（后端版本）
 * 用于验证目的地是否为国内城市
 */

// 直辖市
const MUNICIPALITIES = [
  '北京', '上海', '天津', '重庆'
];

// 省会城市和重点城市
const MAJOR_CITIES = [
  // 华北
  '石家庄', '太原', '呼和浩特',
  
  // 东北
  '沈阳', '大连', '长春', '哈尔滨',
  
  // 华东
  '南京', '苏州', '无锡', '常州', '南通', '扬州', '镇江', '徐州',
  '杭州', '宁波', '温州', '嘉兴', '湖州', '绍兴', '金华', '台州',
  '合肥', '芜湖', '蚌埠', '黄山',
  '南昌', '九江', '景德镇', '赣州',
  '福州', '厦门', '泉州', '漳州', '莆田',
  '济南', '青岛', '烟台', '威海', '潍坊', '淄博', '济宁', '泰安',
  
  // 华中
  '郑州', '洛阳', '开封', '许昌',
  '武汉', '宜昌', '襄阳', '荆州',
  '长沙', '株洲', '湘潭', '岳阳', '常德', '张家界', '衡阳',
  
  // 华南
  '广州', '深圳', '珠海', '汕头', '佛山', '东莞', '中山', '江门', '湛江', '惠州',
  '南宁', '桂林', '柳州', '北海',
  '海口', '三亚',
  
  // 西南
  '成都', '绵阳', '乐山', '峨眉山', '九寨沟',
  '贵阳', '遵义', '安顺',
  '昆明', '大理', '丽江', '西双版纳', '香格里拉',
  '拉萨', '林芝', '日喀则',
  
  // 西北
  '西安', '咸阳', '宝鸡', '延安',
  '兰州', '敦煌', '嘉峪关',
  '西宁',
  '银川',
  '乌鲁木齐', '喀什', '伊犁', '吐鲁番',
  
  // 港澳台
  '香港', '澳门', '台北', '高雄'
];

// 合并所有城市
export const CHINA_CITIES = [...MUNICIPALITIES, ...MAJOR_CITIES];

// 城市别名映射（处理常见的简称和全称）
export const CITY_ALIASES: Record<string, string> = {
  '北京市': '北京',
  '上海市': '上海',
  '天津市': '天津',
  '重庆市': '重庆',
  '帝都': '北京',
  '魔都': '上海',
  '杭州市': '杭州',
  '西湖': '杭州',
  '成都市': '成都',
  '广州市': '广州',
  '深圳市': '深圳',
  '鹏城': '深圳',
  '羊城': '广州',
  '春城': '昆明',
  '泉城': '济南',
  '蓉城': '成都',
  '江城': '武汉',
  '冰城': '哈尔滨',
  '星城': '长沙',
  '古城': '西安',
  '石头城': '南京',
  '金陵': '南京',
};

/**
 * 验证是否为国内城市
 */
export function isChineseCity(city: string): boolean {
  if (!city || typeof city !== 'string') {
    return false;
  }
  
  const trimmedCity = city.trim();
  
  // 检查是否在城市列表中
  if (CHINA_CITIES.includes(trimmedCity)) {
    return true;
  }
  
  // 检查别名
  if (CITY_ALIASES[trimmedCity]) {
    return true;
  }
  
  // 模糊匹配（去掉"市"、"省"等后缀）
  const cityWithoutSuffix = trimmedCity.replace(/[市省自治区特别行政区]+$/, '');
  if (CHINA_CITIES.includes(cityWithoutSuffix)) {
    return true;
  }
  
  // 检查是否包含在某个城市名中
  return CHINA_CITIES.some(c => c.includes(cityWithoutSuffix) || cityWithoutSuffix.includes(c));
}

/**
 * 标准化城市名称
 */
export function normalizeCityName(city: string): string {
  if (!city) return '';
  
  const trimmedCity = city.trim();
  
  // 检查别名
  if (CITY_ALIASES[trimmedCity]) {
    return CITY_ALIASES[trimmedCity];
  }
  
  // 去掉常见后缀
  const normalized = trimmedCity.replace(/[市省自治区特别行政区]+$/, '');
  
  // 检查是否在城市列表中
  const matchedCity = CHINA_CITIES.find(c => c === normalized || c.includes(normalized));
  
  return matchedCity || normalized;
}

