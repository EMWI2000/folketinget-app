/**
 * Finanslov-talformatering. Logikken er fælles med regnskabsmodulet og bor i
 * ../shared/formatter — her re-eksporteres den blot under finanslov-navne.
 */
export {
  parseDanishNumber,
  formatDanishNumber,
  formatChange,
  formatValueWithUnit as formatBudgetValue,
  formatValue as formatBudget,
  formatCompact as formatBudgetCompact,
} from '../shared/formatter'
