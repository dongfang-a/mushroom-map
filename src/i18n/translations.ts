import type { Lang, LangPref, LegalityRuleKey, SoilInfo } from '../types/map';

export function detectSystemLang(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const list =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language || 'en'];
  for (const tag of list) {
    const lower = String(tag || '').toLowerCase();
    if (lower.startsWith('zh')) return 'zh';
    if (lower.startsWith('en')) return 'en';
  }
  return 'en';
}

export function resolveLang(pref: LangPref): Lang {
  if (pref === 'zh' || pref === 'en') return pref;
  return detectSystemLang();
}

export const MONTH_SHORT_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatMonthLabel(month: number, lang: Lang): string {
  if (lang === 'zh') return `${month} 月`;
  return MONTH_SHORT_EN[month - 1] || String(month);
}

export function localizeSoilBadge(tier: SoilInfo['matsutakeTier'], lang: Lang): string | null {
  if (tier === 'prime') return lang === 'zh' ? '松茸砂/火山灰土' : 'Prime Sand / Pumice';
  if (tier === 'moderate') return lang === 'zh' ? '较适宜砂砾土' : 'Sandy Loam';
  if (tier === 'weak') return lang === 'zh' ? '弱适宜 · 冰碛土' : 'Marginal Till';
  return null;
}

export function localizeLegality(
  ruleKey: LegalityRuleKey,
  lang: Lang,
): { statusLabel: string; ruleHint: string } {
  if (lang === 'zh') {
    switch (ruleKey) {
      case 'prohibited':
        return {
          statusLabel: '禁止采摘 / 保护禁区',
          ruleHint: '饮用水源保护区、科研样地、自然保护区、保护地役权、部落领地或关闭区禁止采摘野生菌',
        };
      case 'nps-rainier':
        return {
          statusLabel: '允许限量自用采摘 (Mount Rainier 国家公园)',
          ruleHint: '36 CFR 2.1(c) 特批：每人每日限 1 加仑个人自用，禁止商用，Paradise/Sunrise 等敏感区严禁离道',
        };
      case 'nps-olympic':
        return {
          statusLabel: '允许限量自用采摘 (Olympic 国家公园)',
          ruleHint: '36 CFR 2.1(c) 特批：每人每日限 1 夸脱（与浆果共享总量），自然步道 200 ft 内禁采',
        };
      case 'nps-north-cascades':
        return {
          statusLabel: '允许限量自用采摘 (North Cascades 国家公园)',
          ruleHint: '36 CFR 2.1(c) 特批：每人每日限 1 夸脱个人自用，须用刀切勿连根拔起',
        };
      case 'usfs-wilderness':
        return {
          statusLabel: '允许个人自用采摘 (USFS 荒野区)',
          ruleHint: '美国国家森林荒野区通常允许少量个人自用采摘（禁机动车辆，部分森林需免费/付费许可）',
        };
      case 'usfs':
        return {
          statusLabel: '允许个人自用采摘 (USFS 国家森林)',
          ruleHint: 'USFS 国家森林普遍允许个人自用采菇（通常每日 1–2 加仑，出发前建议确认当地是否需免费许可）',
        };
      case 'blm':
        return {
          statusLabel: '允许个人自用采摘 (BLM 公共土地)',
          ruleHint: 'BLM 公共林地通常允许少量个人自用采摘（商用须申请许可）',
        };
      case 'state-forestry':
        return {
          statusLabel: '允许个人自用采摘 (州立森林 / DNR)',
          ruleHint: 'OR 州立森林（如 Tillamook）与 WA DNR 州立林地普遍允许个人自用采菇（WA 通常需 Discover Pass 停车证）',
        };
      case 'nps-other':
        return {
          statusLabel: '严格限量 / 国家公园规定',
          ruleHint: '部分国家公园（如 Olympic / Mt. Rainier）限个人每日 1 夸脱，部分公园完全禁止，务必核查公园条例',
        };
      case 'state-park':
        return {
          statusLabel: '受限 / 州立公园规则',
          ruleHint: '部分 OR/WA 州立公园允许少量自用，但部分公园或保护单元禁止采摘，请查看园方告示',
        };
      default:
        return {
          statusLabel: '受限公共区域 / 需核查规定',
          ruleHint: '市县公园、保护绿地或受限访问区请先确认当地是否允许采摘野生菌',
        };
    }
  }

  switch (ruleKey) {
    case 'prohibited':
      return {
        statusLabel: 'No Foraging / Protected Area',
        ruleHint:
          'Municipal watersheds, research natural areas, preserves, conservation easements, tribal lands, or closed areas prohibit mushroom harvesting.',
      };
    case 'nps-rainier':
      return {
        statusLabel: 'Limited Personal Use (Mount Rainier NP)',
        ruleHint:
          '36 CFR 2.1(c): up to 1 gallon per person/day for personal use (non-commercial); stay on trails in sensitive subalpine zones like Paradise/Sunrise.',
      };
    case 'nps-olympic':
      return {
        statusLabel: 'Limited Personal Use (Olympic NP)',
        ruleHint:
          '36 CFR 2.1(c): up to 1 quart per person/day (combined with berries); harvesting prohibited within 200 ft of nature trails.',
      };
    case 'nps-north-cascades':
      return {
        statusLabel: 'Limited Personal Use (North Cascades NP)',
        ruleHint:
          '36 CFR 2.1(c): up to 1 quart per person/day for personal use; cut cleanly at the base.',
      };
    case 'usfs-wilderness':
      return {
        statusLabel: 'Personal Foraging Allowed (USFS Wilderness)',
        ruleHint:
          'National Forest wilderness generally allows incidental personal foraging (no motorized access; check district permit rules).',
      };
    case 'usfs':
      return {
        statusLabel: 'Personal Foraging Allowed (USFS National Forest)',
        ruleHint:
          'USFS National Forests generally allow personal-use foraging (typically 1–2 gal/day; check whether your ranger district requires a free permit).',
      };
    case 'blm':
      return {
        statusLabel: 'Personal Foraging Allowed (BLM Public Land)',
        ruleHint:
          'BLM public lands generally allow incidental personal-use mushroom harvesting (commercial harvest requires a permit).',
      };
    case 'state-forestry':
      return {
        statusLabel: 'Personal Foraging Allowed (State Forest / DNR)',
        ruleHint:
          'OR State Forests (e.g., Tillamook) and WA DNR lands generally allow personal foraging (WA requires a Discover Pass for parking).',
      };
    case 'nps-other':
      return {
        statusLabel: 'Restricted / National Park Rules',
        ruleHint:
          'Some National Parks allow 1 quart/day while others ban foraging completely; always verify park-specific regulations.',
      };
    case 'state-park':
      return {
        statusLabel: 'Restricted / State Park Rules',
        ruleHint:
          'Some OR/WA State Parks allow small personal limits while natural preserves prohibit harvesting; check posted signs.',
      };
    default:
      return {
        statusLabel: 'Restricted Public Land / Verify Rules',
        ruleHint:
          'County/city parks, greenbelts, or restricted areas may prohibit foraging — verify local ordinances before picking.',
      };
  }
}

export const UI_TEXT = {
  zh: {
    pageTitle: 'MushroomMap — 野外采菇与火烧迹地地图',
    legalLandBtn: '合法林地',
    offSeasonBadge: '非当季',
    seasonPeakGroup: (m: number) => `✅ 当前当季（${m} 月盛产）`,
    seasonShoulderGroup: '⏳ 季初 · 尾声（临近窗口）',
    seasonOffGroup: '⛔ 非当季（仅适合提前踩点）',
    speciesCountUnit: (n: number) => `${n} 种`,
    seasonPeakChip: '当季盛产',
    seasonShoulderChip: '⏳ 尾声',
    seasonOffChip: '⛔ 非当季',
    legendLegalSuffix: ' · 仅合法区',
    legendGuideBtn: '特色',
    legendOpacity: '蘑菇透明度',
    legendStrength: '筛选强度',
    legendBlinkOn: '1Hz 闪烁中',
    legendBlinkOff: '1Hz 闪烁',
    legendContrastOn: '高反差色',
    legendContrastOff: '经典菌色',
    legendLegalNote: '仅显示合法采摘区 (AND 过滤)',
    activeMapPrefix: '底图',
    activeLayersCount: (n: number) => `${n} 叠加`,
    activeLayersNone: '无叠加层',
    activeLayersCollapse: '收起当前图层提示',
    activeLayersExpand: '展开当前图层提示',
    activeLayersOpenDrawer: '管理图层',
    activeLayersDisableTip: (name: string) => `关闭「${name}」`,
    toastContrastOn: '已开启高反差热成像色阶（全底图高对比）',
    toastContrastOff: '已切换回菌种经典配色（保留 1px 深色描边）',
    toastBlinkOn: '⚡ 已开启 1Hz 闪烁对比（透视底图等高线/林道）',
    toastBlinkOff: '已关闭 1Hz 闪烁对比',
    toastBasemapSwitched: (name: string) => `已切换底图：${name}`,
    toastOverlayLoadFail: (name: string) => `${name} 加载失败，请检查网络`,
    toastLegalOn: '合法林地 AND 过滤已开启：仅显示合法林地内蘑菇地图',
    toastLegalOff: '合法林地过滤已关闭：显示全区域蘑菇地图',
    toastFlewFire: (name: string, year: number, area: string) => `已定位至 ${name} (${year} · ${area})`,
    toastFlewSpot: (name: string) => `已定位至：${name}`,
    toastFlewInat: (place: string, date: string) => `iNat 实拍点：${place} (${date})`,
    toastGpsDenied: '请在系统设置中授予定位权限',
    toastGpsLocated: '已定位至当前位置',
    toastGpsFailed: '无法获取当前 GPS 位置',
    toastWaypointSaved: (name: string) => `已保存采菇点位：${name}`,
    toastCoordsCopied: (text: string) => `已复制坐标：${text}`,
    toastOverlayHidden: (name: string) => `已关闭图层：${name}`,
    // Drawer
    drawerTitle: '地图资源与图层',
    tabLayers: '图层',
    tabSpots: '实拍',
    tabFires: '火场',
    tabBasemaps: '底图',
    catActiveCount: (n: number) => `(${n} 开启)`,
    speciesModelSuffix: ' · 实时热力模型',
    loadingSuffix: ' · 加载中...',
    opacityLabel: '透明度',
    filterStrengthLabel: '筛选强度',
    highContrastToggle: '高反差热成像色阶（全底图高对比）',
    blinkToggle: '⚡ 1Hz 闪烁对比（透视底图）',
    burnScarOnlyToggle: '仅限火烧迹地内渲染 (Burn Scars)',
    useCanopyToggle: '融合 NLCD 30m 密林树冠',
    minCanopyLabel: '最低郁闭度',
    minElevLabel: '海拔下限',
    maxElevLabel: '海拔上限',
    elevBandMinLabel: '最低海拔',
    elevBandMaxLabel: '最高海拔',
    inatHeader: (emoji: string, name: string) => `iNaturalist 实拍 · ${emoji} ${name}`,
    inatRecordsCount: (n: string) => `(${n} 条)`,
    inatRange30d: '近 30 天',
    inatRange365d: '近 1 年',
    inatRangeAll: '历年全部',
    inatViewportToggle: '仅查询当前屏幕视野内实拍',
    inatSortRecent: '按时间最新',
    inatSortDistance: '✚ 按距中心最近',
    inatLoading: '正在从 iNaturalist 拉取最新研究级实拍记录...',
    inatEmpty: '该时间段/范围内暂无实拍记录，可切换到「近 1 年」或「历年全部」。',
    gpsObscured: '模糊隐私坐标',
    gpsExact: '精确 GPS',
    distFromCenter: '✚ 距中心',
    curatedSpotsHeader: (n: number) => `PNW 精选公共林区书签 (${n})`,
    fireSearchPlaceholder: '搜索火场名 (如 Park, Big Grass...)',
    allStates: '全部州',
    allRanks: '全评级',
    rankOption: (r: string) => `${r} 级`,
    firesLoading: '正在从 NIFC 拉取北美野火过火边界...',
    firesEmpty: '暂无已开启火场（在顶部切换「火烧羊肚菌」或在「图层」中开启野火图层即可加载）。',
    basemapsNote: '所有底图均使用免费公开官方瓦片源，无需 Mapbox 收费 Token。',
    // Point Inspector
    inspectorTitleSuffix: ' · 微生境详情',
    inatCardHeader: (date: string) => `iNaturalist 实拍 · ${date}`,
    inatOriginalLink: '原帖',
    realtimeSuitability: (name: string, sci: string) => `实时${name}适宜度 (${sci})`,
    calculating: '计算中...',
    idealPrefix: '理想',
    metricElev: '海拔',
    metricSlope: '坡度',
    metricAspect: '坡向',
    metricCanopy: '树冠郁闭',
    microtopoLabel: '微地形：',
    concavityLabel: '凹度',
    weatherStripTitle: '气象与土温',
    rain24hLabel: '24h 雨',
    rain7dLabel: '7日雨',
    soilTempLabel: '土温',
    soilMoistLabel: '含水',
    usdaSoilPrefix: 'USDA 土壤：',
    fireRankPrefix: '评级',
    fireBurnedArea: '过火面积',
    fireStatePrefix: '州',
    fireStartPrefix: '起火',
    publicLandFallback: '公共土地',
    privateLandWarnTitle: '未命中合法公共林地（可能为私有林地 / 商业林场）',
    privateLandWarnBody: '：请勿擅自进入，采摘前务必确认权属或持有林场通行许可。',
    saveWaypointBtn: '收藏为采菇点位',
    wpNamePlaceholder: (name: string) => `点位名称（如：${name}黄金点）`,
    wpDefaultName: (name: string) => `${name} 采菇点`,
    wpOtherSpecies: '其他菌种',
    wpOtherShort: '其他',
    wpNotesPlaceholder: '备注（腐木/土壤/停车点）',
    confirmSave: '确认保存',
    cancel: '取消',
    // Species Guide Modal
    guidePhotoTitle: (name: string) => `${name} · 3 角度辨识图鉴`,
    seasonHeadlinePeak: (m: string) => `✅ 当前正是采摘盛季 · ${m}推荐出山`,
    seasonHeadlineShoulder: (m: string) => `⏳ 当前为季初 / 尾声 · ${m}局部海拔零星出菇`,
    seasonHeadlineOff: (m: string, range: string) => `⛔ 当前非当季（当前 ${m} · 盛季 ${range}）`,
    seasonSubPeak: (range: string) => `本月命中黄金窗口（${range}），可结合热力图与近 30 天实拍直接选点`,
    seasonSubShoulder: (range: string) => `临近出菇边缘（盛季 ${range}），建议重点看低/高海拔临界带`,
    seasonSubOff: '此时野外极难遇到该菌种，当前更适合提前踩点研究地形与往年实拍热区',
    monthTooltip: (m: number, peak: boolean, now: boolean) =>
      `${m} 月${peak ? '（盛季）' : '（非盛季）'}${now ? ' · 当前月份' : ''}`,
    photoDemoBtnTitle: '查看 3 角度辨识图鉴（离线内置）',
    photoDemoBtnSub: '俯视（上下） · 侧面 · 仰视（下上/剖面）实拍对比',
    guideSeasonPill: '采摘时节',
    guideElevPill: '典型海拔带',
    guideSeasonBlock: '时节与气候规律',
    guideHabitatBlock: '生境、宿主与土壤',
    guideMapTipsBlock: '地图选点攻略',
    guideIdTraitsBlock: '野外辨识要点',
    guideSafetyBlock: '毒菌混淆警示',
    guidePhotoSafetyBlock: '采食安全提醒',
    photoZoomHint: '点击放大',
    photoSourcePrefix: '离线实拍来源：',
    backToTextGuide: '返回文字详解',
    startMapBtn: '开始查看地图',
    gotItBtn: '知道了，开始查看地图',
    // Waypoints Sheet
    waypointsTitle: (n: number) => `我的采菇点位 (${n})`,
    waypointsEmpty:
      '暂无收藏点位。点击地图任意位置查看海拔/坡度/坡向与菌种得分后，即可点击「收藏为采菇点位」保存在本机。',
    // Settings Modal
    settingsTitle: '语言与度量衡设置',
    settingsSubtitle: '偏好自动保存在本机，切换立即生效',
    settingsLangHeading: '界面语言 (Language)',
    settingsSystemAuto: '跟随系统',
    settingsDetected: (val: string) => `当前系统：${val}`,
    settingsUnitsHeading: '度量衡预设',
    settingsImperial: '英制 (US)',
    settingsMetric: '公制 (SI)',
    settingsCustomBadge: '已自定义',
    settingsPerUnitHeading: '单项度量衡微调',
    unitElevLabel: '海拔高度',
    unitTempLabel: '温度',
    unitRainLabel: '降雨量',
    unitDistLabel: '距离与比例尺',
    unitAreaLabel: '面积（火烧迹地）',
    optFt: '英尺 (ft)',
    optM: '米 (m)',
    optF: '华氏 (°F)',
    optC: '摄氏 (°C)',
    optIn: '英寸 (in)',
    optMm: '毫米 (mm)',
    optMi: '英里 (mi)',
    optKm: '公里 (km)',
    optAc: '英亩 (ac)',
    optHa: '公顷 (ha)',
    settingsDone: '完成',
  },
  en: {
    pageTitle: 'MushroomMap — PNW Foraging & Wildfire GIS',
    legalLandBtn: 'Legal Land',
    offSeasonBadge: 'Off-Season',
    seasonPeakGroup: (m: number) => `✅ Peak Season (${MONTH_SHORT_EN[m - 1]})`,
    seasonShoulderGroup: '⏳ Early / Late Shoulder',
    seasonOffGroup: '⛔ Off-Season (Scouting Only)',
    speciesCountUnit: (n: number) => `${n}`,
    seasonPeakChip: 'In Season',
    seasonShoulderChip: '⏳ Shoulder',
    seasonOffChip: '⛔ Off-Season',
    legendLegalSuffix: ' · Legal Only',
    legendGuideBtn: 'Guide',
    legendOpacity: 'Heatmap Opacity',
    legendStrength: 'Selectivity',
    legendBlinkOn: '1Hz Blinking',
    legendBlinkOff: '1Hz Blink',
    legendContrastOn: 'High Contrast',
    legendContrastOff: 'Species Color',
    legendLegalNote: 'Legal Public Foraging Only (AND Mask)',
    activeMapPrefix: 'Map',
    activeLayersCount: (n: number) => `${n} active`,
    activeLayersNone: 'No overlays',
    activeLayersCollapse: 'Collapse active layers bar',
    activeLayersExpand: 'Expand active layers bar',
    activeLayersOpenDrawer: 'Manage layers',
    activeLayersDisableTip: (name: string) => `Hide "${name}"`,
    toastContrastOn: 'High-contrast radar palette enabled',
    toastContrastOff: 'Switched back to species palette (1px outline kept)',
    toastBlinkOn: '⚡ 1Hz opacity blink ON (peek basemap contours/roads)',
    toastBlinkOff: '1Hz opacity blink OFF',
    toastBasemapSwitched: (name: string) => `Basemap: ${name}`,
    toastOverlayLoadFail: (name: string) => `Failed to load ${name} — check network`,
    toastLegalOn: 'Legal Land AND mask ON: showing legal foraging zones only',
    toastLegalOff: 'Legal Land mask OFF: showing full terrain heatmap',
    toastFlewFire: (name: string, year: number, area: string) => `Located ${name} (${year} · ${area})`,
    toastFlewSpot: (name: string) => `Located: ${name}`,
    toastFlewInat: (place: string, date: string) => `iNat Sighting: ${place} (${date})`,
    toastGpsDenied: 'Please allow location access in system settings',
    toastGpsLocated: 'Centered on your GPS location',
    toastGpsFailed: 'Unable to acquire GPS location',
    toastWaypointSaved: (name: string) => `Saved waypoint: ${name}`,
    toastCoordsCopied: (text: string) => `Copied coordinates: ${text}`,
    toastOverlayHidden: (name: string) => `Turned off: ${name}`,
    // Drawer
    drawerTitle: 'Map Layers & Resources',
    tabLayers: 'Layers',
    tabSpots: 'Sightings',
    tabFires: 'Fires',
    tabBasemaps: 'Basemap',
    catActiveCount: (n: number) => `(${n} on)`,
    speciesModelSuffix: ' · Live Habitat Model',
    loadingSuffix: ' · Loading...',
    opacityLabel: 'Opacity',
    filterStrengthLabel: 'Selectivity',
    highContrastToggle: 'High-Contrast Radar Palette',
    blinkToggle: '⚡ 1Hz Blink Comparison (See Basemap)',
    burnScarOnlyToggle: 'Burn Scars Only (Wildfire Mask)',
    useCanopyToggle: 'Blend NLCD 30m Tree Canopy',
    minCanopyLabel: 'Min Canopy',
    minElevLabel: 'Min Elev',
    maxElevLabel: 'Max Elev',
    elevBandMinLabel: 'Min Elev',
    elevBandMaxLabel: 'Max Elev',
    inatHeader: (emoji: string, name: string) => `iNaturalist · ${emoji} ${name}`,
    inatRecordsCount: (n: string) => `(${n})`,
    inatRange30d: '30 Days',
    inatRange365d: '1 Year',
    inatRangeAll: 'All Time',
    inatViewportToggle: 'Current map viewport only',
    inatSortRecent: 'Most Recent',
    inatSortDistance: '✚ Nearest to Center',
    inatLoading: 'Fetching research-grade sightings from iNaturalist...',
    inatEmpty: 'No sightings in this range/view — try "1 Year" or "All Time".',
    gpsObscured: 'Obscured coords',
    gpsExact: 'Exact GPS',
    distFromCenter: '✚ Center',
    curatedSpotsHeader: (n: number) => `PNW Curated Public Forests (${n})`,
    fireSearchPlaceholder: 'Search fire name (e.g. Park, Big Grass...)',
    allStates: 'All States',
    allRanks: 'All Ranks',
    rankOption: (r: string) => `Rank ${r}`,
    firesLoading: 'Fetching NIFC wildfire perimeters...',
    firesEmpty: 'No active fire layers (switch to Burn Morel or enable a Wildfire layer).',
    basemapsNote: 'All basemaps use free public official tiles — zero paid Mapbox tokens.',
    // Point Inspector
    inspectorTitleSuffix: ' · Micro-Habitat',
    inatCardHeader: (date: string) => `iNaturalist Sighting · ${date}`,
    inatOriginalLink: 'Post',
    realtimeSuitability: (name: string, sci: string) => `${name} Suitability (${sci})`,
    calculating: 'Calculating...',
    idealPrefix: 'Ideal',
    metricElev: 'Elevation',
    metricSlope: 'Slope',
    metricAspect: 'Aspect',
    metricCanopy: 'Canopy',
    microtopoLabel: 'Landform: ',
    concavityLabel: 'TPI',
    weatherStripTitle: 'Weather & Soil',
    rain24hLabel: '24h',
    rain7dLabel: '7d Rain',
    soilTempLabel: 'Soil',
    soilMoistLabel: 'Moist',
    usdaSoilPrefix: 'USDA Soil: ',
    fireRankPrefix: 'Rank',
    fireBurnedArea: 'Burned',
    fireStatePrefix: 'State',
    fireStartPrefix: 'Started',
    publicLandFallback: 'Public Land',
    privateLandWarnTitle: 'Outside Legal Public Land (Likely Private / Timber)',
    privateLandWarnBody: ': Do not trespass — verify land ownership or permits before foraging.',
    saveWaypointBtn: 'Save as Foraging Waypoint',
    wpNamePlaceholder: (name: string) => `Waypoint name (e.g. ${name} Spot)`,
    wpDefaultName: (name: string) => `${name} Spot`,
    wpOtherSpecies: 'Other Mushroom',
    wpOtherShort: 'Other',
    wpNotesPlaceholder: 'Notes (logs, soil, parking...)',
    confirmSave: 'Save Waypoint',
    cancel: 'Cancel',
    // Species Guide Modal
    guidePhotoTitle: (name: string) => `${name} · 3-Angle Field Guide`,
    seasonHeadlinePeak: (m: string) => `✅ Peak Foraging Season · Great Time in ${m}`,
    seasonHeadlineShoulder: (m: string) => `⏳ Shoulder Season · Scattered Fruiting in ${m}`,
    seasonHeadlineOff: (m: string, range: string) => `⛔ Off-Season (${m} · Peak: ${range})`,
    seasonSubPeak: (range: string) =>
      `Right inside the prime window (${range}). Pair the heatmap with 30-day iNat sightings.`,
    seasonSubShoulder: (range: string) =>
      `Edge of fruiting window (Peak: ${range}). Focus on elevation transition bands.`,
    seasonSubOff:
      'Rare to find in the wild right now — best used for off-season terrain & historical scouting.',
    monthTooltip: (m: number, peak: boolean, now: boolean) =>
      `${MONTH_SHORT_EN[m - 1]} (${peak ? 'Peak' : 'Off-peak'})${now ? ' · Now' : ''}`,
    photoDemoBtnTitle: '3-Angle ID Photo Guide (Offline)',
    photoDemoBtnSub: 'Top · Side · Underside / Cross-Section Comparison',
    guideSeasonPill: 'Season',
    guideElevPill: 'Elevation Band',
    guideSeasonBlock: 'Seasonality & Weather',
    guideHabitatBlock: 'Habitat, Host Trees & Soil',
    guideMapTipsBlock: 'Map Scouting Tips',
    guideIdTraitsBlock: 'Field ID Traits',
    guideSafetyBlock: 'Lookalikes & Safety Warning',
    guidePhotoSafetyBlock: 'Foraging Safety Reminder',
    photoZoomHint: 'Tap to zoom',
    photoSourcePrefix: 'Offline photo credit: ',
    backToTextGuide: 'Back to Field Guide',
    startMapBtn: 'Explore Map',
    gotItBtn: 'Got It · Explore Map',
    // Waypoints Sheet
    waypointsTitle: (n: number) => `My Waypoints (${n})`,
    waypointsEmpty:
      'No saved waypoints yet. Tap anywhere on the map to inspect habitat metrics, then tap "Save as Foraging Waypoint".',
    // Settings Modal
    settingsTitle: 'Language & Units',
    settingsSubtitle: 'Saved locally — applies immediately across the map',
    settingsLangHeading: 'Language / 语言',
    settingsSystemAuto: 'Follow System',
    settingsDetected: (val: string) => `System: ${val}`,
    settingsUnitsHeading: 'Unit System Preset',
    settingsImperial: 'Imperial (US)',
    settingsMetric: 'Metric (SI)',
    settingsCustomBadge: 'Custom',
    settingsPerUnitHeading: 'Individual Units',
    unitElevLabel: 'Elevation',
    unitTempLabel: 'Temperature',
    unitRainLabel: 'Precipitation',
    unitDistLabel: 'Distance & Scale',
    unitAreaLabel: 'Burn Area',
    optFt: 'Feet (ft)',
    optM: 'Meters (m)',
    optF: 'Fahrenheit (°F)',
    optC: 'Celsius (°C)',
    optIn: 'Inches (in)',
    optMm: 'Millimeters (mm)',
    optMi: 'Miles (mi)',
    optKm: 'Kilometers (km)',
    optAc: 'Acres (ac)',
    optHa: 'Hectares (ha)',
    settingsDone: 'Done',
  },
} as const;
