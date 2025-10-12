import React, { useMemo } from 'react';
import { List, CloudUpload, Check } from 'lucide-react';
import type { Entry, PersonnelPayload, TruckPayload, CarPayload, OtherPayload } from '../types';

interface EntryListProps {
    entries: Entry[];
    onSync: (id: string) => void;
}

export const EntryList: React.FC<EntryListProps> = ({ entries, onSync }) => {
    const sortedEntries = useMemo(() => {
        return [...entries].sort((a, b) => new Date(b.client_ts).getTime() - new Date(a.client_ts).getTime());
    }, [entries]);

    const getDisplayValue = (entry: Entry) => {
        switch (entry.entry_type) {
            case 'PERSONNEL':
                const p = entry.payload as PersonnelPayload;
                return `${p.personnel_name} (ID: ${p.id_number})`;
            case 'TRUCK':
                const t = entry.payload as TruckPayload;
                return `Truck: ${t.plate_number} (${t.company})`;
            case 'CAR':
                const c = entry.payload as CarPayload;
                return `Car: ${c.plate_number} (${c.driver_name})`;
            case 'OTHER':
                const o = entry.payload as OtherPayload;
                return `Other: ${o.description}`;
            default:
                return entry.entry_type;
        }
    };

    return (
        <div className="bg-white p-6 shadow-xl rounded-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center space-x-2">
                <List size={20} />
                <span>Recent Entries ({sortedEntries.length})</span>
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedEntries.length === 0 ? (
                    <p className="text-gray-500 italic">No entries logged yet.</p>
                ) : (
                    sortedEntries.map((entry) => (
                        <div key={entry.record_id} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between transition-shadow hover:shadow-sm">
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-900 font-medium truncate">{getDisplayValue(entry)}</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(entry.client_ts).toLocaleTimeString()} @ {entry.checkpoint_id}
                                </p>
                            </div>
                            {entry.isPending ? (
                                <button
                                    onClick={() => onSync(entry.record_id)}
                                    className="ml-4 p-2 bg-yellow-100 text-yellow-800 rounded-full flex items-center space-x-1 text-sm font-medium hover:bg-yellow-200 transition-colors"
                                    title="Pending Sync"
                                >
                                    <CloudUpload size={16} />
                                    <span className="hidden sm:inline">Pending</span>
                                </button>
                            ) : (
                                <span className="ml-4 p-2 bg-green-100 text-green-700 rounded-full flex items-center space-x-1 text-sm font-medium" title="Synced">
                                    <Check size={16} />
                                    <span className="hidden sm:inline">Synced</span>
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
