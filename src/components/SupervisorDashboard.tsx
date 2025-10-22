// src/components/SupervisorDashboard.tsx

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Download, 
  Key, 
  Filter, 
  Search as SearchIcon, 
  AlertCircle, 
  CheckCircle, 
  Loader,
  Calendar,
  MapPin,
  User,
  Truck,
  Car,
  X as XIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { db } from '../lib/db';
import type { Entry, EntryType, PersonnelPayload, TruckPayload, CarPayload, OtherPayload } from '../types';

export function SupervisorDashboard() {
  const { token, user } = useAuth();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<EntryType | 'ALL'>('ALL');
  const [filterCheckpoint, setFilterCheckpoint] = useState<string>('ALL');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all entries from IndexedDB
  const { data: allEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ['supervisor-entries'],
    queryFn: () => db.getAllEntries(),
    initialData: [],
  });

  // Filter entries based on user role
  // Supervisors only see entries from operators they manage
  // Admins see everything
  const visibleEntries = useMemo(() => {
    if (!user) return [];
    
    // Admins can see all entries
    if (user.role === 'ADMIN') {
      return allEntries;
    }
    
    // Supervisors only see entries from their managed operators
    if (user.role === 'SUPERVISOR' && user.managed_operators) {
      return allEntries.filter(entry => 
        user.managed_operators?.includes(entry.logging_user_id)
      );
    }
    
    // Default: no entries
    return [];
  }, [allEntries, user]);

  // Get unique checkpoints from entries
  const checkpoints = useMemo(() => {
    const uniqueCheckpoints = new Set(allEntries.map(e => e.checkpoint_id));
    return Array.from(uniqueCheckpoints);
  }, [allEntries]);

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    return visibleEntries.filter(entry => {
      // Type filter
      if (filterType !== 'ALL' && entry.entry_type !== filterType) return false;
      
      // Checkpoint filter
      if (filterCheckpoint !== 'ALL' && entry.checkpoint_id !== filterCheckpoint) return false;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const payload = entry.payload as any;
        
        // Search in different payload types
        const searchableText = [
          payload.personnel_name,
          payload.plate_number,
          payload.driver_name,
          payload.company,
          payload.description,
          payload.notes,
          entry.checkpoint_id,
          entry.record_id
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(search)) return false;
      }
      
      return true;
    });
  }, [visibleEntries, filterType, filterCheckpoint, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = visibleEntries.length;
    const pending = visibleEntries.filter(e => e.isPending).length;
    const synced = total - pending;
    const byType = {
      PERSONNEL: visibleEntries.filter(e => e.entry_type === 'PERSONNEL').length,
      TRUCK: visibleEntries.filter(e => e.entry_type === 'TRUCK').length,
      CAR: visibleEntries.filter(e => e.entry_type === 'CAR').length,
      OTHER: visibleEntries.filter(e => e.entry_type === 'OTHER').length,
    };
    
    return { total, pending, synced, byType };
  }, [visibleEntries]);

  // Handle password reset
  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    
    // In a real implementation, this would call an API endpoint
    // For now, we'll simulate it
    setSuccess(`Password reset request sent for user: ${username}`);
    setTimeout(() => setSuccess(null), 3000);
    setShowPasswordReset(false);
    e.currentTarget.reset();
  };

  // Handle data export
  const handleExport = async () => {
    if (!token) return;
    
    setIsExporting(true);
    setError(null);
    
    try {
      const blob = await api.supervisor.exportToCSV(token);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gatekeeper_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('Export downloaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // Render entry details based on type
  const renderEntryDetails = (entry: Entry) => {
    const payload = entry.payload;
    
    switch (entry.entry_type) {
      case 'PERSONNEL':
        const personnel = payload as PersonnelPayload;
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{personnel.personnel_name}</div>
            <div className="text-gray-600">ID: {personnel.id_number}</div>
            <div className="text-gray-500">{personnel.purpose}</div>
          </div>
        );
      
      case 'TRUCK':
        const truck = payload as TruckPayload;
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{truck.plate_number}</div>
            <div className="text-gray-600">{truck.company}</div>
            <div className="text-gray-500">{truck.cargo_type}</div>
          </div>
        );
      
      case 'CAR':
        const car = payload as CarPayload;
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{car.plate_number}</div>
            <div className="text-gray-600">{car.driver_name}</div>
          </div>
        );
      
      case 'OTHER':
        const other = payload as OtherPayload;
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">{other.description}</div>
            <div className="text-gray-600">Tag: {other.asset_tag}</div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Get icon for entry type
  const getEntryIcon = (type: EntryType) => {
    switch (type) {
      case 'PERSONNEL': return <User size={18} className="text-blue-600" />;
      case 'TRUCK': return <Truck size={18} className="text-green-600" />;
      case 'CAR': return <Car size={18} className="text-purple-600" />;
      case 'OTHER': return <XIcon size={18} className="text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-indigo-700 mb-2">Supervisor Dashboard</h1>
        <p className="text-gray-600">Monitor all checkpoint activities and manage operators</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-800">
          <CheckCircle size={20} />
          <span>{success}</span>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-800">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Entries</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <FileText className="text-indigo-600" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Sync</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <AlertCircle className="text-yellow-600" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Synced</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.synced}</p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Checkpoints</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{checkpoints.length}</p>
            </div>
            <MapPin className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Entries List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="text-indigo-600" size={20} />
              <h2 className="text-lg font-bold text-gray-800">Filter & Search</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-3">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name, plate, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as EntryType | 'ALL')}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ALL">All Types</option>
                <option value="PERSONNEL">Personnel</option>
                <option value="TRUCK">Trucks</option>
                <option value="CAR">Cars</option>
                <option value="OTHER">Other</option>
              </select>
              
              {/* Checkpoint Filter */}
              <select
                value={filterCheckpoint}
                onChange={(e) => setFilterCheckpoint(e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ALL">All Checkpoints</option>
                {checkpoints.map(cp => (
                  <option key={cp} value={cp}>{cp}</option>
                ))}
              </select>
              
              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isExporting ? (
                  <Loader className="animate-spin" size={20} />
                ) : (
                  <Download size={20} />
                )}
                <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              </button>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredEntries.length} of {visibleEntries.length} entries
              {user?.role === 'SUPERVISOR' && user.managed_operators && (
                <span className="ml-2 text-blue-600">
                  (from {user.managed_operators.length} managed operator{user.managed_operators.length !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          </div>

          {/* Entries List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">All Checkpoint Entries</h2>
            
            {entriesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="animate-spin text-indigo-600" size={40} />
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No entries found</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredEntries.map(entry => (
                  <div key={entry.record_id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getEntryIcon(entry.entry_type)}
                        <div className="flex-1">
                          {renderEntryDetails(entry)}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Calendar size={14} />
                              <span>{new Date(entry.client_ts).toLocaleString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MapPin size={14} />
                              <span>{entry.checkpoint_id}</span>
                            </span>
                          </div>
                          {entry.payload.notes && (
                            <div className="mt-2 text-xs text-gray-600 italic">
                              Note: {entry.payload.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        entry.isPending 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {entry.isPending ? 'Pending' : 'Synced'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Utilities */}
        <div className="space-y-6">
          {/* Entry Type Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Entry Types</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <User size={18} className="text-blue-600" />
                  <span className="text-sm font-medium">Personnel</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{stats.byType.PERSONNEL}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Truck size={18} className="text-green-600" />
                  <span className="text-sm font-medium">Trucks</span>
                </div>
                <span className="text-lg font-bold text-green-600">{stats.byType.TRUCK}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Car size={18} className="text-purple-600" />
                  <span className="text-sm font-medium">Cars</span>
                </div>
                <span className="text-lg font-bold text-purple-600">{stats.byType.CAR}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <XIcon size={18} className="text-gray-600" />
                  <span className="text-sm font-medium">Other</span>
                </div>
                <span className="text-lg font-bold text-gray-600">{stats.byType.OTHER}</span>
              </div>
            </div>
          </div>

          {/* Password Reset */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Key className="text-orange-600" size={20} />
              <h3 className="text-lg font-bold text-gray-800">Operator Utilities</h3>
            </div>
            
            {!showPasswordReset ? (
              <button
                onClick={() => setShowPasswordReset(true)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Key size={18} />
                <span>Reset Operator Password</span>
              </button>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <input
                  name="username"
                  placeholder="Operator's Username"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(false)}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
