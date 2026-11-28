import React, { useRef } from 'react';
import {
  Download,
  ExternalLink,
  MapPin,
  Navigation,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { getSpeciesProfile, getSpeciesShortName } from '../data/speciesCatalog';
import { UI_TEXT } from '../i18n/translations';
import type { ForageWaypoint, Lang, UnitSettings } from '../types/map';
import { formatDistanceFromCenter, haversineMiles } from '../utils/geo';
import { formatElevation } from '../utils/units';
import {
  exportWaypointsToGpx,
  exportWaypointsToJson,
  getAppleMapsNavUrl,
  getGoogleMapsNavUrl,
  triggerTextDownload,
} from '../utils/waypointsIO';

interface WaypointsSheetProps {
  open: boolean;
  waypoints: ForageWaypoint[];
  mapCenter: [number, number];
  lang: Lang;
  units: UnitSettings;
  onClose: () => void;
  onFlyTo: (wp: ForageWaypoint) => void;
  onDelete: (id: string) => void;
  onImportWaypoints: (fileText: string, filename: string) => void;
  onExportFeedback: (fmt: 'GPX' | 'JSON' | 'EMPTY', count: number) => void;
}

export const WaypointsSheet: React.FC<WaypointsSheetProps> = ({
  open,
  waypoints,
  mapCenter,
  lang,
  units,
  onClose,
  onFlyTo,
  onDelete,
  onImportWaypoints,
  onExportFeedback,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const t = UI_TEXT[lang];

  const handleExportGpx = () => {
    if (waypoints.length === 0) {
      onExportFeedback('EMPTY', 0);
      return;
    }
    const gpx = exportWaypointsToGpx(waypoints);
    triggerTextDownload(gpx, 'mushroom-map-waypoints.gpx', 'application/gpx+xml');
    onExportFeedback('GPX', waypoints.length);
  };

  const handleExportJson = () => {
    if (waypoints.length === 0) {
      onExportFeedback('EMPTY', 0);
      return;
    }
    const json = exportWaypointsToJson(waypoints);
    triggerTextDownload(json, 'mushroom-map-waypoints.json', 'application/json');
    onExportFeedback('JSON', waypoints.length);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      onImportWaypoints(text, file.name);
    } catch {
      onImportWaypoints('', file.name);
    }
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer-panel">
        <div className="drawer-header">
          <h2>{t.waypointsTitle(waypoints.length)}</h2>
          <button className="icon-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="waypoints-io-bar">
            <button className="io-btn" onClick={handleExportGpx}>
              <Download size={13} />
              <span>{t.wpExportGpx}</span>
            </button>
            <button className="io-btn" onClick={handleExportJson}>
              <Download size={13} />
              <span>{t.wpExportJson}</span>
            </button>
            <button
              className="io-btn import"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} />
              <span>{t.wpImportBtn}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".gpx,.json,.xml,application/gpx+xml,application/json,text/xml"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {waypoints.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9aa9a0', lineHeight: 1.6, padding: 8 }}>
              {t.waypointsEmpty}
            </div>
          ) : (
            waypoints.map((wp) => {
              const spLabel =
                wp.species === 'Other'
                  ? t.wpOtherShort
                  : getSpeciesShortName(getSpeciesProfile(wp.species), lang);
              return (
                <div className="fire-item" key={wp.id}>
                  <div
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 9, flex: 1, minWidth: 0 }}
                    onClick={() => {
                      onFlyTo(wp);
                      onClose();
                    }}
                  >
                    <MapPin size={18} color="#54e36c" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{wp.name}</div>
                      <div style={{ fontSize: 11, color: '#9aa9a0', marginTop: 2 }}>
                        {spLabel}
                        {wp.elevationFt !== null
                          ? ` · ${formatElevation(wp.elevationFt, units)}`
                          : ''}{' '}
                        · {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                      </div>
                      <div className="poi-distance-pill">
                        {t.distFromCenter}{' '}
                        {formatDistanceFromCenter(
                          haversineMiles(mapCenter[0], mapCenter[1], wp.lng, wp.lat),
                          units,
                        )}
                      </div>
                      {wp.notes && (
                        <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 3 }}>
                          {wp.notes}
                        </div>
                      )}
                      <div className="nav-links-row" onClick={(e) => e.stopPropagation()}>
                        <a
                          className="nav-link-pill"
                          href={getGoogleMapsNavUrl(wp.lat, wp.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation size={11} />
                          <span>{t.wpNavGoogleShort}</span>
                          <ExternalLink size={10} />
                        </a>
                        <a
                          className="nav-link-pill"
                          href={getAppleMapsNavUrl(wp.lat, wp.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation size={11} />
                          <span>{t.wpNavAppleShort}</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="icon-close"
                      onClick={() => {
                        onFlyTo(wp);
                        onClose();
                      }}
                      aria-label="Fly to waypoint"
                    >
                      <Navigation size={14} color="#e06936" />
                    </button>
                    <button
                      className="icon-close"
                      onClick={() => onDelete(wp.id)}
                      aria-label="Delete waypoint"
                    >
                      <Trash2 size={14} color="#f87171" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
