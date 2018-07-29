// @flow
import React, { Component } from 'react';
import NProgress from 'nprogress';
import '@falcon-client/falcon-ui/src/styles/app.global.scss';
import { Button } from '@falcon-client/falcon-ui';
import ListSymbol from './ListSymbol';

type Props = {
  databaseName?: ?string,
  databaseType: string,
  databaseVersion?: number | string,
  isLoading: boolean,
  // The SQL statement to run when reloading the current view
  onRefreshClick: () => void,
  selectedTable?: ?{
    name: string
  }
};

export default class Header extends Component<Props, {}> {
  static defaultProps = {
    databaseName: '',
    selectedTable: {
      name: ''
    }
  };

  componentDidMount() {
    NProgress.configure({
      parent: '#falcon-status-bar-container',
      showSpinner: false
    });
  }

  componentWillReceiveProps(newProps) {
    if (this.props.isLoading !== newProps.isLoading) {
      if (newProps.isLoading) {
        NProgress.start();
      } else {
        NProgress.done();
      }
    }
  }

  render() {
    const { props } = this;
    const shouldHideMargin = false;
    // @NOTE: Temporarily disabled for performance. fullscreen prop should be passed from parent
    // import { remote } from 'electron';
    // remote.getCurrentWindow().isFullScreen() || process.platform !== 'darwin';

    return (
      <div className="Header col-sm-12">
        <Button>Hello</Button>
        <div
          className="Header--container"
          style={{ marginLeft: shouldHideMargin ? '10px' : '80px' }}
        >
          {/* @TODO: Create a separate breadcrumbs component  */}
          <div className="Header--breadcrumb">
            <ListSymbol type="database" /> {props.databaseName || ''}
          </div>
          <div className="Header--breadcrumb">
            <ListSymbol type="table" />{' '}
            {props.selectedTable ? props.selectedTable.name : ''}
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
            <a>
              {props.databaseType} {props.databaseVersion || ''}
            </a>
          </span>
        </div>
        <div className="Header--container Header--container-hidden">
          <div
            className="Header--button ion-android-refresh"
            data-e2e="header-connection-refresh-button"
            onClick={() => this.props.onRefreshClick()}
          />
          <div
            className="Header--button ion-android-add"
            data-e2e="header-create-new-connection-button"
            onClick={() => this.props.history.push('/login')}
          />
        </div>
      </div>
    );
  }
}
