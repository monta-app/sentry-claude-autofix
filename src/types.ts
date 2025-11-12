export interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  permalink: string;
  shortId: string;
  level: string;
  status: string;
  firstSeen: string;
  lastSeen: string;
  count: string;
  userCount: number;
  metadata: {
    type?: string;
    value?: string;
    filename?: string;
    function?: string;
  };
  project: {
    slug: string;
    name: string;
  };
}

export interface SentryEvent {
  id: string;
  eventID: string;
  groupID: string;
  message: string;
  title: string;
  tags: Array<{ key: string; value: string }>;
  dateCreated: string;
  platform: string;
  entries: SentryEntry[];
  context: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
}

export interface SentryEntry {
  type: string;
  data: any;
}

export interface StackFrame {
  filename: string;
  function: string;
  module?: string;
  lineNo?: number;
  colNo?: number;
  absPath?: string;
  context?: Array<[number, string]>;
  vars?: Record<string, any>;
  inApp?: boolean;
}

export interface StackTrace {
  frames: StackFrame[];
}

export interface IssueContext {
  issue: SentryIssue;
  latestEvent: SentryEvent;
  stackTrace?: StackTrace;
  affectedFiles: string[];
  errorMessage: string;
  errorType: string;
}

export interface FixProposal {
  issueId: string;
  analysis: string;
  proposedChanges: Array<{
    file: string;
    description: string;
    code?: string;
  }>;
  confidence: 'high' | 'medium' | 'low';
}
