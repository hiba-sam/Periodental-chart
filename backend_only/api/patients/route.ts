import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query(
            'SELECT * FROM patients ORDER BY updated_at DESC'
        );
        return NextResponse.json(result.rows);
    } catch (error) {
        console.warn('Database connection failed. Returning empty patients list. Error:', error);
        return NextResponse.json([]);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { first_name, last_name, date_of_birth } = body;

        const result = await query(
            `INSERT INTO patients (first_name, last_name, date_of_birth)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [first_name || 'Nouveau', last_name || 'Patient', date_of_birth || null]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error creating patient:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
