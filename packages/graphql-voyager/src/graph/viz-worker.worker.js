import Viz from 'viz.js';

onmessage = function(event) {
  try {
    console.time('Rendering Graph');
    const svgString = Viz(event.data.dot, { totalMemory: 2 * 16777216 });
    console.timeEnd('Rendering Graph');
    postMessage({ result: 'success', svgString });
  } catch (e) {
    postMessage({ result: 'failed', msg: e.toString() });
  }
};
