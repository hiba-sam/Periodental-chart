"use client";

import { useEffect } from "react";
import Script from 'next/script';

// Upper palatin molars that need TWO furcation table cells: f{t}b-a + f{t}b-b
const PALATIN_TWO_CELL = [18, 17, 16, 14, 28, 27, 26, 24];
// Upper palatin multiroot teeth that need TWO visual furcation markers: furca{t}-a + furca{t}-b
const PALATIN_MULTIROOT_UPPER = [18, 17, 16, 26, 27, 28, 14, 24];

interface LegacyToothChartProps {
    readOnly?: boolean;
    onChange?: () => void;
    view?: 'all' | 'superior' | 'inferior';
    hideKpis?: boolean;
    sites?: Record<string, any>; // Ajout des données sites
    onStatsUpdate?: (stats: { plaquePct: number, deepPockets: number, bleedPct: number, avgCal: number, avgPd: number }) => void;
}

export default function LegacyToothChart({ readOnly = false, onChange, view = 'all', hideKpis = false, sites, onStatsUpdate }: LegacyToothChartProps) {
    const topRx = [18, 17, 16, 15, 14, 13, 12, 11];
    const topLx = [21, 22, 23, 24, 25, 26, 27, 28];
    const botLx = [48, 47, 46, 45, 44, 43, 42, 41];
    const botRx = [31, 32, 33, 34, 35, 36, 37, 38];

    useEffect(() => {
        const loadDependenciesAndScripts = () => {
            if (typeof window === 'undefined') return;

            // 1. Inject jQuery if not present
            if (!(window as any).jQuery && !document.querySelector('script[src*="jquery-"]')) {
                const jq = document.createElement('script');
                jq.src = "https://code.jquery.com/jquery-3.7.1.min.js";
                document.head.appendChild(jq);
            }

            // 2. Inject Google Charts Loader if not present
            if (!(window as any).google && !document.querySelector('script[src*="loader.js"]')) {
                const gl = document.createElement('script');
                gl.src = "https://www.gstatic.com/charts/loader.js";
                document.head.appendChild(gl);
            }

            // 3. Poll and wait for both to be globally available
            const checkReady = () => {
                const hasJQuery = typeof (window as any).jQuery !== 'undefined';
                const hasGoogle = typeof (window as any).google !== 'undefined' && typeof (window as any).google.charts !== 'undefined';

                if (!hasJQuery || !hasGoogle) {
                    setTimeout(checkReady, 50);
                    return;
                }

                // 4. Now safe to load legacy scripts!
                if (!document.querySelector('script[src*="odonto.js"]')) {
                    const script1 = document.createElement("script");
                    script1.src = "/odonto.js?v=20";
                    script1.async = false;
                    document.body.appendChild(script1);
                }
            };
            
            checkReady();
        };

        const timer = setTimeout(loadDependenciesAndScripts, 50);

        // Remplissage automatique des champs si des données sites sont fournies
        if (sites) {
            Object.entries(sites).forEach(([key, siteData]: [string, any]) => {
                const { tooth_number, site_location, probing_depth, gingival_margin, bleeding_on_probing, plaque, mobility, furcation, implant } = siteData;
                const suffix = site_location.startsWith('p') ? 'b' : '';
                const locMap: Record<string, string> = { 'distal': 'a', 'mid': 'b', 'mesial': 'c', 'pdistal': 'a', 'pmid': 'b', 'pmesial': 'c' };
                const loc = locMap[site_location] || 'a';

                // PD, GM, CAL
                const psEl = document.getElementById(`ps${tooth_number}${suffix}-${loc}`) as HTMLInputElement;
                const mgEl = document.getElementById(`mg${tooth_number}${suffix}-${loc}`) as HTMLInputElement;
                const aeEl = document.getElementById(`ae${tooth_number}${suffix}-${loc}`) as HTMLInputElement;
                if (psEl) psEl.value = String(probing_depth || 0);
                if (mgEl) mgEl.value = String(gingival_margin || 0);
                if (aeEl) aeEl.value = String((probing_depth || 0) - (gingival_margin || 0));

                // Saignement et Plaque
                const sEl = document.getElementById(`s${tooth_number}${suffix}-${loc}`);
                const pEl = document.getElementById(`p${tooth_number}${suffix}-${loc}`);
                if (sEl) {
                    sEl.dataset.value = bleeding_on_probing ? '1' : '0';
                    sEl.style.backgroundColor = bleeding_on_probing ? 'red' : 'white';
                }
                if (pEl) {
                    pEl.dataset.value = plaque ? '1' : '0';
                    pEl.style.backgroundColor = plaque ? '#58ACFA' : 'white';
                }

                // Mobilité et Furcation
                if (loc === 'a') {
                    const mEl = document.getElementById(`m${tooth_number}${suffix}`) as HTMLInputElement;
                    if (mEl) mEl.value = String(mobility || 0);
                    const fEl = document.getElementById(`f${tooth_number}${suffix}`);
                    if (fEl) {
                        fEl.dataset.value = String(furcation || 0);
                        if (furcation > 0) fEl.innerText = ''; // Le script odonto gère le dessin
                    }
                }
            });
        }

        // Initial summary calculation
        const timer2 = setTimeout(() => {
            (window as any).updateSummaries = updateSummaries;
            updateSummaries(false);
            if ((window as any).redrawAllCharts) (window as any).redrawAllCharts();
        }, 1000);

        return () => {
            clearTimeout(timer);
            clearTimeout(timer2);
            delete (window as any).updateSummaries;
        };
    }, [sites]);

    const updateSummaries = (triggerChange = true) => {
        const teeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
        const suffixes = ['', 'b'];
        const sites = ['a', 'b', 'c'];

        let totalPD = 0;
        let totalCAL = 0;
        let bleedCount = 0;
        let plaqueCount = 0;
        let deepPocketsCount = 0;
        let totalSites = 0;
        let mobilityCount = 0;

        teeth.forEach(t => {
            suffixes.forEach(s => {
                sites.forEach(site => {
                    const psEl = document.getElementById(`ps${t}${s}-${site}`) as HTMLInputElement;
                    const mgEl = document.getElementById(`mg${t}${s}-${site}`) as HTMLInputElement;
                    const calEl = document.getElementById(`ae${t}${s}-${site}`) as HTMLInputElement;
                    const bleedEl = document.getElementById(`s${t}${s}-${site}`);
                    const plaqueEl = document.getElementById(`p${t}${s}-${site}`);

                    if (psEl) {
                        const psVal = Number(psEl.value) || 0;
                        const mgVal = Number(mgEl?.value) || 0;
                        // CAL = PD - GM (GM negative = recession, so PD - (-2) = PD + 2)
                        const computedCal = psVal - mgVal;
                        
                        totalPD += psVal;
                        totalCAL += computedCal;
                        
                        // Also update the ae field for display
                        if (calEl) calEl.value = computedCal.toString();
                        
                        if (psVal >= 5) deepPocketsCount++;
                        if (bleedEl?.dataset.value === '1') bleedCount++;
                        if (plaqueEl?.dataset.value === '1') plaqueCount++;
                        totalSites++;
                    }
                });
            });
        });

        if (totalSites > 0) {
            const avgPD = (totalPD / totalSites).toFixed(2);
            const avgCAL = (totalCAL / totalSites).toFixed(2);
            const plaquePct = Math.round((plaqueCount / totalSites) * 100);
            const bleedPct = Math.round((bleedCount / totalSites) * 100);

            teeth.forEach(t => {
                const mobEl = document.getElementById(`m${t}`) as HTMLInputElement;
                if (mobEl && parseFloat(mobEl.value || '0') > 0) {
                    mobilityCount++;
                }
            });

            const s4 = document.getElementById('suma4');
            const s5 = document.getElementById('suma5');
            const s2 = document.getElementById('suma2');
            const s = document.getElementById('suma');

            if (s4) s4.innerText = avgPD;
            if (s5) s5.innerText = avgCAL;
            if (s2) s2.innerText = plaquePct.toString();
            if (s) s.innerText = bleedPct.toString();

            if (onStatsUpdate) {
                onStatsUpdate({
                    plaquePct,
                    deepPockets: deepPocketsCount,
                    bleedPct,
                    avgCal: parseFloat(avgCAL),
                    avgPd: parseFloat(avgPD),
                    mobility: mobilityCount
                });
            }
        }
        if (triggerChange && onChange) onChange();
    };

    const toggleFurca = (id: string) => {
        if (readOnly) return;
        const el = document.getElementById(id);
        if (!el) return;
        
        const current = parseInt(el.dataset.value || '0', 10);
        const next = (current + 1) % 4;

        if (next > 0) {
            const match = id.match(/^f(\d+)/);
            if (match) {
                const t = match[1];
                ['', 'b'].forEach(su => {
                    const impId = `imp-check-${t}${su}`;
                    const impEl = document.getElementById(impId);
                    if (impEl && impEl.dataset.active === 'true') {
                        impEl.dataset.active = 'false';
                        impEl.style.backgroundColor = 'transparent';
                        impEl.style.display = 'none';
                        const toothId = `diente${t}${su}-a`;
                        const toothEl = document.getElementById(toothId);
                        if (toothEl) toothEl.style.backgroundImage = '';
                    }
                });
            }
        }

        el.dataset.value = next.toString();
        el.innerText = '';
        el.style.fontWeight = 'bold';
        el.style.color = '#dc2626';
        el.style.display = 'inline-block';
        el.style.textAlign = 'center';
        el.style.lineHeight = '18px';
        el.style.minHeight = '18px';
        el.style.background = '#fff';

        const visualId = id.replace('f', 'furca');
        const visualEl = document.getElementById(visualId);
        if (visualEl) visualEl.dataset.value = next.toString();
        if (onChange) onChange();
    };

    const toggleImplant = (id: string) => {
        if (readOnly) return;
        const match = id.match(/^imp-check-(\d+)(b?)$/);
        if (match) {
            const t = parseInt(match[1], 10);
            const suffix = match[2];
            const el = document.getElementById(id);
            if (!el) return;

            const active = el.dataset.active === 'true';
            const next = !active;

            if (next) {
                const possibleFurcaIds = [`f${t}`, `f${t}-a`, `f${t}-b`, `f${t}b`];
                possibleFurcaIds.forEach(fId => {
                    const fEl = document.getElementById(fId);
                    if (fEl) {
                        fEl.dataset.value = '0';
                        fEl.innerText = '';
                        const vId = fId.replace('f', 'furca');
                        const vEl = document.getElementById(vId);
                        if (vEl) vEl.dataset.value = '0';
                    }
                });
            }

            el.dataset.active = next.toString();
            el.style.backgroundColor = next ? '#000' : 'transparent';
            el.style.borderRadius = '50%';
            el.style.width = '12px';
            el.style.height = '12px';
            el.style.margin = 'auto';
            el.style.display = next ? 'block' : 'none';

            const applyImage = (tooth: number, su: string, isNext: boolean) => {
                let tabla = 1;
                if (tooth >= 11 && tooth <= 18) tabla = su === 'b' ? 3 : 1;
                else if (tooth >= 21 && tooth <= 28) tabla = su === 'b' ? 4 : 2;
                else if (tooth >= 31 && tooth <= 38) tabla = su === 'b' ? 8 : 6;
                else if (tooth >= 41 && tooth <= 48) tabla = su === 'b' ? 7 : 5;
                const direction = (tabla <= 4) ? 'arriba' : 'abajo';
                const toothId = `diente${tooth}${su}-a`;
                const toothEl = document.getElementById(toothId);
                if (toothEl) {
                    if (isNext) toothEl.style.backgroundImage = `url('/img/tabla${tabla}/implantes/periodontograma-dientes-${direction}-tornillo-${tooth}${su}.png')`;
                    else toothEl.style.backgroundImage = '';
                }
            };

            applyImage(t, suffix, next);
            applyImage(t, suffix === 'b' ? '' : 'b', next);
        }
        if (onChange) onChange();
    };

    const toggleBleeding = (id: string) => {
        if (readOnly) return;
        const el = document.getElementById(id);
        if (!el) return;
        const current = el.dataset.value === '1';
        const next = !current;
        el.dataset.value = next ? '1' : '0';
        el.style.setProperty('background-color', next ? 'red' : 'white', 'important');
        if (onChange) onChange();
        updateSummaries();
    };

    const togglePlaque = (id: string) => {
        if (readOnly) return;
        const el = document.getElementById(id);
        if (!el) return;
        const current = el.dataset.value === '1';
        const next = !current;
        el.dataset.value = next ? '1' : '0';
        el.style.setProperty('background-color', next ? '#58ACFA' : 'white', 'important');
        if (onChange) onChange();
        updateSummaries();
    };

    const renderToothHeaders = (teeth: number[]) => teeth.map(t => <td key={`d${t}`} className="borde"><div id={`d${t}`}>{Math.floor(t / 10)}.{t % 10}</div></td>);
    const renderImplants = (teeth: number[], suffix: string = '') => teeth.map(t => (
        <td key={`i-cell-${t}${suffix}`} className="borde" onClick={(e) => { e.stopPropagation(); toggleImplant(`imp-check-${t}${suffix}`); }} style={{ cursor: readOnly ? 'default' : 'pointer', minHeight: '27px' }}>
            <div id={`imp-check-${t}${suffix}`} style={{ display: 'none' }}></div>
        </td>
    ));
    const getMobVal = (t: number) => {
        const s = sites.find((x: any) => x.tooth_number === t);
        return s && s.mobility != null ? s.mobility.toString() : '0';
    };

    const getProgVal = (t: number) => {
        const s = sites.find((x: any) => x.tooth_number === t);
        return s && s.prognosis != null ? s.prognosis : '';
    };

    const renderMobility = (teeth: number[], startingTab: number, suffix: string = '') => teeth.map((t, i) => <td key={`m${t}${suffix}`} className="borde"><input type="text" id={`m${t}${suffix}`} name={`m${t}${suffix}`} defaultValue={getMobVal(t)} tabIndex={startingTab + i} disabled={readOnly} onChange={() => { if (onChange) onChange(); updateSummaries(); }} /></td>);
    const renderPrognosis = (teeth: number[], startingTab: number, suffix: string = '') => teeth.map((t, i) => <td key={`pi${t}${suffix}`} className="borde"><input type="text" id={`pi${t}${suffix}`} name={`pi${t}${suffix}`} defaultValue={getProgVal(t)} tabIndex={startingTab + i} disabled={readOnly} onChange={() => { if (onChange) onChange(); updateSummaries(); }} /></td>);
    const renderFurca = (teeth: number[], suffix: string = '') => teeth.map(t => {
        const isMultiroot = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38].includes(t) || (suffix === 'b' && [14, 24].includes(t));
        const isTwoCell = suffix === 'b' && PALATIN_TWO_CELL.includes(t);
        if (isTwoCell) {
            const idA = `f${t}-a`, idB = `f${t}-b`;
            return (
                <td key={`f${t}${suffix}`} className="borde" style={{ padding: 0, minWidth: '40px' }}>
                    <div style={{ display: 'flex', width: '100%', height: '18px' }}>
                        <div id={idA} onClick={() => toggleFurca(idA)} style={{ flex: 1, height: '100%', background: '#fff', borderRight: '1px solid #ccc', cursor: readOnly ? 'default' : 'pointer', textAlign: 'center', lineHeight: '18px', fontSize: '10px' }}></div>
                        <div id={idB} onClick={() => toggleFurca(idB)} style={{ flex: 1, height: '100%', background: '#fff', cursor: readOnly ? 'default' : 'pointer', textAlign: 'center', lineHeight: '18px', fontSize: '10px' }}></div>
                    </div>
                </td>
            );
        }
        return (
            <td key={`f${t}${suffix}`} className="borde" onClick={isMultiroot && !readOnly ? () => toggleFurca(`f${t}${suffix}`) : undefined} style={{ cursor: isMultiroot && !readOnly ? 'pointer' : 'default', padding: 0 }}>
                {isMultiroot ? <div id={`f${t}${suffix}`} style={{ width: '100%', height: '100%', minHeight: '18px', background: '#fff', textAlign: 'center', lineHeight: '18px' }}></div> : null}
            </td>
        );
    });

    const renderBleeding = (teeth: number[], suffix: string = '') => teeth.map(t => (
        <td key={`s${t}${suffix}`} className="borde">
            <div id={`s${t}${suffix}-a`} className="site-indicator" onClick={() => toggleBleeding(`s${t}${suffix}-a`)}></div>
            <div id={`s${t}${suffix}-b`} className="site-indicator" onClick={() => toggleBleeding(`s${t}${suffix}-b`)}></div>
            <div id={`s${t}${suffix}-c`} className="site-indicator" onClick={() => toggleBleeding(`s${t}${suffix}-c`)}></div>
        </td>
    ));
    const renderPlaque = (teeth: number[], suffix: string = '') => teeth.map(t => (
        <td key={`p${t}${suffix}`} className="borde">
            <div id={`p${t}${suffix}-a`} className="site-indicator" onClick={() => togglePlaque(`p${t}${suffix}-a`)}></div>
            <div id={`p${t}${suffix}-b`} className="site-indicator" onClick={() => togglePlaque(`p${t}${suffix}-b`)}></div>
            <div id={`p${t}${suffix}-c`} className="site-indicator" onClick={() => togglePlaque(`p${t}${suffix}-c`)}></div>
        </td>
    ));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const id = e.target.id;
        const match = id.match(/^(ps|mg|ae)(\d+)(b?)-(a|b|c)$/);
        if (!match) return;
        const [_, prefix, tooth, suffix, site] = match;
        const psEl = document.getElementById(`ps${tooth}${suffix}-${site}`) as HTMLInputElement;
        const mgEl = document.getElementById(`mg${tooth}${suffix}-${site}`) as HTMLInputElement;
        const calEl = document.getElementById(`ae${tooth}${suffix}-${site}`) as HTMLInputElement;
        if (psEl && mgEl && calEl) {
            const psNum = Number(psEl.value) || 0;
            const mgNum = Number(mgEl.value) || 0;
            calEl.value = (psNum - mgNum).toString();
            updateSummaries();
        }
    };

    const getSiteVal = (t: number, suffix: string, site: string, key: 'gingival_margin' | 'probing_depth') => {
        const fullLoc = suffix === '' ? site : `b-${site}`;
        const s = sites.find((x: any) => x.tooth_number === t && x.site_location === fullLoc);
        return s && s[key] != null ? s[key].toString() : '0';
    };

    const getCalVal = (t: number, suffix: string, site: string) => {
        const fullLoc = suffix === '' ? site : `b-${site}`;
        const s = sites.find((x: any) => x.tooth_number === t && x.site_location === fullLoc);
        if (s && s.probing_depth != null) {
             const pd = Number(s.probing_depth) || 0;
             const gm = Number(s.gingival_margin) || 0;
             return (pd - gm).toString();
        }
        return '0';
    };

    const renderGingivalMargin = (teeth: number[], startingTab: number, suffix: string = '') => teeth.map((t, i) => (
        <td key={`mg${t}${suffix}`} className="borde">
            <input type="text" id={`mg${t}${suffix}-a`} name={`mg${t}${suffix}-a`} defaultValue={getSiteVal(t, suffix, 'a', 'gingival_margin')} tabIndex={startingTab + (i * 3)} onChange={handleInputChange} disabled={readOnly} />
            <input type="text" id={`mg${t}${suffix}-b`} name={`mg${t}${suffix}-b`} defaultValue={getSiteVal(t, suffix, 'b', 'gingival_margin')} tabIndex={startingTab + (i * 3) + 1} onChange={handleInputChange} disabled={readOnly} />
            <input type="text" id={`mg${t}${suffix}-c`} name={`mg${t}${suffix}-c`} defaultValue={getSiteVal(t, suffix, 'c', 'gingival_margin')} tabIndex={startingTab + (i * 3) + 2} onChange={handleInputChange} disabled={readOnly} />
        </td>
    ));

    const renderProbingDepth = (teeth: number[], startingTab: number, suffix: string = '') => teeth.map((t, i) => (
        <td key={`ps${t}${suffix}`} className="borde">
            <input type="text" id={`ps${t}${suffix}-a`} name={`ps${t}${suffix}-a`} defaultValue={getSiteVal(t, suffix, 'a', 'probing_depth')} tabIndex={startingTab + (i * 3)} onChange={handleInputChange} disabled={readOnly} />
            <input type="text" id={`ps${t}${suffix}-b`} name={`ps${t}${suffix}-b`} defaultValue={getSiteVal(t, suffix, 'b', 'probing_depth')} tabIndex={startingTab + (i * 3) + 1} onChange={handleInputChange} disabled={readOnly} />
            <input type="text" id={`ps${t}${suffix}-c`} name={`ps${t}${suffix}-c`} defaultValue={getSiteVal(t, suffix, 'c', 'probing_depth')} tabIndex={startingTab + (i * 3) + 2} onChange={handleInputChange} disabled={readOnly} />
        </td>
    ));

    const renderCAL = (teeth: number[], startingTab: number, suffix: string = '') => teeth.map((t, i) => (
        <td key={`ae${t}${suffix}`} className="borde">
            <input type="text" id={`ae${t}${suffix}-a`} name={`ae${t}${suffix}-a`} defaultValue={getCalVal(t, suffix, 'a')} tabIndex={startingTab + (i * 3)} disabled={readOnly} onChange={() => updateSummaries()} />
            <input type="text" id={`ae${t}${suffix}-b`} name={`ae${t}${suffix}-b`} defaultValue={getCalVal(t, suffix, 'b')} tabIndex={startingTab + (i * 3) + 1} disabled={readOnly} onChange={() => updateSummaries()} />
            <input type="text" id={`ae${t}${suffix}-c`} name={`ae${t}${suffix}-c`} defaultValue={getCalVal(t, suffix, 'c')} tabIndex={startingTab + (i * 3) + 2} disabled={readOnly} onChange={() => updateSummaries()} />
        </td>
    ));

    const renderVisuals = (teeth: number[], suffix: string = '') => teeth.map((t, index) => {
        const isPalatinMultiroot = suffix === 'b' && PALATIN_MULTIROOT_UPPER.includes(t);
        const isMultiroot = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38].includes(t);
        return (
            <td key={`v${t}${suffix}`} id={`v${t}${suffix}`} className="noborde status-tooth-container">
                <div id={`diente${t}${suffix}-a`} className="status-tooth-background">
                    {isMultiroot && !isPalatinMultiroot && <div id={`furca${t}${suffix}`} className="furca-marker"></div>}
                    {isPalatinMultiroot && <><div id={`furca${t}-a`} className="furca-marker palatin-a"></div><div id={`furca${t}-b`} className="furca-marker palatin-b"></div></>}
                </div>
                <div className={suffix === 'b' ? (t < 30 ? "status-grid-palatin" : "status-grid-inf") : (t < 31 ? "status-grid-sup" : "status-grid-sup")}></div>
                <div id={`visualization${t}${suffix === '' ? 'a' : 'b'}`} className="status-chart-overlay"></div>
            </td>
        );
    });

    const renderRowChartOverlay = (rowId: number) => (
        <tr key={`row-chart-tr-${rowId}`}>
            <td colSpan={9} style={{ padding: 0, position: 'relative', height: 0 }}>
                <div id={`row-chart-${rowId}`} style={{ position: 'absolute', top: '-160px', left: '0', width: '100%', height: '160px', pointerEvents: 'none', zIndex: 100 }} />
            </td>
        </tr>
    );

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).redrawAllCharts) {
            setTimeout(() => {
                (window as any).redrawAllCharts();
            }, 100);
        }
    }, [view]);

    const showSuperior = view === 'all' || view === 'superior';
    const showInferior = view === 'all' || view === 'inferior';

    return (
        <div className={`${readOnly ? "read-only-mode" : ""} periodontograma-component-inner`}>
            <div className={showSuperior ? '' : 'hidden'}>
                <table id="separador" className={view !== 'all' ? 'hidden' : ''}><tbody><tr><td>SUPERIOR</td></tr></tbody></table>
                <table id="tabla-superior" className="w-full">
                    <tbody>
                        <tr>
                            <td>
                                <table id="tabla-1">
                                    <tbody>
                                        <tr><td></td>{renderToothHeaders(topRx)}</tr>
                                        <tr><td className="titulo">Mobility</td>{renderMobility(topRx, 1)}</tr>
                                        <tr style={{ position: 'relative', zIndex: 10 }}><td className="titulo">Implant</td>{renderImplants(topRx)}</tr>
                                        <tr><td className="titulo">Furcation</td>{renderFurca(topRx)}</tr>
                                        <tr><td className="titulo">Bleeding</td>{renderBleeding(topRx)}</tr>
                                        <tr><td className="titulo">Plaque</td>{renderPlaque(topRx)}</tr>
                                        <tr><td className="titulo">GM</td>{renderGingivalMargin(topRx, 49)}</tr>
                                        <tr><td className="titulo">PD</td>{renderProbingDepth(topRx, 97)}</tr>
                                        <tr><td className="titulo">CAL</td>{renderCAL(topRx, 457)}</tr>
                                        <tr><td className="titulo">Buccal</td>{renderVisuals(topRx)}</tr>
                                        {renderRowChartOverlay(1)}
                                    </tbody>
                                </table>
                            </td>
                            <td>
                                <table id="tabla-2">
                                    <tbody>
                                        <tr><td></td>{renderToothHeaders(topLx)}</tr>
                                        <tr><td className="titulo"></td>{renderMobility(topLx, 9)}</tr>
                                        <tr><td className="titulo"></td>{renderImplants(topLx)}</tr>
                                        <tr><td className="titulo"></td>{renderFurca(topLx)}</tr>
                                        <tr><td className="titulo"></td>{renderBleeding(topLx)}</tr>
                                        <tr><td className="titulo"></td>{renderPlaque(topLx)}</tr>
                                        <tr><td className="titulo"></td>{renderGingivalMargin(topLx, 73)}</tr>
                                        <tr><td className="titulo"></td>{renderProbingDepth(topLx, 121)}</tr>
                                        <tr><td className="titulo"></td>{renderCAL(topLx, 481)}</tr>
                                        <tr><td className="titulo"></td>{renderVisuals(topLx)}</tr>
                                        {renderRowChartOverlay(2)}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <table id="tabla-3">
                                    <tbody>
                                        <tr><td className="titulo">Palatal</td>{renderVisuals(topRx, 'b')}</tr>
                                        {renderRowChartOverlay(3)}
                                        <tr><td className="titulo">GM</td>{renderGingivalMargin(topRx, 193, 'b')}</tr>
                                        <tr><td className="titulo">PD</td>{renderProbingDepth(topRx, 145, 'b')}</tr>
                                        <tr><td className="titulo">CAL</td>{renderCAL(topRx, 505, 'b')}</tr>
                                        <tr><td className="titulo">Plaque</td>{renderPlaque(topRx, 'b')}</tr>
                                        <tr><td className="titulo">Bleeding</td>{renderBleeding(topRx, 'b')}</tr>
                                        <tr><td className="titulo">Furca</td>{renderFurca(topRx, 'b')}</tr>
                                        <tr><td className="titulo">Note</td>{renderPrognosis(topRx, 241, 'b')}</tr>
                                    </tbody>
                                </table>
                            </td>
                            <td>
                                <table id="tabla-4">
                                    <tbody>
                                        <tr><td className="titulo"></td>{renderVisuals(topLx, 'b')}</tr>
                                        {renderRowChartOverlay(4)}
                                        <tr><td className="titulo"></td>{renderGingivalMargin(topLx, 217, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderProbingDepth(topLx, 169, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderCAL(topLx, 529, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderPlaque(topLx, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderBleeding(topLx, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderFurca(topLx, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderPrognosis(topLx, 249, 'b')}</tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {view === 'all' && !hideKpis && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', marginLeft: '250px' }}>
                    <div className="kpi-box">Avg PD: <span id="suma4">0</span>mm</div>
                    <div className="kpi-box">Avg CAL: <span id="suma5">0</span>mm</div>
                    <div className="kpi-box">Plaque: <span id="suma2">0</span>%</div>
                    <div className="kpi-box">Bleeding: <span id="suma">0</span>%</div>
                </div>
            )}

            <div className={showInferior ? '' : 'hidden'}>
                <table id="separador" className={view !== 'all' ? 'hidden' : ''}><tbody><tr><td>INFERIOR</td></tr></tbody></table>
                <table id="tabla-inferior" className="w-full">
                    <tbody>
                        <tr>
                            <td>
                                <table id="tabla-5">
                                    <tbody>
                                        <tr><td className="titulo">Note</td>{renderPrognosis(botLx, 257, '')}</tr>
                                        <tr><td className="titulo">Furca</td>{renderFurca(botLx)}</tr>
                                        <tr><td className="titulo">Bleeding</td>{renderBleeding(botLx)}</tr>
                                        <tr><td className="titulo">Plaque</td>{renderPlaque(botLx)}</tr>
                                        <tr><td className="titulo">GM</td>{renderGingivalMargin(botLx, 297)}</tr>
                                        <tr><td className="titulo">PD</td>{renderProbingDepth(botLx, 345)}</tr>
                                        <tr><td className="titulo">CAL</td>{renderCAL(botLx, 553)}</tr>
                                        <tr><td className="titulo">Lingual</td>{renderVisuals(botLx)}</tr>
                                        {renderRowChartOverlay(5)}
                                    </tbody>
                                </table>
                            </td>
                            <td>
                                <table id="tabla-6">
                                    <tbody>
                                        <tr><td className="titulo"></td>{renderPrognosis(botRx, 265, '')}</tr>
                                        <tr><td className="titulo"></td>{renderFurca(botRx)}</tr>
                                        <tr><td className="titulo"></td>{renderBleeding(botRx)}</tr>
                                        <tr><td className="titulo"></td>{renderPlaque(botRx)}</tr>
                                        <tr><td className="titulo"></td>{renderGingivalMargin(botRx, 321)}</tr>
                                        <tr><td className="titulo"></td>{renderProbingDepth(botRx, 409)}</tr>
                                        <tr><td className="titulo"></td>{renderCAL(botRx, 577)}</tr>
                                        <tr><td className="titulo"></td>{renderVisuals(botRx)}</tr>
                                        {renderRowChartOverlay(6)}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <table id="tabla-7">
                                    <tbody>
                                        <tr><td className="titulo">Buccal</td>{renderVisuals(botLx, 'b')}</tr>
                                        {renderRowChartOverlay(7)}
                                        <tr><td className="titulo">GM</td>{renderGingivalMargin(botLx, 309, 'b')}</tr>
                                        <tr><td className="titulo">PD</td>{renderProbingDepth(botLx, 369, 'b')}</tr>
                                        <tr><td className="titulo">CAL</td>{renderCAL(botLx, 601, 'b')}</tr>
                                        <tr><td className="titulo">Plaque</td>{renderPlaque(botLx, 'b')}</tr>
                                        <tr><td className="titulo">Bleeding</td>{renderBleeding(botLx, 'b')}</tr>
                                        <tr><td className="titulo">Furca</td>{renderFurca(botLx, 'b')}</tr>
                                        <tr><td className="titulo">Implant</td>{renderImplants(botLx, 'b')}</tr>
                                        <tr><td className="titulo">Mobility</td>{renderMobility(botLx, 17, 'b')}</tr>
                                        <tr><td></td>{renderToothHeaders(botLx)}</tr>
                                    </tbody>
                                </table>
                            </td>
                            <td>
                                <table id="tabla-8">
                                    <tbody>
                                        <tr><td className="titulo"></td>{renderVisuals(botRx, 'b')}</tr>
                                        {renderRowChartOverlay(8)}
                                        <tr><td className="titulo"></td>{renderGingivalMargin(botRx, 333, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderProbingDepth(botRx, 433, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderCAL(botRx, 625, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderPlaque(botRx, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderBleeding(botRx, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderFurca(botRx, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderImplants(botRx, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderMobility(botRx, 25, 'b')}</tr>
                                        <tr><td className="titulo"></td>{renderToothHeaders(botRx)}</tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            {view !== 'all' && <div className="hidden"><div id="suma4"></div><div id="suma5"></div><div id="suma2"></div><div id="suma"></div></div>}
        </div>
    );
}
