import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from './api.service';
import { ChatStore } from './chat-store.service';
import { Conversation, ChatMessage, Attachment, AssistMeta, ProbsMap } from './types';
import * as XLSX from 'xlsx';

type ThemeMode = 'light' | 'dark';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // THEME
  mode: ThemeMode = 'light';
  accent = '#6f7cff';

  // UI
  sidebarOpen = true;
  isDesktop = window.innerWidth >= 768;

  // Chat
  conversations: Conversation[] = [];
  activeConv: Conversation | null = null;
  loading = false;
  error: string | null = null;

  form = this.fb.group({
    text: ['', [Validators.maxLength(1000)]]
  });

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private store: ChatStore
  ) { }

  ngOnInit(): void {
    // restore UI prefs
    const savedMode = (localStorage.getItem('mode') as ThemeMode) || 'light';
    const savedAccent = localStorage.getItem('accent') || this.accent;
    const savedSidebar = localStorage.getItem('sidebarOpen');
    this.mode = savedMode;
    this.accent = savedAccent;
    this.sidebarOpen = savedSidebar === null ? true : savedSidebar === 'true';

    this.applyTheme();
    this.applyAccent();
    this.isDesktop = window.innerWidth >= 768;

    // restore chats
    this.store.$convs.subscribe(cs => {
      this.conversations = cs;
      if (!this.activeConv && cs.length) this.activeConv = cs[0];
    });
    if (!this.conversations.length) {
      this.activeConv = this.store.createConversation('New chat');
    }
  }

  @HostListener('window:resize')
  onResize() { this.isDesktop = window.innerWidth >= 768; }

  /* ===== theme helpers ===== */
  private hexToRgb(hex: string) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)!;
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }
  private applyTheme() {
    document.documentElement.setAttribute('data-bs-theme', this.mode);
  }
  private applyAccent() {
    const root = document.documentElement.style;
    const { r, g, b } = this.hexToRgb(this.accent || '#6f7cff');
    root.setProperty('--bs-primary', this.accent);
    root.setProperty('--bs-primary-rgb', `${r}, ${g}, ${b}`);
    root.setProperty('--bs-link-color', this.accent);
    root.setProperty('--bs-link-hover-color', this.accent);
    root.setProperty('--bubble-user', this.accent);
  }
  toggleTheme() {
    this.mode = this.mode === 'light' ? 'dark' : 'light';
    this.applyTheme(); localStorage.setItem('mode', this.mode);
  }
  onAccentPick(ev: Event) {
    this.accent = (ev.target as HTMLInputElement).value || '#6f7cff';
    this.applyAccent(); localStorage.setItem('accent', this.accent);
  }
  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    localStorage.setItem('sidebarOpen', String(this.sidebarOpen));
  }

  /* ===== chat helpers ===== */
  probEntries(probs: ProbsMap | undefined) {
    if (!probs) return [];
    return Object.entries(probs)
      .map(([key, value]) => ({ key, value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }
  newChat() { this.activeConv = this.store.createConversation('New chat'); }
  select(conv: Conversation) { this.activeConv = conv; }
  delete(conv: Conversation, e: MouseEvent) {
    e.stopPropagation();
    if (this.activeConv?.id === conv.id) this.activeConv = null;
    this.store.delete(conv.id);
    if (!this.activeConv && this.conversations.length) this.activeConv = this.conversations[0] || null;
  }
  rename(conv: Conversation, e: MouseEvent) {
    e.stopPropagation();
    const name = prompt('New title:', conv.title);
    if (name && name.trim()) this.store.rename(conv.id, name.trim());
  }
  collapse(conv: Conversation, e: MouseEvent) {
    e.stopPropagation();
    this.store.setCollapsed(conv.id, !conv.collapsed);
  }

  /* provide always-defined array for template (fixes strict typing) */
  links(m: ChatMessage): string[] {
    return m.meta?.musicLinks ?? [];
  }

  /* ===== send text ===== */
  async sendText() {
    if (!this.activeConv) return;
    this.error = null;
    const text = (this.form.value.text || '').trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID?.() || String(Date.now()),
      role: 'user',
      text,
      time: Date.now()
    };
    this.store.addMessage(this.activeConv.id, userMsg);
    this.form.patchValue({ text: '' });
    this.loading = true;

    // If you want to pass a custom suggestion prompt, add it here (3rd arg).
    const customPrompt = undefined; // or a string you build in UI

    this.api.assist(text, this.activeConv.id, customPrompt).subscribe({
      next: (res) => {
        const probs: ProbsMap | undefined = res?.probs as ProbsMap | undefined;
        const mood: string | undefined = res?.mood;
        const meta: AssistMeta = {
          mood,
          score: res?.score,
          probs,
          moodClass: mood ? `mood-${mood}` : undefined,
          musicLinks: Array.isArray(res?.music_links) ? res.music_links : []
        };
        const asst: ChatMessage = {
          id: crypto.randomUUID?.() || String(Date.now()),
          role: 'assistant',
          time: Date.now(),
          text: this.renderAssistantText(res),   // shows 7-line paragraph + mood
          meta
        };
        this.store.addMessage(this.activeConv!.id, asst);

        if (this.activeConv && this.activeConv.messages.length <= 2 && res?.title) {
          this.store.rename(this.activeConv.id, res.title);
        }
        this.loading = false;
      },
      error: (err) => { this.error = err?.message || 'API error'; this.loading = false; }
    });
  }

  // >>> NEW: render the suggestion_paragraph first, then a compact mood line.
  private renderAssistantText(res: any) {
    const mood = res?.mood ?? 'unknown';
    const score = res?.score ? (res.score * 100).toFixed(1) + '%' : '';
    const paragraph = (res?.suggestion_paragraph || '').trim();

    const parts: string[] = [];
    if (paragraph) parts.push(paragraph);
    parts.push(`Mood detected: ${mood}${score ? ' (' + score + ')' : ''}`);

    return parts.join('\n\n');
  }

  /* ===== file handlers (unchanged) ===== */
  onFileSelected(event: Event) {
    if (!this.activeConv) return;
    const input = event.target as HTMLInputElement;
    const file = (input.files && input.files[0]) || null;
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (['csv'].includes(ext)) this.handleCsv(file);
    else if (['xlsx', 'xls'].includes(ext)) this.handleExcel(file);
    else if (ext === 'pdf') this.handlePdf(file);
    else this.error = 'Unsupported file type. Please upload PDF, CSV, or Excel.';

    (event.target as HTMLInputElement).value = '';
  }

  private handleCsv(file: File) {
    const att: Attachment = { name: file.name, type: 'csv', size: file.size };
    const msg: ChatMessage = { id: crypto.randomUUID?.() || String(Date.now()), role: 'user', time: Date.now(), text: `Uploaded CSV: ${file.name}`, attachments: [att] };
    this.store.addMessage(this.activeConv!.id, msg);
    this.loading = true;
    this.api.analyzeCsv(file).subscribe({
      next: (res) => {
        att.result = res;
        const aMsg: ChatMessage = { id: crypto.randomUUID?.() || String(Date.now()), role: 'assistant', time: Date.now(), text: `CSV analyzed.\nTop emotions: ${JSON.stringify(res?.top_emotions || {}, null, 0)}`, attachments: [att] };
        this.store.addMessage(this.activeConv!.id, aMsg); this.loading = false;
      },
      error: (err) => { this.error = err?.message || 'CSV analysis failed'; this.loading = false; }
    });
  }

  private handleExcel(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const wb = XLSX.read(new Uint8Array(reader.result as ArrayBuffer), { type: 'array' });
      const sheetName = wb.SheetNames[0];
      const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName] || {}, { FS: ',', RS: '\n' });
      const blob = new Blob([csv], { type: 'text/csv' });
      const csvFile = new File([blob], file.name.replace(/\.(xlsx|xls)$/i, '.csv'), { type: 'text/csv' });
      this.handleCsv(csvFile);
    };
    reader.readAsArrayBuffer(file);
  }

  private handlePdf(file: File) {
    const att: Attachment = { name: file.name, type: 'pdf', size: file.size };
    const msg: ChatMessage = { id: crypto.randomUUID?.() || String(Date.now()), role: 'user', time: Date.now(), text: `Uploaded PDF: ${file.name}`, attachments: [att] };
    this.store.addMessage(this.activeConv!.id, msg);
    this.loading = true;
    this.api.uploadPdf(file).subscribe({
      next: (res) => {
        att.result = res;
        const aMsg: ChatMessage = { id: crypto.randomUUID?.() || String(Date.now()), role: 'assistant', time: Date.now(), text: `PDF uploaded. (Hook backend to analyze contents if needed)`, attachments: [att] };
        this.store.addMessage(this.activeConv!.id, aMsg); this.loading = false;
      },
      error: (err) => { this.error = err?.message || 'PDF upload failed or endpoint not implemented'; this.loading = false; }
    });
  }

  trackByMsg(_i: number, m: ChatMessage) { return m.id; }
  trackByConv(_i: number, c: Conversation) { return c.id; }
}
