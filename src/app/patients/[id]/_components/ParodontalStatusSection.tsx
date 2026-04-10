'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
    PlusIcon,
    ListBulletIcon,
    ClockIcon,
    ChevronRightIcon,
    ArrowDownTrayIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

import PeriodontalChartEditor from '@/components/perio/PeriodontalChartEditor';
import PerioKpiDashboard from '@/components/perio/PerioKpiDashboard';

const ParodontalStatusModal = dynamic(() => import('./ParodontalStatusModal'), {
    ssr: false,
});

interface ParodontalStatusSectionProps {
    patientId: string;
    patientName?: string;
    isVisible: boolean;
    noCard?: boolean;
}

export const ParodontalStatusSection = React.forwardRef<any, ParodontalStatusSectionProps>(
    ({ patientId, patientName = 'Patient', isVisible, noCard = false }, ref) => {
        const [showModal, setShowModal] = useState(false);
        const [exams, setExams] = useState<any[]>([]);
        const [loading, setLoading] = useState(true);
        const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
        const [initialView, setInitialView] = useState<any>('menu');

        const [showListPane, setShowListPane] = useState(true);
        const [showViewPane, setShowViewPane] = useState(false);

        const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
        const [pdfRenderAction, setPdfRenderAction] = useState<'download' | 'print' | null>(null);

        const [showDropdown, setShowDropdown] = useState(false);
        const [isCreating, setIsCreating] = useState(false);
        const dropdownRef = useRef<HTMLDivElement>(null);

        // Search Bar State
        const [searchQuery, setSearchQuery] = useState('');
        
        // Sites caching to calculate deep pockets
        const [loadedSites, setLoadedSites] = useState<any[]>([]);
        
        // Full patient details for PDF
        const [fullPatient, setFullPatient] = useState<any>(null);

        useEffect(() => {
            function handleClickOutside(event: MouseEvent) {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setShowDropdown(false);
                }
            }
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, [dropdownRef]);

        const handleCreateNewLocally = async () => {
            setShowDropdown(false);
            setIsCreating(true);
            try {
                const res = await fetch('/api/perio/charts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patientId })
                });
                if (res.ok) {
                    const newChart = await res.json();
                    setSelectedExamId(newChart.id);
                    setInitialView('chart');
                    setShowModal(true);
                    const listRes = await fetch(`/api/perio/charts?patient_id=${patientId}`, { cache: 'no-store' });
                    const data = await listRes.json();
                    setExams(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsCreating(false);
            }
        };

        const handleCreateOldLocally = async () => {
            setShowDropdown(false);
            setIsCreating(true);
            try {
                const listRes = await fetch(`/api/perio/charts?patient_id=${patientId}`, { cache: 'no-store' });
                const latestExams = await listRes.json();
                if (latestExams && latestExams.length > 0) {
                    const latest = latestExams[0];
                    const res = await fetch('/api/perio/charts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ patientId, fromId: latest.id })
                    });
                    if (res.ok) {
                        const newChart = await res.json();
                        setSelectedExamId(newChart.id);
                        setInitialView('chart');
                        setShowModal(true);
                        const listRes2 = await fetch(`/api/perio/charts?patient_id=${patientId}`, { cache: 'no-store' });
                        const data = await listRes2.json();
                        setExams(Array.isArray(data) ? data : []);
                    }
                } else {
                    handleCreateNewLocally();
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsCreating(false);
            }
        };

        React.useImperativeHandle(ref, () => ({
            createNew: handleCreateNewLocally,
            createOld: handleCreateOldLocally,
            toggleView: () => {
                setShowListPane(false);
                setShowViewPane(true);
                if (exams.length > 0 && !selectedExamId) setSelectedExamId(exams[0].id);
            },
            toggleList: () => {
                setShowViewPane(false);
                setShowListPane(true);
            },

            handleDownloadReport: () => {
                const latest = exams[0];
                if (!latest) return alert('Veuillez d\'abord enregistrer un statut parodontal.');
                setSelectedExamId(latest.id);
                setPdfRenderAction('download');
                setIsGeneratingPDF(true);
            }
        }));

        const getExamKpis = (examId: any) => {
            if (!examId || exams.length === 0) return null;
            const exam = exams.find(e => Number(e.id) === Number(examId)) || exams[0];
            if (!exam) return null;

            // Helper to extract numeric value from strings like "25%" or "3.5mm"
            const parseVal = (v: any) => {
                if (v === undefined || v === null) return 0;
                const matches = String(v).match(/[\d.]+/);
                return matches ? parseFloat(matches[0]) : 0;
            };

            const bop = parseVal(exam.bop_pct);
            const pi = parseVal(exam.pi_pct);
            const pd = parseVal(exam.avg_pd);
            const cal = parseVal(exam.avg_cal);
            
            const perte = `${cal.toFixed(1)}mm`;
            const plaqueIndexForm = (pi / 25).toFixed(1); // Scaled for 0-4 range approx
            const poches = `${pd}%`;

            return { exam, bop, pi, pd, poches, perte, plaqueIndexForm, cal };
        };


        const executePdfOrPrintAction = async () => {
            if (!pdfRenderAction) return;
            try {
                if (pdfRenderAction === 'download') {
                    // Force a delay of 2.5s here instead of inside the chart to ensure Chart UI animations settle
                    await new Promise(r => setTimeout(r, 2500));
                    
                    const html2canvas = (await import('html2canvas')).default;
                    const { jsPDF } = await import('jspdf');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    
                    const summaryEl = document.getElementById('perio-pdf-summary-part');
                    if (summaryEl) {
                        const canvas1 = await html2canvas(summaryEl, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff', logging: false });
                        const imgData1 = canvas1.toDataURL('image/jpeg', 0.85);
                        const imgHeight1 = (canvas1.height * pdfWidth) / canvas1.width;
                        pdf.addImage(imgData1, 'JPEG', 0, 0, pdfWidth, imgHeight1);
                    }
                    
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    
                    const chartsEl = document.getElementById('perio-pdf-charts-part');
                    if (chartsEl) {
                        pdf.addPage();
                        const canvas2 = await html2canvas(chartsEl, { scale: 1.5, useCORS: true, backgroundColor: '#ffffff', windowWidth: 1400, logging: false });
                        const imgData2 = canvas2.toDataURL('image/jpeg', 0.85);
                        
                        // Calculate aspect ratio to fit the page horizontally AND vertically so teeth are not cut
                        const ratio = Math.min(pdfWidth / canvas2.width, (pdfHeight - 10) / canvas2.height);
                        const scaledWidth = canvas2.width * ratio;
                        const scaledHeight = canvas2.height * ratio;
                        
                        pdf.addImage(imgData2, 'JPEG', (pdfWidth - scaledWidth) / 2, 5, scaledWidth, scaledHeight);
                    }
                    
                    pdf.save(`Rapport_Parodontal_${patientName.replace(/\s+/g, '_')}.pdf`);
                    setIsGeneratingPDF(false);
                    setPdfRenderAction(null);
                }
            } catch (e) {
                console.error(e);
                setIsGeneratingPDF(false);
            }
        };

        const openExam = (id: number) => {
            setSelectedExamId(id);
            setInitialView('chart');
            setShowModal(true);
        };

        const fetchExams = async () => {
            try {
                const res = await fetch(`/api/perio/charts?patient_id=${patientId}`, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    const sortedData = Array.isArray(data) ? data : [];
                    setExams(sortedData);
                    
                    // Always default to the latest exam if nothing is selected or current selection is old
                    if (sortedData.length > 0) {
                        if (!selectedExamId || !sortedData.find(e => Number(e.id) === Number(selectedExamId))) {
                            setSelectedExamId(sortedData[0].id);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            if (isVisible && patientId) fetchExams();
        }, [patientId, isVisible, showViewPane]);

        useEffect(() => {
            // Fetch sites for the currently selected exam to calculate actual deep pockets
            const latestExam = exams.length > 0 ? exams[0] : null;
            const effectiveExamId = selectedExamId || (latestExam ? latestExam.id : null);
            if (showViewPane && effectiveExamId) {
                fetch(`/api/perio/sites?exam_id=${effectiveExamId}`)
                    .then(r => r.json())
                    .then(data => {
                        if (Array.isArray(data)) setLoadedSites(data);
                    })
                    .catch(e => console.error(e));
            }
            
            // Fetch complete patient details for the professional PDF
            if (patientId && !fullPatient) {
                fetch(`/api/patients/${patientId}`)
                    .then(r => r.json())
                    .then(data => {
                        if (data && data.data) setFullPatient(data.data);
                        else if (data && !data.data) setFullPatient(data);
                    })
                    .catch(e => console.error(e));
            }
        }, [selectedExamId, exams, showViewPane, patientId]);


        if (!isVisible) return null;

        // Filtered exams logic
        const filteredExams = exams.filter(exam => {
            if (!searchQuery) return true;
            const dateStr = new Date(exam.created_at).toLocaleDateString('fr-FR');
            return dateStr.includes(searchQuery);
        });

        return (
            <>
                <div className={noCard ? "px-6 py-2 transition-colors w-full" : "bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 w-[900px] min-h-[400px]"}>
                    {!noCard && (
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                                    <svg className="w-5 h-5 text-cyan-600 dark:text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 2C8.5 2 6 4 6 7c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5 0 3 1 5 4 5s4-2 4-5c0-2 .5-3.5 1-5s1-3 1-5c0-3-2.5-5-6-5z" />
                                    </svg>
                                </div>
                                {/* Title Removed */}
                            </h2>
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    disabled={isCreating}
                                    className="px-4 py-2 text-sm font-bold text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 transition-all flex items-center gap-2 uppercase tracking-tight"
                                >
                                    {isCreating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <PlusIcon className="w-4 h-4 stroke-[3px]" />}
                                    Nouveau statut
                                </button>
                                {showDropdown && (
                                    <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                                        <button onClick={handleCreateNewLocally} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold text-emerald-600 dark:text-emerald-400 border-b border-gray-50 dark:border-gray-700/50">
                                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg"><PlusIcon className="w-4 h-4" /></div>
                                            <div className="flex flex-col"><span>Nouveau Statut</span><span className="text-[10px] text-gray-400 font-normal uppercase">Examen vierge</span></div>
                                        </button>
                                        <button onClick={handleCreateOldLocally} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold text-amber-600 dark:text-amber-400">
                                            <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg"><ClockIcon className="w-4 h-4" /></div>
                                            <div className="flex flex-col"><span>Ancien Statut</span><span className="text-[10px] text-gray-400 font-normal uppercase">Copier dernier</span></div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-sm font-bold text-gray-800 dark:text-white">Aucun statut parodontal enregistré</p>
                        </div>
                    ) : (
                        <div className="flex gap-6 w-full min-h-[300px]">
                            {showListPane && (
                                <div className="w-full flex flex-col bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl p-6 border border-gray-100">
                                    <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <ListBulletIcon className="w-5 h-5 text-cyan-600" /> Historique
                                    </h3>

                                    {/* Search Bar */}
                                    <div className="relative mb-4">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Rechercher par date (ex: 09/04)..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                                        />
                                    </div>

                                    <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
                                        {filteredExams.length > 0 ? filteredExams.map((exam) => (
                                            <div key={exam.id} onClick={() => openExam(exam.id)} className="p-4 rounded-xl border bg-white dark:bg-gray-800 border-gray-100 hover:border-cyan-200 cursor-pointer flex items-center justify-between group transition-all">
                                                <div className="flex items-center gap-3">
                                                    <ClockIcon className="w-5 h-5 text-cyan-600 group-hover:scale-110 transition-transform" />
                                                    <span className="text-sm font-bold">{new Date(exam.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedExamId(exam.id); setPdfRenderAction('download'); setIsGeneratingPDF(true); }} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all" title="Télécharger">
                                                        <ArrowDownTrayIcon className="w-5 h-5" />
                                                    </button>
                                                    <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-6 text-gray-400 text-xs italic">Aucun examen trouvé pour cette date</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {showViewPane && (
                                <div className="w-full flex flex-col gap-6">
                                    {(() => {
                                        // Prioritize the absolute latest exam (first in the list) for the dashboard
                                        const latestExam = exams.length > 0 ? exams[0] : null;
                                        const effectiveExamId = selectedExamId || (latestExam ? latestExam.id : null);
                                        
                                        if (!effectiveExamId) {
                                            return (
                                                <div className="flex flex-col items-center justify-center py-12 text-gray-400 italic text-sm border-2 border-dashed border-gray-100 rounded-3xl">
                                                    Aucun examen parodontal enregistré
                                                </div>
                                            );
                                        }

                                        const kpis = getExamKpis(effectiveExamId);
                                        if (!kpis) return null;
                                        
                                        // Dynamic calculation from site data (Source of Truth)
                                        const validSites = loadedSites.filter(s => s.probing_depth !== null);
                                        const totalSitesCount = validSites.length;
                                        
                                        const totalPd = validSites.reduce((acc, s) => acc + (Number(s.probing_depth) || 0), 0);
                                        const totalMg = validSites.reduce((acc, s) => acc + (Number(s.gingival_margin) || 0), 0);
                                        
                                        const dynamicAvgPd = totalSitesCount > 0 ? Number((totalPd / totalSitesCount).toFixed(2)) : kpis.pd;
                                        const dynamicAvgCal = totalSitesCount > 0 ? Number(((totalPd - totalMg) / totalSitesCount).toFixed(2)) : kpis.cal;

                                        // Count deep pockets (>= 5mm) from loaded sites
                                        const deepPocketsCount = loadedSites.filter(site => site.probing_depth && parseFloat(site.probing_depth) >= 5).length;

                                        // Count teeth with mobility > 0
                                        const uniqueMobileTeeth = new Set(loadedSites.filter(site => site.mobility && parseFloat(site.mobility.toString()) > 0).map(s => s.tooth_number));
                                        const mobilityCount = uniqueMobileTeeth.size;

                                        const statsForDashboard = {
                                            plaquePct: kpis.pi,
                                            deepPockets: deepPocketsCount,
                                            bleedPct: kpis.bop,
                                            avgCal: dynamicAvgCal,
                                            avgPd: dynamicAvgPd,
                                            mobility: mobilityCount
                                        };

                                        return (
                                            <>
                                                <PerioKpiDashboard 
                                                    patientId={patientId}
                                                    currentExamId={effectiveExamId}
                                                    currentStats={statsForDashboard}
                                                />
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {showModal && (
                    <ParodontalStatusModal
                        isOpen={showModal}
                        onClose={() => {
                            setShowModal(false);
                            fetch(`/api/perio/charts?patient_id=${patientId}`).then(res => res.json()).then(data => {
                                setExams(Array.isArray(data) ? data : []);
                            });
                        }}
                        patientId={patientId}
                        initialExamId={selectedExamId}
                        initialView={initialView}
                        onDownload={(id) => { setSelectedExamId(id); setPdfRenderAction('download'); setIsGeneratingPDF(true); }}
                    />
                )}

                {isGeneratingPDF && (
                    <div className="fixed bottom-8 right-8 bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-2xl p-5 flex items-center gap-5 z-[999999] animate-pulse">
                        <div className="relative">
                            <div className="w-8 h-8 border-2 border-gray-600 border-t-cyan-400 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ArrowDownTrayIcon className="w-3 h-3 text-cyan-400" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Génération du Rapport...</h3>
                            <span className="text-[10px] text-gray-400 mt-1">Vous pouvez continuer à naviguer</span>
                        </div>
                    </div>
                )}

                {isGeneratingPDF && selectedExamId && (function() {
                    const kpis = getExamKpis(selectedExamId);
                    if (!kpis) return null;

                    // Calculate dynamic values for the PDF as well
                    const validSites = loadedSites.filter(s => s.probing_depth !== null);
                    const totalSitesCount = validSites.length;
                    const totalPd = validSites.reduce((acc, s) => acc + (Number(s.probing_depth) || 0), 0);
                    const totalMg = validSites.reduce((acc, s) => acc + (Number(s.gingival_margin) || 0), 0);
                    
                    const dynamicAvgPd = totalSitesCount > 0 ? Number((totalPd / totalSitesCount).toFixed(2)) : kpis.pd;
                    const dynamicAvgCal = totalSitesCount > 0 ? Number(((totalPd - totalMg) / totalSitesCount).toFixed(2)) : kpis.cal;
                    const deepPocketsCount = loadedSites.filter(site => site.probing_depth && parseFloat(site.probing_depth) >= 5).length;
                    const mobilityCount = new Set(loadedSites.filter(site => site.mobility && parseFloat(site.mobility.toString()) > 0).map(s => s.tooth_number)).size;

                    return (
                        <div id="perio-pdf-report-root" className="fixed left-[-9999px] top-0 opacity-0 pointer-events-none bg-white">
                            <div id="perio-pdf-summary-part" className="p-16 bg-white" style={{ width: '1400px', minHeight: '1800px', margin: '0 auto' }}>
                                {/* Professional Header / Infos Table */}
                                <div className="flex items-center gap-6 mb-12 border-b-4 border-cyan-800 pb-8">
                                    <img src="/logo.png" alt="MyPrescription Logo" className="h-20 w-auto object-contain" />
                                    <div className="flex flex-col">
                                        <h1 className="text-5xl font-black text-cyan-900 uppercase tracking-tighter">Diagnostic Parodontal</h1>
                                        <h2 className="text-xl font-bold text-gray-500 uppercase tracking-widest mt-1">Dossier Médical MyPrescription</h2>
                                    </div>
                                </div>

                                <div className="w-full border border-gray-300 rounded-2xl overflow-hidden mb-12 shadow-sm">
                                    <div className="bg-gray-100 px-6 py-3 border-b border-gray-300 flex justify-between items-center">
                                        <span className="font-black text-gray-800 uppercase tracking-widest text-sm">Fiche Analytique du Patient</span>
                                        <span className="font-bold text-cyan-700 text-sm">{new Date(kpis.exam?.created_at || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex w-full bg-white">
                                        <div className="w-1/2 p-8 border-r border-gray-200">
                                            <h3 className="text-[11px] font-black text-cyan-600 uppercase tracking-[0.2em] mb-4">Identité du Patient</h3>
                                            <div className="flex flex-col gap-3 text-sm">
                                                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Nom complet</span><span className="font-black text-gray-900">{fullPatient ? `${fullPatient.name || ''} ${fullPatient.family_name || ''}` : patientName}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Numéro de dossier</span><span className="font-bold text-gray-800">{fullPatient?.dossier_number || patientId}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Âge / Naissance</span><span className="font-bold text-gray-800">{fullPatient?.dateNaissance ? new Date(fullPatient.dateNaissance).toLocaleDateString() : 'Non renseigné'}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Email</span><span className="font-bold text-gray-800">{fullPatient?.email || 'Non renseigné'}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Téléphone</span><span className="font-bold text-gray-800">{fullPatient?.phone || 'Non renseigné'}</span></div>
                                            </div>
                                        </div>
                                        <div className="w-1/2 p-8 bg-gray-50/30">
                                            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Informations du Praticien</h3>
                                            <div className="flex flex-col gap-3 text-sm">
                                                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Docteur traitant</span><span className="font-black text-gray-900">Dr. {localStorage.getItem('userName') || 'Spécialiste'}</span></div>
                                                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Spécialité</span><span className="font-bold text-gray-800">Parodontologie / Dentisterie</span></div>
                                                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Établissement</span><span className="font-bold text-gray-800">Clinique MyPrescription</span></div>
                                                <div className="flex justify-between"><span className="text-gray-500 font-bold uppercase">Type d'examen</span><span className="font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md">Bilan Parodontal Automatisé</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Integrate the dynamic KPI PDF Table exactly here */}
                                <div className="mb-16 border border-gray-300 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-cyan-900 px-6 py-4 flex justify-between items-center">
                                        <span className="font-black text-white uppercase tracking-widest text-sm">Tableau Analytique Parodontal (KPI)</span>
                                    </div>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-cyan-50/50 border-b border-gray-200">
                                                <th className="py-4 px-6 text-[11px] font-black text-cyan-800 uppercase tracking-widest">Indicateur Clinique</th>
                                                <th className="py-4 px-6 text-[11px] font-black text-cyan-800 uppercase tracking-widest">Valeur Mesurée</th>
                                                <th className="py-4 px-6 text-[11px] font-black text-cyan-800 uppercase tracking-widest">Interprétation Médicale</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            <tr className="border-b border-gray-200">
                                                <td className="py-5 px-6 font-black text-gray-800 text-sm">Indice de Plaque (Plaque Index)</td>
                                                <td className="py-5 px-6"><span className="text-3xl font-black tabular-nums tracking-tighter text-rose-500">{kpis.pi}%</span></td>
                                                <td className="py-5 px-6 text-xs text-gray-500 font-medium font-sans max-w-md leading-relaxed">Évalue le pourcentage de surfaces dentaires couvertes de plaque bactérienne. Une hygiène optimale vise un score inférieur à 20%.</td>
                                            </tr>
                                            <tr className="border-b border-gray-200 bg-gray-50/30">
                                                <td className="py-5 px-6 font-black text-gray-800 text-sm">Saignement au Sondage (BOP)</td>
                                                <td className="py-5 px-6"><span className="text-3xl font-black tabular-nums tracking-tighter text-amber-500">{kpis.bop}%</span></td>
                                                <td className="py-5 px-6 text-xs text-gray-500 font-medium font-sans max-w-md leading-relaxed">Indicateur d'inflammation active de la gencive. Un saignement supérieur à 10% confirme la présence d'une gingivite ou parodontite en phase active.</td>
                                            </tr>
                                            <tr className="border-b border-gray-200">
                                                <td className="py-5 px-6 font-black text-gray-800 text-sm">Poches Profondes (≥ 5 mm)</td>
                                                <td className="py-5 px-6"><div className="flex items-baseline gap-1"><span className="text-3xl font-black tabular-nums tracking-tighter text-gray-900">{deepPocketsCount}</span> <span className="text-sm font-bold text-gray-500">sites</span></div></td>
                                                <td className="py-5 px-6 text-xs text-gray-500 font-medium font-sans max-w-md leading-relaxed">Décompte critique : les poches mesurant 5mm ou plus hébergent des bactéries anaérobies inaccessibles au brossage, nécessitant une intervention professionnelle ciblée.</td>
                                            </tr>
                                            <tr className="bg-gray-50/30">
                                                <td className="py-5 px-6 font-black text-gray-800 text-sm">Perte d'Attache Moyenne (CAL)</td>
                                                <td className="py-5 px-6"><div className="flex items-baseline gap-1"><span className="text-3xl font-black tabular-nums tracking-tighter text-gray-900">{dynamicAvgCal}</span> <span className="text-sm font-bold text-gray-500">mm</span></div></td>
                                                <td className="py-5 px-6 text-xs text-gray-500 font-medium font-sans max-w-md leading-relaxed">Estime le niveau global de destruction et de migration de l'attache gingivale par rapport à la jonction énamo-cémentaire, quantifiant la sévérité de la maladie parodontale.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="w-full mt-4">
                                    <h3 className="text-sm font-black text-cyan-800 uppercase tracking-widest mb-4 ml-2">Évolution et Tendances Cliniques</h3>
                                    <div className="w-full transform origin-top left-0 relative" style={{ transform: 'scale(0.92)', transformOrigin: 'top center', marginBottom: '20px' }}>
                                        <PerioKpiDashboard 
                                            patientId={patientId}
                                            currentExamId={selectedExamId}
                                            currentStats={{
                                                plaquePct: kpis.pi,
                                                deepPockets: deepPocketsCount,
                                                bleedPct: kpis.bop,
                                                avgCal: dynamicAvgCal,
                                                avgPd: dynamicAvgPd,
                                                mobility: mobilityCount
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>


                            <div id="perio-pdf-charts-part" className="p-16 bg-white" style={{ width: '1400px' }}>
                                <h3 className="text-2xl font-black text-gray-400 uppercase mb-8 pb-3 border-b border-gray-100">Statut Parodontal Complet</h3>
                                <div className="w-full bg-white flex justify-center mt-8">
                                    <PeriodontalChartEditor
                                        key={`pdf-chart-${selectedExamId}`}
                                        patientId={patientId} patientName={patientName} initialExamId={selectedExamId}
                                        forceViewAll={true} hideControls={true} hideKpis={true}
                                        onChartLoaded={pdfRenderAction === 'download' ? executePdfOrPrintAction : undefined}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </>
        );
    }
);

ParodontalStatusSection.displayName = 'ParodontalStatusSection';

export default ParodontalStatusSection;
