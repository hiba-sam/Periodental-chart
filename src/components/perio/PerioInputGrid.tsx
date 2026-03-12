'use client';

import { useState } from 'react';
import { PerioTooth, PerioSite, FurcationGrade, MobilityGrade } from '@/types/perio';

interface PerioInputGridProps {
  tooth: PerioTooth;
  jaw: 'upper' | 'lower';
  onChange: (updatedTooth: PerioTooth) => void;
}

export default function PerioInputGrid({ tooth, jaw, onChange }: PerioInputGridProps) {

  // Mise à jour d'un site spécifique
  const updateSite = (position: number, field: keyof PerioSite, value: number | boolean) => {
    const updatedSites = tooth.sites.map(site =>
      site.site_position === position
        ? { ...site, [field]: value }
        : site
    );
    onChange({ ...tooth, sites: updatedSites });
  };

  // Mise à jour mobilité
  const updateMobility = (value: number) => {
    onChange({ ...tooth, mobility: value as MobilityGrade });
  };

  // Mise à jour furcation — clic multi-état 0→1→2→3→0
  const cycleFurcation = () => {
    const next = ((tooth.furcation + 1) % 4) as FurcationGrade;
    onChange({ ...tooth, furcation: next });
  };

  // Sites vestibulaires (1,2,3) et linguaux (4,5,6)
  const buccalSites = tooth.sites.filter(s => s.site_position <= 3);
  const lingualSites = tooth.sites.filter(s => s.site_position > 3);

  // Couleur PD selon pathologie
  const pdColor = (pd: number) => {
    if (pd >= 6) return 'text-red-600 font-bold';
    if (pd >= 4) return 'text-orange-500 font-semibold';
    return 'text-green-600';
  };

  // Icône furcation selon grade
  const furcationIcon = (grade: FurcationGrade) => {
    if (grade === 0) return '○';
    if (grade === 1) return '◔';
    if (grade === 2) return '◑';
    return '●';
  };

  return (
    <div className="border border-gray-300 rounded bg-white p-1 w-28 text-xs">

      {/* En-tête : numéro dent + mobilité + furcation */}
      <div className="flex justify-between items-center mb-1 border-b border-gray-200 pb-1">
        <span className="font-bold text-blue-700">{tooth.tooth_number}</span>

        {/* Mobilité */}
        <select
          value={tooth.mobility}
          onChange={e => updateMobility(Number(e.target.value))}
          className="text-xs border border-gray-300 rounded w-8 text-center"
        >
          {[0, 1, 2, 3].map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        {/* Furcation — clic multi-état */}
        <button
          onClick={cycleFurcation}
          className={`w-6 h-6 rounded-full border text-xs font-bold
            ${tooth.furcation === 0 ? 'border-gray-300 text-gray-400' :
              tooth.furcation === 1 ? 'border-blue-400 text-blue-500' :
              tooth.furcation === 2 ? 'border-blue-600 text-blue-600' :
              'border-blue-800 bg-blue-700 text-white'}`}
          title={`Furcation Grade ${tooth.furcation} — cliquer pour changer`}
        >
          {furcationIcon(tooth.furcation)}
        </button>
      </div>

      {/* Sites vestibulaires (1,2,3) */}
      <div className="mb-1">
        <div className="text-gray-400 text-center mb-0.5">Vestibulaire</div>
        {buccalSites.map(site => (
          <div key={site.site_position}
            className="flex items-center gap-0.5 mb-0.5">

            <span className="text-gray-400 w-3">{site.site_position}</span>

            {/* PD */}
            <input
              type="number"
              min={0} max={12}
              value={site.PD}
              onChange={e => updateSite(site.site_position, 'PD', Number(e.target.value))}
              className={`w-7 border border-gray-300 rounded text-center text-xs
                ${pdColor(site.PD)}`}
            />

            {/* GM */}
            <input
              type="number"
              min={-10} max={10}
              value={site.GM}
              onChange={e => updateSite(site.site_position, 'GM', Number(e.target.value))}
              className="w-7 border border-gray-300 rounded text-center text-xs text-blue-600"
            />

            {/* BOP toggle */}
            <button
              onClick={() => updateSite(site.site_position, 'BOP', !site.BOP)}
              className={`w-4 h-4 rounded-full border text-xs
                ${site.BOP ? 'bg-red-500 border-red-600' : 'bg-white border-gray-300'}`}
              title="BOP"
            />

            {/* PI toggle */}
            <button
              onClick={() => updateSite(site.site_position, 'PI', !site.PI)}
              className={`w-4 h-4 rounded border text-xs
                ${site.PI ? 'bg-yellow-400 border-yellow-500' : 'bg-white border-gray-300'}`}
              title="Plaque"
            />
          </div>
        ))}
      </div>

      {/* Sites linguaux (4,5,6) */}
      <div className="border-t border-gray-200 pt-1">
        <div className="text-gray-400 text-center mb-0.5">Lingual</div>
        {lingualSites.map(site => (
          <div key={site.site_position}
            className="flex items-center gap-0.5 mb-0.5">

            <span className="text-gray-400 w-3">{site.site_position}</span>

            {/* PD */}
            <input
              type="number"
              min={0} max={12}
              value={site.PD}
              onChange={e => updateSite(site.site_position, 'PD', Number(e.target.value))}
              className={`w-7 border border-gray-300 rounded text-center text-xs
                ${pdColor(site.PD)}`}
            />

            {/* GM */}
            <input
              type="number"
              min={-10} max={10}
              value={site.GM}
              onChange={e => updateSite(site.site_position, 'GM', Number(e.target.value))}
              className="w-7 border border-gray-300 rounded text-center text-xs text-blue-600"
            />

            {/* BOP toggle */}
            <button
              onClick={() => updateSite(site.site_position, 'BOP', !site.BOP)}
              className={`w-4 h-4 rounded-full border text-xs
                ${site.BOP ? 'bg-red-500 border-red-600' : 'bg-white border-gray-300'}`}
              title="BOP"
            />

            {/* PI toggle */}
            <button
              onClick={() => updateSite(site.site_position, 'PI', !site.PI)}
              className={`w-4 h-4 rounded border text-xs
                ${site.PI ? 'bg-yellow-400 border-yellow-500' : 'bg-white border-gray-300'}`}
              title="Plaque"
            />
          </div>
        ))}
      </div>

      {/* CAL calculé dynamiquement */}
      <div className="border-t border-gray-200 pt-1 mt-1">
        <div className="text-gray-400 text-center">CAL = PD - GM</div>
        <div className="flex justify-around">
          {tooth.sites.map(site => (
            <span key={site.site_position}
              className="text-blue-600 font-semibold">
              {site.PD - site.GM}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}