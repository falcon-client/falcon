// @flow
import React from 'react';

export type SpecialType = 'null' | undefined;

type Props = {
  type: string | number | boolean | null
};

// @TODO: Placeholders for all types except for null
const genericTypeMappings: { [type: string]: SpecialType } = {
  null: 'null',
};

// @TODO: Placeholders for all types except for null
const colorMappings = {
  null: '#FFF8B2'
};

/**
 * Used to render a cell in react-table for special types (e.g. NULL)
 */
export default function StructurePageCell(props: Props) {
  const type = props.type;
  switch (type) {
    case null:
      return (
        <div
          style={{ backgroundColor: '#FFF8B2' }}
        >
          {props.children}
        </div>
      );
    default:
      return (
        <div>
          {props.children}
        </div>
      );
  }
}

// these are the only things that are colored
// null, boolean, enum,
