// @flow
// API Docs for d3-zoom:
// https://github.com/d3/d3-zoom
import * as d3 from 'd3';

export class SvgPanZoom {
  constructor(svgPath: string | SVGElement, targetSvgElementSelector?: string) {
    if (svgPath instanceof SVGElement) {
      this.svgPath = svgPath;
      this.targetSvgElementSelector = svgPath;
      return;
    }

    if (
      !(document.querySelector(targetSvgElementSelector) instanceof SVGElement)
    ) {
      throw new Error(
        `"${targetSvgElementSelector}" does not select an SVG element`
      );
    }
    this.svgPath = svgPath;
    this.targetSvgElementSelector = targetSvgElementSelector;
    this.element = document.querySelector(this.targetSvgElementSelector);
  }

  getSizes() {
    return {
      width: 100,
      height: 100,
      realZoom: 100,
      viewBox: 100
    };
  }

  init() {
    return new Promise((resolve, reject) => {
      const svg = d3.select(this.targetSvgElementSelector);
      const width = +svg.attr('width');
      const height = +svg.attr('height');
      this.selection = svg;

      if (this.svgPath instanceof SVGElement) {
        // A hacky element swapping solution. This should be redone
        const g = svg.append('g');
        const s = new XMLSerializer();
        const str = s.serializeToString(this.svgPath);
        const div = document.createElement('svg');
        div.innerHTML = str.trim();
        g.append(() => div.childNodes[0]);
        this.targetSvgElementSelector.children[0].remove();
        this.zoomer = d3.zoom();

        svg
          .append('rect')
          .attr('fill', 'none')
          .attr('pointer-events', 'all')
          .attr('width', width)
          .attr('height', height)
          .call(
            this.zoomer.scaleExtent([1, 8]).on('zoom', () => {
              this.transformData = d3.event.transform;
              console.log(this.transformData);
              g.attr('transform', d3.event.transform);
            })
          );
        return;
      }

      const g = svg.append('g');

      d3.xml(this.svgPath)
        .mimeType('image/svg+xml')
        .get((error, xml) => {
          console.log(xml);
          if (error) {
            console.log(error);
          } else {
            const svgElement = document.body.appendChild(xml.documentElement);
            g.append(() => svgElement);

            this.zoomer = d3.zoom();
            // setInterval(() => {
            //   console.log(this.zoomer.wheelDelta());
            // }, 2000);

            svg
              .append('rect')
              .attr('fill', 'none')
              .attr('pointer-events', 'all')
              .attr('width', width)
              .attr('height', height)
              .call(
                this.zoomer.scaleExtent([1, 8]).on('zoom', () => {
                  this.transformData = d3.event.transform;
                  g.attr('transform', d3.event.transform);
                })
              );
            resolve();
          }
        });
    });
  }

  zoom(scale: number) {
    this.zoomer.scaleTo(this.selection, scale);
  }

  getPan() {
    return this.transformData;
  }

  translate(x: number, y: number) {
    this.zoomer.translateTo(this.selection, x, y);
  }

  resize() {
    this.zoom(1);
  }

  destroy() {}

  animatePanAndZoom(x, y, zoomEnd) {
    const pan = this.zoomer.getPan();
    const panEnd = { x, y };
    animate(pan, panEnd, props => {
      this.zoomer.pan({ x: props.x, y: props.y });
      if (props === panEnd) {
        const zoom = this.zoomer.getZoom();
        animate({ zoom }, { zoom: zoomEnd }, props => {
          this.zoomer.zoom(props.zoom);
        });
      }
    });
  }
}

global.SvgPanZoom = SvgPanZoom;

// resize
// destroy
// zoom
// getPan
// getZoom
// getPan
// pan
// getZoom
// zoom
// destroy

export default function SvgZoom(
  svgPath: string,
  targetSvgElementSelector: string
) {
  if (
    !(document.querySelector(targetSvgElementSelector) instanceof SVGElement)
  ) {
    throw new Error(
      `"${targetSvgElementSelector}" does not select an SVG element`
    );
  }

  const svg = d3.select(targetSvgElementSelector);
  const width = +svg.attr('width');
  const height = +svg.attr('height');
  const g = svg.append('g');

  d3.xml(svgPath)
    .mimeType('image/svg+xml')
    .get((error, xml) => {
      if (error) {
        console.log(error);
      } else {
        const svgElement = document.body.appendChild(xml.documentElement);
        g.append(() => svgElement);

        svg
          .append('rect')
          .attr('fill', 'none')
          .attr('pointer-events', 'all')
          .attr('width', width)
          .attr('height', height)
          .call(
            d3
              .zoom()
              .scaleExtent([1, 8])
              .on('zoom', () => {
                g.attr('transform', d3.event.transform);
              })
          );
      }
    });
}
