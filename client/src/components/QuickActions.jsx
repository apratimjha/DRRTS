import React from 'react';

const QuickActions = ({ onInitGraph, onOptimizeFleet, onToggleOffline, isOffline }) => {
    const actions = [
        {
            label: 'Initialize Graph',
            icon: '🗺️',
            onClick: onInitGraph,
            color: 'bg-indigo-600 hover:bg-indigo-700',
            description: 'Seed Neo4j network'
        },
        {
            label: 'Optimize Fleet',
            icon: '🤖',
            onClick: onOptimizeFleet,
            color: 'bg-purple-600 hover:bg-purple-700',
            description: 'Run AI optimization'
        },
        {
            label: isOffline ? 'Reconnect' : 'Cut Uplink',
            icon: isOffline ? '🔌' : '⚠️',
            onClick: onToggleOffline,
            color: isOffline ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700',
            description: isOffline ? 'Restore connectivity' : 'Simulate partition'
        }
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">⚡ Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {actions.map((action, idx) => (
                    <button
                        key={idx}
                        onClick={action.onClick}
                        className={`${action.color} text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-xl">{action.icon}</span>
                            <span>{action.label}</span>
                        </div>
                        <div className="text-xs mt-1 opacity-90">{action.description}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuickActions;
