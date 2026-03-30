import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';

const BAR_COLORS = ['#3fb950', '#58a6ff', '#f85149'];
const PIE_COLORS = ['#00d4ff', '#ff6b35', '#3fb950', '#8957e5'];

const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '10px 14px', boxShadow: 'var(--shadow)',
            fontSize: '12px', color: 'var(--text)'
        }}>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>{label}</div>
            <div style={{ color: 'var(--neon-blue)' }}>Count: {payload[0].value}</div>
        </div>
    );
};

const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '10px 14px', boxShadow: 'var(--shadow)',
            fontSize: '12px', color: 'var(--text)'
        }}>
            <div style={{ fontWeight: 700 }}>{payload[0].name}: {payload[0].value}</div>
        </div>
    );
};

export default function NobleAnalytics({ incidents, allIncidents, onBarHover }) {
    // SVI distribution
    const sviData = useMemo(() => {
        const bins = [
            { range: 'Low (0–0.3)', min: 0, max: 0.3, count: 0, fill: BAR_COLORS[0] },
            { range: 'Medium (0.4–0.7)', min: 0.31, max: 0.7, count: 0, fill: BAR_COLORS[1] },
            { range: 'High (0.8–1.0)', min: 0.71, max: 1.0, count: 0, fill: BAR_COLORS[2] },
        ];
        (allIncidents || incidents || []).forEach(inc => {
            const svi = parseFloat(inc.svi_score);
            if (svi <= 0.3) bins[0].count++;
            else if (svi <= 0.7) bins[1].count++;
            else bins[2].count++;
        });
        return bins;
    }, [incidents, allIncidents]);

    // Resource allocation
    const resourceData = useMemo(() => {
        const all = allIncidents || [];
        const dispatched = all.filter(i => i.status === 'dispatched').length;
        const active = (incidents || []).length;
        const resolved = all.filter(i => i.status === 'resolved').length;
        const result = [];
        if (active > 0) result.push({ name: 'Active', value: active });
        if (dispatched > 0) result.push({ name: 'Dispatched', value: dispatched });
        if (resolved > 0) result.push({ name: 'Resolved', value: resolved });
        if (result.length === 0) result.push({ name: 'No Data', value: 1 });
        return result;
    }, [incidents, allIncidents]);

    return (
        <div className="panel" style={{ marginTop: '0' }}>
            <h3 style={{
                margin: '0 0 18px 0', fontSize: '13px', fontWeight: 700,
                color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>📊 Noble Analytics</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* SVI Distribution Bar Chart */}
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        SVI Distribution
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={sviData} onMouseLeave={() => onBarHover?.(null)}>
                            <XAxis
                                dataKey="range" tick={{ fontSize: 10, fill: '#8b949e' }}
                                axisLine={{ stroke: '#30363d' }} tickLine={false}
                            />
                            <YAxis
                                allowDecimals={false} tick={{ fontSize: 10, fill: '#8b949e' }}
                                axisLine={{ stroke: '#30363d' }} tickLine={false}
                            />
                            <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,212,255,0.05)' }} />
                            <Bar
                                dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}
                                onMouseEnter={(data) => onBarHover?.(data)}
                            >
                                {sviData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Resource Allocation Pie Chart */}
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        Resource Allocation
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie
                                data={resourceData} dataKey="value" nameKey="name"
                                cx="50%" cy="50%" innerRadius={35} outerRadius={60}
                                strokeWidth={2} stroke="#0d1117"
                            >
                                {resourceData.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend
                                wrapperStyle={{ fontSize: '11px', color: '#8b949e' }}
                                iconSize={8}
                                formatter={(value) => <span style={{ color: '#8b949e', fontSize: '11px' }}>{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
