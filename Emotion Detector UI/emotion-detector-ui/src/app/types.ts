export type Role = 'user' | 'assistant' | 'system';

export interface Attachment {
    name: string;
    type: 'pdf' | 'csv' | 'xlsx' | 'xls' | 'other';
    size: number;
    result?: any;
}

export type ProbsMap = Record<string, number>;

export interface AssistMeta {
    mood?: string;
    score?: number;      // 0..1
    probs?: ProbsMap;
    moodClass?: string;
    musicLinks?: string[];  // clickable YouTube links
}

export interface ChatMessage {
    id: string;
    role: Role;
    text?: string;
    time: number;       // Date.now()
    attachments?: Attachment[];
    meta?: AssistMeta;
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
    collapsed?: boolean;
}
