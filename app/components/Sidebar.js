// @flow
import React from 'react';
import type { connectionType } from 'falcon-core';
import ListSymbol from './ListSymbol';
import type { TableType } from '../types/TableType';

/**
 * Recursively render the tree of elements by passing props
 */

type Props = {
  databaseName: string,
  onTableSelect: (table: TableType) => void,
  connections: Array<connectionType>,
  selectedConnection: connectionType,
  selectedTable: TableType,
  tables: Array<{
    name: string
  }>
};

// @TODO: Fix how child elements in the list are rendered. Currently  hacky since
// Children are rendered outside of the parent and is made to look like a children
// via styling. Will need to fix this when we want collapsible elements
export default function Sidebar(props: Props) {
  const connections = props.connections.map(connection => (
    <div
      key={connection.name}
      onClick={() => props.onConnectionSelect(connection)}
      className={
        props.selectedConnection.name === connection.name
          ? 'Sidebar--list-item-selected'
          : 'Sidebar--list-item'
      }
      style={{ paddingLeft: 40 }}
    >
      <ListSymbol type="table" />
      <a>{connection.name}</a>
    </div>
  ));

  const tables = props.tables.map(table => (
    <div
      key={table.name}
      onClick={() => props.onTableSelect(table)}
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
        {connections}
        <div className="Sidebar--list-item">
          <ListSymbol type="database" /> <a>{props.databaseName}</a>
        </div>
        {tables}
      </ul>
    </div>
  );
}
