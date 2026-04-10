// =============================================================
// CARGAR SHIMS — compatibility layer for legacy-inline.js
// Maps all old per-tooth cargar{tooth}{suffix}() and cargar1..4()
// functions to the new cargarRow(rowId) system in odonto.js.
// =============================================================

(function () {
    // Map each old function name to the correct rowId(s) to redraw
    // Row mapping:
    //   Row 1 = top buccal right:  teeth 18-11, suffix ''
    //   Row 2 = top buccal left:   teeth 21-28, suffix ''
    //   Row 3 = top palatin right: teeth 18-11, suffix 'b'
    //   Row 4 = top palatin left:  teeth 21-28, suffix 'b'
    //   Row 5 = bot lingual right: teeth 48-41, suffix ''
    //   Row 6 = bot lingual left:  teeth 31-38, suffix ''
    //   Row 7 = bot buccal right:  teeth 48-41, suffix 'b'
    //   Row 8 = bot buccal left:   teeth 31-38, suffix 'b'

    function safeCargarRow(rowId) {
        if (typeof cargarRow === 'function') {
            cargarRow(rowId);
        }
    }

    // Legacy cargar1..cargar4 (per-quadrant, old system)
    window.cargar1 = function () { safeCargarRow(1); safeCargarRow(3); };
    window.cargar2 = function () { safeCargarRow(2); safeCargarRow(4); };
    window.cargar3 = function () { safeCargarRow(5); safeCargarRow(7); };
    window.cargar4 = function () { safeCargarRow(6); safeCargarRow(8); };

    // Upper right (11-18), buccal — Row 1
    var upperRight = [11, 12, 13, 14, 15, 16, 17, 18];
    upperRight.forEach(function (t) {
        window['cargar' + t + 'a'] = function () { safeCargarRow(1); };
        window['cargar' + t + 'b'] = function () { safeCargarRow(3); };
    });

    // Upper left (21-28), buccal — Row 2
    var upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
    upperLeft.forEach(function (t) {
        window['cargar' + t + 'a'] = function () { safeCargarRow(2); };
        window['cargar' + t + 'b'] = function () { safeCargarRow(4); };
    });

    // Lower right lingual (41-48) — Row 5 (lingual), Row 7 (buccal)
    var lowerRight = [41, 42, 43, 44, 45, 46, 47, 48];
    lowerRight.forEach(function (t) {
        window['cargar' + t + 'a'] = function () { safeCargarRow(5); };
        window['cargar' + t + 'b'] = function () { safeCargarRow(7); };
    });

    // Lower left lingual (31-38) — Row 6 (lingual), Row 8 (buccal)
    var lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];
    lowerLeft.forEach(function (t) {
        window['cargar' + t + 'a'] = function () { safeCargarRow(6); };
        window['cargar' + t + 'b'] = function () { safeCargarRow(8); };
    });

    // Define empty legacy functions to prevent ReferenceErrors in console
    window.getPlaca = function () { };
    window.getSangrado = function () { };
    window.getDefectos = function () { };
    window.getMovilidad = function () { };
    window.rangoNumero = function () { };

})();
