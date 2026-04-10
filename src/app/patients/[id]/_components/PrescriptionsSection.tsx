'use client';

// PrescriptionsSection Component - Self-contained section for prescriptions
// Synced with page.original.tsx styling (green icon, green "Nouvelle" button)

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';

interface Prescription {
    id: number;
    doctor_user_id: number;
    patient_id: string;
    created_at: string;
    medications?: any[];
    doctor?: {
        id: number;
        name: string;
        family_name: string;
    };
}

interface PrescriptionsSectionProps {
    prescriptions: Prescription[];
    patientId: string;
    currentUserId?: number;
    isLoading?: boolean;
    isSharedPatient?: boolean;
    onPreview: (prescription: Prescription) => void;
    onViewAll?: () => void;
}

/**
 * Format date for display
 */
function formatDate(date: string): string {
    try {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return 'Date non disponible';
    }
}

/**
 * Render medications preview - from original
 */
function renderMedicationsPreview(meds: any[] | undefined) {
    if (!meds || !Array.isArray(meds) || meds.length === 0) {
        return <span className="text-sm text-gray-500">Aucun médicament listé</span>;
    }

    const preview = meds.slice(0, 2).map((m, i) => {
        const name = m.medication?.nom_de_marque || m.medication?.denomination_commune_internationale || 'Médicament';
        const qty = m.quantity ? `x${m.quantity}` : '';
        return (
            <span key={i} className="text-sm text-gray-600 dark:text-gray-400">
                {name}{qty ? ` (${qty})` : ''}
                {i < Math.min(meds.length, 2) - 1 && ', '}
            </span>
        );
    });

    return (
        <div>
            {preview}
            {meds.length > 2 && (
                <span className="text-xs text-gray-500 dark:text-gray-400"> +{meds.length - 2}</span>
            )}
        </div>
    );
}

/**
 * Loading skeleton
 */
function PrescriptionsSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-48" />
                </div>
            ))}
        </div>
    );
}

/**
 * Empty state - from original
 */
function EmptyState() {
    const { t } = useLanguage();
    return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 flex-1 flex flex-col items-center justify-center">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium">{t('patients.detail.noPrescriptions')}</p>
            <p className="text-xs mt-1">Cliquez sur "Nouvelle" pour créer</p>
        </div>
    );
}

/**
 * PrescriptionsSection - Main component
 * Matches the exact layout from page.original.tsx
 */
export function PrescriptionsSection({
    prescriptions,
    patientId,
    currentUserId,
    isLoading,
    isSharedPatient,
    onPreview,
    onViewAll,
}: PrescriptionsSectionProps) {
    const { t } = useLanguage();
    const [filter, setFilter] = useState<'all' | 'mine'>('all');

    // Check if there are prescriptions from multiple doctors
    const uniqueDoctorIds = Array.from(new Set(prescriptions.map(p => p.doctor_user_id)));
    const hasMultipleDoctors = uniqueDoctorIds.length > 1;

    // Apply filter
    const filteredPrescriptions = useMemo(() => {
        if (!currentUserId) return prescriptions;
        if (filter === 'mine') {
            return prescriptions.filter(p => p.doctor_user_id === currentUserId);
        }
        return prescriptions;
    }, [prescriptions, filter, currentUserId]);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm transition-colors flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
                </div>
                <PrescriptionsSkeleton />
            </div>
        );
    }

    return (
        <div className="hidden md:block bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm transition-colors flex flex-col">
            {/* Header - from original (green icon, green button) */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-green-600 dark:text-green-500" />
                    {t('patients.detail.prescriptions')}
                </h2>
                <div className="flex gap-2">
                    <Link
                        href={`/ordonnance/prescription/${patientId}`}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        {t('patients.detail.new')}
                    </Link>
                    {filteredPrescriptions.length > 0 && onViewAll && (
                        <button
                            onClick={onViewAll}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                            {t('patients.detail.viewAll')}
                        </button>
                    )}
                </div>
            </div>

            {/* Filter buttons - from original (blue active state) */}
            <div className="mb-3 flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                    Tous ({prescriptions.length})
                </button>
                <button
                    onClick={() => setFilter('mine')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filter === 'mine' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                >
                    Les miennes ({prescriptions.filter(p => p.doctor_user_id === (currentUserId || 0)).length})
                </button>
            </div>

            {/* Prescriptions list - from original */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                {filteredPrescriptions.length > 0 ? (
                    filteredPrescriptions.map((prescription, index) => (
                        <div
                            key={prescription.id || index}
                            onClick={() => onPreview(prescription)}
                            className="flex items-start gap-3 p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        >
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                <DocumentTextIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                                        {formatDate(prescription.created_at)}
                                    </span>
                                    {/* Doctor badge - from original */}
                                    {(isSharedPatient || hasMultipleDoctors) && prescription.doctor && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${prescription.doctor_user_id === (currentUserId || 0)
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                            }`}>
                                            Dr. {prescription.doctor.name}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {renderMedicationsPreview(prescription.medications)}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
}

export default PrescriptionsSection;
