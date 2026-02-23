import { useState } from 'react';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import prayvailLogo from '../assets/prayvail-logo-blank.png';

const PrevailLogin = ({ onBack, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="flex flex-col h-screen bg-[#FDF9F3] text-[#433422] font-sans overflow-hidden relative">

      {/* Ambient glows */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-[#E9DCC9]/40 blur-3xl -z-10" />
      <div className="absolute bottom-[-5%] left-[-10%] w-64 h-64 rounded-full bg-[#D4A373]/5 blur-3xl -z-10" />

      {/* ── Top arch section ── */}
      <section className="relative h-[30%] flex flex-col items-center justify-center overflow-hidden bg-[#EDE5D8]/50">
        <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] rounded-full bg-[#E9DCC9]/30 blur-3xl" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-12 left-6 p-2 text-[#433422]/40 hover:text-[#433422] transition-colors ease-out"
        >
          <ArrowLeft size={22} strokeWidth={1.5} />
        </button>

        {/* Logo */}
        <div className="relative z-10 w-20 h-20 rounded-full overflow-hidden border border-[#D4A373]/20 bg-white/40 backdrop-blur-sm shadow-sm">
          <img src={prayvailLogo} alt="Prayvail" className="w-full h-full object-cover" />
        </div>

        {/* Arch divider */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-[#FDF9F3] rounded-t-[100%] scale-x-125" />
      </section>

      {/* ── Content ── */}
      <main className="flex-1 flex flex-col pt-10 pb-8" style={{ paddingLeft: '10%', paddingRight: '10%' }}>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif mb-3">Welcome Back</h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            Re-enter your place of stillness.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-4 bg-[#F4EFE6] rounded-2xl px-5 py-4">
            <Mail className="text-[#D4A373]/60 flex-shrink-0" size={18} strokeWidth={1.5} />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email Address"
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400/60 caret-[#D4A373]"
            />
          </div>

          <div className="flex items-center gap-4 bg-[#F4EFE6] rounded-2xl px-5 py-4">
            <Lock className="text-[#D4A373]/60 flex-shrink-0" size={18} strokeWidth={1.5} />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400/60 caret-[#D4A373]"
            />
          </div>
        </div>

        <button
          onClick={onLogin}
          className="w-full bg-[#433422] text-[#FDF9F3] font-bold text-sm tracking-[0.2em] py-5 rounded-[32px] shadow-[0_10px_36px_-6px_rgba(67,52,34,0.4)] hover:shadow-[0_14px_44px_-6px_rgba(67,52,34,0.5)] hover:-translate-y-0.5 transition-all ease-out duration-300"
        >
          ENTER SANCTUARY
        </button>

        <button className="mt-5 text-[10px] font-bold tracking-widest text-[#433422]/30 hover:text-[#433422]/60 transition-colors ease-out text-center">
          FORGOT PASSWORD
        </button>

      </main>
    </div>
  );
};

export default PrevailLogin;
