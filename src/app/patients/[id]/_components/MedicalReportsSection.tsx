'use client';

// MedicalReportsSection Component - Self-contained section for medical reports
// Synced with page.original.tsx styling (indigo colors)

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
    DocumentTextIcon,
    ArrowTopRightOnSquareIcon,
    HeartIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

interface MedicalReport {
    id: number;
    patient_id: string;
    doctor_user_id: number;
    title?: string;
    report_type: string;
    examination_date: string;
    content?: string;
    created_at: string;
    doctor?: {
        id: number;
        name: string;
        family_name: string;
    };
}

interface CardiologyReport {
    id: number;
    patient_id: string;
    doctor_user_id: number;
    score_nyha?: number;
    doctor_name?: string;
    created_at: string;
}

interface MedicalReportsSectionProps {
    patientId: string;
    currentUserId?: number;
    isSharedPatient?: boolean;
    isCardiologist?: boolean;
    onAddReport: () => void;
    onAddCardiologyReport?: () => void;
    onReuseCardiologyReport?: (report: CardiologyReport) => void;
    onViewReport?: (report: MedicalReport) => void;
}

// Query keys - exported for cache invalidation
export const medicalReportKeys = {
    byPatient: (patientId: string) => ['medicalReports', 'patient', patientId] as const,
};

export const cardiologyReportKeys = {
    byPatient: (patientId: string) => ['cardiologyReports', 'patient', patientId] as const,
};

// API function for cardiology reports
async function fetchCardiologyReportsApi(patientId: string): Promise<CardiologyReport[]> {
    const response = await axios.get(`${API_URL}/api/patients/${patientId}/cardiology-reports`, { withCredentials: true });
    if (response.data.success) {
        return response.data.data || [];
    }
    return [];
}

// API function
async function fetchMedicalReportsApi(patientId: string): Promise<MedicalReport[]> {
    const response = await axios.get(`${API_URL}/medical-reports/patient/${patientId}`, { withCredentials: true });
    if (response.data.success) {
        return response.data.data.reports || [];
    }
    return [];
}

/**
 * Loading skeleton
 */
function ReportsSkeleton() {
    return (
        <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
    );
}

/**
 * Empty state - from original
 */
function EmptyState() {
    const { t } = useLanguage();
    return (
        <div className="text-center py-6">
            <DocumentTextIcon className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('patients.detail.noMedicalReports')}
            </p>
        </div>
    );
}

/**
 * MedicalReportsSection - Main component
 * Matches the exact layout from page.original.tsx
 */
export function MedicalReportsSection({
    patientId,
    currentUserId,
    isSharedPatient,
    isCardiologist,
    onAddReport,
    onAddCardiologyReport,
    onReuseCardiologyReport,
    onViewReport,
}: MedicalReportsSectionProps) {
    const { t } = useLanguage();
    const [filter, setFilter] = useState<'all' | 'mine'>('all');
    const [showCardioDropdown, setShowCardioDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showCardioDropdown) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowCardioDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCardioDropdown]);

    // Fetch medical reports with React Query
    const { data: reports = [], isLoading } = useQuery({
        queryKey: medicalReportKeys.byPatient(patientId),
        queryFn: () => fetchMedicalReportsApi(patientId),
        staleTime: 5 * 60 * 1000,
        enabled: !!patientId,
    });

    // Fetch cardiology reports (only for cardiologists)
    const { data: cardiologyReports = [] } = useQuery({
        queryKey: cardiologyReportKeys.byPatient(patientId),
        queryFn: () => fetchCardiologyReportsApi(patientId),
        staleTime: 5 * 60 * 1000,
        enabled: !!patientId && !!isCardiologist,
    });

    // Apply filter
    const filteredReports = useMemo(() => {
        if (!currentUserId) return reports;
        if (filter === 'mine') {
            return reports.filter(r => r.doctor_user_id === currentUserId);
        }
        return reports;
    }, [reports, filter, currentUserId]);

    return (
        <div className="hidden md:block bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm transition-colors flex-1">
            {/* Header - from original (indigo colors) */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    {t('patients.detail.medicalReport')}
                </h2>
                <div className="flex items-center gap-2">
                    {isCardiologist && onAddCardiologyReport && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowCardioDropdown(!showCardioDropdown)}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
                            >
                                <HeartIcon className="w-4 h-4" />
                                CR Cardio
                                <ChevronDownIcon className="w-3.5 h-3.5" />
                            </button>
                            {showCardioDropdown && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
                                    <button
                                        onClick={() => { setShowCardioDropdown(false); onAddCardiologyReport(); }}
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        Nouveau
                                    </button>
                                    {cardiologyReports.length > 0 && onReuseCardiologyReport && (
                                        <button
                                            onClick={() => { setShowCardioDropdown(false); onReuseCardiologyReport(cardiologyReports[0]); }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Réutiliser dernier
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    <button
                        onClick={onAddReport}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        {t('patients.detail.new')}
                    </button>
                </div>
            </div>

            {/* Filter buttons - from original (indigo active state) */}
            <div className="mb-3 flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                    Tous ({reports.length})
                </button>
                <button
                    onClick={() => setFilter('mine')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg ${filter === 'mine' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                    Les miens ({reports.filter(r => r.doctor_user_id === (currentUserId || 0)).length})
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <ReportsSkeleton />
            ) : filteredReports.length === 0 && cardiologyReports.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-2 overflow-y-auto max-h-[200px]">
                    {/* Cardiology reports — click opens PDF */}
                    {cardiologyReports.map(cr => (
                        <div
                            key={`cardio-${cr.id}`}
                            onClick={() => window.open(`${API_URL}/api/cardiology-reports/${cr.id}/pdf`, '_blank')}
                            className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <HeartIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                            CR Cardiologique {cr.score_nyha ? `• NYHA ${cr.score_nyha}` : ''}
                                        </h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(cr.created_at).toLocaleDateString('fr-FR')}{cr.doctor_name ? ` • Dr ${cr.doctor_name}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                            </div>
                        </div>
                    ))}
                    {/* Standard medical reports */}
                    {filteredReports.map(report => (
                        <div
                            key={report.id}
                            onClick={() => window.open(`${API_URL}/medical-reports/${report.id}/pdf`, '_blank')}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                        {report.title || report.report_type}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(report.examination_date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MedicalReportsSection;
