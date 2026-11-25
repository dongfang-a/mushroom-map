import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Camera,
  ChevronLeft,
  Compass,
  Eye,
  Mountain,
  Trees,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  getCurrentSeasonStatus,
  getSpeciesDisplayName,
  getSpeciesElevSummary,
  getSpeciesGuide,
  getSpeciesSeasonSummary,
  getSpeciesShortName,
  type SpeciesProfile,
} from '../data/speciesCatalog';
import { SPECIES_DEMO_PHOTOS, type SpeciesPhotoItem } from '../data/speciesPhotos';
import { formatMonthLabel, MONTH_SHORT_EN, UI_TEXT } from '../i18n/translations';
import type { Lang, UnitSettings } from '../types/map';

interface SpeciesGuideModalProps {
  profile: SpeciesProfile | null;
  lang: Lang;
  units: UnitSettings;
  onClose: () => void;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const SpeciesGuideModal: React.FC<SpeciesGuideModalProps> = ({
  profile,
  lang,
  units,
  onClose,
}) => {
  const [showPhotoDemo, setShowPhotoDemo] = useState(false);
  const [activeAngleIdx, setActiveAngleIdx] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState<SpeciesPhotoItem | null>(null);

  useEffect(() => {
    setShowPhotoDemo(false);
    setActiveAngleIdx(0);
    setLightboxPhoto(null);
  }, [profile?.id]);

  if (!profile) return null;

  const t = UI_TEXT[lang];
  const currentMonth = new Date().getMonth() + 1;
  const monthStr = formatMonthLabel(currentMonth, lang);
  const season = getCurrentSeasonStatus(profile.peakMonths, lang);
  const seasonSummary = getSpeciesSeasonSummary(profile, lang);
  const elevSummary = getSpeciesElevSummary(profile, lang, units);
  const guide = getSpeciesGuide(profile, lang);
  const displayName = getSpeciesDisplayName(profile, lang);
  const shortName = getSpeciesShortName(profile, lang);
  const photos = SPECIES_DEMO_PHOTOS[profile.id] || [];

  const seasonHeadline =
    season.tone === 'peak'
      ? t.seasonHeadlinePeak(monthStr)
      : season.tone === 'shoulder'
        ? t.seasonHeadlineShoulder(monthStr)
        : t.seasonHeadlineOff(monthStr, seasonSummary);

  const seasonSubline =
    season.tone === 'peak'
      ? t.seasonSubPeak(seasonSummary)
      : season.tone === 'shoulder'
        ? t.seasonSubShoulder(seasonSummary)
        : t.seasonSubOff;

  const activePhoto = photos[activeAngleIdx];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="species-modal" onClick={(e) => e.stopPropagation()}>
        <div className="species-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {showPhotoDemo ? (
              <button
                className="icon-close"
                onClick={() => setShowPhotoDemo(false)}
                aria-label="Back to species guide"
                style={{ width: 34, height: 34, flexShrink: 0 }}
              >
                <ChevronLeft size={18} />
              </button>
            ) : (
              <div
                className="species-emoji-badge"
                style={{ borderColor: profile.accentColor }}
              >
                {profile.emoji}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                  {showPhotoDemo ? t.guidePhotoTitle(shortName) : displayName}
                </h3>
                <span className={`season-pill-strong tone-${season.tone}`}>
                  {season.tone === 'peak' ? '● ' : season.tone === 'off' ? '⛔ ' : '⏳ '}
                  {season.label}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#9aa9a0', marginTop: 2 }}>
                <em>{profile.scientificName}</em>
                {lang === 'zh' ? ` · ${profile.englishName}` : ` · ${profile.name}`}
              </div>
            </div>
          </div>
          <button className="icon-close" onClick={onClose} aria-label="Close modal">
            <X size={17} />
          </button>
        </div>

        {!showPhotoDemo ? (
          <div className="species-modal-body">
            {/* High-Contrast Full-Width Season Banner + 12-Month Visual Calendar */}
            <div className={`season-hero-banner tone-${season.tone}`}>
              <div className="season-hero-title">{seasonHeadline}</div>
              <div className="season-hero-sub">{seasonSubline}</div>
              <div className="season-months-bar" aria-label="12-month fruiting calendar">
                {MONTHS.map((m) => {
                  const isPeak = profile.peakMonths.includes(m);
                  const isNow = m === currentMonth;
                  return (
                    <div
                      key={m}
                      className={`season-month-cell ${isPeak ? 'is-peak' : ''} ${isNow ? 'is-now' : ''}`}
                      title={t.monthTooltip(m, isPeak, isNow)}
                    >
                      <span>{lang === 'en' ? MONTH_SHORT_EN[m - 1][0] : m}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3-Angle Offline Reference Photo Demo Trigger */}
            {photos.length > 0 && (
              <button
                className="photo-demo-trigger"
                onClick={() => {
                  setActiveAngleIdx(0);
                  setShowPhotoDemo(true);
                }}
                aria-label="Open 3-angle mushroom photo demo"
              >
                <div className="photo-demo-thumbs">
                  {photos.map((ph) => (
                    <img
                      key={ph.angle}
                      src={ph.src}
                      alt={lang === 'en' ? ph.angleShortEn : ph.angleShort}
                    />
                  ))}
                </div>
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Camera size={14} color="#facc15" />
                    {t.photoDemoBtnTitle}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#cbd5e1', marginTop: 2 }}>
                    {t.photoDemoBtnSub}
                  </div>
                </div>
              </button>
            )}

            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderLeft: `3px solid ${profile.accentColor}`,
                borderRadius: '0 10px 10px 0',
                padding: '8px 10px',
                fontSize: 12.5,
                lineHeight: 1.45,
                color: '#f1f5f9',
              }}
            >
              {guide.tagline}
            </div>

            <div className="guide-row-grid">
              <div className="guide-pill-box">
                <div className="guide-pill-label">
                  <Calendar size={12} color={profile.accentColor} /> {t.guideSeasonPill}
                </div>
                <div className="guide-pill-value">{seasonSummary}</div>
              </div>
              <div className="guide-pill-box">
                <div className="guide-pill-label">
                  <Mountain size={12} color={profile.accentColor} /> {t.guideElevPill}
                </div>
                <div className="guide-pill-value">{elevSummary}</div>
              </div>
            </div>

            <div className="guide-block">
              <div className="guide-block-title">
                <Calendar size={13} color={profile.accentColor} /> {t.guideSeasonBlock}
              </div>
              <p>{guide.seasonDetail}</p>
            </div>

            <div className="guide-block">
              <div className="guide-block-title">
                <Trees size={13} color="#4ade80" /> {t.guideHabitatBlock}
              </div>
              <p>{guide.habitat}</p>
            </div>

            <div className="guide-block">
              <div className="guide-block-title">
                <Compass size={13} color="#38bdf8" /> {t.guideMapTipsBlock}
              </div>
              <p>{guide.mapTips}</p>
            </div>

            <div className="guide-block">
              <div className="guide-block-title">
                <Eye size={13} color="#facc15" /> {t.guideIdTraitsBlock}
              </div>
              <p>{guide.idTraits}</p>
            </div>

            <div className="guide-block warning">
              <div className="guide-block-title" style={{ color: '#fca5a5' }}>
                <AlertTriangle size={13} color="#f87171" /> {t.guideSafetyBlock}
              </div>
              <p style={{ color: '#fecaca' }}>{guide.safetyWarning}</p>
            </div>
          </div>
        ) : (
          <div className="species-modal-body">
            {/* 3-Angle Tabs */}
            <div className="photo-angle-tabs">
              {photos.map((ph, idx) => (
                <button
                  key={ph.angle}
                  className={`photo-angle-tab ${activeAngleIdx === idx ? 'active' : ''}`}
                  onClick={() => setActiveAngleIdx(idx)}
                >
                  {lang === 'en' ? ph.angleShortEn : ph.angleShort}
                </button>
              ))}
            </div>

            {/* Active Large Photo Card */}
            {activePhoto && (
              <div className="photo-hero-card">
                <div
                  className="photo-hero-img-wrap"
                  onClick={() => setLightboxPhoto(activePhoto)}
                  title={t.photoZoomHint}
                >
                  <img
                    src={activePhoto.src}
                    alt={`${shortName} - ${lang === 'en' ? activePhoto.angleLabelEn : activePhoto.angleLabel}`}
                  />
                  <span className="photo-zoom-hint">
                    <ZoomIn size={12} /> {t.photoZoomHint}
                  </span>
                </div>
                <div className="photo-hero-meta">
                  <div className="photo-hero-angle">
                    {lang === 'en' ? activePhoto.angleLabelEn : activePhoto.angleLabel}
                  </div>
                  <p className="photo-hero-caption">
                    {lang === 'en' ? activePhoto.captionEn : activePhoto.caption}
                  </p>
                  <div className="photo-hero-attr">
                    {t.photoSourcePrefix}
                    {activePhoto.attribution}
                  </div>
                </div>
              </div>
            )}

            {/* Quick 3-Angle Side-by-Side Comparison Strip */}
            <div className="photo-strip-grid">
              {photos.map((ph, idx) => (
                <button
                  key={ph.angle}
                  className={`photo-strip-item ${activeAngleIdx === idx ? 'active' : ''}`}
                  onClick={() => setActiveAngleIdx(idx)}
                >
                  <img src={ph.src} alt={lang === 'en' ? ph.angleShortEn : ph.angleShort} />
                  <span>{lang === 'en' ? ph.angleShortEn : ph.angleShort}</span>
                </button>
              ))}
            </div>

            <div className="guide-block warning">
              <div className="guide-block-title" style={{ color: '#fca5a5' }}>
                <AlertTriangle size={13} color="#f87171" /> {t.guidePhotoSafetyBlock}
              </div>
              <p style={{ color: '#fecaca' }}>{guide.safetyWarning}</p>
            </div>
          </div>
        )}

        <div className="species-modal-footer">
          {showPhotoDemo ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="action-btn"
                style={{ flex: 1, background: '#242e29', color: '#e2e8f0' }}
                onClick={() => setShowPhotoDemo(false)}
              >
                {t.backToTextGuide}
              </button>
              <button
                className="action-btn"
                style={{ flex: 1.3, background: profile.accentColor, color: '#111513' }}
                onClick={onClose}
              >
                {t.startMapBtn}
              </button>
            </div>
          ) : (
            <button
              className="action-btn"
              style={{ background: profile.accentColor, color: '#111513' }}
              onClick={onClose}
            >
              {t.gotItBtn}
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox Zoom */}
      {lightboxPhoto && (
        <div
          className="photo-lightbox"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxPhoto(null);
          }}
        >
          <button
            className="icon-close photo-lightbox-close"
            onClick={() => setLightboxPhoto(null)}
            aria-label="Close fullscreen photo"
          >
            <X size={20} />
          </button>
          <img
            src={lightboxPhoto.src}
            alt={lang === 'en' ? lightboxPhoto.angleLabelEn : lightboxPhoto.angleLabel}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="photo-lightbox-caption" onClick={(e) => e.stopPropagation()}>
            <strong>
              {lang === 'en' ? lightboxPhoto.angleLabelEn : lightboxPhoto.angleLabel}
            </strong>{' '}
            · {lang === 'en' ? lightboxPhoto.captionEn : lightboxPhoto.caption}
          </div>
        </div>
      )}
    </div>
  );
};
