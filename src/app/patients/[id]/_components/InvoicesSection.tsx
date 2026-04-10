'use client';

// InvoicesSection Component - Self-contained section for invoices
// Uses invoice hooks for data fetching and mutations
// Synced with page.original.tsx design

import React from 'react';
import { useInvoices, useInvoiceMutations, InvoiceList } from '@/features/invoices';
import { useAuth } from '@/contexts/AuthContext';
import type { Invoice } from '@/features/invoices';

interface InvoicesSectionProps {
    patientId: string;
    onCreateInvoice: () => void;
    onOpenPayment: (invoice: Invoice) => void;
    onOpenGlobalPayment: () => void;
}

/**
 * InvoicesSection - Self-contained invoice management section
 * Uses React Query hooks for data fetching and mutations
 */
export function InvoicesSection({
    patientId,
    onCreateInvoice,
    onOpenPayment,
    onOpenGlobalPayment,
}: InvoicesSectionProps) {
    const { user } = useAuth();

    // Use invoice hooks
    const { invoices, isLoading, totalUnpaid } = useInvoices(patientId);
    const { deleteInvoice, isDeleting } = useInvoiceMutations(patientId);

    return (
        <InvoiceList
            invoices={invoices}
            isLoading={isLoading}
            totalUnpaid={totalUnpaid}
            onOpenPayment={onOpenPayment}
            onDelete={deleteInvoice}
            onCreateInvoice={onCreateInvoice}
            onOpenGlobalPayment={onOpenGlobalPayment}
            isDeleting={isDeleting}
            isDoctorUser={user?.role === 'doctor'}
        />
    );
}

export default InvoicesSection;
