'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import type { Course, LearnerState, Lesson, Module } from '@/lib/models';
import { Mastery } from '@/lib/mastery';

const NODE_W = 160;
const NODE_H = 52;
const H_GAP = 60;
const V_GAP = 36;
const MODULE_PAD = 24;

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  moduleIdx: number;
  mastery: 'untouched' | 'weak' | 'ok' | 'solid';
  skippable: boolean;
  status: 'stub' | 'ready';
}

interface GraphEdge {
  from: string;
  to: string;
}

interface RoadmapGraphProps {
  course: Course;
  learner: LearnerState;
  selectedID?: string;
  onSelect: (lessonID: string) => void;
}

export function RoadmapGraph({ course, learner, selectedID, onSelect }: RoadmapGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState('0 0 800 600');
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, px: 0, py: 0 });

  const { nodes, edges, totalW, totalH } = useMemo(() => {
    return layoutGraph(course, learner);
  }, [course, learner]);

  useEffect(() => {
    const updateViewBox = () => {
      if (svgRef.current) {
        const { width, height } = svgRef.current.getBoundingClientRect();
        setViewBox(`0 0 ${width} ${height}`);
      }
    };
    updateViewBox();
    window.addEventListener('resize', updateViewBox);
    return () => window.removeEventListener('resize', updateViewBox);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('.graph-node')) return;
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: dragStart.px + (e.clientX - dragStart.x), y: dragStart.py + (e.clientY - dragStart.y) });
  };
  const handleMouseUp = () => setDragging(false);

  return (
    <svg
      ref={svgRef}
      className="roadmap-svg"
      viewBox={viewBox}
      style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="rgba(100,116,139,0.5)" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g transform={`translate(${pan.x}, ${pan.y})`}>
        {/* Module labels */}
        {course.modules.map((mod, i) => {
          const modNodes = nodes.filter(n => n.moduleIdx === i);
          if (modNodes.length === 0) return null;
          const minX = Math.min(...modNodes.map(n => n.x));
          const maxX = Math.max(...modNodes.map(n => n.x)) + NODE_W;
          const minY = Math.min(...modNodes.map(n => n.y));
          return (
            <g key={mod.id}>
              <rect
                x={minX - MODULE_PAD}
                y={minY - 36}
                width={maxX - minX + MODULE_PAD * 2}
                height={Math.max(...modNodes.map(n => n.y)) + NODE_H - minY + 36 + MODULE_PAD}
                rx={16}
                fill="rgba(255,255,255,0.015)"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth={1}
              />
              <text
                x={minX - MODULE_PAD + 12}
                y={minY - 14}
                fontSize={11}
                fontWeight={600}
                fill="rgba(100,116,139,0.8)"
                fontFamily="Inter, sans-serif"
                letterSpacing="0.06em"
                style={{ textTransform: 'uppercase' }}
              >
                {mod.title}
              </text>
            </g>
          );
        })}

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = nodes.find(n => n.id === edge.from);
          const to = nodes.find(n => n.id === edge.to);
          if (!from || !to) return null;
          const x1 = from.x + NODE_W / 2;
          const y1 = from.y + NODE_H;
          const x2 = to.x + NODE_W / 2;
          const y2 = to.y;
          const cy = (y1 + y2) / 2;
          return (
            <path
              key={i}
              d={`M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}`}
              fill="none"
              stroke="rgba(100,116,139,0.25)"
              strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const isSelected = node.id === selectedID;
          const masteryClass = `mastery-${node.mastery}`;
          return (
            <g
              key={node.id}
              className="graph-node"
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => onSelect(node.id)}
              style={{ animation: 'springIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                className={`node-rect ${masteryClass} ${isSelected ? 'selected' : ''} ${node.skippable ? 'skippable' : ''}`}
                filter={isSelected ? 'url(#glow)' : undefined}
              />
              {/* Status dot */}
              <circle
                cx={NODE_W - 12}
                cy={12}
                r={4}
                fill={node.status === 'ready' ? 'var(--mastery-solid)' : 'var(--bg-4)'}
                stroke="var(--border)"
                strokeWidth={1}
              />
              {/* Label */}
              <text
                x={NODE_W / 2}
                y={NODE_H / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fontWeight={500}
                fill={isSelected ? 'var(--accent)' : 'var(--text)'}
                fontFamily="Inter, sans-serif"
              >
                {truncate(node.label, 20)}
              </text>
              {node.skippable && (
                <text x={NODE_W / 2} y={NODE_H - 8} textAnchor="middle" fontSize={8} fill="var(--text-3)" fontFamily="Inter, sans-serif">
                  skip ✓
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function layoutGraph(course: Course, learner: LearnerState) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  let globalY = 0;

  course.modules.forEach((mod, mIdx) => {
    const colCount = Math.min(3, mod.lessonIDs.length);
    mod.lessonIDs.forEach((lid, lIdx) => {
      const lesson = course.lessons[lid];
      if (!lesson) return;

      const col = lIdx % colCount;
      const row = Math.floor(lIdx / colCount);
      const x = col * (NODE_W + H_GAP);
      const y = globalY + row * (NODE_H + V_GAP);

      // Compute mastery for the lesson's concepts
      const conceptMasteries = lesson.conceptIDs.map(cid => learner.mastery[cid]?.probability ?? 0);
      const avgMastery = conceptMasteries.length > 0
        ? conceptMasteries.reduce((a, b) => a + b, 0) / conceptMasteries.length
        : 0;

      nodes.push({
        id: lid,
        label: lesson.title,
        x,
        y,
        moduleIdx: mIdx,
        mastery: Mastery.colorClass(avgMastery > 0 ? { probability: avgMastery, attempts: 1, misconceptions: {} } : undefined),
        skippable: !!lesson.skippable,
        status: lesson.status,
      });

      // Add edge from previous lesson in same module
      if (lIdx > 0) {
        edges.push({ from: mod.lessonIDs[lIdx - 1], to: lid });
      }
    });

    const rows = Math.ceil(mod.lessonIDs.length / Math.min(3, mod.lessonIDs.length || 1));
    globalY += rows * (NODE_H + V_GAP) + 80;
  });

  const totalW = 3 * NODE_W + 2 * H_GAP + MODULE_PAD * 2 + 80;
  const totalH = globalY;
  return { nodes, edges, totalW, totalH };
}
