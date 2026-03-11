// app/api/perio-charts/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { patient_id, doctor_id, notes } = body;

        // Insertion d'un nouvel examen avec le statut 'draft' par défaut
        const result = await pool.query(
            `INSERT INTO periodontal_charts (patient_id, doctor_id, notes, status)
       VALUES ($1, $2, $3, 'draft')
       RETURNING *`,
            [patient_id, doctor_id, notes]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du chart:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}