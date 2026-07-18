/**
 * Regnskabs-talformatering. Logikken er fælles med finanslovsmodulet og bor i
 * ../shared/formatter — her re-eksporteres den blot under regnskabs-navne.
 */
export {
  parseDanishNumber,
  formatDanishNumber,
  formatChange,
  formatValueWithUnit as formatRegnskabValue,
  formatValue as formatRegnskab,
  formatCompact as formatRegnskabCompact,
} from '../shared/formatter'
