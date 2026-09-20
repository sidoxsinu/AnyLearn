'use client';

import React, { useMemo, useRef, useState } from 'react';
import type { Course, LearnerState } from '@/lib/models';
import { Mastery } from '@/lib/mastery';

const NODE_W = 270;
const NODE_H = 130;
const H_GAP = 60;
const V_GAP = 50;
const MODULE_PAD = 24;

interface GraphNode {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  moduleIdx: number;
  mastery: 'untouched' | 'weak' | 'ok' | 'solid';
  skippable: boolean;
  status: 'stub' | 'ready';
  isCompleted: boolean;
  isActive: boolean;
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
  const [pan, setPan] = useState({ x: 32, y: 32 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, px: 0, py: 0 });

  const { nodes, edges } = useMemo(() => {
    return layoutGraph(course, learner);
  }, [course, learner]);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as SVGElement).closest('.graph-node')) return;
    const touch = e.touches[0];
    setDragging(true);
    setDragStart({ x: touch.clientX, y: touch.clientY, px: pan.x, py: pan.y });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const touch = e.touches[0];
    setPan({ x: dragStart.px + (touch.clientX - dragStart.x), y: dragStart.py + (touch.clientY - dragStart.y) });
  };
  const handleTouchEnd = () => setDragging(false);

  return (
    <svg
      ref={svgRef}
      className="roadmap-svg"
      style={{
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        width: '100%',
        height: '100%',
        background: 'transparent',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <defs>
        {/* Soft mint green arrowhead for connecting dotted paths */}
        <marker id="arrowhead" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
          <polygon points="0 0, 9 3.5, 0 7" fill="#8CE39B" />
        </marker>

        {/* Soft card shadow */}
        <filter id="cardShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.05" />
        </filter>

        {/* Floating featured card shadow */}
        <filter id="featuredShadow" x="-15%" y="-15%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodOpacity="0.12" />
        </filter>
      </defs>

      <g transform={`translate(${pan.x}, ${pan.y})`}>
        {/* Module background bounds & title headers */}
        {course.modules.map((mod, i) => {
          const modNodes = nodes.filter(n => n.moduleIdx === i);
          if (modNodes.length === 0) return null;
          const minX = Math.min(...modNodes.map(n => n.x));
          const maxX = Math.max(...modNodes.map(n => n.x)) + NODE_W;
          const minY = Math.min(...modNodes.map(n => n.y));
          const maxY = Math.max(...modNodes.map(n => n.y)) + NODE_H;

          return (
            <g key={mod.id}>
              <rect
                x={minX - MODULE_PAD}
                y={minY - 40}
                width={maxX - minX + MODULE_PAD * 2}
                height={maxY - minY + 40 + MODULE_PAD}
                rx={24}
                fill="rgba(240, 242, 245, 0.4)"
                stroke="rgba(0, 0, 0, 0.04)"
                strokeWidth={1}
              />
              <text
                x={minX - MODULE_PAD + 16}
                y={minY - 16}
                fontSize={12}
                fontWeight={800}
                fill="#4B5563"
                fontFamily="inherit"
                letterSpacing="0.06em"
                style={{ textTransform: 'uppercase' }}
              >
                {mod.title}
              </text>
            </g>
          );
        })}

        {/* Curvy Dotted Connecting Edges matching the design screenshot */}
        {edges.map((edge, i) => {
          const from = nodes.find(n => n.id === edge.from);
          const to = nodes.find(n => n.id === edge.to);
          if (!from || !to) return null;

          const x1 = from.x + NODE_W;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x;
          const y2 = to.y + NODE_H / 2;
          const cx1 = x1 + (x2 - x1) * 0.5;
          const cy1 = y1;
          const cx2 = x1 + (x2 - x1) * 0.5;
          const cy2 = y2;

          return (
            <path
              key={i}
              d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
              fill="none"
              stroke="#8CE39B"
              strokeWidth={2.5}
              strokeDasharray="4 6"
              strokeLinecap="round"
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Node Cards matching the screenshot */}
        {nodes.map(node => {
          const isSelected = node.id === selectedID;
          const masteryClass = `mastery-${node.mastery}`;

          // If this is the active/featured lesson (e.g. 2nd lesson or currently selected), render the tilted signature lavender card!
          if (node.isActive) {
            return (
              <g
                key={node.id}
                className={`graph-node ${masteryClass} ${isSelected ? 'selected' : ''}`}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onSelect(node.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Tilted featured card group */}
                <g transform={`rotate(-2.5, ${NODE_W / 2}, ${NODE_H / 2})`}>
                  {/* Lavender/pink background card with rounded-2xl */}
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={22}
                    fill="#F1D3FA"
                    stroke="#E2B6F1"
                    strokeWidth={1.5}
                    filter="url(#featuredShadow)"
                    className={`node-rect ${masteryClass} ${isSelected ? 'selected' : ''} ${node.skippable ? 'skippable' : ''}`}
                  />

                  {/* Top Floating Music Notes */}
                  <text x={NODE_W - 68} y={32} fontSize={14} fill="#8A3FA8">🎵</text>
                  <text x={NODE_W - 28} y={56} fontSize={12} fill="#8A3FA8">🎶</text>

                  {/* Play Button circle in white */}
                  <circle cx={NODE_W - 44} cy={42} r={18} fill="#FFFFFF" filter="url(#cardShadow)" />
                  <polygon points={`${NODE_W - 41},42 ${NODE_W - 47},37 ${NODE_W - 47},47`} fill="#0F1117" />

                  {/* Title */}
                  <text
                    x={20}
                    y={34}
                    fontSize={15}
                    fontWeight={800}
                    fill="#0F1117"
                    fontFamily="inherit"
                  >
                    {truncate(node.label, 20)}
                  </text>

                  {/* Subtitle / Description */}
                  <text
                    x={20}
                    y={54}
                    fontSize={11}
                    fontWeight={500}
                    fill="#4A1860"
                    fontFamily="inherit"
                    opacity={0.85}
                  >
                    {truncate(node.description, 32)}
                  </text>

                  {/* Bottom Pill: Watching 00:30 */}
                  <g transform="translate(18, 86)">
                    <rect width={110} height={26} rx={13} fill="#FFFFFF" />
                    <text x={10} y={17} fontSize={10} fontWeight={700} fill="#0F1117" fontFamily="inherit">
                      ⏱️ Watching 00:30
                    </text>
                  </g>

                  {/* Overlapping Avatar Group */}
                  <g transform={`translate(${NODE_W - 74}, 88)`}>
                    <circle cx={10} cy={12} r={11} fill="#FED7AA" stroke="#F1D3FA" strokeWidth={2} />
                    <text x={4} y={16} fontSize={11}>👦</text>
                    <circle cx={26} cy={12} r={11} fill="#FBCFE8" stroke="#F1D3FA" strokeWidth={2} />
                    <text x={20} y={16} fontSize={11}>👧</text>
                    <circle cx={42} cy={12} r={11} fill="#BAE6FD" stroke="#F1D3FA" strokeWidth={2} />
                    <text x={36} y={16} fontSize={11}>🧑</text>
                  </g>

                  {node.skippable && (
                    <text x={NODE_W / 2} y={NODE_H - 10} textAnchor="middle" fontSize={9} fontWeight={600} fill="#6B21A8">
                      skip ✓
                    </text>
                  )}
                </g>
              </g>
            );
          }

          // Completed / Regular White Card
          return (
            <g
              key={node.id}
              className={`graph-node ${masteryClass} ${isSelected ? 'selected' : ''}`}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => onSelect(node.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* White background card with soft shadow */}
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={22}
                fill="#FFFFFF"
                stroke={isSelected ? '#0F1117' : 'rgba(0, 0, 0, 0.07)'}
                strokeWidth={isSelected ? 2 : 1}
                filter="url(#cardShadow)"
                className={`node-rect ${masteryClass} ${isSelected ? 'selected' : ''} ${node.skippable ? 'skippable' : ''}`}
              />

              {/* Top Right Badge / Icon */}
              {node.isCompleted ? (
                <g transform={`translate(${NODE_W - 38}, 16)`}>
                  <circle cx={12} cy={12} r={12} fill="#D4F6D8" />
                  <text x={7} y={16} fontSize={12} fontWeight={700} fill="#166534">+</text>
                </g>
              ) : (
                <g transform={`translate(${NODE_W - 38}, 16)`}>
                  <circle cx={12} cy={12} r={12} fill="#F3F4F6" />
                  <text x={6} y={16} fontSize={11}>🔒</text>
                </g>
              )}

              {/* Title */}
              <text
                x={20}
                y={36}
                fontSize={15}
                fontWeight={800}
                fill="#0F1117"
                fontFamily="inherit"
              >
                {truncate(node.label, 20)}
              </text>

              {/* Subtitle / Description */}
              <text
                x={20}
                y={56}
                fontSize={11}
                fontWeight={500}
                fill="#6B7280"
                fontFamily="inherit"
              >
                {truncate(node.description, 34)}
              </text>

              {/* Bottom Row */}
              <g transform="translate(18, 86)">
                {node.isCompleted ? (
                  /* Completed status pill */
                  <g>
                    <rect width={94} height={24} rx={12} fill="#D4F6D8" />
                    <text x={8} y={16} fontSize={10} fontWeight={800} fill="#166534" fontFamily="inherit">
                      Completed 🌾
                    </text>
                  </g>
                ) : (
                  /* Upcoming status pill */
                  <g>
                    <rect width={88} height={24} rx={12} fill="#F3F4F6" />
                    <text x={8} y={16} fontSize={10} fontWeight={700} fill="#6B7280" fontFamily="inherit">
                      Upcoming ⏱️
                    </text>
                  </g>
                )}
              </g>

              {/* Action buttons on bottom right */}
              {node.isCompleted ? (
                <g transform={`translate(${NODE_W - 84}, 86)`}>
                  {/* ... button */}
                  <circle cx={12} cy={12} r={11} fill="#F3F4F6" />
                  <text x={7} y={14} fontSize={10} fill="#4B5563">…</text>
                  {/* ✕ button */}
                  <circle cx={36} cy={12} r={11} fill="#F3F4F6" />
                  <text x={32} y={15} fontSize={10} fill="#4B5563">✕</text>
                  {/* ✓ button (black circle with white check) */}
                  <circle cx={60} cy={12} r={11} fill="#0F1117" />
                  <text x={56} y={15} fontSize={10} fontWeight={800} fill="#FFFFFF">✓</text>
                </g>
              ) : (
                <g transform={`translate(${NODE_W - 36}, 86)`}>
                  <circle cx={12} cy={12} r={11} fill="#F3F4F6" />
                  <text x={7} y={14} fontSize={10} fill="#4B5563">…</text>
                </g>
              )}

              {node.skippable && (
                <text x={NODE_W / 2} y={NODE_H - 8} textAnchor="middle" fontSize={9} fontWeight={600} fill="#6B7280">
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

  const completedSet = new Set(learner.completedLessonIDs || []);
  let globalY = 20;

  course.modules.forEach((mod, mIdx) => {
    const colCount = Math.min(2, mod.lessonIDs.length);
    mod.lessonIDs.forEach((lid, lIdx) => {
      const lesson = course.lessons[lid];
      if (!lesson) return;

      const col = lIdx % colCount;
      const row = Math.floor(lIdx / colCount);
      const x = col * (NODE_W + H_GAP) + (mIdx % 2 === 1 ? 40 : 0);
      const y = globalY + row * (NODE_H + V_GAP);

      // Compute mastery
      const conceptMasteries = lesson.conceptIDs.map(cid => learner.mastery[cid]?.probability ?? 0);
      const avgMastery = conceptMasteries.length > 0
        ? conceptMasteries.reduce((a, b) => a + b, 0) / conceptMasteries.length
        : 0;

      const isCompleted = completedSet.has(lid);
      // The featured active card is the first uncompleted lesson or 2nd lesson in list
      const isActive = !isCompleted && lIdx === 1;

      nodes.push({
        id: lid,
        label: lesson.title,
        description: lesson.objectives?.[0] || 'Learn key fundamentals and practical applications.',
        x,
        y,
        moduleIdx: mIdx,
        mastery: Mastery.colorClass(avgMastery > 0 ? { probability: avgMastery, attempts: 1, misconceptions: {} } : undefined),
        skippable: !!lesson.skippable,
        status: lesson.status,
        isCompleted,
        isActive,
      });

      // Add connecting edge from previous lesson in module
      if (lIdx > 0) {
        edges.push({ from: mod.lessonIDs[lIdx - 1], to: lid });
      }
    });

    const rows = Math.ceil(mod.lessonIDs.length / colCount || 1);
    globalY += rows * (NODE_H + V_GAP) + 60;
  });

  const totalW = 2 * NODE_W + H_GAP + MODULE_PAD * 2 + 100;
  const totalH = globalY;
  return { nodes, edges, totalW, totalH };
}

export default RoadmapGraph;
