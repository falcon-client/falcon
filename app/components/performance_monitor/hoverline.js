import React from 'react';
import { Line } from '@vx/shape';

type Props = {
  from: {
    x?: number,
    y?: number
  },
  to: {
    x?: number,
    y?: number
  },
  tooltipLeft?: number,
  tooltipTop?: number
};

export default ({
  from, to, tooltipLeft, tooltipTop
}: Props) => (
  <g>
    <Line
      from={from}
      to={to}
      stroke="white"
      strokeWidth={1}
      style={{ pointerEvents: 'none' }}
      strokeDasharray="2,2"
    />
    <circle
      cx={tooltipLeft}
      cy={tooltipTop}
      r={8}
      fill="#00f1a1"
      fillOpacity={0.2}
      style={{ pointerEvents: 'none' }}
    />
    <circle
      cx={tooltipLeft}
      cy={tooltipTop}
      r={4}
      fill="#00f1a1"
      fillOpacity={0.8}
      style={{ pointerEvents: 'none' }}
    />
  </g>
);
