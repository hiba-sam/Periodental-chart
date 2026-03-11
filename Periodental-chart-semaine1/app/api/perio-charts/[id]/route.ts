// app/api/perio-charts/[id]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // On définit params comme une Promise
) {
    // 1. On attend la résolution des paramètres
    const resolvedParams = await params;
    const chartId = parseInt(resolvedParams.id, 10);

    // 2. Debug log pour voir ce qui arrive réellement
    console.log("ID reçu dans l'API :", resolvedParams.id);

    if (isNaN(chartId)) {
        return NextResponse.json({ error: 'ID invalide', received: resolvedParams.id }, { status: 400 });
    }

    try {
        const chartRes = await pool.query('SELECT * FROM periodontal_charts WHERE id = $1', [chartId]);

        if (chartRes.rows.length === 0) {
            return NextResponse.json({ error: 'Examen introuvable' }, { status: 404 });
        }

        // ... (le reste de ton code SQL pour récupérer les dents et sites)
        const dataRes = await pool.query(`
      SELECT t.id, t.tooth_number, t.mobility, t.furcation,
      json_agg(json_build_object(
        'site_position', s.site_position,
        'pd', s.pd,
        'gm', s.gm,
        'cal', s.pd - s.gm
      )) as sites
      FROM periodontal_teeth t
      LEFT JOIN periodontal_sites s ON t.id = s.tooth_id
      WHERE t.chart_id = $1
      GROUP BY t.id
    `, [chartId]);

        const chart = chartRes.rows[0];
        chart.teeth = dataRes.rows;

        return NextResponse.json(chart);
    } catch (error) {
        return NextResponse.json({ error: 'Erreur SQL' }, { status: 500 });
    }
}