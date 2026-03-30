import React from 'react';
import Card from './ui/Card';

const AnalyticsPanel = ({ incidents }) => {
    // Calculate severity distribution
    const severityCounts = incidents?.reduce((acc, inc) => {
        const score = parseFloat(inc.svi_score) || 0;
        if (score >= 0.8) acc.critical++;
        else if (score >= 0.5) acc.high++;
        else acc.moderate++;
        return acc;
    }, { critical: 0, high: 0, moderate: 0 }) || { critical: 0, high: 0, moderate: 0 };

    // Calculate type distribution
    const typeCounts = incidents?.reduce((acc, inc) => {
        acc[inc.type] = (acc[inc.type] || 0) + 1;
        return acc;
    }, {}) || {};

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Severity Breakdown */}
            <Card title="Severity Breakdown" subtitle="By SVI Score">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-sm font-medium text-gray-700">Critical (≥0.8)</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{severityCounts.critical}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-sm font-medium text-gray-700">High (≥0.5)</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{severityCounts.high}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-sm font-medium text-gray-700">Moderate (&lt;0.5)</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{severityCounts.moderate}</span>
                    </div>
                </div>
            </Card>

            {/* Incident Types */}
            <Card title="Incident Types" subtitle="Distribution">
                <div className="space-y-3">
                    {Object.entries(typeCounts).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                                {type === 'FloodReport' && '🌊 '}
                                {type === 'MedicalTriage' && '🏥 '}
                                {type === 'ResourceRequest' && '📦 '}
                                {type}
                            </span>
                            <span className="text-lg font-bold text-gray-900">{count}</span>
                        </div>
                    ))}
                    {Object.keys(typeCounts).length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-4">No data available</p>
                    )}
                </div>
            </Card>

            {/* Response Metrics */}
            <Card title="Response Metrics" subtitle="Average values">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Avg Response Time</span>            <span className="text-lg font-bold text-gray-900">12 min</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Active Responders</span>
                        <span className="text-lg font-bold text-gray-900">5</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Coverage Area</span>
                        <span className="text-lg font-bold text-gray-900">250 km²</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AnalyticsPanel;
