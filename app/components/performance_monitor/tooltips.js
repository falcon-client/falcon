import React from 'react';
import { Tooltip } from '@vx/tooltip';

type Props = {
  yTop: number,
  yLeft: number,
  yLabel: string,
  xTop: number,
  xLeft: number,
  xLabel: string
};

export default ({
  yTop, yLeft, yLabel, xTop, xLeft, xLabel
}: Props) => (
  <div>
    <Tooltip
      top={xTop}
      left={xLeft}
      style={{
          transform: 'translateX(-50%)'
        }}
    >
      {xLabel}
    </Tooltip>
    <Tooltip
      top={yTop}
      left={yLeft}
      style={{
          backgroundColor: 'rgba(92, 119, 235, 1.000)',
          color: 'white'
        }}
    >
      {yLabel}
    </Tooltip>
  </div>
);
