// app/api/tooth-sites/batch/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { PerioTooth } from '@/types';

export async function POST(request: Request) {
    const client = await pool.connect();

    try {
        const body = await request.json();
        const { chart_id, teeth } = body as { chart_id: number; teeth: PerioTooth[] };

        // 1. Démarrer la transaction atomique
        await client.query('BEGIN');

        for (const tooth of teeth) {
            // 2. Insérer ou mettre à jour la dent (On gère les conflits avec UPSERT)
            const toothResult = await client.query(
                `INSERT INTO periodontal_teeth (chart_id, tooth_number, mobility, furcation)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (chart_id, tooth_number) 
         DO UPDATE SET mobility = EXCLUDED.mobility, furcation = EXCLUDED.furcation
         RETURNING id`,
                [chart_id, tooth.tooth_number, tooth.mobility, tooth.furcation]
            );

            const toothId = toothResult.rows[0].id;

            // 3. Insérer ou mettre à jour les 6 sites pour cette dent
            for (const site of tooth.sites) {
                await client.query(
                    `INSERT INTO periodontal_sites (tooth_id, site_position, pd, gm, bop, pi)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (tooth_id, site_position)
           DO UPDATE SET pd = EXCLUDED.pd, gm = EXCLUDED.gm, bop = EXCLUDED.bop, pi = EXCLUDED.pi`,
                    [toothId, site.site_position, site.pd, site.gm, site.bop, site.pi]
                );
            }
        }

        // 4. Valider la transaction si tout s'est bien passé
        await client.query('COMMIT');

        return NextResponse.json({ success: true, message: 'Examen sauvegardé avec succès' });

    } catch (error) {
        // 5. Annuler TOUTES les modifications en cas d'erreur
        await client.query('ROLLBACK');
        console.error('Erreur lors du batch saving:', error);
        return NextResponse.json({ success: false, error: 'Échec de la sauvegarde' }, { status: 500 });
    } finally {
        // 6. Libérer le client pour qu'il retourne dans le Pool
        client.release();
    }
}