// @flow
import React, { Component } from 'react';
import { remote, ipcRenderer } from 'electron';
import { connect } from 'react-redux';
import { OPEN_FILE_CHANNEL } from '../types/channels';
import { setDatabasePath } from '../actions/index';

const { dialog } = remote;

const buttonStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-end',
  borderRadius: '4px',
  padding: '2px 0px'
};

type Props = {
  setDatabasePath: (path: string) => null
};

type State = {
  connectionName: string,
  databasePath: string,
  errorMessage: ?string
};

class Login extends Component<Props, State> {
  state = {
    connectionName: '',
    databasePath: '',
    errorMessage: null
  };

  constructor(props: Props) {
    super(props);
    ipcRenderer.on(OPEN_FILE_CHANNEL, (event, filePath) => {
      this.setState({ databasePath: filePath });
      this.handleConnect();
    });
  }

  handleDatabasePathSelection = () => {
    const selectedFiles = dialog.showOpenDialog({
      filters: [{ name: 'SQLite', extensions: ['sqlite', 'db', 'sqlite3'] }],
      title: 'Set a database'
    });
    if (!selectedFiles) return;
    const databasePath = selectedFiles[0];
    this.setState({ databasePath });
  };

  render() {
    return (
      <div className="Login">
        <div className="Login--container">
          <div className="row no-gutters">
            <div className="col-12 row-margin text-center">
              <h2 className="Login--header">Create Connection</h2>
              {this.state.errorMessage ? (
                <div className="Login--alert">{this.state.errorMessage}</div>
              ) : null}
            </div>
            <div className="col-12">
              <h3 className="text-left Login--input-label">
                Connection Nickname
              </h3>
              <input
                placeholder="My first connection"
                value={this.state.connectionName}
                onChange={e =>
                  this.setState({ connectionName: e.target.value })
                }
                type="text"
              />
            </div>
            <div className="col-10">
              <h3 className="text-left Login--input-label">Database path</h3>
              <input
                placeholder="~/Documents/..."
                value={this.state.databasePath}
                onChange={e => this.setState({ databasePath: e.target.value })}
              />
            </div>
            <div className="col-2" style={buttonStyle}>
              <button onClick={this.handleDatabasePathSelection}>
                Choose Path
              </button>
            </div>
            <div className="col-12 row-margin Login--submit-button-container">
              <div
                className="Login--submit-button"
                onClick={this.handleConnect}
              >
                {' '}
                Connect
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(null, { setDatabasePath })(Login);
