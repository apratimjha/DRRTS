import React, { useEffect, useState } from "react";
import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import 'leaflet.heat';
import blueIcon from 'leaflet-color-markers/img/marker-icon-2x-blue.png';
import redIcon from 'leaflet-color-markers/img/marker-icon-2x-red.png';
import orangeIcon from 'leaflet-color-markers/img/marker-icon-2x-orange.png';
import greenIcon from 'leaflet-color-markers/img/marker-icon-2x-green.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';

/* Fix Leaflet default icons */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Pulsing div icon for high-SVI markers
const createPulsingIcon = () => {
  return L.divIcon({
    className: '',
    html: '<div class="svi-marker-pulse"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};

// Custom cluster icon with dark glow
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = 'small';
  let dimension = 36;
  if (count >= 10) { size = 'medium'; dimension = 44; }
  if (count >= 25) { size = 'large'; dimension = 52; }

  return L.divIcon({
    html: `<div class="marker-cluster-custom marker-cluster-${size}"><span>${count}</span></div>`,
    className: '',
    iconSize: L.point(dimension, dimension, true),
  });
};

// Generate simulated SVI breakdown from overall score
const getSviBreakdown = (svi) => {
  const score = parseFloat(svi);
  // Simulated sub-scores that roughly average to the overall SVI
  const poverty = Math.min(1, Math.max(0, score + (Math.random() - 0.5) * 0.2)).toFixed(2);
  const transport = Math.min(1, Math.max(0, score + (Math.random() - 0.5) * 0.3)).toFixed(2);
  const housing = Math.min(1, Math.max(0, score + (Math.random() - 0.5) * 0.25)).toFixed(2);
  const noblePriority = (score * 20 / (0.05 + 0.01)).toFixed(1); // Based on alpha=0.05
  return { poverty, transport, housing, noblePriority };
};

// React wrapper for L.heatLayer (leaflet.heat)
function HeatmapLayer({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const heat = L.heatLayer(points, {
      radius: 30,
      blur: 20,
      maxZoom: 10,
      max: 1.0,
      gradient: {
        0.2: '#0d47a1',
        0.4: '#1565c0',
        0.5: '#ff6b35',
        0.7: '#ef5350',
        0.9: '#f85149',
        1.0: '#ff1744'
      }
    }).addTo(map);
    return () => { map.removeLayer(heat); };
  }, [map, points]);
  return null;
}

export default function MapComponent({ incidents = [], onClusterClick, showHeatmap = false, dispatchedIncidents = [] }) {
  const [routePath, setRoutePath] = useState([]);
  const [fleetRoutes, setFleetRoutes] = useState({});
  const [responders, setResponders] = useState([]);

  // Fetch responders
  useEffect(() => {
    const fetchResponders = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/responders');
        if (res.ok) {
          const data = await res.json();
          setResponders(data);
        }
      } catch (err) {
        console.warn("Failed to fetch responders:", err);
      }
    };
    fetchResponders();
    const interval = setInterval(fetchResponders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleRoute = (e) => {
      if (e.detail && Array.isArray(e.detail.path)) {
        const coords = e.detail.path.map(p => [p.lat, p.lng]);
        setRoutePath(coords);
        setFleetRoutes({});
      }
    };

    const handleOptimization = (e) => {
      setFleetRoutes(e.detail.routes);
      setRoutePath([]);
    };

    window.addEventListener('route-found', handleRoute);
    window.addEventListener('optimization-complete', handleOptimization);

    return () => {
      window.removeEventListener('route-found', handleRoute);
      window.removeEventListener('optimization-complete', handleOptimization);
    };
  }, []);

  const getVehicleColor = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + "00000".substring(0, 6 - c.length) + c;
  };

  const getMarkerIcon = (svi) => {
    const score = parseFloat(svi);
    let iconUrl = blueIcon;
    if (score >= 0.8) iconUrl = redIcon;
    else if (score >= 0.5) iconUrl = orangeIcon;

    return new L.Icon({
      iconUrl, shadowUrl: markerShadow,
      iconSize: [25, 41], iconAnchor: [12, 41],
      popupAnchor: [1, -34], shadowSize: [41, 41]
    });
  };

  const responderIcon = new L.Icon({
    iconUrl: greenIcon, shadowUrl: markerShadow,
    iconSize: [25, 41], iconAnchor: [12, 41],
    popupAnchor: [1, -34], shadowSize: [41, 41]
  });

  const renderSviPopup = (inc) => {
    const svi = parseFloat(inc.svi_score);
    const breakdown = getSviBreakdown(svi);
    const severity = svi >= 0.8 ? 'CRITICAL' : svi >= 0.5 ? 'HIGH' : 'MODERATE';
    const sevColor = svi >= 0.8 ? '#f85149' : svi >= 0.5 ? '#ff6b35' : '#3fb950';

    return (
      <div style={{ minWidth: '180px' }}>
        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>{inc.type}</div>
        <span style={{
          display: 'inline-block', background: sevColor, color: 'white',
          padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700
        }}>
          {severity}
        </span>
        <table className="svi-popup-table">
          <tbody>
            <tr><td>Overall SVI</td><td style={{ color: sevColor }}>{inc.svi_score}</td></tr>
            <tr><td>Poverty Index</td><td>{breakdown.poverty}</td></tr>
            <tr><td>Transport Access</td><td>{breakdown.transport}</td></tr>
            <tr><td>Housing Quality</td><td>{breakdown.housing}</td></tr>
          </tbody>
        </table>
        <div className="noble-priority-badge">
          Noble Priority: {breakdown.noblePriority}
        </div>
      </div>
    );
  };

  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      style={{
        height: '100%', width: '100%', borderRadius: '8px',
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
      }}
    >
      {/* Light tile layer for high-contrast markers */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />

      {/* Single Dispatch Path */}
      {routePath.length > 0 && (
        <Polyline positions={routePath} color="#00d4ff" weight={4} opacity={0.8} dashArray="10, 10" />
      )}

      {/* Fleet Optimization Paths */}
      {Object.entries(fleetRoutes).map(([vehicleId, stops]) => {
        if (!stops || stops.length === 0) return null;
        const positions = stops.map(s => [s.lat, s.lng]);
        return (
          <Polyline key={vehicleId} positions={positions} color={getVehicleColor(vehicleId)} weight={3} opacity={0.8}>
            <Popup>Vehicle: {vehicleId}</Popup>
          </Polyline>
        );
      })}

      {/* Clustered Incident Markers */}
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterCustomIcon}
        maxClusterRadius={50}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
        eventHandlers={{
          clusterclick: (e) => {
            if (!onClusterClick) return;
            const childMarkers = e.layer.getAllChildMarkers();
            const ids = [];
            childMarkers.forEach(cm => {
              const ll = cm.getLatLng();
              const match = incidents.find(inc =>
                Math.abs(inc.coordinates.lat - ll.lat) < 0.001 &&
                Math.abs(inc.coordinates.lng - ll.lng) < 0.001
              );
              if (match && match._id && !ids.includes(match._id)) ids.push(match._id);
            });
            if (ids.length > 0) onClusterClick(ids);
          }
        }}
      >
        {incidents.map((inc, index) => {
          const svi = parseFloat(inc.svi_score);
          const isHighSvi = svi > 0.7;

          if (isHighSvi) {
            return (
              <Marker
                key={inc._id || index}
                position={[inc.coordinates.lat, inc.coordinates.lng]}
                icon={createPulsingIcon()}
              >
                <Popup>{renderSviPopup(inc)}</Popup>
              </Marker>
            );
          }

          return (
            <Marker
              key={inc._id || index}
              position={[inc.coordinates.lat, inc.coordinates.lng]}
              icon={getMarkerIcon(inc.svi_score)}
            >
              <Popup>{renderSviPopup(inc)}</Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>

      {/* Render Responders (outside cluster group) */}
      {responders.map((r, i) => (
        <Marker key={`resp-${i}`} position={[r.lat, r.lng]} icon={responderIcon}>
          <Popup>
            <div style={{ minWidth: '140px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{r.name}</div>
              <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>
                Unit: <span style={{ color: '#3fb950' }}>{r.id}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#6e7681', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={10} /> {r.lat?.toFixed(2)}, {r.lng?.toFixed(2)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      {/* Heatmap Overlay for dispatched incidents */}
      {showHeatmap && dispatchedIncidents.length > 0 && (
        <HeatmapLayer
          points={dispatchedIncidents.map(inc => [
            inc.coordinates.lat,
            inc.coordinates.lng,
            parseFloat(inc.svi_score) || 0.5
          ])}
        />
      )}
    </MapContainer>
  );
}
