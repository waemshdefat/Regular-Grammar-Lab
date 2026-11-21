import React from 'react';
import {
  LayoutDashboard,
  FileCode2,
  Layers,
  Cpu,
  ListOrdered,
  ArrowLeftRight,
  Compass,
  BookOpen,
  Award,
  GraduationCap,
  Sparkles,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  ruleCount: number;
  isRegular: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  ruleCount,
  isRegular
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: null
    },
    {
      id: 'builder',
      label: 'Grammar Builder',
      icon: <FileCode2 className="w-4 h-4" />,
      badge: `${ruleCount} Rules`
    },
    {
      id: 'classification',
      label: 'Classification',
      icon: <Layers className="w-4 h-4" />,
      badge: isRegular ? 'Regular' : 'Non-Reg',
      badgeColor: isRegular ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'
    },
    {
      id: 'automaton',
      label: 'Grammar to NFA',
      icon: <Cpu className="w-4 h-4" />,
      badge: 'Interactive'
    },
    {
      id: 'generator',
      label: 'String & Derivations',
      icon: <ListOrdered className="w-4 h-4" />,
      badge: null
    },
    {
      id: 'nfa-to-grammar',
      label: 'NFA to Grammar',
      icon: <ArrowLeftRight className="w-4 h-4" />,
      badge: 'Reverse'
    },
    {
      id: 'explorer',
      label: 'Language Explorer',
      icon: <Compass className="w-4 h-4" />,
      badge: null
    },
    {
      id: 'learning',
      label: 'Learning Center',
      icon: <BookOpen className="w-4 h-4" />,
      badge: '7 Lessons'
    },
    {
      id: 'quiz',
      label: 'Practice & Quiz',
      icon: <Award className="w-4 h-4" />,
      badge: '12 Qs'
    },
    {
      id: 'about',
      label: 'Project Presentation',
      icon: <GraduationCap className="w-4 h-4" />,
      badge: 'Academic'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1">
                Regular Grammar <span className="text-purple-400 font-mono">Lab</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Grammar to Automata</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-3 mb-2">
            Main Navigation
          </div>

          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-purple-600/15 border border-purple-500/40 text-purple-200 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-purple-400' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      item.badgeColor || 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* University Metadata Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300">CS Theory Capstone</div>
          <div className="text-[10px] text-slate-400 font-mono">Type-3 Formal Grammars & NFA</div>
        </div>
      </aside>
    </>
  );
};
