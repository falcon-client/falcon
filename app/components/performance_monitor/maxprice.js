import React from 'react';
import { LinePath } from '@vx/shape';

type Props = {
  data: {},
  label: string,
  yText: number,
  yScale: any,
  xScale: any,
  x: any,
  y: any
};

export default ({
  data, label, yText, yScale, xScale, x, y
}: Props) => (
  <g>
    <LinePath
      data={data}
      yScale={yScale}
      xScale={xScale}
      y={y}
      x={x}
      stroke="#6086d6"
      strokeWidth={1}
      strokeDasharray="4,4"
      strokeOpacity=".3"
    />
    <text fill="#6086d6" y={yText} dy="1.3em" dx="10px" fontSize="12">
      {label}
    </text>
  </g>
);
