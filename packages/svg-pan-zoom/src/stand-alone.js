const svgPanZoom = require('./svg-pan-zoom.js');

// UMD module definition
(function(window, document) {
  // AMD
  if (typeof define === 'function' && define.amd) {
    define('svg-pan-zoom', () => svgPanZoom);
    // CMD
  } else if (typeof module !== 'undefined' && module.exports) {
    export default svgPanZoom;

    // Browser
    // Keep exporting globally as module.exports is available because of browserify
    window.svgPanZoom = svgPanZoom;
  }
})(window, document);
