import React from 'react';
import ListSymbol from './ListSymbol';

export default function Sidebar() {
  return (
    <div className="Sidebar">
      <ul className="Sidebar--list">
        <li className="Sidebar--list-item"><ListSymbol type="query" /><a>Query</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>albumns</a></li>
        <li className="Sidebar--list-item"><ListSymbol />
          <a>users</a>
          <li className="Sidebar--list-item">
            <ListSymbol type="database" /><a>albumns</a>
          </li>
          <li className="Sidebar--list-item">
            <ListSymbol type="database" /><a>test-table</a>
            <li className="Sidebar--list-item">
              <ListSymbol type="table" /><a>test-table</a>
            </li>
          </li>
        </li>
        <li className="Sidebar--list-item"><ListSymbol /><a>Lorem</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>ipsum</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>dolor</a></li>
        <li className="Sidebar--list-item Sidebar--list-item-selected"><ListSymbol /><a>sit</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>amet,</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>consectetur</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>adipisicing</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>elit.</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>Non</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>nihil</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>hic</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>iusto</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>eum</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>ea</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>pariatur</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>eos</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>fugit</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>et</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>eius,</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>harum</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>quasi!</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>Architecto</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>veniam</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>debitis</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>sunt</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>nisi</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>ex</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>ipsum,</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>aliquam</a></li>
        <li className="Sidebar--list-item"><ListSymbol /><a>est.</a></li>
      </ul>
    </div>
  );
}
