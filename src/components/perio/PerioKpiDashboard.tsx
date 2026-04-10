'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/solid';

interface KPIProps {
    patientId: string;
    currentExamId?: number | null;
    currentStats: { plaquePct: number, deepPockets: number, bleedPct: number, avgCal: number, avgPd: number, mobility?: number };
}

export default function PerioKpiDashboard({ patientId, currentExamId, currentStats }: KPIProps) {
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (!patientId) return;
        fetch(`/api/perio/charts?patient_id=${patientId}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                if (Array.isArray(data)) {
                    // Sort by creation date
                    const sorted = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                    setHistory(sorted);
                }
            })
            .catch(console.error);
    }, [patientId]);

    let prevStats: any = null;
    let trendData: any[] = [];

    if (history.length > 0) {
        let currentIndex = history.findIndex(h => h.id === currentExamId);
        if (currentIndex === -1) {
            prevStats = history[history.length - 1];
            trendData = history.slice(-3).map((h, i) => ({
                name: `T-${history.length - i}`,
                bop: parseInt(h.bop_pct) || 0,
                pi: parseInt(h.pi_pct) || 0,
                cal: parseFloat(h.avg_cal) || 0,
                pd: parseFloat(h.avg_pd) || 0
            }));
            trendData.push({
                name: 'Actuel',
                bop: currentStats.bleedPct,
                pi: currentStats.plaquePct,
                cal: currentStats.avgCal,
                pd: currentStats.avgPd
            });
        } else {
            if (currentIndex > 0) {
                prevStats = history[currentIndex - 1];
            }
            const relevantHistory = history.slice(0, currentIndex + 1).slice(-4);
            trendData = relevantHistory.map((h, i) => ({
                name: i === relevantHistory.length - 1 ? 'Actuel' : `T-${relevantHistory.length - 1 - i}`,
                bop: i === relevantHistory.length - 1 ? currentStats.bleedPct : (parseInt(h.bop_pct) || 0),
                pi: i === relevantHistory.length - 1 ? currentStats.plaquePct : (parseInt(h.pi_pct) || 0),
                cal: i === relevantHistory.length - 1 ? currentStats.avgCal : (parseFloat(h.avg_cal) || 0),
                pd: i === relevantHistory.length - 1 ? currentStats.avgPd : (parseFloat(h.avg_pd) || 0)
            }));
        }
    } else {
        trendData = [{
            name: 'Actuel',
            bop: currentStats.bleedPct,
            pi: currentStats.plaquePct,
            cal: currentStats.avgCal,
            pd: currentStats.avgPd
        }];
    }

    const getDiff = (current: number, previous: number | null | undefined, isLowerBetter = true, includeSign = true) => {
        if (previous == null) return { value: null, label: 'Sans historique' };
        const diff = current - previous;
        if (diff === 0) return { value: 0, label: '= stable', color: 'text-emerald-500', Icon: MinusIcon };
        const isImprovement = isLowerBetter ? diff < 0 : diff > 0;
        return {
            value: Number(Math.abs(diff).toFixed(1)),
            label: `${includeSign ? (diff > 0 ? '+' : '-') : ''}${Math.abs(diff).toFixed(1)} vs visite préc.`,
            color: isImprovement ? 'text-emerald-500' : 'text-rose-500',
            Icon: diff > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon
        };
    };

    const plaqueDiff = getDiff(currentStats.plaquePct, prevStats ? parseInt(prevStats.pi_pct) : null);
    const bopDiff = getDiff(currentStats.bleedPct, prevStats ? parseInt(prevStats.bop_pct) : null, true, true);
    const calDiff = getDiff(currentStats.avgCal, prevStats ? parseFloat(prevStats.avg_cal) : null);
    const pdDiff = getDiff(currentStats.avgPd, prevStats ? parseFloat(prevStats.avg_pd) : null);
    const mobilityDiff = getDiff(currentStats.mobility || 0, null, true, true);

    const getBopStatus = (val: number) => val < 10 ? 'emerald' : val <= 30 ? 'amber' : 'rose';
    const getPlaqueStatus = (val: number) => val < 20 ? 'emerald' : val <= 50 ? 'amber' : 'rose';
    const getMobilityStatus = (val: number) => val === 0 ? 'emerald' : 'amber';
    const getCalStatus = (val: number) => val <= 1 ? 'emerald' : val <= 4 ? 'amber' : 'rose';
    const getPdStatus = (val: number) => val <= 3 ? 'emerald' : val <= 4 ? 'amber' : 'rose';

    const KpiCard = ({ title, subtitle, value, unit, diffInfo, valueColor = 'text-gray-800', status = 'emerald' }: any) => {
        const bgMap: Record<string, string> = { 'emerald': 'bg-emerald-400', 'amber': 'bg-amber-400', 'rose': 'bg-rose-500' };
        const textMap: Record<string, string> = { 'emerald': 'text-emerald-500', 'amber': 'text-amber-500', 'rose': 'text-rose-500' };
        return (
        <div className="flex flex-col bg-white rounded-3xl border border-gray-200 p-5 shadow-sm w-full">
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{title}</span>
                    {subtitle && <span className="text-[10px] font-bold text-gray-400 mt-0.5">{subtitle}</span>}
                </div>
            </div>
            <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-black tabular-nums tracking-tighter ${textMap[status] || valueColor}`}>{value}</span>
                {unit && <span className={`text-xl font-bold ${textMap[status] || valueColor}`}>{unit}</span>}
            </div>
            {diffInfo.value !== null ? (
                <div className={`flex items-center gap-1 mt-5 text-xs font-bold ${diffInfo.color || 'text-gray-400'}`}>
                    {diffInfo.Icon && <diffInfo.Icon className="w-3 h-3 stroke-[3]" />}
                    <span>{diffInfo.label}{unit && diffInfo.value !== 0 ? unit : ''}</span>
                </div>
            ) : (
                <div className="flex items-center gap-1 mt-5 text-xs font-bold text-gray-300">
                    <span>{diffInfo.label}</span>
                </div>
            )}
            <div className="mt-4 h-1.5 w-full flex gap-1">
                <div className={`h-full flex-1 ${bgMap[status]} rounded-full`}></div>
                <div className={`h-full flex-1 ${bgMap[status]} rounded-full ${status !== 'emerald' ? 'opacity-100' : 'opacity-30'}`}></div>
                <div className={`h-full flex-1 ${bgMap[status]} rounded-full ${status === 'rose' ? 'opacity-100' : 'opacity-30'}`}></div>
            </div>
        </div>
    )};

    const MiniChart = ({ title, data, dataKey, color, domain }: any) => (
        <div className="flex flex-col bg-white rounded-3xl border border-gray-200 shadow-sm p-5 flex-1">
            <span className="text-xs font-black text-gray-700 mb-4 uppercase tracking-widest">{title}</span>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} padding={{ left: 10, right: 10 }} />
                        <YAxis domain={domain} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 w-full mt-4 mb-4">
            <div className="grid grid-cols-5 gap-4">
                <KpiCard title="Saignement (BOP)" subtitle="< 10% Sain" value={currentStats.bleedPct} unit="%" diffInfo={bopDiff} status={getBopStatus(currentStats.bleedPct)} />
                <KpiCard title="Indice Plaque" subtitle="< 20% Sain" value={currentStats.plaquePct} unit="%" diffInfo={plaqueDiff} status={getPlaqueStatus(currentStats.plaquePct)} />
                <KpiCard title="Mobilité" subtitle="Dents touchées" value={currentStats.mobility || 0} unit="" diffInfo={mobilityDiff} status={getMobilityStatus(currentStats.mobility || 0)} />
                <KpiCard title="CAL Moyen" subtitle="0-1mm Sain" value={currentStats.avgCal} unit="mm" diffInfo={calDiff} status={getCalStatus(currentStats.avgCal)} />
                <KpiCard title="PD Moyen" subtitle="Profondeur" value={currentStats.avgPd} unit="mm" diffInfo={pdDiff} status={getPdStatus(currentStats.avgPd)} />
            </div>

            {history.length > 0 && trendData.length > 1 && (
                <div className="flex gap-4 w-full bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                    <MiniChart title="Saignement (BOP) Trend" data={trendData} dataKey="bop" color="#3b82f6" domain={[0, 100]} />
                    <MiniChart title="Plaque (PI) Trend" data={trendData} dataKey="pi" color="#8b5cf6" domain={[0, 100]} />
                    <MiniChart title="Pocket Depth (PD) Moy." data={trendData} dataKey="pd" color="#10b981" domain={[0, 10]} />
                </div>
            )}
        </div>
    );
}
