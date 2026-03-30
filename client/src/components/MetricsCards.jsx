import React from 'react';

const MetricsCards = ({ incidents, responders, isOffline }) => {
    // Calculate metrics
    const activeIncidents = incidents ? incidents.length : 0;
    const activeResponders = responders ? responders.length : 0;
    const avgSVI = incidents && incidents.length > 0
        ? (incidents.reduce((sum, inc) => sum + (inc.svi_score || 0), 0) / incidents.length).toFixed(2)
        : '0.00';

    const highSVICount = incidents ? incidents.filter(inc => inc.svi_score >= 0.7).length : 0;

    const metrics = [
        {
            title: 'Active Incidents',
            value: activeIncidents,
            icon: '🚨',
            color: 'from-red-500 to-red-600',
            subtitle: `${highSVICount} high vulnerability`
        },
        {
            title: 'Available Responders',
            value: activeResponders,
            icon: '🚑',
            color: 'from-blue-500 to-blue-600',
            subtitle: 'Field units ready'
        },
        {
            title: 'Avg Vulnerability',
            value: avgSVI,
            icon: '📊',
            color: 'from-purple-500 to-purple-600',
            subtitle: 'SVI Score (0-1)'
        },
        {
            title: 'Network Status',
            value: isOffline ? 'OFFLINE' : 'ONLINE',
            icon: isOffline ? '📡' : '🌐',
            color: isOffline ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600',
            subtitle: isOffline ? 'Mesh mode active' : 'Connected to HQ'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {metrics.map((metric, idx) => (
                <div
                    key={idx}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                    <div className={`bg-gradient-to-r ${metric.color} p-4`}>
                        <div className="flex items-center justify-between text-white">
                            <span className="text-3xl">{metric.icon}</span>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{metric.value}</div>
                                <div className="text-xs opacity-90">{metric.title}</div>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-gray-50">
                        <p className="text-xs text-gray-600">{metric.subtitle}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MetricsCards;
