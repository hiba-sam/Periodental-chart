'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ChevronLeftIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    CheckCircleIcon,
    ArrowDownTrayIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

const LegacyToothChart = dynamic(() => import('./LegacyToothChart'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-50 h-[800px] w-full rounded-3xl" />
});

interface PeriodontalChartEditorProps {
    patientId: string;
    patientName?: string;
    initialExamId?: number | null;
    fromId?: number | null;
    onClose?: () => void;
    onSaved?: () => void;
    noCard?: boolean;
    forceViewAll?: boolean;
    onChartLoaded?: () => void;
    hideControls?: boolean;
    hideKpis?: boolean;
    readOnly?: boolean;
}

export default function PeriodontalChartEditor({
    patientId,
    patientName = 'Patient',
    initialExamId = null,
    fromId = null,
    onClose,
    onSaved,
    noCard = false,
    forceViewAll = false,
    onChartLoaded,
    hideControls = false,
    hideKpis = false,
    readOnly = false
}: PeriodontalChartEditorProps) {
    const [examId, setExamId] = useState<number | null>(initialExamId);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [perioView, setPerioView] = useState<'all' | 'superior' | 'inferior'>('superior');
    const [examStatus, setExamStatus] = useState<'draft' | 'finalized'>('draft');
    const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
    const [currentStats, setCurrentStats] = useState({ plaquePct: 0, deepPockets: 0, bleedPct: 0, avgCal: 0, avgPd: 0, mobility: 0 });

    const lastSavedData = useRef<string>("");
    const currentExamIdRef = useRef<number | null>(initialExamId);
    const isHydrated = useRef(false);

    const fetchData = useCallback(async () => {
        let targetId = examId;
        setLoading(true);

        try {
            if (!targetId) {
                const createRes = await fetch('/api/perio/charts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patientId, fromId })
                });
                if (createRes.ok) {
                    const newChart = await createRes.json();
                    targetId = newChart.id;
                    setExamId(targetId);
                    currentExamIdRef.current = targetId;
                }
            }

            if (targetId) {
                const [examRes, sitesRes] = await Promise.all([
                    fetch(`/api/perio/charts/${targetId}`, { cache: 'no-store' }),
                    fetch(`/api/perio/sites?exam_id=${targetId}`, { cache: 'no-store' })
                ]);

                if (examRes.ok) {
                    const examDetail = await examRes.json();
                    setExamStatus(examDetail.status || 'draft');
                }

                if (sitesRes.ok) {
                    const sitesData = await sitesRes.json();
                    setData(sitesData);
                    lastSavedData.current = JSON.stringify(sitesData);
                    isHydrated.current = false;
                }
            }
        } catch (error) {
            console.error("[PERIO_LOAD_ERROR]", error);
        } finally {
            setLoading(false);
        }
    }, [patientId, examId, fromId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!loading && onChartLoaded && data.length === 0) {
            const t = setTimeout(() => {
                onChartLoaded();
            }, 500);
            return () => clearTimeout(t);
        }
    }, [loading, onChartLoaded, data.length]);

    const handleSavePatient = async (isManual = false) => {
        const targetExamId = currentExamIdRef.current || examId;
        if (examStatus === 'finalized' || !targetExamId) return;

        setIsSaving(true);
        try {
            const sites: any[] = [];
            const teethRows = [
                { teeth: [18, 17, 16, 15, 14, 13, 12, 11], suffix: '' },
                { teeth: [21, 22, 23, 24, 25, 26, 27, 28], suffix: '' },
                { teeth: [18, 17, 16, 15, 14, 13, 12, 11], suffix: 'b' },
                { teeth: [21, 22, 23, 24, 25, 26, 27, 28], suffix: 'b' },
                { teeth: [48, 47, 46, 45, 44, 43, 42, 41], suffix: '' },
                { teeth: [31, 32, 33, 34, 35, 36, 37, 38], suffix: '' },
                { teeth: [48, 47, 46, 45, 44, 43, 42, 41], suffix: 'b' },
                { teeth: [31, 32, 33, 34, 35, 36, 37, 38], suffix: 'b' }
            ];

            const parseVal = (id: string, zeroIsNull = false) => {
                const el = document.getElementById(id) as HTMLInputElement;
                if (!el) return null;
                const val = el.value.trim();
                const num = parseInt(val, 10);
                if (isNaN(num)) return null;
                if (zeroIsNull && num === 0) return null;
                return num;
            };

            const isSiteActive = (id: string) => {
                const el = document.getElementById(id);
                return el ? el.dataset.value === '1' : false;
            };

            const existingSitesSet = new Set(data.map(s => `${s.tooth_number}-${s.site_location}`));

            for (const row of teethRows) {
                for (const t of row.teeth) {
                    const su = row.suffix;
                    const isUpperTooth = t < 31;
                    let mobilityVal = ((isUpperTooth && su === '') || (!isUpperTooth && su === 'b')) ? parseVal(`m${t}${su}`) : null;
                    let prognosisVal = ((isUpperTooth && su === 'b') || (!isUpperTooth && su === '')) ? (document.getElementById(`pi${t}${su}`) as HTMLInputElement)?.value.trim() : null;

                    let implant = false;
                    const elI = document.getElementById(`imp-check-${t}${su}`);
                    if (elI) implant = elI.dataset.active === 'true';

                    let furcation = null, furcationP = null, furcationP2 = null;
                    if (isUpperTooth) {
                        if (su === '') {
                            const el = document.getElementById(`f${t}${su}`);
                            if (el?.dataset.value) furcation = parseInt(el.dataset.value, 10);
                        } else if (su === 'b') {
                            if ([18, 17, 16, 14, 28, 27, 26, 24].includes(t)) {
                                const elA = document.getElementById(`f${t}-a`), elB = document.getElementById(`f${t}-b`);
                                if (elA?.dataset.value) furcationP = parseInt(elA.dataset.value, 10);
                                if (elB?.dataset.value) furcationP2 = parseInt(elB.dataset.value, 10);
                            } else {
                                const el = document.getElementById(`f${t}${su}`);
                                if (el?.dataset.value) furcationP = parseInt(el.dataset.value, 10);
                            }
                        }
                    } else {
                        if (su === '') {
                            const el = document.getElementById(`f${t}${su}`);
                            if (el?.dataset.value) furcationP = parseInt(el.dataset.value, 10);
                        } else if (su === 'b') {
                            const el = document.getElementById(`f${t}${su}`);
                            if (el?.dataset.value) furcation = parseInt(el.dataset.value, 10);
                        }
                    }

                    for (const loc of ['a', 'b', 'c']) {
                        const fullLoc = `${su ? su + '-' : ''}${loc}`;
                        const rawPs = parseVal(`ps${t}${su}-${loc}`);
                        const ps = rawPs !== null ? Math.abs(rawPs) : null;
                        const mg = parseVal(`mg${t}${su}-${loc}`);
                        const bop = isSiteActive(`s${t}${su}-${loc}`);
                        const pi = isSiteActive(`p${t}${su}-${loc}`);
                        const alreadyInDB = existingSitesSet.has(`${t}-${fullLoc}`);

                        if (ps !== null || mg !== null || bop || pi || alreadyInDB || mobilityVal !== null || furcation !== null || furcationP !== null || furcationP2 !== null || implant === true || (prognosisVal !== null && prognosisVal !== '')) {
                            sites.push({
                                tooth_number: t, site_location: fullLoc, probing_depth: ps, gingival_margin: mg, bleeding_on_probing: bop, plaque: pi,
                                mobility: mobilityVal, furcation, furcation_p: furcationP, furcation_p2: furcationP2, implant, prognosis: prognosisVal
                            });
                        }
                    }
                }
            }

            if (sites.length === 0 && !isManual) { setIsSaving(false); return; }

            const batchRes = await fetch('/api/perio/sites/batch', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patient_id: patientId, exam_id: targetExamId, sites })
            });

            if (batchRes.ok) {
                const bop = Math.round(parseFloat(document.getElementById('suma')?.innerText || '0'));
                const pi = Math.round(parseFloat(document.getElementById('suma2')?.innerText || '0'));
                const pd = parseFloat(document.getElementById('suma4')?.innerText || '0');
                const cal = parseFloat(document.getElementById('suma5')?.innerText || '0');

                const updateRes = await fetch(`/api/perio/charts/${targetExamId}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        bop_pct: bop, 
                        pi_pct: pi, 
                        avg_pd: pd, 
                        avg_cal: cal 
                    })
                });


                if (updateRes.ok) {
                    setLastSavedTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
                    setSaveStatus('success');
                    if (onSaved) onSaved();
                    setTimeout(() => setSaveStatus('idle'), 3000);
                } else {
                    const err = await updateRes.json();
                    alert(`Erreur lors de la mise à jour des stats: ${err.error || 'Erreur inconnue'}`);
                    setSaveStatus('error');
                }
            } else {
                const err = await batchRes.json();
                alert(`Erreur lors de l'enregistrement des sites: ${err.error || 'Erreur inconnue'}`);
                setSaveStatus('error');
            }
        } catch (error) {
            console.error("[PERIO_SAVE_ERROR]", error);
            alert("Une erreur est survenue lors de l'enregistrement du statut.");
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTriggerSave = () => {
        // Enregistrement automatique désactivé selon votre demande.
        // Vous devez cliquer sur Enregistrer manuellement.
    };

    useEffect(() => {
        if (loading || isHydrated.current || data.length === 0) return;
        const timer = setTimeout(() => {
            setTimeout(() => {
                data.forEach(s => {
                    const t = s.tooth_number;
                    const locArr = s.site_location.split('-');
                    const su = locArr.length > 1 ? locArr[0] : '';
                    const loc = locArr.length > 1 ? locArr[1] : locArr[0];
                    const ps = (document.getElementById(`ps${t}${su}-${loc}`) as HTMLInputElement);
                    if (ps) ps.value = s.probing_depth != null ? s.probing_depth.toString() : '';
                    const mg = (document.getElementById(`mg${t}${su}-${loc}`) as HTMLInputElement);
                    if (mg) mg.value = s.gingival_margin != null ? s.gingival_margin.toString() : '';
                    const bop = document.getElementById(`s${t}${su}-${loc}`);
                    if (bop) { bop.dataset.value = s.bleeding_on_probing ? '1' : '0'; bop.style.backgroundColor = s.bleeding_on_probing ? 'red' : 'white'; }
                    const pi = document.getElementById(`p${t}${su}-${loc}`);
                    if (pi) { pi.dataset.value = s.plaque ? '1' : '0'; pi.style.backgroundColor = s.plaque ? '#58ACFA' : 'white'; }
                    const imp = document.getElementById(`imp-check-${t}${su}`);
                    if (imp && s.implant) { imp.dataset.active = 'true'; imp.style.backgroundColor = '#000'; imp.style.display = 'block'; const toothEl = document.getElementById(`diente${t}${su}-a`); if (toothEl) toothEl.style.backgroundImage = `url('/img/tabla${t < 20 ? 1 : 2}/implantes/periodontograma-dientes-${t < 31 ? 'arriba' : 'abajo'}-tornillo-${t}${su}.png')`; }
                    const m = s.mobility;
                    if (m != null) { const mel = document.getElementById(`m${t}${su}`) as HTMLInputElement; if (mel) mel.value = m.toString(); }
                    const pr = s.prognosis;
                    if (pr != null) { const prel = document.getElementById(`pi${t}${su}`) as HTMLInputElement; if (prel) prel.value = pr; }
                    const f = s.furcation, fp = s.furcation_p, fp2 = s.furcation_p2;
                    if (t < 31 && su === 'b' && [18, 17, 16, 14, 28, 27, 26, 24].includes(t)) {
                        if (fp != null) { const el = document.getElementById(`f${t}-a`); if (el) { el.dataset.value = fp.toString(); el.innerText = ''; } const vEl = document.getElementById(`furca${t}-a`); if (vEl) vEl.dataset.value = fp.toString(); }
                        if (fp2 != null) { const el = document.getElementById(`f${t}-b`); if (el) { el.dataset.value = fp2.toString(); el.innerText = ''; } const vEl = document.getElementById(`furca${t}-b`); if (vEl) vEl.dataset.value = fp2.toString(); }
                    } else {
                        const fv = t < 31 ? (su === '' ? f : fp) : (su === '' ? fp : f);
                        if (fv != null) { const el = document.getElementById(`f${t}${su}`); if (el) { el.dataset.value = fv.toString(); el.innerText = ''; } const vEl = document.getElementById(`furca${t}${su}`); if (vEl) vEl.dataset.value = fv.toString(); }
                    }
                });
                isHydrated.current = true;
                if ((window as any).updateSummaries) (window as any).updateSummaries(false);
                if (onChartLoaded) {
                    setTimeout(() => onChartLoaded(), 400);
                }
            }, 100);
        }, 200);
        return () => clearTimeout(timer);
    }, [data, loading, onChartLoaded]);



    return (
        <div className={`flex flex-col bg-white dark:bg-gray-900 border-none transition-all duration-500 ${hideControls ? 'w-full pb-10' : 'h-full overflow-hidden'}`}>
            {/* Header Control Panel */}
            {!hideControls && (
                <div className="flex items-center justify-between px-8 py-0 z-50">
                    <div className="flex items-center gap-6">
                        {!forceViewAll && (
                            <div className="flex items-center bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 w-[320px] justify-between shadow-inner">
                                <button onClick={() => setPerioView('superior')} className={`flex-1 py-3 rounded-[1rem] text-sm font-black uppercase transition-all duration-300 ${perioView === 'superior' ? 'bg-white text-cyan-600 shadow-lg scale-105 z-10' : 'text-gray-400 hover:text-gray-600'}`}>Supérieur</button>
                                <button onClick={() => setPerioView('inferior')} className={`flex-1 py-3 rounded-[1rem] text-sm font-black uppercase transition-all duration-300 ${perioView === 'inferior' ? 'bg-white text-cyan-600 shadow-lg scale-105 z-10' : 'text-gray-400 hover:text-gray-600'}`}>Inférieur</button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {(examStatus === 'draft' && !readOnly) && (
                            <button onClick={() => handleSavePatient(true)} disabled={isSaving} className={`px-6 py-2 ${saveStatus === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : saveStatus === 'error' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-cyan-600 hover:bg-cyan-700'} text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors`}>
                                {isSaving ? 'Enregistrement...' : saveStatus === 'success' ? 'Enregistré ✓' : 'Enregistrer'}
                            </button>
                        )}
                        {(examStatus === 'finalized' || readOnly) && <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase border border-emerald-100 tracking-widest">Lecture Seule</div>}
                    </div>
                </div>
            )}

            {/* Chart Area */}
            <div className={`flex flex-col items-center justify-start w-full relative pt-4 ${hideControls ? '' : 'flex-1 overflow-auto scrollbar-hide'}`}>
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center my-auto"><div className="w-12 h-12 border-4 border-cyan-100 border-t-cyan-500 rounded-full animate-spin mb-6"></div><p className="text-xs font-black text-gray-400 uppercase tracking-widest">Chargement...</p></div>
                ) : (() => {
                    const isAllView = forceViewAll || perioView === 'all';
                    const targetHeight = isAllView ? 1600 : 850;
                    return (
                        <div className="flex flex-col w-full">
                            <div className="periodontograma-legacy-wrapper origin-top flex flex-col items-center justify-start w-full" style={{ minWidth: '1120px', zoom: hideControls ? '1.0' : `min(1.0, min(calc(100vw / 1100), calc(68vh / ${targetHeight})))` }}>
                                <link rel="stylesheet" href="/estilo.css" />
                                <div className="p-0 bg-white">
                                    <LegacyToothChart readOnly={examStatus === 'finalized' || readOnly} onChange={handleTriggerSave} view={isAllView ? 'all' : perioView} hideKpis={hideKpis} sites={data} onStatsUpdate={setCurrentStats} />
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
