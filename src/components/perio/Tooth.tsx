'use client';

import { PerioTooth } from '@/types/perio';

interface ToothProps {
  tooth: PerioTooth;
  jaw: 'upper' | 'lower';
  onClick?: () => void;
}

// Dessin SVG anatomique d'une dent
function ToothSVG({ jaw, crossed }: { jaw: 'upper' | 'lower'; crossed?: boolean }) {
  const isUpper = jaw === 'upper';

  return (
    <svg width="32" height="48" viewBox="0 0 32 48" className="mx-auto">
      {/* Couronne de la dent */}
      <rect
        x="6" y={isUpper ? 24 : 4}
        width="20" height="16"
        rx="4"
        fill={crossed ? '#e5e7eb' : '#f9fafb'}
        stroke={crossed ? '#9ca3af' : '#6b7280'}
        strokeWidth="1.5"
      />
      {/* Racine(s) — pointe vers HAUT si maxillaire, BAS si mandibule */}
      {isUpper ? (
        <>
          {/* Racine gauche vers le haut */}
          <path
            d="M10 24 Q9 16 8 6"
            fill="none"
            stroke={crossed ? '#9ca3af' : '#6b7280'}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Racine centrale vers le haut */}
          <path
            d="M16 24 Q16 14 16 4"
            fill="none"
            stroke={crossed ? '#9ca3af' : '#6b7280'}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Racine droite vers le haut */}
          <path
            d="M22 24 Q23 16 24 6"
            fill="none"
            stroke={crossed ? '#9ca3af' : '#6b7280'}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {/* Racine gauche vers le bas */}
          <path
            d="M11 20 Q10 30 9 42"
            fill="none"
            stroke={crossed ? '#9ca3af' : '#6b7280'}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {/* Racine droite vers le bas */}
          <path
            d="M21 20 Q22 30 23 42"
            fill="none"
            stroke={crossed ? '#9ca3af' : '#6b7280'}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
      {/* Croix si dent absente */}
      {crossed && (
        <>
          <line x1="6" y1={isUpper ? 24 : 4}
                x2="26" y2={isUpper ? 40 : 20}
                stroke="#ef4444" strokeWidth="2" />
          <line x1="26" y1={isUpper ? 24 : 4}
                x2="6" y2={isUpper ? 40 : 20}
                stroke="#ef4444" strokeWidth="2" />
        </>
      )}
    </svg>
  );
}

export default function Tooth({ tooth, jaw, onClick }: ToothProps) {
  const sitesWithCAL = tooth.sites.map(site => ({
    ...site,
    CAL: site.PD - site.GM,
  }));

  // Sites vestibulaires (1,2,3) et linguaux (4,5,6)
  const buccalSites = sitesWithCAL.filter(s => s.site_position <= 3);
  const lingualSites = sitesWithCAL.filter(s => s.site_position > 3);

  const hasBleeding = tooth.sites.some(s => s.BOP);
  const hasPlaque = tooth.sites.some(s => s.PI);
  const maxPD = Math.max(...tooth.sites.map(s => s.PD));

  return (
    <div
      className={`flex flex-col items-center border rounded p-1 w-14 cursor-pointer transition-all
        ${maxPD >= 6 ? 'border-red-400 bg-red-50' :
          maxPD >= 4 ? 'border-orange-300 bg-orange-50' :
          'border-gray-300 bg-white'}
        hover:shadow-md`}
      onClick={onClick}
    >
      {/* Numéro FDI */}
      <div className="text-xs font-bold text-blue-700">
        {tooth.tooth_number}
      </div>

      {/* Mobilité */}
      {tooth.mobility > 0 && (
        <div className="text-xs text-orange-500 font-semibold">
          M{tooth.mobility}
        </div>
      )}

      {/* SVG anatomique */}
      <ToothSVG jaw={jaw} />

      {/* Furcation */}
      <div className="flex gap-0.5 mt-0.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full border border-gray-400
              ${i < tooth.furcation ? 'bg-blue-500' : 'bg-white'}`}
          />
        ))}
      </div>

      {/* Indicateurs BOP et Plaque */}
      <div className="flex gap-1 mt-1">
        {hasBleeding && (
          <span className="text-red-500 text-xs font-bold" title="BOP">B</span>
        )}
        {hasPlaque && (
          <span className="text-yellow-500 text-xs font-bold" title="Plaque">P</span>
        )}
      </div>

      {/* Sites vestibulaires */}
      <div className="w-full mt-1 border-t border-gray-100 pt-0.5">
        {buccalSites.map(site => (
          <div key={site.site_position}
            className="flex justify-between text-xs px-0.5">
            <span className="text-gray-400">{site.site_position}</span>
            <span className={site.PD >= 4 ? 'text-red-500 font-bold' : 'text-green-600'}>
              {site.PD}
            </span>
          </div>
        ))}
      </div>

      {/* Sites linguaux */}
      <div className="w-full border-t border-gray-200 pt-0.5">
        {lingualSites.map(site => (
          <div key={site.site_position}
            className="flex justify-between text-xs px-0.5">
            <span className="text-gray-400">{site.site_position}</span>
            <span className={site.PD >= 4 ? 'text-red-500 font-bold' : 'text-green-600'}>
              {site.PD}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}