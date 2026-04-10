'use client';
// VERSION: FIX_V1

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { 
    PlusIcon, 
    TableCellsIcon, 
    ChartBarIcon,
    EyeIcon,
    ListBulletIcon,
    ClockIcon,
    ArrowDownTrayIcon,
    PrinterIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const DentalActHistory = dynamic(() => import('@/features/dental/components/DentalActHistory'), {
    loading: () => <div className="animate-pulse bg-white dark:bg-gray-800 rounded-2xl h-96" />,
    ssr: false,
});

import ParodontalStatusSection from './ParodontalStatusSection';



const DynamicDentalActModal = dynamic(() => import('@/features/dental/components/DentalActModal'), {
    loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96" />,
    ssr: false,
});



interface DentalModuleSectionProps {
    patientId: string;
    patientName?: string;
    currentUserId: number;
    isVisible: boolean;
}

type TabType = 'acts' | 'perio';

export function DentalModuleSection({ patientId, patientName, currentUserId, isVisible }: DentalModuleSectionProps) {
    const [activeTab, setActiveTab] = useState<TabType>('acts');
    
    // Logic for Dental Acts (from DentalActsSection)
    const [showActsModal, setShowActsModal] = useState(false);
    const [selectedAct, setSelectedAct] = useState<any>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [showDropdown, setShowDropdown] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
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

    const perioRef = React.useRef<any>(null);

    if (!isVisible) return null;

    const handleAddClick = () => {
        if (activeTab === 'acts') {
            setSelectedAct(null);
            setShowActsModal(true);
        } else {
            setShowDropdown(!showDropdown);
        }
    };

    const handleViewDetail = (act: any) => {
        setSelectedAct(act);
        setShowActsModal(true);
    };

    const handleModalClose = () => {
        setShowActsModal(false);
        setSelectedAct(null);
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
        handleModalClose();
    };

    const isReadOnly = selectedAct && selectedAct.doctor_user_id !== currentUserId;

    return (
        <div className="mb-10 hidden md:block">
            <div className="flex justify-between items-end mb-0 px-2 relative">
                {/* Tabs Navigation - Google Style sitting on the border */}
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('acts')}
                        className={`flex items-center gap-2 px-8 py-3 text-sm font-black rounded-t-2xl transition-all border-b-0 ${
                            activeTab === 'acts'
                                ? 'bg-white dark:bg-gray-800 text-cyan-600 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] border-x border-t border-gray-100 dark:border-gray-700'
                                : 'text-gray-400 dark:text-gray-500 hover:text-cyan-600 hover:bg-white/50 dark:hover:bg-gray-800/50'
                        }`}
                    >
                        <TableCellsIcon className="w-4 h-4" />
                        Actes Dentaires
                    </button>
                    <button
                        onClick={() => setActiveTab('perio')}
                        className={`flex items-center gap-2 px-8 py-3 text-sm font-black rounded-t-2xl transition-all border-b-0 ${
                            activeTab === 'perio'
                                ? 'bg-white dark:bg-gray-800 text-cyan-600 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] border-x border-t border-gray-100 dark:border-gray-700'
                                : 'text-gray-400 dark:text-gray-500 hover:text-cyan-600 hover:bg-white/50 dark:hover:bg-gray-800/50'
                        }`}
                    >
                        <ChartBarIcon className="w-4 h-4" />
                        Statut Parodontal
                    </button>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none shadow-xl shadow-gray-200/50 dark:shadow-none transition-colors border border-gray-100 dark:border-gray-700/50 relative">
                <div className="p-0 border-b border-gray-50 dark:border-gray-700/30">
                    <div className="flex items-center justify-between gap-4 px-6 py-4">
                        <div className="flex items-center gap-3">
                            {/* Simple dynamic label inside the content area */}
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {activeTab === 'acts' ? 'Journal des Actes' : ''}
                            </span>
                        </div>

                        {/* Contextual Action Button */}
                        <div className="flex flex-col items-end relative" ref={dropdownRef}>
                            <button
                                onClick={handleAddClick}
                                disabled={isCreating}
                                className="px-6 py-2.5 text-xs font-black text-white bg-cyan-600 rounded-xl hover:bg-cyan-700 transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 uppercase tracking-widest"
                            >
                                {isCreating ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <PlusIcon className="w-4 h-4 stroke-[4px]" />
                                )}
                                {activeTab === 'acts' ? 'Ajouter Acte' : 'Nouveau Statut'}
                            </button>

                            {/* View & Liste toggle controls if perio tab active */}
                            {activeTab === 'perio' && (
                                <div className="flex items-center mt-2 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <button
                                        onClick={() => perioRef.current?.toggleView()}
                                        className="px-5 py-1.5 text-[10px] font-black text-gray-400 hover:text-cyan-600 transition-all flex items-center gap-2 uppercase tracking-widest"
                                    >
                                        <EyeIcon className="w-3.5 h-3.5 stroke-[3px]" /> View
                                    </button>
                                    <button
                                        onClick={() => perioRef.current?.toggleList()}
                                        className="px-4 py-1.5 text-[10px] font-black text-gray-400 hover:text-cyan-600 transition-all flex items-center gap-2 uppercase tracking-widest border-l border-gray-100 dark:border-gray-700"
                                    >
                                        <ListBulletIcon className="w-3.5 h-3.5 stroke-[3px]" /> Liste
                                    </button>
                                </div>
                            )}



                            {/* Dropdown menu */}
                            {showDropdown && activeTab === 'perio' && (
                                <div className="absolute top-[45px] right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                    <button 
                                        onClick={async () => {
                                            setShowDropdown(false);
                                            setIsCreating(true);
                                            await perioRef.current?.createNew();
                                            setIsCreating(false);
                                        }}
                                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-bold text-emerald-600 dark:text-emerald-400 border-b border-gray-50 dark:border-gray-700/50"
                                    >
                                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                            <PlusIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span>Nouveau Statut</span>
                                            <span className="text-[10px] text-gray-400 font-normal uppercase tracking-wide">Examen vierge</span>
                                        </div>
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            setShowDropdown(false);
                                            setIsCreating(true);
                                            await perioRef.current?.createOld();
                                            setIsCreating(false);
                                        }}
                                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-bold text-amber-600 dark:text-amber-400"
                                    >
                                        <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                                            <ClockIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span>Ancien Statut</span>
                                            <span className="text-[10px] text-gray-400 font-normal uppercase tracking-wide">Copier dernier</span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-0 transition-all">
                    {activeTab === 'acts' ? (
                        <div className="animate-in slide-in-from-left-2 fade-in duration-300">
                            <DentalActHistory
                                patientId={patientId}
                                onAddClick={handleAddClick}
                                onViewDetail={handleViewDetail}
                                refreshTrigger={refreshTrigger}
                                noCard={true}
                            />
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-right-2 fade-in duration-300">
                             <ParodontalStatusSection 
                                ref={perioRef}
                                patientId={patientId} 
                                patientName={patientName}
                                isVisible={true} 
                                noCard={true}
                             />
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Dental Acts */}
            {showActsModal && (
                <DynamicDentalActModal
                    isOpen={showActsModal}
                    onClose={handleModalClose}
                    patientId={patientId}
                    onSuccess={handleSuccess}
                    editAct={selectedAct}
                    readOnly={!!isReadOnly}
                />
            )}
        </div>
    );
}

export default DentalModuleSection;
