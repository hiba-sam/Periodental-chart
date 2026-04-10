'use client';

// DentalActsSection Component - Self-contained section for dental acts
// Synced with page.original.tsx design and DentalActModal props

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { DentalActHistory } from '@/features/dental/components';

// Lazy load heavy dental modal component
const DentalActModal = dynamic(() => import('@/features/dental/components/DentalActModal'), {
    loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96" />,
    ssr: false,
});

interface DentalAct {
    id: number;
    patient_id: string;
    doctor_user_id?: number;
    tooth_number?: string;
    act_type?: string;
    notes?: string;
    created_at: string;
}

interface DentalActsSectionProps {
    patientId: string;
    currentUserId: number; // For readOnly logic
    isVisible: boolean; // Only render for dental specialists
}

/**
 * DentalActsSection - Self-contained dental acts management
 * Matches original page.original.tsx implementation
 */
export function DentalActsSection({ patientId, currentUserId, isVisible }: DentalActsSectionProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedAct, setSelectedAct] = useState<DentalAct | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    if (!isVisible) return null;

    const handleAddClick = () => {
        setSelectedAct(null);
        setShowModal(true);
    };

    const handleViewDetail = (act: any) => {
        setSelectedAct(act);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedAct(null);
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
        handleModalClose();
    };

    // ReadOnly if viewing another doctor's act
    const isReadOnly = selectedAct && selectedAct.doctor_user_id !== currentUserId;

    return (
        <>
            <div className="mb-6 hidden md:block">
                <DentalActHistory
                    patientId={patientId}
                    onAddClick={handleAddClick}
                    onViewDetail={handleViewDetail}
                    refreshTrigger={refreshTrigger}
                />
            </div>

            {/* Dental Act Modal - matches original props */}
            {showModal && (
                <DentalActModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    patientId={patientId}
                    onSuccess={handleSuccess}
                    editAct={selectedAct}
                    readOnly={!!isReadOnly}
                />
            )}
        </>
    );
}

export default DentalActsSection;
