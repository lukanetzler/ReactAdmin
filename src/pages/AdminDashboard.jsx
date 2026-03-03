import { useState, useRef } from 'react';
import { useAllLibraryCards, useCategories } from '../hooks/useContent';
import {
  saveLibraryCard, deleteLibraryCard, uploadFile,
  saveCategory, deleteCategory,
} from '../services/content';
import {
  Plus, Trash2, PenLine, Eye, EyeOff,
  Upload, X, ChevronDown, ChevronUp, ArrowLeft, ArrowUp, ArrowDown,
} from 'lucide-react';

const CARD_COLORS = ['#E9DCC9', '#D9C9B5', '#D4A373', '#C4B5A0', '#8E9775', '#B0A898', '#D4C5B2', '#C4A882'];

// ── Upload Field ───────────────────────────────────────────

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
      setError('Upload failed. Check Firebase Storage rules.');
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
          {progress !== null ? `Uploading ${progress}%…` : `Choose ${label.toLowerCase()}`}
        </button>
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
    </div>
  );
}

// ── Color Picker ───────────────────────────────────────────

function ColorPicker({ value, onChange }) {
  return (
    <div>
      <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">CARD COLOUR</p>
      <div className="flex gap-2 flex-wrap">
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
          title="Custom colour"
        />
      </div>
    </div>
  );
}

// ── Category Form ──────────────────────────────────────────

function CategoryForm({ form, onNameChange, onValueChange, onSet, onSave, onCancel, saving }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">DISPLAY NAME *</p>
          <input
            value={form.name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Gospel Themes"
            className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
          />
        </div>
        <div>
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">ID / SLUG *</p>
          <input
            value={form.value}
            onChange={e => onValueChange(e.target.value)}
            placeholder="gospel"
            className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none font-mono"
          />
          <p className="text-[9px] text-[#433422]/30 mt-0.5 px-1">Cards link to this category by ID</p>
        </div>
        <div>
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">LABEL TAG</p>
          <input
            value={form.labelTag}
            onChange={e => onSet('labelTag', e.target.value)}
            placeholder="GOSPEL"
            className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
          />
          <p className="text-[9px] text-[#433422]/30 mt-0.5 px-1">Badge shown on cards</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">SECTION TAG</p>
          <input
            value={form.sectionTag}
            onChange={e => onSet('sectionTag', e.target.value)}
            placeholder="SERIES"
            className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
          />
          <p className="text-[9px] text-[#433422]/30 mt-0.5 px-1">Small label above section title in library</p>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="flex-1 py-2 bg-[#E9DCC9]/50 text-[#433422]/60 rounded-[12px] text-xs font-bold">Cancel</button>
        <button
          onClick={onSave}
          disabled={saving || !form.name.trim() || !form.value.trim()}
          className="flex-1 py-2 bg-[#433422] text-[#FDF9F3] rounded-[12px] text-xs font-bold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Category'}
        </button>
      </div>
    </div>
  );
}

// ── Category Manager ───────────────────────────────────────

const EMPTY_CAT = { name: '', value: '', labelTag: '', sectionTag: '', _valueManual: false };

const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

function CategoryManager() {
  const { categories, loading } = useCategories();
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY_CAT);
  const [saving, setSaving] = useState(false);

  const startAdd = () => {
    setForm(EMPTY_CAT);
    setEditing(null);
    setAdding(true);
  };

  const startEdit = (cat) => {
    setForm({ name: cat.name || '', value: cat.value || '', labelTag: cat.labelTag || '', sectionTag: cat.sectionTag || '', _valueManual: true });
    setAdding(false);
    setEditing(cat.id);
  };

  const handleNameChange = (name) => {
    setForm(f => ({ ...f, name, value: f._valueManual ? f.value : slugify(name) }));
  };

  const handleValueChange = (value) => {
    setForm(f => ({ ...f, value, _valueManual: true }));
  };

  const handleSet = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.value.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        value: slugify(form.value),
        labelTag: (form.labelTag.trim() || form.name.trim()).toUpperCase(),
        sectionTag: (form.sectionTag.trim() || 'SERIES').toUpperCase(),
        order: editing
          ? (categories.find(c => c.id === editing)?.order ?? 0)
          : categories.length,
      };
      await saveCategory(payload, editing || undefined);
      setAdding(false);
      setEditing(null);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try { await deleteCategory(id); } catch { /* ignore */ }
    setDeleting(null);
  };

  const handleReorder = async (cat, direction) => {
    const idx = categories.findIndex(c => c.id === cat.id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= categories.length) return;
    const reordered = [...categories];
    reordered.splice(idx, 1);
    reordered.splice(newIdx, 0, cat);
    await Promise.all(reordered.map((c, i) => saveCategory({ order: i }, c.id)));
  };

  const cancelForm = () => { setAdding(false); setEditing(null); };

  return (
    <div className="bg-white rounded-[20px] border border-[#E9DCC9] overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3.5">
        <div className="text-left">
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/40">LIBRARY</p>
          <p className="text-sm font-bold text-[#433422]">
            Categories <span className="font-normal text-[#433422]/40">({categories.length})</span>
          </p>
        </div>
        {open ? <ChevronUp size={16} className="text-[#433422]/40" /> : <ChevronDown size={16} className="text-[#433422]/40" />}
      </button>

      {open && (
        <div className="border-t border-[#E9DCC9]">
          {loading && <p className="px-4 py-3 text-xs text-[#433422]/30">Loading…</p>}

          {categories.map((cat, idx) => (
            <div key={cat.id} className="border-b border-[#E9DCC9] last:border-b-0">
              {editing === cat.id ? (
                <div className="p-4">
                  <CategoryForm
                    form={form}
                    onNameChange={handleNameChange}
                    onValueChange={handleValueChange}
                    onSet={handleSet}
                    onSave={handleSave}
                    onCancel={cancelForm}
                    saving={saving}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="flex flex-col">
                    <button
                      onClick={() => handleReorder(cat, -1)}
                      disabled={idx === 0}
                      className="p-0.5 hover:bg-[#F4EFE6] rounded disabled:opacity-20 transition-colors"
                    >
                      <ArrowUp size={11} className="text-[#433422]/50" />
                    </button>
                    <button
                      onClick={() => handleReorder(cat, 1)}
                      disabled={idx === categories.length - 1}
                      className="p-0.5 hover:bg-[#F4EFE6] rounded disabled:opacity-20 transition-colors"
                    >
                      <ArrowDown size={11} className="text-[#433422]/50" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#433422]">{cat.name}</p>
                    <p className="text-[10px] text-[#433422]/40 font-mono">{cat.value} · {cat.labelTag}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors">
                      <PenLine size={15} className="text-[#433422]/50" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={deleting === cat.id}
                      className="p-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={15} className="text-[#433422]/50" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!loading && categories.length === 0 && !adding && (
            <p className="px-4 py-3 text-xs text-[#433422]/30">
              No categories yet. Add one to start organising your library.
            </p>
          )}

          {adding ? (
            <div className="p-4 border-t border-[#E9DCC9]">
              <CategoryForm
                form={form}
                onNameChange={handleNameChange}
                onValueChange={handleValueChange}
                onSet={handleSet}
                onSave={handleSave}
                onCancel={cancelForm}
                saving={saving}
              />
            </div>
          ) : (
            <button
              onClick={startAdd}
              className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-[#433422]/50 hover:text-[#433422] hover:bg-[#F4EFE6] transition-colors border-t border-[#E9DCC9]"
            >
              <Plus size={13} /> Add Category
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Library Card Form ──────────────────────────────────────

const EMPTY_CARD = { title: '', label: '', category: '', duration: '', description: '', color: '#E9DCC9', audioUrl: '', imageUrl: '', published: false, coming: false, order: '', type: 'single', tier: 'free', tracks: [], addOnSignup: false, broadcastToAll: false };
const EMPTY_TRACK = { title: '', audioUrl: '', imageUrl: '', duration: '' };

function LibraryCardForm({ initial, categories, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_CARD,
    category: initial?.category || categories[0]?.value || '',
    ...(initial ? {
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
      order: initial.order ?? '',
      type: initial.type || 'single',
      tier: initial.tier || 'free',
      tracks: initial.tracks || [],
      addOnSignup: !!initial.addOnSignup,
      broadcastToAll: !!initial.broadcastToAll,
    } : {}),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTrack = () => set('tracks', [...form.tracks, { ...EMPTY_TRACK }]);
  const removeTrack = (i) => set('tracks', form.tracks.filter((_, idx) => idx !== i));
  const setTrack = (i, k, v) => set('tracks', form.tracks.map((t, idx) => idx === i ? { ...t, [k]: v } : t));

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
        order: parseInt(form.order) || 0,
        type: form.type,
        tier: form.tier,
        addOnSignup: !!form.addOnSignup,
        broadcastToAll: !!form.broadcastToAll,
        broadcastOrder: parseInt(form.order) || 0,
      };
      if (form.type === 'single') {
        payload.audioUrl = form.audioUrl || '';
        payload.tracks = [];
      } else if (form.type === 'playlist') {
        payload.audioUrl = '';
        payload.tracks = form.tracks.map((t, i) => ({ title: t.title, audioUrl: t.audioUrl || '', imageUrl: t.imageUrl || '', duration: t.duration, order: i }));
      } else {
        // article — no audio
        payload.audioUrl = '';
        payload.tracks = [];
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
    <div className="bg-[#FDF9F3] rounded-[20px] p-5 border border-[#E9DCC9] space-y-4">

      {/* Type toggle */}
      <div>
        <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-2">CONTENT TYPE</p>
        <div className="flex gap-2">
          {['single', 'playlist', 'article'].map(t => (
            <button
              key={t}
              onClick={() => set('type', t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${form.type === t ? 'bg-[#433422] text-[#FDF9F3]' : 'bg-[#E9DCC9]/50 text-[#433422]/50'}`}
            >
              {t === 'single' ? 'Single Track' : t === 'playlist' ? 'Playlist' : 'Article'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">TITLE *</p>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="The Beatitudes"
            className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
          />
        </div>
        <div>
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">CATEGORY</p>
          {categories.length === 0 ? (
            <p className="text-xs text-[#433422]/40 py-2 italic">Add a category first</p>
          ) : (
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
            >
              {categories.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
            </select>
          )}
        </div>
        <div>
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">LABEL TAG</p>
          <input
            value={form.label}
            onChange={e => set('label', e.target.value)}
            placeholder="Auto from category"
            className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
          />
        </div>
        <div>
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">DURATION</p>
          <input
            value={form.duration}
            onChange={e => set('duration', e.target.value)}
            placeholder={form.type === 'playlist' ? 'e.g. 7 tracks' : '12 min'}
            className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
          />
        </div>
        <div>
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">ORDER</p>
          <input
            type="number"
            value={form.order}
            onChange={e => set('order', e.target.value)}
            placeholder="0"
            className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">DESCRIPTION</p>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Brief description…"
          rows={3}
          className="w-full bg-white rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none resize-none"
        />
      </div>

      <ColorPicker value={form.color} onChange={v => set('color', v)} />
      <UploadField label="Cover Image" accept="image/*" value={form.imageUrl} storagePath="library/images" onUploaded={url => set('imageUrl', url)} disabled={saving} />

      {/* Single audio or Playlist tracks — hidden for articles */}
      {form.type === 'single' ? (
        <UploadField label="Audio (MP3)" accept="audio/*" value={form.audioUrl} storagePath="library/audio" onUploaded={url => set('audioUrl', url)} disabled={saving} />
      ) : form.type === 'article' ? null : (
        <div>
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-2">TRACKS</p>
          <div className="space-y-3">
            {form.tracks.map((track, i) => (
              <div key={i} className="bg-white rounded-[16px] p-3 border border-[#E9DCC9] space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#433422]/40">TRACK {i + 1}</span>
                  <button onClick={() => removeTrack(i)} className="text-[#433422]/30 hover:text-[#433422]/60 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <input
                  value={track.title}
                  onChange={e => setTrack(i, 'title', e.target.value)}
                  placeholder="Track title"
                  className="w-full bg-[#FDF9F3] rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
                />
                <input
                  value={track.duration}
                  onChange={e => setTrack(i, 'duration', e.target.value)}
                  placeholder="8 min"
                  className="w-full bg-[#FDF9F3] rounded-xl px-3 py-2 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
                />
                <UploadField
                  label="Audio"
                  accept="audio/*"
                  value={track.audioUrl}
                  storagePath="library/audio"
                  onUploaded={url => setTrack(i, 'audioUrl', url)}
                  disabled={saving}
                />
                <UploadField
                  label="Track Image (optional)"
                  accept="image/*"
                  value={track.imageUrl}
                  storagePath="library/images"
                  onUploaded={url => setTrack(i, 'imageUrl', url)}
                  disabled={saving}
                />
              </div>
            ))}
            <button
              onClick={addTrack}
              className="w-full py-2.5 flex items-center justify-center gap-1.5 bg-[#F4EFE6] text-[#433422]/60 rounded-[14px] text-xs font-bold hover:text-[#433422] transition-colors"
            >
              <Plus size={13} /> Add Track
            </button>
          </div>
        </div>
      )}

      {/* Toggles */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => set('published', !form.published)} className={`w-11 h-6 rounded-full transition-colors relative ${form.published ? 'bg-[#D4A373]' : 'bg-[#433422]/15'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.published ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className="text-sm text-[#433422]/60">{form.published ? 'Published' : 'Draft'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => set('coming', !form.coming)} className={`w-11 h-6 rounded-full transition-colors relative ${form.coming ? 'bg-[#8E9775]' : 'bg-[#433422]/15'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.coming ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className="text-sm text-[#433422]/60">Coming Soon</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => set('tier', form.tier === 'supporter' ? 'free' : 'supporter')} className={`w-11 h-6 rounded-full transition-colors relative ${form.tier === 'supporter' ? 'bg-[#C4A882]' : 'bg-[#433422]/15'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.tier === 'supporter' ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className="text-sm text-[#433422]/60">{form.tier === 'supporter' ? 'Supporter only' : 'Free'}</span>
        </div>
      </div>

      {/* Path distribution toggles */}
      <div className="border-t border-[#E9DCC9] pt-4 space-y-3">
        <p className="text-[9px] font-bold tracking-widest text-[#433422]/40">PATH DISTRIBUTION</p>
        <div className="flex items-start gap-3">
          <button
            onClick={() => set('addOnSignup', !form.addOnSignup)}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 mt-0.5 ${form.addOnSignup ? 'bg-[#8E9775]' : 'bg-[#433422]/15'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.addOnSignup ? 'left-5' : 'left-0.5'}`} />
          </button>
          <div>
            <p className="text-sm text-[#433422]/80 font-medium">Add to new user paths</p>
            <p className="text-[10px] text-[#433422]/40">Automatically added when new users sign up</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <button
            onClick={() => set('broadcastToAll', !form.broadcastToAll)}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 mt-0.5 ${form.broadcastToAll ? 'bg-[#D4A373]' : 'bg-[#433422]/15'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.broadcastToAll ? 'left-5' : 'left-0.5'}`} />
          </button>
          <div>
            <p className="text-sm text-[#433422]/80 font-medium">In all current paths</p>
            <p className="text-[10px] text-[#433422]/40">
              {form.broadcastToAll ? '⚡ Active — visible in every user\'s daily path right now' : 'Live in every user\'s daily path when enabled'}
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 bg-[#E9DCC9]/50 text-[#433422]/60 rounded-[14px] text-xs font-bold">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-[#433422] text-[#FDF9F3] rounded-[14px] text-xs font-bold disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Card'}
        </button>
      </div>
    </div>
  );
}

// ── Library Tab ────────────────────────────────────────────

function LibraryTab() {
  const { cards, loading } = useAllLibraryCards();
  const { categories } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [openCat, setOpenCat] = useState(null);
  const [addingToCat, setAddingToCat] = useState(null); // category value string when adding within a section

  const handleDelete = async (card) => {
    setDeleting(card.id);
    try { await deleteLibraryCard(card.id, card); } catch { /* ignore */ }
    setDeleting(null);
  };

  const handleTogglePublish = async (card) => {
    try { await saveLibraryCard({ published: !card.published }, card.id); } catch { /* ignore */ }
  };

  const knownValues = new Set(categories.map(c => c.value));
  const uncategorized = cards.filter(c => !knownValues.has(c.category));

  return (
    <div className="space-y-4">
      {!showForm && !editing && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 flex items-center justify-center gap-2 bg-[#433422] text-[#FDF9F3] rounded-[20px] text-sm font-bold"
        >
          <Plus size={16} /> New Library Card
        </button>
      )}

      {showForm && (
        <LibraryCardForm
          categories={categories}
          onSave={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading && <p className="text-center text-[#433422]/40 text-sm py-8">Loading…</p>}

      {categories.map(cat => {
        const catCards = cards.filter(c => c.category === cat.value);
        const isOpen = openCat === cat.value;
        return (
          <div key={cat.value} className="bg-white rounded-[20px] border border-[#E9DCC9] overflow-hidden">
            <button
              onClick={() => setOpenCat(isOpen ? null : cat.value)}
              className="w-full flex items-center justify-between px-4 py-3.5"
            >
              <div className="text-left">
                <p className="text-[10px] tracking-widest font-bold text-[#433422]/40">{cat.labelTag}</p>
                <p className="text-sm font-bold text-[#433422]">
                  {cat.name} <span className="font-normal text-[#433422]/40">({catCards.length})</span>
                </p>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-[#433422]/40" /> : <ChevronDown size={16} className="text-[#433422]/40" />}
            </button>
            {isOpen && (
              <div className="border-t border-[#E9DCC9] divide-y divide-[#E9DCC9]">
                {catCards.length === 0 && !addingToCat && (
                  <p className="px-4 py-3 text-xs text-[#433422]/30">No cards in this category.</p>
                )}
                {catCards.map(c => (
                  <div key={c.id}>
                    {editing === c.id ? (
                      <div className="p-3">
                        <LibraryCardForm
                          initial={c}
                          categories={categories}
                          onSave={() => setEditing(null)}
                          onCancel={() => setEditing(null)}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-[10px] flex-shrink-0" style={{ backgroundColor: c.color || '#E9DCC9' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#433422] truncate">{c.title}</p>
                          <p className="text-xs text-[#433422]/40">{c.duration || 'No duration'}{c.coming ? ' · Coming Soon' : ''}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleTogglePublish(c)} className="p-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors" title={c.published ? 'Unpublish' : 'Publish'}>
                            {c.published ? <Eye size={15} className="text-[#D4A373]" /> : <EyeOff size={15} className="text-[#433422]/30" />}
                          </button>
                          <button onClick={() => setEditing(c.id)} className="p-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors">
                            <PenLine size={15} className="text-[#433422]/50" />
                          </button>
                          <button onClick={() => handleDelete(c)} disabled={deleting === c.id} className="p-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors disabled:opacity-40">
                            <Trash2 size={15} className="text-[#433422]/50" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {/* Inline add form for this category */}
                {addingToCat === cat.value ? (
                  <div className="p-3">
                    <LibraryCardForm
                      initial={{ category: cat.value }}
                      categories={categories}
                      onSave={() => setAddingToCat(null)}
                      onCancel={() => setAddingToCat(null)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowForm(false); setEditing(null); setAddingToCat(cat.value); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-[#433422]/40 hover:text-[#433422]/70 hover:bg-[#F4EFE6] transition-colors"
                  >
                    <Plus size={13} /> Add Card to {cat.name}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Uncategorized — cards whose category slug doesn't match any known category */}
      {uncategorized.length > 0 && (
        <div className="bg-white rounded-[20px] border border-[#E9DCC9] overflow-hidden">
          <button
            onClick={() => setOpenCat(openCat === '__uncategorized' ? null : '__uncategorized')}
            className="w-full flex items-center justify-between px-4 py-3.5"
          >
            <div className="text-left">
              <p className="text-[10px] tracking-widest font-bold text-[#433422]/40">UNLINKED</p>
              <p className="text-sm font-bold text-[#433422]">
                Uncategorized <span className="font-normal text-[#433422]/40">({uncategorized.length})</span>
              </p>
            </div>
            {openCat === '__uncategorized' ? <ChevronUp size={16} className="text-[#433422]/40" /> : <ChevronDown size={16} className="text-[#433422]/40" />}
          </button>
          {openCat === '__uncategorized' && (
            <div className="border-t border-[#E9DCC9] divide-y divide-[#E9DCC9]">
              {uncategorized.map(c => (
                <div key={c.id}>
                  {editing === c.id ? (
                    <div className="p-3">
                      <LibraryCardForm
                        initial={c}
                        categories={categories}
                        onSave={() => setEditing(null)}
                        onCancel={() => setEditing(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-[10px] flex-shrink-0" style={{ backgroundColor: c.color || '#E9DCC9' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#433422] truncate">{c.title}</p>
                        <p className="text-[10px] text-[#D4A373]/80 font-mono">{c.category || 'no category'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditing(c.id)} className="p-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors">
                          <PenLine size={15} className="text-[#433422]/50" />
                        </button>
                        <button onClick={() => handleDelete(c)} disabled={deleting === c.id} className="p-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors disabled:opacity-40">
                          <Trash2 size={15} className="text-[#433422]/50" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && cards.length === 0 && !showForm && (
        <p className="text-center text-[#433422]/30 text-sm py-4">
          {categories.length === 0 ? 'Create a category above, then add cards here.' : 'No cards yet.'}
        </p>
      )}
    </div>
  );
}

// ── Admin Dashboard ────────────────────────────────────────

const AdminDashboard = ({ user, profile, onBack }) => {
  return (
    <div className="min-h-screen bg-[#FDF9F3] font-sans text-[#433422]">

      {/* Header */}
      <header className="bg-[#433422] text-[#FDF9F3] px-6 pt-14 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <ArrowLeft size={15} className="text-[#FDF9F3]" />
              </button>
            )}
            <div>
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#FDF9F3]/50">PRAYVAIL</p>
              <h1 className="text-2xl font-serif">Admin</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-[#FDF9F3]/70">{profile?.name || user?.displayName || 'Admin'}</p>
            <p className="text-[10px] text-[#D4A373]">GOD MODE</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-5 py-6 pb-16 space-y-5">
        <CategoryManager />
        <LibraryTab />
      </main>
    </div>
  );
};

export default AdminDashboard;
