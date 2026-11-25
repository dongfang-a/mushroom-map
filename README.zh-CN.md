# MushroomMap — PNW 野外采菇与火烧迹地地图

[English](./README.md) | **简体中文**

一个 **100% 纯静态前端、零付费 Token、支持 PWA 主屏幕安装** 的太平洋西北地区（PNW / 华盛顿州与俄勒冈州）野外采菇生境 GIS 地图应用。

🌐 **在线访问**：[https://dongfang-a.github.io/mushroom-map/](https://dongfang-a.github.io/mushroom-map/)

---

## 核心功能

- **14 种 PNW 热门野生食用菌实时生境与生态分区推演**
  - 覆盖：冬鸡油菌（Yellowfoot）、刺猬菌（Hedgehog）、黑喇叭菌（Black Trumpet）、野生平菇（Oyster）、熊头猴头菇（Bear's Head Tooth）、黄金/白鸡油菌（Chanterelle）、美洲松茸（Matsutake）、**美味牛肝菌（秋）（*Boletus edulis*）**、**美味牛肝菌（春）（*Boletus rex-veris*）**、绒盖牛肝菌（Fib King / *Boletus fibrillosus*）、丽柄牛肝菌（Admirable Bolete / *Aureoboletus mirabilis*）、虎掌菌（Hawk's Wing / *Sarcodon imbricatus*）、疣柄牛肝菌（Leccinum）与火烧羊肚菌（Burn Morel）。
  - 基于浏览器端 Canvas 实时合成地形高程、坡度、坡向、地形凹凸度（TPI）、树冠郁闭度（NLCD TCC）、地类掩膜（NLCD 2021 Land Cover，自动剔除水体与城镇）、DEM 水文整平湖面保护、**Cascade 东西坡与海岸雾带生态区扣分模型**及合法林地边界。
- **Cascade 东西坡生态区自动评分 + 分水岭参考线**
  - 依据太平洋海岸雾带、Cascade 西坡雨林带、分水岭高带与 Cascade 东坡雨影区自动计算各菌种平滑区域加/扣分（如美味牛肝菌（春）与东坡颤杨疣柄偏向东坡，冬鸡油菌/丽柄/绒盖/秋牛肝偏向西坡与海岸，松茸兼容东坡火山带与海岸沙丘）。
  - 支持在图层抽屉中叠加「**Cascade 分水岭参考线**」并按需一键手动锁定「**全区 / 仅西坡 / 仅东坡**」。
- **中英文双语、自由度量衡与桌面图标创建（⚙️ 设置齿轮）**
  - 默认跟随浏览器/系统语言（`跟随系统`），可随时手动切换 **简体中文** 或 **English**。
  - 支持 **跟随系统 / 英制（US）/ 公制（SI）** 一键预设，并可逐项自定义：**海拔（`ft` / `m`）**、**温度（`°F` / `°C`）**、**降雨量（`in` / `mm`）**、**距离与地图比例尺（`mi` / `km`）**、**火场面积（`ac` / `ha`）**。
  - 内置 **「创建桌面 / 主屏幕图标」** 入口：Chrome/Edge 自动调起原生 PWA 安装弹窗，iOS Safari 与微信内置浏览器自动展示分步指引。
- **画面常驻「当前有效地图与叠加图层」提示条**
  - 实时显示当前底图和每一个已开启的叠加图层及对应色点，支持一键 `×` 关闭任意叠加层，再也不会疑惑地图为什么花花绿绿。
- **全局筛选控制与合法林地 AND 过滤**
  - 菌种透明度、筛选强度（0%–100%）、`1Hz` 闪烁对比、高反差雷达色带与轮廓描边，以及一键 **合法林地**（USGS PAD-US）AND 过滤。
- **当季智能分组与离线 3 角度辨识图鉴**
  - 按当前月份自动分为「当季 / 季初·尾声 / 非当季」，内置 12 个月出菇日历与 **42 张（14 种 × 3 视角）离线实拍参考图**及有毒混淆种警示。
- **点选 7 因子深度诊断与本地航点**
  - 单击地图即可查询该点地类、PNW 生态分区适配度、实时海拔、坡度坡向、树冠郁闭度、微地形、USDA NRCS 土壤质地与排水性、Open-Meteo 24h/7d 降雨与土温、PAD-US 公共林地合法性及火烧历史，并支持保存个人采菇点位。

---

## 公开数据源说明

本项目**完全使用公开免费政府与社区 GIS 服务**，不含任何私有 API、商业抓取数据或付费 Token：

| 类别 | 数据来源 |
| :--- | :--- |
| 底图瓦片 | USGS The National Map (`USGSTopo`)、Esri World Imagery / World Topo、OpenTopoMap、OpenStreetMap |
| 地形高程 | AWS Mapzen Terrarium Open Data、USGS 3DEP Elevation (`elevation.nationalmap.gov`) |
| 植被与地类 | MRLC NLCD 2021 Tree Canopy Cover & Land Cover WMS (`www.mrlc.gov`) |
| 土壤与水系 | USDA NRCS Soil Data Access (WMS & Tabular REST)、USGS NHD (`hydro.nationalmap.gov`) |
| 公共林地与野火 | USGS PAD-US Public Access、NIFC WFIGS / InterAgency Fire Perimeters、USFS EDW |
| 降雨、积雪与气象 | NOAA RFC QPE & NOHRSC Snow Analysis、Open-Meteo Forecast API |
| 物种观测与图鉴 | iNaturalist Public API (`api.inaturalist.org`)；内置 36 张参考图均标明 iNaturalist CC0 / CC-BY / CC-BY-SA / CC-BY-NC 署名或用户自供参考图 |

---

## 本地开发与构建

```bash
# 安装依赖
npm install

# 启动本地开发服务器
npm run dev

# TypeScript 类型检查 + 生产构建（输出到 dist/）
npm run build

# 预览生产构建
npm run preview
```

---

## 技术栈

- **框架**：React 18 + TypeScript + Vite 5 + Lucide React
- **地图引擎**：MapLibre GL JS 4（自定义 `addProtocol` 客户端实时栅格生境瓦片合成引擎）
- **离线能力**：Web App Manifest + Service Worker (`public/sw.js`)

---

## 安全免责声明

野生菌类存在剧毒混淆种，本应用提供的生境热力与图文参考仅供路线规划与学习研究，**绝不构成可食用性鉴定依据**。采摘前请务必结合当地法规许可（如国家森林采菇许可证）并经专业菌类鉴别确认。
