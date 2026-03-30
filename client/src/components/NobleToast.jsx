import React, { useState, useEffect } from 'react';

export default function NobleToast({ responderId, onDismiss }) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(onDismiss, 300);
        }, 5000);

        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className={`noble-toast ${exiting ? 'exiting' : ''}`}>
            <div className="noble-toast-body">
                <div className="noble-toast-icon">🚀</div>
                <div className="noble-toast-content">
                    <h4>Noble Dispatch</h4>
                    <p>Unit <strong style={{ color: '#00d4ff' }}>{responderId}</strong> rerouted to High-SVI Zone.</p>
                    <p style={{ fontSize: '11px', marginTop: '4px', color: '#6e7681' }}>
                        Equity-first routing • Alpha = 0.05
                    </p>
                </div>
            </div>
            <div className="noble-toast-progress">
                <div className="noble-toast-progress-bar" />
            </div>
        </div>
    );
}
