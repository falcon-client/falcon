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


/**
 * Used to render a cell in react-table for special types (e.g. NULL)
 */
export default function StructurePageCell(props: Props) {
  const type = props.type;
  switch (type) {
    case null:
      return (
        <div>
          <input className="Structure-Cell-Input--null" value={props.value} placeholder={props.value == null ? 'NULL' : props.value} />
        </div>
      );
    default:
      return (
        <div>
          <input className="Structure-Cell-Input" value={props.value} placeholder={props.value == null ? 'NULL' : props.value} />
        </div>
      );
  }
}

// these are the only things that are colored
// null, boolean, enum,
