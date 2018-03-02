// @flow
import React from 'react';
import { remote } from 'electron';
import ListSymbol from './ListSymbol';

type Props = {
  databaseName: string,
  selectedTableName: string,
  databaseName: string,
  databaseType: string,
  databaseVersion: number | string
};

export default function Header(props: Props) {
  const shouldHideMargin =
    remote.getCurrentWindow().isFullScreen() || process.platform !== 'darwin';

  return (
    <div className="Header col-sm-12">
      <div
        className="Header--container"
        style={{ marginLeft: shouldHideMargin ? '10px' : '80px' }}
      >
        {/* @TODO: Create a separate breadcrumbs component  */}
        <div className="Header--breadcrumb">
          <ListSymbol type="database" /> {props.databaseName}
        </div>
        <div className="Header--breadcrumb">
          <ListSymbol type="table" /> {props.selectedTableName}
        </div>
      </div>
      <div
        className="Header--container Header--container-status"
        id="falcon-status-bar-container"
      >
        <span className="Connection">
          <i className="ion-locked Connection--lock Connection--lock-secure" />{' '}
          <a href="">Connected</a>
        </span>
        <span>
          <a href="">
            {props.databaseType} {props.databaseVersion}
          </a>
        </span>
      </div>
      <div className="Header--container Header--container-hidden">
        <div className="Header--button ion-android-refresh" />
        <div className="Header--button ion-android-add" />
      </div>
    </div>
  );
}
