'use client';

import { useEffect, useRef } from 'react';
import { PerioSite } from '@/types/perio';

interface ToothChartProps {
  sites: PerioSite[];
  toothNumber: number;
  jaw: 'upper' | 'lower';
}

export default function ToothChart({ sites, toothNumber, jaw }: ToothChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const google = (window as any).google;
    if (!google) return;

    const drawChart = () => {
      if (!chartRef.current) return;

      // Données pour AreaChart
      // Colonnes : Site | PD | GM | Zone poche (bleue ombrée)
      const dataArray: (string | number)[][] = [
        ['Site', 'Probing Depth', 'Gingival Margin'],
      ];

      // Ordre des sites : vestibulaire gauche → droite
      const orderedSites = [...sites].sort(
        (a, b) => a.site_position - b.site_position
      );

      orderedSites.forEach(site => {
        dataArray.push([
          `S${site.site_position}`,
          site.PD,
          site.GM,
        ]);
      });

      const data = google.visualization.arrayToDataTable(dataArray);

      const options = {
        // Pas de titre — le numéro est affiché en dehors
        width: 120,
        height: 80,
        // AreaChart avec zone ombrée bleue = poche parodontale
        series: {
          0: {
            color: '#ef4444',      // PD — rouge
            lineWidth: 2,
            areaOpacity: 0.3,
          },
          1: {
            color: '#3b82f6',      // GM — bleu
            lineWidth: 2,
            areaOpacity: 0.1,
          },
        },
        legend: { position: 'none' },
        chartArea: {
          left: 20,
          top: 5,
          width: '85%',
          height: '80%',
        },
        vAxis: {
          minValue: jaw === 'upper' ? -2 : -2,
          maxValue: 12,
          textStyle: { fontSize: 7 },
          gridlines: { count: 4 },
        },
        hAxis: {
          textStyle: { fontSize: 7 },
        },
        backgroundColor: 'transparent',
        enableInteractivity: false,
      };

      const chart = new google.visualization.AreaChart(chartRef.current);
      chart.draw(data, options);
    };

    // Si Google Charts déjà chargé
    if (google.visualization) {
      drawChart();
    } else {
      google.charts.setOnLoadCallback(drawChart);
    }
  }, [sites, toothNumber, jaw]);

  return (
    <div className="flex flex-col items-center">
      {/* Numéro de dent au dessus du graphique */}
      <div className="text-xs font-bold text-blue-700 mb-0.5">
        {toothNumber}
      </div>
      {/* Zone graphique AreaChart */}
      <div
        ref={chartRef}
        style={{ width: 120, height: 80 }}
        className="bg-white border border-gray-200 rounded"
      />
      {/* CAL calculé dynamiquement */}
      <div className="text-xs text-gray-400 mt-0.5">
        CAL: {sites.map(s => s.PD - s.GM).join(' ')}
      </div>
    </div>
  );
}