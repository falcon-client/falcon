// @flow
import React from 'react';
import ListSymbol from './ListSymbol';
import type { TableType } from '../types/TableType';

/**
 * Recursively render the tree of elements by passing props
 */

type Props = {
  databaseName: string,
  onTableSelect: (table: TableType) => void,
  // selectedTable?: ?TableType,
  tables: Array<{
    name: string
  }>
};

// @TODO: Fix how child elements in the list are rendered. Currently  hacky since
// Children are rendered outside of the parent and is made to look like a children
// via styling. Will need to fix this when we want collapsible elements
export default function Sidebar(props: Props) {
  const tables = props.tables.map(table => (
    <div
      key={table.name}
      onClick={e => props.onTableSelect(table)}
      className={
        props.selectedTable.name === table.name
          ? 'Sidebar--list-item-selected'
          : 'Sidebar--list-item'
      }
      style={{ paddingLeft: 40 }}
    >
      <ListSymbol type="table" />
      <a>{table.name}</a>
    </div>
  ));

  return (
    <div className="Sidebar">
      <ul className="Sidebar--list">
        <div className="Sidebar--list-item">
          <ListSymbol type="query" />
          <a>Query</a>
        </div>
        <div className="Sidebar--list-item">
          <ListSymbol type="database" /> <a>{props.databaseName}</a>
        </div>
        {tables}
      </ul>
    </div>
  );
}
