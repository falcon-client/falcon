// @flow
import React from 'react';

type Props = {
  type?: 'connection' | 'database' | 'table' | 'query'
};

export default function ListSymbol(props: Props = { type: 'connection' }) {
  return (
    <div className="ListSymbol">
      {
        (() => {
          switch (props.type) {
            case 'connection': return 'C';
            case 'database': return 'D';
            case 'table': return 'T';
            case 'query': return 'Q';
            default: return 'C';
          }
        })()
      }
    </div>
  );
}
