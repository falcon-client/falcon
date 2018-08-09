// @flow
import React from 'react';
// import type { connectionType } from 'falcon-core/types';
import ListSymbol from './ListSymbol';
import type { TableType } from '../types/TableType';

/**
 * Recursively render the tree of elements by passing props
 */

type Props = {
  databaseName?: ?string,
  onConnectionSelect: (table: TableType) => void,
  onTableSelect: (table: TableType) => void,
  connections: Array<connectionType>,
  selectedConnection: connectionType,
  selectedTable?: ?TableType,
  tables: Array<{
    name: string
  }>
};

// @TODO: Fix how child elements in the list are rendered. Currently  hacky since
// Children are rendered outside of the parent and is made to look like a children
// via styling. Will need to fix this when we want collapsible elements
export default function Sidebar(props: Props) {
  const {
    onTableSelect,
    onConnectionSelect,
    connections,
    selectedConnection,
    tables,
    databaseName,
    selectedTable
  } = props;

  const connectionsSymbols = connections.map(connection => (
    <div
      key={connection.name}
      onClick={() => onConnectionSelect(connection)}
      className={
        selectedConnection && selectedConnection.name === connection.name
          ? 'Sidebar--list-item-selected'
          : 'Sidebar--list-item'
      }
      style={{ paddingLeft: 40 }}
    >
      <ListSymbol type="connection" />
      <a>{connection.name}</a>
    </div>
  ));

  const tablesSymbols = tables.map(table => (
    <div
      key={table.name}
      onClick={() => onTableSelect(table)}
      className={
        selectedTable.name === table.name
          ? 'Sidebar--list-item-selected'
          : 'Sidebar--list-item'
      }
      style={{ paddingLeft: 40 }}
      data-e2e="Sidebar--list-item"
    >
      <ListSymbol type="table" />
      <a>{table.name}</a>
    </div>
  ));

  return (
    <div className="Sidebar">
      <ul className="Sidebar--list">
        <div className="Sidebar--list-item">
          <ListSymbol type="connection" /> <a>Connections</a>
        </div>
        {connectionsSymbols}
        {tablesSymbols.length ? (
          <div>
            <div className="Sidebar--list-item">
              <ListSymbol type="database" /> <a>{databaseName}</a>
            </div>
            {tablesSymbols}
          </div>
        ) : null}
      </ul>
    </div>
  );
}

Sidebar.defaultProps = {
  databaseName: '',
  selectedTable: null
};
