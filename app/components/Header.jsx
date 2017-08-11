// @flow
import React from 'react';
import ListSymbol from './ListSymbol';

export default function Header(props) {
  return (
    <div className="Header col-sm-12">
      <div className="Header--container Header--container-status">
        <span className="Connection"><i className="ion-locked Connection--lock Connection--lock-secure" /> <a href="">Connected</a></span>
        <span><a href="">SQLite Version 3.1.6</a></span>
      </div>
      <div className="Header--container">
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
      <div className="Header--container Header--container-hidden">
        <div className="Header--button ion-android-refresh" />
        <div className="Header--button ion-android-add" />
      </div>
    </div>
  );
}
