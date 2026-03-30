import React, { useState } from 'react';

export default function IncidentList({ incidents }) {
    const [filterType, setFilterType] = useState('All');
    const [minSvi, setMinSvi] = useState(0);

    const filteredIncidents = incidents.filter(inc => {
        const typeMatch = filterType === 'All' || inc.type === filterType;
        const sviMatch = (parseFloat(inc.svi_score) || 0) >= minSvi;
        return typeMatch && sviMatch;
    });

    const getSeverityBadge = (score) => {
        const numScore = parseFloat(score) || 0;
        if (numScore >= 0.8) return { color: 'bg-red-500', label: 'CRITICAL' };
        if (numScore >= 0.5) return { color: 'bg-orange-500', label: 'HIGH' };
        return { color: 'bg-blue-500', label: 'MODERATE' };
    };

    const handleDispatch = async (incidentId) => {
        try {
            const res = await fetch('http://localhost:5000/api/incidents/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ incidentId })
            });

            if (res.ok) {
                const data = await res.json();
                window.dispatchEvent(new CustomEvent('route-found', { detail: data }));
                alert(`🚒 Dispatched ${data.responder.name}\nDistance: ${(data.distance / 1000).toFixed(2)} km`);
            }
        } catch (err) {
            alert('❌ Dispatch failed: ' + err.message);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-4 py-3">
                <h2 className="font-semibold text-lg">📋 Active Incidents</h2>
                <p className="text-xs text-gray-300">{filteredIncidents.length} incidents</p>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 p-3 border-b space-y-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Filter by Type</label>
                    <select
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="All">All Types</option>
                        <option value="FloodReport">🌊 Flood Report</option>
                        <option value="MedicalTriage">🏥 Medical Triage</option>
                        <option value="ResourceRequest">📦 Resource Request</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Min Vulnerability (SVI)</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="0" max="1" step="0.1"
                            value={minSvi}
                            onChange={(e) => setMinSvi(parseFloat(e.target.value))}
                            className="flex-1 accent-blue-600"
                        />
                        <span className="text-sm font-mono font-semibold text-gray-700 w-10">{minSvi.toFixed(1)}</span>
                    </div>
                </div>
            </div>

            {/* Incident Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                {filteredIncidents.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">
                        <p className="text-sm">No incidents match filters</p>
                    </div>
                ) : (
                    filteredIncidents.map((inc, idx) => {
                        const severity = getSeverityBadge(inc.svi_score);
                        return (
                            <div
                                key={idx}
                                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-3"
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-800 text-sm">
                                                {inc.type === 'FloodReport' && '🌊'}
                                                {inc.type === 'MedicalTriage' && '🏥'}
                                                {inc.type === 'ResourceRequest' && '📦'}
                                                {' '}
                                                {inc.type}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-2">
                                            {inc.details?.note || 'Emergency incident reported'}
                                        </p>
                                    </div>

                                    {/* Severity Badge */}
                                    <span className={`${severity.color} text-white text-xs px-2 py-1 rounded-full font-semibold`}>
                                        {severity.label}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                                    <div>
                                        <span className="font-semibold">SVI Score:</span> {inc.svi_score}
                                    </div>
                                    <div>
                                        <span className="font-semibold">ID:</span> {inc._id ? inc._id.slice(-6) : 'PENDING'}
                                    </div>
                                    <div className="col-span-2">
                                        <span className="font-semibold">Time:</span> {new Date(inc.timestamp).toLocaleString()}
                                    </div>
                                </div>

                                {/* Dispatch Button - PROMINENT */}
                                <button
                                    onClick={() => handleDispatch(inc._id)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md flex items-center justify-center gap-2"
                                >
                                    <span>🚀</span>
                                    <span>DISPATCH RESPONDER</span>
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
