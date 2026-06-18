import { useState, useRef, useEffect } from 'react';
import { Reorder, useDragControls, AnimatePresence, motion } from 'framer-motion';
import { useAllLibraryCards, useCategories } from '../hooks/useContent';
import {
  saveLibraryCard, deleteLibraryCard, uploadFile,
  saveCategory, deleteCategory,
} from '../services/content';
import ResourceCard from '../components/ResourceCard';
import {
  Plus, Trash2, PenLine, Eye, EyeOff,
  Upload, X, ArrowLeft, List, GripVertical,
  Headphones, ChevronRight,
} from 'lucide-react';

const CARD_COLORS = ['#E9DCC9', '#D9C9B5', '#D4A373', '#C4B5A0', '#8E9775', '#B0A898', '#D4C5B2', '#C4A882'];
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
const mkKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const ensureKeys = (tracks = []) => tracks.map(t => t._key ? t : { ...t, _key: mkKey() });

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

// ─── AddCardTile ──────────────────────────────────────────────────────────────
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

// ─── AdminResourceCard ────────────────────────────────────────────────────────
// Wraps ResourceCard with admin-only overlays: drag handle, publish toggle, draft badge
function AdminResourceCard({ card, onEdit, onTogglePublish, dragControls }) {
  return (
    <div className="relative">
      <ResourceCard
        {...card}
        completed={false}
        inPath={false}
        lockedToday={false}
        onClick={onEdit}
        onLongPress={undefined}
        onContextMenu={undefined}
      />
      {/* Drag handle — top-left, above ResourceCard's z-10 elements */}
      <div
        onPointerDown={e => { e.stopPropagation(); dragControls.start(e); }}
        className="absolute top-2 left-2 z-20 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <GripVertical size={10} className="text-white/80" />
      </div>
      {/* Quick publish toggle */}
      <button
        onClick={e => { e.stopPropagation(); onTogglePublish(); }}
        className={`absolute bottom-8 right-2 z-20 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${card.published ? 'bg-[#D4A373]' : 'bg-black/30 backdrop-blur-sm'}`}
      >
        {card.published ? <Eye size={9} className="text-white" /> : <EyeOff size={9} className="text-white/70" />}
      </button>
      {/* Draft badge */}
      {!card.published && (
        <div className="absolute top-2 right-2 z-20">
          <span className="text-[7px] font-bold tracking-widest bg-black/40 backdrop-blur-sm text-white/80 px-1.5 py-0.5 rounded-full">DRAFT</span>
        </div>
      )}
    </div>
  );
}

// ─── AdminCardItem — Reorder.Item wrapper for a card tile ─────────────────────
function AdminCardItem({ card, onEdit, onTogglePublish, onDragEnd }) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={card}
      dragControls={dragControls}
      dragListener={false}
      onDragEnd={onDragEnd}
      style={{ width: 'calc(33.333% - 5.34px)', touchAction: 'none' }}
      whileDrag={{ scale: 1.04, zIndex: 50, boxShadow: '0 8px 32px rgba(67,52,34,0.18)' }}
    >
      <AdminResourceCard
        card={card}
        onEdit={onEdit}
        onTogglePublish={onTogglePublish}
        dragControls={dragControls}
      />
    </Reorder.Item>
  );
}

// ─── TrackListRow — vertical list row matching the playlist sheet aesthetic ────
function TrackListRow({ track, index, isSelected, onSelect, dragControls }) {
  return (
    <div
      onClick={onSelect}
      className={`w-full flex items-center gap-3 rounded-[16px] px-3 py-3 border text-left cursor-pointer transition-all active:scale-[0.99] ${isSelected ? 'bg-[#FFFBF5] border-[#D4A373]/50' : 'bg-white border-[#E9DCC9] hover:border-[#D4A373]/30'}`}
    >
      <div
        onPointerDown={e => { e.stopPropagation(); dragControls.start(e); }}
        className="cursor-grab active:cursor-grabbing touch-none p-0.5 flex-shrink-0"
      >
        <GripVertical size={14} className="text-[#433422]/20" />
      </div>
      <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 overflow-hidden relative ${isSelected ? 'bg-[#D4A373]/15' : 'bg-[#F4EFE6]'}`}>
        {track.imageUrl
          ? <img src={track.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <Headphones size={12} className={isSelected ? 'text-[#D4A373]' : 'text-[#433422]/30'} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[9px] font-bold tracking-widest mb-0.5 ${isSelected ? 'text-[#D4A373]' : 'text-[#433422]/40'}`}>DAY {index + 1}</p>
        <p className="text-sm font-serif truncate text-[#433422]">{track.title || <span className="opacity-30 italic">Untitled</span>}</p>
        {track.duration && <p className="text-[9px] text-[#433422]/40">{track.duration}</p>}
      </div>
      <span className="text-[7px] font-bold tracking-widest bg-[#D4A373]/10 text-[#D4A373]/70 px-2 py-0.5 rounded-full uppercase flex-shrink-0">{track.trackType || 'audio'}</span>
      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#D4A373] flex-shrink-0" />}
    </div>
  );
}

// ─── TrackListItem — Reorder.Item wrapper for TrackListRow ───────────────────
function TrackListItem({ track, index, isSelected, onSelect, onDragEnd }) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={track}
      dragControls={dragControls}
      dragListener={false}
      onDragEnd={onDragEnd}
      style={{ touchAction: 'none' }}
      whileDrag={{ scale: 1.02, zIndex: 10, boxShadow: '0 4px 20px rgba(67,52,34,0.12)' }}
    >
      <TrackListRow
        track={track}
        index={index}
        isSelected={isSelected}
        onSelect={onSelect}
        dragControls={dragControls}
      />
    </Reorder.Item>
  );
}

// ─── CoverEditPanel ───────────────────────────────────────────────────────────
function CoverEditPanel({ form, set, categories, imgInputRef, imgProgress }) {
  return (
    <div className="px-5 pt-5 pb-8 space-y-5">
      {/* Image upload zone */}
      <div
        className="relative h-36 rounded-[20px] overflow-hidden cursor-pointer flex-shrink-0"
        style={{ backgroundColor: form.color || '#E9DCC9' }}
        onClick={() => imgInputRef.current?.click()}
      >
        {form.imageUrl && <img src={form.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="text-center text-white/80 pointer-events-none select-none">
            {imgProgress !== null
              ? <span className="font-bold text-sm">{imgProgress}%</span>
              : <>
                  <Upload size={18} className="mx-auto mb-1" />
                  <p className="text-xs">{form.imageUrl ? 'Tap to change image' : 'Tap to add cover image'}</p>
                </>
            }
          </div>
        </div>
        {form.imageUrl && (
          <button
            onClick={e => { e.stopPropagation(); set('imageUrl', ''); }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center z-10"
          >
            <X size={12} className="text-white" />
          </button>
        )}
      </div>

      <ColorPicker value={form.color} onChange={v => set('color', v)} />

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

      {/* Section + Duration */}
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

      {/* Visibility */}
      <div className="bg-white rounded-[20px] border border-[#E9DCC9] overflow-hidden">
        <div className="px-4 pt-4 pb-4">
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/40 mb-3">VISIBILITY</p>
          <div className="space-y-1 divide-y divide-[#F4EFE6]">
            <Toggle label="Coming Soon" subLabel="Show 'SOON' badge on tile" value={form.coming} onChange={v => set('coming', v)} color="#8E9775" />
            <Toggle label="Supporter Only" subLabel="Locked to supporter tier" value={form.tier === 'supporter'} onChange={v => set('tier', v ? 'supporter' : 'free')} color="#C4A882" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TrackEditPanel ───────────────────────────────────────────────────────────
function TrackEditPanel({ track, index, onChange, onDelete }) {
  return (
    <div className="px-5 pt-5 pb-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold tracking-widest text-[#433422]/40">DAY {index + 1}</p>
          <span className="text-[7px] font-bold tracking-widest bg-[#D4A373]/15 text-[#D4A373] px-2 py-0.5 rounded-full uppercase">{track.trackType || 'audio'}</span>
        </div>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-full bg-[#FEF2F2] flex items-center justify-center"
        >
          <Trash2 size={14} className="text-[#D4A373]" />
        </button>
      </div>

      <div>
        <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">TITLE</p>
        <input
          value={track.title || ''}
          onChange={e => onChange('title', e.target.value)}
          placeholder="Day title"
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
        />
      </div>

      <div>
        <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">DURATION</p>
        <input
          value={track.duration || ''}
          onChange={e => onChange('duration', e.target.value)}
          placeholder="8 min"
          className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none"
        />
      </div>
      <UploadField label="Audio (MP3)" accept="audio/*" value={track.audioUrl || ''} storagePath="library/audio" onUploaded={url => onChange('audioUrl', url)} />
      <UploadField label="Day Image (optional)" accept="image/*" value={track.imageUrl || ''} storagePath="library/images" onUploaded={url => onChange('imageUrl', url)} />
    </div>
  );
}

// ─── CardEditorSheet ──────────────────────────────────────────────────────────
const EMPTY_CARD = {
  title: '', label: '', category: '', duration: '', description: '',
  color: '#E9DCC9', imageUrl: '', published: false,
  coming: false, order: 0, type: 'playlist', tier: 'free',
  tracks: [],
};

function CardEditorSheet({ initial, categories, onSave, onCancel, onDelete }) {
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
      imageUrl: initial.imageUrl || '',
      published: !!initial.published,
      coming: !!initial.coming,
      order: initial.order ?? 0,
      type: 'playlist',
      tier: initial.tier || 'free',
      tracks: ensureKeys(initial.tracks || []),
    } : {}),
  }));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [selectedCard, setSelectedCard] = useState('cover');
  const [imgProgress, setImgProgress] = useState(null);
  const imgInputRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTrack = () => {
    const newTrack = { _key: mkKey(), title: '', audioUrl: '', imageUrl: '', duration: '', trackType: 'audio' };
    const newTracks = [...form.tracks, newTrack];
    set('tracks', newTracks);
    setSelectedCard(newTracks.length - 1);
  };

  const removeTrack = (i) => {
    set('tracks', form.tracks.filter((_, idx) => idx !== i));
    setSelectedCard('cover');
  };

  const updateTrack = (i, k, v) => set('tracks', form.tracks.map((t, idx) => idx === i ? { ...t, [k]: v } : t));

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

  const handlePublishToggle = () => {
    const next = !form.published;
    set('published', next);
    if (initial?.id) saveLibraryCard({ published: next }, initial.id).catch(() => {});
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
        type: 'playlist',
        tier: form.tier,
        audioUrl: '',
        tracks: form.tracks.map((t, i) => ({
          title: t.title,
          audioUrl: t.audioUrl || '',
          imageUrl: t.imageUrl || '',
          duration: t.duration || '',
          trackType: t.trackType || 'audio',
          order: i,
        })),
      };
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
      <div className="flex-shrink-0 pt-14 pb-4 px-5 flex items-center gap-3 border-b border-[#E9DCC9]">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-[#F4EFE6] transition-colors flex-shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold tracking-widest text-[#433422]/40">{initial?.id ? 'EDIT CARD' : 'NEW CARD'}</p>
          <p className="text-base font-serif truncate">{form.title || 'Untitled'}</p>
        </div>
        <button
          onClick={handlePublishToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors flex-shrink-0 ${form.published ? 'bg-[#D4A373] text-white' : 'bg-[#E9DCC9]/80 text-[#433422]/50'}`}
        >
          {form.published ? <Eye size={11} /> : <EyeOff size={11} />}
          {form.published ? 'Live' : 'Draft'}
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* ── Cover card ── */}
        <div className="px-5 pt-5 pb-3">
          <div
            onClick={() => setSelectedCard('cover')}
            className={`relative h-28 rounded-[20px] overflow-hidden cursor-pointer transition-all ${selectedCard === 'cover' ? 'ring-2 ring-[#D4A373]' : ''}`}
            style={{ backgroundColor: form.color || '#D4A373' }}
          >
            {form.imageUrl && <img src={form.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-10">
              {form.label && <p className="text-[8px] font-bold tracking-widest text-white/50 mb-1 uppercase">{form.label}</p>}
              <p className="text-lg font-serif text-white leading-tight">{form.title || <span className="opacity-40">Untitled journey</span>}</p>
              <p className="text-white/40 text-[10px] mt-0.5">{form.tracks.length} day{form.tracks.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="absolute top-3 right-3 z-10">
              <span className="text-[7px] font-bold tracking-widest text-white/50 bg-black/20 px-2 py-0.5 rounded-full">
                {selectedCard === 'cover' ? 'EDITING ↓' : 'TAP TO EDIT'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Track list ── */}
        <div className="px-5 pb-4">
          <p className="text-[9px] font-bold tracking-widest text-[#433422]/35 mb-3">DAYS — tap to edit, drag to reorder</p>
          <Reorder.Group
            axis="y"
            values={form.tracks}
            onReorder={newTracks => set('tracks', newTracks)}
            className="space-y-2"
            style={{ touchAction: 'none' }}
          >
            {form.tracks.map((track, i) => (
              <TrackListItem
                key={track._key}
                track={track}
                index={i}
                isSelected={selectedCard === i}
                onSelect={() => setSelectedCard(i)}
              />
            ))}
          </Reorder.Group>
          <button
            onClick={addTrack}
            className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-[16px] border-2 border-dashed border-[#D4A373]/30 text-[#D4A373]/60 text-xs font-bold tracking-widest hover:border-[#D4A373]/50 hover:bg-[#D4A373]/5 transition-colors"
          >
            <Plus size={14} /> ADD DAY
          </button>
        </div>

        <div className="h-px bg-[#E9DCC9] mx-5 mb-1" />

        {/* ── Edit panel ── */}
        <AnimatePresence mode="wait">
          {selectedCard === 'cover' ? (
            <motion.div
              key="cover"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
            >
              <CoverEditPanel
                form={form}
                set={set}
                categories={categories}
                imgInputRef={imgInputRef}
                imgProgress={imgProgress}
              />
            </motion.div>
          ) : typeof selectedCard === 'number' && form.tracks[selectedCard] ? (
            <motion.div
              key={`track-${selectedCard}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
            >
              <TrackEditPanel
                track={form.tracks[selectedCard]}
                index={selectedCard}
                onChange={(k, v) => updateTrack(selectedCard, k, v)}
                onDelete={() => removeTrack(selectedCard)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {error && <p className="text-red-400 text-sm px-5 pb-4">{error}</p>}
      </div>

      {/* Sticky footer */}
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
            <Trash2 size={12} /> Confirm Delete
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

      <input ref={imgInputRef} type="file" accept="image/*" onChange={handleCoverImage} className="hidden" />
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

// ─── AdminSectionItem — Reorder.Item wrapper for a section ───────────────────
function AdminSectionItem({
  cat, cards, isEditingSection,
  onEditSection, onCancelEditSection, onSaveSection, sectionSaving,
  onDeleteSection, isDeletingSection,
  onEditCard, onNewCard, onTogglePublish, onCardDragEnd,
}) {
  const dragControls = useDragControls();
  const [localCards, setLocalCards] = useState(cards);

  // Sync local card order from Firestore when not dragging
  const draggingRef = useRef(false);
  useEffect(() => {
    if (!draggingRef.current) setLocalCards(cards);
  }, [cards]);

  const handleCardReorder = (newOrder) => {
    draggingRef.current = true;
    setLocalCards(newOrder);
  };

  const handleCardDragEnd = async () => {
    draggingRef.current = false;
    await onCardDragEnd(localCards);
  };

  return (
    <Reorder.Item
      value={cat}
      dragControls={dragControls}
      dragListener={false}
      style={{ touchAction: 'none' }}
      whileDrag={{ scale: 1.01, opacity: 0.9 }}
    >
      {/* Section header */}
      <div className="px-6 mb-4">
        {isEditingSection ? (
          <div className="bg-[#F4EFE6]/70 rounded-[16px] p-4">
            <p className="text-[9px] font-bold tracking-widest text-[#433422]/40 mb-3">EDIT SECTION</p>
            <SectionForm
              initial={cat}
              onSave={onSaveSection}
              onCancel={onCancelEditSection}
              saving={sectionSaving}
              onDelete={onDeleteSection}
              isDeleting={isDeletingSection}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* Drag handle */}
            <div
              onPointerDown={e => dragControls.start(e)}
              className="cursor-grab active:cursor-grabbing touch-none p-1 flex-shrink-0 -ml-1"
            >
              <GripVertical size={16} className="text-[#433422]/25" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">{cat.sectionTag || 'SERIES'}</p>
              <h2 className="text-xl font-serif">{cat.name}</h2>
            </div>
            <button
              onClick={() => onEditSection(cat.id)}
              className="p-1.5 rounded-lg hover:bg-[#F4EFE6] transition-colors flex-shrink-0"
            >
              <PenLine size={14} className="text-[#433422]/50" />
            </button>
          </div>
        )}
      </div>

      {/* Card grid */}
      {!isEditingSection && (
        <div className="px-6">
          <Reorder.Group
            axis="x"
            values={localCards}
            onReorder={handleCardReorder}
            className="flex flex-wrap gap-2"
            style={{ touchAction: 'none' }}
          >
            {localCards.map(card => (
              <AdminCardItem
                key={card.id}
                card={card}
                onEdit={() => onEditCard(card)}
                onTogglePublish={() => onTogglePublish(card)}
                onDragEnd={handleCardDragEnd}
              />
            ))}
          </Reorder.Group>
          {/* Add card tile sits outside Reorder.Group */}
          <div className="mt-2" style={{ width: 'calc(33.333% - 5.34px)' }}>
            <AddCardTile onClick={() => onNewCard(cat.value)} />
          </div>
        </div>
      )}
    </Reorder.Item>
  );
}

// ─── SpaceCardEditorSheet — article/audio editor for Twilight & Life Box ──────
function SpaceCardEditorSheet({ initial, category, onSave, onCancel, onDelete }) {
  const [contentType, setContentType] = useState(initial?.type === 'article' ? 'article' : 'audio');
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    content: initial?.content || '',
    duration: initial?.duration || '',
    color: initial?.color || '#E9DCC9',
    imageUrl: initial?.imageUrl || '',
    published: !!initial?.published,
    coming: !!initial?.coming,
    tier: initial?.tier || 'free',
    order: initial?.order ?? 0,
    tracks: ensureKeys(initial?.tracks || []),
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('cover');
  const [imgProgress, setImgProgress] = useState(null);
  const imgInputRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTrack = () => {
    const t = { _key: mkKey(), title: '', audioUrl: '', imageUrl: '', duration: '', trackType: 'audio' };
    const next = [...form.tracks, t];
    set('tracks', next);
    setSelectedTrack(next.length - 1);
  };

  const removeTrack = (i) => { set('tracks', form.tracks.filter((_, idx) => idx !== i)); setSelectedTrack('cover'); };
  const updateTrack = (i, k, v) => set('tracks', form.tracks.map((t, idx) => idx === i ? { ...t, [k]: v } : t));

  const handleCoverImage = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImgProgress(0);
    try { const url = await uploadFile(file, `library/images/${Date.now()}_${file.name}`, setImgProgress); set('imageUrl', url); }
    catch {} finally { setImgProgress(null); }
  };

  const handlePublishToggle = () => {
    const next = !form.published; set('published', next);
    if (initial?.id) saveLibraryCard({ published: next }, initial.id).catch(() => {});
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        title: form.title.trim(),
        label: '',
        category,
        duration: contentType === 'audio' ? form.duration.trim() : '',
        description: form.description.trim(),
        content: contentType === 'article' ? form.content : '',
        color: form.color || '#E9DCC9',
        imageUrl: form.imageUrl || '',
        published: !!form.published,
        coming: !!form.coming,
        order: Number(form.order) || 0,
        type: contentType === 'article' ? 'article' : 'playlist',
        tier: form.tier,
        audioUrl: '',
        tracks: contentType === 'article' ? [] : form.tracks.map((t, i) => ({
          title: t.title, audioUrl: t.audioUrl || '', imageUrl: t.imageUrl || '',
          duration: t.duration || '', trackType: t.trackType || 'audio', order: i,
        })),
      };
      await saveLibraryCard(payload, initial?.id);
      onSave();
    } catch { setError('Save failed. Check Firestore rules.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FDF9F3] font-sans text-[#433422] flex flex-col animate-sheet-enter">
      {/* Header */}
      <div className="flex-shrink-0 pt-14 pb-4 px-5 flex items-center gap-3 border-b border-[#E9DCC9]">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-[#F4EFE6] transition-colors flex-shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold tracking-widest text-[#433422]/40">{initial?.id ? 'EDIT' : 'NEW'}</p>
          <p className="text-base font-serif truncate">{form.title || 'Untitled'}</p>
        </div>
        <button onClick={handlePublishToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-colors flex-shrink-0 ${form.published ? 'bg-[#D4A373] text-white' : 'bg-[#E9DCC9]/80 text-[#433422]/50'}`}>
          {form.published ? <Eye size={11} /> : <EyeOff size={11} />}
          {form.published ? 'Live' : 'Draft'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 space-y-5">
        {/* Type toggle */}
        <div className="px-5 pt-5">
          <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-2">CONTENT TYPE</p>
          <div className="flex gap-2">
            {[{ v: 'audio', label: '🎧 Audio' }, { v: 'article', label: '📖 Article' }].map(({ v, label }) => (
              <button key={v} onClick={() => { setContentType(v); setSelectedTrack('cover'); }}
                className={`flex-1 py-2.5 rounded-[14px] text-sm font-bold transition-colors ${contentType === v ? 'bg-[#433422] text-[#FDF9F3]' : 'bg-[#F4EFE6] text-[#433422]/50'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cover image */}
        <div className="px-5">
          <div className="relative h-36 rounded-[20px] overflow-hidden cursor-pointer"
            style={{ backgroundColor: form.color || '#E9DCC9' }}
            onClick={() => imgInputRef.current?.click()}>
            {form.imageUrl && <img src={form.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-center text-white/80 select-none pointer-events-none">
                {imgProgress !== null ? <span className="font-bold text-sm">{imgProgress}%</span>
                  : <><Upload size={18} className="mx-auto mb-1" /><p className="text-xs">{form.imageUrl ? 'Tap to change' : 'Add cover image'}</p></>}
              </div>
            </div>
            {form.imageUrl && (
              <button onClick={e => { e.stopPropagation(); set('imageUrl', ''); }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center z-10">
                <X size={12} className="text-white" />
              </button>
            )}
          </div>
        </div>

        <div className="px-5 space-y-4">
          <ColorPicker value={form.color} onChange={v => set('color', v)} />

          <div>
            <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">TITLE *</p>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Title"
              className="w-full bg-white rounded-xl px-4 py-3 text-lg font-serif border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none" />
          </div>

          <div>
            <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">
              DESCRIPTION {contentType === 'article' ? <span className="font-normal opacity-50">(teaser shown in card list)</span> : ''}
            </p>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Brief description…" rows={2}
              className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none resize-none" />
          </div>

          {contentType === 'audio' && (
            <div>
              <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">DURATION</p>
              <input value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="45 min"
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none" />
            </div>
          )}

          {contentType === 'article' && (
            <div>
              <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">ARTICLE BODY</p>
              <textarea value={form.content} onChange={e => set('content', e.target.value)}
                placeholder="Write the full article here…" rows={14}
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none resize-none leading-relaxed" />
            </div>
          )}

          {contentType === 'audio' && (
            <div>
              <p className="text-[9px] font-bold tracking-widest text-[#433422]/35 mb-3">TRACKS — tap to edit</p>
              <Reorder.Group axis="y" values={form.tracks} onReorder={t => set('tracks', t)}
                className="space-y-2" style={{ touchAction: 'none' }}>
                {form.tracks.map((track, i) => (
                  <TrackListItem key={track._key} track={track} index={i}
                    isSelected={selectedTrack === i} onSelect={() => setSelectedTrack(i)} />
                ))}
              </Reorder.Group>
              <button onClick={addTrack}
                className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-[16px] border-2 border-dashed border-[#D4A373]/30 text-[#D4A373]/60 text-xs font-bold tracking-widest hover:border-[#D4A373]/50 transition-colors">
                <Plus size={14} /> ADD TRACK
              </button>
              {typeof selectedTrack === 'number' && form.tracks[selectedTrack] && (
                <div className="mt-3 rounded-[20px] border border-[#E9DCC9] overflow-hidden">
                  <TrackEditPanel track={form.tracks[selectedTrack]} index={selectedTrack}
                    onChange={(k, v) => updateTrack(selectedTrack, k, v)}
                    onDelete={() => removeTrack(selectedTrack)} />
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-[20px] border border-[#E9DCC9] overflow-hidden">
            <div className="px-4 pt-4 pb-4">
              <p className="text-[10px] tracking-widest font-bold text-[#433422]/40 mb-3">VISIBILITY</p>
              <div className="space-y-1 divide-y divide-[#F4EFE6]">
                <Toggle label="Coming Soon" subLabel="Show 'SOON' badge" value={form.coming} onChange={v => set('coming', v)} color="#8E9775" />
                <Toggle label="Supporter Only" subLabel="Locked to supporter tier" value={form.tier === 'supporter'} onChange={v => set('tier', v ? 'supporter' : 'free')} color="#C4A882" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] tracking-widest font-bold text-[#433422]/50 mb-1">ORDER</p>
            <input type="number" value={form.order} onChange={e => set('order', e.target.value)} placeholder="0"
              className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-[#E9DCC9] focus:border-[#D4A373] focus:outline-none" />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-[#E9DCC9] bg-[#FDF9F3]/95 backdrop-blur-md px-5 py-4 flex gap-3">
        {initial?.id && !confirmDelete && (
          <button onClick={() => setConfirmDelete(true)}
            className="w-11 h-11 rounded-full bg-[#FEF2F2] flex items-center justify-center flex-shrink-0">
            <Trash2 size={16} className="text-[#D4A373]" />
          </button>
        )}
        {confirmDelete && (
          <button onClick={onDelete}
            className="flex items-center gap-1.5 px-4 h-11 rounded-full bg-red-500 text-white text-xs font-bold flex-shrink-0">
            <Trash2 size={12} /> Confirm Delete
          </button>
        )}
        {confirmDelete && (
          <button onClick={() => setConfirmDelete(false)}
            className="h-11 px-4 rounded-full bg-[#E9DCC9]/60 text-[#433422]/60 text-xs font-bold flex-shrink-0">
            Cancel
          </button>
        )}
        {!confirmDelete && (
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 bg-[#433422] text-[#FDF9F3] rounded-[20px] font-bold text-sm disabled:opacity-50">
            {saving ? 'Saving…' : initial?.id ? 'Save Changes' : 'Create'}
          </button>
        )}
      </div>

      <input ref={imgInputRef} type="file" accept="image/*" onChange={handleCoverImage} className="hidden" />
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
const SPACE_CONFIG = {
  twilight: {
    label: '🌙 Twilight Space',
    sub: 'Sleep meditations, evening prayer, night scripture',
    headerBg: 'linear-gradient(135deg, #0E1221 0%, #1a2240 100%)',
    accent: '#9B8FD4',
    iconColor: '#C4B9E8',
  },
  lifebox: {
    label: '📖 Life Box',
    sub: 'Grief, marriage, transitions, purpose & more',
    headerBg: 'linear-gradient(135deg, #1a2418 0%, #0f1a0e 100%)',
    accent: '#8E9775',
    iconColor: '#A8C898',
  },
};

const AdminDashboard = ({ user, profile, onBack }) => {
  const { cards } = useAllLibraryCards();
  const { categories: firestoreCategories } = useCategories();

  const [localCategories, setLocalCategories] = useState([]);
  const isDraggingSectionRef = useRef(false);

  useEffect(() => {
    if (!isDraggingSectionRef.current) setLocalCategories(firestoreCategories);
  }, [firestoreCategories]);

  // adminSection: null = landing, 'library' = main library, 'twilight' | 'lifebox' = space editor
  const [adminSection, setAdminSection] = useState(null);
  const [editingCard, setEditingCard] = useState(null);         // for library (CardEditorSheet)
  const [editingSpaceCard, setEditingSpaceCard] = useState(null); // for spaces (SpaceCardEditorSheet)
  const [editingSection, setEditingSection] = useState(null);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [deletingSection, setDeletingSection] = useState(null);
  const [togglingPublish, setTogglingPublish] = useState(new Set());

  // Ref to hold latest category order during drag
  const localCategoriesRef = useRef([]);

  const handleSectionReorder = (newOrder) => {
    isDraggingSectionRef.current = true;
    setLocalCategories(newOrder);
    localCategoriesRef.current = newOrder;
  };

  const handleSectionDragEnd = async () => {
    isDraggingSectionRef.current = false;
    await Promise.all(
      localCategoriesRef.current.map((cat, i) => saveCategory({ order: i }, cat.id))
    ).catch(() => {});
  };

  const handleCardDragEnd = async (catId, reorderedCards) => {
    await Promise.all(
      reorderedCards.map((card, i) => saveLibraryCard({ order: i }, card.id))
    ).catch(() => {});
  };

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
      const existing = id ? firestoreCategories.find(c => c.id === id) : null;
      const payload = {
        name: form.name.trim(),
        value: slugify(form.value),
        labelTag: (form.labelTag.trim() || form.name.trim()).toUpperCase(),
        sectionTag: (form.sectionTag.trim() || 'SERIES').toUpperCase(),
        order: existing?.order ?? firestoreCategories.length,
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

  const knownValues = new Set(firestoreCategories.map(c => c.value));
  const uncategorized = cards.filter(c => !knownValues.has(c.category) && c.category !== 'twilight' && c.category !== 'lifebox');


  // ── Landing ────────────────────────────────────────────────────────────────
  if (!adminSection) {
    return (
      <div className="min-h-screen bg-[#FDF9F3] font-sans text-[#433422]">
        <header className="relative bg-[#433422] flex items-end px-6 pb-12 pt-14">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#D4A373]/10 rounded-full blur-3xl" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
            <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="w-full h-8">
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
                <h1 className="text-2xl font-serif text-[#FDF9F3]">Content Editor</h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-[#FDF9F3]/70">{profile?.name || user?.displayName || 'Admin'}</p>
              <p className="text-[10px] text-[#D4A373]">GOD MODE</p>
            </div>
          </div>
        </header>

        <div className="px-6 pt-8 pb-12 space-y-4">
          <p className="text-[9px] font-bold tracking-[0.3em] text-[#433422]/35 mb-6">CHOOSE A SECTION</p>

          {/* Main Library */}
          <button onClick={() => setAdminSection('library')}
            className="w-full flex items-center gap-4 rounded-[24px] px-5 py-5 text-left active:scale-[0.98] transition-transform border border-[#E9DCC9] bg-white">
            <div className="w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(212,163,115,0.12)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-lg text-[#433422]">Main Library</p>
              <p className="text-[11px] text-[#433422]/40 mt-0.5">Journeys, series, and playlists for the path</p>
            </div>
            <List size={16} className="text-[#433422]/25 flex-shrink-0" />
          </button>

          {/* Twilight Space */}
          <button onClick={() => setAdminSection('twilight')}
            className="w-full flex items-center gap-4 rounded-[24px] px-5 py-5 text-left active:scale-[0.98] transition-transform overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #0E1221 0%, #1a2240 100%)' }}>
            <div className="w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(155,143,212,0.15)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4B9E8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-lg" style={{ color: '#EEE8FF' }}>Twilight Space</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(196,185,255,0.45)' }}>Sleep meditations, evening prayer, night scripture</p>
            </div>
            <ChevronRight size={16} style={{ color: 'rgba(196,185,255,0.3)' }} className="flex-shrink-0" />
          </button>

          {/* Life Box */}
          <button onClick={() => setAdminSection('lifebox')}
            className="w-full flex items-center gap-4 rounded-[24px] px-5 py-5 text-left active:scale-[0.98] transition-transform overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a2418 0%, #0f1a0e 100%)' }}>
            <div className="w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(142,151,117,0.15)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A8C898" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-lg" style={{ color: '#FDF9F3' }}>Life Box</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(168,200,152,0.5)' }}>Grief, marriage, transitions, purpose &amp; more</p>
            </div>
            <ChevronRight size={16} style={{ color: 'rgba(168,200,152,0.3)' }} className="flex-shrink-0" />
          </button>
        </div>
      </div>
    );
  }

  // ── Space editor (Twilight or Life Box) ───────────────────────────────────
  if (adminSection === 'twilight' || adminSection === 'lifebox') {
    const cfg = SPACE_CONFIG[adminSection];
    const spaceCards = cards.filter(c => c.category === adminSection).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
      <div className="min-h-screen bg-[#FDF9F3] font-sans text-[#433422]">
        {/* Themed space header */}
        <header className="relative flex items-end px-6 pb-12 pt-14" style={{ background: cfg.headerBg }}>
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
            <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="w-full h-8">
              <path d="M0,40 L0,20 C80,4 160,36 240,16 C300,2 360,32 400,20 L400,40 Z" fill="#FDF9F3" />
            </svg>
          </div>
          <div className="relative z-10 flex items-end justify-between w-full">
            <div className="flex items-center gap-3">
              <button onClick={() => setAdminSection(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ backgroundColor: `${cfg.accent}22` }}>
                <ArrowLeft size={15} style={{ color: cfg.iconColor }} />
              </button>
              <div>
                <p className="text-[10px] tracking-[0.3em] font-bold" style={{ color: `${cfg.iconColor}66` }}>PRAYVAIL</p>
                <h1 className="text-2xl font-serif" style={{ color: '#FDF9F3' }}>{cfg.label}</h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: `${cfg.iconColor}80` }}>{profile?.name || user?.displayName || 'Admin'}</p>
              <p className="text-[10px]" style={{ color: cfg.accent }}>GOD MODE</p>
            </div>
          </div>
        </header>

        <main className="pt-6 pb-40 px-6 space-y-3">
          {spaceCards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <p className="text-sm text-[#433422]/30 font-serif">No content yet.</p>
              <p className="text-[10px] text-[#433422]/25">Tap "Add Content" below to get started.</p>
            </div>
          )}

          {spaceCards.map(card => (
            <div key={card.id} className="flex items-center gap-3 rounded-[20px] px-4 py-3 border border-[#E9DCC9] bg-white">
              {card.imageUrl
                ? <img src={card.imageUrl} alt="" className="w-12 h-12 rounded-[14px] object-cover flex-shrink-0" />
                : <div className="w-12 h-12 rounded-[14px] flex-shrink-0" style={{ backgroundColor: card.color || '#E9DCC9' }} />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif truncate text-[#433422]">{card.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded-full ${card.published ? 'bg-[#D4A373]/15 text-[#D4A373]' : 'bg-[#433422]/8 text-[#433422]/30'}`}>
                    {card.published ? 'LIVE' : 'DRAFT'}
                  </span>
                  <span className="text-[8px] text-[#433422]/30 uppercase tracking-widest">
                    {card.type === 'article' ? '📖 Article' : `🎧 ${(card.tracks || []).length} track${(card.tracks || []).length !== 1 ? 's' : ''}`}
                  </span>
                  {card.duration && <span className="text-[9px] text-[#433422]/30">{card.duration}</span>}
                </div>
              </div>
              <button onClick={() => handleTogglePublish(card)}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${card.published ? 'bg-[#D4A373]' : 'bg-[#F4EFE6]'}`}>
                {card.published ? <Eye size={12} className="text-white" /> : <EyeOff size={12} className="text-[#433422]/40" />}
              </button>
              <button onClick={() => setEditingSpaceCard(card)}
                className="w-8 h-8 rounded-full bg-[#F4EFE6] flex items-center justify-center flex-shrink-0">
                <PenLine size={12} className="text-[#433422]/50" />
              </button>
            </div>
          ))}
        </main>

        {/* Add Content bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#FDF9F3]/95 backdrop-blur-md border-t border-[#E9DCC9] z-30 px-6 py-4">
          <button onClick={() => setEditingSpaceCard({ _new: true })}
            className="w-full py-3.5 flex items-center justify-center gap-2 text-[#FDF9F3] rounded-[20px] text-sm font-bold"
            style={{ backgroundColor: '#433422' }}>
            <Plus size={16} /> Add Content
          </button>
        </div>

        {/* Space card editor */}
        {editingSpaceCard && (
          <SpaceCardEditorSheet
            initial={editingSpaceCard._new ? null : editingSpaceCard}
            category={adminSection}
            onSave={() => setEditingSpaceCard(null)}
            onCancel={() => setEditingSpaceCard(null)}
            onDelete={editingSpaceCard._new ? undefined : async () => {
              try { await deleteLibraryCard(editingSpaceCard.id, editingSpaceCard); } catch {}
              setEditingSpaceCard(null);
            }}
          />
        )}
      </div>
    );
  }

  // ── Main Library editor ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDF9F3] font-sans text-[#433422]">
      <header className="relative bg-[#433422] flex items-end px-6 pb-12 pt-14">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#D4A373]/10 rounded-full blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="w-full h-8">
            <path d="M0,40 L0,20 C80,4 160,36 240,16 C300,2 360,32 400,20 L400,40 Z" fill="#FDF9F3" />
          </svg>
        </div>
        <div className="relative z-10 flex items-end justify-between w-full">
          <div className="flex items-center gap-3">
            <button onClick={() => setAdminSection(null)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ArrowLeft size={15} className="text-[#FDF9F3]" />
            </button>
            <div>
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#FDF9F3]/50">PRAYVAIL</p>
              <h1 className="text-2xl font-serif text-[#FDF9F3]">Main Library</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-[#FDF9F3]/70">{profile?.name || user?.displayName || 'Admin'}</p>
            <p className="text-[10px] text-[#D4A373]">GOD MODE</p>
          </div>
        </div>
      </header>

      <main className="pt-8 pb-40">
        {localCategories.length === 0 && uncategorized.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#F4EFE6] flex items-center justify-center">
              <Plus size={24} className="text-[#D4A373]" />
            </div>
            <p className="text-[#433422]/50 text-sm leading-relaxed">
              Tap <strong>Add Section</strong> below to create your first library section, then add cards inside it.
            </p>
          </div>
        )}

        <Reorder.Group axis="y" values={localCategories} onReorder={handleSectionReorder} className="space-y-10">
          {localCategories.map((cat) => {
            const catCards = cards.filter(c => c.category === cat.value).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            return (
              <AdminSectionItem
                key={cat.id}
                cat={cat}
                cards={catCards}
                isEditingSection={editingSection === cat.id}
                onEditSection={() => setEditingSection(cat.id)}
                onCancelEditSection={() => setEditingSection(null)}
                onSaveSection={handleSaveSection}
                sectionSaving={sectionSaving}
                onDeleteSection={() => handleDeleteSection(cat.id)}
                isDeletingSection={deletingSection === cat.id}
                onEditCard={(card) => setEditingCard(card)}
                onNewCard={(catValue) => setEditingCard({ _new: true, category: catValue })}
                onTogglePublish={handleTogglePublish}
                onCardDragEnd={(reordered) => handleCardDragEnd(cat.id, reordered)}
              />
            );
          })}
        </Reorder.Group>
        <div onDragStart={handleSectionDragEnd} style={{ display: 'none' }} />

        {uncategorized.length > 0 && (
          <section className="mt-10">
            <div className="px-6 mb-4">
              <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">UNLINKED</p>
              <h2 className="text-xl font-serif">Uncategorized</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 px-6">
              {uncategorized.map(c => (
                <div key={c.id} className="relative">
                  <ResourceCard {...c} completed={false} inPath={false} lockedToday={false} onClick={() => setEditingCard(c)} />
                  <button onClick={e => { e.stopPropagation(); handleTogglePublish(c); }}
                    className={`absolute bottom-8 right-2 z-20 w-5 h-5 rounded-full flex items-center justify-center ${c.published ? 'bg-[#D4A373]' : 'bg-black/30 backdrop-blur-sm'}`}>
                    {c.published ? <Eye size={9} className="text-white" /> : <EyeOff size={9} className="text-white/70" />}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Add Section bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FDF9F3]/95 backdrop-blur-md border-t border-[#E9DCC9] z-30">
        <AnimatePresence mode="wait">
          {editingSection === 'new' ? (
            <motion.div key="new-section-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="p-5">
              <p className="text-[9px] font-bold tracking-widest text-[#433422]/40 mb-3">NEW SECTION</p>
              <SectionForm onSave={handleSaveSection} onCancel={() => setEditingSection(null)} saving={sectionSaving} />
            </motion.div>
          ) : (
            <motion.div key="add-section-bar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-6 py-4">
              <button onClick={() => setEditingSection('new')}
                className="w-full py-3.5 flex items-center justify-center gap-2 bg-[#433422] text-[#FDF9F3] rounded-[20px] text-sm font-bold">
                <Plus size={16} /> Add Section
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card editor sheet */}
      {editingCard && (
        <CardEditorSheet
          initial={editingCard._new ? { category: editingCard.category } : editingCard}
          categories={firestoreCategories}
          onSave={() => setEditingCard(null)}
          onCancel={() => setEditingCard(null)}
          onDelete={editingCard._new ? undefined : () => handleDeleteCard(editingCard)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
