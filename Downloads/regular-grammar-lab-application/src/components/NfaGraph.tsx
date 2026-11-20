import { useId, useMemo, useState } from "react";
import dagre from "@dagrejs/dagre";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { compactExpression, isEpsilonMarker } from "../lib/grammar";
import { LAMBDA, type Nfa, type NfaTransition } from "../lib/types";

type Point = { x: number; y: number };
type Position = Point & { width: number; height: number };
type EdgeGroup = {
  key: string;
  from: string;
  to: string;
  labels: string[];
  ids: string[];
};

function shortLabel(label: string): string {
  const compact = compactExpression(label);
  return isEpsilonMarker(compact) ? LAMBDA : compact || LAMBDA;
}

function edgeGeometry(
  group: EdgeGroup,
  positions: Record<string, Position>,
  bidirectional: boolean,
): { path: string; label: Point } {
  const from = positions[group.from];
  const to = positions[group.to];
  if (!from || !to) return { path: "", label: { x: 0, y: 0 } };
  if (group.from === group.to) {
    const path = `M ${from.x - 13} ${from.y - 29} C ${from.x - 46} ${from.y - 98}, ${from.x + 46} ${from.y - 98}, ${from.x + 13} ${from.y - 29}`;
    return { path, label: { x: from.x, y: from.y - 74 } };
  }
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / distance;
  const uy = dy / distance;
  const perpendicular = { x: -uy, y: ux };
  const start = { x: from.x + ux * 31, y: from.y + uy * 31 };
  const end = { x: to.x - ux * 39, y: to.y - uy * 39 };
  const offset = bidirectional ? (group.from < group.to ? -26 : 26) : 0;
  const c1 = { x: start.x + dx * 0.38 + perpendicular.x * offset, y: start.y + dy * 0.38 + perpendicular.y * offset };
  const c2 = { x: end.x - dx * 0.38 + perpendicular.x * offset, y: end.y - dy * 0.38 + perpendicular.y * offset };
  const middle = {
    x: (start.x + 3 * c1.x + 3 * c2.x + end.x) / 8,
    y: (start.y + 3 * c1.y + 3 * c2.y + end.y) / 8,
  };
  return {
    path: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`,
    label: { x: middle.x + perpendicular.x * 3, y: middle.y + perpendicular.y * 3 },
  };
}

export default function NfaGraph({
  nfa,
  activeStates = [],
  activeTransitions = [],
  showLegend = true,
  caption,
}: {
  nfa: Nfa;
  activeStates?: string[];
  activeTransitions?: string[];
  showLegend?: boolean;
  caption?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const rawId = useId();
  const markerId = `nfa-${rawId.replace(/:/g, "")}`;

  const layout = useMemo(() => {
    const graph = new dagre.graphlib.Graph({ multigraph: true });
    graph.setGraph({ rankdir: "LR", nodesep: 62, ranksep: 105, marginx: 80, marginy: 80, acyclicer: "greedy" });
    graph.setDefaultEdgeLabel(() => ({}));
    for (const state of nfa.states) graph.setNode(state.id, { width: 64, height: 64 });
    nfa.transitions.forEach((transition, index) => {
      if (graph.hasNode(transition.from) && graph.hasNode(transition.to)) {
        graph.setEdge(transition.from, transition.to, {}, `edge-${index}`);
      }
    });
    try {
      dagre.layout(graph);
    } catch {
      // A fallback grid is used if a pathological cyclic graph defeats the layout engine.
    }
    const positions: Record<string, Position> = {};
    nfa.states.forEach((state, index) => {
      const node = graph.node(state.id) as Position | undefined;
      positions[state.id] = node && Number.isFinite(node.x) && Number.isFinite(node.y)
        ? { x: node.x, y: node.y, width: node.width || 64, height: node.height || 64 }
        : { x: 110 + (index % 4) * 160, y: 110 + Math.floor(index / 4) * 130, width: 64, height: 64 };
    });
    const graphSize = graph.graph() as { width?: number; height?: number };
    return {
      positions,
      width: Math.max(720, (graphSize.width ?? 700) + 100),
      height: Math.max(320, (graphSize.height ?? 280) + 100),
    };
  }, [nfa]);

  const groups = useMemo(() => {
    const map = new Map<string, EdgeGroup>();
    for (const transition of nfa.transitions as NfaTransition[]) {
      const key = `${transition.from}::${transition.to}`;
      const existing = map.get(key);
      if (existing) {
        existing.ids.push(transition.id);
        const label = shortLabel(transition.label);
        if (!existing.labels.includes(label)) existing.labels.push(label);
      } else {
        map.set(key, {
          key,
          from: transition.from,
          to: transition.to,
          labels: [shortLabel(transition.label)],
          ids: [transition.id],
        });
      }
    }
    return Array.from(map.values());
  }, [nfa]);

  const directionKeys = useMemo(() => new Set(nfa.transitions.map((transition) => `${transition.from}>${transition.to}`)), [nfa]);
  const activeStateSet = new Set(activeStates);
  const activeEdgeSet = new Set(activeTransitions);
  const start = layout.positions[nfa.startId];

  return (
    <div className="fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-3">
          {showLegend ? (
            <>
              <span className="legend-chip"><span className="legend-circle" /> State</span>
              <span className="legend-chip"><span className="legend-circle active" /> Active</span>
              <span className="legend-chip"><span className="legend-circle final" /> Final</span>
              <span className="legend-chip"><span className="dot" style={{ background: "var(--accent)" }} /> Active transition</span>
            </>
          ) : null}
          {caption ? <span className="text-[11px]" style={{ color: "var(--muted)" }}>{caption}</span> : null}
        </div>
        <div className="graph-toolbar">
          <button className="icon-btn tiny" type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.6, +(value - 0.1).toFixed(2)))}><Minus /></button>
          <span className="text-[11px] w-10 text-center math" style={{ color: "var(--muted)" }}>{Math.round(zoom * 100)}%</span>
          <button className="icon-btn tiny" type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.6, +(value + 0.1).toFixed(2)))}><Plus /></button>
          <button className="icon-btn tiny" type="button" aria-label="Reset zoom" onClick={() => setZoom(1)}><RotateCcw /></button>
        </div>
      </div>
      <div className="graph-frame p-2" style={{ maxHeight: 560 }}>
        {nfa.states.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: "var(--muted)" }}>No states to display.</div>
        ) : (
          <svg
            width={layout.width * zoom}
            height={layout.height * zoom}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            role="img"
            aria-label="Nondeterministic finite automaton graph"
            style={{ display: "block", minWidth: "100%" }}
          >
            <defs>
              <marker id={`${markerId}-idle`} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="strokeWidth">
                <path d="M 0 0 L 9 4.5 L 0 9 z" style={{ fill: "var(--border-strong)" }} />
              </marker>
              <marker id={`${markerId}-active`} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="strokeWidth">
                <path d="M 0 0 L 9 4.5 L 0 9 z" style={{ fill: "var(--accent)" }} />
              </marker>
              <filter id={`${markerId}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {start ? (
              <g>
                <line
                  x1={Math.max(8, start.x - 82)} y1={start.y} x2={start.x - 33} y2={start.y}
                  style={{ stroke: "var(--border-strong)", strokeWidth: 2 }}
                  markerEnd={`url(#${markerId}-idle)`}
                />
                <text x={Math.max(8, start.x - 80)} y={start.y - 12} fontSize="10" style={{ fill: "var(--faint)" }}>start</text>
              </g>
            ) : null}
            {groups.map((group) => {
              const bidirectional = group.from !== group.to && directionKeys.has(`${group.to}>${group.from}`);
              const geometry = edgeGeometry(group, layout.positions, bidirectional);
              if (!geometry.path) return null;
              const active = group.ids.some((id) => activeEdgeSet.has(id));
              const text = group.labels.join(", ");
              const boxWidth = Math.max(22, text.length * 8 + 12);
              return (
                <g key={group.key}>
                  <path
                    d={geometry.path}
                    fill="none"
                    style={{
                      stroke: active ? "var(--accent)" : "var(--border-strong)",
                      strokeWidth: active ? 2.8 : 1.8,
                      filter: active ? `url(#${markerId}-glow)` : undefined,
                      transition: "stroke 0.25s ease, stroke-width 0.25s ease",
                    }}
                    markerEnd={`url(#${markerId}-${active ? "active" : "idle"})`}
                  />
                  <rect
                    x={geometry.label.x - boxWidth / 2} y={geometry.label.y - 11}
                    width={boxWidth} height={21} rx={6}
                    style={{ fill: "var(--surface)", stroke: active ? "var(--accent)" : "var(--border)" }}
                  />
                  <text
                    x={geometry.label.x} y={geometry.label.y + 4} textAnchor="middle"
                    fontSize="12" fontFamily="SFMono-Regular, Consolas, monospace" fontWeight="700"
                    style={{ fill: active ? "var(--accent)" : "var(--text)" }}
                  >
                    {text}
                  </text>
                </g>
              );
            })}
            {nfa.states.map((state) => {
              const position = layout.positions[state.id];
              if (!position) return null;
              const active = activeStateSet.has(state.id);
              const initial = state.id === nfa.startId;
              const final = nfa.finalIds.includes(state.id);
              const stroke = active ? "var(--accent)" : final ? "var(--success)" : initial ? "var(--blue)" : "var(--border-strong)";
              return (
                <g key={state.id} style={{ transition: "all 0.25s ease" }}>
                  {active ? (
                    <circle cx={position.x} cy={position.y} r="36" fill="none" style={{ stroke: "var(--accent)", strokeWidth: 2, opacity: 0.3 }} className="pulse-soft" />
                  ) : null}
                  <circle
                    cx={position.x} cy={position.y} r="30"
                    style={{
                      fill: active ? "var(--accent-soft)" : "var(--surface)",
                      stroke,
                      strokeWidth: active ? 3 : 2.2,
                      filter: active ? `url(#${markerId}-glow)` : undefined,
                    }}
                  />
                  {final ? <circle cx={position.x} cy={position.y} r="24" fill="none" style={{ stroke, strokeWidth: 1.6 }} /> : null}
                  <text
                    x={position.x} y={position.y + 5} textAnchor="middle" fontSize="14" fontWeight="750"
                    fontFamily="SFMono-Regular, Consolas, monospace"
                    style={{ fill: active ? "var(--accent)" : "var(--text)" }}
                  >
                    {state.label}
                  </text>
                  <text x={position.x} y={position.y + 48} textAnchor="middle" fontSize="9.5" style={{ fill: "var(--faint)" }}>
                    {initial && final ? "initial · final" : initial ? "initial" : final ? "final" : state.kind === "intermediate" ? "auxiliary" : "variable"}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
