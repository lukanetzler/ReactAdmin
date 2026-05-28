import { useState, useEffect } from 'react';
import { ArrowLeft, Crown, Check, RotateCcw } from 'lucide-react';
import { getOfferings, purchasePackage, restorePurchases, isNative } from '../services/purchases';

const FEATURES = [
  { label: 'Unlimited journeys', sub: 'Every series, past and future' },
  { label: 'Deeper reflection tools', sub: 'Extended journal prompts & check-ins' },
  { label: 'Supporter content', sub: 'Our gratitude for keeping this alive' },
];

// Heuristic: annual packages usually have 'annual' or 'year' in the identifier/period
function isAnnual(pkg) {
  const id = (pkg.identifier + (pkg.product?.subscriptionPeriod ?? '')).toLowerCase();
  return id.includes('annual') || id.includes('year') || id.includes('p1y');
}

export default function Paywall({ onBack, onPurchased }) {
  const [packages, setPackages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const pkgs = await getOfferings();
      setPackages(pkgs);
      // Default: prefer annual, fall back to first
      const annual = pkgs.find(isAnnual);
      setSelected(annual ?? pkgs[0] ?? null);
      setLoading(false);
    })();
  }, []);

  const handlePurchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    setError(null);
    try {
      const purchased = await purchasePackage(selected);
      if (purchased) onPurchased();
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setError(null);
    const restored = await restorePurchases();
    setRestoring(false);
    if (restored) { onPurchased(); } else { setError('No active subscription found.'); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF9F3] text-[#433422] font-sans animate-view-enter">

      {/* Hero */}
      <div className="relative bg-[#E9DCC9] flex flex-col justify-end px-8 pb-10 pt-20 overflow-hidden" style={{ minHeight: '34vh' }}>
        <div className="absolute top-[-15%] right-[-10%] w-72 h-72 bg-[#D4A373]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-5%] w-56 h-56 bg-[#FFF3E0]/60 rounded-full blur-2xl pointer-events-none" />
        <button
          onClick={onBack}
          className="absolute top-14 left-6 flex items-center gap-1.5 text-[#433422]/50 z-10"
        >
          <ArrowLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">Back</span>
        </button>
        <div className="relative z-10 flex items-end gap-4">
          <div className="w-14 h-14 rounded-[18px] bg-[#D4A373]/20 flex items-center justify-center flex-shrink-0">
            <Crown size={24} className="text-[#D4A373]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[9px] tracking-[0.3em] font-bold text-[#433422]/40 mb-1">PRAYVAIL</p>
            <h1 className="text-2xl font-serif leading-tight">Support the<br /><em className="italic text-[#D4A373]">Sanctuary</em></h1>
          </div>
        </div>
        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 400 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-8">
            <path d="M0,40 L0,20 C80,4 160,36 240,18 C300,4 360,30 400,18 L400,40 Z" fill="#FDF9F3" />
          </svg>
        </div>
      </div>

      {/* Honest intro */}
      <div className="px-8 pt-6 pb-2">
        <p className="text-sm text-[#433422]/60 leading-relaxed">
          We're an indie team — no investors, no ads, just people who believe this matters. The core of Prayvail is free because peace shouldn't be locked away. But if you're in a position to support us, it goes directly to keeping this alive and growing. Supporter content is our gratitude for that.
        </p>
      </div>

      <div className="mx-8 my-4 border-t border-[#E9DCC9]" />

      {/* Features */}
      <div className="px-8 pb-4 space-y-3">
        {FEATURES.map(f => (
          <div key={f.label} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#8E9775]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check size={10} className="text-[#8E9775]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#433422]">{f.label}</p>
              <p className="text-[10px] text-[#433422]/40">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Package selector */}
      <div className="px-8 pt-4 pb-2 flex-1">
        {loading && (
          <div className="space-y-3">
            {[0, 1].map(i => (
              <div key={i} className="h-[72px] rounded-[20px] bg-[#F4EFE6] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && packages.length === 0 && (
          <div className="text-center py-6">
            {isNative() ? (
              <p className="text-sm text-[#433422]/40">Plans unavailable right now. Please try again later.</p>
            ) : (
              <p className="text-sm text-[#433422]/40">Supporter plans are available in the app.</p>
            )}
          </div>
        )}

        {!loading && packages.length > 0 && (
          <div className="space-y-3">
            {packages.map(pkg => {
              const isSelected = selected?.identifier === pkg.identifier;
              const annual = isAnnual(pkg);
              return (
                <button
                  key={pkg.identifier}
                  onClick={() => setSelected(pkg)}
                  className={`w-full flex items-center gap-4 rounded-[20px] px-5 py-4 border-2 text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'border-[#D4A373] bg-[#D4A373]/6'
                      : 'border-[#E9DCC9] bg-[#F4EFE6]'
                  }`}
                >
                  {/* Radio dot */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-[#D4A373]' : 'border-[#E9DCC9]'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#D4A373]" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-serif text-[#433422]">
                        {pkg.product?.title ?? pkg.packageType}
                      </p>
                      {annual && (
                        <span className="text-[8px] font-bold tracking-widest bg-[#8E9775]/15 text-[#8E9775] px-2 py-0.5 rounded-full uppercase">
                          Best value
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#433422]/40 mt-0.5">
                      {pkg.product?.description ?? ''}
                    </p>
                  </div>

                  <p className="text-sm font-bold text-[#433422] flex-shrink-0">
                    {pkg.product?.priceString ?? ''}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <p className="text-center text-xs text-red-400 mt-4">{error}</p>
        )}
      </div>

      {/* CTA */}
      <div className="px-8 pt-4 pb-10 space-y-3">
        <button
          onClick={handlePurchase}
          disabled={!selected || purchasing || loading}
          className="w-full py-4 bg-[#433422] text-[#FDF9F3] rounded-[28px] text-[11px] font-bold tracking-widest disabled:opacity-30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {purchasing ? 'Processing…' : (
            <><Crown size={13} strokeWidth={2} /> BECOME A SUPPORTER</>
          )}
        </button>

        <button
          onClick={handleRestore}
          disabled={restoring}
          className="w-full py-3 flex items-center justify-center gap-1.5 text-[#433422]/35 text-[10px] font-bold tracking-widest disabled:opacity-50"
        >
          <RotateCcw size={11} strokeWidth={2} />
          {restoring ? 'Restoring…' : 'RESTORE PURCHASES'}
        </button>

        <p className="text-center text-[9px] text-[#433422]/25 leading-relaxed">
          Payment charged to your App Store / Google Play account.{'\n'}
          Cancel anytime in your account settings.
        </p>
      </div>
    </div>
  );
}
