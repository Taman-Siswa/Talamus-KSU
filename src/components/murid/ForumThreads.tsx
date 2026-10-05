'use client';

import { useState } from 'react';
import type { School } from '@/data/types';
import { initials } from '@/data/student';
import { useCurrentUser } from '@/lib/auth';
import { ROLE_LABEL, forumThreads, type ForumSort } from '@/lib/forum';
import { sc } from '@/lib/murid';
import { useStore } from '@/lib/store';
import Icon, { type IconName } from '../Icon';
import css from './forum.module.css';

const SORTS: { key: ForumSort; label: string; icon: IconName }[] = [
  { key: 'new', label: 'Terbaru', icon: 'clock' },
  { key: 'top', label: 'Terpopuler', icon: 'arrowUp' },
  { key: 'hot', label: 'Trending', icon: 'flame' },
];

// Only called from event handlers.
const stamp = () => Date.now();

/** Composer, sort chips and the question list. `filter` is a school id, or 'all'. */
export default function ForumThreads({ schools, filter, preview = false }: { schools: School[]; filter: string; preview?: boolean }) {
  const user = useCurrentUser();
  const me = user?.name || 'Kamu';
  const forum = useStore(s => s.forum);
  const { addPost, addReply, toggleVote } = useStore.getState();
  const [sort, setSort] = useState<ForumSort>('top');
  const [draft, setDraft] = useState('');
  const [compose, setCompose] = useState(false);
  const [postSchool, setPostSchool] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [replies, setReplies] = useState<Record<string, string>>({});

  const byId = new Map(schools.map(s => [s.id, s]));
  const threads = forumThreads(schools, forum, filter, sort);
  const target = filter !== 'all' ? filter : postSchool || schools[0]?.id || '';

  const post = () => {
    const q = draft.trim();
    if (!q || !target || preview) return;
    const at = stamp();
    addPost({ id: 'p' + at, sid: target, q, by: me, at });
    setDraft(''); setCompose(false);
  };
  const reply = (id: string) => {
    const t = (replies[id] || '').trim();
    if (!t || preview) return;
    addReply(id, { n: me, t, at: stamp(), role: 'murid' });
    setReplies(r => ({ ...r, [id]: '' }));
  };

  return (
    <>
      <div className={css.composer}>
        <div className={css.composerRow}>
          <span className={css.avatar}>{initials(me)}</span>
          <input className={css.composerInput} value={draft} placeholder="Apa yang ingin kamu tanyakan atau bagikan?"
            aria-label="Tulis pertanyaan" disabled={preview || !schools.length}
            onChange={e => setDraft(e.target.value)} onFocus={() => setCompose(true)}
            onKeyDown={e => { if (e.key === 'Enter') post(); }} />
        </div>
        {compose && (
          <div className={css.composerMore}>
            {filter === 'all' && (
              <label className={css.pick}>
                <select aria-label="Untuk sekolah" value={target} onChange={e => setPostSchool(e.target.value)}>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.short}</option>)}
                </select>
                <Icon name="chevronDown" size={12} stroke={2.2} />
              </label>
            )}
            <div className={css.spacer} />
            <button type="button" className={css.textBtn} onClick={() => { setCompose(false); setDraft(''); }}>Batal</button>
            <button type="button" className={css.send} disabled={!draft.trim()} onClick={post}>Kirim pertanyaan</button>
          </div>
        )}
      </div>

      <div className={css.sorts}>
        {SORTS.map(o => (
          <button key={o.key} type="button" className={[css.sort, sort === o.key ? css.sortOn : ''].join(' ')} aria-pressed={sort === o.key} onClick={() => setSort(o.key)}>
            <Icon name={o.icon} size={15} stroke={1.8} />{o.label}
          </button>
        ))}
      </div>

      <div className={css.list}>
        {threads.map(t => {
          const school = byId.get(t.sid)!;
          const isOpen = !!open[t.id];
          const n = t.answers.length;
          return (
            <div key={t.id} className={[css.thread, isOpen ? css.threadOpen : ''].join(' ')} {...sc(school)}>
              <div className={css.head} role="button" tabIndex={0} aria-expanded={isOpen}
                onClick={() => setOpen(o => ({ ...o, [t.id]: !isOpen }))}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => ({ ...o, [t.id]: !isOpen })); } }}>
                <div className={css.headMain}>
                  <span className={css.tag}>{school.short}</span>
                  <div className={css.q}>{t.q}</div>
                  <div className={css.metaRow}>
                    <span className={n ? css.stOk : css.stNone}>{n ? `${n} jawaban` : 'Belum ada jawaban'}</span>
                    <span className={css.by}>{t.by ? <>· Ditanya oleh <strong>{t.by}</strong>{t.when ? ' · ' + t.when : ''}</> : '· Pertanyaan umum dari sekolah'}</span>
                  </div>
                </div>
                <button type="button" className={[css.vote, t.voted ? css.voteOn : ''].join(' ')} aria-pressed={t.voted} disabled={preview}
                  title="Upvote pertanyaan — aku juga ingin tahu"
                  onClick={e => { e.stopPropagation(); toggleVote(t.id); }}>
                  <Icon name="upvote" size={16} stroke={1.8} fill={t.voted} />{t.votes}
                </button>
                <span className={[css.chev, isOpen ? css.chevOpen : ''].join(' ')}><Icon name="chevronDown" size={16} stroke={2} /></span>
              </div>
              {isOpen && (
                <div className={css.body}>
                  <div className={css.ansLabel}>{n ? n + ' JAWABAN' : 'JAWABAN'}</div>
                  {n === 0 && <div className={css.none}>Belum ada jawaban — jadi yang pertama menjawab di bawah.</div>}
                  {t.answers.map(a => (
                    <div key={a.key} className={css.ans}>
                      <button type="button" className={[css.ansVote, a.voted ? css.voteOn : ''].join(' ')} aria-pressed={a.voted} disabled={preview}
                        title="Upvote jawaban ini" onClick={() => toggleVote('ans:' + a.key)}>
                        <Icon name="upvote" size={16} stroke={1.8} fill={a.voted} />{a.votes}
                      </button>
                      <div className={css.ansMain}>
                        {a.top && <div className={css.topTag}><Icon name="star" size={13} fill />JAWABAN TERATAS</div>}
                        <div className={css.who}>
                          <span className={[css.ansAvatar, a.role !== 'self' ? css.ansAvatarTeam : ''].join(' ')}>{a.role === 'admin' ? 'TS' : initials(a.name)}</span>
                          <span className={css.ansName}>{a.name}</span>
                          <span className={[css.role, a.role === 'admin' ? css.roleAdmin : a.role === 'self' ? css.roleMurid : ''].join(' ')}>{ROLE_LABEL[a.role]}</span>
                          {a.when && <span className={css.when}>· {a.when}</span>}
                        </div>
                        <div className={css.ansText}>{a.text}</div>
                      </div>
                    </div>
                  ))}
                  <div className={css.reply}>
                    <input className={css.replyInput} value={replies[t.id] || ''} placeholder="Tulis jawabanmu…" aria-label="Tulis jawaban" disabled={preview}
                      onChange={e => setReplies(r => ({ ...r, [t.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') reply(t.id); }} />
                    <button type="button" className={[css.send, css.replyBtn].join(' ')} disabled={preview || !(replies[t.id] || '').trim()} onClick={() => reply(t.id)}>Kirim jawaban</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {threads.length === 0 && <div className={css.empty}>Belum ada diskusi di sini. Jadi yang pertama bertanya!</div>}
    </>
  );
}
