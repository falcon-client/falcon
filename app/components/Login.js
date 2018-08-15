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
  setDatabasePath: (path: string) => null,
  onSuccess: () => void
};

type State = {
  connectionName: string,
  databasePath: string,
  errorMessages: Array<string>
};

class Login extends Component<Props, State> {
  state = {
    connectionName: '',
    databasePath: '',
    errorMessages: []
  };

  constructor(props: Props) {
    super(props);
    ipcRenderer.on(OPEN_FILE_CHANNEL, (event, filePath) => {
      this.setState({ databasePath: filePath });
      this.handleConnect();
    });
  }

  async handleConnect() {
    const { connectionManager, onSuccess } = this.props;
    const { connectionName, databasePath } = this.state;
    try {
      await connectionManager.add({
        id: `connection-${Math.round(Math.random() * 10 ** 6)}`,
        name: connectionName,
        database: databasePath,
        // @HARDCODE
        type: 'sqlite'
      });
      await onSuccess();
    } catch (e) {
      console.log(e);
      this.setState({
        errorMessages: e.data.errors.error.details.map(detail => ({
          fieldName: detail.context.label,
          message: detail.message
        }))
      });
    }
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
    const { errorMessages, connectionName, databasePath } = this.state;
    return (
      <div className="Login">
        <div className="Login--container" data-e2e="login-container">
          <div className="row no-gutters">
            <div className="col-12 row-margin text-center">
              <h2 className="Login--header">Create Connection</h2>
              {errorMessages.map(e => (
                <div
                  data-e2e="login-error-message-box"
                  className="Login--alert"
                >
                  {e.message}
                </div>
              ))}
            </div>
            <div className="col-12">
              <h3 className="text-left Login--input-label">
                Connection Nickname
              </h3>
              <input
                placeholder="My first connection"
                value={connectionName}
                type="text"
                data-e2e="create-connection-name"
                onChange={e =>
                  this.setState({ connectionName: e.target.value })
                }
              />
            </div>
            <div className="col-10">
              <h3 className="text-left Login--input-label">Database path</h3>
              <input
                placeholder="/Desktop/sqlite.db"
                value={databasePath}
                data-e2e="create-connection-database-name"
                onChange={e => this.setState({ databasePath: e.target.value })}
              />
            </div>
            <div className="col-2" style={buttonStyle}>
              <button onClick={this.handleDatabasePathSelection} type="button">
                Choose Path
              </button>
            </div>
            <div className="col-12 row-margin Login--submit-button-container">
              <div
                className="Login--submit-button"
                onClick={() => this.handleConnect()}
                data-e2e="create-connection-submit"
              >
                Connect
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  null,
  { setDatabasePath }
)(Login);
