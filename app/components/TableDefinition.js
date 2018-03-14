// @flow
import React from 'react';
import Editor from './Editor';

type Props = {
  tableDefinition: string
};

export default function TableDefinition(props: Props) {
  return <Editor readOnly sql={props.tableDefinition} />;
}
