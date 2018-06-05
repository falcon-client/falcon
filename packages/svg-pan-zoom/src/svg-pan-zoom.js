import Wheel from './uniwheel';
import ControlIcons from './control-icons';
import Utils from './utilities';
import SvgUtils from './svg-utilities';
import ShadowViewport from './shadow-viewport';

class SvgPanZoom {
  optionsDefaults = {
    viewportSelector: '.svg-pan-zoom_viewport', // Viewport selector. Can be querySelector string or SVGElement
    panEnabled: true, // enable or disable panning (default enabled)
    controlIconsEnabled: false, // insert icons to give user an option in addition to mouse events to control pan/zoom (default disabled)
    zoomEnabled: true, // enable or disable zooming (default enabled)
    dblClickZoomEnabled: true, // enable or disable zooming by double clicking (default enabled)
    mouseWheelZoomEnabled: true, // enable or disable zooming by mouse wheel (default enabled)
    preventMouseEventsDefault: true, // enable or disable preventDefault for mouse events
    zoomScaleSensitivity: 0.1, // Zoom sensitivity
    minZoom: 0.5, // Minimum Zoom level
    maxZoom: 10, // Maximum Zoom level
    fit: true, // enable or disable viewport fit in SVG (default true)
    contain: false, // enable or disable viewport contain the svg (default false)
    center: true, // enable or disable viewport centering in SVG (default true)
    refreshRate: 'auto', // Maximum number of frames per second (altering SVG's viewport)
    beforeZoom: null,
    onZoom: null,
    beforePan: null,
    onPan: null,
    customEventsHandler: null,
    eventsListenerElement: null,
    onUpdatedCTM: null
  };

  constructor(svg, options) {
    this.init(svg, options);
  }

  init(svg, options) {
    const that = this;

    this.svg = svg;
    this.defs = svg.querySelector('defs');

    // Add default attributes to SVG
    SvgUtils.setupSvgAttributes(this.svg);

    // Set options
    this.options = Utils.extend(
      Utils.extend({}, this.optionsDefaults),
      options
    );

    // Set default state
    this.state = 'none';

    // Get dimensions
    const boundingClientRectNormalized = SvgUtils.getBoundingClientRectNormalized(
      svg
    );
    this.width = boundingClientRectNormalized.width;
    this.height = boundingClientRectNormalized.height;

    // Init shadow viewport
    this.viewport = ShadowViewport(
      SvgUtils.getOrCreateViewport(this.svg, this.options.viewportSelector),
      {
        svg: this.svg,
        width: this.width,
        height: this.height,
        fit: this.options.fit,
        contain: this.options.contain,
        center: this.options.center,
        refreshRate: this.options.refreshRate,
        // Put callbacks into functions as they can change through time
        beforeZoom(oldScale, newScale) {
          if (that.viewport && that.options.beforeZoom) {
            return that.options.beforeZoom(oldScale, newScale);
          }
        },
        onZoom(scale) {
          if (that.viewport && that.options.onZoom) {
            return that.options.onZoom(scale);
          }
        },
        beforePan(oldPoint, newPoint) {
          if (that.viewport && that.options.beforePan) {
            return that.options.beforePan(oldPoint, newPoint);
          }
        },
        onPan(point) {
          if (that.viewport && that.options.onPan) {
            return that.options.onPan(point);
          }
        },
        onUpdatedCTM(ctm) {
          if (that.viewport && that.options.onUpdatedCTM) {
            return that.options.onUpdatedCTM(ctm);
          }
        }
      }
    );

    // Wrap callbacks into public API context
    const publicInstance = this.getPublicInstance();
    publicInstance.setBeforeZoom(this.options.beforeZoom);
    publicInstance.setOnZoom(this.options.onZoom);
    publicInstance.setBeforePan(this.options.beforePan);
    publicInstance.setOnPan(this.options.onPan);
    publicInstance.setOnUpdatedCTM(this.options.onUpdatedCTM);

    if (this.options.controlIconsEnabled) {
      ControlIcons.enable(this);
    }

    // Init events handlers
    this.lastMouseWheelEventTime = Date.now();
    this.setupHandlers();
  }

  /**
   * Register event handlers
   */
  setupHandlers() {
    const that = this; // use for touchstart event to detect double tap
    let prevEvt = null;

    this.eventListeners = {
      // Mouse down group
      mousedown(evt) {
        const result = that.handleMouseDown(evt, prevEvt);
        prevEvt = evt;
        return result;
      },
      touchstart(evt) {
        const result = that.handleMouseDown(evt, prevEvt);
        prevEvt = evt;
        return result;
      },

      // Mouse up group
      mouseup(evt) {
        return that.handleMouseUp(evt);
      },
      touchend(evt) {
        return that.handleMouseUp(evt);
      },

      // Mouse move group
      mousemove(evt) {
        return that.handleMouseMove(evt);
      },
      touchmove(evt) {
        return that.handleMouseMove(evt);
      },

      // Mouse leave group
      mouseleave(evt) {
        return that.handleMouseUp(evt);
      },
      touchleave(evt) {
        return that.handleMouseUp(evt);
      },
      touchcancel(evt) {
        return that.handleMouseUp(evt);
      }
    };

    // Init custom events handler if available
    if (this.options.customEventsHandler != null) {
      // jshint ignore:line
      this.options.customEventsHandler.init({
        svgElement: this.svg,
        eventsListenerElement: this.options.eventsListenerElement,
        instance: this.getPublicInstance()
      });

      // Custom event handler may halt builtin listeners
      const haltEventListeners = this.options.customEventsHandler
        .haltEventListeners;
      if (haltEventListeners && haltEventListeners.length) {
        for (let i = haltEventListeners.length - 1; i >= 0; i--) {
          if (this.eventListeners.hasOwnProperty(haltEventListeners[i])) {
            delete this.eventListeners[haltEventListeners[i]];
          }
        }
      }
    }

    // Bind eventListeners
    for (const event in this.eventListeners) {
      // Attach event to eventsListenerElement or SVG if not available
      (this.options.eventsListenerElement || this.svg).addEventListener(
        event,
        this.eventListeners[event],
        false
      );
    }

    // Zoom using mouse wheel
    if (this.options.mouseWheelZoomEnabled) {
      this.options.mouseWheelZoomEnabled = false; // set to false as enable will set it back to true
      this.enableMouseWheelZoom();
    }
  }

  /**
   * Enable ability to zoom using mouse wheel
   */
  enableMouseWheelZoom() {
    if (!this.options.mouseWheelZoomEnabled) {
      const that = this;

      // Mouse wheel listener
      this.wheelListener = evt => that.handleMouseWheel(evt);

      // Bind wheelListener
      Wheel.on(
        this.options.eventsListenerElement || this.svg,
        this.wheelListener,
        false
      );

      this.options.mouseWheelZoomEnabled = true;
    }
  }

  /**
   * Disable ability to zoom using mouse wheel
   */
  disableMouseWheelZoom() {
    if (this.options.mouseWheelZoomEnabled) {
      Wheel.off(
        this.options.eventsListenerElement || this.svg,
        this.wheelListener,
        false
      );
      this.options.mouseWheelZoomEnabled = false;
    }
  }

  /**
   * Handle mouse wheel event
   *
   * @param  {Event} evt
   */
  handleMouseWheel(evt) {
    if (!this.options.zoomEnabled || this.state !== 'none') {
      return;
    }

    if (this.options.preventMouseEventsDefault) {
      if (evt.preventDefault) {
        evt.preventDefault();
      } else {
        evt.returnValue = false;
      }
    }

    // Default delta in case that deltaY is not available
    let delta = evt.deltaY || 1;

    const timeDelta = Date.now() - this.lastMouseWheelEventTime;
    const divider = 3 + Math.max(0, 30 - timeDelta);

    // Update cache
    this.lastMouseWheelEventTime = Date.now();

    // Make empirical adjustments for browsers that give deltaY in pixels (deltaMode=0)
    if ('deltaMode' in evt && evt.deltaMode === 0 && evt.wheelDelta) {
      delta = evt.deltaY === 0 ? 0 : Math.abs(evt.wheelDelta) / evt.deltaY;
    }

    delta =
      delta > -0.3 && delta < 0.3
        ? delta
        : ((delta > 0 ? 1 : -1) * Math.log(Math.abs(delta) + 10)) / divider;

    const inversedScreenCTM = this.svg.getScreenCTM().inverse(); // multiplying by neg. 1 so as to make zoom in/out behavior match Google maps behavior

    const relativeMousePoint = SvgUtils.getEventPoint(
      evt,
      this.svg
    ).matrixTransform(inversedScreenCTM);

    const zoom = (1 + this.options.zoomScaleSensitivity) ** (-1 * delta);

    this.zoomAtPoint(zoom, relativeMousePoint);
  }

  /**
   * Zoom in at a SVG point
   *
   * @param  {SVGPoint} point
   * @param  {Float} zoomScale    Number representing how much to zoom
   * @param  {Boolean} zoomAbsolute Default false. If true, zoomScale is treated as an absolute value.
   *                                Otherwise, zoomScale is treated as a multiplied (e.g. 1.10 would zoom in 10%)
   */
  zoomAtPoint(zoomScale, point, zoomAbsolute) {
    const originalState = this.viewport.getOriginalState();

    if (!zoomAbsolute) {
      // Fit zoomScale in set bounds
      if (
        this.getZoom() * zoomScale <
        this.options.minZoom * originalState.zoom
      ) {
        zoomScale =
          (this.options.minZoom * originalState.zoom) / this.getZoom();
      } else if (
        this.getZoom() * zoomScale >
        this.options.maxZoom * originalState.zoom
      ) {
        zoomScale =
          (this.options.maxZoom * originalState.zoom) / this.getZoom();
      }
    } else {
      // Fit zoomScale in set bounds
      zoomScale = Math.max(
        this.options.minZoom * originalState.zoom,
        Math.min(this.options.maxZoom * originalState.zoom, zoomScale)
      );
      // Find relative scale to achieve desired scale
      zoomScale /= this.getZoom();
    }

    const oldCTM = this.viewport.getCTM();
    const relativePoint = point.matrixTransform(oldCTM.inverse());

    const modifier = this.svg
      .createSVGMatrix()
      .translate(relativePoint.x, relativePoint.y)
      .scale(zoomScale)
      .translate(-relativePoint.x, -relativePoint.y);

    const newCTM = oldCTM.multiply(modifier);

    if (newCTM.a !== oldCTM.a) {
      this.viewport.setCTM(newCTM);
    }
  }

  /**
   * Zoom at center point
   *
   * @param  {Float} scale
   * @param  {Boolean} absolute Marks zoom scale as relative or absolute
   */
  zoom(scale, absolute) {
    this.zoomAtPoint(
      scale,
      SvgUtils.getSvgCenterPoint(this.svg, this.width, this.height),
      absolute
    );
  }

  /**
   * Zoom used by public instance
   *
   * @param  {Float} scale
   * @param  {Boolean} absolute Marks zoom scale as relative or absolute
   */
  publicZoom(scale, absolute) {
    if (absolute) {
      scale = this.computeFromRelativeZoom(scale);
    }

    this.zoom(scale, absolute);
  }

  /**
   * Zoom at point used by public instance
   *
   * @param  {Float} scale
   * @param  {SVGPoint|Object} point    An object that has x and y attributes
   * @param  {Boolean} absolute Marks zoom scale as relative or absolute
   */
  publicZoomAtPoint(scale, point, absolute) {
    if (absolute) {
      // Transform zoom into a relative value
      scale = this.computeFromRelativeZoom(scale);
    }

    // If not a SVGPoint but has x and y then create a SVGPoint
    if (Utils.getType(point) !== 'SVGPoint') {
      if ('x' in point && 'y' in point) {
        point = SvgUtils.createSVGPoint(this.svg, point.x, point.y);
      } else {
        throw new Error('Given point is invalid');
      }
    }

    this.zoomAtPoint(scale, point, absolute);
  }

  /**
   * Get zoom scale
   *
   * @return {Float} zoom scale
   */
  getZoom() {
    return this.viewport.getZoom();
  }

  /**
   * Get zoom scale for public usage
   *
   * @return {Float} zoom scale
   */
  getRelativeZoom() {
    return this.viewport.getRelativeZoom();
  }

  /**
   * Compute actual zoom from public zoom
   *
   * @param  {Float} zoom
   * @return {Float} zoom scale
   */
  computeFromRelativeZoom(zoom) {
    return zoom * this.viewport.getOriginalState().zoom;
  }

  /**
   * Set zoom to initial state
   */
  resetZoom() {
    const originalState = this.viewport.getOriginalState();

    this.zoom(originalState.zoom, true);
  }

  /**
   * Set pan to initial state
   */
  resetPan() {
    this.pan(this.viewport.getOriginalState());
  }

  /**
   * Set pan and zoom to initial state
   */
  reset() {
    this.resetZoom();
    this.resetPan();
  }

  /**
   * Handle double click event
   * See handleMouseDown() for alternate detection method
   *
   * @param {Event} evt
   */
  handleDblClick(evt) {
    if (this.options.preventMouseEventsDefault) {
      if (evt.preventDefault) {
        evt.preventDefault();
      } else {
        evt.returnValue = false;
      }
    }

    // Check if target was a control button
    if (this.options.controlIconsEnabled) {
      const targetClass = evt.target.getAttribute('class') || '';
      if (targetClass.includes('svg-pan-zoom-control')) {
        return false;
      }
    }

    let zoomFactor;

    if (evt.shiftKey) {
      zoomFactor = 1 / ((1 + this.options.zoomScaleSensitivity) * 2); // zoom out when shift key pressed
    } else {
      zoomFactor = (1 + this.options.zoomScaleSensitivity) * 2;
    }

    const point = SvgUtils.getEventPoint(evt, this.svg).matrixTransform(
      this.svg.getScreenCTM().inverse()
    );
    this.zoomAtPoint(zoomFactor, point);
  }

  /**
   * Handle click event
   *
   * @param {Event} evt
   */
  handleMouseDown(evt, prevEvt) {
    if (this.options.preventMouseEventsDefault) {
      if (evt.preventDefault) {
        evt.preventDefault();
      } else {
        evt.returnValue = false;
      }
    }

    Utils.mouseAndTouchNormalize(evt, this.svg);

    // Double click detection; more consistent than ondblclick
    if (this.options.dblClickZoomEnabled && Utils.isDblClick(evt, prevEvt)) {
      this.handleDblClick(evt);
    } else {
      // Pan mode
      this.state = 'pan';
      this.firstEventCTM = this.viewport.getCTM();
      this.stateOrigin = SvgUtils.getEventPoint(evt, this.svg).matrixTransform(
        this.firstEventCTM.inverse()
      );
    }
  }

  /**
   * Handle mouse move event
   *
   * @param  {Event} evt
   */
  handleMouseMove(evt) {
    if (this.options.preventMouseEventsDefault) {
      if (evt.preventDefault) {
        evt.preventDefault();
      } else {
        evt.returnValue = false;
      }
    }

    if (this.state === 'pan' && this.options.panEnabled) {
      // Pan mode
      const point = SvgUtils.getEventPoint(evt, this.svg).matrixTransform(
        this.firstEventCTM.inverse()
      );

      const viewportCTM = this.firstEventCTM.translate(
        point.x - this.stateOrigin.x,
        point.y - this.stateOrigin.y
      );

      this.viewport.setCTM(viewportCTM);
    }
  }

  /**
   * Handle mouse button release event
   *
   * @param {Event} evt
   */
  handleMouseUp(evt) {
    if (this.options.preventMouseEventsDefault) {
      if (evt.preventDefault) {
        evt.preventDefault();
      } else {
        evt.returnValue = false;
      }
    }

    if (this.state === 'pan') {
      // Quit pan mode
      this.state = 'none';
    }
  }

  /**
   * Adjust viewport size (only) so it will fit in SVG
   * Does not center image
   */
  fit() {
    const viewBox = this.viewport.getViewBox();

    const newScale = Math.min(
      this.width / viewBox.width,
      this.height / viewBox.height
    );

    this.zoom(newScale, true);
  }

  /**
   * Adjust viewport size (only) so it will contain the SVG
   * Does not center image
   */
  contain() {
    const viewBox = this.viewport.getViewBox();

    const newScale = Math.max(
      this.width / viewBox.width,
      this.height / viewBox.height
    );

    this.zoom(newScale, true);
  }

  /**
   * Adjust viewport pan (only) so it will be centered in SVG
   * Does not zoom/fit/contain image
   */
  center() {
    const viewBox = this.viewport.getViewBox();

    const offsetX =
      (this.width - (viewBox.width + viewBox.x * 2) * this.getZoom()) * 0.5;

    const offsetY =
      (this.height - (viewBox.height + viewBox.y * 2) * this.getZoom()) * 0.5;

    this.getPublicInstance().pan({ x: offsetX, y: offsetY });
  }

  /**
   * Update content cached BorderBox
   * Use when viewport contents change
   */
  updateBBox() {
    this.viewport.simpleViewBoxCache();
  }

  /**
   * Pan to a rendered position
   *
   * @param  {Object} point {x: 0, y: 0}
   */
  pan({ x, y }) {
    const viewportCTM = this.viewport.getCTM();
    viewportCTM.e = x;
    viewportCTM.f = y;
    this.viewport.setCTM(viewportCTM);
  }

  /**
   * Relatively pan the graph by a specified rendered position vector
   *
   * @param  {Object} point {x: 0, y: 0}
   */
  panBy({ x, y }) {
    const viewportCTM = this.viewport.getCTM();
    viewportCTM.e += x;
    viewportCTM.f += y;
    this.viewport.setCTM(viewportCTM);
  }

  /**
   * Get pan vector
   *
   * @return {Object} {x: 0, y: 0}
   */
  getPan() {
    const state = this.viewport.getState();

    return { x: state.x, y: state.y };
  }

  /**
   * Recalculates cached svg dimensions and controls position
   */
  resize() {
    // Get dimensions
    const boundingClientRectNormalized = SvgUtils.getBoundingClientRectNormalized(
      this.svg
    );
    this.width = boundingClientRectNormalized.width;
    this.height = boundingClientRectNormalized.height;

    // Recalculate original state
    const viewport = this.viewport;
    viewport.options.width = this.width;
    viewport.options.height = this.height;
    viewport.processCTM();

    // Reposition control icons by re-enabling them
    if (this.options.controlIconsEnabled) {
      this.getPublicInstance().disableControlIcons();
      this.getPublicInstance().enableControlIcons();
    }
  }

  /**
   * Unbind mouse events, free callbacks and destroy public instance
   */
  destroy() {
    const that = this;

    // Free callbacks
    this.beforeZoom = null;
    this.onZoom = null;
    this.beforePan = null;
    this.onPan = null;
    this.onUpdatedCTM = null;

    // Destroy custom event handlers
    if (this.options.customEventsHandler != null) {
      // jshint ignore:line
      this.options.customEventsHandler.destroy({
        svgElement: this.svg,
        eventsListenerElement: this.options.eventsListenerElement,
        instance: this.getPublicInstance()
      });
    }

    // Unbind eventListeners
    for (const event in this.eventListeners) {
      (this.options.eventsListenerElement || this.svg).removeEventListener(
        event,
        this.eventListeners[event],
        false
      );
    }

    // Unbind wheelListener
    this.disableMouseWheelZoom();

    // Remove control icons
    this.getPublicInstance().disableControlIcons();

    // Reset zoom and pan
    this.reset();

    // Remove instance from instancesStore
    instancesStore = instancesStore.filter(({ svg }) => svg !== that.svg);

    // Delete options and its contents
    delete this.options;

    // Delete viewport to make public shadow viewport functions uncallable
    delete this.viewport;

    // Destroy public instance and rewrite getPublicInstance
    delete this.publicInstance;
    delete this.pi;
    this.getPublicInstance = () => null;
  }

  /**
   * Returns a public instance object
   *
   * @return {Object} Public instance object
   */
  getPublicInstance() {
    const that = this;

    // Create cache
    if (!this.publicInstance) {
      this.publicInstance = this.pi = {
        // Pan
        enablePan() {
          that.options.panEnabled = true;
          return that.pi;
        },
        disablePan() {
          that.options.panEnabled = false;
          return that.pi;
        },
        isPanEnabled() {
          return !!that.options.panEnabled;
        },
        pan(point) {
          that.pan(point);
          return that.pi;
        },
        panBy(point) {
          that.panBy(point);
          return that.pi;
        },
        getPan() {
          return that.getPan();
        },
        // Pan event
        setBeforePan(fn) {
          that.options.beforePan =
            fn === null ? null : Utils.proxy(fn, that.publicInstance);
          return that.pi;
        },
        setOnPan(fn) {
          that.options.onPan =
            fn === null ? null : Utils.proxy(fn, that.publicInstance);
          return that.pi;
        },
        // Zoom and Control Icons
        enableZoom() {
          that.options.zoomEnabled = true;
          return that.pi;
        },
        disableZoom() {
          that.options.zoomEnabled = false;
          return that.pi;
        },
        isZoomEnabled() {
          return !!that.options.zoomEnabled;
        },
        enableControlIcons() {
          if (!that.options.controlIconsEnabled) {
            that.options.controlIconsEnabled = true;
            ControlIcons.enable(that);
          }
          return that.pi;
        },
        disableControlIcons() {
          if (that.options.controlIconsEnabled) {
            that.options.controlIconsEnabled = false;
            ControlIcons.disable(that);
          }
          return that.pi;
        },
        isControlIconsEnabled() {
          return !!that.options.controlIconsEnabled;
        },
        // Double click zoom
        enableDblClickZoom() {
          that.options.dblClickZoomEnabled = true;
          return that.pi;
        },
        disableDblClickZoom() {
          that.options.dblClickZoomEnabled = false;
          return that.pi;
        },
        isDblClickZoomEnabled() {
          return !!that.options.dblClickZoomEnabled;
        },
        // Mouse wheel zoom
        enableMouseWheelZoom() {
          that.enableMouseWheelZoom();
          return that.pi;
        },
        disableMouseWheelZoom() {
          that.disableMouseWheelZoom();
          return that.pi;
        },
        isMouseWheelZoomEnabled() {
          return !!that.options.mouseWheelZoomEnabled;
        },
        // Zoom scale and bounds
        setZoomScaleSensitivity(scale) {
          that.options.zoomScaleSensitivity = scale;
          return that.pi;
        },
        setMinZoom(zoom) {
          that.options.minZoom = zoom;
          return that.pi;
        },
        setMaxZoom(zoom) {
          that.options.maxZoom = zoom;
          return that.pi;
        },
        // Zoom event
        setBeforeZoom(fn) {
          that.options.beforeZoom =
            fn === null ? null : Utils.proxy(fn, that.publicInstance);
          return that.pi;
        },
        setOnZoom(fn) {
          that.options.onZoom =
            fn === null ? null : Utils.proxy(fn, that.publicInstance);
          return that.pi;
        },
        // Zooming
        zoom(scale) {
          that.publicZoom(scale, true);
          return that.pi;
        },
        zoomBy(scale) {
          that.publicZoom(scale, false);
          return that.pi;
        },
        zoomAtPoint(scale, point) {
          that.publicZoomAtPoint(scale, point, true);
          return that.pi;
        },
        zoomAtPointBy(scale, point) {
          that.publicZoomAtPoint(scale, point, false);
          return that.pi;
        },
        zoomIn() {
          this.zoomBy(1 + that.options.zoomScaleSensitivity);
          return that.pi;
        },
        zoomOut() {
          this.zoomBy(1 / (1 + that.options.zoomScaleSensitivity));
          return that.pi;
        },
        getZoom() {
          return that.getRelativeZoom();
        },
        // CTM update
        setOnUpdatedCTM(fn) {
          that.options.onUpdatedCTM =
            fn === null ? null : Utils.proxy(fn, that.publicInstance);
          return that.pi;
        },
        // Reset
        resetZoom() {
          that.resetZoom();
          return that.pi;
        },
        resetPan() {
          that.resetPan();
          return that.pi;
        },
        reset() {
          that.reset();
          return that.pi;
        },
        // Fit, Contain and Center
        fit() {
          that.fit();
          return that.pi;
        },
        contain() {
          that.contain();
          return that.pi;
        },
        center() {
          that.center();
          return that.pi;
        },
        // Size and Resize
        updateBBox() {
          that.updateBBox();
          return that.pi;
        },
        resize() {
          that.resize();
          return that.pi;
        },
        getSizes() {
          return {
            width: that.width,
            height: that.height,
            realZoom: that.getZoom(),
            viewBox: that.viewport.getViewBox()
          };
        },
        // Destroy
        destroy() {
          that.destroy();
          return that.pi;
        }
      };
    }

    return this.publicInstance;
  }
}

/**
 * Stores pairs of instances of SvgPanZoom and SVG
 * Each pair is represented by an object {svg: SVGSVGElement, instance: SvgPanZoom}
 *
 * @type {Array}
 */
var instancesStore = [];

const svgPanZoom = (elementOrSelector, options) => {
  const svg = Utils.getSvg(elementOrSelector);

  if (svg === null) {
    return null;
  }
  // Look for existent instance
  for (let i = instancesStore.length - 1; i >= 0; i--) {
    if (instancesStore[i].svg === svg) {
      return instancesStore[i].instance.getPublicInstance();
    }
  }

  // If instance not found - create one
  instancesStore.push({
    svg,
    instance: new SvgPanZoom(svg, options)
  });

  // Return just pushed instance
  return instancesStore[instancesStore.length - 1].instance.getPublicInstance();
};

export default svgPanZoom;
