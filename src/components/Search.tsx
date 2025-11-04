// src/components/Search.tsx

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Entry } from '../types';

interface SearchProps {
  entries: Entry[];
  onFilter: (filteredEntries: Entry[]) => void;
}

export function Search({ entries, onFilter }: SearchProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleSearch = () => {
    let filtered = entries;

    if (searchTerm) {
      filtered = filtered.filter(entry =>
        (entry.payload.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(entry => entry.status === statusFilter);
    }

    onFilter(filtered);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md mb-6">
      <h3 className="font-bold mb-2 text-gray-800">{t('common.search')} & {t('common.filter')}</h3>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder={t('common.search') + '...'}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="p-2 border border-gray-300 rounded flex-grow bg-white text-gray-900"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded bg-white text-gray-900"
        >
          <option value="">{t('supervisor.all')}</option>
          <option value="ACTIVE">Active</option>
          <option value="DELETED">Deleted</option>
        </select>
        <button onClick={handleSearch} className="bg-green-500 text-white p-2 rounded hover:bg-green-600:bg-green-700">
          {t('common.search')}
        </button>
      </div>
    </div>
  );
}
