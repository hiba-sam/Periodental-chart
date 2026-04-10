"use client";

import DataTable from 'react-data-table-component';

interface ToothSite {
    id: number;
    patient_id: number;
    tooth_number: number;
    site_location: string;
    probing_depth: number;
    gingival_margin: number;
    cal: number;
    bleeding_on_probing: boolean;
    plaque: boolean;
    mobility: number;
    furcation: number;
    furcation_p: number;
    implant: boolean;
    prognosis: string;
    created_at: string;
}

interface Props {
    data: ToothSite[];
    readOnly?: boolean;
}

function getCAL(row: ToothSite): number {
    if (row.cal && row.cal > 0) return row.cal;
    const pd = row.probing_depth || 0;
    const mg = row.gingival_margin || 0;
    return pd + mg;
}

const getFurcaIcon = (f: number) => {
    if (f === 1) return '/img/vacio.png';
    if (f === 2) return '/img/mediolleno.png';
    if (f === 3) return '/img/lleno.png';
    return null;
}

const columns = [
    {
        name: 'Dent',
        selector: (row: ToothSite) => row.tooth_number,
        format: (row: ToothSite) => `${Math.floor(row.tooth_number / 10)}.${row.tooth_number % 10}`,
        sortable: true,
        width: '70px',
    },
    {
        name: 'Site',
        selector: (row: ToothSite) => row.site_location,
        sortable: true,
        width: '80px',
    },
    {
        name: 'PS (mm)',
        selector: (row: ToothSite) => row.probing_depth || 0,
        sortable: true,
        width: '80px',
    },
    {
        name: 'MG (mm)',
        selector: (row: ToothSite) => row.gingival_margin || 0,
        sortable: true,
        width: '80px',
    },
    {
        name: 'CAL (mm)',
        selector: (row: ToothSite) => getCAL(row),
        cell: (row: ToothSite) => {
            const cal = getCAL(row);
            const color = cal >= 5 ? '#dc2626' : cal >= 3 ? '#d97706' : '#16a34a';
            const weight = cal >= 3 ? 'bold' : 'normal';
            return (
                <span style={{ color, fontWeight: weight, fontSize: '13px' }}>
                    {cal > 0 ? cal : '-'}
                </span>
            );
        },
        sortable: true,
        width: '85px',
    },
    {
        name: 'BOP',
        selector: (row: ToothSite) => row.bleeding_on_probing ? '✓' : '—',
        cell: (row: ToothSite) => (
            <span style={{ color: row.bleeding_on_probing ? '#dc2626' : '#9ca3af' }}>
                {row.bleeding_on_probing ? '✓' : '—'}
            </span>
        ),
        sortable: true,
        width: '60px',
    },
    {
        name: 'Plaque',
        selector: (row: ToothSite) => row.plaque ? '✓' : '—',
        cell: (row: ToothSite) => (
            <span style={{ color: row.plaque ? '#d97706' : '#9ca3af' }}>
                {row.plaque ? '✓' : '—'}
            </span>
        ),
        sortable: true,
        width: '70px',
    },
    {
        name: 'Mob',
        selector: (row: ToothSite) => row.mobility || 0,
        format: (row: ToothSite) => row.mobility || '—',
        width: '55px',
    },
    {
        name: 'Furca',
        selector: (row: ToothSite) => row.furcation || 0,
        cell: (row: ToothSite) => {
            const f1 = getFurcaIcon(row.furcation);
            const f2 = getFurcaIcon(row.furcation_p);
            
            if (!f1 && !f2) return <span>—</span>;
            
            return (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {f1 && <img src={f1} alt="Furca" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />}
                    {f1 && f2 && <span style={{ color: '#ccc' }}>|</span>}
                    {f2 && <img src={f2} alt="Furca Palatin" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />}
                </div>
            );
        },
        width: '80px',
    },
    {
        name: 'Impl',
        selector: (row: ToothSite) => row.implant ? 'Oui' : '—',
        width: '55px',
    },
    {
        name: 'Note',
        selector: (row: ToothSite) => row.prognosis || '—',
        sortable: true,
        grow: 1,
    },
];

export default function ToothSitesTable({ data }: Props) {
    const totalSites = data.length;
    const bopCount = data.filter(r => r.bleeding_on_probing).length;
    const bopPercent = totalSites > 0 ? Math.round((bopCount / totalSites) * 100) : 0;
    const avgCAL = totalSites > 0
        ? (data.reduce((s, r) => s + getCAL(r), 0) / totalSites).toFixed(1)
        : '0';
    const avgPS = totalSites > 0
        ? (data.reduce((s, r) => s + (r.probing_depth || 0), 0) / totalSites).toFixed(1)
        : '0';

    return (
        <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
            {/* Summary bar */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sites</span>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalSites}</div>
                </div>
                <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PS moy.</span>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{avgPS} mm</div>
                </div>
                <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CAL moy.</span>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: parseFloat(avgCAL) >= 3 ? '#d97706' : '#16a34a' }}>{avgCAL} mm</div>
                </div>
                <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BOP</span>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: bopPercent >= 20 ? '#dc2626' : '#16a34a' }}>{bopPercent}%</div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={data}
                pagination
                paginationPerPage={20}
                responsive
                highlightOnHover
                pointerOnHover
                dense
                noDataComponent={<div className="p-8 text-slate-500">Aucun site enregistré pour ce patient.</div>}
            />
        </div>
    );
}
