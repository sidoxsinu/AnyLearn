'use client';

import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import type { Block } from '@/lib/models';

interface Props {
  block: Block;
  onFlag?: (blockID: string) => void;
}

export function BlockRenderer({ block, onFlag }: Props) {
  return (
    <div className="block animate-fadein">
      {block.type === 'markdown' && <MarkdownBlock block={block} onFlag={onFlag} />}
      {block.type === 'workedExample' && <WorkedExampleBlock block={block} />}
      {block.type === 'callout' && <CalloutBlock block={block} />}
      {block.type === 'checkpoint' && <CheckpointBlock block={block} />}
      {block.type === 'diagram' && <DiagramBlock block={block} />}
    </div>
  );
}

function MarkdownBlock({ block, onFlag }: { block: Extract<Block, { type: 'markdown' }>; onFlag?: (id: string) => void }) {
  return (
    <div className="block-markdown" style={{ position: 'relative' }}>
      {onFlag && (
        <button
          onClick={() => onFlag(block.id)}
          className="btn-ghost btn-sm"
          title="Flag this block"
          style={{ position: 'absolute', right: 0, top: 0, opacity: 0.4, fontSize: 14 }}
        >
          ⚑
        </button>
      )}
      <ReactMarkdown>{block.markdown}</ReactMarkdown>
    </div>
  );
}

function WorkedExampleBlock({ block }: { block: Extract<Block, { type: 'workedExample' }> }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="block-worked-example">
      <div className="worked-example-header" onClick={() => setOpen(!open)}>
        <span style={{ fontSize: 16 }}>⚙</span>
        <span style={{ flex: 1 }}>{block.title}</span>
        <span className="text-dim text-sm">{open ? '▲' : '▼'}</span>
      </div>
      {open && block.steps.map((step, i) => (
        <div key={i} className="worked-step">
          <div>
            <div className="worked-step-num">Step {i + 1}</div>
            <div className="text-base">{step.text}</div>
          </div>
          <div className="worked-step-why text-sm text-muted">
            <div className="worked-step-num" style={{ color: 'var(--text-3)' }}>Why</div>
            {step.why}
          </div>
        </div>
      ))}
    </div>
  );
}

const calloutEmoji: Record<string, string> = {
  mistake: '⚠',
  tip: '💡',
  warning: '🔔',
};

function CalloutBlock({ block }: { block: Extract<Block, { type: 'callout' }> }) {
  return (
    <div className={`block-callout ${block.kind}`}>
      <span className="callout-icon">{calloutEmoji[block.kind] ?? '📌'}</span>
      <div className="block-markdown text-sm">
        <ReactMarkdown>{block.markdown}</ReactMarkdown>
      </div>
    </div>
  );
}

function CheckpointBlock({ block }: { block: Extract<Block, { type: 'checkpoint' }> }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="block-checkpoint">
      <div className="checkpoint-question">✏ {block.question}</div>
      {!revealed ? (
        <button className="checkpoint-reveal-btn" onClick={() => setRevealed(true)}>
          Reveal answer
        </button>
      ) : (
        <div className="checkpoint-answer">{block.answer}</div>
      )}
      {block.hint && !revealed && (
        <div className="text-xs text-dim" style={{ marginTop: 8 }}>
          Hint: {block.hint}
        </div>
      )}
    </div>
  );
}

function DiagramBlock({ block }: { block: Extract<Block, { type: 'diagram' }> }) {
  // Render mermaid diagram as pre-formatted text for simplicity
  // A real implementation would use the mermaid.js library to render SVGs
  return (
    <div className="card-sm">
      <div className="text-xs text-muted" style={{ marginBottom: 8 }}>📊 Diagram</div>
      <pre className="font-mono text-sm text-muted" style={{
        overflowX: 'auto',
        background: 'var(--bg-4)',
        padding: 12,
        borderRadius: 8,
        fontSize: 12,
      }}>
        {block.mermaid}
      </pre>
      {block.caption && (
        <div className="text-xs text-dim" style={{ marginTop: 8, textAlign: 'center' }}>
          {block.caption}
        </div>
      )}
    </div>
  );
}
