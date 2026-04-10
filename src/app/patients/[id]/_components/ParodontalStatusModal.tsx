'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, EyeIcon, ListBulletIcon, ArrowLeftIcon, ClockIcon, ChevronRightIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const PeriodontalChartEditor = dynamic(() => import('@/components/perio/PeriodontalChartEditor'), {
    ssr: false,
    loading: () => <div className="h-full flex items-center justify-center">Chargement de l'éditeur...</div>
});

interface ParodontalStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName?: string;
    initialExamId?: number | null;
    initialView?: ModalView;
    onPrint?: (examId: number) => void;
    onDownload?: (examId: number) => void;
}

type ModalView = 'menu' | 'create-choices' | 'list' | 'chart' | 'summary';

export default function ParodontalStatusModal({
    isOpen,
    onClose,
    patientId,
    patientName = 'Patient',
    initialExamId = null,
    initialView = 'menu',
    onPrint,
    onDownload
}: ParodontalStatusModalProps) {
    const router = useRouter();
    const [view, setView] = useState<ModalView>(initialView);
    const [selectedExamId, setSelectedExamId] = useState<number | null>(initialExamId);
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setView(initialView);
            setSelectedExamId(initialExamId);
        }
    }, [isOpen, initialView, initialExamId]);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch(`/api/perio/charts?patient_id=${patientId}`)
                .then(res => res.json())
                .then(data => {
                    setExams(Array.isArray(data) ? data : []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [isOpen, patientId]);

    if (!isOpen) return null;

    const handleCreateNew = async () => {
        setIsReadOnly(false);
        setLoading(true);
        try {
            const res = await fetch('/api/perio/charts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId })
            });
            if (res.ok) {
                const newChart = await res.json();
                setSelectedExamId(newChart.id);
                setView('chart');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOld = async () => {
        setIsReadOnly(false);
        setLoading(true);
        try {
            console.log('%c[PERIO_CLONE] %cRefreshing history to find latest exam...', 'color: #f59e0b; font-weight: bold', 'color: inherit');
            const listRes = await fetch(`/api/perio/charts?patient_id=${patientId}`, { cache: 'no-store' });
            const latestExams = await listRes.json();
            
            if (latestExams && latestExams.length > 0) {
                const latest = latestExams[0];
                console.log(`%c[PERIO_CLONE] %cSource Found: ID=${latest.id} (from ${new Date(latest.created_at).toLocaleString()})`, 'color: #f59e0b', 'color: inherit');
                
                const res = await fetch('/api/perio/charts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patientId, fromId: latest.id })
                });
                if (res.ok) {
                    const newChart = await res.json();
                    console.log(`%c[PERIO_CLONE] %cSuccess! New Exam Created: ID=${newChart.id}`, 'color: #22c55e', 'color: inherit');
                    setSelectedExamId(newChart.id);
                    setView('chart');
                }
            } else {
                console.warn('[PERIO_CLONE] No previous exam found, falling back to handleCreateNew');
                handleCreateNew();
            }
        } catch (err) {
            console.error('[PERIO_CLONE_ERROR]', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewExam = (id: number) => {
        setSelectedExamId(id);
        setIsReadOnly(true);
        setView('chart');
    };

    const handleViewLast = () => {
        if (exams.length > 0) {
            handleViewExam(exams[0].id);
        } else {
            setView('create-choices');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-[1400px] h-[95vh] overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-500 transition-all">
                {/* Header with 3 Buttons on the Right */}
                <div className="flex items-center justify-between px-10 pt-4 pb-0 bg-gray-50/30 dark:bg-gray-800/50">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl shadow-sm">
                            <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 2C8.5 2 6 4 6 7c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5 0 3 1 5 4 5s4-2 4-5c0-2 .5-3.5 1-5s1-3 1-5c0-3-2.5-5-6-5z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">
                                {/* Title Removed */}
                            </h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                                {/* Subtitle Removed */}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden relative bg-white dark:bg-gray-800 flex flex-col items-center justify-center">
                    {view === 'chart' && (
                        <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
                            <PeriodontalChartEditor
                                key={`modal-chart-${selectedExamId || 'new'}`}
                                patientId={patientId}
                                patientName={patientName}
                                initialExamId={selectedExamId}
                                readOnly={isReadOnly}
                                onSaved={() => { 
                                    fetch(`/api/perio/charts?patient_id=${patientId}`)
                                        .then(res => res.json())
                                        .then(data => setExams(Array.isArray(data) ? data : []));
                                }} // Reload list when saved
                            />
                        </div>
                    )}

                    {view === 'summary' && (
                        <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                             {/* Empty view for Consultation as requested */}
                             <div className="text-center opacity-10 mb-12">
                                 <h3 className="text-xl font-black text-gray-300 uppercase tracking-[0.4em]">Section de Consultation</h3>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 px-10">L&apos;éditeur n&apos;est disponible qu&apos;en mode création.</p>
                             </div>
                             
                             {/* Minimalist summary data if available */}
                            <div className="flex gap-20 p-20 bg-gray-50/50 dark:bg-gray-900/10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm items-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Saignement (BOP)</span>
                                    <span className="text-6xl font-black text-rose-500">
                                        {(exams.find(e => e.id === selectedExamId)?.bop_pct) || 0}%
                                    </span>
                                </div>
                                <div className="w-[1px] h-20 bg-gray-200 dark:bg-gray-700"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Plaque (PI)</span>
                                    <span className="text-6xl font-black text-cyan-600">
                                        {(exams.find(e => e.id === selectedExamId)?.pi_pct) || 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'menu' && (
                        <div className="text-center max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center">
                            <div className="w-32 h-32 bg-gray-50/50 dark:bg-gray-900/30 rounded-full flex items-center justify-center mb-10 border border-gray-100 dark:border-gray-700/50 shadow-inner group relative">
                                <div className="absolute inset-0 bg-cyan-400/5 rounded-full animate-pulse"></div>
                                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                    <path d="M12 2C8.5 2 6 4 6 7c0 2 .5 3.5 1 5 .5 1.5 1 3 1 5 0 3 1 5 4 5s4-2 4-5c0-2 .5-3.5 1-5s1-3 1-5c0-3-2.5-5-6-5z" />
                                </svg>
                            </div>
                            <h3 className="text-3xl font-black text-gray-800 dark:text-white mb-4 uppercase tracking-tighter">
                                Ajouter ton statut pour plus de visuels
                            </h3>
                            <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                Enregistrez le statut parodontal pour obtenir des graphiques détaillés,
                                suivre l'évolution de la santé gingivale et détecter les signes précoces de maladie parodontale.
                            </p>

                            <button
                                onClick={() => setView('create-choices')}
                                className="mt-12 px-10 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-[1.25rem] font-black transition-all shadow-xl shadow-cyan-500/20 uppercase tracking-widest text-xs flex items-center gap-3 group"
                            >
                                <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                                Commencer un examen
                            </button>
                        </div>
                    )}

                    {view === 'create-choices' && (
                        <div className="flex flex-col items-center w-full max-w-3xl animate-in fade-in zoom-in-95 duration-500">
                            <div className="text-center mb-12">
                                <h3 className="text-3xl font-black text-gray-800 dark:text-white mb-3 uppercase tracking-tighter">
                                    Initialiser l'Examen
                                </h3>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Choisissez une méthode de création</p>
                            </div>

                            <div className="grid grid-cols-2 gap-10 w-full mb-12">
                                <button
                                    onClick={handleCreateNew}
                                    className="group flex flex-col items-center gap-8 p-10 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 border-2 border-emerald-100/50 dark:border-emerald-800/30 rounded-[2.5rem] transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-2"
                                >
                                    <div className="p-7 bg-white dark:bg-emerald-800 rounded-3xl shadow-xl group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6">
                                        <PlusIcon className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block font-black text-emerald-900 dark:text-emerald-100 text-2xl uppercase tracking-tighter mb-1">Nouveau Statut</span>
                                        <span className="text-xs text-emerald-600/60 dark:text-emerald-400/60 font-black uppercase tracking-[0.2em] px-3 py-1 bg-white/50 dark:bg-emerald-900/50 rounded-full">Examen vierge</span>
                                    </div>
                                </button>

                                <button
                                    onClick={handleCreateOld}
                                    className="group flex flex-col items-center gap-8 p-10 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/20 dark:hover:to-orange-900/20 border-2 border-amber-100/50 dark:border-amber-800/30 rounded-[2.5rem] transition-all duration-500 shadow-sm hover:shadow-2xl hover:-translate-y-2"
                                >
                                    <div className="p-7 bg-white dark:bg-amber-800 rounded-3xl shadow-xl group-hover:scale-110 transition-transform duration-500 group-hover:-rotate-6">
                                        <ClockIcon className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="text-center">
                                        <span className="block font-black text-amber-900 dark:text-amber-100 text-2xl uppercase tracking-tighter mb-1">Ancien Statut</span>
                                        <span className="text-xs text-amber-600/60 dark:text-amber-400/60 font-black uppercase tracking-[0.2em] px-3 py-1 bg-white/50 dark:bg-amber-900/50 rounded-full">Copier dernier</span>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={() => setView('menu')}
                                className="px-6 py-2 text-xs font-black text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-3 transition-all uppercase tracking-widest"
                            >
                                <ArrowLeftIcon className="w-4 h-4" /> Retour aux options
                            </button>
                        </div>
                    )}

                    {view === 'list' && (
                        <div className="w-full flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Historique complet</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Tous les examens enregistrés pour ce patient</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-20">
                                    <div className="w-12 h-12 border-4 border-cyan-100 border-t-cyan-600 rounded-full animate-spin mb-4"></div>
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Chargement des archives...</span>
                                </div>
                            ) : exams.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700/50">
                                    <ListBulletIcon className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">Aucun examen archivé</p>
                                </div>
                            ) : (
                                <div className="overflow-y-auto flex-1 custom-scrollbar pr-2">
                                    <table className="w-full text-left border-separate border-spacing-y-3">
                                        <thead>
                                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4">
                                                <th className="pb-2 pl-4">Date de l'examen</th>
                                                <th className="pb-2">Praticien</th>
                                                <th className="pb-2">Status</th>
                                                <th className="pb-2 pr-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {exams.map((exam) => (
                                                <tr key={exam.id} className="group bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-700 rounded-2xl transition-all shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-cyan-100/50 dark:hover:border-cyan-900/30">
                                                    <td className="py-4 pl-6 rounded-l-2xl border-y border-l border-gray-100/50 dark:border-gray-700/30 group-hover:border-cyan-100/50 dark:group-hover:border-cyan-900/30" onClick={() => handleViewExam(exam.id)}>
                                                        <div className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tight">
                                                            {new Date(exam.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">#{exam.id}</div>
                                                    </td>
                                                    <td className="py-4 border-y border-gray-100/50 dark:border-gray-700/30 group-hover:border-cyan-100/50 dark:group-hover:border-cyan-900/30">
                                                        <div className="text-xs font-bold text-gray-600 dark:text-gray-300">Dr. {exam.doctor_family_name || 'Expert Studio'}</div>
                                                    </td>
                                                    <td className="py-4 border-y border-gray-100/50 dark:border-gray-700/30 group-hover:border-cyan-100/50 dark:group-hover:border-cyan-900/30">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${exam.status === 'finalized' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                            {exam.status === 'finalized' ? 'Finalisé' : 'Brouillon'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 pr-6 text-right rounded-r-2xl border-y border-r border-gray-100/50 dark:border-gray-700/30 group-hover:border-cyan-100/50 dark:group-hover:border-cyan-900/30">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onPrint?.(exam.id); }}
                                                                className="p-2 bg-white dark:bg-gray-600 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-xl shadow-sm border border-gray-100 dark:border-gray-500 transition-all"
                                                                title="Imprimer"
                                                            >
                                                                <PrinterIcon className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleViewExam(exam.id)}
                                                                className="p-2 bg-white dark:bg-gray-600 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-xl shadow-sm border border-gray-100 dark:border-gray-500 transition-all"
                                                                title="Voir Détails"
                                                            >
                                                                <ChevronRightIcon className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer bar */}
                <div className="px-10 py-5 border-t border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.25em]">
                    <div className="flex items-center gap-6">
                        {/* Info Removed */}
                    </div>
                    <span className="flex items-center gap-2 truncate max-w-[300px]">
                        {/* Branding Removed */}
                    </span>
                </div>
            </div>
        </div>
    );
}
