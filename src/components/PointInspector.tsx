import React, { useEffect, useState } from 'react';
import {
  BookmarkPlus,
  Camera,
  Copy,
  Droplets,
  ExternalLink,
  Flame,
  Layers,
  ShieldCheck,
  Trees,
  X,
} from 'lucide-react';
import { getSpeciesProfile, SPECIES_CATALOG } from '../data/speciesCatalog';
import type { ForageWaypoint, PointInspection, SpeciesId } from '../types/map';

interface PointInspectorProps {
  data: PointInspection | null;
  speciesId: SpeciesId;
  onClose: () => void;
  onCopyCoords: (text: string) => void;
  onSaveWaypoint: (wp: Omit<ForageWaypoint, 'id' | 'createdAt'>) => void;
}

export const PointInspector: React.FC<PointInspectorProps> = ({
  data,
  speciesId,
  onClose,
  onCopyCoords,
  onSaveWaypoint,
}) => {
  const [adding, setAdding] = useState(false);
  const [wpName, setWpName] = useState('');
  const [species, setSpecies] = useState<ForageWaypoint['species']>(speciesId);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setSpecies(speciesId);
  }, [speciesId]);

  if (!data) return null;

  const profile = getSpeciesProfile(data.activeSpeciesId || speciesId);
  const coordStr = `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`;

  const handleSave = () => {
    const selLabel =
      species === 'Other' ? '其他菌种' : getSpeciesProfile(species).shortName;
    onSaveWaypoint({
      name: wpName.trim() || `${selLabel} 采菇点`,
      species,
      notes: notes.trim(),
      lng: data.lng,
      lat: data.lat,
      elevationFt: data.elevationFt,
    });
    setWpName('');
    setNotes('');
    setAdding(false);
  };

  return (
    <div className="inspector-sheet">
      <div className="inspector-head">
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {profile.emoji} {profile.shortName} · 微生境详情
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#9aa9a0',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 2,
            }}
          >
            <span>{coordStr}</span>
            <button
              onClick={() => onCopyCoords(coordStr)}
              style={{
                background: 'none',
                border: 'none',
                color: '#e06936',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
              }}
              aria-label="Copy coordinates"
            >
              <Copy size={13} />
            </button>
          </div>
        </div>
        <button className="icon-close" onClick={onClose} aria-label="Close inspector">
          <X size={16} />
        </button>
      </div>

      {/* iNaturalist Sighting Card */}
      {data.inatSighting && (
        <div
          style={{
            background: 'rgba(236, 72, 153, 0.13)',
            border: '1px solid rgba(236, 72, 153, 0.45)',
            borderRadius: 12,
            padding: '9px 10px',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {data.inatSighting.photoUrl ? (
            <img
              src={data.inatSighting.photoUrl}
              alt={data.inatSighting.speciesName}
              style={{
                width: 62,
                height: 62,
                borderRadius: 9,
                objectFit: 'cover',
                flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            />
          ) : (
            <Camera size={22} color="#f472b6" />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fbcfe8' }}>
              iNaturalist 实拍 · {data.inatSighting.observedOn}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', marginTop: 2 }}>
              {data.inatSighting.placeGuess}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#d1d5db',
                marginTop: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span>@{data.inatSighting.userLogin}</span>
              <span>{data.inatSighting.obscured ? '模糊隐私坐标' : '精确 GPS'}</span>
              <a
                href={data.inatSighting.uri}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#f9a8d4',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                原帖 <ExternalLink size={11} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Active Species Score banner + Detailed Factor Breakdown */}
      <div
        className="score-banner"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: `${profile.accentColor}77`,
          marginBottom: data.scoreBreakdown && data.scoreBreakdown.length > 0 ? 6 : 8,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: profile.accentColor, fontWeight: 600 }}>
            实时{profile.shortName}适宜度 ({profile.scientificName})
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginTop: 1 }}>
            {data.loading ? '计算中...' : data.activeTier || '—'}
          </div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: profile.accentColor }}>
          {data.activeScore !== null ? `${data.activeScore}` : '--'}
          <span style={{ fontSize: 11, color: '#9aa9a0', fontWeight: 600 }}>/100</span>
        </div>
      </div>

      {/* Color-coded Bonus / Penalty Reasons with Ideal Reference Targets */}
      {!data.loading && data.scoreBreakdown && data.scoreBreakdown.length > 0 && (() => {
        const order = { penalty: 0, neutral: 1, bonus: 2 };
        const sorted = [...data.scoreBreakdown].sort(
          (a, b) => (a.hardGate ? -1 : order[a.status]) - (b.hardGate ? -1 : order[b.status]),
        );
        return (
          <div className="score-reasons-wrap">
            {sorted.map((item) => (
              <div
                key={item.key}
                className={`score-reason-chip status-${item.status} ${item.hardGate ? 'hard-gate' : ''}`}
              >
                <span className="reason-icon">
                  {item.hardGate ? '✕' : item.status === 'penalty' ? '▼' : item.status === 'bonus' ? '▲' : '•'}
                </span>
                <span className="reason-main">
                  <strong>{item.label}</strong> {item.summary}
                </span>
                <span className="reason-ideal">理想 {item.ideal}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Elevation / Slope / Aspect / Canopy with Status Highlight & Ideal Reference */}
      {(() => {
        const byKey = new Map((data.scoreBreakdown || []).map((f) => [f.key, f]));
        const elevF = byKey.get('elevation');
        const slopeF = byKey.get('slope');
        const aspectF = byKey.get('aspect');
        const canopyF = byKey.get('canopy');
        const moistF = byKey.get('moisture');
        return (
          <>
            <div className="metrics-grid">
              <div className={`metric-box ${elevF ? `metric-${elevF.status}` : ''}`}>
                <div className="metric-label">海拔</div>
                <div className="metric-val">
                  {data.elevationFt !== null ? `${data.elevationFt.toLocaleString()} ft` : '—'}
                </div>
                <div className="metric-sub">
                  {data.elevationM !== null ? `${data.elevationM} m` : ''}
                </div>
                {elevF && <div className="metric-ideal">理想 {elevF.ideal}</div>}
              </div>
              <div className={`metric-box ${slopeF ? `metric-${slopeF.status}` : ''}`}>
                <div className="metric-label">坡度</div>
                <div className="metric-val">
                  {data.slopePct !== null ? `${data.slopePct}%` : '—'}
                </div>
                <div className="metric-sub">
                  {data.slopeDeg !== null ? `${data.slopeDeg}°` : ''}
                </div>
                {slopeF && <div className="metric-ideal">理想 {slopeF.ideal}</div>}
              </div>
              <div className={`metric-box ${aspectF ? `metric-${aspectF.status}` : ''}`}>
                <div className="metric-label">坡向</div>
                <div className="metric-val">
                  {data.aspectDir ? data.aspectDir.split(' ')[0] : '—'}
                </div>
                <div className="metric-sub">
                  {data.aspectDeg !== null ? `${data.aspectDeg}°` : ''}
                </div>
                {aspectF && <div className="metric-ideal">理想 {aspectF.ideal}</div>}
              </div>
              <div className={`metric-box ${canopyF ? `metric-${canopyF.status}` : ''}`}>
                <div className="metric-label">树冠郁闭</div>
                <div className="metric-val">
                  {data.canopyPct !== null ? `${data.canopyPct}%` : '—'}
                </div>
                <div className="metric-sub">NLCD 30m</div>
                {canopyF && <div className="metric-ideal">理想 {canopyF.ideal}</div>}
              </div>
            </div>

            {/* Micro-topography moisture / concavity strip */}
            {data.landformLabel && (
              <div
                className={`landform-strip ${moistF ? `metric-${moistF.status}` : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 6,
                  background:
                    moistF?.status === 'bonus'
                      ? 'rgba(34, 197, 94, 0.12)'
                      : moistF?.status === 'penalty'
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'rgba(56, 189, 248, 0.1)',
                  border:
                    moistF?.status === 'bonus'
                      ? '1px solid rgba(34, 197, 94, 0.4)'
                      : moistF?.status === 'penalty'
                        ? '1px solid rgba(239, 68, 68, 0.42)'
                        : '1px solid rgba(56, 189, 248, 0.28)',
                  borderRadius: 10,
                  padding: '7px 10px',
                  marginBottom: 8,
                  fontSize: 12,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                  <Droplets size={14} color="#38bdf8" />
                  微地形：<strong>{data.landformLabel}</strong>
                </span>
                <span style={{ color: '#9aa9a0', fontSize: 10.5 }}>
                  凹度 {data.concavityM !== null ? `${data.concavityM > 0 ? '+' : ''}${data.concavityM}m` : '—'}
                  {moistF ? ` · 理想 ${moistF.ideal}` : ''}
                  {data.weather?.rain7dIn !== null && data.weather?.rain7dIn !== undefined
                    ? ` · 7日雨 ${data.weather.rain7dIn}"`
                    : ''}
                </span>
              </div>
            )}
          </>
        );
      })()}

      {/* USDA NRCS SSURGO Live Soil Info (super useful for Matsutake & forest typing) */}
      {data.soil && (
        <div
          style={{
            background: data.soil.matsutakeFriendly
              ? 'rgba(217, 119, 6, 0.18)'
              : 'rgba(148, 163, 184, 0.09)',
            border: data.soil.matsutakeFriendly
              ? '1px solid rgba(245, 158, 11, 0.5)'
              : '1px solid rgba(148, 163, 184, 0.24)',
            borderRadius: 10,
            padding: '7px 10px',
            marginBottom: 8,
            fontSize: 11,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
              color: '#f8fafc',
              fontWeight: 700,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Layers size={13} color="#f59e0b" />
              USDA 土壤：{data.soil.componentName || 'SSURGO'} ({data.soil.drainageClass})
            </span>
            {data.soil.matsutakeFriendly && (
              <span
                style={{
                  background:
                    data.soil.matsutakeTier === 'prime'
                      ? '#d97706'
                      : data.soil.matsutakeTier === 'moderate'
                        ? '#b45309'
                        : '#64748b',
                  color: '#fff',
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 999,
                  flexShrink: 0,
                }}
              >
                {data.soil.matsutakeBadge || '松茸砂/火山灰土'}
              </span>
            )}
          </div>
          <div style={{ color: '#9aa9a0', marginTop: 2 }}>{data.soil.mapUnitName}</div>
        </div>
      )}

      {/* Wildfire perimeter info */}
      {data.fires.length > 0 && (
        <div
          style={{
            background: 'rgba(224, 105, 54, 0.14)',
            border: '1px solid rgba(224, 105, 54, 0.45)',
            borderRadius: 11,
            padding: '8px 10px',
            marginBottom: 8,
          }}
        >
          {data.fires.map((f, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={16} color="#ff7043" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {f.name} ({f.year}) · 评级 {f.rank}
                </div>
                <div style={{ fontSize: 11, color: '#fed7aa' }}>
                  过火面积 {f.acres.toLocaleString()} ac · 州 {f.state}
                  {f.discoveryDate ? ` · 起火 ${f.discoveryDate}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legal Foraging Zone status */}
      {data.publicAccess ? (
        <div
          style={{
            background:
              data.publicAccess.status === 'legal'
                ? 'rgba(16, 185, 129, 0.14)'
                : data.publicAccess.status === 'restricted'
                  ? 'rgba(245, 158, 11, 0.14)'
                  : 'rgba(239, 68, 68, 0.16)',
            border:
              data.publicAccess.status === 'legal'
                ? '1px solid rgba(16, 185, 129, 0.45)'
                : data.publicAccess.status === 'restricted'
                  ? '1px solid rgba(245, 158, 11, 0.45)'
                  : '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: 11,
            padding: '8px 10px',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <ShieldCheck
            size={17}
            color={
              data.publicAccess.status === 'legal'
                ? '#34d399'
                : data.publicAccess.status === 'restricted'
                  ? '#fbbf24'
                  : '#f87171'
            }
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
              {data.publicAccess.statusLabel}
            </div>
            <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 2 }}>
              {data.publicAccess.unitName || '公共土地'}
              {data.publicAccess.manager ? ` · ${data.publicAccess.manager}` : ''}
              {data.publicAccess.designation ? ` (${data.publicAccess.designation})` : ''}
            </div>
            <div style={{ fontSize: 11, color: '#9aa9a0', marginTop: 3, lineHeight: 1.35 }}>
              {data.publicAccess.ruleHint}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid rgba(148, 163, 184, 0.28)',
            borderRadius: 11,
            padding: '8px 10px',
            marginBottom: 10,
            fontSize: 11,
            color: '#cbd5e1',
            lineHeight: 1.4,
          }}
        >
          <strong>未命中合法公共林地（可能为私有林地 / 商业林场）</strong>：请勿擅自进入，采摘前务必确认权属或持有林场通行许可。
        </div>
      )}

      {/* Save waypoint form */}
      {!adding ? (
        <button className="action-btn" onClick={() => setAdding(true)}>
          <BookmarkPlus size={15} /> 收藏为采菇点位
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="filter-input"
              placeholder={`点位名称（如：${profile.shortName}黄金点）`}
              value={wpName}
              onChange={(e) => setWpName(e.target.value)}
            />
            <select
              className="filter-select"
              value={species}
              onChange={(e) => setSpecies(e.target.value as ForageWaypoint['species'])}
            >
              {SPECIES_CATALOG.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.emoji} {sp.shortName}
                </option>
              ))}
              <option value="Other">其他</option>
            </select>
          </div>
          <input
            className="filter-input"
            placeholder="备注（腐木/土壤/停车点）"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="action-btn" onClick={handleSave}>
              <Trees size={14} /> 确认保存
            </button>
            <button className="action-btn secondary" onClick={() => setAdding(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
