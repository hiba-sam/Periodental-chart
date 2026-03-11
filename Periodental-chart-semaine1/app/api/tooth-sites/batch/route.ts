import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';

export async function POST(request: Request) {
    const client = await getClient();
    try {
        const body = await request.json();
        const { patient_id, sites } = body;

        if (!patient_id || !Array.isArray(sites)) {
            return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
        }

        await client.query('BEGIN');

        // Check if an exam already exists for this patient TODAY
        const examCheck = await client.query(
            `SELECT id FROM chart_exams 
             WHERE patient_id = $1 AND exam_date = CURRENT_DATE 
             ORDER BY id DESC LIMIT 1`,
            [patient_id]
        );

        let examId;
        if (examCheck.rows.length > 0) {
            // Exam exists for today, reuse it and clear its existing sites
            examId = examCheck.rows[0].id;
            await client.query('DELETE FROM tooth_sites WHERE exam_id = $1', [examId]);
        } else {
            // Create a new exam for today
            const newExam = await client.query(
                `INSERT INTO chart_exams (patient_id, exam_date, exam_type, practitioner) 
                 VALUES ($1, CURRENT_DATE, 'reevaluation', 'Système') 
                 RETURNING id`,
                [patient_id]
            );
            examId = newExam.rows[0].id;
        }

        // Insert new points linked to the examId
        for (const site of sites) {
            await client.query(
                `INSERT INTO tooth_sites (patient_id, exam_id, tooth_number, site_position, pd, gm, cal, bop, plaque, mobility, furcation, implant, prognosis)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    patient_id,
                    examId,
                    site.tooth_number,
                    site.site_location,
                    site.probing_depth || 0,
                    site.gingival_margin || 0,
                    site.cal || 0,
                    site.bleeding_on_probing || false,
                    site.plaque || false,
                    site.mobility || 0,
                    site.furcation || 0,
                    site.implant || false,
                    site.prognosis || ''
                ]
            );
        }

        await client.query('COMMIT');

        return NextResponse.json({ success: true, exam_id: examId }, { status: 201 });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error batch inserting tooth sites:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
