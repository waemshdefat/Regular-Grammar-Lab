import React from 'react';
import { Menu } from 'lucide-react';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  activeTabTitle: string;
  isRegular?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileMenu,
  activeTabTitle,
  isRegular = true
}) => {
  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-purple-400 font-semibold hidden sm:inline">
            Lab Platform
          </span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-sm font-bold text-white tracking-tight">
            {activeTabTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Regularity indicator pill */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
          <span className="text-slate-400 text-[10px] uppercase">Language:</span>
          <span className={isRegular ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            {isRegular ? 'Regular (Type-3)' : 'Non-Regular Linear/CFG'}
          </span>
        </div>
      </div>
    </header>
  );
};
