'use client';

import { useEffect, useState } from 'react';
import Tooth from '@/components/perio/Tooth';
import ToothChart from '@/components/perio/ToothChart';
import { MOCK_TOOTH, MOCK_SITES } from '@/types/perio';

export default function PerioTestPage() {
  const [googleLoaded, setGoogleLoaded] = useState(false);

  useEffect(() => {
    if ((window as any).google) {
      setGoogleLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => setGoogleLoaded(true);
    document.head.appendChild(script);
  }, []);

  return (
    <main className="p-6 bg-gray-50 min-h-screen">

      {/* Titre */}
      <h1 className="text-2xl font-bold text-blue-800 mb-2">
        Periodontal Chart — Test Semaine 1 P2
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Test : Google Charts | Tooth.tsx | ToothChart.tsx | Types TypeScript
      </p>

      {/* Statut Google Charts */}
      <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-6 ${
        googleLoaded
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}>
        Google Charts : {googleLoaded ? 'Charge' : 'Chargement...'}
      </div>

      {/* Test Tooth.tsx */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Test Tooth.tsx — Dent 11 (maxillaire) et Dent 41 (mandibule)
        </h2>
        <div className="flex gap-4">
          <Tooth tooth={MOCK_TOOTH} jaw="upper" />
          <Tooth
            tooth={{ ...MOCK_TOOTH, tooth_number: 41 }}
            jaw="lower"
          />
        </div>
      </section>

      {/* Test ToothChart.tsx */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Test ToothChart.tsx — Courbes PD / GM / CAL
        </h2>
        {googleLoaded ? (
          <ToothChart sites={MOCK_SITES} toothNumber={11} />
        ) : (
          <div className="text-yellow-600 text-sm">
            En attente de Google Charts...
          </div>
        )}
      </section>

      {/* Test données mock — tableau */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Test données mock — 6 sites avec CAL = PD - GM
        </h2>
        <table className="text-sm border-collapse bg-white rounded shadow">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="px-3 py-2">Site</th>
              <th className="px-3 py-2">PD (mm)</th>
              <th className="px-3 py-2">GM (mm)</th>
              <th className="px-3 py-2">CAL</th>
              <th className="px-3 py-2">BOP</th>
              <th className="px-3 py-2">PI</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SITES.map(site => {
              const CAL = site.PD - site.GM;
              return (
                <tr
                  key={site.site_position}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-3 py-2 text-center font-semibold">
                    S{site.site_position}
                  </td>
                  <td className={`px-3 py-2 text-center font-bold ${
                    site.PD >= 4 ? 'text-red-500' : 'text-green-600'
                  }`}>
                    {site.PD}
                  </td>
                  <td className="px-3 py-2 text-center">{site.GM}</td>
                  <td className="px-3 py-2 text-center font-semibold text-blue-600">
                    {CAL}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {site.BOP
                      ? <span className="text-red-500 font-bold">OUI</span>
                      : <span className="text-gray-400">NON</span>}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {site.PI
                      ? <span className="text-yellow-500 font-bold">OUI</span>
                      : <span className="text-gray-400">NON</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

    </main>
  );
}
