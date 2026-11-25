import type { SpeciesId } from '../types/map';

export interface SpeciesPhotoItem {
  angle: 'top' | 'side' | 'underside';
  angleLabel: string;
  angleLabelEn: string;
  angleShort: string;
  angleShortEn: string;
  src: string;
  caption: string;
  captionEn: string;
  attribution: string;
}

export const SPECIES_DEMO_PHOTOS: Record<SpeciesId, SpeciesPhotoItem[]> = {
  yellowfoot: [
    {
      angle: 'top',
      angleLabel: '俯视（上下 · 菌盖与生境）',
      angleLabelEn: 'Top View (Cap & Habitat)',
      angleShort: '俯视 · 菌盖',
      angleShortEn: 'Top · Cap',
      src: './species-photos/yellowfoot/top.jpg',
      caption: '褐黄色薄漏斗状菌盖，中央微凹成脐状，常成群生于潮湿苔藓与针叶腐木旁。',
      captionEn:
        'Thin brownish-yellow funnel cap with a central dimple, fruiting in dense troops across damp moss and mossy conifer wood.',
      attribution: 'iNaturalist · @enspring (CC0)',
    },
    {
      angle: 'side',
      angleLabel: '侧面（整体株型与菌柄）',
      angleLabelEn: 'Side View (Profile & Stem)',
      angleShort: '侧面 · 株型',
      angleShortEn: 'Side · Profile',
      src: './species-photos/yellowfoot/side.jpg',
      caption: '细长鲜亮金黄色空心菌柄（柔韧不易断），多株簇生，与深色褐盖对比鲜明。',
      captionEn:
        'Slender bright golden-yellow hollow flexible stem growing in clusters, contrasting sharply with the darker brownish cap.',
      attribution: 'iNaturalist · @enspring (CC0)',
    },
    {
      angle: 'underside',
      angleLabel: '仰视（下上 · 假菌褶与菌柄）',
      angleLabelEn: 'Underside (False Gills & Stem)',
      angleShort: '仰视 · 菌褶',
      angleShortEn: 'Underside · Ridges',
      src: './species-photos/yellowfoot/underside.jpg',
      caption: '盖下为灰黄/烟灰色钝圆分叉假菌褶（皱脉），而非刀片状真菌褶；注意与剧毒盔孢伞区分。',
      captionEn:
        'Blunt, forked grayish-yellow false gills (vein-like ridges) rather than sharp true blades — always distinguish from deadly Galerina.',
      attribution: 'iNaturalist · @enspring (CC0)',
    },
  ],
  hedgehog: [
    {
      angle: 'top',
      angleLabel: '俯视（上下 · 菌盖与生境）',
      angleLabelEn: 'Top View (Cap & Habitat)',
      angleShort: '俯视 · 菌盖',
      angleShortEn: 'Top · Cap',
      src: './species-photos/hedgehog/top.jpg',
      caption: '淡橙至杏奶油色肉质菌盖，边缘常呈波浪不规则状，生于针叶腐殖层与厚苔藓地。',
      captionEn:
        'Pale apricot to creamy-buff fleshy wavy cap fruiting on conifer duff and lush forest moss.',
      attribution: 'iNaturalist · @alan_rockefeller (CC-BY)',
    },
    {
      angle: 'side',
      angleLabel: '侧面（整体株型与菌柄）',
      angleLabelEn: 'Side View (Profile & Stem)',
      angleShort: '侧面 · 株型',
      angleShortEn: 'Side · Profile',
      src: './species-photos/hedgehog/side.jpg',
      caption: '粗实淡色菌柄常略偏心，菌肉厚实脆嫩、极少生虫，耐冷霜冻前持续出菇。',
      captionEn:
        'Stout pale often slightly off-center stem with crisp bug-resistant flesh that thrives into cold early winter.',
      attribution: 'iNaturalist · @alan_rockefeller (CC-BY)',
    },
    {
      angle: 'underside',
      angleLabel: '仰视（下上 · 小齿刺特征）',
      angleLabelEn: 'Underside (Soft Spines / Teeth)',
      angleShort: '仰视 · 齿刺',
      angleShortEn: 'Underside · Teeth',
      src: './species-photos/hedgehog/underside.jpg',
      caption: '100% 核心鉴别点：菌盖背面长满柔软易脱落的乳白色小针刺（完全无菌褶），新手极安全。',
      captionEn:
        '100% key ID trait: underside covered in soft, brittle cream-colored teeth/spines (zero gills) — one of the safest beginner mushrooms.',
      attribution: 'iNaturalist · @alan_rockefeller (CC-BY)',
    },
  ],
  'black-trumpet': [
    {
      angle: 'top',
      angleLabel: '俯视（上下 · 喇叭口与内壁）',
      angleLabelEn: 'Top View (Hollow Funnel)',
      angleShort: '俯视 · 喇叭口',
      angleShortEn: 'Top · Funnel',
      src: './species-photos/black-trumpet/top.jpg',
      caption: '深黑至灰褐色中空漏斗喇叭口，内壁带细微鳞屑，极易融入黑土落叶保护色。',
      captionEn:
        'Charcoal-black to dark smoky-brown hollow horn with finely scaly inner walls that camouflage into damp dark duff.',
      attribution: 'iNaturalist · @chilipossum (CC-BY)',
    },
    {
      angle: 'side',
      angleLabel: '侧面（整体株型与苔藓生境）',
      angleLabelEn: 'Side View (Profile & Moss)',
      angleShort: '侧面 · 株型',
      angleShortEn: 'Side · Profile',
      src: './species-photos/black-trumpet/side.jpg',
      caption: '挺立的灰黑色花瓶/号角状子实体，盖柄一体无缝衔接，常成片藏于湿润苔藓洼地。',
      captionEn:
        'Upright vase/trumpet form seamlessly tapering from cap to stem, clustered inside damp mossy hollows.',
      attribution: 'iNaturalist · @dgwdoesthings (CC0)',
    },
    {
      angle: 'underside',
      angleLabel: '仰视（下上 · 外壁光滑产孢面）',
      angleLabelEn: 'Underside (Smooth Outer Wall)',
      angleShort: '仰视 · 外壁',
      angleShortEn: 'Outer Wall',
      src: './species-photos/black-trumpet/underside.jpg',
      caption: '外壁呈烟灰至褐灰色，光滑或仅有极浅钝皱纹，绝无真刀片菌褶，撕开中空带浓郁果香。',
      captionEn:
        'Ashy-gray to brownish smooth or faintly wrinkled outer fertile surface with zero gills and rich fruity aroma.',
      attribution: 'iNaturalist · @heymana77 (CC0)',
    },
  ],
  oyster: [
    {
      angle: 'top',
      angleLabel: '俯视（上下 · 扇形群生菌盖）',
      angleLabelEn: 'Top View (Clustered Fans)',
      angleShort: '俯视 · 菌盖',
      angleShortEn: 'Top · Caps',
      src: './species-photos/oyster/top.jpg',
      caption: '乳白至浅灰褐色厚肉扇形菌盖，层叠复瓦状群生于倒伏枯死的红桤木/杨树等阔叶木上。',
      captionEn:
        'Fleshy cream to pale tan fan-shaped caps growing in overlapping shelves on dead red alder, cottonwood, or maple trunks.',
      attribution: 'iNaturalist · @treegrow (CC-BY)',
    },
    {
      angle: 'side',
      angleLabel: '侧面（叠层群生姿态）',
      angleLabelEn: 'Side View (Shelf Cluster)',
      angleShort: '侧面 · 株型',
      angleShortEn: 'Side · Shelf',
      src: './species-photos/oyster/side.jpg',
      caption: '侧生于河谷阔叶枯木树干，厚肉饱满；切记只采阔叶木上的厚肉平菇，避开针叶木薄脆“天使之翼”。',
      captionEn:
        'Thick meaty shelves on riparian hardwood trunks — always verify hardwood host to avoid conifer-growing Angel Wings.',
      attribution: 'iNaturalist · @treegrow (CC-BY)',
    },
    {
      angle: 'underside',
      angleLabel: '仰视（下上 · 延生菌褶特征）',
      angleLabelEn: 'Underside (Decurrent Gills)',
      angleShort: '仰视 · 菌褶',
      angleShortEn: 'Underside · Gills',
      src: './species-photos/oyster/underside.jpg',
      caption: '洁白致密菌褶一直顺延下垂至短侧柄基部（延生），菌肉厚实带淡淡清甜茴香味。',
      captionEn:
        'Dense white decurrent gills running all the way down the short lateral stem stub, with thick flesh and mild anise scent.',
      attribution: 'iNaturalist · @cara-lisa (CC-BY)',
    },
  ],
  'lions-mane': [
    {
      angle: 'top',
      angleLabel: '俯视（上下 · 雪白簇团外观）',
      angleLabelEn: 'Top View (Snowy Cluster)',
      angleShort: '俯视 · 菌体',
      angleShortEn: 'Top · Mass',
      src: './species-photos/lions-mane/top.jpg',
      caption: '纯白至乳白色分枝珊瑚球状，生于高郁闭度老龄冷杉/铁杉粗大倒木，鲜白时口感最佳。',
      captionEn:
        'Pure white branched coral-like head growing on old-growth fir or hemlock logs; best harvested while snowy white.',
      attribution: 'iNaturalist · @cgmayers (CC0)',
    },
    {
      angle: 'side',
      angleLabel: '侧面（老林树干垂瀑姿态）',
      angleLabelEn: 'Side View (Cascading on Log)',
      angleShort: '侧面 · 株型',
      angleShortEn: 'Side · Log',
      src: './species-photos/lions-mane/side.jpg',
      caption: '如白色瀑布般侧挂在长满苔藓的粗大针叶枯木上，同一根倒木常连续多年在同一位置出菇。',
      captionEn:
        'Cascading like a white waterfall off a mossy nurse log; productive logs frequently fruit in the exact same spot for years.',
      attribution: 'iNaturalist · @michaelsmith5 (CC0)',
    },
    {
      angle: 'underside',
      angleLabel: '仰视（下上 · 冰柱状软齿刺）',
      angleLabelEn: 'Underside (Icicle Spines)',
      angleShort: '仰视 · 软刺',
      angleShortEn: 'Underside · Spines',
      src: './species-photos/lions-mane/underside.jpg',
      caption: '从下方仰视可见整齐垂挂的雪白冰柱状软刺，辨识度 100%，几乎无任何有毒混淆种。',
      captionEn:
        'Neat hanging icicle-like white spines visible from below — 100% unmistakable with no toxic lookalikes.',
      attribution: 'iNaturalist · @michaelsmith5 (CC0)',
    },
  ],
  chanterelle: [
    {
      angle: 'top',
      angleLabel: '俯视（上下 · 杏黄菌盖特征）',
      angleLabelEn: 'Top View (Golden Cap)',
      angleShort: '俯视 · 菌盖',
      angleShortEn: 'Top · Cap',
      src: './species-photos/chanterelle/top.jpg',
      caption: '光滑温润的杏黄至蛋黄色菌盖，成熟后边缘波浪微翘，常隐藏在 45–80 年次生花旗松苔藓下。',
      captionEn:
        'Smooth apricot-to-golden cap with wavy upturned margins, peeking through moss in 45–80 yr second-growth Douglas-fir woods.',
      attribution: 'iNaturalist · @treegrow (CC-BY)',
    },
    {
      angle: 'side',
      angleLabel: '侧面（土生肥厚株型）',
      angleLabelEn: 'Side View (Soil-Growing)',
      angleShort: '侧面 · 株型',
      angleShortEn: 'Side · Profile',
      src: './species-photos/chanterelle/side.jpg',
      caption: '直接生于针叶林土壤苔藓中（非木生），菌柄粗壮实心，撕开内部菌肉如鸡胸肉般雪白丝状。',
      captionEn:
        'Grows directly from mossy forest soil (not wood) with a solid sturdy stem that peels like white string cheese inside.',
      attribution: 'iNaturalist · @alan_rockefeller (CC-BY)',
    },
    {
      angle: 'underside',
      angleLabel: '仰视（下上 · 分叉钝假菌褶）',
      angleLabelEn: 'Underside (Forked False Gills)',
      angleShort: '仰视 · 假菌褶',
      angleShortEn: 'Underside · Ridges',
      src: './species-photos/chanterelle/underside.jpg',
      caption: '核心特征：钝圆分叉并相互交联的假菌褶（与菌盖一体不可剥离），微带淡淡杏果香。',
      captionEn:
        'Diagnostic blunt, forked, cross-veined false gills fused into the cap flesh, accompanied by a mild apricot scent.',
      attribution: 'iNaturalist · @elizacrofts (CC-BY)',
    },
  ],
  matsutake: [
    {
      angle: 'top',
      angleLabel: '俯视（上下 · 破土松针盖面）',
      angleLabelEn: 'Top View (Pushing Through Duff)',
      angleShort: '俯视 · 菌盖',
      angleShortEn: 'Top · Cap',
      src: './species-photos/matsutake/top.jpg',
      caption: '初生时常藏于砂土与松针隆起的“蘑菇包”下，白色菌盖带浅褐纤维鳞片，质地极硬实。',
      captionEn:
        'Often hidden beneath pine-needle "mushrumps" in sandy duff; dense white cap overlaid with brownish fibrous scales.',
      attribution: 'iNaturalist · @biljana_katic (CC0)',
    },
    {
      angle: 'side',
      angleLabel: '侧面（砂土基部与硬实菌柄）',
      angleLabelEn: 'Side View (Firm Gritty Base)',
      angleShort: '侧面 · 株型',
      angleShortEn: 'Side · Stem',
      src: './species-photos/matsutake/side.jpg',
      caption: '粗实韧性菌柄上白下褐、基部带砂砾且无膨大易碎菌托；务必逐朵核对浓郁肉桂+松脂辛香！',
      captionEn:
        'Tough firm stem white above and brown-sheathed below with a gritty tapering base — smell EVERY single specimen for spicy cinnamon!',
      attribution: 'iNaturalist · @alan_rockefeller (CC-BY)',
    },
    {
      angle: 'underside',
      angleLabel: '仰视（下上 · 白色菌褶与棉质菌幕）',
      angleLabelEn: 'Underside (White Gills & Cotton Veil)',
      angleShort: '仰视 · 菌幕',
      angleShortEn: 'Underside · Veil',
      src: './species-photos/matsutake/underside.jpg',
      caption: '致密白色菌褶与厚实棉质菌环/菌幕（切记严防无肉桂香、基部具脆弱菌托的剧毒史密斯鹅膏！）。',
      captionEn:
        'Crowded white gills and thick cottony partial veil/ring — guard strictly against odorless deadly Amanita smithiana.',
      attribution: 'iNaturalist · @biljana_katic (CC0)',
    },
  ],
  porcini: [
    {
      angle: 'top',
      angleLabel: '俯视 / 斜俯（栗棕面包菌盖与白网纹）',
      angleLabelEn: 'Top View (Chestnut Bun Cap)',
      angleShort: '俯视 · 菌盖',
      angleShortEn: 'Top · Cap',
      src: './species-photos/porcini/top.jpg',
      caption: '烤栗色光滑半球形“面包盖”，肥厚大肚柄表面具清晰白色细网纹（与粗糙黑点疣柄牛肝菌明显不同）。',
      captionEn:
        'Smooth toasted-chestnut bun cap over a stout bulbous stipe showing fine white reticulation (distinct from rough-scabered Leccinum).',
      attribution: 'iNaturalist · @alan_rockefeller (CC-BY)',
    },
    {
      angle: 'side',
      angleLabel: '侧面（针叶林典型粗壮株型）',
      angleLabelEn: 'Side View (Classic Conifer Profile)',
      angleShort: '侧面 · 株型',
      angleShortEn: 'Side · Profile',
      src: './species-photos/porcini/side.jpg',
      caption: '典型金褐/浅栗色圆顶菌盖配粗壮大肚奶油色网纹菌柄，生于针叶腐殖层中，菌肉紧实雪白。',
      captionEn:
        'Classic chestnut-brown dome cap atop a thick cream reticulated club stem in conifer duff, with dense pure-white flesh.',
      attribution: 'User Curated Field Photo',
    },
    {
      angle: 'underside',
      angleLabel: '仰视（纯白幼嫩海绵菌管与柄上网纹）',
      angleLabelEn: 'Underside (White Pores & Netting)',
      angleShort: '仰视 · 菌管',
      angleShortEn: 'Underside · Pores',
      src: './species-photos/porcini/underside.jpg',
      caption: '幼嫩期盖下为洁白致密海绵状菌管孔（成熟后转黄绿，无菌褶），柄上立体白色网纹清晰可见。',
      captionEn:
        'Dense white spongy pore surface when young (maturing olive-yellow, zero gills) with crisp white upper-stipe reticulation.',
      attribution: 'User Curated Field Photo',
    },
  ],
  'fib-king': [
    {
      angle: 'top',
      angleLabel: '俯视（深栗色干燥绒毛/纤维菌盖）',
      angleLabelEn: 'Top View (Velvety Fibrillose Cap)',
      angleShort: '俯视 · 绒盖',
      angleShortEn: 'Top · Cap',
      src: './species-photos/fib-king/top.jpg',
      caption: '典型深栗棕/巧克力色干燥绒毛纤维状菌盖（有别于光滑微黏的普通美味牛肝菌），生于花旗松/铁杉针叶林。',
      captionEn:
        'Dry, velvety to matted-fibrillose dark chocolate-brown cap (never slimy like B. edulis), fruiting on Douglas-fir/hemlock duff.',
      attribution: 'iNaturalist · @moorebuesing (CC0)',
    },
    {
      angle: 'side',
      angleLabel: '侧面（粗壮棕褐纤维网纹柄与林地生境）',
      angleLabelEn: 'Side View (Stout Brownish Stipe)',
      angleShort: '侧面 · 株型',
      angleShortEn: 'Side · Profile',
      src: './species-photos/fib-king/side.jpg',
      caption: '粗壮实心菌柄呈明显棕褐色并布满纵纤维与细网纹，常见于 PNW 中低海拔针叶林苔藓坡面。',
      captionEn:
        'Stout, solid brownish stipe covered with dark fibrils and fine reticulation in mossy PNW Douglas-fir & hemlock woods.',
      attribution: 'iNaturalist · @rojasburke (CC-BY)',
    },
    {
      angle: 'underside',
      angleLabel: '仰视（黄白至橄榄黄海绵菌管 · 不变蓝）',
      angleLabelEn: 'Underside (Olive-Yellow Pores · No Blueing)',
      angleShort: '仰视 · 菌管',
      angleShortEn: 'Underside · Pores',
      src: './species-photos/fib-king/underside.jpg',
      caption: '海绵状菌管初白渐转淡黄至橄榄黄，按压不变蓝；粗柄基部常带洁白菌丝绒。',
      captionEn:
        'Spongy pores turn from cream to dingy olive-yellow without bruising blue; sturdy brownish stalk often shows white basal mycelium.',
      attribution: 'iNaturalist · @moorebuesing (CC0)',
    },
  ],
  admirable: [
    {
      angle: 'top',
      angleLabel: '俯视（标志性酒红/紫褐绒面麂皮菌盖）',
      angleLabelEn: 'Top View (Velvet Burgundy Cap)',
      angleShort: '俯视 · 酒红盖',
      angleShortEn: 'Top · Velvet Cap',
      src: './species-photos/admirable/top.jpg',
      caption: '极具辨识度的深酒红至紫褐色干燥丝绒/麂皮状菌盖，常伴厚绿苔藓与腐朽西部铁杉木屑。',
      captionEn:
        'Unmistakable rich maroon-to-burgundy dry suede/velvet cap rising amidst bright moss and decayed western hemlock wood.',
      attribution: 'iNaturalist · @geographerdave (CC-BY)',
    },
    {
      angle: 'side',
      angleLabel: '侧面（幼嫩圆顶绒盖与粗大酒红棒状柄）',
      angleLabelEn: 'Side View (Bulbous Club Stipe)',
      angleShort: '侧面 · 株型',
      angleShortEn: 'Side · Profile',
      src: './species-photos/admirable/side.jpg',
      caption: '幼嫩期菌盖呈紧实圆润酒红绒球，配膨大粗壮的酒红条纹棒状柄，直接扎根于腐朽铁杉倒木或树桩上。',
      captionEn:
        'Young dome-shaped velvet maroon cap atop a plump club-shaped burgundy-streaked stalk rooted in rotting hemlock wood.',
      attribution: 'iNaturalist · @bcrobyn (CC0)',
    },
    {
      angle: 'underside',
      angleLabel: '仰视（明黄/柠檬黄海绵菌管与柄顶网纹）',
      angleLabelEn: 'Underside (Bright Yellow Pores)',
      angleShort: '仰视 · 黄菌管',
      angleShortEn: 'Underside · Pores',
      src: './species-photos/admirable/underside.jpg',
      caption: '盖下为耀眼的柠檬黄至金黄色海绵状菌管孔（基本不变蓝），柄上部具粗犷黄褐/酒红立体网纹。',
      captionEn:
        'Bright lemon-to-golden yellow angular pores (little or no blue staining) paired with coarse raised netting near the upper stipe.',
      attribution: 'iNaturalist · @geographerdave (CC-BY)',
    },
  ],
  leccinum: [
    {
      angle: 'top',
      angleLabel: '俯视（上下 · 橙褐/棕褐圆顶菌盖）',
      angleLabelEn: 'Top View (Brown / Orange Cap)',
      angleShort: '俯视 · 菌盖',
      angleShortEn: 'Top · Cap',
      src: './species-photos/leccinum/top.jpg',
      caption: '半球至枕状棕褐/橙褐色菌盖，常见于白桦、颤杨（Aspen）或马醉木/熊果林下落叶与草地边缘。',
      captionEn:
        'Hemispheric to cushion-shaped brown or orange-brown cap under birch, aspen, or madrone/manzanita leaf litter.',
      attribution: 'iNaturalist · @yggdrasi (CC-BY)',
    },
    {
      angle: 'side',
      angleLabel: '侧面（标志性黑褐点状粗糙疣柄）',
      angleLabelEn: 'Side View (Dark Rough Scabers)',
      angleShort: '侧面 · 疣柄',
      angleShortEn: 'Side · Scabers',
      src: './species-photos/leccinum/side.jpg',
      caption: '100% 核心鉴别点：浅色菌柄表面布满竖排凸起的黑褐色粗糙小疣点（scabers，非美味牛肝菌的细网纹）。',
      captionEn:
        '100% key ID trait: slender pale stipe covered in vertical rows of rough dark brown/black raised scabers (never fine white netting).',
      attribution: 'iNaturalist · @alan_rockefeller (CC-BY)',
    },
    {
      angle: 'underside',
      angleLabel: '仰视（下上 · 细密菌管与黑褐鳞片特写）',
      angleLabelEn: 'Underside (Fine Pores & Scabers)',
      angleShort: '仰视 · 菌管与疣点',
      angleShortEn: 'Underside · Pores',
      src: './species-photos/leccinum/underside.jpg',
      caption: '盖下为白至灰白色细密海绵状菌管，紧邻柄上部密布黑褐砂纸状鳞片；切开菌肉常缓慢变灰黑，务必高温久煮！',
      captionEn:
        'Fine whitish-to-grayish spongy pores next to sandpaper-like upper-stipe scabers; flesh slowly stains gray/black — always cook thoroughly!',
      attribution: 'iNaturalist · @yggdrasi (CC-BY)',
    },
  ],
  morel: [
    {
      angle: 'top',
      angleLabel: '俯视（上下 · 蜂窝深凹坑菌盖）',
      angleLabelEn: 'Top View (Deep Honeycomb Pits)',
      angleShort: '俯视 · 蜂窝盖',
      angleShortEn: 'Top · Honeycomb',
      src: './species-photos/morel/top.jpg',
      caption: '立体清晰的深蜂窝状网格凹坑（而非脑回状褶皱），黑褐色菌脊是 PNW 火烧羊肚菌经典色泽。',
      captionEn:
        'Crisp deep honeycomb pits and dark charred ridges (never brain-like lobes) — classic PNW burn morel appearance.',
      attribution: 'iNaturalist · @pinonbistro (CC-BY-NC)',
    },
    {
      angle: 'side',
      angleLabel: '侧面（火烧迹地直立株型）',
      angleLabelEn: 'Side View (In Burn Scar Ash)',
      angleShort: '侧面 · 株型',
      angleShortEn: 'Side · Profile',
      src: './species-photos/morel/side.jpg',
      caption: '挺立于前一年野火过火后的针叶灰烬与苔藓地面，菌盖下缘平滑贴合菌柄而非像伞裙般垂挂。',
      captionEn:
        'Standing upright in previous-year conifer burn ash; the lower cap margin attaches cleanly to the stem rather than hanging free.',
      attribution: 'iNaturalist · @mbowser (CC-BY)',
    },
    {
      angle: 'underside',
      angleLabel: '仰视 / 纵切（100% 完全中空鉴别）',
      angleLabelEn: 'Cross-Section (100% Hollow Check)',
      angleShort: '纵切 · 全中空',
      angleShortEn: 'Slice · Hollow',
      src: './species-photos/morel/underside.jpg',
      caption: '最关键安全核验：纵切从顶到柄底必须 100% 贯通中空，无棉絮填充（严防有毒实心假羊肚菌）！',
      captionEn:
        'CRITICAL safety check: sliced lengthwise, must be 100% hollow tip-to-base with zero cottony stuffing (rules out toxic False Morels).',
      attribution: 'iNaturalist · @pinonbistro (CC-BY-SA)',
    },
  ],
};
