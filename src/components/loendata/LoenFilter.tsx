import { useMemo } from 'react'
import type { LoenRaekke, LoenFilter as LoenFilterType } from '../../lib/loendata/types'
import { hentUnikke, hentHovedkontiForMinisteromraader, sorterPerioder } from '../../lib/loendata/parser'
import MultiSelect from './MultiSelect'

interface LoenFilterProps {
  data: LoenRaekke[]
  filter: LoenFilterType
  onChange: (filter: LoenFilterType) => void
}

const TYPE_OPTIONS: { value: LoenFilterType['typer'][number]; label: string }[] = [
  { value: 'Departement', label: 'Departement' },
  { value: 'Styrelse', label: 'Styrelse' },
  { value: 'Andet', label: 'Andet' },
]

export default function LoenFilter({ data, filter, onChange }: LoenFilterProps) {
  const perioder = useMemo(() => sorterPerioder(hentUnikke(data, 'periode')), [data])
  const ministeromraader = useMemo(() => hentUnikke(data, 'ministeromraade'), [data])
  const hovedkonti = useMemo(
    () => hentHovedkontiForMinisteromraader(data, filter.ministeromraader),
    [data, filter.ministeromraader]
  )
  const personalekategorier = useMemo(() => hentUnikke(data, 'personalekategori'), [data])
  const stillinger = useMemo(() => hentUnikke(data, 'stilling'), [data])
  const loentrin = useMemo(() => hentUnikke(data, 'loentrin'), [data])

  const update = (partial: Partial<LoenFilterType>) =>
    onChange({ ...filter, ...partial })

  const toggleType = (type: LoenFilterType['typer'][number]) => {
    const current = filter.typer
    if (current.includes(type)) {
      update({ typer: current.filter((t) => t !== type) })
    } else {
      update({ typer: [...current, type] })
    }
  }

  const activeCount =
    filter.perioder.length +
    filter.ministeromraader.length +
    filter.hovedkonti.length +
    filter.typer.length +
    filter.personalekategorier.length +
    filter.stillinger.length +
    filter.loentrin.length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtre</h3>
        {activeCount > 0 && (
          <button
            onClick={() =>
              onChange({
                perioder: [],
                ministeromraader: [],
                hovedkonti: [],
                typer: [],
                personalekategorier: [],
                stillinger: [],
                loentrin: [],
              })
            }
            className="text-xs text-ft-red hover:underline"
          >
            Ryd alle filtre ({activeCount})
          </button>
        )}
      </div>

      {/* Type toggle-knapper */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Organisationstype
        </label>
        <div className="flex gap-1.5">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleType(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter.typer.includes(opt.value)
                  ? 'bg-ft-red text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Periode pills */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          Periode
        </label>
        <div className="flex flex-wrap gap-1.5">
          {perioder.map((p) => (
            <button
              key={p}
              onClick={() => {
                if (filter.perioder.includes(p)) {
                  update({ perioder: filter.perioder.filter((x) => x !== p) })
                } else {
                  update({ perioder: [...filter.perioder, p] })
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter.perioder.includes(p)
                  ? 'bg-ft-red text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Dropdowns i grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <MultiSelect
          label="Ministerområde"
          options={ministeromraader}
          selected={filter.ministeromraader}
          onChange={(v) => update({ ministeromraader: v, hovedkonti: [] })}
          placeholder="Alle ministerområder"
        />
        <MultiSelect
          label="Hovedkonto"
          options={hovedkonti}
          selected={filter.hovedkonti}
          onChange={(v) => update({ hovedkonti: v })}
          placeholder="Alle hovedkonti"
        />
        <MultiSelect
          label="Personalekategori"
          options={personalekategorier}
          selected={filter.personalekategorier}
          onChange={(v) => update({ personalekategorier: v })}
          placeholder="Alle kategorier"
        />
        <MultiSelect
          label="Stilling"
          options={stillinger}
          selected={filter.stillinger}
          onChange={(v) => update({ stillinger: v })}
          placeholder="Alle stillinger"
        />
        <MultiSelect
          label="Løntrin"
          options={loentrin}
          selected={filter.loentrin}
          onChange={(v) => update({ loentrin: v })}
          placeholder="Alle løntrin"
        />
      </div>
    </div>
  )
}
