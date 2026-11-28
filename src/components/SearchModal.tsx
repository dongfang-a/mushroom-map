import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  Flame,
  Link2,
  MapPin,
  Navigation,
  Search,
  Trees,
  X,
} from 'lucide-react';
import { PNW_YELLOWFOOT_HOTSPOTS } from '../data/mapSources';
import { UI_TEXT } from '../i18n/translations';
import {
  parseCoordinateOrLink,
  searchLocalItems,
  searchPlacesOnline,
  type SearchResultItem,
} from '../services/searchService';
import type { FireSummary, ForageWaypoint, Lang, UnitSettings } from '../types/map';
import { formatDistanceFromCenter, haversineMiles } from '../utils/geo';

interface SearchModalProps {
  open: boolean;
  lang: Lang;
  units: UnitSettings;
  mapCenter: [number, number];
  waypoints: ForageWaypoint[];
  fires: FireSummary[];
  onClose: () => void;
  onSelectResult: (item: SearchResultItem) => void;
}

const QUICK_SUGGESTIONS = [
  'Blewett Pass',
  'Snoqualmie Pass',
  'Tiger Mountain',
  'Tillamook State Forest',
  '47.4246, -121.4136',
];

export const SearchModal: React.FC<SearchModalProps> = ({
  open,
  lang,
  units,
  mapCenter,
  waypoints,
  fires,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [onlineResults, setOnlineResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const t = UI_TEXT[lang];

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const directMatch = useMemo(() => parseCoordinateOrLink(query, lang), [query, lang]);

  const localResults = useMemo(() => {
    if (directMatch || query.trim().length < 1) return [];
    return searchLocalItems(query, waypoints, PNW_YELLOWFOOT_HOTSPOTS, fires, lang);
  }, [directMatch, query, waypoints, fires, lang]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    abortRef.current?.abort();
    if (directMatch || trimmed.length < 2) {
      setOnlineResults([]);
      setSearching(false);
      return;
    }

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const res = await searchPlacesOnline(trimmed, mapCenter, ctrl.signal);
        if (!ctrl.signal.aborted) {
          setOnlineResults(res);
          setSearching(false);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError') && !ctrl.signal.aborted) {
          setOnlineResults([]);
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [open, query, directMatch, mapCenter]);

  if (!open) return null;

  const allOrdered = [
    ...(directMatch ? [directMatch] : []),
    ...localResults,
    ...onlineResults,
  ];

  const getKindBadge = (kind: SearchResultItem['kind']) => {
    switch (kind) {
      case 'coord':
        return { icon: <Compass size={14} color="#38bdf8" />, label: 'GPS' };
      case 'share-link':
        return { icon: <Link2 size={14} color="#a78bfa" />, label: 'URL' };
      case 'waypoint':
        return { icon: <MapPin size={14} color="#54e36c" />, label: t.searchKindWaypoint };
      case 'hotspot':
        return { icon: <Trees size={14} color="#facc15" />, label: t.searchKindHotspot };
      case 'fire':
        return { icon: <Flame size={14} color="#fb923c" />, label: t.searchKindFire };
      default:
        return { icon: <Navigation size={14} color="#e2e8f0" />, label: t.searchKindPlace };
    }
  };

  const renderRow = (item: SearchResultItem) => {
    const badge = getKindBadge(item.kind);
    const dist = formatDistanceFromCenter(
      haversineMiles(mapCenter[0], mapCenter[1], item.lng, item.lat),
      units,
    );
    return (
      <button
        key={item.id}
        className={`search-result-item kind-${item.kind}`}
        onClick={() => onSelectResult(item)}
      >
        <div className="search-result-icon">{badge.icon}</div>
        <div className="search-result-main">
          <div className="search-result-title">
            <span>{item.title}</span>
            <span className="search-kind-badge">{badge.label}</span>
          </div>
          <div className="search-result-sub">{item.subtitle}</div>
        </div>
        <div className="search-result-dist">{dist}</div>
      </button>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-row">
          <Search size={17} color="#facc15" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && allOrdered.length > 0) {
                e.preventDefault();
                onSelectResult(allOrdered[0]);
              }
            }}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchBtnTitle}
          />
          {query && (
            <button
              className="icon-close"
              style={{ width: 26, height: 26 }}
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <button
            className="icon-close"
            style={{ width: 28, height: 28 }}
            onClick={onClose}
            aria-label="Close search"
          >
            <X size={16} />
          </button>
        </div>

        <div className="search-results-list">
          {!query.trim() ? (
            <div className="search-empty-box">
              <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.55 }}>
                {t.searchEmptyHint}
              </div>
              <div style={{ fontSize: 11, color: '#9aa9a0', marginTop: 10, fontWeight: 700 }}>
                {t.searchQuickExamples}
              </div>
              <div className="search-quick-chips">
                {QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="search-quick-chip"
                    onClick={() => setQuery(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {directMatch && renderRow(directMatch)}

              {localResults.length > 0 && (
                <div className="search-group-label">{t.searchGroupLocal}</div>
              )}
              {localResults.map(renderRow)}

              {onlineResults.length > 0 && (
                <div className="search-group-label">{t.searchGroupOnline}</div>
              )}
              {onlineResults.map(renderRow)}

              {searching && (
                <div className="search-status-row">{t.searchSearching}</div>
              )}

              {!searching && allOrdered.length === 0 && (
                <div className="search-status-row">{t.searchNoResults}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
