import React, { useMemo, useState } from 'react';
import {
  Camera,
  ChevronDown,
  ChevronRight,
  Compass,
  Flame,
  Layers,
  Map as MapIcon,
  Navigation,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  BASEMAPS,
  OVERLAY_CATEGORIES,
  OVERLAYS,
  PNW_YELLOWFOOT_HOTSPOTS,
} from '../data/mapSources';
import { getSpeciesProfile } from '../data/speciesCatalog';
import { HIGH_CONTRAST_LEGENDS } from '../services/tileEngines';
import { formatDistanceFromCenter, haversineMiles } from '../utils/geo';
import type {
  BasemapId,
  ElevBandParams,
  FireSummary,
  InatObservation,
  InatTimeRange,
  OverlayRuntimeState,
  PnwHotspot,
  SpeciesId,
  SpeciesModelOverride,
} from '../types/map';

interface LayerDrawerProps {
  open: boolean;
  initialTab: 'layers' | 'spots' | 'fires' | 'basemaps';
  speciesId: SpeciesId;
  onClose: () => void;
  basemapId: BasemapId;
  onSelectBasemap: (id: BasemapId) => void;
  overlayStates: Record<string, OverlayRuntimeState>;
  onToggleOverlay: (id: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  speciesParams: SpeciesModelOverride;
  onChangeSpeciesParams: (next: SpeciesModelOverride) => void;
  filterStrength: number;
  onChangeFilterStrength: (val: number) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  blinkEnabled: boolean;
  onToggleBlink: () => void;
  mapCenter: [number, number];
  elevBandParams: ElevBandParams;
  onChangeElevBandParams: (next: ElevBandParams) => void;
  fires: FireSummary[];
  firesLoading: boolean;
  onFlyToFire: (fire: FireSummary) => void;
  onFlyToHotspot: (spot: PnwHotspot) => void;
  inatItems: InatObservation[];
  inatTotal: number;
  inatLoading: boolean;
  inatTimeRange: InatTimeRange;
  onChangeInatTimeRange: (r: InatTimeRange) => void;
  inatViewportOnly: boolean;
  onToggleInatViewportOnly: () => void;
  onRefreshInat: () => void;
  onFlyToInat: (obs: InatObservation) => void;
}

export const LayerDrawer: React.FC<LayerDrawerProps> = ({
  open,
  initialTab,
  speciesId,
  onClose,
  basemapId,
  onSelectBasemap,
  overlayStates,
  onToggleOverlay,
  onOpacityChange,
  speciesParams,
  onChangeSpeciesParams,
  filterStrength,
  onChangeFilterStrength,
  highContrast,
  onToggleHighContrast,
  blinkEnabled,
  onToggleBlink,
  mapCenter,
  elevBandParams,
  onChangeElevBandParams,
  fires,
  firesLoading,
  onFlyToFire,
  onFlyToHotspot,
  inatItems,
  inatTotal,
  inatLoading,
  inatTimeRange,
  onChangeInatTimeRange,
  inatViewportOnly,
  onToggleInatViewportOnly,
  onRefreshInat,
  onFlyToInat,
}) => {
  const [tab, setTab] = useState<'layers' | 'spots' | 'fires' | 'basemaps'>(initialTab);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showCuratedSpots, setShowCuratedSpots] = useState(false);
  const [inatSortBy, setInatSortBy] = useState<'recent' | 'distance'>('recent');
  const [fireSearch, setFireSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [rankFilter, setRankFilter] = useState('ALL');

  const profile = getSpeciesProfile(speciesId);

  const sortedInatItems = useMemo(() => {
    const withDist = inatItems.map((obs) => ({
      obs,
      distMi: haversineMiles(mapCenter[0], mapCenter[1], obs.lng, obs.lat),
    }));
    if (inatSortBy === 'distance') {
      withDist.sort((a, b) => a.distMi - b.distMi);
    }
    return withDist.slice(0, 60);
  }, [inatItems, inatSortBy, mapCenter]);

  const sortedHotspots = useMemo(() => {
    return PNW_YELLOWFOOT_HOTSPOTS.map((spot) => ({
      spot,
      distMi: haversineMiles(mapCenter[0], mapCenter[1], spot.center[0], spot.center[1]),
    })).sort((a, b) => a.distMi - b.distMi);
  }, [mapCenter]);

  React.useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  const availableStates = useMemo(() => {
    const s = new Set<string>();
    fires.forEach((f) => s.add(f.state));
    return Array.from(s).sort();
  }, [fires]);

  const filteredFires = useMemo(() => {
    const q = fireSearch.trim().toLowerCase();
    return fires
      .filter((f) => (stateFilter === 'ALL' ? true : f.state === stateFilter))
      .filter((f) => (rankFilter === 'ALL' ? true : f.rank === rankFilter))
      .filter((f) => (!q ? true : f.name.toLowerCase().includes(q) || f.state.toLowerCase().includes(q)))
      .slice(0, 80);
  }, [fires, fireSearch, stateFilter, rankFilter]);

  if (!open) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer-panel">
        <div className="drawer-header">
          <h2>地图资源与图层</h2>
          <button className="icon-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-tabs" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <button
            className={`drawer-tab ${tab === 'layers' ? 'active' : ''}`}
            onClick={() => setTab('layers')}
          >
            <Layers size={13} /> 图层
          </button>
          <button
            className={`drawer-tab ${tab === 'spots' ? 'active' : ''}`}
            onClick={() => setTab('spots')}
          >
            <Camera size={13} /> 实拍
          </button>
          <button
            className={`drawer-tab ${tab === 'fires' ? 'active' : ''}`}
            onClick={() => setTab('fires')}
          >
            <Flame size={13} /> 火场
          </button>
          <button
            className={`drawer-tab ${tab === 'basemaps' ? 'active' : ''}`}
            onClick={() => setTab('basemaps')}
          >
            <MapIcon size={13} /> 底图
          </button>
        </div>

        <div className="drawer-body">
          {tab === 'layers' &&
            OVERLAY_CATEGORIES.map((cat) => {
              const items = OVERLAYS.filter((o) => o.categoryId === cat.id);
              const isCollapsed = !!collapsed[cat.id];
              const activeCount = items.filter((o) => overlayStates[o.id]?.visible).length;

              return (
                <div className="section-card" key={cat.id}>
                  <div
                    className="section-header"
                    onClick={() =>
                      setCollapsed((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))
                    }
                  >
                    <span>
                      {cat.name}{' '}
                      {activeCount > 0 && (
                        <span style={{ color: '#facc15', fontSize: 11 }}>({activeCount} 开启)</span>
                      )}
                    </span>
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {!isCollapsed && (
                    <div className="section-content">
                      {items.map((ov) => {
                        const st = overlayStates[ov.id] || {
                          visible: ov.defaultVisible,
                          opacity: ov.defaultOpacity,
                        };
                        const displayName =
                          ov.id === 'species-probability'
                            ? `${profile.emoji} ${profile.shortName} · 实时热力模型`
                            : ov.name;
                        const displayColor =
                          ov.id === 'species-probability' ? profile.accentColor : ov.color;
                        const displayLegends =
                          ov.id === 'species-probability'
                            ? highContrast
                              ? HIGH_CONTRAST_LEGENDS
                              : profile.legends
                            : ov.legends;

                        return (
                          <div className="overlay-row" key={ov.id}>
                            <div className="overlay-top">
                              <div className="overlay-info">
                                <span className="swatch" style={{ background: displayColor }} />
                                <span className="overlay-name">{displayName}</span>
                              </div>
                              <button
                                className={`switch ${st.visible ? 'on' : ''}`}
                                onClick={() => onToggleOverlay(ov.id)}
                                aria-label={`Toggle ${displayName}`}
                              />
                            </div>
                            <div className="overlay-desc">
                              {ov.description}
                              {st.loading && ' · 加载中...'}
                              {st.error && (
                                <span style={{ color: '#f87171' }}> · {st.error}</span>
                              )}
                            </div>

                            {st.visible && (
                              <div className="overlay-controls">
                                <div className="slider-row">
                                  <span>透明度</span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={st.opacity}
                                    onChange={(e) =>
                                      onOpacityChange(ov.id, Number(e.target.value))
                                    }
                                  />
                                  <span>{Math.round(st.opacity * 100)}%</span>
                                </div>

                                {ov.id === 'species-probability' && (
                                  <>
                                    <div className="slider-row">
                                      <span>筛选强度</span>
                                      <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={5}
                                        value={filterStrength}
                                        onChange={(e) =>
                                          onChangeFilterStrength(Number(e.target.value))
                                        }
                                      />
                                      <span>{filterStrength}%</span>
                                    </div>
                                    <div className="mini-toggle-row">
                                      <span>高反差热成像色阶（全底图高对比）</span>
                                      <button
                                        className={`switch ${highContrast ? 'on' : ''}`}
                                        onClick={onToggleHighContrast}
                                      />
                                    </div>
                                    <div className="mini-toggle-row">
                                      <span>⚡ 1Hz 闪烁对比（透视底图）</span>
                                      <button
                                        className={`switch ${blinkEnabled ? 'on' : ''}`}
                                        onClick={onToggleBlink}
                                      />
                                    </div>
                                    {speciesId === 'morel' && (
                                      <div className="mini-toggle-row">
                                        <span>仅限火烧迹地内渲染 (Burn Scars)</span>
                                        <button
                                          className={`switch ${speciesParams.burnScarOnly ? 'on' : ''}`}
                                          onClick={() =>
                                            onChangeSpeciesParams({
                                              ...speciesParams,
                                              burnScarOnly: !speciesParams.burnScarOnly,
                                            })
                                          }
                                        />
                                      </div>
                                    )}
                                    <div className="mini-toggle-row">
                                      <span>融合 NLCD 30m 密林树冠</span>
                                      <button
                                        className={`switch ${speciesParams.useCanopy ? 'on' : ''}`}
                                        onClick={() =>
                                          onChangeSpeciesParams({
                                            ...speciesParams,
                                            useCanopy: !speciesParams.useCanopy,
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="slider-row">
                                      <span>最低郁闭度</span>
                                      <input
                                        type="range"
                                        min={20}
                                        max={75}
                                        step={5}
                                        value={speciesParams.minCanopyPct}
                                        onChange={(e) =>
                                          onChangeSpeciesParams({
                                            ...speciesParams,
                                            minCanopyPct: Number(e.target.value),
                                          })
                                        }
                                      />
                                      <span>{speciesParams.minCanopyPct}%</span>
                                    </div>
                                    <div className="slider-row">
                                      <span>海拔下限</span>
                                      <input
                                        type="range"
                                        min={0}
                                        max={6000}
                                        step={100}
                                        value={speciesParams.minElevFt}
                                        onChange={(e) =>
                                          onChangeSpeciesParams({
                                            ...speciesParams,
                                            minElevFt: Math.min(
                                              Number(e.target.value),
                                              speciesParams.maxElevFt - 300,
                                            ),
                                          })
                                        }
                                      />
                                      <span>{speciesParams.minElevFt} ft</span>
                                    </div>
                                    <div className="slider-row">
                                      <span>海拔上限</span>
                                      <input
                                        type="range"
                                        min={1000}
                                        max={9000}
                                        step={100}
                                        value={speciesParams.maxElevFt}
                                        onChange={(e) =>
                                          onChangeSpeciesParams({
                                            ...speciesParams,
                                            maxElevFt: Math.max(
                                              Number(e.target.value),
                                              speciesParams.minElevFt + 300,
                                            ),
                                          })
                                        }
                                      />
                                      <span>{speciesParams.maxElevFt} ft</span>
                                    </div>
                                  </>
                                )}

                                {ov.id === 'elevation-band' && (
                                  <>
                                    <div className="slider-row">
                                      <span>最低海拔</span>
                                      <input
                                        type="range"
                                        min={0}
                                        max={10000}
                                        step={150}
                                        value={elevBandParams.minFt}
                                        onChange={(e) =>
                                          onChangeElevBandParams({
                                            ...elevBandParams,
                                            minFt: Math.min(
                                              Number(e.target.value),
                                              elevBandParams.maxFt - 200,
                                            ),
                                          })
                                        }
                                      />
                                      <span>{elevBandParams.minFt} ft</span>
                                    </div>
                                    <div className="slider-row">
                                      <span>最高海拔</span>
                                      <input
                                        type="range"
                                        min={500}
                                        max={13000}
                                        step={150}
                                        value={elevBandParams.maxFt}
                                        onChange={(e) =>
                                          onChangeElevBandParams({
                                            ...elevBandParams,
                                            maxFt: Math.max(
                                              Number(e.target.value),
                                              elevBandParams.minFt + 200,
                                            ),
                                          })
                                        }
                                      />
                                      <span>{elevBandParams.maxFt} ft</span>
                                    </div>
                                  </>
                                )}

                                {displayLegends && displayLegends.length > 0 && (
                                  <div className="inline-legend">
                                    {displayLegends.map((lg) => (
                                      <span className="inline-legend-item" key={lg.label}>
                                        <span
                                          className="swatch"
                                          style={{ background: lg.color, width: 9, height: 9 }}
                                        />
                                        {lg.label}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

          {tab === 'spots' && (
            <>
              <div
                style={{
                  background: 'rgba(236, 72, 153, 0.1)',
                  border: '1px solid rgba(236, 72, 153, 0.35)',
                  borderRadius: 11,
                  padding: '9px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fbcfe8' }}>
                    iNaturalist 实拍 · {profile.emoji} {profile.shortName}
                    <span style={{ color: '#9aa9a0', fontWeight: 500, marginLeft: 5 }}>
                      ({inatTotal.toLocaleString()} 条)
                    </span>
                  </div>
                  <button
                    className="icon-close"
                    style={{ width: 26, height: 26 }}
                    onClick={onRefreshInat}
                    aria-label="Refresh iNaturalist"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 5 }}>
                  {(
                    [
                      ['30d', '近 30 天'],
                      ['365d', '近 1 年'],
                      ['all', '历年全部'],
                    ] as Array<[InatTimeRange, string]>
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => onChangeInatTimeRange(val)}
                      style={{
                        flex: 1,
                        padding: '5px 4px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border:
                          inatTimeRange === val
                            ? '1px solid #ec4899'
                            : '1px solid rgba(255,255,255,0.1)',
                        background:
                          inatTimeRange === val ? 'rgba(236, 72, 153, 0.25)' : '#1c2420',
                        color: inatTimeRange === val ? '#ffffff' : '#9aa9a0',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mini-toggle-row" style={{ fontSize: 11 }}>
                  <span>仅查询当前屏幕视野内实拍</span>
                  <button
                    className={`switch ${inatViewportOnly ? 'on' : ''}`}
                    onClick={onToggleInatViewportOnly}
                  />
                </div>

                <div style={{ display: 'flex', gap: 5 }}>
                  {(
                    [
                      ['recent', '按时间最新'],
                      ['distance', '✚ 按距中心最近'],
                    ] as Array<['recent' | 'distance', string]>
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setInatSortBy(val)}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        borderRadius: 7,
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border:
                          inatSortBy === val
                            ? '1px solid #22c55e'
                            : '1px solid rgba(255,255,255,0.1)',
                        background:
                          inatSortBy === val ? 'rgba(34, 197, 94, 0.2)' : '#1c2420',
                        color: inatSortBy === val ? '#86efac' : '#9aa9a0',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {inatLoading && (
                <div style={{ fontSize: 12, color: '#9aa9a0', padding: '4px 2px' }}>
                  正在从 iNaturalist 拉取最新研究级实拍记录...
                </div>
              )}

              {!inatLoading && sortedInatItems.length === 0 && (
                <div style={{ fontSize: 12, color: '#9aa9a0', padding: '10px 4px' }}>
                  该时间段/范围内暂无实拍记录，可切换到「近 1 年」或「历年全部」。
                </div>
              )}

              {sortedInatItems.map(({ obs, distMi }) => (
                <div
                  className="fire-item"
                  key={obs.id}
                  onClick={() => {
                    onFlyToInat(obs);
                    onClose();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    {obs.photoUrl ? (
                      <img
                        src={obs.photoUrl}
                        alt={obs.speciesName}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.14)',
                        }}
                      />
                    ) : (
                      <span
                        className="rank-badge"
                        style={{
                          width: 44,
                          height: 44,
                          background: 'rgba(236,72,153,0.18)',
                          color: '#f472b6',
                        }}
                      >
                        <Camera size={16} />
                      </span>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {obs.placeGuess}
                      </div>
                      <div style={{ fontSize: 11, color: '#f9a8d4', marginTop: 2 }}>
                        {obs.observedOn} · @{obs.userLogin}
                      </div>
                      <div style={{ fontSize: 10, color: '#9aa9a0', marginTop: 1 }}>
                        {obs.obscured ? '模糊隐私坐标' : '精确 GPS'} · {obs.lat.toFixed(3)},{' '}
                        {obs.lng.toFixed(3)}
                      </div>
                      <div className="poi-distance-pill">
                        ✚ 距中心 {formatDistanceFromCenter(distMi)}
                      </div>
                    </div>
                  </div>
                  <Navigation size={15} color="#ec4899" style={{ flexShrink: 0 }} />
                </div>
              ))}

              <div className="section-card" style={{ marginTop: 4 }}>
                <div
                  className="section-header"
                  onClick={() => setShowCuratedSpots((v) => !v)}
                >
                  <span>PNW 精选公共林区书签 ({sortedHotspots.length})</span>
                  {showCuratedSpots ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </div>
                {showCuratedSpots && (
                  <div className="section-content">
                    {sortedHotspots.map(({ spot, distMi }) => (
                      <div
                        className="fire-item"
                        key={spot.id}
                        onClick={() => {
                          onFlyToHotspot(spot);
                          onClose();
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, minWidth: 0 }}>
                          <span
                            className="rank-badge"
                            style={{
                              background: 'rgba(250, 204, 21, 0.2)',
                              color: '#fde047',
                              border: '1px solid rgba(250, 204, 21, 0.5)',
                              marginTop: 2,
                            }}
                          >
                            {spot.state}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{spot.name}</div>
                            <div style={{ fontSize: 11, color: '#facc15', marginTop: 1 }}>
                              {spot.region} · {spot.elevBand}
                            </div>
                            <div className="poi-distance-pill">
                              ✚ 距中心 {formatDistanceFromCenter(distMi)}
                            </div>
                          </div>
                        </div>
                        <Navigation size={14} color="#facc15" style={{ flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'fires' && (
            <>
              <div className="filter-bar">
                <input
                  className="filter-input"
                  placeholder="搜索火场名 (如 Park, Big Grass...)"
                  value={fireSearch}
                  onChange={(e) => setFireSearch(e.target.value)}
                />
                <select
                  className="filter-select"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                >
                  <option value="ALL">全部州</option>
                  {availableStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <select
                  className="filter-select"
                  value={rankFilter}
                  onChange={(e) => setRankFilter(e.target.value)}
                >
                  <option value="ALL">全评级</option>
                  <option value="A">A 级</option>
                  <option value="B">B 级</option>
                  <option value="C">C 级</option>
                </select>
              </div>

              {firesLoading && (
                <div style={{ fontSize: 12, color: '#9aa9a0', padding: '6px 2px' }}>
                  正在从 NIFC 拉取北美野火过火边界...
                </div>
              )}

              {!firesLoading && filteredFires.length === 0 && (
                <div style={{ fontSize: 12, color: '#9aa9a0', padding: '12px 4px' }}>
                  暂无已开启火场（在顶部切换「火烧羊肚菌」或在「图层」中开启野火图层即可加载）。
                </div>
              )}

              {filteredFires.map((fire) => (
                <div
                  className="fire-item"
                  key={`${fire.year}-${fire.id}`}
                  onClick={() => {
                    onFlyToFire(fire);
                    onClose();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <span className={`rank-badge rank-${fire.rank}`}>{fire.rank}</span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {fire.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#9aa9a0', marginTop: 2 }}>
                        {fire.year} · {fire.state} · {fire.acres.toLocaleString()} ac
                      </div>
                      <div className="poi-distance-pill">
                        ✚ 距中心{' '}
                        {formatDistanceFromCenter(
                          haversineMiles(
                            mapCenter[0],
                            mapCenter[1],
                            fire.center[0],
                            fire.center[1],
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                  <Navigation size={15} color="#e06936" />
                </div>
              ))}
            </>
          )}

          {tab === 'basemaps' && (
            <>
              <div style={{ fontSize: 11, color: '#9aa9a0', marginBottom: 2 }}>
                所有底图均使用免费公开官方瓦片源，无需 Mapbox 收费 Token。
              </div>
              {BASEMAPS.map((bm) => (
                <div
                  key={bm.id}
                  className={`basemap-card ${bm.id === basemapId ? 'active' : ''}`}
                  onClick={() => onSelectBasemap(bm.id)}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{bm.name}</div>
                    <div style={{ fontSize: 11, color: '#9aa9a0', marginTop: 2 }}>
                      {bm.subtitle}
                    </div>
                  </div>
                  <Compass size={18} color={bm.id === basemapId ? '#e06936' : '#64748b'} />
                </div>
              ))}
            </>
          )}
        </div>
      </aside>
    </>
  );
};
