// src/App.tsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import { Search } from './components/Search';
import { Navigation } from './components/Navigation';
import { Main } from './components/Main';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './lib/db';
import type { Entry, PersonnelPayload } from './types';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Mock API removed - now using real API client from src/api/client.ts

function App() {
  const { user, login, logout, isLoading, isAuthenticated } = useAuth();
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);

  const { data: localEntries } = useQuery({
    queryKey: ['localEntries'],
    queryFn: () => db.getAllEntries(),
    initialData: [],
  });

  useEffect(() => {
    if (localEntries) {
      setFilteredEntries(localEntries);
    }
  }, [localEntries]);

  // P3.4 Hardening: In a real app, you would also implement a client-side check
  // for token expiration. Before making an API call, you would inspect the JWT's
  // 'exp' claim. If it's expired, you'd clear the user state and redirect to login.

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const username = (e.target as any).username.value;
    const password = (e.target as any).password.value;
    try {
      await login(username, password);
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Invalid username or password. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-purple-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-3 sm:p-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-cyan-500 to-purple-600 p-6 sm:p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full mb-3 sm:mb-4">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">GateKeeper</h1>
              <p className="text-cyan-100 text-xs sm:text-sm">Secure Checkpoint Management</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="p-5 sm:p-8 space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  defaultValue="admin"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 transition-all duration-200 outline-none"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue="password"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 transition-all duration-200 outline-none"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-800"
              >
                Sign In
              </button>

              {/* Demo Credentials Info */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-cyan-50 dark:bg-gray-700 rounded-lg border border-cyan-200 dark:border-gray-600">
                <p className="text-xs font-semibold text-cyan-900 dark:text-cyan-100 mb-2">Demo Credentials:</p>
                <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                  <p><span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">admin</span> / <span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">password</span></p>
                  <p><span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">op_east</span> / <span className="font-mono bg-white dark:bg-gray-800 px-2 py-0.5 rounded">password</span></p>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Offline-first checkpoint management system
          </p>
        </div>
      </div>
    );
  }

  // Determine default route based on user role
  const getDefaultRoute = () => {
    if (user?.role === 'GATE_OPERATOR') return '/checkpoint';
    if (user?.role === 'SUPERVISOR') return '/supervisor';
    if (user?.role === 'ADMIN') return '/admin';
    return '/dashboard';
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navigation user={user} onLogout={logout} />
        <Routes>
          {/* Checkpoint Entry Interface - Primary interface for Gate Operators */}
          <Route path="/checkpoint" element={<Main />} />
          
          {/* Dashboard - Analytics and Overview */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Admin Routes */}
          {user?.role === 'ADMIN' && (
            <Route path="/admin" element={<AdminDashboard />} />
          )}
          
          {/* Supervisor Routes */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
            <Route path="/supervisor" element={<SupervisorDashboard />} />
          )}
          
          {/* Search Interface */}
          <Route path="/search" element={
            <div className="p-8">
              <h1 className="text-2xl font-bold mb-6">Search Entries</h1>
              <Search entries={localEntries || []} onFilter={setFilteredEntries} />
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-4">
                  Displaying {filteredEntries.length} of {localEntries?.length || 0} Entries
                </h2>
                <div className="bg-white rounded-lg shadow">
                  {filteredEntries.map((entry: Entry) => (
                    <div key={entry.record_id} className="border-b p-4 hover:bg-gray-50">
                      <div className="font-medium">
                        {(entry.payload as PersonnelPayload).personnel_name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(entry.client_ts).toLocaleString()} @ {entry.checkpoint_id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          } />
          
          {/* Default Route - Redirect based on role */}
          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
          
          {/* Catch-all - Redirect to default */}
          <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppWrapper;
