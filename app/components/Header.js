// @flow
import React from 'react';
import { remote } from 'electron';
import ListSymbol from './ListSymbol';

export default function Header() {
  const isFullScreen = remote.getCurrentWindow().isFullScreen();

  return (
    <div className="Header col-sm-12">
      <div className="Header--container" style={{ marginLeft: isFullScreen ? '10px' : '100px' }}>
        {/* @TODO: Create a separate breadcrumbs component  */}
        <div className="Header--breadcrumb">
          <ListSymbol type="connection" /> Falcon Test Database
        </div>
        <div className="Header--breadcrumb">
          <ListSymbol type="database" /> falcon-db
        </div>
        <div className="Header--breadcrumb">
          <ListSymbol type="table" /> Lorem
         </div>
      </div>
      <div className="Header--container Header--container-status" id="falcon-status-bar-container">
        <span className="Connection"><i className="ion-locked Connection--lock Connection--lock-secure" /> <a href="">Connected</a></span>
        <span><a href="">SQLite 3.1.6</a></span>
      </div>
      <div className="Header--container Header--container-hidden">
        <div className="Header--button ion-android-refresh" />
        <div className="Header--button ion-android-add" />
      </div>
    </div>
  );
}
