export type ChartStatus = 'draft' | 'finalized';

export interface ChartExam {
    id?: number;
    patientId: number;
    doctorId?: number;
    examDate: string;
    status: ChartStatus;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Tooth {
    id?: number;
    chartId?: number;
    toothNumber: number; // 11-48
    mobility: number; // 0-3
    furcation: number; // 0-3
    sites?: Site[];
}

export interface Site {
    id?: number;
    toothId?: number;
    sitePosition: number; // 1-6
    pd: number; // >= 0
    gm?: number;
    cal?: number; // pd - gm (calculated)
    bop: boolean;
    pi: boolean;
}

export interface BatchSaveRequest {
    chartId: number;
    teeth: Tooth[]; // Complete payload with teeth and their nested sites
}
