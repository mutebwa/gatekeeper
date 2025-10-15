import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Main } from './components/Main';
import { Navigation } from './components/Navigation';

export const App: React.FC = () => {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50 font-sans">
                <Navigation />
                <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/" element={<Main />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
