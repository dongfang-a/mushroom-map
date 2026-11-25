import React from 'react';
import { Globe, Ruler, Settings, X } from 'lucide-react';
import type { AppPreferences, Lang, LangPref, UnitPreset, UnitSettings } from '../types/map';
import { detectSystemLang, UI_TEXT } from '../i18n/translations';
import {
  detectSystemUnitSystem,
  IMPERIAL_UNITS,
  METRIC_UNITS,
  resolveUnits,
} from '../utils/units';

interface SettingsModalProps {
  open: boolean;
  prefs: AppPreferences;
  lang: Lang;
  onChangePrefs: (next: AppPreferences) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  prefs,
  lang,
  onChangePrefs,
  onClose,
}) => {
  if (!open) return null;

  const t = UI_TEXT[lang];
  const resolvedUnits = resolveUnits(prefs);
  const sysLang = detectSystemLang();
  const sysUnit = detectSystemUnitSystem();

  const setLangPref = (langPref: LangPref) => {
    onChangePrefs({ ...prefs, langPref });
  };

  const setUnitPreset = (unitPreset: Exclude<UnitPreset, 'custom'>) => {
    const units: UnitSettings =
      unitPreset === 'imperial'
        ? { ...IMPERIAL_UNITS }
        : unitPreset === 'metric'
          ? { ...METRIC_UNITS }
          : sysUnit === 'imperial'
            ? { ...IMPERIAL_UNITS }
            : { ...METRIC_UNITS };
    onChangePrefs({ ...prefs, unitPreset, units });
  };

  const setSingleUnit = <K extends keyof UnitSettings>(key: K, val: UnitSettings[K]) => {
    const nextUnits: UnitSettings = { ...resolvedUnits, [key]: val };
    const matchesImperial =
      nextUnits.elevation === 'ft' &&
      nextUnits.temperature === 'F' &&
      nextUnits.rain === 'in' &&
      nextUnits.distance === 'mi' &&
      nextUnits.area === 'ac';
    const matchesMetric =
      nextUnits.elevation === 'm' &&
      nextUnits.temperature === 'C' &&
      nextUnits.rain === 'mm' &&
      nextUnits.distance === 'km' &&
      nextUnits.area === 'ha';
    const unitPreset: UnitPreset = matchesImperial
      ? 'imperial'
      : matchesMetric
        ? 'metric'
        : 'custom';
    onChangePrefs({ ...prefs, unitPreset, units: nextUnits });
  };

  const unitRows: Array<{
    key: keyof UnitSettings;
    label: string;
    aVal: string;
    aLabel: string;
    bVal: string;
    bLabel: string;
  }> = [
    {
      key: 'elevation',
      label: t.unitElevLabel,
      aVal: 'ft',
      aLabel: t.optFt,
      bVal: 'm',
      bLabel: t.optM,
    },
    {
      key: 'temperature',
      label: t.unitTempLabel,
      aVal: 'F',
      aLabel: t.optF,
      bVal: 'C',
      bLabel: t.optC,
    },
    {
      key: 'rain',
      label: t.unitRainLabel,
      aVal: 'in',
      aLabel: t.optIn,
      bVal: 'mm',
      bLabel: t.optMm,
    },
    {
      key: 'distance',
      label: t.unitDistLabel,
      aVal: 'mi',
      aLabel: t.optMi,
      bVal: 'km',
      bLabel: t.optKm,
    },
    {
      key: 'area',
      label: t.unitAreaLabel,
      aVal: 'ac',
      aLabel: t.optAc,
      bVal: 'ha',
      bLabel: t.optHa,
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="species-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="species-emoji-badge" style={{ borderColor: '#38bdf8' }}>
              <Settings size={18} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{t.settingsTitle}</h3>
              <div style={{ fontSize: 11, color: '#9aa9a0', marginTop: 2 }}>
                {t.settingsSubtitle}
              </div>
            </div>
          </div>
          <button className="icon-close" onClick={onClose} aria-label="Close settings">
            <X size={17} />
          </button>
        </div>

        <div className="species-modal-body">
          {/* Language Section */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Globe size={14} color="#38bdf8" />
              <span>{t.settingsLangHeading}</span>
              <span className="settings-detected">
                {t.settingsDetected(sysLang === 'zh' ? '中文' : 'English')}
              </span>
            </div>
            <div className="segmented-3">
              <button
                className={`seg-btn ${prefs.langPref === 'auto' ? 'active' : ''}`}
                onClick={() => setLangPref('auto')}
              >
                {t.settingsSystemAuto}
              </button>
              <button
                className={`seg-btn ${prefs.langPref === 'zh' ? 'active' : ''}`}
                onClick={() => setLangPref('zh')}
              >
                简体中文
              </button>
              <button
                className={`seg-btn ${prefs.langPref === 'en' ? 'active' : ''}`}
                onClick={() => setLangPref('en')}
              >
                English
              </button>
            </div>
          </div>

          {/* Measurement Unit Preset Section */}
          <div className="settings-section">
            <div className="settings-section-title">
              <Ruler size={14} color="#facc15" />
              <span>{t.settingsUnitsHeading}</span>
              {prefs.unitPreset === 'custom' ? (
                <span className="settings-custom-pill">{t.settingsCustomBadge}</span>
              ) : (
                <span className="settings-detected">
                  {t.settingsDetected(sysUnit === 'imperial' ? t.settingsImperial : t.settingsMetric)}
                </span>
              )}
            </div>
            <div className="segmented-3">
              <button
                className={`seg-btn ${prefs.unitPreset === 'auto' ? 'active' : ''}`}
                onClick={() => setUnitPreset('auto')}
              >
                {t.settingsSystemAuto}
              </button>
              <button
                className={`seg-btn ${prefs.unitPreset === 'imperial' ? 'active' : ''}`}
                onClick={() => setUnitPreset('imperial')}
              >
                {t.settingsImperial}
              </button>
              <button
                className={`seg-btn ${prefs.unitPreset === 'metric' ? 'active' : ''}`}
                onClick={() => setUnitPreset('metric')}
              >
                {t.settingsMetric}
              </button>
            </div>
          </div>

          {/* Per-Unit Granular Overrides */}
          <div className="settings-section">
            <div className="settings-section-title">
              <span>{t.settingsPerUnitHeading}</span>
            </div>
            <div className="unit-rows-list">
              {unitRows.map((row) => {
                const cur = resolvedUnits[row.key];
                return (
                  <div className="unit-override-row" key={row.key}>
                    <span className="unit-override-label">{row.label}</span>
                    <div className="segmented-2">
                      <button
                        className={`seg-btn ${cur === row.aVal ? 'active' : ''}`}
                        onClick={() =>
                          setSingleUnit(row.key, row.aVal as UnitSettings[typeof row.key])
                        }
                      >
                        {row.aLabel}
                      </button>
                      <button
                        className={`seg-btn ${cur === row.bVal ? 'active' : ''}`}
                        onClick={() =>
                          setSingleUnit(row.key, row.bVal as UnitSettings[typeof row.key])
                        }
                      >
                        {row.bLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="species-modal-footer">
          <button
            className="action-btn"
            style={{ background: '#38bdf8', color: '#0c1412' }}
            onClick={onClose}
          >
            {t.settingsDone}
          </button>
        </div>
      </div>
    </div>
  );
};
