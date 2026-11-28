export const LOG_SLIDER_STEPS = 1000;

export interface LogElevConfig {
  minFt: number;
  maxFt: number;
  kneeFt: number;
}

export const SPECIES_MIN_ELEV_CFG: LogElevConfig = {
  minFt: 0,
  maxFt: 6000,
  kneeFt: 600,
};

export const SPECIES_MAX_ELEV_CFG: LogElevConfig = {
  minFt: 300,
  maxFt: 9000,
  kneeFt: 800,
};

export const BAND_MIN_ELEV_CFG: LogElevConfig = {
  minFt: 0,
  maxFt: 10000,
  kneeFt: 800,
};

export const BAND_MAX_ELEV_CFG: LogElevConfig = {
  minFt: 300,
  maxFt: 13000,
  kneeFt: 1000,
};

/**
 * Maps an elevation in feet onto a shifted-logarithmic slider position [0..LOG_SLIDER_STEPS]
 * so common lower elevations occupy ~2x–3x more slider travel.
 */
export function elevFtToLogSlider(elevFt: number, cfg: LogElevConfig): number {
  const clamped = Math.max(cfg.minFt, Math.min(cfg.maxFt, elevFt));
  const span = cfg.maxFt - cfg.minFt;
  if (span <= 0) return 0;
  const u = Math.log(1 + (clamped - cfg.minFt) / cfg.kneeFt) / Math.log(1 + span / cfg.kneeFt);
  return Math.round(Math.max(0, Math.min(1, u)) * LOG_SLIDER_STEPS);
}

/**
 * Converts a shifted-logarithmic slider position back to feet, applying adaptive
 * fine stepping for lower elevations in whichever display unit ('m' or 'ft') is active.
 */
export function logSliderToElevFt(
  sliderVal: number,
  cfg: LogElevConfig,
  unit: 'ft' | 'm',
): number {
  if (sliderVal <= 0) return cfg.minFt;
  if (sliderVal >= LOG_SLIDER_STEPS) return cfg.maxFt;

  const t = Math.max(0, Math.min(1, sliderVal / LOG_SLIDER_STEPS));
  const span = cfg.maxFt - cfg.minFt;
  const rawFt = cfg.minFt + cfg.kneeFt * (Math.pow(1 + span / cfg.kneeFt, t) - 1);

  if (unit === 'm') {
    const rawM = rawFt / 3.28084;
    const stepM = rawM <= 300 ? 10 : rawM <= 1000 ? 25 : 50;
    const snappedM = Math.round(rawM / stepM) * stepM;
    // Preserve 0.1 ft precision so ftToMeters() rounds cleanly back to exact snappedM multiples
    const snappedFt = Math.round(snappedM * 3.28084 * 10) / 10;
    return Math.max(cfg.minFt, Math.min(cfg.maxFt, snappedFt));
  }

  const stepFt = rawFt <= 1000 ? 25 : rawFt <= 3000 ? 50 : 100;
  const snappedFt = Math.round(rawFt / stepFt) * stepFt;
  return Math.max(cfg.minFt, Math.min(cfg.maxFt, snappedFt));
}
