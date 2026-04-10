'use client';

// PatientProfile Component - Patient information display card
// Includes privacy badges, visit count, action buttons, and primary care info
// Synced with page.original.tsx styling

import React from 'react';
import Link from 'next/link';
import {
    UserIcon,
    PhoneIcon,
    MapPinIcon,
    PencilSquareIcon,
    LockClosedIcon,
    ShareIcon,
    ClockIcon,
    HeartIcon,
    UserCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Patient } from '@/features/patients';

interface PrimaryCareInfo {
    primaryCareDoctor: {
        id: number;
        name: string;
        family_name: string;
    } | null;
    isCurrentDoctor: boolean;
    isPatientOwner?: boolean;
    shared?: boolean;
    shareId?: number;
}

interface PatientProfileProps {
    patient: Patient;
    visitCount: number;
    isPrivate: boolean;
    isSharedWithMe: boolean;
    isPrimaryCareDoctor: boolean;
    myPrivacyChoice: 'private' | 'shared' | null;
    isLoadingHistory: boolean;
    userRole?: string;
    primaryCareInfo?: PrimaryCareInfo | null;
    loadingPrimaryCare?: boolean;
    activeShareWithPrimaryCare?: any;
    onFetchHistory: () => void;
    onShare: () => void;
    onShareWithPrimaryCare?: () => void;
    onRevokeShare?: () => void;
}

/**
 * Format date for display
 */
function formatDate(date: string | Date | undefined): string {
    if (!date) return 'Non renseigné';
    try {
        return new Date(date).toLocaleDateString('fr-FR');
    } catch {
        return 'Non renseigné';
    }
}

/**
 * PatientProfile - Patient information card
 * Matches the exact layout from page.original.tsx
 */
export function PatientProfile({
    patient,
    visitCount,
    isPrivate,
    isSharedWithMe,
    isPrimaryCareDoctor,
    myPrivacyChoice,
    isLoadingHistory,
    userRole,
    primaryCareInfo,
    loadingPrimaryCare,
    activeShareWithPrimaryCare,
    onFetchHistory,
    onShare,
    onShareWithPrimaryCare,
    onRevokeShare,
}: PatientProfileProps) {
    const { t } = useLanguage();
    const showPrivateBadge = isPrivate && (isPrimaryCareDoctor || myPrivacyChoice === 'private');
    const isDoctor = userRole === 'doctor';

    return (
        <div id="patient-profile-card" className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm transition-colors mb-6">
            {/* Header */}
            <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        {t('patients.detail.patientInfo')}
                    </h2>
                    {/* Privacy badge */}
                    {showPrivateBadge && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-amber-800 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-full">
                            <LockClosedIcon className="w-3.5 h-3.5" />
                            {t('patients.detail.private')}
                        </span>
                    )}
                    {/* Shared badge */}
                    {isSharedWithMe && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-teal-700 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-700 rounded-full">
                            <ShareIcon className="w-3.5 h-3.5" />
                            {t('patients.detail.shared')}
                        </span>
                    )}
                </div>
                {/* Action buttons */}
                <div className="flex flex-1 items-center justify-end gap-2">
                    {isDoctor && (
                        <>
                            <button
                                onClick={onFetchHistory}
                                disabled={isLoadingHistory}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-50"
                            >
                                <ClockIcon className="w-4 h-4" />
                                {isLoadingHistory ? 'Chargement...' : 'Historique'}
                            </button>
                            <button
                                onClick={onShare}
                                className="hidden md:inline-flex items-center  gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                            >
                                <ShareIcon className="w-4 h-4" />
                                Partager
                            </button>
                        </>
                    )}
                    <Link
                        href={`/patients/new?mode=edit&id=${patient.id}`}
                        className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        {t('patients.detail.edit')}
                    </Link>
                </div>
            </div>

            {/* Patient Name and Visits */}
            <div className="pb-4 border-b-2 border-blue-100 dark:border-blue-900/30 flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                        {patient.name} {patient.family_name}
                    </h1>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                            <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium">
                                {patient.age ? `${patient.age} ans` : 'Âge non renseigné'}
                            </span>
                        </span>
                        <span>•</span>
                        <span className="font-medium">{patient.genre || 'Genre non renseigné'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                            <PhoneIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium">{patient.telephone || 'Non renseigné'}</span>
                        </span>
                    </div>
                </div>
                {/* Visit count */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{t('patients.detail.visits')}</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{visitCount}</span>
                </div>
            </div>

            {/* Two Column Layout for Patient Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Personal Info */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            {t('patients.detail.personalInfo')}
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start">
                                <span className="text-gray-500 dark:text-gray-400 w-32">{t('patients.detail.dateOfBirth')}:</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                    {formatDate(patient.dateNaissance)}
                                </span>
                            </div>
                            <div className="flex items-start">
                                <span className="text-gray-500 dark:text-gray-400 w-32">{t('patients.detail.email')}:</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                    {patient.email || 'Non renseigné'}
                                </span>
                            </div>
                            <div className="flex items-start">
                                <span className="text-gray-500 dark:text-gray-400 w-32">{t('patients.detail.nin')}:</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                    {patient.nin || 'Non renseigné'}
                                </span>
                            </div>
                            <div className="flex items-start">
                                <span className="text-gray-500 dark:text-gray-400 w-32">{t('patients.detail.socialSecurity')}:</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                    {patient.numeroSecuriteSociale || 'Non renseigné'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Address section - matches original */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            {t('patients.detail.address')}
                        </h3>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{patient.adresse || 'Non renseigné'}</p>
                    </div>

                    {/* Primary Care Physician - Show to all doctors (from original) */}
                    {isDoctor && primaryCareInfo && primaryCareInfo.primaryCareDoctor && (
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1">
                                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                        <UserCircleIcon className="w-3.5 h-3.5" />
                                        Médecin Traitant
                                    </h3>
                                    {primaryCareInfo.isCurrentDoctor ? (
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Vous êtes le médecin traitant</p>
                                    ) : (
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {primaryCareInfo.primaryCareDoctor
                                                ? `Dr. ${primaryCareInfo.primaryCareDoctor.name} ${primaryCareInfo.primaryCareDoctor.family_name}`
                                                : 'Non renseigné'}
                                        </p>
                                    )}
                                </div>
                                {/* Share button - only show if doctor chose "private" */}
                                {!primaryCareInfo.isCurrentDoctor && primaryCareInfo.primaryCareDoctor && myPrivacyChoice === 'private' && (
                                    activeShareWithPrimaryCare ? (
                                        <button
                                            onClick={onRevokeShare}
                                            disabled={loadingPrimaryCare}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                        >
                                            {loadingPrimaryCare ? '...' : 'Partage en cours ✓'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={onShareWithPrimaryCare}
                                            disabled={loadingPrimaryCare}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                                        >
                                            {loadingPrimaryCare ? '...' : 'Partager le dossier'}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Medical Info - Only for doctors (from original) */}
                {isDoctor && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                <HeartIcon className="w-4 h-4" />
                                {t('patients.detail.medicalInfo')}
                            </h3>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('patients.detail.chronicDiseases')}:</span>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">{(patient as any).chronicDiseases || 'Aucune'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('patients.detail.allergies')}:</span>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-1">{patient.allergies || 'Aucune'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact - from original */}
                        {(patient.emergencyContact || patient.emergencyPhone) && (
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-500 mb-2 flex items-center gap-1">
                                    <ExclamationTriangleIcon className="w-4 h-4" />
                                    {t('patients.detail.emergencyContact')}
                                </h3>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg space-y-1 text-sm">
                                    <div className="flex items-start">
                                        <span className="text-gray-600 dark:text-gray-400 w-24">Contact:</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{patient.emergencyContact || 'Non renseigné'}</span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="text-gray-600 dark:text-gray-400 w-24">Téléphone:</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{patient.emergencyPhone || 'Non renseigné'}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PatientProfile;
