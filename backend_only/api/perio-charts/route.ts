import { NextResponse } from 'next/server';
import { query } from '../../db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');
        
        let dbResult;
        if (patientId) {
            dbResult = await query('SELECT * FROM periodontal_charts WHERE patient_id = $1 ORDER BY exam_date DESC', [patientId]);
        } else {
            dbResult = await query('SELECT * FROM periodontal_charts ORDER BY exam_date DESC');
        }

        return NextResponse.json(dbResult.rows);
    } catch (error) {
        console.error('Error fetching charts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { patientId, doctorId, examDate, notes } = body;

        if (!patientId) {
            return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
        }

        const insertQuery = `
            INSERT INTO periodontal_charts (patient_id, doctor_id, exam_date, status, notes)
            VALUES ($1, $2, $3, 'draft', $4)
            RETURNING *;
        `;
        const values = [patientId, doctorId || null, examDate || new Date(), notes || ''];

        const dbResult = await query(insertQuery, values);
        return NextResponse.json(dbResult.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error creating chart:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
