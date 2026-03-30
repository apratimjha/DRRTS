import React from 'react';
import StatusBadge from './ui/StatusBadge';

const Header = ({ isOffline, pendingCount, onSimulateReport }) => {
    return (
        <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
            <div className="px-8 py-4">
                <div className="flex items-center justify-between">
                    {/* Left: Logo + Brand */}
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                            🌍
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                DRRTS <span className="text-blue-600">Command Center</span>
                            </h1>
                            <p className="text-xs text-gray-500">Disaster Resilient Response & Tactical Simulation</p>
                        </div>
                    </div>

                    {/* Right: Status + Actions */}
                    <div className="flex items-center gap-4">
                        {/* Pending Badge */}
                        {pendingCount > 0 && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2">
                                <span className="animate-pulse">⚠️</span>
                                <span>{pendingCount} Pending</span>
                            </div>
                        )}

                        {/* Network Status */}
                        <StatusBadge status={isOffline ? 'offline' : 'online'} />

                        {/* Simulate Button */}
                        <button
                            onClick={onSimulateReport}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95"
                        >
                            + Simulate Report
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
