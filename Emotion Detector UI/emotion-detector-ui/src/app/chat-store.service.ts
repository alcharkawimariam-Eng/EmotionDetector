import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Conversation, ChatMessage } from './types';

@Injectable({ providedIn: 'root' })
export class ChatStore {
    private _convs = new BehaviorSubject<Conversation[]>(this.load());
    $convs = this._convs.asObservable();

    private persist() {
        localStorage.setItem('conversations', JSON.stringify(this._convs.value));
    }

    private load(): Conversation[] {
        try {
            return JSON.parse(localStorage.getItem('conversations') || '[]');
        } catch { return []; }
    }

    private update(fn: (arr: Conversation[]) => Conversation[]) {
        const next = fn([...this._convs.value]);
        this._convs.next(next);
        this.persist();
    }

    createConversation(title: string): Conversation {
        const conv: Conversation = {
            id: crypto.randomUUID?.() || String(Date.now()),
            title,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: []
        };
        this.update(list => [conv, ...list]);
        return conv;
    }

    addMessage(convId: string, msg: ChatMessage) {
        this.update(list => {
            const c = list.find(x => x.id === convId);
            if (!c) return list;
            c.messages.push(msg);
            c.updatedAt = Date.now();
            return list;
        });
    }

    rename(convId: string, title: string) {
        this.update(list => {
            const c = list.find(x => x.id === convId);
            if (c) c.title = title;
            return list;
        });
    }

    setCollapsed(convId: string, collapsed: boolean) {
        this.update(list => {
            const c = list.find(x => x.id === convId);
            if (c) c.collapsed = collapsed;
            return list;
        });
    }

    delete(convId: string) {
        this.update(list => list.filter(x => x.id !== convId));
    }
}
