import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { LevelType, Language } from '../types';
import { LevelSelector } from './LevelSelector';
import { getTranslation } from '../i18n/translations';

interface LevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: LevelType;
  onSelectLevel: (level: LevelType) => void;
  lang: Language;
}

export const LevelModal: React.FC<LevelModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  onSelectLevel,
  lang,
}) => {
  const t = getTranslation(lang);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 mx-auto mb-2 flex items-center justify-center text-amber-700">
            <Sparkles className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800 font-['Fredoka',sans-serif]">
            {t.selectLevelTitle}
          </h3>
        </div>

        <LevelSelector
          selectedLevel={currentLevel}
          onSelectLevel={(lvl) => {
            onSelectLevel(lvl);
            onClose();
          }}
          lang={lang}
        />
      </div>
    </div>
  );
};
