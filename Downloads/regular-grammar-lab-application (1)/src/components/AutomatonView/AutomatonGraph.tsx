import React, { useState, useEffect, useRef } from 'react';
import { NFA, NFATransition } from '../../types/grammar';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface AutomatonGraphProps {
  nfa: NFA;
  activeStateIds?: string[];
  activeTransitions?: NFATransition[];
  highlightFinals?: boolean;
  className?: string;
}

interface NodePosition {
  x: number;
  y: number;
}

export const AutomatonGraph: React.FC<AutomatonGraphProps> = ({
  nfa,
  activeStateIds = [],
  activeTransitions = [],
  highlightFinals = true,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Calculate clean initial layout whenever nfa states change
  useEffect(() => {
    const newPositions: Record<string, NodePosition> = {};
    const states = nfa.states;
    const total = states.length;

    if (total === 0) return;

    // Separate states into initial, intermediate/regular, and final
    const width = 640;
    const height = 360;
    const paddingX = 100;

    if (total === 1) {
      newPositions[states[0].id] = { x: width / 2, y: height / 2 };
    } else if (total <= 6) {
      // Horizontal flow with vertical jitter
      const stepX = (width - 2 * paddingX) / (total - 1 || 1);
      states.forEach((s, i) => {
        // Place initial state at left, final at right if possible
        let x = paddingX + i * stepX;
        let y = height / 2;
        if (s.isIntermediate) {
          y += (i % 2 === 0 ? 50 : -50);
        } else if (i % 2 === 1) {
          y += 20;
        } else if (i % 2 === 0 && i !== 0) {
          y -= 20;
        }
        newPositions[s.id] = { x, y };
      });
    } else {
      // Circle layout for larger graphs
      const radiusX = Math.min(width, height) * 0.38;
      const radiusY = Math.min(width, height) * 0.32;
      const centerX = width / 2;
      const centerY = height / 2;

      states.forEach((s, i) => {
        const angle = (2 * Math.PI * i) / total - Math.PI / 2;
        newPositions[s.id] = {
          x: centerX + radiusX * Math.cos(angle),
          y: centerY + radiusY * Math.sin(angle)
        };
      });
    }

    setPositions(newPositions);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [nfa.states]);

  // Group transitions between same pair of nodes (to combine labels e.g. "a, b")
  const transitionPairs = React.useMemo(() => {
    const map = new Map<string, { from: string; to: string; symbols: string[]; isBack: boolean }>();

    nfa.transitions.forEach(t => {
      const key = `${t.from}->${t.to}`;
      const revKey = `${t.to}->${t.from}`;

      if (map.has(key)) {
        const existing = map.get(key)!;
        if (!existing.symbols.includes(t.symbol)) {
          existing.symbols.push(t.symbol);
        }
      } else {
        const isBack = map.has(revKey) || t.from !== t.to && nfa.states.findIndex(s => s.id === t.from) > nfa.states.findIndex(s => s.id === t.to);
        map.set(key, {
          from: t.from,
          to: t.to,
          symbols: [t.symbol],
          isBack
        });
      }
    });

    return Array.from(map.values());
  }, [nfa.transitions, nfa.states]);

  // Handle Dragging
  const handleMouseDownNode = (stateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const pos = positions[stateId] || { x: 0, y: 0 };
    setDraggingNode(stateId);
    setDragOffset({
      x: e.clientX / zoom - pos.x,
      y: e.clientY / zoom - pos.y
    });
  };

  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const newX = e.clientX / zoom - dragOffset.x;
      const newY = e.clientY / zoom - dragOffset.y;
      setPositions(prev => ({
        ...prev,
        [draggingNode]: { x: Math.max(30, Math.min(800, newX)), y: Math.max(30, Math.min(500, newY)) }
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
    setIsPanning(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const NODE_RADIUS = 26;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[380px] bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden select-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseDown={handleMouseDownCanvas}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* Graph Toolbar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur border border-slate-700/80 rounded-lg p-1 text-slate-300 shadow-md">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.15, 2.0))}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.15, 0.5))}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="text-xs font-mono px-1.5 text-slate-400">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-3 text-xs bg-slate-950/85 backdrop-blur border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400 font-mono shadow-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 border border-indigo-300"></span>
          Initial (q₀)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500/20 border-2 border-emerald-400 ring-1 ring-emerald-400"></span>
          Accepting
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 border border-purple-300 animate-pulse"></span>
          Active
        </span>
        <span className="flex items-center gap-1.5 text-slate-500">
          (Drag nodes to reposition)
        </span>
      </div>

      {/* SVG Canvas */}
      <svg
        className="w-full h-full pointer-events-auto"
        viewBox="0 0 700 400"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Arrowhead marker default */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#64748b" />
          </marker>
          {/* Arrowhead marker active */}
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#c084fc" />
          </marker>
          {/* Arrowhead marker start state */}
          <marker
            id="arrow-start"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 9 5 L 0 8 z" fill="#6366f1" />
          </marker>

          {/* Glowing filter for active states */}
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Transitions Lines and Labels */}
          {transitionPairs.map((pair, idx) => {
            const p1 = positions[pair.from];
            const p2 = positions[pair.to];
            if (!p1 || !p2) return null;

            // Check if active transition
            const isTransActive = activeTransitions.some(
              at => at.from === pair.from && at.to === pair.to && pair.symbols.includes(at.symbol)
            );

            // Self-loop
            if (pair.from === pair.to) {
              const loopR = 24;
              const topY = p1.y - NODE_RADIUS;
              const pathD = `M ${p1.x - 12} ${topY} C ${p1.x - loopR} ${topY - 45}, ${p1.x + loopR} ${topY - 45}, ${p1.x + 12} ${topY}`;
              const labelX = p1.x;
              const labelY = topY - 32;

              return (
                <g key={`loop-${idx}`} className="transition-all duration-300">
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isTransActive ? '#c084fc' : '#64748b'}
                    strokeWidth={isTransActive ? '2.5' : '1.8'}
                    strokeDasharray={isTransActive ? '4 2' : undefined}
                    markerEnd={isTransActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                  />
                  <rect
                    x={labelX - 16}
                    y={labelY - 11}
                    width="32"
                    height="20"
                    rx="4"
                    fill="#0f172a"
                    stroke={isTransActive ? '#c084fc' : '#334155'}
                    strokeWidth="1"
                  />
                  <text
                    x={labelX}
                    y={labelY + 3}
                    textAnchor="middle"
                    className="text-xs font-mono font-semibold"
                    fill={isTransActive ? '#f3e8ff' : '#94a3b8'}
                  >
                    {pair.symbols.join(',')}
                  </text>
                </g>
              );
            }

            // Directed Edge between distinct nodes
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return null;

            // Normalize vector
            const nx = dx / dist;
            const ny = dy / dist;

            // Curvature: if both directions exist or isBack, curve edge
            const curveAmount = pair.isBack ? -30 : (dist > 250 ? 25 : 18);
            // Perpendicular vector
            const px = -ny * curveAmount;
            const py = nx * curveAmount;

            // Start and end points trimmed by NODE_RADIUS
            const sx = p1.x + nx * (NODE_RADIUS + 2);
            const sy = p1.y + ny * (NODE_RADIUS + 2);
            const ex = p2.x - nx * (NODE_RADIUS + 6);
            const ey = p2.y - ny * (NODE_RADIUS + 6);

            // Control point
            const midX = (sx + ex) / 2 + px;
            const midY = (sy + ey) / 2 + py;

            const pathD = `M ${sx} ${sy} Q ${midX} ${midY} ${ex} ${ey}`;

            // Label coordinate
            const labelX = (sx + 2 * midX + ex) / 4;
            const labelY = (sy + 2 * midY + ey) / 4;

            return (
              <g key={`edge-${idx}`} className="transition-all duration-300">
                <path
                  d={pathD}
                  fill="none"
                  stroke={isTransActive ? '#c084fc' : '#64748b'}
                  strokeWidth={isTransActive ? '2.5' : '1.8'}
                  markerEnd={isTransActive ? 'url(#arrow-active)' : 'url(#arrow)'}
                />
                <rect
                  x={labelX - 14}
                  y={labelY - 10}
                  width="28"
                  height="18"
                  rx="4"
                  fill="#0f172a"
                  stroke={isTransActive ? '#c084fc' : '#334155'}
                  strokeWidth="1"
                />
                <text
                  x={labelX}
                  y={labelY + 3.5}
                  textAnchor="middle"
                  className="text-xs font-mono font-semibold"
                  fill={isTransActive ? '#f3e8ff' : '#94a3b8'}
                >
                  {pair.symbols.join(',')}
                </text>
              </g>
            );
          })}

          {/* Initial State Incoming Arrow */}
          {nfa.states.filter(s => s.isInitial).map(s => {
            const p = positions[s.id];
            if (!p) return null;
            return (
              <g key={`start-arrow-${s.id}`}>
                <line
                  x1={p.x - 48}
                  y1={p.y}
                  x2={p.x - NODE_RADIUS - 4}
                  y2={p.y}
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  markerEnd="url(#arrow-start)"
                />
                <text
                  x={p.x - 52}
                  y={p.y - 6}
                  textAnchor="middle"
                  className="text-[11px] font-mono font-bold fill-indigo-400"
                >
                  start
                </text>
              </g>
            );
          })}

          {/* State Nodes */}
          {nfa.states.map(state => {
            const pos = positions[state.id];
            if (!pos) return null;

            const isActive = activeStateIds.includes(state.id);
            const isFinal = highlightFinals && state.isFinal;
            const isInitial = state.isInitial;
            const isIntermediate = state.isIntermediate;

            let fillColor = '#1e293b';
            let strokeColor = '#475569';

            if (isActive) {
              fillColor = '#581c87';
              strokeColor = '#c084fc';
            } else if (isFinal) {
              fillColor = '#064e3b';
              strokeColor = '#10b981';
            } else if (isInitial) {
              fillColor = '#1e1b4b';
              strokeColor = '#6366f1';
            } else if (isIntermediate) {
              fillColor = '#181e29';
              strokeColor = '#64748b';
            }

            return (
              <g
                key={state.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseDown={e => handleMouseDownNode(state.id, e)}
                className="cursor-move group"
                filter={isActive ? 'url(#glow)' : undefined}
              >
                {/* Active pulse ring */}
                {isActive && (
                  <circle
                    r={NODE_RADIUS + 7}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    className="animate-spin"
                    style={{ animationDuration: '6s' }}
                  />
                )}

                {/* Outer Final Circle */}
                {isFinal && (
                  <circle
                    r={NODE_RADIUS + 4}
                    fill="none"
                    stroke={isActive ? '#c084fc' : '#10b981'}
                    strokeWidth="1.8"
                  />
                )}

                {/* Main State Circle */}
                <circle
                  r={NODE_RADIUS}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="2.2"
                  strokeDasharray={isIntermediate ? '4 2' : undefined}
                  className="transition-colors duration-200"
                />

                {/* State Label */}
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  className="font-mono font-bold select-none text-xs"
                  fill={isActive ? '#fdf4ff' : '#f1f5f9'}
                  style={{ pointerEvents: 'none' }}
                >
                  {state.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
