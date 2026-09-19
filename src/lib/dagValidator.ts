// AnyLearn — DAG Validator (ported from DagValidator.swift)
import type { Concept, ID } from './models';

export function validateDAG(concepts: Concept[]): boolean {
  const ids = new Set(concepts.map(c => c.id));
  // Build adjacency list
  const adj: Record<ID, ID[]> = {};
  for (const c of concepts) {
    adj[c.id] = c.prereqIDs.filter(id => ids.has(id));
  }

  // Kahn's algorithm for topological sort + cycle detection
  const inDegree: Record<ID, number> = {};
  for (const id of ids) inDegree[id] = 0;
  for (const [, prereqs] of Object.entries(adj)) {
    for (const dep of prereqs) {
      inDegree[dep] = (inDegree[dep] ?? 0) + 1;
    }
  }

  // Wait — we want dependents of concepts, so let's do it correctly:
  // edge: prereq → concept (prereq must come before concept)
  const inDeg: Record<ID, number> = {};
  const dependents: Record<ID, ID[]> = {};
  for (const id of ids) { inDeg[id] = 0; dependents[id] = []; }

  for (const c of concepts) {
    for (const prereqID of c.prereqIDs) {
      if (ids.has(prereqID)) {
        dependents[prereqID].push(c.id);
        inDeg[c.id] = (inDeg[c.id] ?? 0) + 1;
      }
    }
  }

  const queue: ID[] = [];
  for (const [id, deg] of Object.entries(inDeg)) {
    if (deg === 0) queue.push(id);
  }

  let visited = 0;
  while (queue.length > 0) {
    const node = queue.shift()!;
    visited++;
    for (const dep of dependents[node]) {
      inDeg[dep]--;
      if (inDeg[dep] === 0) queue.push(dep);
    }
  }

  return visited === concepts.length; // true = no cycle
}
