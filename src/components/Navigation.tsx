import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, ClipboardList, Users, Shield, Search as SearchIcon, LogOut } from 'lucide-react';
import type { User } from '../types';

interface NavigationProps {
    user: User | null;
    onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ user, onLogout }) => {
    const location = useLocation();

    // Build navigation items based on user role
    const navItems = [
        {
            path: '/checkpoint',
            label: 'Checkpoint',
            icon: ClipboardList,
            roles: ['GATE_OPERATOR', 'SUPERVISOR', 'ADMIN']
        },
        {
            path: '/dashboard',
            label: 'Dashboard',
            icon: BarChart3,
            roles: ['GATE_OPERATOR', 'SUPERVISOR', 'ADMIN']
        },
        {
            path: '/search',
            label: 'Search',
            icon: SearchIcon,
            roles: ['SUPERVISOR', 'ADMIN']
        },
        {
            path: '/supervisor',
            label: 'Supervisor',
            icon: Shield,
            roles: ['SUPERVISOR', 'ADMIN']
        },
        {
            path: '/admin',
            label: 'Admin',
            icon: Users,
            roles: ['ADMIN']
        }
    ].filter(item => user && item.roles.includes(user.role));

    return (
        <nav className="bg-white shadow-md p-4 mb-6 sticky top-0 z-50">
            <div className="flex items-center justify-between">
                {/* Logo/Brand */}
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">GK</span>
                    </div>
                    <span className="font-bold text-gray-800 hidden sm:inline">GateKeeper</span>
                </div>

                {/* Navigation Links */}
                <div className="flex space-x-1">
                    {navItems.map(({ path, label, icon: Icon }) => (
                        <Link
                            key={path}
                            to={path}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200
                                ${location.pathname === path
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
                                }`}
                        >
                            <Icon size={18} />
                            <span className="hidden md:inline text-sm">{label}</span>
                        </Link>
                    ))}
                </div>

                {/* User Info and Logout */}
                <div className="flex items-center space-x-3">
                    <div className="hidden sm:block text-right">
                        <div className="text-sm font-medium text-gray-800">{user?.username}</div>
                        <div className="text-xs text-gray-500">{user?.role.replace('_', ' ')}</div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                        title="Logout"
                    >
                        <LogOut size={18} />
                        <span className="hidden md:inline text-sm">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};
