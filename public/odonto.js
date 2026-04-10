// ----------------------------------------------
// GLOBAL VARIABLES
// ----------------------------------------------
var totalSangrado = 0;
var totalPlaca = 0;
var totalAnchura = 0;
var totalDientes = 32;
var tdHeight = 160;         // Standard chart height matching CSS
var pixelsPerMM = 3.5;      // 1mm = 3.5px

// Ensure Google Charts is loading
if (typeof google !== 'undefined' && google.charts && !google.visualization) {
    if (google.charts.load) {
        google.charts.load('current', { 'packages': ['corechart'] });
    }
}

// ----------------------------------------------
// ROW CONFIGS
// ----------------------------------------------
var ROW_CONFIGS = {
	1: { teeth: [18, 17, 16, 15, 14, 13, 12, 11], suffix: '', isBuccal: true },
	2: { teeth: [21, 22, 23, 24, 25, 26, 27, 28], suffix: '', isBuccal: true },
	3: { teeth: [18, 17, 16, 15, 14, 13, 12, 11], suffix: 'b', isBuccal: false },
	4: { teeth: [21, 22, 23, 24, 25, 26, 27, 28], suffix: 'b', isBuccal: false },
	5: { teeth: [48, 47, 46, 45, 44, 43, 42, 41], suffix: '', isBuccal: false }, // Lingual
	6: { teeth: [31, 32, 33, 34, 35, 36, 37, 38], suffix: '', isBuccal: false }, // Lingual
	7: { teeth: [48, 47, 46, 45, 44, 43, 42, 41], suffix: 'b', isBuccal: true },  // Buccal Bas
	8: { teeth: [31, 32, 33, 34, 35, 36, 37, 38], suffix: 'b', isBuccal: true }   // Buccal Bas
};

// ----------------------------------------------
// CEJ Pixel (Red Line) based on row
// ----------------------------------------------
function getCEJPixel(rowId) {
	if ([3, 4].includes(rowId)) {
		// PALATAL ONLY: Adjust this to move it UP (smaller num)
		return 66;
	} else if ([7, 8].includes(rowId)) {
		// Mandibular (Lower Buccal)
		return 66;
	} else {
		// Everything else (Upper Buccal, Lingual)
		return 102;
	}
}

// ----------------------------------------------
// DRAW GRID LINES (1mm precision)
// ----------------------------------------------
function drawGridLines(rowId, containerId) {
	const container = document.getElementById(containerId);
	if (!container) return;

	// Only draw if empty or forced
	if (container.querySelector('.grid-line')) return;

	const cejPixel = getCEJPixel(rowId);

	// Measurement lines are now handled by CSS background images (status-grid-*)
	// as per user request to avoid JS-drawn lines overlapping.

	// Draw red CEJ line removed as per user request
}

// ----------------------------------------------
// LOAD ROW CHART
// ----------------------------------------------
function cargarRow(rowId) {
	const config = ROW_CONFIGS[rowId];
	if (!config) return;

	const chartId = 'row-chart-' + rowId;
	const chartEl = document.getElementById(chartId);
	if (!chartEl) {
		setTimeout(() => cargarRow(rowId), 200);
		return;
	}

	// Draw Grid if not present
	drawGridLines(rowId, chartId);

	const cejPixel = getCEJPixel(rowId);
	const points = [];
	const chartWidth = chartEl.offsetWidth || 1100; // Fallback to avoid division by zero or invisible charts

	config.teeth.forEach(t => {
		const toothTd = document.getElementById(`v${t}${config.suffix}`);
		if (!toothTd) {
			console.warn(`Element v${t}${config.suffix} not found for row ${rowId}`);
			return;
		}
		const rect = toothTd.getBoundingClientRect();
		const chartRect = chartEl.getBoundingClientRect();
		const offsetX = rect.left - chartRect.left;
		const toothWidth = rect.width;
		const siteWidth = toothWidth / 3;

		['a', 'b', 'c'].forEach((site, siteIdx) => {
			const mgId = `mg${t}${config.suffix}-${site}`;
			const psId = `ps${t}${config.suffix}-${site}`;
			const mgEl = document.getElementById(mgId);
			const psEl = document.getElementById(psId);

			const mgVal = mgEl ? parseFloat(mgEl.value) : 0;
			const psVal = psEl ? parseFloat(psEl.value) : 0;
            
            const gm = isNaN(mgVal) ? 0 : mgVal;
            const pdInput = isNaN(psVal) ? 0 : psVal;

			if (psEl) psEl.style.color = pdInput > 3 ? 'red' : 'black';

			let pd;

			// Règles de calcul cliniques :
            // Rows 1, 2, 5, 6 have visualDirection = -1 (Positive DOWN)
            // Rows 3, 4, 7, 8 have visualDirection = 1 (Positive UP)
			if ([1, 2, 5, 6].includes(rowId)) {
				// Roots point UP. Movement UP is negative in "Pos DOWN" system.
				pd = gm - pdInput;
			} else if ([3, 4].includes(rowId)) {
                // Roots point UP. Movement UP is positive in "Pos UP" system.
                pd = gm + pdInput;
            } else {
				// Rows 7, 8: Roots point DOWN. Movement DOWN is negative in "Pos UP" system.
				pd = gm - pdInput;
			}

			const xPixel = offsetX + siteIdx * siteWidth + siteWidth / 2;
			points.push([xPixel, pd, gm]);
		});
	});

	if (points.length === 0) return;

    if (typeof google === 'undefined' || !google.visualization || !google.visualization.DataTable) {
         console.warn("Google visualization DataTable not ready");
         return;
    }

	const dataTable = new google.visualization.DataTable();
	dataTable.addColumn('number', 'X');
	dataTable.addColumn('number', 'PD'); // Column 1: Blue area
	dataTable.addColumn('number', 'GM'); // Column 2: Red line (on top)
	dataTable.addRows(points);

	drawRowChart(rowId, dataTable, config.isBuccal, chartWidth);
}

// ----------------------------------------------
// DRAW ROW CHART (Google Charts)
// ----------------------------------------------
function drawRowChart(rowId, data, isBuccal, chartWidth) {
	const chartId = 'row-chart-' + rowId;
	const el = document.getElementById(chartId);
	if (!el) return;

    if (!google.visualization || !google.visualization.AreaChart) {
        console.warn("Google Charts AreaChart package not loaded yet");
        return;
    }

	// Dynamic alignment calculation based on cejPixel
	const cej = getCEJPixel(rowId);

	// Rows (1,2,5,6) : direction -1 (Positive = DOWN)
	// Rows (3,4,7,8) : direction 1 (Positive = UP)
	const visualDirection = [1, 2, 5, 6].includes(rowId) ? -1 : 1;

	let vMax, vMin;
	if (visualDirection === -1) {
		// Roots point UP (Standard rule: Pos moves away from top)
		vMax = (160 - cej) / 3.5;
		vMin = -cej / 3.5;
	} else {
		// Roots point DOWN (Inverse rule: Pos moves away from bottom)
		vMax = cej / 3.5;
		vMin = -(160 - cej) / 3.5;
	}

	const chart = new google.visualization.AreaChart(el);
	chart.draw(data, {
		isStacked: false,
		curveType: 'function',
		colors: ['#3b82f6', '#ff0000'], // Blue for Pocket (PD), Red for Margin (GM)
		lineWidth: 2,
		areaOpacity: 0.3,
		backgroundColor: 'transparent',
		legend: { position: 'none' },
		tooltip: { trigger: 'none' },
		axisTitlesPosition: 'none',
		chartArea: { left: 0, top: 0, width: '100%', height: '100%' },
		hAxis: {
			viewWindow: { min: 0, max: chartWidth },
			gridlines: { color: 'transparent' },
			minorGridlines: { color: 'transparent' },
			baselineColor: 'transparent'
		},
		vAxis: {
			viewWindowMode: 'explicit',
			viewWindow: { max: vMax, min: vMin },
			baseline: 0,
			gridlines: { color: 'transparent' },
			minorGridlines: { color: 'transparent' },
			baselineColor: 'transparent',
			direction: visualDirection
		},
		series: {
			0: { areaOpacity: 0.4 }, // Blue area (Background)
			1: { areaOpacity: 0.2 }  // Red area (Foreground line)
		}
	});
}

function redrawAllCharts() {
    [1, 2, 3, 4, 5, 6, 7, 8].forEach(function (rowId) {
        cargarRow(rowId);
    });
}
window.redrawAllCharts = redrawAllCharts;

// ----------------------------------------------
// EVENTS (GM/PD change triggers chart redraw)
// ----------------------------------------------
$(document).ready(function () {
	// Auto-draw all charts once Google Charts API is ready
	// Uses a polling loop in case google.charts isn't loaded yet
	function initCharts() {
		if (typeof google !== 'undefined' && google.charts && google.visualization && google.visualization.AreaChart) {
			// Google Charts already loaded — draw all rows
			setTimeout(redrawAllCharts, 100);
		} else if (typeof google !== 'undefined' && google.charts) {
			// Google Charts loaded but visualization package not ready yet
            if (google.charts.load) {
                google.charts.load('current', { 'packages': ['corechart'] });
            }
			google.charts.setOnLoadCallback(function () {
				setTimeout(redrawAllCharts, 500);
			});
		} else {
			// Google not loaded at all yet — retry
			setTimeout(initCharts, 300);
		}
	}

	// Start init after a short delay to let React render the DOM
	setTimeout(initCharts, 500);

	// Re-draw chart on input change or as you type
	$(document).on('change input', 'input[id^="mg"],input[id^="ps"]', function () {
		const id = $(this).attr('id');
		const toothMatch = id.match(/\d+/);
		if (!toothMatch) return;
		const tooth = parseInt(toothMatch[0]);
		const hasSuffixB = id.includes('b-');

		if (tooth >= 11 && tooth <= 18) { if (!hasSuffixB) cargarRow(1); else cargarRow(3); }
		else if (tooth >= 21 && tooth <= 28) { if (!hasSuffixB) cargarRow(2); else cargarRow(4); }
		else if (tooth >= 31 && tooth <= 38) { if (hasSuffixB) cargarRow(8); else cargarRow(6); }
		else if (tooth >= 41 && tooth <= 48) { if (hasSuffixB) cargarRow(7); else cargarRow(5); }
	});
});