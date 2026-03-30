import React, { useState, useEffect, useRef } from 'react';
import { Activity, Database, GitGraph, Shield, Zap, Lock, Server } from 'lucide-react';

// Simulated noble system log messages
const LOG_TEMPLATES = [
    {
        prefix: 'CDC', icon: Database, messages: [
            'Change Stream watching incidents collection',
            'New {type} detected in MongoDB',
            'Document {id} synced to Polyglot Bridge',
            'Schema change propagated via BSON pipeline',
        ]
    },
    {
        prefix: 'NEO4J', icon: GitGraph, messages: [
            'Path recalculated via Bridge_{node}',
            'Graph topology: 25 nodes, 40 edges active',
            'Responder fleet positioned across 5x5 grid',
            'BLOCKED node filter applied to routing',
        ]
    },
    {
        prefix: 'GA', icon: Zap, messages: [
            'Optimization complete — Priority: High-SVI site',
            'Alpha parameter locked at 0.05 (Equity-First)',
            'Fitness evaluation: {fitness} across {pop} individuals',
            'DEAP optimizer cycle complete',
        ]
    },
    {
        prefix: 'ZKP', icon: Lock, messages: [
            'DID verification: Beneficiary identity confirmed',
            'Zero-knowledge proof accepted — no PII exposed',
            'Privacy-preserving handshake complete',
        ]
    },
    {
        prefix: 'MESH', icon: Server, messages: [
            'Vector clock incremented: v{clock}',
            'Conflict resolution: Last-write-wins applied',
            'Offline queue: {pending} incidents pending sync',
        ]
    },
];

const TYPES = ['FloodReport', 'MedicalTriage', 'ResourceRequest'];

function generateLog() {
    const group = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    let msg = group.messages[Math.floor(Math.random() * group.messages.length)];

    // Fill placeholders
    msg = msg.replace('{type}', TYPES[Math.floor(Math.random() * TYPES.length)]);
    msg = msg.replace('{id}', Math.random().toString(36).substring(2, 10));
    msg = msg.replace('{node}', String(Math.floor(Math.random() * 25)).padStart(2, '0'));
    msg = msg.replace('{fitness}', (Math.random() * 10).toFixed(2));
    msg = msg.replace('{pop}', String(Math.floor(Math.random() * 50) + 20));
    msg = msg.replace('{clock}', String(Math.floor(Math.random() * 100)));
    msg = msg.replace('{pending}', String(Math.floor(Math.random() * 5)));

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    return { time, prefix: group.prefix, icon: group.icon, msg };
}

export default function SystemLog() {
    const [logs, setLogs] = useState(() => {
        return Array.from({ length: 6 }, () => generateLog());
    });
    const scrollRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setLogs(prev => {
                const next = [...prev, generateLog()];
                return next.slice(-30); // Keep last 30
            });
        }, 2500 + Math.random() * 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const prefixColor = (prefix) => {
        switch (prefix) {
            case 'CDC': return '#00d4ff';
            case 'NEO4J': return '#fbbf24';
            case 'GA': return '#a371f7';
            case 'ZKP': return '#3fb950';
            case 'MESH': return '#ff6b35';
            default: return '#8b949e';
        }
    };

    return (
        <div className="panel" style={{ padding: '16px' }}>
            <h3 style={{
                margin: '0 0 10px 0', fontSize: '12px', fontWeight: 700,
                color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', gap: '8px'
            }}>
                <Activity size={14} className="heartbeat-dot" style={{ color: 'var(--success)' }} />
                System Log
            </h3>

            <div
                ref={scrollRef}
                style={{
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '10px 12px',
                    height: '150px', overflowY: 'auto',
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: '11px', lineHeight: '1.7',
                    scrollbarWidth: 'thin', scrollbarColor: 'var(--muted) transparent'
                }}
            >
                {logs.map((log, i) => {
                    const Icon = log.icon;
                    return (
                        <div key={i} style={{ opacity: i < logs.length - 3 ? 0.6 : 1, transition: 'opacity 0.3s', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ color: 'var(--muted)', minWidth: '45px' }}>[{log.time}]</span>
                            <Icon size={10} color={prefixColor(log.prefix)} />
                            <span style={{ color: prefixColor(log.prefix), fontWeight: 700 }}>{log.prefix}:</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{log.msg}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
