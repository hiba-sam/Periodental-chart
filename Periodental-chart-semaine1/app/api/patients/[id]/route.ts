import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const patient_id = resolvedParams.id;

    if (!patient_id) {
        return NextResponse.json({ error: 'patient_id is required' }, { status: 400 });
    }

    try {
        const result = await query(
            'SELECT * FROM patients WHERE id = $1',
            [patient_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(null); // Return null instead of 404 to avoid console noise for new missing records
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.warn('Database connection failed. Returning empty patient data. Error:', error);
        return NextResponse.json(null);
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const patient_id = resolvedParams.id;
        const body = await request.json();
        const { first_name, last_name, date_of_birth } = body;

        const result = await query(
            `INSERT INTO patients (id, first_name, last_name, date_of_birth)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET 
                first_name = EXCLUDED.first_name, 
                last_name = EXCLUDED.last_name, 
                date_of_birth = EXCLUDED.date_of_birth
             RETURNING *`,
            [patient_id, first_name, last_name, date_of_birth || null]
        );

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating patient:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
