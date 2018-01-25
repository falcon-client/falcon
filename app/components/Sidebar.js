import React from 'react';
import ListSymbol from './ListSymbol';
import TableType from '../types/TableType';

type Props = {
  databaseName: string,
  onSelectTable: (event) => void,
  tables: Array<TableType>
};

export default function Sidebar(props) {
  const tables = props.tables.map(table =>
    (<li key={table.tableName}className="Sidebar--list-item">
      <ListSymbol type="table" /><a>{table.tableName}</a>
    </li>));

  return (
    <div className="Sidebar">
      <ul className="Sidebar--list">
        <li className="Sidebar--list-item"><ListSymbol type="query" /><a>Query</a></li>
        <li className="Sidebar--list-item"><ListSymbol type="table" />
          <a>{props.databaseName}</a>
          {tables}
        </li>
      </ul>
    </div>
  );
}
