import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Users, Truck, Car, Activity, TrendingUp, Clock, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/db';
import type { Entry as _Entry } from '../types';

export const Dashboard: React.FC = () => {
    const { user } = useAuth();

    // Fetch all entries from IndexedDB
    const { data: allEntries = [], isLoading } = useQuery({
        queryKey: ['dashboard-entries'],
        queryFn: () => db.getAllEntries(),
        initialData: [],
    });

    // Filter entries based on user role
    // Gate operators see only their entries
    // Supervisors see entries from their managed operators
    // Admins see everything
    const entries = useMemo(() => {
        if (!user) return [];
        
        // Admins see all entries
        if (user.role === 'ADMIN') {
            return allEntries;
        }
        
        // Supervisors see entries from their managed operators
        if (user.role === 'SUPERVISOR' && user.managed_operators) {
            return allEntries.filter(entry => 
                user.managed_operators?.includes(entry.logging_user_id)
            );
        }
        
        // Gate operators see only their own entries
        if (user.role === 'GATE_OPERATOR') {
            return allEntries.filter(entry => entry.logging_user_id === user.user_id);
        }
        
        return [];
    }, [allEntries, user]);

    // Calculate dashboard statistics
    const stats = useMemo(() => {
        const totalEntries = entries.length;
        const pendingEntries = entries.filter(e => e.isPending).length;
        const syncedEntries = totalEntries - pendingEntries;

        // Entry type breakdown
        const personnelCount = entries.filter(e => e.entry_type === 'PERSONNEL').length;
        const truckCount = entries.filter(e => e.entry_type === 'TRUCK').length;
        const carCount = entries.filter(e => e.entry_type === 'CAR').length;
        const otherCount = entries.filter(e => e.entry_type === 'OTHER').length;

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentEntries = entries.filter(e => new Date(e.created_at) > sevenDaysAgo).length;

        // Average entries per day (last 7 days)
        const avgPerDay = recentEntries / 7;

        return {
            totalEntries,
            pendingEntries,
            syncedEntries,
            personnelCount,
            truckCount,
            carCount,
            otherCount,
            recentEntries,
            avgPerDay: Math.round(avgPerDay * 10) / 10
        };
    }, [entries]);

    const statCards = [
        {
            title: 'Total Entries',
            value: stats.totalEntries.toString(),
            icon: Activity,
            color: 'bg-blue-500',
            trend: stats.recentEntries > 0 ? '+' + stats.recentEntries + ' this week' : 'No recent activity'
        },
        {
            title: 'Pending Sync',
            value: stats.pendingEntries.toString(),
            icon: Clock,
            color: stats.pendingEntries > 0 ? 'bg-yellow-500' : 'bg-green-500',
            trend: stats.pendingEntries > 0 ? 'Needs sync' : 'All synced'
        },
        {
            title: 'Synced Entries',
            value: stats.syncedEntries.toString(),
            icon: TrendingUp,
            color: 'bg-green-500',
            trend: 'Ready for analysis'
        },
        {
            title: 'Avg/Day (7d)',
            value: stats.avgPerDay.toString(),
            icon: BarChart3,
            color: 'bg-purple-500',
            trend: 'Based on recent activity'
        }
    ];

    const entryTypeData = [
        { type: 'Personnel', count: stats.personnelCount, icon: Users, color: 'bg-indigo-500' },
        { type: 'Trucks', count: stats.truckCount, icon: Truck, color: 'bg-green-500' },
        { type: 'Cars', count: stats.carCount, icon: Car, color: 'bg-blue-500' },
        { type: 'Other', count: stats.otherCount, icon: AlertCircle, color: 'bg-gray-500' }
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-indigo-700 mb-2">Dashboard</h1>
                <p className="text-gray-600">
                    Overview of checkpoint activity and analytics
                    {user?.role === 'SUPERVISOR' && user.managed_operators && (
                        <span className="ml-2 text-sm text-blue-600">
                            (Showing data from {user.managed_operators.length} managed operator{user.managed_operators.length !== 1 ? 's' : ''})
                        </span>
                    )}
                    {user?.role === 'GATE_OPERATOR' && (
                        <span className="ml-2 text-sm text-green-600">
                            (Your entries only)
                        </span>
                    )}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
                            </div>
                            <div className={`p-3 rounded-full text-white ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Entry Type Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Entry Type Distribution</h2>
                    <div className="space-y-4">
                        {entryTypeData.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-full text-white ${item.color}`}>
                                        <item.icon size={18} />
                                    </div>
                                    <span className="font-medium text-gray-700">{item.type}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-32 bg-gray-200 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full ${item.color}`}
                                            style={{
                                                width: stats.totalEntries > 0 ? `${(item.count / stats.totalEntries) * 100}%` : '0%'
                                            }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 w-12 text-right">
                                        {item.count}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity Summary */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Last 7 days</span>
                            <span className="font-bold text-indigo-600">{stats.recentEntries} entries</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Daily average</span>
                            <span className="font-bold text-indigo-600">{stats.avgPerDay} entries</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600">Sync status</span>
                            <span className={`font-bold ${stats.pendingEntries > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                                {stats.pendingEntries > 0 ? `${stats.pendingEntries} pending` : 'All synced'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <h2 className="text-xl font-bold mb-4">Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-3xl font-bold">{stats.totalEntries}</div>
                        <div className="text-sm opacity-90">Total Entries</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold">{stats.personnelCount}</div>
                        <div className="text-sm opacity-90">Personnel</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold">{stats.truckCount + stats.carCount}</div>
                        <div className="text-sm opacity-90">Vehicles</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold">{stats.avgPerDay}</div>
                        <div className="text-sm opacity-90">Avg/Day</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
