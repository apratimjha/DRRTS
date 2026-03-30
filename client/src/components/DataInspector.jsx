import React, { useEffect, useState, useMemo } from 'react';
import { FileCode, Network, HardDrive, Zap, X, AlertTriangle, Filter } from 'lucide-react';

const GraphTopology = `
// NOBLE ROUTING QUERY (Cypher)
MATCH (r:Responder)-[:LOCATED_AT]->(start_loc)
MATCH (i:Incident {id: $incidentId})-[:LOCATED_AT]->(end_loc)
CALL apoc.algo.dijkstra(
  start_loc, 
  end_loc, 
  'ROAD', 
  'cost'
) YIELD path, weight
WHERE ALL(n IN nodes(path) WHERE NOT n.status = 'BLOCKED')
RETURN path, weight
ORDER BY weight ASC
LIMIT 1;
`;

const MockLocalDoc = {
    "_id": "local_edge_001",
    "_rev": "3-a7f2c9e1",
    "channel": "drrts_incidents",
    "type": "FloodReport",
    "status": "pending_sync",
    "created_offline": true,
    "local_timestamp": new Date().toISOString(),
    "coordinates": { "lat": 17.385, "lng": 78.4867 },
    "svi_score": 0.72,
    "sync_metadata": {
        "retry_count": 0,
        "last_attempt": null,
        "conflict_resolution": "last-write-wins"
    },
    "edge_cache": {
        "responders_snapshot": 3,
        "tile_cache_mb": 12.4,
        "indexed_db_size_kb": 256
    }
};

const ImpactMetadata = {
    "noble_objective": {
        "formula": "minimize( α × distance + (1 - α) × humanitarian_need )",
        "description": "Multi-objective optimization balancing proximity with social vulnerability"
    },
    "alpha_weight": {
        "value": 0.05,
        "interpretation": "Distance contributes only 5% to the cost function",
        "humanitarian_multiplier": "SVI × (1 / α) = SVI × 20 → Humanitarian Need is weighted 20× higher than distance"
    },
    "time_saved": {
        "formula": "Σ(dispatch_distance_km × avg_speed_factor) / active_responders",
        "avg_speed_factor": "0.83 (adjusted for terrain, weather, congestion)",
        "unit": "minutes"
    },
    "equity_quotient": {
        "formula": "(Σ svi_weighted_coverage) / total_incidents",
        "svi_weighted_coverage": "coverage_radius × incident.svi_score",
        "ideal_value": "≥ 0.85 indicates equitable resource distribution"
    },
    "deap_config": {
        "algorithm": "NSGA-II (eaMuPlusLambda)",
        "population": 100,
        "generations": 50,
        "crossover_prob": 0.7,
        "mutation_prob": 0.2,
        "fitness_weights": [-1.0, -1.0]
    }
};

// Generate 5x5 grid locations matching neo4j_module.js seed
const generateLocationNodes = () => {
    const nodes = [];
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            nodes.push({
                id: `loc_${x}_${y}`,
                type: 'Location',
                lat: (20.4 + x * 0.1).toFixed(1),
                lng: (78.8 + y * 0.1).toFixed(1),
                status: 'OPEN'
            });
        }
    }
    return nodes;
};

export default function DataInspector({ onClose, incidents = [], initialIncidentId = null, filterIds = null }) {
    const [activeTab, setActiveTab] = useState('mongo');
    const [selectedIncidentId, setSelectedIncidentId] = useState(null);
    const [responders, setResponders] = useState([]);
    const [localFilterIds, setLocalFilterIds] = useState(filterIds);

    // Fetch responders for Neo4j tab
    useEffect(() => {
        fetch('http://localhost:5000/api/responders')
            .then(res => res.json())
            .then(data => setResponders(data))
            .catch(err => console.error(err));
    }, []);

    // Set initial selection
    useEffect(() => {
        if (initialIncidentId) {
            setSelectedIncidentId(initialIncidentId);
            setActiveTab('mongo');
        } else if (incidents.length > 0 && !selectedIncidentId) {
            setSelectedIncidentId(incidents[0]._id || null);
        }
    }, [initialIncidentId, incidents]);

    // Filtered incident list for sidebar
    const displayedIncidents = useMemo(() => {
        if (!localFilterIds || localFilterIds.length === 0) return incidents;
        return incidents.filter(inc => localFilterIds.includes(inc._id));
    }, [incidents, localFilterIds]);

    // Currently selected incident
    const selectedIncident = useMemo(() => {
        if (!selectedIncidentId) return displayedIncidents[0] || null;
        return incidents.find(inc => inc._id === selectedIncidentId) || displayedIncidents[0] || null;
    }, [selectedIncidentId, incidents, displayedIncidents]);

    // Build enriched BSON display with did_hash and vector_clock
    const selectedBson = useMemo(() => {
        if (!selectedIncident) return '// No incidents loaded';
        const enriched = {
            ...selectedIncident,
            did_hash: `sha256:${(selectedIncident._id || 'unknown').slice(-8)}...${Math.random().toString(36).slice(2, 8)}`,
            vector_clock: {
                node_1: Math.floor(Math.random() * 20) + 1,
                node_3: Math.floor(Math.random() * 15) + 1
            }
        };
        return JSON.stringify(enriched, null, 2);
    }, [selectedIncident]);

    // Build combined graph nodes for Neo4j tab
    const graphNodes = useMemo(() => {
        const nodes = [];
        // Responders
        responders.forEach(r => {
            nodes.push({ id: r.id, name: r.name || `Responder_${r.id}`, type: 'Responder', status: 'ACTIVE' });
        });
        // Incidents as graph nodes
        incidents.forEach(inc => {
            const svi = parseFloat(inc.svi_score);
            nodes.push({
                id: inc._id || `inc_${Math.random().toString(36).slice(2, 6)}`,
                name: `${inc.type} (SVI: ${inc.svi_score})`,
                type: 'Incident',
                status: svi >= 0.7 ? 'CRITICAL' : svi >= 0.5 ? 'HIGH' : 'MODERATE'
            });
        });
        // Location grid nodes
        generateLocationNodes().forEach(loc => {
            nodes.push({ id: loc.id, name: `Grid ${loc.lat}, ${loc.lng}`, type: 'Location', status: loc.status });
        });
        return nodes;
    }, [responders, incidents]);

    const getNodeColor = (type) => {
        if (type === 'Responder') return '#3fb950';
        if (type === 'Incident') return '#f85149';
        return '#58a6ff';
    };

    const getStatusColor = (status) => {
        if (status === 'ACTIVE' || status === 'OPEN') return '#3fb950';
        if (status === 'CRITICAL') return '#f85149';
        if (status === 'HIGH') return '#ff6b35';
        return '#58a6ff';
    };

    const getSviColor = (score) => {
        const s = parseFloat(score);
        if (s >= 0.8) return '#f85149';
        if (s >= 0.5) return '#ff6b35';
        return '#3fb950';
    };

    const tabs = [
        { key: 'mongo', label: 'MongoDB (Live BSON)', icon: <FileCode size={12} />, color: 'var(--success)' },
        { key: 'neo', label: 'Neo4j (Graph)', icon: <Network size={12} />, color: '#fbbf24' },
        { key: 'local', label: 'Local Storage (Edge)', icon: <HardDrive size={12} />, color: '#a371f7' },
        { key: 'impact', label: 'Impact Metadata', icon: <Zap size={12} />, color: '#00d4ff' },
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(13, 17, 23, 0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="panel" style={{ width: '920px', height: '680px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--neon-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            🗄️ Database Detailed Information
                        </h2>
                        <div style={{ display: 'flex', gap: '2px' }}>
                            {tabs.map((tab, i) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    style={{
                                        padding: '6px 12px', fontSize: '10px', fontWeight: 700,
                                        borderRadius: i === 0 ? '6px 0 0 6px' : i === tabs.length - 1 ? '0 6px 6px 0' : '0',
                                        background: activeTab === tab.key ? tab.color : 'var(--bg)',
                                        color: activeTab === tab.key ? (tab.key === 'neo' ? 'black' : 'white') : 'var(--text-secondary)',
                                        border: '1px solid var(--border)',
                                        borderLeft: i > 0 ? 'none' : '1px solid var(--border)',
                                        display: 'flex', alignItems: 'center', gap: '5px',
                                        cursor: 'pointer', transition: 'all 0.2s ease'
                                    }}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'hidden', padding: '0', background: '#0d1117' }}>

                    {/* ═══ MongoDB Tab — Multi-Document ═══ */}
                    {activeTab === 'mongo' && (
                        <div style={{ display: 'flex', height: '100%' }}>
                            {/* Sidebar: Incident List */}
                            <div style={{
                                width: '200px', borderRight: '1px solid #30363d',
                                display: 'flex', flexDirection: 'column', flexShrink: 0
                            }}>
                                <div style={{
                                    padding: '10px 12px', fontSize: '10px', fontWeight: 700,
                                    color: 'var(--text-secondary)', textTransform: 'uppercase',
                                    borderBottom: '1px solid #30363d', letterSpacing: '0.5px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: localFilterIds ? 'rgba(56, 139, 253, 0.1)' : 'transparent'
                                }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {localFilterIds ? <Filter size={10} /> : null}
                                        {localFilterIds ? 'FILTERED' : 'DOCUMENTS'}
                                    </span>
                                    {localFilterIds ? (
                                        <button
                                            onClick={() => setLocalFilterIds(null)}
                                            style={{
                                                background: 'none', border: 'none', color: '#58a6ff',
                                                cursor: 'pointer', fontSize: '9px', fontWeight: 700, padding: 0
                                            }}>
                                            SHOW ALL
                                        </button>
                                    ) : (
                                        <span style={{
                                            background: 'rgba(63, 185, 80, 0.15)', color: '#3fb950',
                                            padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800
                                        }}>{incidents.length}</span>
                                    )}
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#6e7681 transparent' }}>
                                    {displayedIncidents.length === 0 ? (
                                        <div style={{ padding: '16px', fontSize: '11px', color: '#6e7681', textAlign: 'center' }}>
                                            No documents found
                                        </div>
                                    ) : (
                                        displayedIncidents.map((inc, i) => {
                                            const svi = parseFloat(inc.svi_score);
                                            const isSelected = (inc._id || i) === selectedIncidentId;
                                            const isHighSvi = svi > 0.7;
                                            return (
                                                <div
                                                    key={inc._id || i}
                                                    onClick={() => setSelectedIncidentId(inc._id || i)}
                                                    style={{
                                                        padding: '8px 12px', cursor: 'pointer',
                                                        borderBottom: '1px solid #21262d',
                                                        background: isSelected ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                                                        borderLeft: isSelected ? '3px solid #00d4ff' : '3px solid transparent',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <div style={{
                                                            width: 7, height: 7, borderRadius: '50%',
                                                            background: getSviColor(inc.svi_score),
                                                            boxShadow: isHighSvi ? `0 0 6px ${getSviColor(inc.svi_score)}` : 'none'
                                                        }} />
                                                        <span style={{
                                                            fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
                                                            color: isSelected ? '#e6edf3' : '#8b949e',
                                                            fontWeight: isSelected ? 700 : 400
                                                        }}>
                                                            {(inc._id || `doc_${i}`).toString().slice(-8)}
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        fontSize: '9px', color: '#6e7681', marginTop: '2px',
                                                        display: 'flex', justifyContent: 'space-between'
                                                    }}>
                                                        <span>{inc.type?.replace('Report', '').replace('Request', '')}</span>
                                                        <span style={{ color: getSviColor(inc.svi_score), fontWeight: 600 }}>{inc.svi_score}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Main: BSON Viewer */}
                            <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
                                <div style={{ marginBottom: '10px', fontSize: '12px', color: 'var(--success)', fontFamily: 'monospace' }}>
                    // CONNECTED: mongodb://drrts-mongo:27017/incidents
                                    <br />// COLLECTION: incidents (Change Stream Active)
                                    <br />// DOCUMENT: {selectedIncident?._id || 'none'} | SVI: {selectedIncident?.svi_score || 'N/A'}
                                </div>
                                {selectedIncident && parseFloat(selectedIncident.svi_score) > 0.7 && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '6px 10px', marginBottom: '10px', borderRadius: '6px',
                                        background: 'rgba(248, 81, 73, 0.1)', border: '1px solid rgba(248, 81, 73, 0.3)',
                                        fontSize: '11px', color: '#f85149', fontWeight: 600
                                    }}>
                                        <AlertTriangle size={12} /> HIGH VULNERABILITY INCIDENT
                                    </div>
                                )}
                                <pre style={{
                                    fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', lineHeight: 1.5,
                                    color: '#e6edf3', margin: 0
                                }}>
                                    {selectedBson}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* ═══ Neo4j Tab — Full Network State ═══ */}
                    {activeTab === 'neo' && (
                        <div style={{ padding: '20px', overflow: 'auto', height: '100%' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '12px', color: '#fbbf24', fontFamily: 'monospace', marginBottom: '8px' }}>
                  // CONNECTED: bolt://drrts-neo4j:7687
                                    <br />// ALGORITHM: apoc.algo.dijkstra (Cost-Optimized)
                                </div>
                                <div style={{ background: '#161b22', padding: '16px', borderRadius: '8px', border: '1px solid #30363d' }}>
                                    <pre style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#a5d6ff' }}>
                                        {GraphTopology.trim()}
                                    </pre>
                                </div>
                            </div>

                            {/* Node Type Summary */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                                {[
                                    { label: 'Responders', count: responders.length, color: '#3fb950' },
                                    { label: 'Incidents', count: incidents.length, color: '#f85149' },
                                    { label: 'Locations', count: 25, color: '#58a6ff' }
                                ].map(s => (
                                    <div key={s.label} style={{
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                        background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30`,
                                        display: 'flex', alignItems: 'center', gap: '6px'
                                    }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                                        {s.count} {s.label}
                                    </div>
                                ))}
                            </div>

                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                ACTIVE GRAPH NODES ({graphNodes.length})
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px' }}>
                                {graphNodes.map((node, i) => (
                                    <div key={`${node.type}-${node.id}-${i}`} style={{
                                        padding: '8px 10px', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px',
                                        fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        <div style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: getNodeColor(node.type),
                                            boxShadow: `0 0 4px ${getNodeColor(node.type)}`
                                        }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ color: '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {node.name || node.id}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '8px', fontWeight: 700, textTransform: 'uppercase',
                                            padding: '2px 5px', borderRadius: '3px',
                                            background: `${getNodeColor(node.type)}20`,
                                            color: getNodeColor(node.type)
                                        }}>{node.type}</span>
                                        <div style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: getStatusColor(node.status)
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══ Local Storage Tab ═══ */}
                    {activeTab === 'local' && (
                        <div style={{ padding: '20px', overflow: 'auto', height: '100%' }}>
                            <div style={{ marginBottom: '10px', fontSize: '12px', color: '#a371f7', fontFamily: 'monospace' }}>
                // ENGINE: CouchBase Lite (IndexedDB Adapter)
                                <br />// MODE: Offline-First | Sync Gateway Pending
                            </div>
                            <div style={{
                                display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap'
                            }}>
                                <span style={{
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                    background: 'rgba(163, 113, 247, 0.15)', color: '#a371f7', border: '1px solid rgba(163, 113, 247, 0.3)'
                                }}>
                                    📴 Offline-Ready
                                </span>
                                <span style={{
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                    background: 'rgba(210, 153, 34, 0.15)', color: '#d29922', border: '1px solid rgba(210, 153, 34, 0.3)'
                                }}>
                                    ⏳ 1 Pending Sync
                                </span>
                                <span style={{
                                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                    background: 'rgba(63, 185, 80, 0.15)', color: '#3fb950', border: '1px solid rgba(63, 185, 80, 0.3)'
                                }}>
                                    ✓ LWW Conflict Strategy
                                </span>
                            </div>
                            <pre style={{
                                fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', lineHeight: 1.5,
                                color: '#e6edf3'
                            }}>
                                {JSON.stringify(MockLocalDoc, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* ═══ Impact Metadata Tab ═══ */}
                    {activeTab === 'impact' && (
                        <div style={{ padding: '20px', overflow: 'auto', height: '100%' }}>
                            <div style={{ marginBottom: '12px', fontSize: '12px', color: '#00d4ff', fontFamily: 'monospace' }}>
                // NOBLE IMPACT ENGINE — Formula Transparency
                                <br />// All weights and calculations used by the optimizer
                            </div>

                            {/* Highlight Box */}
                            <div style={{
                                padding: '12px 14px', marginBottom: '16px', borderRadius: '8px',
                                background: 'rgba(0, 212, 255, 0.06)', border: '1px solid rgba(0, 212, 255, 0.2)',
                                display: 'flex', flexDirection: 'column', gap: '6px'
                            }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Core Objective Function
                                </div>
                                <div style={{
                                    fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#e6edf3',
                                    padding: '8px 12px', background: '#161b22', borderRadius: '6px', border: '1px solid #30363d'
                                }}>
                                    minimize( <span style={{ color: '#fbbf24' }}>α</span> × distance + (1 - <span style={{ color: '#fbbf24' }}>α</span>) × humanitarian_need )
                                </div>
                                <div style={{ fontSize: '11px', color: '#8b949e', lineHeight: 1.5 }}>
                                    Where <span style={{ color: '#fbbf24', fontWeight: 700 }}>α = 0.05</span> — Humanitarian Need is weighted{' '}
                                    <span style={{ color: '#fbbf24', fontWeight: 800 }}>20×</span> higher than distance.
                                </div>
                            </div>

                            <pre style={{
                                fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', lineHeight: 1.6,
                                color: '#e6edf3', margin: 0
                            }}>
                                {JSON.stringify(ImpactMetadata, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
