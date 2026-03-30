import React, { useState, useEffect } from "react";
import MapComponent from "./components/Map";
import DispatchSuccessModal from "./components/DispatchSuccessModal";
import DataInspector from "./components/DataInspector";
import NobleMetrics from "./components/NobleMetrics";
import SystemLog from "./components/SystemLog";
import { v4 as uuidv4 } from 'uuid';
import { saveIncident, retrySync } from './services/sync';
import { getPendingIncidents } from './services/db';
import {
  ShieldAlert, BarChart3, Users, Radio,
  MapPin, Zap, Wifi, WifiOff, PlusCircle,
  Sparkles, Terminal, Activity, Rocket,
  AlertTriangle, CheckCircle2, Network,
  X, Flame
} from 'lucide-react';

const BACKEND_URL = "http://localhost:5000/api/incidents";

function App() {
  const [incidents, setIncidents] = useState([]);
  const [allIncidents, setAllIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [forceOffline, setForceOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [dispatchModal, setDispatchModal] = useState(null); // { responderId, svi, key }
  const [showInspector, setShowInspector] = useState(false);
  const [inspectorInitialId, setInspectorInitialId] = useState(null);
  const [inspectorFilterIds, setInspectorFilterIds] = useState(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const handleClusterInspect = React.useCallback((incidentIds) => {
    // incidentIds is now an array of all IDs in the cluster
    setInspectorFilterIds(incidentIds);
    setInspectorInitialId(incidentIds[0] || null);
    setShowInspector(true);
  }, []);

  const handleKpiFilter = React.useCallback((filterType) => {
    let ids = null;
    if (filterType === 'dispatched') {
      ids = (allIncidents || []).filter(i => i.status === 'dispatched').map(i => i._id);
    } else if (filterType === 'highSvi') {
      ids = (allIncidents || []).filter(i => parseFloat(i.svi_score) >= 0.7).map(i => i._id);
    }
    // 'all' means no filter
    setInspectorFilterIds(ids);
    setInspectorInitialId(ids?.[0] || null);
    setShowInspector(true);
  }, [allIncidents]);

  const effectiveOffline = isOffline || forceOffline;

  // Fetch responders
  useEffect(() => {
    const fetchResponders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/responders');
        if (res.ok) setResponders(await res.json());
      } catch (err) {
        console.warn("Failed to fetch responders:", err);
      }
    };
    fetchResponders();
    const interval = setInterval(fetchResponders, 10000);
    return () => clearInterval(interval);
  }, []);

  // Poll for incidents
  useEffect(() => {
    const fetchIncidents = async () => {
      if (effectiveOffline) return;
      try {
        const res = await fetch(BACKEND_URL);
        if (res.ok) {
          const data = await res.json();
          const all = Array.isArray(data) ? data : [];
          setAllIncidents(all);
          setIncidents(all.filter(i => i.status !== 'resolved' && i.status !== 'dispatched'));
        }
      } catch (err) {
        console.warn("Polling failed:", err);
      }
    };
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 3000);
    return () => clearInterval(interval);
  }, [effectiveOffline]);

  // Network status
  useEffect(() => {
    const handleStatusChange = () => {
      const offline = !navigator.onLine;
      setIsOffline(offline);
      if (!offline) retrySync().then(updatePendingCount);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    updatePendingCount();
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const updatePendingCount = async () => {
    const pending = await getPendingIncidents();
    setPendingCount(pending.length);
  };

  const simulateReport = async () => {
    const newIncident = {
      reporter_id: `DID:eth:${uuidv4().split('-')[0]}`,
      coordinates: {
        lat: 20.5937 + (Math.random() - 0.5) * 5,
        lng: 78.9629 + (Math.random() - 0.5) * 5
      },
      type: ["FloodReport", "MedicalTriage", "ResourceRequest"][Math.floor(Math.random() * 3)],
      svi_score: Math.random().toFixed(2),
      timestamp: new Date().toISOString(),
      details: { note: "Simulated via Command Center" }
    };
    const success = await saveIncident(newIncident);
    if (success) setIncidents(prev => [...prev, newIncident]);
    else await updatePendingCount();
  };

  const handleInitGraph = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/incidents/init-graph', { method: 'POST' });
      if (res.ok) window.location.reload();
    } catch (err) { alert('❌ Failed to initialize graph'); }
  };

  const handleOptimizeFleet = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/incidents/optimize', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('optimization-complete', { detail: data }));
      }
    } catch (err) { alert('❌ Optimization failed: ' + err.message); }
  };

  const handleDispatch = async (inc) => {
    try {
      const res = await fetch('http://localhost:5000/api/incidents/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId: inc._id })
      });

      if (res.ok) {
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('route-found', { detail: data }));
        setIncidents(prev => prev.filter(item => item._id !== inc._id));
        setAllIncidents(prev => prev.map(item =>
          item._id === inc._id ? { ...item, status: 'dispatched' } : item
        ));
        setDispatchModal({ responderId: data.responderId, svi: inc.svi_score, key: `${data.responderId}-${Date.now()}` });
      } else {
        const err = await res.json();
        alert(`❌ Dispatch Failed: ${err.message || "No route found"}`);
      }
    } catch (error) { alert("❌ Network Error: " + error.message); }
  };

  const handleDismissModal = React.useCallback(() => {
    setDispatchModal(null);
  }, []);

  // KPIs
  const activeIncidents = incidents.length;
  const highVulnerability = incidents.filter(i => i.svi_score >= 0.7).length;
  const avgSvi = incidents.length > 0
    ? (incidents.reduce((sum, i) => sum + parseFloat(i.svi_score), 0) / incidents.length).toFixed(2)
    : '0.00';

  const getSviColor = (score) => {
    const s = parseFloat(score);
    if (s >= 0.8) return '#f85149'; // Critical
    if (s >= 0.5) return '#58a6ff'; // High/Mid (Blue for contrast)
    return '#3fb950'; // Moderate
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ═══ HEADER ═══ */}
      <header style={{
        height: '60px', position: 'fixed', top: 0, left: 0, right: 0,
        background: 'var(--card)', borderBottom: '1px solid var(--border)',
        zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #1f6feb, #00d4ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '15px'
          }}>D</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>
              DRRTS <span style={{ color: 'var(--neon-blue)' }}>Command Center</span>
            </h1>
            <p style={{ margin: 0, fontSize: '10px', color: 'var(--muted)', fontWeight: 500 }}>
              Disaster Resilient Response & Tactical Simulation
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {pendingCount > 0 && (
            <span style={{
              background: 'rgba(210, 153, 34, 0.15)', color: '#d29922',
              padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
              border: '1px solid rgba(210, 153, 34, 0.3)', display: 'flex', alignItems: 'center', gap: '6px'
            }}><AlertTriangle size={12} /> {pendingCount} PENDING</span>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 12px', borderRadius: '8px',
            background: 'var(--bg-surface)', border: '1px solid var(--border)'
          }}>
            <div className={`heartbeat-dot ${effectiveOffline ? 'offline' : ''}`} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: effectiveOffline ? 'var(--danger)' : 'var(--success)' }}>
              {effectiveOffline ? 'OFFLINE' : 'ONLINE'}
            </span>
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <div style={{ paddingTop: '60px' }}>

        {/* KPI ROW */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(248, 81, 73, 0.15)', color: '#f85149' }}>
              <ShieldAlert size={18} />
            </div>
            <div className="kpi-label">Active Incidents</div>
            <div className="kpi-value" style={{ color: '#f85149' }}>{activeIncidents}</div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#ff6b35' }}>{highVulnerability} High SVI</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff' }}>
              <BarChart3 size={18} />
            </div>
            <div className="kpi-label">Avg Vulnerability</div>
            <div className="kpi-value" style={{ color: 'var(--neon-blue)' }}>{avgSvi}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{ background: 'rgba(255, 107, 53, 0.15)', color: '#ff6b35' }}>
              <Users size={18} />
            </div>
            <div className="kpi-label">Field Responders</div>
            <div className="kpi-value" style={{ color: '#ff6b35' }}>{responders.length}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon-wrapper" style={{
              background: effectiveOffline ? 'rgba(248, 81, 73, 0.15)' : 'rgba(63, 185, 80, 0.15)',
              color: effectiveOffline ? '#f85149' : '#3fb950'
            }}>
              <Radio size={18} />
            </div>
            <div className="kpi-label">Network</div>
            <div className="kpi-value" style={{ color: effectiveOffline ? 'var(--danger)' : 'var(--success)' }}>
              {effectiveOffline ? 'OFFLINE' : 'ONLINE'}
            </div>
          </div>
        </div>

        {/* ═══ MAIN GRID ═══ */}
        <div className="dashboard-grid">

          {/* ── LEFT SIDEBAR ── */}
          <div className="sidebar-column">

            {/* Quick Actions */}
            <div className="panel">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ Quick Actions</h3>
              <button onClick={handleInitGraph} className="action-btn">
                <Network size={14} /> Initialize Graph
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <button onClick={() => setForceOffline(!forceOffline)} className={`action-btn ${forceOffline ? 'success' : 'danger'}`} style={{ marginBottom: 0 }}>
                  {forceOffline ? <Wifi size={14} /> : <WifiOff size={14} />} {forceOffline ? 'Reconnect' : 'Cut Uplink'}
                </button>
                <button onClick={simulateReport} className="action-btn" style={{ marginBottom: 0 }}>
                  <PlusCircle size={14} /> Simulate
                </button>
              </div>
              <button onClick={handleOptimizeFleet} className="action-btn primary">
                <Sparkles size={14} /> Optimize Fleet
              </button>
              <button onClick={() => setShowInspector(true)} className="action-btn inspect">
                <Terminal size={14} /> Inspect State
              </button>
            </div>

            {/* System Log */}
            <SystemLog />

            {/* Incident Feed */}
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📍 Live Incident Feed
                </h3>
                <span style={{
                  fontSize: '11px', background: 'var(--bg-surface)', padding: '2px 8px',
                  borderRadius: '6px', color: 'var(--text-secondary)', fontWeight: 700,
                  border: '1px solid var(--border)'
                }}>{incidents.length}</span>
              </div>

              <div className="incident-feed-container" style={{ flexGrow: 1 }}>
                {incidents.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0', fontSize: '12px' }}>No active incidents</div>
                ) : (
                  incidents.map((inc, i) => (
                    <div key={inc._id || i} className="incident-card" style={{
                      position: 'relative', overflow: 'hidden', paddingLeft: '14px',
                      borderLeft: `4px solid ${getSviColor(inc.svi_score)}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text)' }}>{inc.type}</span>
                        <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                          {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <Activity size={12} color={getSviColor(inc.svi_score)} />
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          SVI: {inc.svi_score}
                        </span>
                      </div>

                      <button onClick={() => handleDispatch(inc)} className="dispatch-btn">
                        <Rocket size={12} /> DISPATCH UNIT
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Map + Analytics ── */}
          <div className="main-content">

            {/* Map */}
            <div className="map-panel">
              <div style={{
                height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 400,
                background: 'rgba(235, 238, 241, 0.9)', backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border)'
              }}>
                <h2 style={{
                  margin: 0, fontWeight: 700, fontSize: '11px', color: '#0f172a',
                  textTransform: 'uppercase', letterSpacing: '1px',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <MapPin size={12} /> India Tactical View
                </h2>
              </div>

              <div style={{ height: '100%', width: '100%' }}>
                <MapComponent
                  incidents={incidents}
                  onClusterClick={handleClusterInspect}
                  showHeatmap={showHeatmap}
                  dispatchedIncidents={allIncidents.filter(i => i.status === 'dispatched')}
                />
              </div>

              {/* Legend (Still using CSS shapes for markers match) */}
              <div className="map-legend light-mode">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="svi-marker-pulse" style={{ width: '10px', height: '10px', animation: 'svi-pulse 1.5s infinite' }} />
                  High-SVI
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff6b35' }} /> Active
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3fb950' }} /> Responder
                </span>
                <button
                  onClick={() => setShowHeatmap(h => !h)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '3px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                    background: showHeatmap ? 'rgba(248, 81, 73, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    color: showHeatmap ? '#f85149' : '#8b949e',
                    border: `1px solid ${showHeatmap ? 'rgba(248, 81, 73, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                    cursor: 'pointer', transition: 'all 0.2s ease'
                  }}
                >
                  <Flame size={10} /> {showHeatmap ? 'Hide' : 'Impact'} Heatmap
                </button>
              </div>
            </div>

            {/* Noble Metrics */}
            <NobleMetrics incidents={incidents} allIncidents={allIncidents} onFilterInspector={handleKpiFilter} />
          </div>
        </div>
      </div>

      {/* ═══ OVERLAYS ═══ */}
      {dispatchModal && (
        <DispatchSuccessModal
          key={dispatchModal.key}
          responderId={dispatchModal.responderId}
          svi={dispatchModal.svi}
          onDismiss={handleDismissModal}
        />
      )}

      {showInspector && (
        <DataInspector
          onClose={() => { setShowInspector(false); setInspectorInitialId(null); setInspectorFilterIds(null); }}
          incidents={allIncidents}
          initialIncidentId={inspectorInitialId}
          filterIds={inspectorFilterIds}
        />
      )}

      {/* AI Tuning Footer */}
      <div className="ai-tuning-footer">
        <div>🧬 AI Tuning: <span>ALPHA=0.05</span></div>
        <div>|</div>
        <div>SVI-WEIGHT=<span>20×</span></div>
        <div>|</div>
        <div>Engine: <span>NSGA-II</span></div>
      </div>
    </div>
  );
}

export default App;
