import React from 'react';

const StatusBadge = ({ status, label }) => {
    const isOnline = status === 'online';

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isOnline
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} ${isOnline ? 'animate-pulse' : ''}`}></span>
            <span className="font-semibold">{label || (isOnline ? 'ONLINE' : 'OFFLINE')}</span>
        </div>
    );
};

export default StatusBadge;
