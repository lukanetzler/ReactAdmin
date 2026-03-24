import { useState, useRef } from 'react';
import { useAllLibraryCards, useCategories } from '../hooks/useContent';
import {
  saveLibraryCard, deleteLibraryCard, uploadFile,
  saveCategory, deleteCategory,
} from '../services/content';
import {
  Plus, Trash2, PenLine, Eye, EyeOff,
  Upload, X, ArrowLeft, ArrowUp, ArrowDown, List,
} from 'lucide-react';

const CARD_COLORS = ['#E9DCC9', '#D9C9B5', '#D4A373', '#C4B5A0', '#8E9775', '#B0A898', '#D4C5B2', '#C4A882'];
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

// ─── UploadField ─────────────────────────────────────────────────────────────
function UploadField({ label, accept, value, storagePath, onUploaded, disabled }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setProgress(0);
    try {
      const url = await uploadFile(file, `${storagePath}/${Date.now()}_${file.name}`, setProgress);
      onUploaded(url);
    } catch {
      setError('Upload failed.');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div>
      <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">{label}</p>
      {value ? (
        <div className="flex items-center gap-2 bg-[#F4EFE6] rounded-xl px-3 py-2">
          <span className="text-xs text-[#433422]/70 truncate flex-1">{value.split('/').pop().split('?')[0].slice(0, 40)}</span>
          <button onClick={() => onUploaded('')} disabled={disabled} className="text-[#433422]/40 hover:text-[#433422]">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={disabled || progress !== null}
          className="flex items-center gap-2 w-full bg-[#F4EFE6] rounded-xl px-3 py-2.5 text-xs text-[#433422]/50 hover:text-[#433422]/80 transition-colors"
        >
          <Upload size={14} />
          {progress !== null ? `${progress}%…` : `Choose ${label.toLowerCase()}`}
        </button>
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
    </div>
  );
}

// ─── ColorPicker ─────────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div>
      <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-2">CARD COLOUR</p>
      <div className="flex gap-2 flex-wrap items-center">
        {CARD_COLORS.map(c => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-7 h-7 rounded-full border-2 transition-all ${value === c ? 'border-[#433422] scale-110' : 'border-transparent'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <input
          type="color"
          value={value || '#E9DCC9'}
          onChange={e => onChange(e.target.value)}
          className="w-7 h-7 rounded-full border-2 border-[#E9DCC9] cursor-pointer bg-transparent"
          title="Custom"
        />
      </div>
    </div>
  );
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
function Toggle({ label, subLabel, value, onChange, color = '#D4A373' }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm text-[#433422]/80 leading-snug">{label}</p>
        {subLabel && <p className="text-[10px] text-[#433422]/40 mt-0.5">{subLabel}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
        style={{ backgroundColor: value ? color : 'rgba(67,52,34,0.15)' }}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${value ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

// ─── AdminCard tile ───────────────────────────────────────────────────────────
function AdminCard({ card, onEdit, onTogglePublish }) {
  return (
    <div
      onClick={onEdit}
      className="aspect-square rounded-[20px] overflow-hidden relative cursor-pointer active:scale-[0.97] transition-transform select-none"
      style={{ backgroundColor: card.color || '#E9DCC9' }}
    >
      {card.imageUrl && <img src={card.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
      {card.imageUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />}

      {!card.published && (
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[7px] font-bold tracking-widest bg-black/35 backdrop-blur-sm text-white/80 px-1.5 py-0.5 rounded-full">DRAFT</span>
        </div>
      )}
      {card.type === 'playlist' && (
        <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center">
          <List size={10} className="text-white" />
        </div>
      )}

      {/* Quick publish toggle */}
      <button
        onClick={e => { e.stopPropagation(); onTogglePublish(); }}
        className={`absolute bottom-8 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${card.published ? 'bg-[#D4A373]' : 'bg-black/30 backdrop-blur-sm'}`}
      >
        {card.published ? <Eye size={9} className="text-white" /> : <EyeOff size={9} className="text-white/70" />}
      </button>

      <div className="absolute bottom-0 left-0 right-0 z-[5] px-2 py-1.5 backdrop-blur-md bg-black/30 border-t border-white/10">
        <p className="text-[9px] font-serif leading-snug text-white truncate">{card.title}</p>
      </div>
    </div>
  );
}

// ─── Add card placeholder ─────────────────────────────────────────────────────
function AddCardTile({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="aspect-square rounded-[20px] border-2 border-dashed border-[#D4A373]/40 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#D4A373]/70 hover:bg-[#D4A373]/5 active:scale-[0.97] transition-all"
    >
      <div className="w-7 h-7 rounded-full bg-[#D4A373]/15 flex items-center justify-center">
        <Plus size={14} className="text-[#D4A373]" />
      </div>
      <p className="text-[8px] font-bold text-[#D4A373]/60 tracking-widest">ADD</p>
    </div>
  );
}

// ─── Card Editor (full-screen overlay) ───────────────────────────────────────
const EMPTY_CARD = {
  title: '', label: '', category: '', duration: '', description: '',
  color: '#E9DCC9', audioUrl: '', imageUrl: '', published: false,
  coming: false, order: 0, type: 'single', tier: 'free',
  tracks: [], addOnSignup: false, broadcastToAll: false,
};

function CardEditor({ initial, categories, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_CARD,
    category: initial?.category || categories[0]?.value || '',
    ...(initial?.id || initial?.category ? {
      title: initial.title || '',
      label: initial.label || '',
      category: initial.category || categories[0]?.value || '',
      duration: initial.duration || '',
      description: initial.description || '',
      color: initial.color || '#E9DCC9',
      audioUrl: initial.audioUrl || '',
      imageUrl: initial.imageUrl || '',
      published: !!initial.published,
      coming: !!initial.coming,
      order: initial.order ?? 0,
      type: initial.type || 'single',
      tier: initial.tier || 'free',
      tracks: initial.tracks || [],
      addOnSignup: !!initial.addOnSignup,
      broadcastToAll: !!initial.broadcastToAll,
    } : {}),
  }));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [imgProgress, setImgProgress] = useState(null);
  const imgInputRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addTrack = () => set('tracks', [...form.tracks, { title: '', audioUrl: '', imageUrl: '', duration: '' }]);
  const removeTrack = (i) => set('tracks', form.tracks.filter((_, idx) => idx !== i));
  const setTrack = (i, k, v) => set('tracks', form.tracks.map((t, idx) => idx === i ? { ...t, [k]: v } : t));
  const addReading = () => set('tracks', [...form.tracks, { title: '', content: '' }]);
  const removeReading = (i) => set('tracks', form.tracks.filter((_, idx) => idx !== i));
  const setReading = (i, k, v) => set('tracks', form.tracks.map((t, idx) => idx === i ? { ...t, [k]: v } : t));

  const handleCoverImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgProgress(0);
    try {
      const url = await uploadFile(file, `library/images/${Date.now()}_${file.name}`, setImgProgress);
      set('imageUrl', url);
    } catch { /* ignore */ }
    finally { setImgProgress(null); }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const cat = categories.find(c => c.value === form.category);
      const payload = {
        title: form.title.trim(),
        label: form.label.trim() || cat?.labelTag || '',
        category: form.category,
        duration: form.duration.trim(),
        description: form.description.trim(),
        color: form.color || '#E9DCC9',
        imageUrl: form.imageUrl || '',
        published: !!form.published,
        coming: !!form.coming,
        order: Number(form.order) || 0,
        type: form.type,
        tier: form.tier,
        addOnSignup: !!form.addOnSignup,
        broadcastToAll: !!form.broadcastToAll,
        broadcastOrder: Number(form.order) || 0,
      };
      if (form.type === 'single') {
        payload.audioUrl = form.audioUrl || '';
        payload.tracks = [];
      } else if (form.type === 'playlist') {
        payload.audioUrl = '';
        payload.tracks = form.tracks.map((t, i) => ({ title: t.title, audioUrl: t.audioUrl || '', imageUrl: t.imageUrl || '', duration: t.duration || '', order: i }));
      } else {
        payload.audioUrl = '';
        payload.tracks = form.tracks.map((t, i) => ({ title: t.title || '', content: t.content || '', order: i }));
      }
      await saveLibraryCard(payload, initial?.id);
      onSave();
    } catch {
      setError('Save failed. Check Firestore rules.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FDF9F3] font-sans text-[#433422] flex flex-col animate-sheet-enter">

      {/* Header */}
      <div className="flex-shrink-0 pt-14 pb-4 px-5 flex items-center gap-3 bg-[#FDF9F3] border-b border-[#E9DCC9]">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-[#F4EFE6] transition-colors flex-shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold tracking-widest text-[#433422]/40">{initial?.id ? 'EDIT CARD' : 'NEW CARD'}</p>
          <p className="text-base font-serif truncate">{form.title || 'Untitled'}</p>
        </div>
        <button
          onClick={() => set('published', !form.published)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors flex-shrink-0 ${form.published ? 'bg-[#D4A373] text-white' : 'bg-[#E9DCC9]/80 text-[#433422]/50'}`}
        >
          {form.published ? <Eye size={11} /> : <EyeOff size={11} />}
          {form.published ? 'Live' : 'Draft'}
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pb-28">

        {/* Cover image tap zone */}
        <div
          className="relative h-52 flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0"
          style={{ backgroundColor: form.color || '#E9DCC9' }}
          onClick={() => imgInputRef.current?.click()}
        >
          {form.imageUrl && <img src={form.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/20" />
          {form.imageUrl && (
            <button
              onClick={e => { e.stopPropagation(); set('imageUrl', ''); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center z-10"
            >
              <X size={14} className="text-white" />
            </button>
          )}
          <div className="relative z-10 text-center pointer-events-none select-none">
            <div className="w-10 h-10 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
              {imgProgress !== null
                ? <span className="text-white text-[10px] font-bold">{imgProgress}%</span>
                : <Upload size={16} className="text-white" />}
            </div>
            <p className="text-white/70 text-xs font-medium">
              {form.imageUrl ? 'Tap to change image' : 'Tap to add cover image'}
            </p>
          </div>
          <input ref={imgInputRef} type="file" accept="image/*" onChange={handleCoverImage} className="hidden" />
        </div>

        <div className="px-5 pt-5 space-y-5">

          {/* Content type */}
          <div>
            <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-2">CONTENT TYPE</p>
            <div className="flex gap-2">
              {['single', 'playlist', 'article'].map(t => (
                <button
                  key={t}
                  onClick={() => set('type', t)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors ${form.type === t ? 'bg-[#433422] text-[#FDF9F3]' : 'bg-[#F4EFE6] text-[#433422]/50 hover:text-[#433422]'}`}
                >
                  {t === 'single' ? 'Single' : t === 'playlist' ? 'Playlist' : 'Article'}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">TITLE *</p>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="The Beatitudes"
              className="w-full bg-white rounded-xl px-4 py-3 text-lg font-serif border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
            />
          </div>

          {/* Category + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">SECTION</p>
              {categories.length === 0 ? (
                <p className="text-xs text-[#433422]/40 py-2 italic">Add a section first</p>
              ) : (
                <select
                  value={form.category}
                  onChange={e => set('category', e.target.value)}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
                >
                  {categories.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">DURATION</p>
              <input
                value={form.duration}
                onChange={e => set('duration', e.target.value)}
                placeholder="12 min"
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
              />
            </div>
          </div>

          {/* Label + Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">LABEL <span className="font-normal text-[#433422]/30">(auto)</span></p>
              <input
                value={form.label}
                onChange={e => set('label', e.target.value)}
                placeholder="Leave blank to auto"
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
              />
            </div>
            <div>
              <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">ORDER</p>
              <input
                type="number"
                value={form.order}
                onChange={e => set('order', e.target.value)}
                placeholder="0"
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">DESCRIPTION</p>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief description…"
              rows={3}
              className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none resize-none"
            />
          </div>

          {/* Color */}
          <ColorPicker value={form.color} onChange={v => set('color', v)} />

          {/* Audio / tracks / readings */}
          {form.type === 'single' && (
            <UploadField label="Audio (MP3)" accept="audio/*" value={form.audioUrl} storagePath="library/audio" onUploaded={url => set('audioUrl', url)} disabled={saving} />
          )}

          {form.type === 'playlist' && (
            <div>
              <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-3">TRACKS</p>
              <div className="space-y-3">
                {form.tracks.map((track, i) => (
                  <div key={i} className="bg-white rounded-[16px] p-4 border border-[#E9DCC9] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#433422]/40">TRACK {i + 1}</span>
                      <button onClick={() => removeTrack(i)} className="text-[#433422]/30 hover:text-[#433422]/60 transition-colors"><X size={14} /></button>
                    </div>
                    <input value={track.title} onChange={e => setTrack(i, 'title', e.target.value)} placeholder="Track title" className="w-full bg-[#FDF9F3] rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none" />
                    <input value={track.duration} onChange={e => setTrack(i, 'duration', e.target.value)} placeholder="8 min" className="w-full bg-[#FDF9F3] rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none" />
                    <UploadField label="Audio" accept="audio/*" value={track.audioUrl} storagePath="library/audio" onUploaded={url => setTrack(i, 'audioUrl', url)} disabled={saving} />
                    <UploadField label="Track Image (optional)" accept="image/*" value={track.imageUrl} storagePath="library/images" onUploaded={url => setTrack(i, 'imageUrl', url)} disabled={saving} />
                  </div>
                ))}
                <button onClick={addTrack} className="w-full py-3 flex items-center justify-center gap-2 bg-[#F4EFE6] text-[#433422]/60 rounded-[16px] text-xs font-bold hover:text-[#433422] transition-colors">
                  <Plus size={13} /> Add Track
                </button>
              </div>
            </div>
          )}

          {form.type === 'article' && (
            <div>
              <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">READINGS</p>
              <p className="text-[9px] text-[#433422]/30 mb-3">Leave empty for a single article. Add readings for a day-by-day series.</p>
              <div className="space-y-3">
                {form.tracks.map((reading, i) => (
                  <div key={i} className="bg-white rounded-[16px] p-4 border border-[#E9DCC9] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#433422]/40">READING {i + 1}</span>
                      <button onClick={() => removeReading(i)} className="text-[#433422]/30 hover:text-[#433422]/60 transition-colors"><X size={14} /></button>
                    </div>
                    <input value={reading.title} onChange={e => setReading(i, 'title', e.target.value)} placeholder="Day 1: Title" className="w-full bg-[#FDF9F3] rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none" />
                    <textarea value={reading.content} onChange={e => setReading(i, 'content', e.target.value)} placeholder="Reading text…" rows={4} className="w-full bg-[#FDF9F3] rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none resize-none" />
                  </div>
                ))}
                <button onClick={addReading} className="w-full py-3 flex items-center justify-center gap-2 bg-[#F4EFE6] text-[#433422]/60 rounded-[16px] text-xs font-bold hover:text-[#433422] transition-colors">
                  <Plus size={13} /> Add Reading
                </button>
              </div>
            </div>
          )}

          {/* Visibility + distribution */}
          <div className="bg-white rounded-[20px] border border-[#E9DCC9] overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <p className="text-[10px] tracking-widest font-bold text-[#433422]/40 mb-3">VISIBILITY</p>
              <div className="space-y-1 divide-y divide-[#F4EFE6]">
                <Toggle label="Coming Soon" subLabel="Show 'SOON' badge on tile" value={form.coming} onChange={v => set('coming', v)} color="#8E9775" />
                <Toggle label="Supporter Only" subLabel="Locked to supporter tier" value={form.tier === 'supporter'} onChange={v => set('tier', v ? 'supporter' : 'free')} color="#C4A882" />
              </div>
            </div>
            <div className="border-t border-[#E9DCC9] px-4 pt-4 pb-4">
              <p className="text-[10px] tracking-widest font-bold text-[#433422]/40 mb-3">PATH DISTRIBUTION</p>
              <div className="space-y-1 divide-y divide-[#F4EFE6]">
                <Toggle label="Add to new user paths" subLabel="Auto-added on signup" value={form.addOnSignup} onChange={v => set('addOnSignup', v)} color="#8E9775" />
                <Toggle
                  label="Broadcast to all users"
                  subLabel={form.broadcastToAll ? '⚡ Live in every user\'s path now' : 'Push into every user\'s daily path'}
                  value={form.broadcastToAll}
                  onChange={v => set('broadcastToAll', v)}
                  color="#D4A373"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm pb-2">{error}</p>}
        </div>
      </div>

      {/* Sticky save footer */}
      <div className="flex-shrink-0 border-t border-[#E9DCC9] bg-[#FDF9F3]/95 backdrop-blur-md px-5 py-4 flex gap-3">
        {initial?.id && !confirmDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-11 h-11 rounded-full bg-[#FEF2F2] flex items-center justify-center flex-shrink-0"
          >
            <Trash2 size={16} className="text-[#D4A373]" />
          </button>
        )}
        {confirmDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-4 h-11 rounded-full bg-red-500 text-white text-xs font-bold flex-shrink-0"
          >
            <Trash2 size={12} /> Confirm
          </button>
        )}
        {confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="h-11 px-4 rounded-full bg-[#E9DCC9]/60 text-[#433422]/60 text-xs font-bold flex-shrink-0"
          >
            Cancel
          </button>
        )}
        {!confirmDelete && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-[#433422] text-[#FDF9F3] rounded-[20px] font-bold text-sm disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving…' : initial?.id ? 'Save Changes' : 'Create Card'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Section inline form ──────────────────────────────────────────────────────
const EMPTY_SECTION = { name: '', value: '', labelTag: '', sectionTag: '', _manual: false };

function SectionForm({ initial, onSave, onCancel, saving, onDelete, isDeleting }) {
  const [form, setForm] = useState(() => initial
    ? { name: initial.name || '', value: initial.value || '', labelTag: initial.labelTag || '', sectionTag: initial.sectionTag || '', _manual: true }
    : EMPTY_SECTION
  );

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleName = (name) => setForm(f => ({ ...f, name, value: f._manual ? f.value : slugify(name) }));
  const handleValue = (value) => setForm(f => ({ ...f, value, _manual: true }));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">SECTION NAME *</p>
          <input value={form.name} onChange={e => handleName(e.target.value)} placeholder="Gospel Themes" className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none" />
        </div>
        <div>
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">SLUG *</p>
          <input value={form.value} onChange={e => handleValue(e.target.value)} placeholder="gospel" className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none font-mono text-xs" />
        </div>
        <div>
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">LABEL TAG</p>
          <input value={form.labelTag} onChange={e => set('labelTag', e.target.value)} placeholder="GOSPEL" className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none" />
        </div>
        <div className="col-span-2">
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">SECTION TAG <span className="font-normal text-[#433422]/30">(shown above title)</span></p>
          <input value={form.sectionTag} onChange={e => set('sectionTag', e.target.value)} placeholder="SERIES" className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none" />
        </div>
      </div>
      <div className="flex gap-2">
        {initial?.id && (
          <button onClick={onDelete} disabled={isDeleting} className="w-9 h-9 rounded-full bg-[#FEF2F2] flex items-center justify-center flex-shrink-0 disabled:opacity-50">
            <Trash2 size={14} className="text-[#D4A373]" />
          </button>
        )}
        <button onClick={onCancel} className="flex-1 py-2 bg-[#E9DCC9]/50 text-[#433422]/60 rounded-[12px] text-xs font-bold">Cancel</button>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim() || !form.value.trim()}
          className="flex-1 py-2 bg-[#433422] text-[#FDF9F3] rounded-[12px] text-xs font-bold disabled:opacity-50"
        >
          {saving ? 'Saving…' : initial?.id ? 'Save Section' : 'Add Section'}
        </button>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
const AdminDashboard = ({ user, profile, onBack }) => {
  const { cards, loading: cardsLoading } = useAllLibraryCards();
  const { categories, loading: catsLoading } = useCategories();

  const [editingCard, setEditingCard] = useState(null);
  const [editingSection, setEditingSection] = useState(null); // null | catId | 'new'
  const [sectionSaving, setSectionSaving] = useState(false);
  const [deletingSection, setDeletingSection] = useState(null);
  const [togglingPublish, setTogglingPublish] = useState(new Set());

  const handleTogglePublish = async (card) => {
    setTogglingPublish(s => new Set([...s, card.id]));
    try { await saveLibraryCard({ published: !card.published }, card.id); } catch { /* ignore */ }
    setTogglingPublish(s => { const n = new Set(s); n.delete(card.id); return n; });
  };

  const handleDeleteCard = async (card) => {
    try { await deleteLibraryCard(card.id, card); } catch { /* ignore */ }
    setEditingCard(null);
  };

  const handleSaveSection = async (form) => {
    setSectionSaving(true);
    try {
      const id = editingSection === 'new' ? undefined : editingSection;
      const existing = id ? categories.find(c => c.id === id) : null;
      const payload = {
        name: form.name.trim(),
        value: slugify(form.value),
        labelTag: (form.labelTag.trim() || form.name.trim()).toUpperCase(),
        sectionTag: (form.sectionTag.trim() || 'SERIES').toUpperCase(),
        order: existing?.order ?? categories.length,
      };
      await saveCategory(payload, id);
      setEditingSection(null);
    } catch { /* ignore */ }
    setSectionSaving(false);
  };

  const handleDeleteSection = async (id) => {
    setDeletingSection(id);
    try { await deleteCategory(id); } catch { /* ignore */ }
    setDeletingSection(null);
    setEditingSection(null);
  };

  const handleReorderSection = async (cat, direction) => {
    const idx = categories.findIndex(c => c.id === cat.id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= categories.length) return;
    const reordered = [...categories];
    reordered.splice(idx, 1);
    reordered.splice(newIdx, 0, cat);
    await Promise.all(reordered.map((c, i) => saveCategory({ order: i }, c.id)));
  };

  const knownValues = new Set(categories.map(c => c.value));
  const uncategorized = cards.filter(c => !knownValues.has(c.category));

  return (
    <div className="min-h-screen bg-[#FDF9F3] font-sans text-[#433422]">

      {/* Header */}
      <header className="relative bg-[#433422] flex items-end px-6 pb-12 pt-14">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#D4A373]/10 rounded-full blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-8">
            <path d="M0,40 L0,20 C80,4 160,36 240,16 C300,2 360,32 400,20 L400,40 Z" fill="#FDF9F3" />
          </svg>
        </div>
        <div className="relative z-10 flex items-end justify-between w-full">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowLeft size={15} className="text-[#FDF9F3]" />
              </button>
            )}
            <div>
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#FDF9F3]/50">PRAYVAIL</p>
              <h1 className="text-2xl font-serif text-[#FDF9F3]">Library Editor</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-[#FDF9F3]/70">{profile?.name || user?.displayName || 'Admin'}</p>
            <p className="text-[10px] text-[#D4A373]">GOD MODE</p>
          </div>
        </div>
      </header>

      {/* Library canvas */}
      <main className="pt-8 pb-40 space-y-10">
        {(cardsLoading || catsLoading) && (
          <p className="text-center text-[#433422]/40 text-sm py-8">Loading library…</p>
        )}

        {categories.map((cat, idx) => {
          const catCards = cards.filter(c => c.category === cat.value).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          const isEditingThis = editingSection === cat.id;

          return (
            <section key={cat.id}>
              {/* Section header row */}
              <div className="px-6 mb-4">
                {isEditingThis ? (
                  <div className="bg-[#F4EFE6]/70 rounded-[16px] p-4">
                    <p className="text-[9px] font-bold tracking-widest text-[#433422]/40 mb-3">EDIT SECTION</p>
                    <SectionForm
                      initial={cat}
                      onSave={handleSaveSection}
                      onCancel={() => setEditingSection(null)}
                      saving={sectionSaving}
                      onDelete={() => handleDeleteSection(cat.id)}
                      isDeleting={deletingSection === cat.id}
                    />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">{cat.sectionTag || 'SERIES'}</p>
                      <h2 className="text-xl font-serif">{cat.name}</h2>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1 flex-shrink-0">
                      <button onClick={() => handleReorderSection(cat, -1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-[#F4EFE6] disabled:opacity-20 transition-colors">
                        <ArrowUp size={13} className="text-[#433422]/50" />
                      </button>
                      <button onClick={() => handleReorderSection(cat, 1)} disabled={idx === categories.length - 1} className="p-1.5 rounded-lg hover:bg-[#F4EFE6] disabled:opacity-20 transition-colors">
                        <ArrowDown size={13} className="text-[#433422]/50" />
                      </button>
                      <button onClick={() => setEditingSection(cat.id)} className="p-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors">
                        <PenLine size={14} className="text-[#433422]/50" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cards grid */}
              {!isEditingThis && (
                <div className="grid grid-cols-3 gap-2 px-6">
                  {catCards.map(c => (
                    <AdminCard
                      key={c.id}
                      card={c}
                      onEdit={() => setEditingCard(c)}
                      onTogglePublish={() => handleTogglePublish(c)}
                    />
                  ))}
                  <AddCardTile onClick={() => setEditingCard({ _new: true, category: cat.value })} />
                </div>
              )}
            </section>
          );
        })}

        {/* Uncategorized */}
        {uncategorized.length > 0 && (
          <section>
            <div className="px-6 mb-4">
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">UNLINKED</p>
              <h2 className="text-xl font-serif">Uncategorized</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 px-6">
              {uncategorized.map(c => (
                <AdminCard key={c.id} card={c} onEdit={() => setEditingCard(c)} onTogglePublish={() => handleTogglePublish(c)} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!cardsLoading && !catsLoading && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#F4EFE6] flex items-center justify-center">
              <Plus size={24} className="text-[#D4A373]" />
            </div>
            <p className="text-[#433422]/50 text-sm leading-relaxed">Tap <strong>Add Section</strong> below to create your first library section, then add cards inside it.</p>
          </div>
        )}
      </main>

      {/* Add Section bar (fixed bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FDF9F3]/95 backdrop-blur-md border-t border-[#E9DCC9] z-30">
        {editingSection === 'new' ? (
          <div className="p-5">
            <p className="text-[9px] font-bold tracking-widest text-[#433422]/40 mb-3">NEW SECTION</p>
            <SectionForm
              onSave={handleSaveSection}
              onCancel={() => setEditingSection(null)}
              saving={sectionSaving}
            />
          </div>
        ) : (
          <div className="px-6 py-4">
            <button
              onClick={() => setEditingSection('new')}
              className="w-full py-3.5 flex items-center justify-center gap-2 bg-[#433422] text-[#FDF9F3] rounded-[20px] text-sm font-bold"
            >
              <Plus size={16} /> Add Section
            </button>
          </div>
        )}
      </div>

      {/* Card editor overlay */}
      {editingCard && (
        <CardEditor
          initial={editingCard._new ? { category: editingCard.category } : editingCard}
          categories={categories}
          onSave={() => setEditingCard(null)}
          onCancel={() => setEditingCard(null)}
          onDelete={editingCard._new ? undefined : () => handleDeleteCard(editingCard)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
