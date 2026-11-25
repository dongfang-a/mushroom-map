import type { Lang, LegendItem, SpeciesId, UnitSettings } from '../types/map';
import { formatElevationRange } from '../utils/units';

export interface SpeciesGuideText {
  tagline: string;
  seasonDetail: string;
  habitat: string;
  mapTips: string;
  idTraits: string;
  safetyWarning: string;
}

export interface SpeciesProfile {
  id: SpeciesId;
  name: string;
  shortName: string;
  englishName: string;
  shortNameEn: string;
  scientificName: string;
  emoji: string;
  accentColor: string;
  inatTaxonIds: string;
  inatColor: string;
  peakMonths: number[]; // 1..12
  seasonSummary: string;
  seasonSummaryEn: string;
  elevSummary: string;
  elevSummaryNote?: string;
  elevSummaryNoteEn?: string;
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
  guide: SpeciesGuideText;
  guideEn: SpeciesGuideText;
}

export const SPECIES_CATALOG: SpeciesProfile[] = [
  {
    id: 'yellowfoot',
    name: '冬鸡油菌 / 黄足鸡油菌',
    shortName: '冬鸡油菌',
    englishName: 'Winter Chanterelle / Yellowfoot',
    shortNameEn: 'Yellowfoot',
    scientificName: 'Craterellus tubaeformis',
    emoji: '🍄',
    accentColor: '#facc15',
    inatTaxonIds: '350511',
    inatColor: '#ec4899',
    peakMonths: [10, 11, 12, 1],
    seasonSummary: '10 月 – 次年 1 月',
    seasonSummaryEn: 'Oct – Jan',
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
      { label: '低', labelEn: 'Low', color: '#5eead4' },
      { label: '中低', labelEn: 'Mod-Low', color: '#14b8a6' },
      { label: '中等', labelEn: 'Moderate', color: '#eab308' },
      { label: '中高', labelEn: 'Mod-High', color: '#facc15' },
      { label: '极高 · 沟谷', labelEn: 'Prime · Draws', color: '#ff8c00' },
    ],
    presetOverlays: ['usfs-second-growth', 'usfs-trails'],
    guide: {
      tagline: 'PNW 深秋与初冬的绝对主角，常在厚苔藓腐木上成片群生。',
      seasonDetail:
        '10 月中旬从喀斯喀特中低海拔启动，11–1 月海岸山脉与低地（0–2,500 ft）持续盛产，怕重霜但耐冷雨。',
      habitat:
        '西部铁杉（Western Hemlock）与成熟花旗松林下，尤其钟爱腐烂的针叶倒木、厚绿苔藓地与湿润溪沟台地。',
      mapTips:
        '重点看琥珀金/亮黄色的凹坡沟谷 + 蓝色 USGS 溪流沿岸，用「合法林地」锁定国家/州立森林。',
      idTraits: '褐黄色漏斗状薄菌盖、空心鲜黄菌柄、菌盖下为钝皱褶而非真刀片菌褶。',
      safetyWarning:
        '警惕同生在腐木上的剧毒纹缘盔孢伞（Galerina marginata，真刀片菌褶、深棕孢子印、有菌环残迹）与绿黄色的 Leotia lubrica。',
    },
    guideEn: {
      tagline:
        'The undisputed star of PNW late autumn and early winter, fruiting in huge troops across mossy rotting conifer wood.',
      seasonDetail:
        'Starts mid-October in mid-to-low Cascade elevations and keeps flushing through Jan across coastal and lowland forests during cold rains until hard freezes arrive.',
      habitat:
        'Western hemlock and mature Douglas-fir forests, especially along decaying mossy conifer nurse logs, thick moss carpets, and damp creek draws.',
      mapTips:
        'Focus on bright prime hotspots in concave draws and creek benches, paired with Legal Land filtering to stay inside National/State Forests.',
      idTraits:
        'Thin brownish-yellow funnel cap, bright golden hollow flexible stem, and blunt forked false gills (ridges) rather than true blade-like gills.',
      safetyWarning:
        'Watch closely for deadly Funeral Bell (Galerina marginata — true gills, rusty-brown spore print, ring zone) growing on the same mossy wood, and slimy green-yellow Jelly Babies (Leotia lubrica).',
    },
  },
  {
    id: 'hedgehog',
    name: '刺猬菌',
    shortName: '刺猬菌',
    englishName: 'Sweet Tooth / Hedgehog',
    shortNameEn: 'Hedgehog',
    scientificName: 'Hydnum oregonense / umbilicatum',
    emoji: '🦔',
    accentColor: '#fb923c',
    inatTaxonIds: '48422',
    inatColor: '#f97316',
    peakMonths: [10, 11, 12, 1],
    seasonSummary: '10 月 – 次年 1 月',
    seasonSummaryEn: 'Oct – Jan',
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
      { label: '低', labelEn: 'Low', color: '#fed7aa' },
      { label: '中低', labelEn: 'Mod-Low', color: '#fdba74' },
      { label: '中等', labelEn: 'Moderate', color: '#fb923c' },
      { label: '中高', labelEn: 'Mod-High', color: '#f97316' },
      { label: '极高', labelEn: 'Prime', color: '#ea580c' },
    ],
    presetOverlays: ['usfs-second-growth', 'usfs-trails'],
    guide: {
      tagline: '越冷越精神的深秋/冬季美味菌，菌盖下长满小刺，几乎无致命混淆种。',
      seasonDetail: '10 月至次年 1 月为盛产期，比黄金鸡油菌更耐低温，常与冬鸡油菌同片林子共采。',
      habitat: '湿润成熟的西部铁杉、花旗松、冷杉苔藓林地面，偏好中等至浓密树冠（≥60%）与偏北阴坡。',
      mapTips:
        '寻找 45–80 年次生林与成熟密林中坡度平缓、偏北湿润的苔藓坡面，对照 iNat 实拍点命中率极高。',
      idTraits: '淡橙/奶油色菌盖，菌盖背面密布易脱落的柔软小齿刺（无菌褶），菌肉脆嫩少虫蛀。',
      safetyWarning: '极安全新手入门菌；唯一需注意勿与极苦的木生齿菌（Sarcodon 等，深褐带鳞片、味苦）混淆。',
    },
    guideEn: {
      tagline:
        'Cold-hardy late-fall and winter choice edible with soft teeth under the cap and virtually no toxic lookalikes.',
      seasonDetail:
        'Peaks Oct–Jan; tolerates colder temperatures than golden chanterelles and frequently shares forests with Yellowfoots.',
      habitat:
        'Moist mossy ground under mature western hemlock, Douglas-fir, and true firs, favoring dense canopy (≥60%) and cool north-facing slopes.',
      mapTips:
        'Target gentle, cool north-facing benches inside 45–80 yr second-growth and mature stands; cross-check with recent iNaturalist sightings.',
      idTraits:
        'Pale apricot to buff wavy cap with soft, brittle cream-colored spines/teeth underneath instead of gills; crisp bug-free flesh.',
      safetyWarning:
        'One of the safest beginner mushrooms. Just avoid scaly dark-brown bitter toothed mushrooms (Sarcodon spp.), which are inedibly bitter rather than deadly.',
    },
  },
  {
    id: 'black-trumpet',
    name: '黑喇叭菌',
    shortName: '黑喇叭菌',
    englishName: 'Black Trumpet / Horn of Plenty',
    shortNameEn: 'Black Trumpet',
    scientificName: 'Craterellus calicornucopioides',
    emoji: '🎺',
    accentColor: '#a78bfa',
    inatTaxonIds: '473935,48607',
    inatColor: '#a855f7',
    peakMonths: [11, 12, 1, 2],
    seasonSummary: '11 月 – 次年 2 月',
    seasonSummaryEn: 'Nov – Feb',
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
      { label: '低', labelEn: 'Low', color: '#c4b5fd' },
      { label: '中低', labelEn: 'Mod-Low', color: '#a78bfa' },
      { label: '中等', labelEn: 'Moderate', color: '#8b5cf6' },
      { label: '中高', labelEn: 'Mod-High', color: '#7c3aed' },
      { label: '极高 · 洼地', labelEn: 'Prime · Depressions', color: '#d946ef' },
    ],
    presetOverlays: ['usfs-trails'],
    guide: {
      tagline: '香气馥郁的高级料理菌，保护色极强，高度依赖湿润洼地与固定老点。',
      seasonDetail: '11 月冷雨透地后启动，一直持续到次年 2 月（暖冬海岸带产量最高）。',
      habitat: '低海拔湿润苔藓沟谷、溪流旁落叶层，常见于铁杉、花旗松、石栎或橡树混交林的凹陷汇水处。',
      mapTips:
        '此模型把「凹坡汇水湿度」权重调到最高，强烈建议同时打开「iNat 历年出菇密度热区」找往年老点。',
      idTraits: '灰黑至深褐色中空薄壁喇叭状，外壁光滑或略带灰霜，无真菌褶，有果香。',
      safetyWarning: '特征非常独特，几乎无有毒混淆种；采摘时蹲下平视地面更容易发现成群黑喇叭。',
    },
    guideEn: {
      tagline:
        'Aromatic culinary treasure with extreme camouflage that returns reliably to damp mossy depressions.',
      seasonDetail:
        'Triggers after soaking November rains and fruits through February, peaking along mild coastal lowland belts.',
      habitat:
        'Low-elevation mossy seeps, creek draws, and damp leaf litter under hemlock, Douglas-fir, tanoak, or oak mixed woods.',
      mapTips:
        'Heavily weighted toward concave moisture-collecting micro-topography. Turn on the iNat Historical Density Heatmap to pinpoint perennial patches.',
      idTraits:
        'Thin hollow dark gray to charcoal-black trumpet shape; smooth to faintly wrinkled outer surface with zero true gills and fruity aroma.',
      safetyWarning:
        'Virtually unmistakable with no dangerous lookalikes. Crouch low and scan horizontally — once you spot one, dozens often appear nearby.',
    },
  },
  {
    id: 'oyster',
    name: '野生平菇',
    shortName: '野生平菇',
    englishName: 'Oyster Mushroom',
    shortNameEn: 'Oyster',
    scientificName: 'Pleurotus pulmonarius / ostreatus',
    emoji: '🦪',
    accentColor: '#38bdf8',
    inatTaxonIds: '48496',
    inatColor: '#0ea5e9',
    peakMonths: [10, 11, 12, 1, 2, 3, 4],
    seasonSummary: '10 月 – 次年 4 月（冷雨季）',
    seasonSummaryEn: 'Oct – Apr (Rainy Season)',
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
      { label: '低', labelEn: 'Low', color: '#bae6fd' },
      { label: '中低', labelEn: 'Mod-Low', color: '#7dd3fc' },
      { label: '中等', labelEn: 'Moderate', color: '#38bdf8' },
      { label: '中高', labelEn: 'Mod-High', color: '#0ea5e9' },
      { label: '极高 · 河谷', labelEn: 'Prime · River Bottoms', color: '#22d3ee' },
    ],
    presetOverlays: ['noaa-precip-7d', 'usfs-trails'],
    guide: {
      tagline: '冷雨降温后的河谷阔叶枯木“收割机”，全年雨季尤其是深秋初冬高产。',
      seasonDetail: '春秋雨季及 11–2 月温和冬雨后大量爆发，降温刺激往往在 3–5 天后引发大潮。',
      habitat: '低海拔河漫滩与溪谷沿岸倒伏或枯死的红桤木（Red Alder）、杨树（Cottonwood）与大叶枫树干上。',
      mapTips:
        '重点盯低海拔平缓河谷与蓝色 USGS 溪流两侧（红桤木集中带），搭配「NOAA 7 天降水」判断爆发时机。',
      idTraits: '白色至浅灰褐色扇形群生，菌褶顺延至短侧柄，白色至淡紫灰孢子印，常带淡淡茴香味。',
      safetyWarning:
        '务必区分针叶腐木上纯白薄脆的「天使之翼」（Pleurocybella porrigens，存在肾病中毒风险）——只采阔叶木（红桤木/杨树）上的厚肉平菇！',
    },
    guideEn: {
      tagline:
        'Prolific hardwood log fruiters along river bottoms after cold soaking rains from fall through spring.',
      seasonDetail:
        'Flushes heavily after cold-snap rain events from October through April, often peaking 3–5 days after soaking rainfall.',
      habitat:
        'Low-elevation floodplains and creek corridors on dead or dying red alder, black cottonwood, and bigleaf maple trunks.',
      mapTips:
        'Target flat low-elevation river valleys and riparian alder corridors alongside NOAA 7-Day Precipitation.',
      idTraits:
        'Fleshy white to pale gray-brown shelf-like fans in overlapping clusters; white decurrent gills running down a short lateral stub; mild anise aroma.',
      safetyWarning:
        'Always verify hardwood host! Avoid thin, pure-white fragile Angel Wings (Pleurocybella porrigens) growing on rotting conifers — linked to kidney-related toxicity.',
    },
  },
  {
    id: 'lions-mane',
    name: '熊头猴头菇',
    shortName: '熊头猴头',
    englishName: "Bear's Head Tooth",
    shortNameEn: "Bear's Head",
    scientificName: 'Hericium abietis',
    emoji: '🦁',
    accentColor: '#38bdf8',
    inatTaxonIds: '55187',
    inatColor: '#38bdf8',
    peakMonths: [9, 10, 11, 12],
    seasonSummary: '9 月 – 12 月',
    seasonSummaryEn: 'Sep – Dec',
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
      { label: '低', labelEn: 'Low', color: '#38bdf8' },
      { label: '中低', labelEn: 'Mod-Low', color: '#6366f1' },
      { label: '中等', labelEn: 'Moderate', color: '#a855f7' },
      { label: '中高', labelEn: 'Mod-High', color: '#e879f9' },
      { label: '极高 · 老密林', labelEn: 'Prime · Old Growth', color: '#facc15' },
    ],
    presetOverlays: ['usfs-wilderness', 'usfs-trails'],
    guide: {
      tagline: '形如白色瀑布的珍稀针叶木腐菌，味道堪比海鲜干贝，专爱成熟老林倒木。',
      seasonDetail: '9 月下旬至 12 月，中高海拔入秋先出，11–12 月转至低海拔未结霜老林。',
      habitat: '高郁闭度（≥75%）老龄冷杉（True Fir）、西部铁杉、花旗松粗大倒木与朽桩上，同一根倒木往往连续多年出菇。',
      mapTips:
        '此模型重度加权高密树冠与阴湿沟谷；建议在图层中打开「USFS 荒野区」并避开近 50 年采伐区，专攻老林。',
      idTraits: '纯白至乳白色分枝簇状，垂挂长短一致的冰柱状软刺（齿），无毒且辨识度 100%。',
      safetyWarning: '几乎无任何有毒近似种，老熟发黄发苦的个体口感较差，优先采雪白脆嫩的子实体。',
    },
    guideEn: {
      tagline:
        'Cascading snowy-white conifer wood fungus with sweet scallop-like flavor, tied to old-growth nurse logs.',
      seasonDetail:
        'Fruits late Sep through Dec — starting higher up in early autumn and persisting in frost-free lowland old growth into December.',
      habitat:
        'Large downed trunks and stumps of true firs, western hemlock, and Douglas-fir under dense mature canopy (≥75%). The same log often fruits for years.',
      mapTips:
        'Strongly weights dense tree canopy and humid cool hollows. Pair with USFS Wilderness and avoid recent logging cuts.',
      idTraits:
        'Pure white to cream branched coral-like mass draped with uniform hanging icicle-like soft spines. 100% unmistakable.',
      safetyWarning:
        'No toxic lookalikes. Older yellowing specimens turn bitter and tough — harvest fresh, bright-white firm fruitbodies.',
    },
  },
  {
    id: 'chanterelle',
    name: '黄金 / 白鸡油菌',
    shortName: '黄金鸡油菌',
    englishName: 'Pacific Golden & White Chanterelle',
    shortNameEn: 'Chanterelle',
    scientificName: 'Cantharellus formosus / subalbidus',
    emoji: '🌟',
    accentColor: '#fbbf24',
    inatTaxonIds: '47348',
    inatColor: '#f59e0b',
    peakMonths: [9, 10, 11],
    seasonSummary: '8 月底 – 11 月',
    seasonSummaryEn: 'Late Aug – Nov',
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
      { label: '低', labelEn: 'Low', color: '#fef08a' },
      { label: '中低', labelEn: 'Mod-Low', color: '#fde047' },
      { label: '中等', labelEn: 'Moderate', color: '#facc15' },
      { label: '中高', labelEn: 'Mod-High', color: '#f59e0b' },
      { label: '极高 · 次生林', labelEn: 'Prime · 2nd Growth', color: '#ea580c' },
    ],
    presetOverlays: ['usfs-second-growth', 'usfs-trails', 'noaa-precip-7d'],
    guide: {
      tagline: 'PNW 人气第一的秋季王牌食用菌，最爱 40–80 年生次生花旗松苔藓林。',
      seasonDetail:
        '8 月底高海拔（3,500–4,500 ft）率先出菇，9–10 月全区盛产，11 月下移至 <1,500 ft 海岸与低地（白鸡油菌更耐寒）。',
      habitat: '40–80 年次生花旗松与西部铁杉林，林下苔藓多、灌木不过于密闭、排水良好的缓至中坡。',
      mapTips:
        '务必结合已开启的「USFS 45–80 年次生林（1946–1980 采伐再生区）」，重叠在热力高分缓坡上就是经典黄金鸡油菌林！',
      idTraits: '杏黄（或纯白）菌盖，假菌褶分叉钝圆不可剥离，菌肉雪白如鸡胸肉丝，微带杏果香。',
      safetyWarning:
        '注意区分假鸡油菌（Hygrophoropsis aurantiaca，薄脆分叉真菌褶、橙色软肉）及木生的毒灯笼菌（Omphalotus，PNW 罕见但需确认生于土中而非朽木）。',
    },
    guideEn: {
      tagline:
        "The PNW's most beloved autumn edible, thriving in mossy 40–80 year old second-growth Douglas-fir forests.",
      seasonDetail:
        'Starts late August at higher elevations, peaks everywhere Sep–Oct, and shifts down to coastal lowlands in November (White Chanterelles last even colder).',
      habitat:
        '40–80 yr second-growth Douglas-fir and western hemlock stands with mossy floors, light understory brush, and gentle well-drained slopes.',
      mapTips:
        'Pair with the USFS 45–80 yr Second-Growth (1946–1980 harvest) overlay — overlap on prime gentle slopes marks classic chanterelle ground.',
      idTraits:
        'Apricot-yellow (or chalky white) wavy cap, blunt forked false gills fused to the cap, firm white string-cheese flesh, faint apricot fragrance.',
      safetyWarning:
        'Distinguish from False Chanterelle (Hygrophoropsis aurantiaca — thin true gills, soft orange flesh) and wood-growing toxic Jack-o-Lantern (Omphalotus — always verify ground-growing, not clustered on wood).',
    },
  },
  {
    id: 'matsutake',
    name: '美洲松茸',
    shortName: '美洲松茸',
    englishName: 'Western / Pacific Matsutake',
    shortNameEn: 'Matsutake',
    scientificName: 'Tricholoma murrillianum',
    emoji: '👑',
    accentColor: '#d97706',
    inatTaxonIds: '521711,62483',
    inatColor: '#d97706',
    peakMonths: [9, 10, 11],
    seasonSummary: '9 月 – 11 月',
    seasonSummaryEn: 'Sep – Nov',
    elevSummary: '2,600 – 5,600 ft（火山带；海岸可调至 50–500 ft）',
    elevSummaryNote: '火山带；海岸可调至低海拔',
    elevSummaryNoteEn: 'Volcanic zone; coastal dunes near sea level',
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
      { label: '低', labelEn: 'Low', color: '#fde68a' },
      { label: '中低', labelEn: 'Mod-Low', color: '#fbbf24' },
      { label: '中等', labelEn: 'Moderate', color: '#d97706' },
      { label: '中高', labelEn: 'Mod-High', color: '#b45309' },
      { label: '极高 · 强排水', labelEn: 'Prime · Well-Drained', color: '#9a3412' },
    ],
    presetOverlays: ['usda-ssurgo-soil', 'usfs-mvum', 'usfs-trails'],
    guide: {
      tagline: 'PNW 价值最高的野生菌王，极度挑剔贫瘠强排水的火山浮石土或海岸砂土。',
      seasonDetail:
        '9 月中旬至 10 月底喀斯喀特火山带（3,500–5,800 ft）为高潮；10 月底至 11 月下旬海岸沙丘带（0–500 ft）出晚季松茸。',
      habitat: '贫瘠砂土/火山灰浮石土，几乎无杂草的开阔林下；宿主为扭叶松、铁杉、红冷杉、巨冷杉或海岸岸松/石栎。',
      mapTips:
        '已自动开启「USDA SSURGO 土壤图层」并切换到强排水地形模型！点击地图任何位置可在底部面板直接查出该点是不是砂土/火山灰（Andic / Sandy / Excessively drained）。',
      idTraits: '极硬实白菌肉、棉质菌幕/菌环、菌柄基部常带砂土，标志性的浓郁肉桂+松脂辛香气味。',
      safetyWarning:
        '致命警告：务必逐朵核对气味与菌托！剧毒史密斯鹅膏（Amanita smithiana，导致肾衰竭）同生同季且外形极似，但它无松茸肉桂香、基部膨大易碎且无绵密菌环！',
    },
    guideEn: {
      tagline:
        "The PNW's most prized aromatic mushroom — fiercely selective for nutrient-poor, fast-draining volcanic pumice or coastal sand.",
      seasonDetail:
        'Peaks mid-Sep to late Oct in Cascade volcanic pumice zones, then shifts to coastal shore-pine sand dunes from late Oct through November.',
      habitat:
        'Sparse-understory sandy or volcanic pumice/ash soils with lodgepole pine, western/mountain hemlock, Shasta red fir, grand fir, or coastal shore pine & tanoak.',
      mapTips:
        'Auto-enables USDA SSURGO Soil boundaries + well-drained ridge model. Tap any spot to inspect live USDA soil texture & drainage class (Andic / Sandy / Excessively Drained).',
      idTraits:
        'Rock-hard firm white flesh, cottony partial veil/ring, gritty sandy tapering base, and unmistakable spicy cinnamon + pine aroma.',
      safetyWarning:
        'CRITICAL DANGER: Check EVERY specimen for smell and base! Deadly Smith’s Amanita (Amanita smithiana — acute kidney failure) fruits in the same spots and looks very similar, but lacks spicy cinnamon odor and has a fragile swollen/radicating base.',
    },
  },
  {
    id: 'porcini',
    name: '美味牛肝菌（春 / 秋）',
    shortName: '美味牛肝菌',
    englishName: 'King Bolete / Porcini',
    shortNameEn: 'Porcini / King',
    scientificName: 'Boletus edulis / rex-veris',
    emoji: '🥖',
    accentColor: '#b45309',
    inatTaxonIds: '48701,438025',
    inatColor: '#ca8a04',
    peakMonths: [5, 6, 9, 10, 11],
    seasonSummary: '春 5–6 月 / 秋 9–11 月',
    seasonSummaryEn: 'May–Jun & Sep–Nov',
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
      { label: '低', labelEn: 'Low', color: '#fef3c7' },
      { label: '中低', labelEn: 'Mod-Low', color: '#fcd34d' },
      { label: '中等', labelEn: 'Moderate', color: '#d97706' },
      { label: '中高', labelEn: 'Mod-High', color: '#a16207' },
      { label: '极高 · 平缓林缘', labelEn: 'Prime · Gentle Edges', color: '#854d0e' },
    ],
    presetOverlays: ['noaa-snow', 'usfs-mvum', 'usfs-trails'],
    guide: {
      tagline: 'PNW 春秋双季大热门：春季追东坡融雪线，秋季追海岸云杉雾带与高山林缘。',
      seasonDetail:
        '春牛肝（B. rex-veris）5–6 月紧跟喀斯喀特东坡融雪线；秋牛肝（B. edulis）9–11 月出在高山针叶林及海岸云杉/岸松带。',
      habitat: '偏爱坡度平缓（<18%）、林缘透光处与林道两旁；春季伴生黄松/白冷杉，秋季伴生海岸云杉/岸松/铁杉。',
      mapTips:
        '此模型重点加权平缓坡面，并已联动开启「NOAA 实时积雪深度」与「USFS MVUM 合法林道」方便沿林缘寻找。',
      idTraits: '红棕至面包色圆顶菌盖、白至黄绿色海绵状菌管（无菌褶）、粗壮菌柄上部有清晰白色细网纹、切开不变蓝。',
      safetyWarning:
        '避开菌管鲜红或切开迅速变蓝的毒牛肝菌（如 Rubroboletus）及极苦的苦牛肝（Tylopilus）；并注意区分柄带粗糙黑/褐小疣点、切面易变灰黑的疣柄牛肝菌（Leccinum）。',
    },
    guideEn: {
      tagline:
        'Iconic two-season PNW prized bolete: chase receding East-slope snowlines in spring and coastal spruce / montane forest edges in autumn.',
      seasonDetail:
        'Spring King (B. rex-veris) follows May–June Cascade East-slope snowmelt; Fall King (B. edulis) peaks Sep–Nov in montane conifers and coastal Sitka spruce / shore pine belts.',
      habitat:
        'Gentle (<18%) sunlit forest edges, roadbanks, and open conifer benches under ponderosa pine / white fir (spring) or spruce, shore pine & hemlock (fall).',
      mapTips:
        'Strongly weights gentle slopes and auto-enables NOAA Snow Depth + USFS MVUM roads to scout melting edges and roadbanks.',
      idTraits:
        'Smooth chestnut-brown bun-like cap, white-to-olive-yellow spongy pores (no gills), bulbous cream stipe with fine white reticulation (netting) near the top; firm white unchanging flesh.',
      safetyWarning:
        'Avoid red-pored or fast blue-bruising boletes (e.g. Rubroboletus) and intensely bitter Tylopilus; also distinguish from rough-scabered Leccinum stalks.',
    },
  },
  {
    id: 'fib-king',
    name: '绒盖牛肝菌 (Fib King)',
    shortName: '绒盖牛肝菌',
    englishName: 'Fib King / Fibrillose Bolete',
    shortNameEn: 'Fib King',
    scientificName: 'Boletus fibrillosus',
    emoji: '🍫',
    accentColor: '#ca8a04',
    inatTaxonIds: '118150',
    inatColor: '#92400e',
    peakMonths: [9, 10, 11],
    seasonSummary: '9 月 – 11 月',
    seasonSummaryEn: 'Sep – Nov',
    elevSummary: '100 – 4,200 ft',
    defaults: {
      minElevFt: 100,
      maxElevFt: 4200,
      minCanopyPct: 52,
      useCanopy: true,
      burnScarOnly: false,
      minScoreThreshold: 64,
    },
    weights: {
      canopy: 0.3,
      moisture: 0.2,
      aspect: 0.14,
      elevation: 0.16,
      slope: 0.2,
      moistureMode: 'balanced',
      aspectPref: 'neutral',
      idealSlopeMax: 20,
    },
    palette: [
      [254, 240, 138, 120],
      [245, 158, 11, 165],
      [180, 83, 9, 200],
      [146, 64, 14, 228],
      [250, 204, 21, 245],
    ],
    legends: [
      { label: '低', labelEn: 'Low', color: '#fef08a' },
      { label: '中低', labelEn: 'Mod-Low', color: '#f59e0b' },
      { label: '中等', labelEn: 'Moderate', color: '#b45309' },
      { label: '中高', labelEn: 'Mod-High', color: '#92400e' },
      { label: '极高 · 针叶林', labelEn: 'Prime · Conifer', color: '#facc15' },
    ],
    presetOverlays: ['usfs-second-growth', 'usfs-trails'],
    guide: {
      tagline: 'PNW 西坡针叶林专属“巧克力绒盖美味牛肝菌”，风味浓郁、肉质紧实，比传统秋牛肝更常见于低中海拔花旗松/铁杉林。',
      seasonDetail:
        '9 月至 11 月秋雨透地后盛产，常与鸡油菌同林同期出现；低地及西坡海岸山脉可持续至 11 月下旬。',
      habitat:
        '成熟或次生花旗松（Douglas-fir）、西部铁杉与巨冷杉混交林地面，偏爱中等至较密树冠（50–85%）与平缓针叶腐殖坡面。',
      mapTips:
        '与黄金鸡油菌林带高度重合，建议结合「USFS 45–80 年次生林」与「iNat 实拍点」在中低海拔缓坡和步道两侧搜索。',
      idTraits:
        '深栗棕至巧克力色干燥绒毛/细纤维鳞片状菌盖（不发黏）、幼时乳白渐转橄榄黄海绵菌管（伤不变蓝）、粗壮棕褐色带纵纤维/细网纹菌柄、厚实纯白不变色菌肉。',
      safetyWarning:
        '优质安全美味牛肝菌；避开菌管鲜红或按压速变蓝的牛肝菌，并注意与略带酸味、长在腐木上的丽柄牛肝菌（Admirable）及苦味粉孢牛肝（Tylopilus）区分。',
    },
    guideEn: {
      tagline:
        'The classic PNW "Chocolate King" — a choice porcini-group bolete common in lowland and mid-elevation Douglas-fir & hemlock woods.',
      seasonDetail:
        'Fruits September through November following soaking autumn rains, often right alongside golden chanterelles from coastal lowlands up to Cascade mid-slopes.',
      habitat:
        'Ectomycorrhizal with Douglas-fir, western hemlock, and grand fir in mature and second-growth conifer stands on gentle mossy needle-duff slopes.',
      mapTips:
        'Overlaps strongly with prime chanterelle woods. Combine USFS 45–80 yr Second-Growth with iNaturalist sightings along gentle conifer benches and trail edges.',
      idTraits:
        'Dry, velvety to matted-fibrillose dark chestnut-brown cap (never slimy), pale cream turning olive-yellow pores (no blue bruising), stout brownish fibrillose/reticulated stipe, thick unchanging white flesh.',
      safetyWarning:
        'Choice edible. Avoid red-pored or blue-staining boletes and taste-check against bitter Tylopilus; also note Admirable Bolete grows directly on mossy hemlock wood.',
    },
  },
  {
    id: 'admirable',
    name: '丽柄牛肝菌 (Admirable)',
    shortName: '丽柄牛肝菌',
    englishName: 'Admirable Bolete',
    shortNameEn: 'Admirable',
    scientificName: 'Aureoboletus mirabilis',
    emoji: '🪵',
    accentColor: '#e11d48',
    inatTaxonIds: '790782',
    inatColor: '#be123c',
    peakMonths: [9, 10, 11],
    seasonSummary: '8 月底 – 11 月',
    seasonSummaryEn: 'Late Aug – Nov',
    elevSummary: '100 – 4,500 ft',
    defaults: {
      minElevFt: 100,
      maxElevFt: 4500,
      minCanopyPct: 64,
      useCanopy: true,
      burnScarOnly: false,
      minScoreThreshold: 64,
    },
    weights: {
      canopy: 0.38,
      moisture: 0.28,
      aspect: 0.14,
      elevation: 0.1,
      slope: 0.1,
      moistureMode: 'concave',
      aspectPref: 'north',
      idealSlopeMax: 22,
    },
    palette: [
      [253, 164, 175, 130],
      [244, 63, 94, 175],
      [225, 29, 72, 208],
      [190, 18, 60, 232],
      [250, 204, 21, 246],
    ],
    legends: [
      { label: '低', labelEn: 'Low', color: '#fda4af' },
      { label: '中低', labelEn: 'Mod-Low', color: '#f43f5e' },
      { label: '中等', labelEn: 'Moderate', color: '#e11d48' },
      { label: '中高', labelEn: 'Mod-High', color: '#be123c' },
      { label: '极高 · 铁杉老木', labelEn: 'Prime · Hemlock Logs', color: '#facc15' },
    ],
    presetOverlays: ['usfs-wilderness', 'usfs-trails'],
    guide: {
      tagline: 'PNW 辨识度拉满的“酒红绒面木生牛肝菌”！直接长在长满青苔的腐朽西部铁杉倒木与树桩上，风味微带清亮柠檬坚果香。',
      seasonDetail:
        '8 月底至 11 月结果，9–10 月秋雨后达到高峰；西坡温带雨林与海岸铁杉老林常持续至 11 月下旬。',
      habitat:
        '与西部铁杉（Western Hemlock）高度伴生，独特之处在于子实体直接从高度腐烂、覆盖厚苔藓的铁杉倒木、朽桩及林下腐木堆上冒出，喜高郁闭（≥65%）阴湿老林。',
      mapTips:
        '模型重度加权高密老林树冠与阴湿凹坡；优先在成熟/老龄西部铁杉林和「USFS 荒野区」中沿着长满青苔的粗大倒木搜寻！',
      idTraits:
        '酒红至暗红棕色丝绒麂皮质感菌盖、明黄至柠檬黄海绵菌管（基本不变蓝）、上细下膨的棒状酒红条纹粗柄（上部具粗黄褐网纹）、嫩时肉紧实微带爽口微酸果香。',
      safetyWarning:
        '极易辨认的优质安全食用菌（PNW 唯一典型长在铁杉朽木上的酒红绒面大牛肝菌）；老熟海绵变软易生虫，优先选菌盖紧实、菌管鲜黄的年轻个体。',
    },
    guideEn: {
      tagline:
        'Unmistakable PNW velvet-burgundy bolete fruiting straight out of mossy decaying Western Hemlock logs, prized for its bright lemony-nutty flavor.',
      seasonDetail:
        'Fruits late August through November, peaking in September and October after soaking rains across coastal and west-slope rainforests.',
      habitat:
        'Associated with Western Hemlock in humid, dense-canopy (≥65%) mature and old-growth stands — uniquely fruiting directly on or beside mossy rotted hemlock nurse logs and stumps.',
      mapTips:
        'Heavily weights dense mature canopy and cool humid concave draws. Scout old-growth hemlock stands and moss-blanketed downed logs.',
      idTraits:
        'Rich maroon/burgundy velvety suede cap, bright lemon-to-golden yellow pores (little or no blue staining), stout club-shaped maroon-streaked stipe with coarse yellow-brown netting near the apex.',
      safetyWarning:
        'Choice edible with almost no dangerous lookalikes thanks to its velvety maroon cap and conifer-wood habitat. Pick firm young specimens with bright yellow pores (older ones turn soft and buggy).',
    },
  },
  {
    id: 'leccinum',
    name: '疣柄牛肝菌',
    shortName: '疣柄牛肝菌',
    englishName: 'Birch / Aspen / Scaber Stalk Bolete',
    shortNameEn: 'Leccinum',
    scientificName: 'Leccinum scabrum / insigne / manzanitae',
    emoji: '🌰',
    accentColor: '#ea580c',
    inatTaxonIds: '54203',
    inatColor: '#ea580c',
    peakMonths: [9, 10, 11],
    seasonSummary: '8 月底 – 11 月',
    seasonSummaryEn: 'Late Aug – Nov',
    elevSummary: '50 – 5,200 ft（白桦 / 颤杨 / 熊果带）',
    elevSummaryNote: '白桦 / 颤杨 / 熊果带',
    elevSummaryNoteEn: 'Birch / Aspen / Madrone belt',
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
      { label: '低', labelEn: 'Low', color: '#fed7aa' },
      { label: '中低', labelEn: 'Mod-Low', color: '#fb923c' },
      { label: '中等', labelEn: 'Moderate', color: '#ea580c' },
      { label: '中高', labelEn: 'Mod-High', color: '#c2410c' },
      { label: '极高 · 阔叶林缘', labelEn: 'Prime · Hardwood Edges', color: '#facc15' },
    ],
    presetOverlays: ['usfs-mvum', 'usfs-trails'],
    guide: {
      tagline: '柄上布满深色粗糙小疣点（如砂纸）的标志性牛肝菌，高度绑定白桦、颤杨或熊果/马醉木。',
      seasonDetail: '8 月底随初秋降雨从高海拔东坡颤杨林启动，9–11 月低地白桦林、湿地边缘与向阳熊果坡持续出菇。',
      habitat:
        '偏爱坡度平缓（<18%）、半透光阔叶林缘与溪谷白桦/颤杨林：白桦疣柄（L. scabrum）跟白桦，山杨疣柄（L. insigne）跟东坡颤杨，熊果疣柄（L. manzanitae）喜干暖南坡马醉木。',
      mapTips: '此模型已对 NLCD 阔叶/溪岸林地类与暖阳缓坡额外加权！同时务必打开「iNat 实拍点」定位已知的白桦与颤杨群落。',
      idTraits:
        '半球至枕状褐/橙褐色菌盖，白至灰白色细密海绵菌管，较细长硬直的菌柄表面布满竖排凸起的黑/褐色粗糙小疣点（scabers），切开菌肉常缓慢变粉灰或蓝灰。',
      safetyWarning:
        '重要食用警示：北美尤其橙盖/红盖疣柄牛肝菌（山杨/熊果伴生种）近年存在不少肠胃不适（恶心/腹泻）案例；仅建议采食幼嫩坚实的白桦种（L. scabrum），且必须切片高温彻底煮熟至少 15–20 分钟，首次务必极少量试吃！',
    },
    guideEn: {
      tagline:
        'Distinctive boletes with dark sandpaper-like stalk scabers, tightly bound to birch, aspen, or madrone/manzanita.',
      seasonDetail:
        'Starts late August in high East-slope aspen groves, continuing Sep–Nov across lowland birch woods, wetland edges, and warm madrone slopes.',
      habitat:
        'Gentle (<18%) sunlit hardwood edges and riparian groves: L. scabrum with birch, L. insigne with aspen, and L. manzanitae with madrone/manzanita.',
      mapTips:
        'Gives an affinity boost to NLCD deciduous/riparian hardwood classes and warm gentle benches; pair with iNaturalist points to locate birch/aspen stands.',
      idTraits:
        'Dome to cushion brown/orange-brown cap, fine whitish-gray pores, slender firm stipe studded with vertical rows of dark rough scabers; flesh often stains pinkish-gray to slate.',
      safetyWarning:
        'IMPORTANT CAUTION: North American orange/red-capped Leccinum species (aspen/madrone associates) have caused notable GI upsets. Stick to young firm birch boletes (L. scabrum), slice thin, cook thoroughly for 15–20+ minutes, and try a tiny portion first.',
    },
  },
  {
    id: 'morel',
    name: '火烧羊肚菌',
    shortName: '火烧羊肚菌',
    englishName: 'Burn Morel',
    shortNameEn: 'Burn Morel',
    scientificName: 'Morchella spp.',
    emoji: '🔥',
    accentColor: '#54e36c',
    inatTaxonIds: '56830',
    inatColor: '#22c55e',
    peakMonths: [4, 5, 6],
    seasonSummary: '4 月 – 6 月（次年火场）',
    seasonSummaryEn: 'Apr – Jun (1-Yr Burns)',
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
      { label: '低', labelEn: 'Low', color: '#96b8a2' },
      { label: '中低', labelEn: 'Mod-Low', color: '#478e60' },
      { label: '中等', labelEn: 'Moderate', color: '#0eab8c' },
      { label: '中高', labelEn: 'Mod-High', color: '#54e36c' },
      { label: '极高', labelEn: 'Prime', color: '#eef35d' },
    ],
    presetOverlays: ['wildfires-2025', 'wildfires-2024', 'noaa-snow'],
    guide: {
      tagline: '北美春季最具传奇色彩的采菇盛宴，专攻前一年的野火针叶林火烧迹地。',
      seasonDetail: '4 月下旬从低海拔（2,000–3,500 ft）开启，5–6 月随融雪与土温升至 50–55°F 逐级上移至 6,500 ft。',
      habitat: '前一年过火的针叶林（花旗松、冷杉、云杉、黄松），偏爱中度过火、北/偏北保水坡面与 5–25% 缓坡。',
      mapTips: '开启「仅火场内」+「合法林地」，系统会自动执行「NIFC 火场 ∩ 合法公共林地」双重过滤并逐像素计算火场内热区。',
      idTraits: '蜂窝状深凹坑菌盖，纵切从顶到底完全中空，菌盖下缘直接贴合菌柄。',
      safetyWarning:
        '务必纵切确认完全中空！严禁采食实心或棉絮状填充、脑回褶皱的毒假羊肚菌（Gyromitra esculenta 等），且所有羊肚菌必须彻底熟透后食用。',
    },
    guideEn: {
      tagline:
        "North America's legendary spring mushroom flush, targeting previous-year conifer wildfire burn scars.",
      seasonDetail:
        'Starts late April at lower burn elevations and climbs steadily through May–June as snow retreats and soil warms to 50–55°F (10–13°C).',
      habitat:
        'Previous-season burned conifer forests (Douglas-fir, true firs, spruce, ponderosa pine), favoring moderate burn severity, north-facing slopes, and 5–25% benches.',
      mapTips:
        'Enable Burn Scars Only + Legal Land to intersect NIFC wildfire perimeters with legal public lands and score micro-terrain inside each burn.',
      idTraits:
        'Deep honeycomb-pitted cap attached cleanly to the stem; when sliced lengthwise, 100% hollow from cap apex to stem base.',
      safetyWarning:
        'ALWAYS slice lengthwise to verify completely hollow! Never eat solid, cotton-stuffed, brain-lobed False Morels (Gyromitra spp.), and always cook true morels thoroughly.',
    },
  },
];

export function getSpeciesProfile(id: SpeciesId): SpeciesProfile {
  return SPECIES_CATALOG.find((s) => s.id === id) || SPECIES_CATALOG[0];
}

export function getSpeciesDisplayName(profile: SpeciesProfile, lang: Lang): string {
  return lang === 'en' ? profile.englishName : profile.name;
}

export function getSpeciesShortName(profile: SpeciesProfile, lang: Lang): string {
  return lang === 'en' ? profile.shortNameEn : profile.shortName;
}

export function getSpeciesSeasonSummary(profile: SpeciesProfile, lang: Lang): string {
  return lang === 'en' ? profile.seasonSummaryEn : profile.seasonSummary;
}

export function getSpeciesElevSummary(
  profile: SpeciesProfile,
  lang: Lang,
  units: UnitSettings,
): string {
  const range = formatElevationRange(profile.defaults.minElevFt, profile.defaults.maxElevFt, units);
  const note = lang === 'en' ? profile.elevSummaryNoteEn : profile.elevSummaryNote;
  return note ? `${range} (${note})` : range;
}

export function getSpeciesGuide(profile: SpeciesProfile, lang: Lang): SpeciesGuideText {
  return lang === 'en' ? profile.guideEn : profile.guide;
}

export function getCurrentSeasonStatus(
  peakMonths: number[],
  lang: Lang = 'zh',
): {
  label: string;
  tone: 'peak' | 'shoulder' | 'off';
} {
  const m = new Date().getMonth() + 1;
  if (peakMonths.includes(m)) {
    return { label: lang === 'en' ? 'Peak Season' : '当前盛季', tone: 'peak' };
  }
  const prev = m === 1 ? 12 : m - 1;
  const next = m === 12 ? 1 : m + 1;
  if (peakMonths.includes(prev) || peakMonths.includes(next)) {
    return { label: lang === 'en' ? 'Shoulder' : '临近/尾声', tone: 'shoulder' };
  }
  return { label: lang === 'en' ? 'Off-Season' : '非当季', tone: 'off' };
}
