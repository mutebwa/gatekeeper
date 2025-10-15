import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Truck, Car, User, X, CloudUpload, CloudOff, RefreshCw, Sun, Moon } from 'lucide-react';
import type { EntryType, Entry, Payload } from '../types';
import { MOCK_USER_ID, MOCK_CHECKPOINT_ID } from '../constants';
import { loadEntries, saveEntries } from '../utils';
import { EntryForm } from './EntryForm';
import { EntryList } from './EntryList';

export const Main: React.FC = () => {
    // Theme management
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const savedTheme = localStorage.getItem('gatekeeper-theme');
        return (savedTheme as 'light' | 'dark') || 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('gatekeeper-theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, []);

    // State management
    const [entries, setEntries] = useState<Entry[]>(loadEntries);
    const [currentEntryType, setCurrentEntryType] = useState<EntryType>('PERSONNEL');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleLogEntry = useCallback((payload: Payload) => {
        const newEntry: Entry = {
            record_id: crypto.randomUUID(),
            checkpoint_id: MOCK_CHECKPOINT_ID,
            entry_type: currentEntryType,
            logging_user_id: MOCK_USER_ID,
            client_ts: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            status: 'ACTIVE',
            isPending: true, // New entries are always pending until synced
            payload: payload as any,
        };

        setEntries(prev => [newEntry, ...prev]);
    }, [currentEntryType]);

    const pendingEntries = useMemo(() => entries.filter(e => e.isPending), [entries]);

    // Update localStorage whenever entries change
    useEffect(() => {
        saveEntries(entries);
    }, [entries]);

    // Listen for network status changes
    useEffect(() => {
        const setOnline = () => setIsOnline(true);
        const setOffline = () => setIsOnline(false);
        window.addEventListener('online', setOnline);
        window.addEventListener('offline', setOffline);
        return () => {
            window.removeEventListener('online', setOnline);
            window.removeEventListener('offline', setOffline);
        };
    }, []);

    // Mock Synchronization Logic (P1.3)
    const handleSync = useCallback(async (recordIdToSync?: string) => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);
        console.log(`Starting sync: Pushing ${pendingEntries.length} entries...`);

        // Simulate network latency (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

        let syncedEntries = entries;

        if (recordIdToSync) {
            // Sync a single entry (e.g., the user pressed sync on a specific pending item)
            syncedEntries = entries.map(e =>
                e.record_id === recordIdToSync ? { ...e, isPending: false } : e
            );
        } else {
            // Sync all pending entries
            syncedEntries = entries.map(e => ({ ...e, isPending: false }));
        }

        setEntries(syncedEntries);
        console.log(`Sync successful. Synced ${pendingEntries.length} entries.`);
        setIsSyncing(false);

        // NOTE: In the real app, this is where the Go backend's /sync/push endpoint would be called.
        // The Go API would return the server-stamped entry, which we would use to update the client list.
    }, [entries, isOnline, isSyncing, pendingEntries.length]);

    const entryTypeButtons = [
        { type: 'PERSONNEL' as EntryType, Icon: User, label: 'Personnel' },
        { type: 'TRUCK' as EntryType, Icon: Truck, label: 'Truck' },
        { type: 'CAR' as EntryType, Icon: Car, label: 'Car' },
        { type: 'OTHER' as EntryType, Icon: X, label: 'Other' },
    ];

    const isSyncButtonDisabled = !isOnline || isSyncing || pendingEntries.length === 0;

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
            <header className="mb-8 p-4 bg-white shadow-lg rounded-xl flex flex-col sm:flex-row justify-between items-center sticky top-4 z-10">
                <h1 className="text-3xl font-extrabold text-indigo-700 mb-2 sm:mb-0">GateKeeper Checkpoint</h1>

                <div className="flex items-center space-x-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>

                    {/* Status Indicator */}
                    <div className={`p-3 rounded-full text-white font-semibold flex items-center space-x-2 transition-colors duration-300 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
                        {isOnline ? <CloudUpload size={18} /> : <CloudOff size={18} />}
                        <span className="text-sm hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>

                    {/* Sync Button */}
                    <button
                        onClick={() => handleSync()}
                        disabled={isSyncButtonDisabled}
                        className={`py-2 px-4 rounded-lg font-medium transition-all duration-300 shadow-md flex items-center space-x-2
                            ${isSyncButtonDisabled
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-indigo-500 text-white hover:bg-indigo-600 hover:shadow-lg'
                            }`}
                    >
                        {isSyncing ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                <span>Syncing...</span>
                            </>
                        ) : (
                            <>
                                <CloudUpload size={18} />
                                <span>Sync All ({pendingEntries.length})</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Column 1: Entry Type Selection */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="p-6 bg-white shadow-xl rounded-xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Select Entry Type</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {entryTypeButtons.map(({ type, Icon, label }) => (
                                <button
                                    key={type}
                                    onClick={() => setCurrentEntryType(type)}
                                    className={`p-4 rounded-lg text-center transition-all duration-200 border-2 shadow-sm
                                        ${currentEntryType === type
                                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-indigo-300'
                                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Icon size={24} className="mx-auto mb-1" />
                                    <span className="font-medium text-sm">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Checkpoint Info Card */}
                    <div className="p-6 bg-indigo-50 shadow-md rounded-xl text-indigo-800">
                        <h3 className="font-bold text-lg mb-2">Checkpoint Details</h3>
                        <p className="text-sm">
                            **Location:** {MOCK_CHECKPOINT_ID}<br/>
                            **Operator ID:** {MOCK_USER_ID}<br/>
                            <span className="text-xs italic text-indigo-600">This data is locally saved and will sync when online.</span>
                        </p>
                    </div>
                </div>

                {/* Column 2: Entry Form */}
                <div className="lg:col-span-1">
                    <EntryForm
                        entryType={currentEntryType}
                        onSubmit={handleLogEntry}
                    />
                </div>

                {/* Column 3: Recent Entries List */}
                <div className="lg:col-span-1">
                    <EntryList
                        entries={entries}
                        onSync={handleSync}
                    />
                </div>
            </main>
        </div>
    );
};
