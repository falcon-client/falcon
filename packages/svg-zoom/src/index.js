// @flow
// API Docs for d3-zoom:
// https://github.com/d3/d3-zoom
import * as d3 from 'd3';

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

  d3
    .xml(svgPath)
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

  setTimeout(() => {
    d3.zoom().scaleTo(svg, 3)
  }, 3000)
}

export class SvgPanZoom {
  constructor(svgPath: string, targetSvgElementSelector: string) {
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

    this.selection = svg;

    d3
      .xml(svgPath)
      .mimeType('image/svg+xml')
      .get((error, xml) => {
        if (error) {
          console.log(error);
        } else {
          const svgElement = document.body.appendChild(xml.documentElement);
          g.append(() => svgElement);

          this.zoomer = d3.zoom()

          svg
            .append('rect')
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            .attr('width', width)
            .attr('height', height)
            .call(
              this.zoomer
                .scaleExtent([1, 8])
                .on('zoom', () => {
                  g.attr('transform', d3.event.transform);
                })
            );
        }
      });

    setTimeout(() => {
      this.zoomer.scaleTo(svg, 3)
    }, 3000)
  }

  zoom(scale: number) {
    this.zoomer.scaleTo(this.selection, scale)
  }

  translate() {
    this.zoomer.translateTo(this.selection, 100, 200);
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
