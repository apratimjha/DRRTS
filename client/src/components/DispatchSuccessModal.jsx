import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function DispatchSuccessModal({ responderId, svi, onDismiss }) {
    const [active, setActive] = useState(false);
    const [visible, setVisible] = useState(true);
    const onDismissRef = useRef(onDismiss);
    onDismissRef.current = onDismiss;

    useEffect(() => {
        // Entrance animation
        requestAnimationFrame(() => setActive(true));

        // Exit trigger (2.5s)
        const exitTimer = setTimeout(() => {
            setActive(false); // Triggers fade out
        }, 2500);

        // Full dismiss (3.0s)
        const dismissTimer = setTimeout(() => {
            setVisible(false);
            onDismissRef.current();
        }, 3000);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(dismissTimer);
        };
    }, []); // stable: no dependency on onDismiss avoids re-trigger

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: active ? 'rgba(13, 17, 23, 0.6)' : 'transparent',
            backdropFilter: active ? 'blur(8px)' : 'none',
            transition: 'all 0.5s ease',
            pointerEvents: 'none'
        }}>
            <div style={{
                background: '#1c2333', border: '1px solid #3fb950',
                borderRadius: '16px', padding: '32px', textAlign: 'center',
                boxShadow: '0 0 50px rgba(63, 185, 80, 0.3)',
                transform: active ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
                opacity: active ? 1 : 0,
                transition: 'opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                minWidth: '320px', pointerEvents: 'auto',
                position: 'relative'
            }}>
                <button
                    onClick={() => { setVisible(false); onDismissRef.current(); }}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'transparent', border: 'none',
                        color: '#6e7681', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <X size={20} />
                </button>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(63, 185, 80, 0.2)',
                    color: '#3fb950', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px auto', boxShadow: '0 0 0 6px rgba(63, 185, 80, 0.1)'
                }}>
                    <CheckCircle2 size={32} strokeWidth={3} />
                </div>

                <h2 style={{
                    fontSize: '18px', fontWeight: 800, color: '#e6edf3', margin: '0 0 8px 0',
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                    Noble Allocation Confirmed
                </h2>

                <p style={{ fontSize: '14px', color: '#8b949e', margin: 0, lineHeight: 1.5 }}>
                    Unit <strong style={{ color: '#00d4ff' }}>{responderId}</strong> assigned to <br />
                    <strong style={{ color: parseFloat(svi) > 0.7 ? '#f85149' : '#e6edf3' }}>SVI {svi}</strong> Zone
                </p>

                {/* Progress bar with "Closing..." label */}
                <div style={{
                    height: '4px', background: '#30363d', borderRadius: '2px',
                    marginTop: '24px', overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%', background: 'linear-gradient(90deg, #3fb950, #00d4ff)',
                        width: '100%',
                        animation: 'drainProgress 3s linear forwards'
                    }} />
                </div>
                <div style={{
                    fontSize: '10px', color: '#6e7681', marginTop: '6px',
                    textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600
                }}>
                    Closing...
                </div>

                <style>{`
          @keyframes drainProgress { from { width: 100%; } to { width: 0%; } }
        `}</style>
            </div>
        </div>
    );
}
