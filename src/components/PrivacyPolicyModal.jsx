import { X } from 'lucide-react';

const PrivacyPolicyModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[200] flex flex-col" style={{ backgroundColor: '#FDF9F3' }}>
    {/* Header */}
    <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0 border-b border-[#E9DCC9]">
      <div>
        <p className="text-[9px] font-bold tracking-[0.35em] text-[#433422]/40">PRAYVAIL</p>
        <h2 className="text-base font-serif text-[#433422]">Privacy Policy</h2>
      </div>
      <button
        onClick={onClose}
        className="w-9 h-9 rounded-full bg-[#F4EFE6] flex items-center justify-center"
      >
        <X size={16} className="text-[#433422]/60" />
      </button>
    </div>

    {/* Policy content in iframe so its own styles stay scoped */}
    <iframe
      src="/privacy.html"
      className="flex-1 w-full border-0"
      title="Privacy Policy"
    />
  </div>
);

export default PrivacyPolicyModal;
