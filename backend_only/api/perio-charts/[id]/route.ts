import { NextResponse } from 'next/server';
import { query } from '../../../db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id, 10);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const chartResult = await query('SELECT * FROM periodontal_charts WHERE id = $1', [id]);
        if (chartResult.rows.length === 0) {
            return NextResponse.json({ error: 'Chart not found' }, { status: 404 });
        }

        const chart = chartResult.rows[0];

        // Fetch associated teeth and sites (optional, but good for a detail endpoint)
        const teethResult = await query('SELECT * FROM periodontal_teeth WHERE chart_id = $1', [id]);
        
        for (let tooth of teethResult.rows) {
            const sitesResult = await query('SELECT * FROM periodontal_sites WHERE tooth_id = $1 ORDER BY site_position', [tooth.id]);
            // Calculate CAL dynamically
            tooth.sites = sitesResult.rows.map((site: any) => ({
                ...site,
                cal: site.pd !== null && site.pd !== undefined ? site.pd - (site.gm || 0) : null
            }));
        }

        chart.teeth = teethResult.rows;

        return NextResponse.json(chart);
    } catch (error) {
        console.error('Error fetching chart details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id, 10);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

        const body = await request.json();
        const { status, notes } = body;

        // Check current status - lock if already finalized
        const checkResult = await query('SELECT status FROM periodontal_charts WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return NextResponse.json({ error: 'Chart not found' }, { status: 404 });
        }

        if (checkResult.rows[0].status === 'finalized') {
            return NextResponse.json({ error: 'Cannot modify a finalized chart' }, { status: 403 });
        }

        // Update details
        const updateQuery = `
            UPDATE periodontal_charts
            SET status = COALESCE($1, status),
                notes = COALESCE($2, notes),
                updated_at = NOW()
            WHERE id = $3
            RETURNING *;
        `;
        
        const dbResult = await query(updateQuery, [status, notes, id]);
        return NextResponse.json(dbResult.rows[0]);

    } catch (error) {
        console.error('Error updating chart:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
