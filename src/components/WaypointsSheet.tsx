import React from 'react';
import { MapPin, Navigation, Trash2, X } from 'lucide-react';
import { getSpeciesProfile, getSpeciesShortName } from '../data/speciesCatalog';
import { UI_TEXT } from '../i18n/translations';
import type { ForageWaypoint, Lang, UnitSettings } from '../types/map';
import { formatDistanceFromCenter, haversineMiles } from '../utils/geo';
import { formatElevation } from '../utils/units';

interface WaypointsSheetProps {
  open: boolean;
  waypoints: ForageWaypoint[];
  mapCenter: [number, number];
  lang: Lang;
  units: UnitSettings;
  onClose: () => void;
  onFlyTo: (wp: ForageWaypoint) => void;
  onDelete: (id: string) => void;
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
}) => {
  if (!open) return null;

  const t = UI_TEXT[lang];

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
                    style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}
                    onClick={() => {
                      onFlyTo(wp);
                      onClose();
                    }}
                  >
                    <MapPin size={18} color="#54e36c" />
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
