import React, { useMemo } from 'react';
import { Clock, Shield, Activity, Zap } from 'lucide-react';

export default function NobleMetrics({ incidents, allIncidents, onFilterInspector }) {
    const all = allIncidents || [];
    const active = incidents || [];

    // ── Metric 1: Estimated Time Saved ──
    const dispatched = useMemo(() => all.filter(i => i.status === 'dispatched'), [all]);
    const timeSaved = useMemo(() => (dispatched.length * 4.5).toFixed(1), [dispatched]);

    // ── Metric 2: Equity Quotient ──
    const equityData = useMemo(() => {
        const highSviDispatched = dispatched.filter(i => parseFloat(i.svi_score) >= 0.7).length;
        const totalDispatched = dispatched.length || 1;
        const pct = Math.round((highSviDispatched / totalDispatched) * 100);
        const radius = 32;
        const circum = 2 * Math.PI * radius;
        const dashLen = (pct / 100) * circum;
        return { pct, highSviDispatched, totalDispatched: dispatched.length, radius, circum, dashLen };
    }, [dispatched]);

    // ── Metric 3: Response Trend Graph (SVG Area Chart) ──
    // Visualizes cumulative incidents by type over time
    const trendData = useMemo(() => {
        if (!all || all.length === 0) return null;

        // Sort by time
        const sorted = [...all].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Generate cumulative points
        const points = [];
        const counts = { FloodReport: 0, MedicalTriage: 0, ResourceRequest: 0 };

        sorted.forEach((inc, idx) => {
            if (counts[inc.type] !== undefined) counts[inc.type]++;
            // Snapshot every few items or at least end
            points.push({
                i: idx,
                ...counts
            });
        });

        // Normalize for SVG (ViewBox 0 0 100 50)
        const maxX = points.length - 1 || 1;
        const maxY = Math.max(10, counts.FloodReport, counts.MedicalTriage, counts.ResourceRequest); // Min 10 scale

        const getPath = (key) => {
            let d = `M 0 50`; // Start bottom-left
            points.forEach((p, i) => {
                const x = (i / maxX) * 100;
                const y = 50 - ((p[key] / maxY) * 45); // Leave 5px padding top
                d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
            });
            d += ` L 100 50 Z`; // Close path
            return d;
        };

        return {
            flood: getPath('FloodReport'),
            medical: getPath('MedicalTriage'),
            resource: getPath('ResourceRequest'),
            total: all.length
        };
    }, [all]);

    return (
        <div style={{ marginTop: '2rem', paddingBottom: '2rem' }}>
            <h3 style={{
                margin: '0 0 16px 0', fontSize: '13px', fontWeight: 800,
                color: 'var(--neon-blue)', textTransform: 'uppercase', letterSpacing: '1px',
                display: 'flex', alignItems: 'center', gap: '8px'
            }}>
                <Zap size={16} /> Mission Impact Insights
            </h3>

            <div className="metrics-grid">

                {/* ═══ Card 1: Time Saved ═══ */}
                <div
                    className="glass-card"
                    onClick={() => onFilterInspector?.('dispatched')}
                    style={{ flex: 1, cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '6px', marginBottom: '10px'
                    }}>
                        <Clock size={14} color="#00d4ff" />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Time Saved
                        </span>
                    </div>
                    <div style={{
                        fontSize: '36px', fontWeight: 900, color: '#00d4ff',
                        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                        lineHeight: 1, textShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
                        transition: 'all 0.4s ease'
                    }}>
                        {timeSaved}
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}> min</span>
                    </div>
                    <div style={{
                        fontSize: '9px', color: '#6e7681', marginTop: '8px',
                        letterSpacing: '0.3px', lineHeight: 1.4
                    }}>
                        Saved via{' '}
                        <span style={{ color: '#58a6ff', fontWeight: 700 }}>Neo4j A* Pathfinding</span>
                    </div>
                    <div style={{
                        fontSize: '10px', color: '#3fb950', marginTop: '6px', fontWeight: 700
                    }}>
                        {dispatched.length} dispatches completed
                    </div>
                </div>

                {/* ═══ Card 2: Equity Quotient ═══ */}
                <div
                    className="glass-card"
                    onClick={() => onFilterInspector?.('highSvi')}
                    style={{ flex: 1, cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '6px', marginBottom: '10px'
                    }}>
                        <Shield size={14} color="#ff6b35" />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Equity Quotient
                        </span>
                    </div>

                    {/* Radial Progress Ring */}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="40" cy="40" r={equityData.radius} fill="none" stroke="#222d3f" strokeWidth="6" />
                            <circle
                                cx="40" cy="40" r={equityData.radius} fill="none"
                                stroke="#ff6b35" strokeWidth="6"
                                strokeDasharray={`${equityData.dashLen} ${equityData.circum}`}
                                strokeDashoffset="0" strokeLinecap="round"
                                style={{ transition: 'all 0.8s ease', filter: 'drop-shadow(0 0 4px rgba(255, 107, 53, 0.5))' }}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <span style={{
                                fontSize: '20px', fontWeight: 900, color: '#ff6b35',
                                fontFamily: "'JetBrains Mono', monospace"
                            }}>
                                {equityData.pct}%
                            </span>
                        </div>
                    </div>

                    <div style={{ fontSize: '9px', color: '#6e7681', marginTop: '6px', lineHeight: 1.4 }}>
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>Noble GA</span> High-SVI Prioritization
                    </div>
                    <div style={{ fontSize: '10px', color: '#ff6b35', marginTop: '4px', fontWeight: 600 }}>
                        {equityData.highSviDispatched}/{equityData.totalDispatched} high-SVI served
                    </div>
                </div>

                {/* ═══ Card 3: Response Trend Graph ═══ */}
                <div
                    className="glass-card"
                    onClick={() => onFilterInspector?.('all')}
                    style={{ flex: 1, cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}
                >
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '6px', marginBottom: '4px'
                    }}>
                        <Activity size={14} color="#3fb950" />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Response by Disaster
                        </span>
                    </div>

                    <div style={{ width: '100%', height: '50px', position: 'relative' }}>
                        {trendData && (
                            <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }}>
                                {/* Layers: Resource (Orange), Medical (Green), Flood (Blue) with opacity */}
                                <path d={trendData.resource} fill="rgba(255, 107, 53, 0.3)" stroke="#ff6b35" strokeWidth="1" />
                                <path d={trendData.medical} fill="rgba(63, 185, 80, 0.3)" stroke="#3fb950" strokeWidth="1" />
                                <path d={trendData.flood} fill="rgba(0, 212, 255, 0.3)" stroke="#00d4ff" strokeWidth="1" />
                            </svg>
                        )}
                        <div className="pulse-icon" style={{
                            position: 'absolute', top: 4, right: 4, width: 6, height: 6,
                            background: '#3fb950', borderRadius: '50%', boxShadow: '0 0 8px #3fb950'
                        }} />
                    </div>

                    <div style={{
                        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                        marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px'
                    }}>
                        <div style={{ fontSize: '9px', color: '#00d4ff', fontWeight: 700 }}>Flood</div>
                        <div style={{ fontSize: '9px', color: '#3fb950', fontWeight: 700 }}>Medical</div>
                        <div style={{ fontSize: '9px', color: '#ff6b35', fontWeight: 700 }}>Resource</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
