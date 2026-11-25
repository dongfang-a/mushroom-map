import React, { useEffect, useState } from 'react';
import {
  BookmarkPlus,
  Camera,
  CloudRain,
  Copy,
  Droplets,
  ExternalLink,
  Flame,
  Layers,
  ShieldCheck,
  Trees,
  X,
} from 'lucide-react';
import {
  getSpeciesProfile,
  getSpeciesShortName,
  SPECIES_CATALOG,
} from '../data/speciesCatalog';
import { localizeLegality, localizeSoilBadge, UI_TEXT } from '../i18n/translations';
import {
  computeSpeciesScore,
  concavityToLandform,
  degreesToCompass,
} from '../services/tileEngines';
import type {
  ForageWaypoint,
  Lang,
  PointInspection,
  SpeciesId,
  UnitSettings,
} from '../types/map';
import {
  formatAreaFromAcres,
  formatElevation,
  formatElevationSecondary,
  formatRainFromIn,
  formatSmallMeters,
  formatTemperatureFromF,
} from '../utils/units';

interface PointInspectorProps {
  data: PointInspection | null;
  speciesId: SpeciesId;
  lang: Lang;
  units: UnitSettings;
  onClose: () => void;
  onCopyCoords: (text: string) => void;
  onSaveWaypoint: (wp: Omit<ForageWaypoint, 'id' | 'createdAt'>) => void;
}

export const PointInspector: React.FC<PointInspectorProps> = ({
  data,
  speciesId,
  lang,
  units,
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

  const t = UI_TEXT[lang];
  const activeSpId = data.activeSpeciesId || speciesId;
  const profile = getSpeciesProfile(activeSpId);
  const spShort = getSpeciesShortName(profile, lang);
  const coordStr = `${data.lat.toFixed(5)}, ${data.lng.toFixed(5)}`;

  // Recompute localized score/tier/breakdown reactively whenever lang or units changes!
  const liveScored =
    !data.loading &&
    data.elevationFt !== null &&
    data.slopePct !== null &&
    data.aspectDeg !== null &&
    data.concavityM !== null
      ? computeSpeciesScore(
          activeSpId,
          data.elevationFt,
          data.slopePct,
          data.aspectDeg,
          data.concavityM,
          data.canopyPct,
          data.metersPerPx ?? 26,
          data.landCoverClass ?? null,
          true,
          lang,
          units,
          data.lng,
          data.lat,
        )
      : null;

  const displayScore = liveScored ? liveScored.score : data.activeScore;
  const displayTier = liveScored ? liveScored.tier : data.activeTier;
  const displayBreakdown = liveScored?.breakdown || data.scoreBreakdown || [];
  const displayLandform =
    data.concavityM !== null ? concavityToLandform(data.concavityM, lang) : data.landformLabel;
  const displayAspectDir =
    data.aspectDeg !== null ? degreesToCompass(data.aspectDeg, lang) : data.aspectDir;

  const localizedAccess = data.publicAccess
    ? data.publicAccess.ruleKey
      ? localizeLegality(data.publicAccess.ruleKey, lang)
      : {
          statusLabel: data.publicAccess.statusLabel,
          ruleHint: data.publicAccess.ruleHint,
        }
    : null;

  const soilBadge = data.soil ? localizeSoilBadge(data.soil.matsutakeTier, lang) : null;

  const handleSave = () => {
    const selLabel =
      species === 'Other'
        ? t.wpOtherSpecies
        : getSpeciesShortName(getSpeciesProfile(species), lang);
    onSaveWaypoint({
      name: wpName.trim() || t.wpDefaultName(selLabel),
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
            {profile.emoji} {spShort}
            {t.inspectorTitleSuffix}
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
              {t.inatCardHeader(data.inatSighting.observedOn)}
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
              <span>{data.inatSighting.obscured ? t.gpsObscured : t.gpsExact}</span>
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
                {t.inatOriginalLink} <ExternalLink size={11} />
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
          marginBottom: displayBreakdown.length > 0 ? 6 : 8,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: profile.accentColor, fontWeight: 600 }}>
            {t.realtimeSuitability(spShort, profile.scientificName)}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginTop: 1 }}>
            {data.loading ? t.calculating : displayTier || '—'}
          </div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: profile.accentColor }}>
          {displayScore !== null ? `${displayScore}` : '--'}
          <span style={{ fontSize: 11, color: '#9aa9a0', fontWeight: 600 }}>/100</span>
        </div>
      </div>

      {/* Color-coded Bonus / Penalty Reasons with Ideal Reference Targets */}
      {!data.loading && displayBreakdown.length > 0 && (() => {
        const order = { penalty: 0, neutral: 1, bonus: 2 };
        const sorted = [...displayBreakdown].sort(
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
                <span className="reason-ideal">
                  {t.idealPrefix} {item.ideal}
                </span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Elevation / Slope / Aspect / Canopy with Status Highlight & Ideal Reference */}
      {(() => {
        const byKey = new Map(displayBreakdown.map((f) => [f.key, f]));
        const elevF = byKey.get('elevation');
        const slopeF = byKey.get('slope');
        const aspectF = byKey.get('aspect');
        const canopyF = byKey.get('canopy');
        const moistF = byKey.get('moisture');
        return (
          <>
            <div className="metrics-grid">
              <div className={`metric-box ${elevF ? `metric-${elevF.status}` : ''}`}>
                <div className="metric-label">{t.metricElev}</div>
                <div className="metric-val">{formatElevation(data.elevationFt, units)}</div>
                <div className="metric-sub">
                  {formatElevationSecondary(data.elevationFt, data.elevationM, units)}
                </div>
                {elevF && (
                  <div className="metric-ideal">
                    {t.idealPrefix} {elevF.ideal}
                  </div>
                )}
              </div>
              <div className={`metric-box ${slopeF ? `metric-${slopeF.status}` : ''}`}>
                <div className="metric-label">{t.metricSlope}</div>
                <div className="metric-val">
                  {data.slopePct !== null ? `${data.slopePct}%` : '—'}
                </div>
                <div className="metric-sub">
                  {data.slopeDeg !== null ? `${data.slopeDeg}°` : ''}
                </div>
                {slopeF && (
                  <div className="metric-ideal">
                    {t.idealPrefix} {slopeF.ideal}
                  </div>
                )}
              </div>
              <div className={`metric-box ${aspectF ? `metric-${aspectF.status}` : ''}`}>
                <div className="metric-label">{t.metricAspect}</div>
                <div className="metric-val">
                  {displayAspectDir ? displayAspectDir.split(' ')[0] : '—'}
                </div>
                <div className="metric-sub">
                  {data.aspectDeg !== null ? `${data.aspectDeg}°` : ''}
                </div>
                {aspectF && (
                  <div className="metric-ideal">
                    {t.idealPrefix} {aspectF.ideal}
                  </div>
                )}
              </div>
              <div className={`metric-box ${canopyF ? `metric-${canopyF.status}` : ''}`}>
                <div className="metric-label">{t.metricCanopy}</div>
                <div className="metric-val">
                  {data.canopyPct !== null ? `${data.canopyPct}%` : '—'}
                </div>
                <div className="metric-sub">NLCD 30m</div>
                {canopyF && (
                  <div className="metric-ideal">
                    {t.idealPrefix} {canopyF.ideal}
                  </div>
                )}
              </div>
            </div>

            {/* Micro-topography moisture / concavity strip */}
            {displayLandform && (
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
                  {t.microtopoLabel}
                  <strong>{displayLandform}</strong>
                </span>
                <span style={{ color: '#9aa9a0', fontSize: 10.5 }}>
                  {t.concavityLabel}{' '}
                  {data.concavityM !== null ? formatSmallMeters(data.concavityM, units, true) : '—'}
                  {moistF ? ` · ${t.idealPrefix} ${moistF.ideal}` : ''}
                </span>
              </div>
            )}
          </>
        );
      })()}

      {/* Live Weather & Soil Temp Strip (Rain in/mm + Soil Temp °F/°C + Moisture %) */}
      {data.weather &&
        (data.weather.rain7dIn !== null ||
          data.weather.soilTempF !== null ||
          data.weather.soilMoisturePct !== null) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6,
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 10,
              padding: '7px 10px',
              marginBottom: 8,
              fontSize: 11.5,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                color: '#bfdbfe',
                fontWeight: 700,
              }}
            >
              <CloudRain size={13} color="#60a5fa" />
              {t.weatherStripTitle}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                color: '#e2e8f0',
                fontSize: 11,
              }}
            >
              {data.weather.rain24hIn !== null && (
                <span>
                  {t.rain24hLabel} <strong>{formatRainFromIn(data.weather.rain24hIn, units)}</strong>
                </span>
              )}
              {data.weather.rain7dIn !== null && (
                <span>
                  {t.rain7dLabel} <strong>{formatRainFromIn(data.weather.rain7dIn, units)}</strong>
                </span>
              )}
              {data.weather.soilTempF !== null && (
                <span>
                  {t.soilTempLabel}{' '}
                  <strong>{formatTemperatureFromF(data.weather.soilTempF, units)}</strong>
                </span>
              )}
              {data.weather.soilMoisturePct !== null && (
                <span>
                  {t.soilMoistLabel} <strong>{data.weather.soilMoisturePct}%</strong>
                </span>
              )}
            </span>
          </div>
        )}

      {/* USDA NRCS SSURGO Live Soil Info */}
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
              {t.usdaSoilPrefix}
              {data.soil.componentName || 'SSURGO'} ({data.soil.drainageClass})
            </span>
            {data.soil.matsutakeFriendly && soilBadge && (
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
                {soilBadge}
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
                  {f.name} ({f.year}) · {t.fireRankPrefix} {f.rank}
                </div>
                <div style={{ fontSize: 11, color: '#fed7aa' }}>
                  {t.fireBurnedArea} {formatAreaFromAcres(f.acres, units, lang)} · {t.fireStatePrefix}{' '}
                  {f.state}
                  {f.discoveryDate ? ` · ${t.fireStartPrefix} ${f.discoveryDate}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legal Foraging Zone status */}
      {data.publicAccess && localizedAccess ? (
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
              {localizedAccess.statusLabel}
            </div>
            <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 2 }}>
              {data.publicAccess.unitName || t.publicLandFallback}
              {data.publicAccess.manager ? ` · ${data.publicAccess.manager}` : ''}
              {data.publicAccess.designation ? ` (${data.publicAccess.designation})` : ''}
            </div>
            <div style={{ fontSize: 11, color: '#9aa9a0', marginTop: 3, lineHeight: 1.35 }}>
              {localizedAccess.ruleHint}
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
          <strong>{t.privateLandWarnTitle}</strong>
          {t.privateLandWarnBody}
        </div>
      )}

      {/* Save waypoint form */}
      {!adding ? (
        <button className="action-btn" onClick={() => setAdding(true)}>
          <BookmarkPlus size={15} /> {t.saveWaypointBtn}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="filter-input"
              placeholder={t.wpNamePlaceholder(spShort)}
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
                  {sp.emoji} {getSpeciesShortName(sp, lang)}
                </option>
              ))}
              <option value="Other">{t.wpOtherShort}</option>
            </select>
          </div>
          <input
            className="filter-input"
            placeholder={t.wpNotesPlaceholder}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="action-btn" onClick={handleSave}>
              <Trees size={14} /> {t.confirmSave}
            </button>
            <button className="action-btn secondary" onClick={() => setAdding(false)}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
