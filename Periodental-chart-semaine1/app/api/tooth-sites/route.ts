import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const patient_id = searchParams.get('patient_id');

    if (!patient_id) {
        return NextResponse.json({ error: 'patient_id is required' }, { status: 400 });
    }

    try {
        const result = await query(
            'SELECT * FROM tooth_sites WHERE patient_id = $1 ORDER BY tooth_number, site_position',
            [patient_id]
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.warn('Database connection failed. Returning empty array for patient chart. Error:', error);
        return NextResponse.json([]);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { patient_id, tooth_number, site_position, pd, gm, cal, bop, plaque, mobility, furcation, implant, prognosis } = body;

        const result = await query(
            `INSERT INTO tooth_sites (patient_id, tooth_number, site_position, pd, gm, cal, bop, plaque, mobility, furcation, implant, prognosis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
            [patient_id, tooth_number, site_position, pd, gm, cal, bop || false, plaque || false, mobility || 0, furcation || 0, implant || false, prognosis || '']
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error inserting tooth site:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
