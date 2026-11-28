import React from 'react';
import { Check, Copy, Link2, Lock, Share2, X } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations';
import type { BasemapId, EcoRegionFilter, Lang, SpeciesId } from '../types/map';
import { buildSharedViewUrl, canUseNativeShare, getCleanAppUrl } from '../utils/shareUrl';

interface ShareModalProps {
  open: boolean;
  lang: Lang;
  speciesId: SpeciesId;
  speciesLabel: string;
  center: [number, number];
  zoom: number;
  filterStrength: number;
  ecoRegionFilter: EcoRegionFilter;
  legalOnly: boolean;
  basemapId: BasemapId;
  onShareApp: (preferNative: boolean) => Promise<void>;
  onShareView: (preferNative: boolean) => Promise<void>;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  open,
  lang,
  speciesId,
  speciesLabel,
  center,
  zoom,
  filterStrength,
  ecoRegionFilter,
  legalOnly,
  basemapId,
  onShareApp,
  onShareView,
  onClose,
}) => {
  const [copiedWhich, setCopiedWhich] = React.useState<'app' | 'view' | null>(null);

  if (!open) return null;

  const t = UI_TEXT[lang];
  const cleanUrl = getCleanAppUrl();
  const viewUrl = buildSharedViewUrl({
    speciesId,
    center,
    zoom,
    filterStrength,
    ecoRegionFilter,
    legalOnly,
    basemapId,
  });
  const nativeSupported = canUseNativeShare();

  const slopeLabel =
    ecoRegionFilter === 'east'
      ? t.ecoFilterEast
      : ecoRegionFilter === 'west'
        ? t.ecoFilterWest
        : t.ecoFilterAll;

  const handleCopy = async (which: 'app' | 'view') => {
    if (which === 'app') {
      await onShareApp(false);
    } else {
      await onShareView(false);
    }
    setCopiedWhich(which);
    window.setTimeout(() => setCopiedWhich((prev) => (prev === which ? null : prev)), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="species-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="species-emoji-badge" style={{ borderColor: '#a78bfa' }}>
              <Share2 size={18} color="#a78bfa" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t.shareModalTitle}</h3>
              <div style={{ fontSize: 11, color: '#9aa9a0', marginTop: 2 }}>
                {t.shareModalSubtitle}
              </div>
            </div>
          </div>
          <button className="icon-close" onClick={onClose} aria-label="Close share modal">
            <X size={17} />
          </button>
        </div>

        <div className="species-modal-body">
          {/* 1. Clean App URL Card */}
          <div className="share-card">
            <div className="share-card-title">
              <Link2 size={14} color="#38bdf8" />
              <span>{t.shareAppCardTitle}</span>
            </div>
            <div className="share-card-desc">{t.shareAppCardDesc}</div>
            <div className="share-url-box">{cleanUrl}</div>
            <div className="share-btn-row">
              <button className="share-action-btn primary" onClick={() => handleCopy('app')}>
                {copiedWhich === 'app' ? <Check size={14} /> : <Copy size={14} />}
                <span>{t.shareCopyAppBtn}</span>
              </button>
              {nativeSupported && (
                <button className="share-action-btn" onClick={() => onShareApp(true)}>
                  <Share2 size={14} />
                  <span>{t.shareNativeBtn}</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Stateful Map View URL Card */}
          <div className="share-card">
            <div className="share-card-title">
              <Share2 size={14} color="#facc15" />
              <span>{t.shareViewCardTitle}</span>
            </div>
            <div className="share-card-desc">{t.shareViewCardDesc}</div>
            <div className="share-meta-pills">
              <span className="share-meta-pill">{speciesLabel}</span>
              <span className="share-meta-pill">
                {center[1].toFixed(4)}, {center[0].toFixed(4)} · Z{zoom.toFixed(1)}
              </span>
              <span className="share-meta-pill">
                {t.filterStrengthLabel} {filterStrength}%
              </span>
              <span className="share-meta-pill">{slopeLabel}</span>
              <span className="share-meta-pill">
                {t.legalLandBtn}: {legalOnly ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="share-url-box">{viewUrl}</div>
            <div className="share-privacy-note">
              <Lock size={12} style={{ flexShrink: 0 }} />
              <span>{t.sharePrivacyNote}</span>
            </div>
            <div className="share-btn-row">
              <button className="share-action-btn accent" onClick={() => handleCopy('view')}>
                {copiedWhich === 'view' ? <Check size={14} /> : <Copy size={14} />}
                <span>{t.shareCopyViewBtn}</span>
              </button>
              {nativeSupported && (
                <button className="share-action-btn" onClick={() => onShareView(true)}>
                  <Share2 size={14} />
                  <span>{t.shareNativeBtn}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="species-modal-footer">
          <button
            className="action-btn"
            style={{ background: '#a78bfa', color: '#0c1412' }}
            onClick={onClose}
          >
            {t.settingsDone}
          </button>
        </div>
      </div>
    </div>
  );
};
