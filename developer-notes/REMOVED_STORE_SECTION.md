# Removed: Support Store Section

**Location:** `src/pages/PrevailHome.jsx` — inside the `view === 'explore'` render block

## What was removed

### 1. `storeItems` data array

```jsx
const storeItems = [
  { title: 'Prayvail Journal', label: 'STATIONERY', duration: '90-day guided journal', color: '#E9DCC9', coming: true },
  { title: 'Supporter Tee', label: 'APPAREL', duration: 'Wear the mission', color: '#D4A373', coming: true },
  { title: 'Support the Mission', label: 'DONATION', duration: 'Help us grow', color: '#B0A898', coming: true },
  { blank: true },
];
```

### 2. Store JSX section (rendered below Minigames in the Explore view)

```jsx
{/* Support Store */}
<section className="px-8">
  <div className="flex items-center justify-between mb-5">
    <div>
      <p className="text-[10px] tracking-[0.3em] font-bold text-[#433422]/40">SUPPORT</p>
      <h2 className="text-xl font-serif">Store</h2>
    </div>
    <div className="w-9 h-9 rounded-xl bg-[#F4EFE6] flex items-center justify-center">
      <ShoppingBag size={17} className="text-[#D4A373]" />
    </div>
  </div>
  <div className="grid grid-cols-3 gap-2">
    {storeItems.map((s, i) => <ResourceCard key={i} {...s} />)}
  </div>
</section>
```

### 3. `ShoppingBag` icon import

Removed from the `lucide-react` import block at the top of `PrevailHome.jsx`:
```js
ShoppingBag,
```

## Notes

- All three store items were marked `coming: true` (rendered with a "SOON" badge via `ResourceCard`).
- The blank fourth card (`{ blank: true }`) was a grid placeholder.
- `ResourceCard` itself (`src/components/ResourceCard.jsx`) was **not** removed — it is still used in the Resources view.
- The Explore page header, Minigames section, and bottom nav are unchanged.

## To re-add

1. Restore the `ShoppingBag` import in the `lucide-react` block.
2. Re-insert the `storeItems` array before the `return (` inside the `view === 'explore'` block.
3. Re-insert the `{/* Support Store */}` section inside `<main>` after the Minigames section, before `</main>`.
