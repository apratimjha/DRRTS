import React from 'react';
import KpiCard from './ui/KpiCard';
import ActionButton from './ui/ActionButton';
import Card from './ui/Card';
import IncidentList from './IncidentList';

const Sidebar = ({
    incidents,
    responders,
    isOffline,
    onInitGraph,
    onOptimizeFleet,
    onToggleOffline
}) => {
    const activeIncidents = incidents?.length || 0;
    const highVulnerability = incidents?.filter(inc => parseFloat(inc.svi_score) >= 0.7).length || 0;
    const avgSVI = incidents && incidents.length > 0
        ? (incidents.reduce((sum, inc) => sum + (parseFloat(inc.svi_score) || 0), 0) / incidents.length).toFixed(2)
        : '0.00';

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4">
                <KpiCard
                    icon="🚨"
                    title="Active Incidents"
                    value={activeIncidents}
                    subtitle={`${highVulnerability} high vulnerability`}
                    color="red"
                />

                <KpiCard
                    icon="🚑"
                    title="Available Responders"
                    value={responders?.length || 0}
                    subtitle="Field units ready"
                    color="blue"
                />

                <KpiCard
                    icon="📊"
                    title="Avg Vulnerability"
                    value={avgSVI}
                    subtitle="SVI Score (0-1)"
                    color="purple"
                />
            </div>

            {/* Quick Actions */}
            <Card title="⚡ Quick Actions">
                <div className="space-y-3">
                    <ActionButton
                        icon="🗺️"
                        label="Initialize Graph"
                        description="Seed Neo4j network"
                        onClick={onInitGraph}
                        variant="primary"
                    />

                    <ActionButton
                        icon="🤖"
                        label="Optimize Fleet"
                        description="Run AI optimization"
                        onClick={onOptimizeFleet}
                        variant="success"
                    />

                    <ActionButton
                        icon={isOffline ? "🔌" : "⚠️"}
                        label={isOffline ? "Reconnect" : "Cut Uplink"}
                        description={isOffline ? "Restore connectivity" : "Simulate partition"}
                        onClick={onToggleOffline}
                        variant={isOffline ? "success" : "warning"}
                    />
                </div>
            </Card>

            {/* Incident List */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ maxHeight: 'calc(100vh - 580px)' }}>
                <IncidentList incidents={incidents} />
            </div>
        </div>
    );
};

export default Sidebar;
