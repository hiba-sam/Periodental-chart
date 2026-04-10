'use client';

// AppointmentsSection Component - Self-contained section for appointments
// Synced with page.original.tsx design (compact cards)

import React, { useMemo } from 'react';
import {
    CalendarIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';

interface Appointment {
    id: number | string;
    date: string | Date;
    time: string;
    patient_id?: string;
    status?: string;
    notes?: string;
}

interface AppointmentsSectionProps {
    appointments: Appointment[];
    patientId: string;
    isLoading?: boolean;
    onCreateAppointment: () => void;
}

/**
 * Loading skeleton
 */
function AppointmentsSkeleton() {
    return (
        <div className="space-y-2">
            {[1, 2].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32" />
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
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium">{t('patients.detail.noAppointments')}</p>
        </div>
    );
}

/**
 * AppointmentsSection - Main component
 * Matches the exact layout from page.original.tsx
 */
export function AppointmentsSection({
    appointments,
    patientId,
    isLoading,
    onCreateAppointment,
}: AppointmentsSectionProps) {
    const { t } = useLanguage();

    // Split and sort appointments
    const { futureAppointments, pastAppointments } = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const sorted = [...appointments].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const future = sorted
            .filter(apt => {
                const d = new Date(apt.date);
                d.setHours(0, 0, 0, 0);
                return d >= now;
            })
            .reverse();

        const past = sorted.filter(apt => {
            const d = new Date(apt.date);
            d.setHours(0, 0, 0, 0);
            return d < now;
        });

        return { futureAppointments: future, pastAppointments: past };
    }, [appointments]);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm transition-colors flex-1">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse" />
                </div>
                <AppointmentsSkeleton />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm transition-colors flex-1">
            {/* Header - from original */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-500" />
                    {t('patients.detail.appointments')}
                </h2>
                <button
                    onClick={onCreateAppointment}
                    className="hidden md:block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {t('patients.detail.new')}
                </button>
            </div>

            {/* Content - from original (max-h-[200px]) */}
            <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2">
                {appointments && appointments.length > 0 ? (
                    <>
                        {/* Future appointments - from original */}
                        {futureAppointments.length > 0 && (
                            <>
                                <div className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
                                    À venir ({futureAppointments.length})
                                </div>
                                {futureAppointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 font-medium">
                                                <CalendarIcon className="w-4 h-4" />
                                                {new Date(apt.date as string).toLocaleDateString('fr-FR', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short'
                                                })}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ClockIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    {apt.time}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Past appointments - from original */}
                        {pastAppointments.length > 0 && (
                            <>
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 mt-3">
                                    Passés ({pastAppointments.length})
                                </div>
                                {pastAppointments.slice(0, 3).map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 opacity-60"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <CalendarIcon className="w-4 h-4" />
                                                {new Date(apt.date as string).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'short'
                                                })}
                                            </div>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {apt.time}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </>
                ) : (
                    <EmptyState />
                )}
            </div>
        </div>
    );
}

export default AppointmentsSection;
