import React from 'react';
import Card from './ui/Card';

const MapPanel = ({ incidents, children }) => {
    return (
        <Card>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 -m-6 mb-0 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                    <span className="text-2xl">🌍</span>
                    <div>
                        <h2 className="text-lg font-semibold">Live India Incident Tracking</h2>
                        <p className="text-xs opacity-90">{incidents?.length || 0} active incidents across India</p>
                    </div>
                </div>
            </div>

            <div style={{ height: '600px' }} className="mt-6">
                {children}
            </div>
        </Card>
    );
};

export default MapPanel;
