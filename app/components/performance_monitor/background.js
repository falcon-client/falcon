import React from 'react';
import { LinearGradient } from '@vx/gradient';

type Props = {
  width: number,
  height: number
};

export default function Background({ width, height }: Props) {
  return (
    <svg width={width} height={height}>
      <LinearGradient id="bg" vertical={false}>
        <stop stopColor="#a943e4" offset="0%" />
        <stop stopColor="#f55989" offset="50%" />
        <stop stopColor="#ffaf84" offset="100%" />
      </LinearGradient>
      <rect width={width} height={height} fill="url(#bg)" />
    </svg>
  );
}
