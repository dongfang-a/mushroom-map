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
import { getCurrentSeasonStatus, type SpeciesProfile } from '../data/speciesCatalog';
import { SPECIES_DEMO_PHOTOS, type SpeciesPhotoItem } from '../data/speciesPhotos';

interface SpeciesGuideModalProps {
  profile: SpeciesProfile | null;
  onClose: () => void;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const SpeciesGuideModal: React.FC<SpeciesGuideModalProps> = ({
  profile,
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

  const currentMonth = new Date().getMonth() + 1;
  const season = getCurrentSeasonStatus(profile.peakMonths);
  const photos = SPECIES_DEMO_PHOTOS[profile.id] || [];

  const seasonHeadline =
    season.tone === 'peak'
      ? `✅ 当前正是采摘盛季 · ${currentMonth} 月推荐出山`
      : season.tone === 'shoulder'
        ? `⏳ 当前为季初 / 尾声 · ${currentMonth} 月局部海拔零星出菇`
        : `⛔ 当前非当季（当前 ${currentMonth} 月 · 盛季 ${profile.seasonSummary}）`;

  const seasonSubline =
    season.tone === 'peak'
      ? `本月命中黄金窗口（${profile.seasonSummary}），可结合热力图与近 30 天实拍直接选点`
      : season.tone === 'shoulder'
        ? `临近出菇边缘（盛季 ${profile.seasonSummary}），建议重点看低/高海拔临界带`
        : `此时野外极难遇到该菌种，当前更适合提前踩点研究地形与往年实拍热区`;

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
                  {showPhotoDemo ? `${profile.shortName} · 3 角度辨识图鉴` : profile.name}
                </h3>
                <span className={`season-pill-strong tone-${season.tone}`}>
                  {season.tone === 'peak' ? '● ' : season.tone === 'off' ? '⛔ ' : '⏳ '}
                  {season.label}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#9aa9a0', marginTop: 2 }}>
                <em>{profile.scientificName}</em> · {profile.englishName}
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
                      title={`${m} 月${isPeak ? '（盛季）' : '（非盛季）'}${isNow ? ' · 当前月份' : ''}`}
                    >
                      <span>{m}</span>
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
                    <img key={ph.angle} src={ph.src} alt={ph.angleShort} />
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
                    查看 3 角度辨识图鉴（离线内置）
                  </div>
                  <div style={{ fontSize: 10.5, color: '#cbd5e1', marginTop: 2 }}>
                    俯视（上下） · 侧面 · 仰视（下上/剖面）实拍对比
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
              {profile.guide.tagline}
            </div>

            <div className="guide-row-grid">
              <div className="guide-pill-box">
                <div className="guide-pill-label">
                  <Calendar size={12} color={profile.accentColor} /> 采摘时节
                </div>
                <div className="guide-pill-value">{profile.seasonSummary}</div>
              </div>
              <div className="guide-pill-box">
                <div className="guide-pill-label">
                  <Mountain size={12} color={profile.accentColor} /> 典型海拔带
                </div>
                <div className="guide-pill-value">{profile.elevSummary}</div>
              </div>
            </div>

            <div className="guide-block">
              <div className="guide-block-title">
                <Calendar size={13} color={profile.accentColor} /> 时节与气候规律
              </div>
              <p>{profile.guide.seasonDetail}</p>
            </div>

            <div className="guide-block">
              <div className="guide-block-title">
                <Trees size={13} color="#4ade80" /> 生境、宿主与土壤
              </div>
              <p>{profile.guide.habitat}</p>
            </div>

            <div className="guide-block">
              <div className="guide-block-title">
                <Compass size={13} color="#38bdf8" /> 地图选点攻略
              </div>
              <p>{profile.guide.mapTips}</p>
            </div>

            <div className="guide-block">
              <div className="guide-block-title">
                <Eye size={13} color="#facc15" /> 野外辨识要点
              </div>
              <p>{profile.guide.idTraits}</p>
            </div>

            <div className="guide-block warning">
              <div className="guide-block-title" style={{ color: '#fca5a5' }}>
                <AlertTriangle size={13} color="#f87171" /> 毒菌混淆警示
              </div>
              <p style={{ color: '#fecaca' }}>{profile.guide.safetyWarning}</p>
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
                  {ph.angleShort}
                </button>
              ))}
            </div>

            {/* Active Large Photo Card */}
            {photos[activeAngleIdx] && (
              <div className="photo-hero-card">
                <div
                  className="photo-hero-img-wrap"
                  onClick={() => setLightboxPhoto(photos[activeAngleIdx])}
                  title="点击放大查看原图"
                >
                  <img
                    src={photos[activeAngleIdx].src}
                    alt={`${profile.shortName} - ${photos[activeAngleIdx].angleLabel}`}
                  />
                  <span className="photo-zoom-hint">
                    <ZoomIn size={12} /> 点击放大
                  </span>
                </div>
                <div className="photo-hero-meta">
                  <div className="photo-hero-angle">{photos[activeAngleIdx].angleLabel}</div>
                  <p className="photo-hero-caption">{photos[activeAngleIdx].caption}</p>
                  <div className="photo-hero-attr">
                    离线实拍来源：{photos[activeAngleIdx].attribution}
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
                  <img src={ph.src} alt={ph.angleShort} />
                  <span>{ph.angleShort}</span>
                </button>
              ))}
            </div>

            <div className="guide-block warning">
              <div className="guide-block-title" style={{ color: '#fca5a5' }}>
                <AlertTriangle size={13} color="#f87171" /> 采食安全提醒
              </div>
              <p style={{ color: '#fecaca' }}>{profile.guide.safetyWarning}</p>
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
                返回文字详解
              </button>
              <button
                className="action-btn"
                style={{ flex: 1.3, background: profile.accentColor, color: '#111513' }}
                onClick={onClose}
              >
                开始查看地图
              </button>
            </div>
          ) : (
            <button
              className="action-btn"
              style={{ background: profile.accentColor, color: '#111513' }}
              onClick={onClose}
            >
              知道了，开始查看地图
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
            alt={lightboxPhoto.angleLabel}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="photo-lightbox-caption" onClick={(e) => e.stopPropagation()}>
            <strong>{lightboxPhoto.angleLabel}</strong> · {lightboxPhoto.caption}
          </div>
        </div>
      )}
    </div>
  );
};
