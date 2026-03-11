import { NextResponse } from 'next/server';
import { getClient } from '../../../db';
import { BatchSaveRequest } from '../../../models';

export async function POST(request: Request) {
    let client;
    try {
        const body: BatchSaveRequest = await request.json();
        const { chartId, teeth } = body;

        if (!chartId || !teeth || !Array.isArray(teeth)) {
            return NextResponse.json({ error: 'chartId and an array of teeth are required' }, { status: 400 });
        }

        // Initialize DB Client for transaction
        client = await getClient();
        await client.query('BEGIN'); // Start Transaction

        // Lock to ensure chart is not finalized
        const chartRes = await client.query('SELECT status FROM periodontal_charts WHERE id = $1 FOR UPDATE', [chartId]);
        if (chartRes.rows.length === 0) {
            throw new Error('Chart not found');
        }
        if (chartRes.rows[0].status === 'finalized') {
            throw new Error('Cannot modify a finalized chart');
        }

        // Loop over teeth
        for (const tooth of teeth) {
            // Upsert Tooth
            const toothQuery = `
                INSERT INTO periodontal_teeth (chart_id, tooth_number, mobility, furcation)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (chart_id, tooth_number) 
                DO UPDATE SET mobility = EXCLUDED.mobility, furcation = EXCLUDED.furcation
                RETURNING id;
            `;
            const toothRes = await client.query(toothQuery, [
                chartId,
                tooth.toothNumber,
                tooth.mobility ?? 0,
                tooth.furcation ?? 0
            ]);
            const toothId = toothRes.rows[0].id;

            // Loop over sites
            if (tooth.sites && Array.isArray(tooth.sites)) {
                for (const site of tooth.sites) {
                    
                    // CAL Calculation (Dynamic)
                    // Rule: CAL = PD - GM (if gm exists, otherwise CAL = PD)
                    const gm = site.gm ?? 0;
                    const cal = site.pd !== undefined ? site.pd - gm : null;

                    const siteQuery = `
                        INSERT INTO periodontal_sites (tooth_id, site_position, pd, gm, bop, pi)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (tooth_id, site_position)
                        DO UPDATE SET 
                            pd = EXCLUDED.pd, 
                            gm = EXCLUDED.gm,
                            bop = EXCLUDED.bop,
                            pi = EXCLUDED.pi
                        RETURNING *;
                    `;

                    // We execute site update but do not store CAL in DB, just calculate here for response if needed.
                    // Wait, the schema from earlier has: `pd`, `gm`, `bop`, `pi`. No `cal` column inside `periodontal_sites`.
                    // This perfectly matches the "Le CAL n'est pas stocké en base de données" constraint.
                    
                    await client.query(siteQuery, [
                        toothId,
                        site.sitePosition,
                        site.pd,
                        gm,
                        site.bop ?? false,
                        site.pi ?? false
                    ]);
                }
            }
        }

        // Commit Transaction
        await client.query('COMMIT');
        
        // Touch the updated_at on the chart
        await client.query('UPDATE periodontal_charts SET updated_at = NOW() WHERE id = $1', [chartId]);

        return NextResponse.json({ success: true, message: 'Batch save successful' }, { status: 200 });

    } catch (error: any) {
        if (client) {
            await client.query('ROLLBACK'); // Abort Transaction on error
        }
        console.error('Batch Save Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: error.message === 'Cannot modify a finalized chart' ? 403 : 500 });
    } finally {
        if (client) {
            client.release();
        }
    }
}
