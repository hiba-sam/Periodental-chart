'use client';

import { useState, useEffect } from 'react';
import Tooth from './Tooth';
import ToothChart from './ToothChart';
import PerioInputGrid from './PerioInputGrid';
import { PerioTooth, PerioSite, ToothNumber } from '@/types/perio';

// Génère 6 sites vides pour une dent
function createEmptySites(): PerioSite[] {
  return [1, 2, 3, 4, 5, 6].map(pos => ({
    site_position: pos as 1 | 2 | 3 | 4 | 5 | 6,
    PD: 2,
    GM: 0,
    BOP: false,
    PI: false,
  }));
}

// Génère toutes les dents FDI
function createAllTeeth(): PerioTooth[] {
  const upperTeeth: ToothNumber[] = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
  const lowerTeeth: ToothNumber[] = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

  return [...upperTeeth, ...lowerTeeth].map(num => ({
    tooth_number: num,
    mobility: 0,
    furcation: 0,
    sites: createEmptySites(),
  }));
}

export default function PerioChartPage() {
  const [teeth, setTeeth] = useState<PerioTooth[]>(createAllTeeth());
  const [selectedTooth, setSelectedTooth] = useState<ToothNumber | null>(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Chargement Google Charts
  useEffect(() => {
    const tryLoad = () => {
      const google = (window as any).google;
      if (!google) {
        setTimeout(tryLoad, 200);
        return;
      }
      google.charts.load('current', { packages: ['corechart'] });
      google.charts.setOnLoadCallback(() => {
        setGoogleLoaded(true);
      });
    };
    tryLoad();
  }, []);

    // Vérifier si le script existe déjà
    const existing = document.querySelector('script[src="https://www.gstatic.com/charts/loader.js"]');
    if (existing) {
      // Script déjà présent — attendre que google soit prêt
      const interval = setInterval(() => {
        const google = (window as any).google;
        if (google && google.visualization) {
          setGoogleLoaded(true);
          clearInterval(interval);
        } else if (google && google.charts) {
          google.charts.load('current', { packages: ['corechart'] });
          google.charts.setOnLoadCallback(() => {
            setGoogleLoaded(true);
            clearInterval(interval);
          });
        }
      }, 200);
      return () => clearInterval(interval);
    }

    document.head.appendChild(script);
  }, []);

  // Mise à jour d'une dent
  const updateTooth = (updatedTooth: PerioTooth) => {
    setTeeth(prev =>
      prev.map(t =>
        t.tooth_number === updatedTooth.tooth_number ? updatedTooth : t
      )
    );
  };

  // Dents supérieures et inférieures
  const upperTeeth = teeth.filter(t =>
    [11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28]
    .includes(t.tooth_number)
  ).sort((a, b) => {
    const order = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
    return order.indexOf(a.tooth_number) - order.indexOf(b.tooth_number);
  });

  const lowerTeeth = teeth.filter(t =>
    [41,42,43,44,45,46,47,48,31,32,33,34,35,36,37,38]
    .includes(t.tooth_number)
  ).sort((a, b) => {
    const order = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];
    return order.indexOf(a.tooth_number) - order.indexOf(b.tooth_number);
  });

  // Dent sélectionnée pour la grille de saisie
  const selectedToothData = teeth.find(t => t.tooth_number === selectedTooth);

  // Statistiques globales
  const allSites = teeth.flatMap(t => t.sites);
  const meanPD = (allSites.reduce((s, x) => s + x.PD, 0) / allSites.length).toFixed(1);
  const meanCAL = (allSites.reduce((s, x) => s + (x.PD - x.GM), 0) / allSites.length).toFixed(1);
  const pctBOP = ((allSites.filter(x => x.BOP).length / allSites.length) * 100).toFixed(0);
  const pctPI = ((allSites.filter(x => x.PI).length / allSites.length) * 100).toFixed(0);

  return (
    <div className="bg-gray-50 min-h-screen p-4" style={{ minWidth: 980 }}>

      {/* En-tête */}
      <div className="flex justify-between items-center mb-4 bg-blue-800 text-white px-4 py-2 rounded">
        <h1 className="text-lg font-bold">Periodontal Chart — MyPrescription</h1>
        <div className="flex gap-4 text-sm">
          <span>Mean PD: <strong>{meanPD}mm</strong></span>
          <span>Mean CAL: <strong>{meanCAL}mm</strong></span>
          <span className={Number(pctBOP) >= 10 ? 'text-red-300' : 'text-green-300'}>
            BOP: <strong>{pctBOP}%</strong>
          </span>
          <span className={Number(pctPI) >= 20 ? 'text-red-300' : 'text-green-300'}>
            Plaque: <strong>{pctPI}%</strong>
          </span>
        </div>
      </div>

      {/* === SECTION MAXILLAIRE (haut) === */}
      <div className="mb-2">
        <div className="text-xs text-gray-500 font-semibold mb-1 text-center">
          MAXILLAIRE — Racines vers le HAUT
        </div>

        {/* Graphiques dents supérieures */}
        {googleLoaded && (
          <div className="flex justify-center gap-0.5 mb-1">
            {upperTeeth.map(tooth => (
              <ToothChart
                key={tooth.tooth_number}
                sites={tooth.sites}
                toothNumber={tooth.tooth_number}
                jaw="upper"
              />
            ))}
          </div>
        )}

        {/* Dents supérieures SVG */}
        <div className="flex justify-center gap-0.5">
          {upperTeeth.map(tooth => (
            <Tooth
              key={tooth.tooth_number}
              tooth={tooth}
              jaw="upper"
              onClick={() => setSelectedTooth(
                selectedTooth === tooth.tooth_number ? null : tooth.tooth_number
              )}
            />
          ))}
        </div>
      </div>

      {/* Séparateur */}
      <div className="border-t-2 border-gray-400 my-2" />

      {/* === SECTION MANDIBULE (bas) === */}
      <div className="mt-2">
        <div className="text-xs text-gray-500 font-semibold mb-1 text-center">
          MANDIBULE — Racines vers le BAS
        </div>

        {/* Dents inférieures SVG */}
        <div className="flex justify-center gap-0.5">
          {lowerTeeth.map(tooth => (
            <Tooth
              key={tooth.tooth_number}
              tooth={tooth}
              jaw="lower"
              onClick={() => setSelectedTooth(
                selectedTooth === tooth.tooth_number ? null : tooth.tooth_number
              )}
            />
          ))}
        </div>

        {/* Graphiques dents inférieures */}
        {googleLoaded && (
          <div className="flex justify-center gap-0.5 mt-1">
            {lowerTeeth.map(tooth => (
              <ToothChart
                key={tooth.tooth_number}
                sites={tooth.sites}
                toothNumber={tooth.tooth_number}
                jaw="lower"
              />
            ))}
          </div>
        )}
      </div>

      {/* === GRILLE DE SAISIE (dent sélectionnée) === */}
      {selectedToothData && (
        <div className="mt-4 p-3 bg-white border border-blue-300 rounded shadow">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-blue-800">
              Saisie — Dent {selectedTooth}
              ({[11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28]
                .includes(selectedTooth!) ? 'Maxillaire' : 'Mandibule'})
            </h2>
            <button
              onClick={() => setSelectedTooth(null)}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              ✕ Fermer
            </button>
          </div>
          <PerioInputGrid
            tooth={selectedToothData}
            jaw={[11,12,13,14,15,16,17,18,21,22,23,24,25,26,27,28]
              .includes(selectedTooth!) ? 'upper' : 'lower'}
            onChange={updateTooth}
          />
        </div>
      )}

    </div>
  );
}