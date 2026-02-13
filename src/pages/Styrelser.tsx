import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StyrelsesbenchmarkContent from '../components/styrelser/StyrelsesbenchmarkContent'
import StyrelseRegnskabContent from '../components/styrelser/StyrelseRegnskabContent'

type TabType = 'finanslov' | 'regnskab'

export default function Styrelser() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabType) || 'finanslov'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Styrelsesanalyse
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sammenlign styrelser på tværs af bevillinger og regnskaber.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => handleTabChange('finanslov')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'finanslov'
              ? 'bg-white dark:bg-gray-700 text-ft-red shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Finanslovsdatabasen
        </button>
        <button
          onClick={() => handleTabChange('regnskab')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'regnskab'
              ? 'bg-white dark:bg-gray-700 text-ft-red shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Regnskabsdatabasen
        </button>
      </div>

      {/* Content */}
      {activeTab === 'finanslov' ? (
        <StyrelsesbenchmarkContent />
      ) : (
        <StyrelseRegnskabContent />
      )}
    </div>
  )
}
