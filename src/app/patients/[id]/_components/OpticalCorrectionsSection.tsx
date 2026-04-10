'use client';

import React, { useState } from 'react';
import { OpticalCorrectionList } from '@/features/prescriptions/components/OpticalCorrectionList';
import { CreateOpticalCorrectionModal } from '@/features/prescriptions/components/modals/CreateOpticalCorrectionModal';
import { Eye, Plus } from 'lucide-react';
import { CardSkeleton } from '@/components/feedback';

interface OpticalCorrectionsSectionProps {
    patientId: string;
    patientName?: string;
    patientFamilyName?: string;
    patientDateNaissance?: string;
    patientGenre?: string;
    isVisible: boolean; // Only render for doctors
}

export function OpticalCorrectionsSection({ 
    patientId, 
    patientName,
    patientFamilyName,
    patientDateNaissance,
    patientGenre,
    isVisible 
}: OpticalCorrectionsSectionProps) {
    const [showModal, setShowModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    if (!isVisible) return null;

    const handleAddClick = () => {
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
        handleModalClose();
    };

    return (
        <div className="mb-6 hidden md:block">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-500">
                    <Eye className="w-5 h-5" />
                  </span>
                  Correction Optique
                </h2>
                <button 
                  onClick={handleAddClick} 
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle
                </button>
              </div>
              
              <OpticalCorrectionList 
                  patientId={patientId} 
                  refreshTrigger={refreshTrigger} 
              />
            </div>

            {showModal && (
                <CreateOpticalCorrectionModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    patientId={patientId}
                    patientName={patientName}
                    patientFamilyName={patientFamilyName}
                    patientDateNaissance={patientDateNaissance}
                    patientGenre={patientGenre}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}

export default OpticalCorrectionsSection;
