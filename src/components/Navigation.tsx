import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, ClipboardList } from 'lucide-react';

export const Navigation: React.FC = () => {
    const location = useLocation();

    const navItems = [
        {
            path: '/dashboard',
            label: 'Dashboard',
            icon: BarChart3
        },
        {
            path: '/',
            label: 'Checkpoint',
            icon: ClipboardList
        }
    ];

    return (
        <nav className="bg-white shadow-md rounded-xl p-4 mb-6">
            <div className="flex space-x-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex-1 justify-center
                            ${location.pathname === path
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-600'
                            }`}
                    >
                        <Icon size={18} />
                        <span className="hidden sm:inline">{label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
};
