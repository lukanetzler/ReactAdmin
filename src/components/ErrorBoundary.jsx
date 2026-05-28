import { Component } from 'react';
import prayvailLogo from '../assets/prayvail-logo-blank.webp';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-8 px-8"
        style={{ background: '#FDF9F3' }}
      >
        <div className="w-16 h-16 rounded-full overflow-hidden border border-[#D4A373]/30">
          <img src={prayvailLogo} alt="Prayvail" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col items-center gap-3 text-center max-w-xs">
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#433422',
              fontSize: '1.25rem',
              letterSpacing: '0.15em',
            }}
          >
            PRAYVAIL
          </p>
          <p style={{ color: '#433422', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Something went wrong while loading your sanctuary.
          </p>
        </div>
        <button
          onClick={this.handleReload}
          className="px-6 py-3 bg-[#433422] text-[#FDF9F3] rounded-[20px] font-serif text-sm tracking-wide"
        >
          Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
