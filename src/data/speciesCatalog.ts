import type { LegendItem, SpeciesId } from '../types/map';

export interface SpeciesProfile {
  id: SpeciesId;
  name: string;
  shortName: string;
  englishName: string;
  scientificName: string;
  emoji: string;
  accentColor: string;
  inatTaxonIds: string;
  inatColor: string;
  peakMonths: number[]; // 1..12
  seasonSummary: string;
  elevSummary: string;
  // Default ecological model parameters
  defaults: {
    minElevFt: number;
    maxElevFt: number;
    minCanopyPct: number;
    useCanopy: boolean;
    burnScarOnly: boolean;
    minScoreThreshold: number;
  };
  weights: {
    canopy: number;
    moisture: number;
    aspect: number;
    elevation: number;
    slope: number;
    moistureMode: 'concave' | 'balanced' | 'well-drained';
    aspectPref: 'north' | 'neutral' | 'warm';
    idealSlopeMax: number;
  };
  // 5-tier RGBA color ramp [low -> prime]
  palette: Array<[number, number, number, number]>;
  legends: LegendItem[];
  // Overlays auto-enabled when switching to this species
  presetOverlays: string[];
  // Guide content for the popup modal
  guide: {
    tagline: string;
    seasonDetail: string;
    habitat: string;
    mapTips: string;
    idTraits: string;
    safetyWarning: string;
  };
}

export const SPECIES_CATALOG: SpeciesProfile[] = [
  {
    id: 'yellowfoot',
    name: '冬鸡油菌 / 黄足鸡油菌',
    shortName: '冬鸡油菌',
    englishName: 'Winter Chanterelle / Yellowfoot',
    scientificName: 'Craterellus tubaeformis',
    emoji: '🍄',
    accentColor: '#facc15',
    inatTaxonIds: '350511',
    inatColor: '#ec4899',
    peakMonths: [10, 11, 12, 1],
    seasonSummary: '10 月 – 次年 1 月',
    elevSummary: '150 – 3,000 ft',
    defaults: {
      minElevFt: 150,
      maxElevFt: 3000,
      minCanopyPct: 55,
      useCanopy: true,
      burnScarOnly: false,
      minScoreThreshold: 63,
    },
    weights: {
      canopy: 0.3,
      moisture: 0.32,
      aspect: 0.16,
      elevation: 0.12,
      slope: 0.1,
      moistureMode: 'concave',
      aspectPref: 'north',
      idealSlopeMax: 24,
    },
    palette: [
      [94, 234, 212, 105],
      [20, 184, 166, 150],
      [234, 179, 8, 192],
      [250, 204, 21, 224],
      [255, 140, 0, 242],
    ],
    legends: [
      { label: '低', color: '#5eead4' },
      { label: '中低', color: '#14b8a6' },
      { label: '中等', color: '#eab308' },
      { label: '中高', color: '#facc15' },
      { label: '极高 · 沟谷', color: '#ff8c00' },
    ],
    presetOverlays: ['usfs-second-growth', 'usfs-trails'],
    guide: {
      tagline: 'PNW 深秋与初冬的绝对主角，常在厚苔藓腐木上成片群生。',
      seasonDetail: '10 月中旬从喀斯喀特中低海拔启动，11–1 月海岸山脉与低地（0–2,500 ft）持续盛产，怕重霜但耐冷雨。',
      habitat: '西部铁杉（Western Hemlock）与成熟花旗松林下，尤其钟爱腐烂的针叶倒木、厚绿苔藓地与湿润溪沟台地。',
      mapTips: '重点看琥珀金/亮黄色的凹坡沟谷 + 蓝色 USGS 溪流沿岸，用「合法林地」锁定国家/州立森林。',
      idTraits: '褐黄色漏斗状薄菌盖、空心鲜黄菌柄、菌盖下为钝皱褶而非真刀片菌褶。',
      safetyWarning: '警惕同生在腐木上的剧毒纹缘盔孢伞（Galerina marginata，真刀片菌褶、深棕孢子印、有菌环残迹）与绿黄色的 Leotia lubrica。',
    },
  },
  {
    id: 'hedgehog',
    name: '刺猬菌',
    shortName: '刺猬菌',
    englishName: 'Sweet Tooth / Hedgehog',
    scientificName: 'Hydnum oregonense / umbilicatum',
    emoji: '🦔',
    accentColor: '#fb923c',
    inatTaxonIds: '48422',
    inatColor: '#f97316',
    peakMonths: [10, 11, 12, 1],
    seasonSummary: '10 月 – 次年 1 月',
    elevSummary: '200 – 3,200 ft',
    defaults: {
      minElevFt: 200,
      maxElevFt: 3200,
      minCanopyPct: 58,
      useCanopy: true,
      burnScarOnly: false,
      minScoreThreshold: 64,
    },
    weights: {
      canopy: 0.34,
      moisture: 0.22,
      aspect: 0.18,
      elevation: 0.14,
      slope: 0.12,
      moistureMode: 'balanced',
      aspectPref: 'north',
      idealSlopeMax: 22,
    },
    palette: [
      [254, 215, 170, 105],
      [253, 186, 116, 150],
      [251, 146, 60, 192],
      [249, 115, 22, 224],
      [234, 88, 12, 242],
    ],
    legends: [
      { label: '低', color: '#fed7aa' },
      { label: '中低', color: '#fdba74' },
      { label: '中等', color: '#fb923c' },
      { label: '中高', color: '#f97316' },
      { label: '极高', color: '#ea580c' },
    ],
    presetOverlays: ['usfs-second-growth', 'usfs-trails'],
    guide: {
      tagline: '越冷越精神的深秋/冬季美味菌，菌盖下长满小刺，几乎无致命混淆种。',
      seasonDetail: '10 月至次年 1 月为盛产期，比黄金鸡油菌更耐低温，常与冬鸡油菌同片林子共采。',
      habitat: '湿润成熟的西部铁杉、花旗松、冷杉苔藓林地面，偏好中等至浓密树冠（≥60%）与偏北阴坡。',
      mapTips: '寻找 45–80 年次生林与成熟密林中坡度平缓、偏北湿润的苔藓坡面，对照 iNat 实拍点命中率极高。',
      idTraits: '淡橙/奶油色菌盖，菌盖背面密布易脱落的柔软小齿刺（无菌褶），菌肉脆嫩少虫蛀。',
      safetyWarning: '极安全新手入门菌；唯一需注意勿与极苦的木生齿菌（Sarcodon 等，深褐带鳞片、味苦）混淆。',
    },
  },
  {
    id: 'black-trumpet',
    name: '黑喇叭菌',
    shortName: '黑喇叭菌',
    englishName: 'Black Trumpet / Horn of Plenty',
    scientificName: 'Craterellus calicornucopioides',
    emoji: '🎺',
    accentColor: '#a78bfa',
    inatTaxonIds: '473935,48607',
    inatColor: '#a855f7',
    peakMonths: [11, 12, 1, 2],
    seasonSummary: '11 月 – 次年 2 月',
    elevSummary: '100 – 2,200 ft',
    defaults: {
      minElevFt: 100,
      maxElevFt: 2200,
      minCanopyPct: 58,
      useCanopy: true,
      burnScarOnly: false,
      minScoreThreshold: 65,
    },
    weights: {
      canopy: 0.28,
      moisture: 0.36,
      aspect: 0.16,
      elevation: 0.12,
      slope: 0.08,
      moistureMode: 'concave',
      aspectPref: 'north',
      idealSlopeMax: 20,
    },
    palette: [
      [196, 181, 253, 105],
      [167, 139, 250, 150],
      [139, 92, 246, 192],
      [124, 58, 237, 224],
      [217, 70, 239, 242],
    ],
    legends: [
      { label: '低', color: '#c4b5fd' },
      { label: '中低', color: '#a78bfa' },
      { label: '中等', color: '#8b5cf6' },
      { label: '中高', color: '#7c3aed' },
      { label: '极高 · 洼地', color: '#d946ef' },
    ],
    presetOverlays: ['usfs-trails'],
    guide: {
      tagline: '香气馥郁的高级料理菌，保护色极强，高度依赖湿润洼地与固定老点。',
      seasonDetail: '11 月冷雨透地后启动，一直持续到次年 2 月（暖冬海岸带产量最高）。',
      habitat: '低海拔湿润苔藓沟谷、溪流旁落叶层，常见于铁杉、花旗松、石栎或橡树混交林的凹陷汇水处。',
      mapTips: '此模型把「凹坡汇水湿度」权重调到最高，强烈建议同时打开「iNat 历年出菇密度热区」找往年老点。',
      idTraits: '灰黑至深褐色中空薄壁喇叭状，外壁光滑或略带灰霜，无真菌褶，有果香。',
      safetyWarning: '特征非常独特，几乎无有毒混淆种；采摘时蹲下平视地面更容易发现成群黑喇叭。',
    },
  },
  {
    id: 'oyster',
    name: '野生平菇',
    shortName: '野生平菇',
    englishName: 'Oyster Mushroom',
    scientificName: 'Pleurotus pulmonarius / ostreatus',
    emoji: '🦪',
    accentColor: '#38bdf8',
    inatTaxonIds: '48496',
    inatColor: '#0ea5e9',
    peakMonths: [10, 11, 12, 1, 2, 3, 4],
    seasonSummary: '10 月 – 次年 4 月（冷雨季）',
    elevSummary: '50 – 2,000 ft',
    defaults: {
      minElevFt: 50,
      maxElevFt: 1900,
      minCanopyPct: 40,
      useCanopy: true,
      burnScarOnly: false,
      minScoreThreshold: 64,
    },
    weights: {
      canopy: 0.2,
      moisture: 0.4,
      aspect: 0.08,
      elevation: 0.18,
      slope: 0.14,
      moistureMode: 'concave',
      aspectPref: 'neutral',
      idealSlopeMax: 14,
    },
    palette: [
      [186, 230, 253, 105],
      [125, 211, 252, 150],
      [56, 189, 248, 192],
      [14, 165, 233, 224],
      [34, 211, 238, 242],
    ],
    legends: [
      { label: '低', color: '#bae6fd' },
      { label: '中低', color: '#7dd3fc' },
      { label: '中等', color: '#38bdf8' },
      { label: '中高', color: '#0ea5e9' },
      { label: '极高 · 河谷', color: '#22d3ee' },
    ],
    presetOverlays: ['noaa-precip-7d', 'usfs-trails'],
    guide: {
      tagline: '冷雨降温后的河谷阔叶枯木“收割机”，全年雨季尤其是深秋初冬高产。',
      seasonDetail: '春秋雨季及 11–2 月温和冬雨后大量爆发，降温刺激往往在 3–5 天后引发大潮。',
      habitat: '低海拔河漫滩与溪谷沿岸倒伏或枯死的红桤木（Red Alder）、杨树（Cottonwood）与大叶枫树干上。',
      mapTips: '重点盯低海拔平缓河谷与蓝色 USGS 溪流两侧（红桤木集中带），搭配「NOAA 7 天降水」判断爆发时机。',
      idTraits: '白色至浅灰褐色扇形群生，菌褶顺延至短侧柄，白色至淡紫灰孢子印，常带淡淡茴香味。',
      safetyWarning: '务必区分针叶腐木上纯白薄脆的「天使之翼」（Pleurocybella porrigens，存在肾病中毒风险）——只采阔叶木（红桤木/杨树）上的厚肉平菇！',
    },
  },
  {
    id: 'lions-mane',
    name: '熊头猴头菇',
    shortName: '熊头猴头',
    englishName: "Bear's Head Tooth",
    scientificName: 'Hericium abietis',
    emoji: '🦁',
    accentColor: '#38bdf8',
    inatTaxonIds: '55187',
    inatColor: '#38bdf8',
    peakMonths: [9, 10, 11, 12],
    seasonSummary: '9 月 – 12 月',
    elevSummary: '200 – 3,500 ft',
    defaults: {
      minElevFt: 250,
      maxElevFt: 3500,
      minCanopyPct: 72,
      useCanopy: true,
      burnScarOnly: false,
      minScoreThreshold: 66,
    },
    weights: {
      canopy: 0.42,
      moisture: 0.24,
      aspect: 0.16,
      elevation: 0.1,
      slope: 0.08,
      moistureMode: 'concave',
      aspectPref: 'north',
      idealSlopeMax: 24,
    },
    palette: [
      [56, 189, 248, 155],
      [99, 102, 241, 190],
      [168, 85, 247, 215],
      [232, 121, 249, 232],
      [250, 204, 21, 246],
    ],
    legends: [
      { label: '低', color: '#38bdf8' },
      { label: '中低', color: '#6366f1' },
      { label: '中等', color: '#a855f7' },
      { label: '中高', color: '#e879f9' },
      { label: '极高 · 老密林', color: '#facc15' },
    ],
    presetOverlays: ['usfs-wilderness', 'usfs-trails'],
    guide: {
      tagline: '形如白色瀑布的珍稀针叶木腐菌，味道堪比海鲜干贝，专爱成熟老林倒木。',
      seasonDetail: '9 月下旬至 12 月，中高海拔入秋先出，11–12 月转至低海拔未结霜老林。',
      habitat: '高郁闭度（≥75%）老龄冷杉（True Fir）、西部铁杉、花旗松粗大倒木与朽桩上，同一根倒木往往连续多年出菇。',
      mapTips: '此模型重度加权高密树冠与阴湿沟谷；建议在图层中打开「USFS 荒野区」并避开近 50 年采伐区，专攻老林。',
      idTraits: '纯白至乳白色分枝簇状，垂挂长短一致的冰柱状软刺（齿），无毒且辨识度 100%。',
      safetyWarning: '几乎无任何有毒近似种，老熟发黄发苦的个体口感较差，优先采雪白脆嫩的子实体。',
    },
  },
  {
    id: 'chanterelle',
    name: '黄金 / 白鸡油菌',
    shortName: '黄金鸡油菌',
    englishName: 'Pacific Golden & White Chanterelle',
    scientificName: 'Cantharellus formosus / subalbidus',
    emoji: '🌟',
    accentColor: '#fbbf24',
    inatTaxonIds: '47348',
    inatColor: '#f59e0b',
    peakMonths: [9, 10, 11],
    seasonSummary: '8 月底 – 11 月',
    elevSummary: '300 – 4,200 ft',
    defaults: {
      minElevFt: 300,
      maxElevFt: 4000,
      minCanopyPct: 55,
      useCanopy: true,
      burnScarOnly: false,
      minScoreThreshold: 64,
    },
    weights: {
      canopy: 0.34,
      moisture: 0.18,
      aspect: 0.18,
      elevation: 0.14,
      slope: 0.16,
      moistureMode: 'balanced',
      aspectPref: 'north',
      idealSlopeMax: 22,
    },
    palette: [
      [254, 240, 138, 105],
      [253, 224, 71, 150],
      [250, 204, 21, 192],
      [245, 158, 11, 224],
      [234, 88, 12, 242],
    ],
    legends: [
      { label: '低', color: '#fef08a' },
      { label: '中低', color: '#fde047' },
      { label: '中等', color: '#facc15' },
      { label: '中高', color: '#f59e0b' },
      { label: '极高 · 次生林', color: '#ea580c' },
    ],
    presetOverlays: ['usfs-second-growth', 'usfs-trails', 'noaa-precip-7d'],
    guide: {
      tagline: 'PNW 人气第一的秋季王牌食用菌，最爱 40–80 年生次生花旗松苔藓林。',
      seasonDetail: '8 月底高海拔（3,500–4,500 ft）率先出菇，9–10 月全区盛产，11 月下移至 <1,500 ft 海岸与低地（白鸡油菌更耐寒）。',
      habitat: '40–80 年次生花旗松与西部铁杉林，林下苔藓多、灌木不过于密闭、排水良好的缓至中坡。',
      mapTips: '务必结合已开启的「USFS 45–80 年次生林（1946–1980 采伐再生区）」，重叠在热力高分缓坡上就是经典黄金鸡油菌林！',
      idTraits: '杏黄（或纯白）菌盖，假菌褶分叉钝圆不可剥离，菌肉雪白如鸡胸肉丝，微带杏果香。',
      safetyWarning: '注意区分假鸡油菌（Hygrophoropsis aurantiaca，薄脆分叉真菌褶、橙色软肉）及木生的毒灯笼菌（Omphalotus，PNW 罕见但需确认生于土中而非朽木）。',
    },
  },
  {
    id: 'matsutake',
    name: '美洲松茸',
    shortName: '美洲松茸',
    englishName: 'Western / Pacific Matsutake',
    scientificName: 'Tricholoma murrillianum',
    emoji: '👑',
    accentColor: '#d97706',
    inatTaxonIds: '521711,62483',
    inatColor: '#d97706',
    peakMonths: [9, 10, 11],
    seasonSummary: '9 月 – 11 月',
    elevSummary: '2,600 – 5,600 ft（火山带；海岸可调至 50–500 ft）',
    defaults: {
      minElevFt: 2600,
      maxElevFt: 5600,
      minCanopyPct: 42,
      useCanopy: true,
      burnScarOnly: false,
      minScoreThreshold: 65,
    },
    weights: {
      canopy: 0.24,
      moisture: 0.34,
      aspect: 0.1,
      elevation: 0.16,
      slope: 0.16,
      moistureMode: 'well-drained',
      aspectPref: 'neutral',
      idealSlopeMax: 20,
    },
    palette: [
      [253, 230, 138, 105],
      [251, 191, 36, 150],
      [217, 119, 6, 192],
      [180, 83, 9, 224],
      [154, 52, 18, 242],
    ],
    legends: [
      { label: '低', color: '#fde68a' },
      { label: '中低', color: '#fbbf24' },
      { label: '中等', color: '#d97706' },
      { label: '中高', color: '#b45309' },
      { label: '极高 · 强排水', color: '#9a3412' },
    ],
    presetOverlays: ['usda-ssurgo-soil', 'usfs-mvum', 'usfs-trails'],
    guide: {
      tagline: 'PNW 价值最高的野生菌王，极度挑剔贫瘠强排水的火山浮石土或海岸砂土。',
      seasonDetail: '9 月中旬至 10 月底喀斯喀特火山带（3,500–5,800 ft）为高潮；10 月底至 11 月下旬海岸沙丘带（0–500 ft）出晚季松茸。',
      habitat: '贫瘠砂土/火山灰浮石土，几乎无杂草的开阔林下；宿主为扭叶松、铁杉、红冷杉、巨冷杉或海岸岸松/石栎。',
      mapTips: '已自动开启「USDA SSURGO 土壤图层」并切换到强排水地形模型！点击地图任何位置可在底部面板直接查出该点是不是砂土/火山灰（Andic / Sandy / Excessively drained）。',
      idTraits: '极硬实白菌肉、棉质菌幕/菌环、菌柄基部常带砂土，标志性的浓郁肉桂+松脂辛香气味。',
      safetyWarning: '致命警告：务必逐朵核对气味与菌托！剧毒史密斯鹅膏（Amanita smithiana，导致肾衰竭）同生同季且外形极似，但它无松茸肉桂香、基部膨大易碎且无绵密菌环！',
    },
  },
  {
    id: 'porcini',
    name: '美味牛肝菌（春 / 秋）',
    shortName: '美味牛肝菌',
    englishName: 'King Bolete / Porcini',
    scientificName: 'Boletus edulis / rex-veris',
    emoji: '🥖',
    accentColor: '#b45309',
    inatTaxonIds: '48701,438025',
    inatColor: '#ca8a04',
    peakMonths: [5, 6, 9, 10, 11],
    seasonSummary: '春 5–6 月 / 秋 9–11 月',
    elevSummary: '0 – 5,800 ft',
    defaults: {
      minElevFt: 100,
      maxElevFt: 5600,
      minCanopyPct: 38,
      useCanopy: true,
      burnScarOnly: false,
      minScoreThreshold: 64,
    },
    weights: {
      canopy: 0.24,
      moisture: 0.18,
      aspect: 0.18,
      elevation: 0.16,
      slope: 0.24,
      moistureMode: 'balanced',
      aspectPref: 'warm',
      idealSlopeMax: 16,
    },
    palette: [
      [254, 243, 199, 105],
      [252, 211, 77, 150],
      [217, 119, 6, 192],
      [161, 98, 7, 224],
      [133, 77, 14, 242],
    ],
    legends: [
      { label: '低', color: '#fef3c7' },
      { label: '中低', color: '#fcd34d' },
      { label: '中等', color: '#d97706' },
      { label: '中高', color: '#a16207' },
      { label: '极高 · 平缓林缘', color: '#854d0e' },
    ],
    presetOverlays: ['noaa-snow', 'usfs-mvum', 'usfs-trails'],
    guide: {
      tagline: 'PNW 春秋双季大热门：春季追东坡融雪线，秋季追海岸云杉雾带与高山林缘。',
      seasonDetail: '春牛肝（B. rex-veris）5–6 月紧跟喀斯喀特东坡融雪线；秋牛肝（B. edulis）9–11 月出在高山针叶林及海岸云杉/岸松带。',
      habitat: '偏爱坡度平缓（<18%）、林缘透光处与林道两旁；春季伴生黄松/白冷杉，秋季伴生海岸云杉/岸松/铁杉。',
      mapTips: '此模型重点加权平缓坡面，并已联动开启「NOAA 实时积雪深度」与「USFS MVUM 合法林道」方便沿林缘寻找。',
      idTraits: '红棕至面包色圆顶菌盖、白至黄绿色海绵状菌管（无菌褶）、粗壮菌柄上部有清晰白色细网纹、切开不变蓝。',
      safetyWarning: '避开菌管鲜红或切开迅速变蓝的毒牛肝菌（如 Rubroboletus）及极苦的苦牛肝（Tylopilus）；并注意区分柄带粗糙黑/褐小疣点、切面易变灰黑的疣柄牛肝菌（Leccinum，北美部分橙盖种有肠胃不适风险）。',
    },
  },
  {
    id: 'leccinum',
    name: '疣柄牛肝菌',
    shortName: '疣柄牛肝菌',
    englishName: 'Birch / Aspen / Scaber Stalk Bolete',
    scientificName: 'Leccinum scabrum / insigne / manzanitae',
    emoji: '🌰',
    accentColor: '#ea580c',
    inatTaxonIds: '54203',
    inatColor: '#ea580c',
    peakMonths: [9, 10, 11],
    seasonSummary: '8 月底 – 11 月',
    elevSummary: '50 – 5,200 ft（白桦 / 颤杨 / 熊果带）',
    defaults: {
      minElevFt: 50,
      maxElevFt: 5200,
      minCanopyPct: 32,
      useCanopy: true,
      burnScarOnly: false,
      minScoreThreshold: 64,
    },
    weights: {
      canopy: 0.24,
      moisture: 0.16,
      aspect: 0.18,
      elevation: 0.16,
      slope: 0.26,
      moistureMode: 'balanced',
      aspectPref: 'warm',
      idealSlopeMax: 18,
    },
    palette: [
      [254, 215, 170, 130],
      [251, 146, 60, 170],
      [234, 88, 12, 205],
      [194, 65, 12, 228],
      [250, 204, 21, 245],
    ],
    legends: [
      { label: '低', color: '#fed7aa' },
      { label: '中低', color: '#fb923c' },
      { label: '中等', color: '#ea580c' },
      { label: '中高', color: '#c2410c' },
      { label: '极高 · 阔叶林缘', color: '#facc15' },
    ],
    presetOverlays: ['usfs-mvum', 'usfs-trails'],
    guide: {
      tagline: '柄上布满深色粗糙小疣点（如砂纸）的标志性牛肝菌，高度绑定白桦、颤杨或熊果/马醉木。',
      seasonDetail: '8 月底随初秋降雨从高海拔东坡颤杨林启动，9–11 月低地白桦林、湿地边缘与向阳熊果坡持续出菇。',
      habitat: '偏爱坡度平缓（<18%）、半透光阔叶林缘与溪谷白桦/颤杨林：白桦疣柄（L. scabrum）跟白桦，山杨疣柄（L. insigne）跟东坡颤杨，熊果疣柄（L. manzanitae）喜干暖南坡马醉木。',
      mapTips: '此模型已对 NLCD 阔叶/溪岸林地类与暖阳缓坡额外加权！同时务必打开「iNat 实拍点」定位已知的白桦与颤杨群落。',
      idTraits: '半球至枕状褐/橙褐色菌盖，白至灰白色细密海绵菌管，较细长硬直的菌柄表面布满竖排凸起的黑/褐色粗糙小疣点（scabers），切开菌肉常缓慢变粉灰或蓝灰。',
      safetyWarning: '重要食用警示：北美尤其橙盖/红盖疣柄牛肝菌（山杨/熊果伴生种）近年存在不少肠胃不适（恶心/腹泻）案例；仅建议采食幼嫩坚实的白桦种（L. scabrum），且必须切片高温彻底煮熟至少 15–20 分钟，首次务必极少量试吃！',
    },
  },
  {
    id: 'morel',
    name: '火烧羊肚菌',
    shortName: '火烧羊肚菌',
    englishName: 'Burn Morel',
    scientificName: 'Morchella spp.',
    emoji: '🔥',
    accentColor: '#54e36c',
    inatTaxonIds: '56830',
    inatColor: '#22c55e',
    peakMonths: [4, 5, 6],
    seasonSummary: '4 月 – 6 月（次年火场）',
    elevSummary: '2,000 – 6,500 ft',
    defaults: {
      minElevFt: 2000,
      maxElevFt: 6500,
      minCanopyPct: 32,
      useCanopy: true,
      burnScarOnly: true,
      minScoreThreshold: 55,
    },
    weights: {
      canopy: 0.28,
      moisture: 0.1,
      aspect: 0.32,
      elevation: 0.1,
      slope: 0.2,
      moistureMode: 'balanced',
      aspectPref: 'north',
      idealSlopeMax: 22,
    },
    palette: [
      [150, 184, 162, 115],
      [71, 142, 96, 160],
      [14, 171, 140, 198],
      [84, 227, 108, 224],
      [238, 243, 93, 240],
    ],
    legends: [
      { label: '低', color: '#96b8a2' },
      { label: '中低', color: '#478e60' },
      { label: '中等', color: '#0eab8c' },
      { label: '中高', color: '#54e36c' },
      { label: '极高', color: '#eef35d' },
    ],
    presetOverlays: ['wildfires-2025', 'wildfires-2024', 'noaa-snow'],
    guide: {
      tagline: '北美春季最具传奇色彩的采菇盛宴，专攻前一年的野火针叶林火烧迹地。',
      seasonDetail: '4 月下旬从低海拔（2,000–3,500 ft）开启，5–6 月随融雪与土温升至 50–55°F 逐级上移至 6,500 ft。',
      habitat: '前一年过火的针叶林（花旗松、冷杉、云杉、黄松），偏爱中度过火、北/偏北保水坡面与 5–25% 缓坡。',
      mapTips: '开启「仅火场内」+「合法林地」，系统会自动执行「NIFC 火场 ∩ 合法公共林地」双重过滤并逐像素计算火场内热区。',
      idTraits: '蜂窝状深凹坑菌盖，纵切从顶到底完全中空，菌盖下缘直接贴合菌柄。',
      safetyWarning: '务必纵切确认完全中空！严禁采食实心或棉絮状填充、脑回褶皱的毒假羊肚菌（Gyromitra esculenta 等），且所有羊肚菌必须彻底熟透后食用。',
    },
  },
];

export function getSpeciesProfile(id: SpeciesId): SpeciesProfile {
  return SPECIES_CATALOG.find((s) => s.id === id) || SPECIES_CATALOG[0];
}

export function getCurrentSeasonStatus(peakMonths: number[]): {
  label: string;
  tone: 'peak' | 'shoulder' | 'off';
} {
  const m = new Date().getMonth() + 1;
  if (peakMonths.includes(m)) {
    return { label: '当前盛季', tone: 'peak' };
  }
  const prev = m === 1 ? 12 : m - 1;
  const next = m === 12 ? 1 : m + 1;
  if (peakMonths.includes(prev) || peakMonths.includes(next)) {
    return { label: '临近/尾声', tone: 'shoulder' };
  }
  return { label: '非当季', tone: 'off' };
}
