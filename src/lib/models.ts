// AnyLearn — Core Data Models (ported from Models.swift)

export type ID = string;

export interface GoalProfile {
  topic: string;
  endArtifact: string;
  level: string;
  hoursPerWeek: number;
}

export interface Concept {
  id: ID;
  name: string;
  summary: string;
  prereqIDs: ID[];
}

export interface Module {
  id: ID;
  title: string;
  outcome: string;
  lessonIDs: ID[];
}

export type LessonStatus = 'stub' | 'ready';

export interface Skippable {
  reason: string;
}

export type Block =
  | { type: 'markdown'; id: ID; markdown: string }
  | { type: 'workedExample'; id: ID; title: string; steps: WorkedStep[] }
  | { type: 'callout'; id: ID; kind: CalloutKind; markdown: string }
  | { type: 'checkpoint'; id: ID; conceptID: ID; question: string; answer: string; hint?: string }
  | { type: 'diagram'; id: ID; mermaid: string; caption: string };

export interface WorkedStep {
  text: string;
  why: string;
}

export type CalloutKind = 'mistake' | 'tip' | 'warning';

export interface TaskCard {
  title: string;
  instructions: string[];
  successCriteria: string[];
}

export interface Source {
  id: ID;
  title: string;
  url: string;
}

export interface Resource {
  id: ID;
  kind: 'video' | 'article' | 'docs';
  title: string;
  url: string;
  creator: string;
  durationMinutes?: number;
  why: string;
  verifiedAt: string;
}

export type Confidence = 'high' | 'medium' | 'low';

export interface Lesson {
  id: ID;
  moduleID: ID;
  title: string;
  conceptIDs: ID[];
  objectives: string[];
  status: LessonStatus;
  skippable?: Skippable;
  blocks: Block[];
  task?: TaskCard;
  resourceQueries: string[];
  resources: Resource[];
  sources: Source[];
  unsourced: boolean;
  confidence: Confidence;
  version: number;
}

export interface Question {
  id: ID;
  conceptID: ID;
  difficulty: 1 | 2 | 3;
  prompt: string;
  options: QuestionOption[];
  correctOptionID: ID;
  explanation: string;
  refBlockID?: ID;
}

export interface QuestionOption {
  id: ID;
  text: string;
  misconception?: string;
}

export interface Capstone {
  title: string;
  description: string;
  successCriteria: string[];
}

export interface Course {
  id: ID;
  goal: string;
  profile: GoalProfile;
  version: number;
  concepts: Concept[];
  modules: Module[];
  lessons: Record<ID, Lesson>;
  quizzes: Record<ID, Question[]>;
  capstone: Capstone;
  changelog: ChangeEntry[];
}

export interface MasteryRecord {
  probability: number;
  attempts: number;
  misconceptions: Record<string, number>;
}

export interface Attempt {
  id: ID;
  questionID: ID;
  conceptID: ID;
  selectedOptionID: ID;
  score: number;
  occurredAt: string;
}

export interface LearnerState {
  mastery: Record<ID, MasteryRecord>;
  completedLessonIDs: ID[];
  attempts: Attempt[];
}

export type ChangeSource = 'adapt' | 'report' | 'propagate';

export interface ChangeEntry {
  id: ID;
  timestamp: string;
  source: ChangeSource;
  summary: string;
  reason: string;
  ops: PatchOp[];
  inverseOps: PatchOp[];
  verify?: VerifyResult;
  reportText?: string;
  undone: boolean;
}

export type PatchOp =
  | { type: 'insertLesson'; afterLessonID: ID; lesson: Lesson; reason: string }
  | { type: 'addConcept'; concept: Concept; reason: string }
  | { type: 'replaceBlock'; lessonID: ID; blockID: ID; block: Block; reason: string }
  | { type: 'insertBlock'; lessonID: ID; afterBlockID: ID | null; block: Block; reason: string }
  | { type: 'addPractice'; lessonID: ID; task: TaskCard; reason: string }
  | { type: 'markSkippable'; lessonID: ID; reason: string }
  | { type: 'reorder'; moduleID: ID; lessonIDs: ID[]; reason: string }
  | { type: 'replaceQuestion'; lessonID: ID; questionID: ID; question: Question; reason: string }
  | { type: 'refreshResources'; lessonID: ID; queries: string[]; reason: string }
  | { type: 'deleteLesson'; lessonID: ID; reason: string };

export interface RoadmapPatch {
  summary: string;
  ops: PatchOp[];
}

export interface Diagnosis {
  rootCause: string;
  category: string;
  confidence: number;
}

export type FixScope = 'block' | 'lesson' | 'roadmap';

export interface PropagationHint {
  conceptID: ID;
  why: string;
}

export interface FixPlan {
  diagnosis: Diagnosis;
  scope: FixScope;
  learnerFacingMessage: string;
  patch: RoadmapPatch;
  propagationHints: PropagationHint[];
}

export interface VerifyResult {
  verdict: 'pass' | 'fail';
  issues: VerifyIssue[];
  factualClaimsChecked: string[];
}

export interface VerifyIssue {
  severity: 'high' | 'low';
  detail: string;
}

export function defaultLearnerState(): LearnerState {
  return { mastery: {}, completedLessonIDs: [], attempts: [] };
}
