import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Truck, Car, User, X, CloudUpload, CloudOff, RefreshCw, Sun, Moon, AlertCircle } from 'lucide-react';
import type { EntryType, Entry, Payload } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { db } from '../lib/db';
import { EntryForm } from './EntryForm';
import { EntryList } from './EntryList';

export const Main: React.FC = () => {
    const { user, token } = useAuth();
    
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
    const [entries, setEntries] = useState<Entry[]>([]);
    const [currentEntryType, setCurrentEntryType] = useState<EntryType>('PERSONNEL');
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

    // Load entries from IndexedDB on mount
    useEffect(() => {
        const loadEntriesFromDB = async () => {
            try {
                const dbEntries = await db.getAllEntries();
                setEntries(dbEntries);
                
                // Load last sync time
                const savedSyncTime = await db.getAppState<string>('lastSyncTime');
                if (savedSyncTime) {
                    setLastSyncTime(new Date(savedSyncTime));
                }
            } catch (error) {
                console.error('Failed to load entries from IndexedDB:', error);
            }
        };
        loadEntriesFromDB();
    }, []);

    const handleLogEntry = useCallback(async (payload: Payload) => {
        if (!user) return;
        
        const newEntry: Entry = {
            record_id: crypto.randomUUID(),
            checkpoint_id: user.allowed_checkpoints?.[0] || 'UNKNOWN',
            entry_type: currentEntryType,
            logging_user_id: user.user_id,
            client_ts: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            status: 'ACTIVE',
            isPending: true, // New entries are always pending until synced
            payload: payload as any,
        };

        // Save to IndexedDB
        try {
            await db.saveEntry(newEntry);
            setEntries(prev => [newEntry, ...prev]);
        } catch (error) {
            console.error('Failed to save entry to IndexedDB:', error);
            alert('Failed to save entry locally. Please try again.');
        }
    }, [currentEntryType, user]);

    const pendingEntries = useMemo(() => entries.filter(e => e.isPending), [entries]);

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

    // Real Synchronization Logic with Backend API
    const handleSync = useCallback(async (recordIdToSync?: string) => {
        if (!isOnline || isSyncing || !token) return;

        setIsSyncing(true);
        setSyncError(null);
        
        try {
            const entriesToSync = recordIdToSync 
                ? pendingEntries.filter(e => e.record_id === recordIdToSync)
                : pendingEntries;

            if (entriesToSync.length === 0) {
                setIsSyncing(false);
                return;
            }

            console.log(`Starting sync: Pushing ${entriesToSync.length} entries...`);

            // PUSH: Send pending entries to server
            const pushResponse = await api.sync.push(
                token,
                entriesToSync
            );

            // Update entries - mark successfully pushed entries as synced
            const updatedEntries = entries.map(entry => {
                // Check if this entry was rejected
                const wasRejected = pushResponse.rejected_ids?.includes(entry.record_id);
                if (wasRejected) {
                    console.warn(`Entry ${entry.record_id} was rejected by server`);
                    // Keep as pending, user can retry
                    return entry;
                }
                
                // If entry was in the sync batch and not rejected, mark as synced
                const wasInBatch = entriesToSync.some(e => e.record_id === entry.record_id);
                if (wasInBatch) {
                    return { ...entry, isPending: false };
                }
                
                return entry;
            });

            // PULL: Get any updates from server
            const since = lastSyncTime ? lastSyncTime.toISOString() : undefined;
            const pullResponse = await api.sync.pull(token, since);

            // Merge pulled entries with local entries
            const pulledEntries = pullResponse.entries || [];
            const mergedEntries = [...updatedEntries];
            
            pulledEntries.forEach((serverEntry: Entry) => {
                const existingIndex = mergedEntries.findIndex(
                    e => e.record_id === serverEntry.record_id
                );
                
                if (existingIndex >= 0) {
                    // Update existing entry with server version
                    mergedEntries[existingIndex] = { ...serverEntry, isPending: false };
                } else {
                    // Add new entry from server
                    mergedEntries.unshift({ ...serverEntry, isPending: false });
                }
            });

            // Save all entries to IndexedDB
            await db.saveEntries(mergedEntries);
            setEntries(mergedEntries);

            // Update last sync time
            const newSyncTime = new Date();
            setLastSyncTime(newSyncTime);
            await db.setAppState('lastSyncTime', newSyncTime.toISOString());

            console.log(`Sync successful. Pushed ${pushResponse.accepted} entries, pulled ${pullResponse.count} entries.`);
            
            if (pushResponse.rejected_ids && pushResponse.rejected_ids.length > 0) {
                setSyncError(`${pushResponse.rejected_ids.length} entries were rejected due to conflicts`);
            }
        } catch (error) {
            console.error('Sync failed:', error);
            setSyncError(error instanceof Error ? error.message : 'Sync failed. Please try again.');
        } finally {
            setIsSyncing(false);
        }
    }, [entries, isOnline, isSyncing, pendingEntries, token, lastSyncTime]);

    // Background sync every 30 seconds when online
    useEffect(() => {
        if (!isOnline || !token || pendingEntries.length === 0) return;

        const syncInterval = setInterval(() => {
            handleSync();
        }, 30000); // 30 seconds

        return () => clearInterval(syncInterval);
    }, [isOnline, token, pendingEntries.length, handleSync]);

    const entryTypeButtons = [
        { type: 'PERSONNEL' as EntryType, Icon: User, label: 'Personnel' },
        { type: 'TRUCK' as EntryType, Icon: Truck, label: 'Truck' },
        { type: 'CAR' as EntryType, Icon: Car, label: 'Car' },
        { type: 'OTHER' as EntryType, Icon: X, label: 'Other' },
    ];

    const isSyncButtonDisabled = !isOnline || isSyncing || pendingEntries.length === 0;

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-2 sm:p-4 lg:p-8">
            <header className="mb-4 sm:mb-6 lg:mb-8 p-3 sm:p-4 bg-white shadow-lg rounded-xl flex flex-col sm:flex-row justify-between items-center sticky top-2 sm:top-4 z-10">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-indigo-700 mb-2 sm:mb-0">GateKeeper</h1>

                <div className="flex items-center space-x-2 sm:space-x-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 sm:p-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? <Moon size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Sun size={16} className="sm:w-[18px] sm:h-[18px]" />}
                    </button>

                    {/* Status Indicator */}
                    <div className={`p-2 sm:p-3 rounded-full text-white font-semibold flex items-center space-x-1 sm:space-x-2 transition-colors duration-300 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
                        {isOnline ? <CloudUpload size={16} className="sm:w-[18px] sm:h-[18px]" /> : <CloudOff size={16} className="sm:w-[18px] sm:h-[18px]" />}
                        <span className="text-xs sm:text-sm hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>

                    {/* Sync Button */}
                    <button
                        onClick={() => handleSync()}
                        disabled={isSyncButtonDisabled}
                        className={`py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg font-medium transition-all duration-300 shadow-md flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm
                            ${isSyncButtonDisabled
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-indigo-500 text-white hover:bg-indigo-600 hover:shadow-lg'
                            }`}
                    >
                        {isSyncing ? (
                            <>
                                <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px] animate-spin" />
                                <span className="hidden sm:inline">Syncing...</span>
                                <span className="sm:hidden">Sync</span>
                            </>
                        ) : (
                            <>
                                <CloudUpload size={16} className="sm:w-[18px] sm:h-[18px]" />
                                <span className="hidden sm:inline">Sync All ({pendingEntries.length})</span>
                                <span className="sm:hidden">({pendingEntries.length})</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

                {/* Column 1: Entry Type Selection */}
                <div className="lg:col-span-1 space-y-3 sm:space-y-4">
                    <div className="p-4 sm:p-6 bg-white shadow-xl rounded-xl">
                        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">Select Entry Type</h2>
                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            {entryTypeButtons.map(({ type, Icon, label }) => (
                                <button
                                    key={type}
                                    onClick={() => setCurrentEntryType(type)}
                                    className={`p-3 sm:p-4 rounded-lg text-center transition-all duration-200 border-2 shadow-sm
                                        ${currentEntryType === type
                                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-indigo-300'
                                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <Icon size={20} className="sm:w-6 sm:h-6 mx-auto mb-1" />
                                    <span className="font-medium text-xs sm:text-sm">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Sync Error Display */}
                    {syncError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                            <div className="flex items-start space-x-2">
                                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-sm">Sync Error</h4>
                                    <p className="text-xs mt-1">{syncError}</p>
                                </div>
                            </div>
                        </div>
                    )}
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
