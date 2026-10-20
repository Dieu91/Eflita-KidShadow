import React from 'react';
import { Sprout, Compass, Rocket, Check } from 'lucide-react';
import { LevelType, Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface LevelSelectorProps {
  selectedLevel: LevelType;
  onSelectLevel: (level: LevelType) => void;
  lang: Language;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  selectedLevel,
  onSelectLevel,
  lang,
}) => {
  const t = getTranslation(lang);

  const levels: {
    id: LevelType;
    name: string;
    age: string;
    desc: string;
    badge: string;
    icon: React.ReactNode;
    colorClasses: {
      border: string;
      bg: string;
      activeBg: string;
      iconBg: string;
      iconColor: string;
      badgeBg: string;
    };
  }[] = [
    {
      id: 'STARTER',
      name: t.levels.starter.name,
      age: t.levels.starter.age,
      desc: t.levels.starter.desc,
      badge: t.levels.starter.badge,
      icon: <Sprout className="w-8 h-8 text-emerald-600" />,
      colorClasses: {
        border: 'border-emerald-300 hover:border-emerald-500',
        bg: 'bg-emerald-50/70',
        activeBg: 'ring-4 ring-emerald-400 bg-emerald-100/90 border-emerald-500',
        iconBg: 'bg-emerald-200/80',
        iconColor: 'text-emerald-700',
        badgeBg: 'bg-emerald-500 text-white',
      },
    },
    {
      id: 'MOVERS',
      name: t.levels.movers.name,
      age: t.levels.movers.age,
      desc: t.levels.movers.desc,
      badge: t.levels.movers.badge,
      icon: <Compass className="w-8 h-8 text-sky-600" />,
      colorClasses: {
        border: 'border-sky-300 hover:border-sky-500',
        bg: 'bg-sky-50/70',
        activeBg: 'ring-4 ring-sky-400 bg-sky-100/90 border-sky-500',
        iconBg: 'bg-sky-200/80',
        iconColor: 'text-sky-700',
        badgeBg: 'bg-sky-500 text-white',
      },
    },
    {
      id: 'FLYERS',
      name: t.levels.flyers.name,
      age: t.levels.flyers.age,
      desc: t.levels.flyers.desc,
      badge: t.levels.flyers.badge,
      icon: <Rocket className="w-8 h-8 text-orange-600" />,
      colorClasses: {
        border: 'border-orange-300 hover:border-orange-500',
        bg: 'bg-orange-50/70',
        activeBg: 'ring-4 ring-orange-400 bg-orange-100/90 border-orange-500',
        iconBg: 'bg-orange-200/80',
        iconColor: 'text-orange-700',
        badgeBg: 'bg-orange-500 text-white',
      },
    },
  ];

  return (
    <div className="space-y-3">
      {levels.map((lvl) => {
        const isSelected = selectedLevel === lvl.id;
        return (
          <div
            key={lvl.id}
            onClick={() => onSelectLevel(lvl.id)}
            className={`relative p-4 rounded-3xl border-3 cursor-pointer transition-all transform active:scale-98 ${
              isSelected ? lvl.colorClasses.activeBg : `${lvl.colorClasses.bg} ${lvl.colorClasses.border}`
            } shadow-sm hover:shadow-md`}
          >
            <div className="flex items-start gap-3.5">
              {/* Distinct Color Icon */}
              <div
                className={`w-14 h-14 rounded-2xl ${lvl.colorClasses.iconBg} flex items-center justify-center shrink-0 shadow-xs`}
              >
                {lvl.icon}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-800 font-['Fredoka',sans-serif]">
                    {lvl.name}
                  </h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${lvl.colorClasses.badgeBg}`}>
                    {lvl.age}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {lvl.desc}
                </p>
              </div>

              {/* Selected Radio Indicator */}
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 absolute top-4 right-4 ${
                  isSelected
                    ? 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
