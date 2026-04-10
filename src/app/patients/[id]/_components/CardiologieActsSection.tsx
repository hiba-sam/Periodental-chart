'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

const CardioEvolutionModal = dynamic(
    () => import('@/features/cardiology/components/CardioEvolutionModal'),
    { loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96" />, ssr: false }
);

interface CRCardio {
    id: number; patient_id: string; doctor_user_id: number;
    patient_age?: number | null; patient_sex?: string | null;
    patient_weight?: number | null; patient_height?: number | null; patient_bmi?: number | null;
    heart_rate?: number | null; systolic_bp?: number | null; diastolic_bp?: number | null;
    auscultation?: string | null; nyha_class?: number | null;
    ecg_result?: string | null; ecg_detail?: string | null;
    echo_lvef?: number | null; known_lvef?: number | null;
    echo_lvedd?: number | null; echo_la_size?: number | null;
    echo_valvulopathies?: string[] | null; echo_pulmonary_htn?: number | null;
    bio_bnp?: number | null; bio_troponin?: number | null;
    bio_ldl?: number | null; bio_hdl?: number | null;
    bio_total_cholesterol?: number | null; bio_triglycerides?: number | null;
    bio_hba1c?: number | null; bio_creatinine?: number | null; bio_inr?: number | null;
    has_hta?: boolean; has_diabetes?: boolean; has_afib?: boolean;
    has_heart_failure?: boolean; has_mi?: boolean; has_stroke?: boolean;
    free_notes?: string | null;
    score_cha2ds2_vasc?: number | null; score_has_bled?: number | null;
    score_grace?: number | null; score_framingham?: number | null;
    score_score2?: number | null; score_nyha?: number | null; score_euroscore2?: number | null;
    created_at: string; updated_at: string;
    doctor_name?: string; doctor_family_name?: string;
}

interface CardiologieActsSectionProps {
    patientId: string; patientName: string;
    patientAge?: number; patientSex?: string;
    currentUserId: number; isVisible: boolean;
}

async function fetchCRCardio(patientId: string): Promise<CRCardio[]> {
    const { data } = await axios.get(`${API_URL}/api/patients/${patientId}/cardiology-reports`, { withCredentials: true });
    return data.data || [];
}

function KpiCard({ label, value, unit, colorClass }: { label: string; value: string | number | null | undefined; unit?: string; colorClass?: string }) {
    const display = value != null && value !== '' ? `${value}${unit ? ` ${unit}` : ''}` : '—';
    return (
        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl min-w-[90px]">
            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</span>
            <span className={`text-lg font-bold ${colorClass || 'text-gray-700 dark:text-gray-200'}`}>{display}</span>
        </div>
    );
}

function BioRow({ label, value, unite, min, max }: { label: string; value: number | null | undefined; unite: string; min?: number; max?: number }) {
    let color = 'text-gray-400';
    if (value != null) {
        const bad = (max != null && value > max) || (min != null && value < min);
        color = bad ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-green-600 dark:text-green-400';
    }
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
            <span className={`text-sm font-semibold ${color}`}>{value != null ? `${value} ${unite}` : '—'}</span>
        </div>
    );
}

function ScoreBadge({ label, value, danger }: { label: string; value: number | null | undefined; danger?: number }) {
    if (value == null) return null;
    const bad = danger != null && value >= danger;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${bad ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'}`}>
            {label}: <strong>{value}</strong>
        </span>
    );
}

function formatDate(d: string | null | undefined) {
    if (!d) return null;
    try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return d; }
}

export function CardiologieActsSection({ patientId, patientName, patientAge, patientSex, currentUserId, isVisible }: CardiologieActsSectionProps) {
    const [showEvolution, setShowEvolution] = useState(false);
    const [allReports, setAllReports] = useState<CRCardio[]>([]);
    const [latestCR, setLatestCR] = useState<CRCardio | null>(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(() => {
        setLoading(true);
        fetchCRCardio(patientId)
            .then(reports => { setAllReports(reports); setLatestCR(reports.length > 0 ? reports[0] : null); setLoading(false); })
            .catch(() => setLoading(false));
    }, [patientId]);

    useEffect(() => { loadData(); }, [loadData]);

    if (!isVisible) return null;

    const r = latestCR;
    const fevg = r?.echo_lvef ?? r?.known_lvef ?? null;
    const imc = r?.patient_bmi ?? (r?.patient_weight && r?.patient_height ? +(r.patient_weight / ((r.patient_height / 100) ** 2)).toFixed(1) : null);
    const paColor = (v: number | null | undefined) => { if (v == null) return ''; if (v >= 180 || v <= 80) return 'text-red-600 font-bold'; if (v >= 140 || v < 90) return 'text-orange-600 font-semibold'; return 'text-green-600'; };
    const fcColor = (v: number | null | undefined) => { if (v == null) return ''; if (v >= 130 || (v && v < 40)) return 'text-red-600 font-bold'; if (v >= 100 || (v && v < 50)) return 'text-orange-600'; return 'text-green-600'; };
    const historyFlags = r ? [r.has_hta && 'HTA', r.has_diabetes && 'Diabète', r.has_afib && 'FA', r.has_heart_failure && 'IC', r.has_mi && 'IDM', r.has_stroke && 'AVC'].filter(Boolean) : [];

    return (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Synthèse Cardiologique</h3>
                        {r && <p className="text-[11px] text-gray-500 dark:text-gray-400">Dernière MAJ : {formatDate(r.updated_at || r.created_at)}{r.doctor_name ? ` — Dr. ${r.doctor_name}` : ''}</p>}
                    </div>
                </div>
                {allReports.length >= 1 && (
                    <button onClick={() => setShowEvolution(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                        Évolutions
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-10"><div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" /></div>
            ) : !r ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                    <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aucune donnée cardiologique</p>
                    <p className="text-xs text-gray-400 mt-1">Créez un CR Cardio pour alimenter cette synthèse</p>
                    <button onClick={() => setShowEvolution(true)} className="mt-3 text-sm text-red-600 hover:underline font-medium">Créer un CR Cardio</button>
                </div>
            ) : (
                <>
                    {/* Scores */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <ScoreBadge label="NYHA" value={r.score_nyha} danger={3} />
                        <ScoreBadge label="CHA₂DS₂-VASc" value={r.score_cha2ds2_vasc} danger={2} />
                        <ScoreBadge label="HAS-BLED" value={r.score_has_bled} danger={3} />
                        <ScoreBadge label="GRACE" value={r.score_grace} danger={140} />
                        {r.score_framingham != null && <ScoreBadge label="Framingham" value={r.score_framingham} danger={20} />}
                        {r.score_score2 != null && <ScoreBadge label="SCORE2" value={r.score_score2} danger={10} />}
                        {r.score_euroscore2 != null && <ScoreBadge label="EuroSCORE II" value={r.score_euroscore2} danger={5} />}
                        {historyFlags.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                                ATCD: {historyFlags.join(', ')}
                            </span>
                        )}
                    </div>

                    {/* KPI Cards */}
                    <div className="flex flex-wrap gap-3 mb-5">
                        <KpiCard label="PA" value={r.systolic_bp && r.diastolic_bp ? `${r.systolic_bp}/${r.diastolic_bp}` : null} unit="mmHg" colorClass={paColor(r.systolic_bp)} />
                        <KpiCard label="FC" value={r.heart_rate} unit="bpm" colorClass={fcColor(r.heart_rate)} />
                        <KpiCard label="FEVG" value={fevg} unit="%" colorClass={fevg != null ? (fevg < 40 ? 'text-red-600 font-bold' : fevg < 55 ? 'text-orange-600' : 'text-green-600') : undefined} />
                        <KpiCard label="ECG" value={r.ecg_result} colorClass={r.ecg_result && r.ecg_result !== 'normal' ? 'text-orange-600 font-semibold' : 'text-green-600'} />
                        <KpiCard label="IMC" value={imc} colorClass={imc ? (imc > 30 ? 'text-orange-600' : imc < 18.5 ? 'text-orange-600' : 'text-green-600') : undefined} />
                        <KpiCard label="NYHA" value={r.nyha_class ? `Classe ${r.nyha_class}` : null} colorClass={r.nyha_class && r.nyha_class >= 3 ? 'text-red-600 font-bold' : 'text-green-600'} />
                    </div>

                    {/* 3-column grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* COL 1: ECG + ETT */}
                        <div className="space-y-3">
                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
                                <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">ECG</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">Résultat</span><span className="font-medium text-gray-700 dark:text-gray-300">{r.ecg_result || '—'}</span></div>
                                    {r.ecg_detail && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">{r.ecg_detail}</p>}
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
                                <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Échographie (ETT)</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">FEVG</span><span className={`font-bold ${fevg != null && fevg < 40 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>{fevg != null ? `${fevg}%` : '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">DTD VG</span><span className="font-medium text-gray-700 dark:text-gray-300">{r.echo_lvedd ? `${r.echo_lvedd} mm` : '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">OG</span><span className="font-medium text-gray-700 dark:text-gray-300">{r.echo_la_size ? `${r.echo_la_size} mm` : '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">HTAP</span><span className="font-medium text-gray-700 dark:text-gray-300">{r.echo_pulmonary_htn ? `${r.echo_pulmonary_htn} mmHg` : '—'}</span></div>
                                    {r.echo_valvulopathies && r.echo_valvulopathies.length > 0 && (
                                        <div className="flex justify-between"><span className="text-gray-500">Valvulopathies</span><span className="font-medium text-gray-700 dark:text-gray-300">{r.echo_valvulopathies.join(', ')}</span></div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* COL 2: Biology */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
                            <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Biologie</h4>
                            <div className="space-y-0.5">
                                <BioRow label="LDL" value={r.bio_ldl} unite="g/L" max={0.55} />
                                <BioRow label="HDL" value={r.bio_hdl} unite="g/L" min={0.40} />
                                <BioRow label="Chol. total" value={r.bio_total_cholesterol} unite="g/L" max={2.0} />
                                <BioRow label="Triglycérides" value={r.bio_triglycerides} unite="g/L" max={1.50} />
                                <BioRow label="HbA1c" value={r.bio_hba1c} unite="%" max={7.0} />
                                <BioRow label="Créatinine" value={r.bio_creatinine} unite="µmol/L" min={60} max={110} />
                                <BioRow label="BNP" value={r.bio_bnp} unite="pg/mL" max={100} />
                                <BioRow label="Troponine" value={r.bio_troponin} unite="ng/mL" max={0.04} />
                                {r.bio_inr != null && <BioRow label="INR" value={r.bio_inr} unite="" min={2.0} max={3.0} />}
                            </div>
                        </div>

                        {/* COL 3: Clinical + Notes */}
                        <div className="space-y-3">
                            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
                                <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Examen clinique</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500">Auscultation</span><span className="font-medium text-gray-700 dark:text-gray-300">{r.auscultation || '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">NYHA</span><span className={`font-medium ${r.nyha_class && r.nyha_class >= 3 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>{r.nyha_class ? `Classe ${r.nyha_class}` : '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Poids</span><span className="font-medium text-gray-700 dark:text-gray-300">{r.patient_weight ? `${r.patient_weight} kg` : '—'}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Taille</span><span className="font-medium text-gray-700 dark:text-gray-300">{r.patient_height ? `${r.patient_height} cm` : '—'}</span></div>
                                </div>
                            </div>
                            {r.free_notes && (
                                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
                                    <h4 className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Notes</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">{r.free_notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Evolution Modal */}
            {showEvolution && (
                <CardioEvolutionModal
                    isOpen={showEvolution}
                    onClose={() => setShowEvolution(false)}
                    reports={allReports}
                    patientName={patientName}
                />
            )}
        </div>
    );
}