// @flow
import React, { Component } from 'react';
import { remote, ipcRenderer } from 'electron';
import type { ContextRouter } from 'react-router-dom';
import Connections from '../api/Connections';
import SavedDatabases from './SavedDatabases';
import { OPEN_FILE_CHANNEL } from '../types/channels';
import type { LoginSavedDatabaseType } from '../types/LoginSavedDatabaseType';

const { dialog } = remote;

const buttonStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-end',
  borderRadius: '4px',
  padding: '2px 0px'
};


type State = {
  connectionName: string,
  databasePath: string,
  errorMessage: ?string,
  savedDatabases: Array<LoginSavedDatabaseType>
};

export default class Login extends Component<Props, State> {
  connections = new Connections();
  constructor(props: Props) {
    super(props);
    this.state = {
      connectionName: '',
      databasePath: '',
      errorMessage: null,
      savedDatabases: this.connections.getSavedDatabases() || []
    };
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

  handleSaveDatabase = async () => {
    try {
      this.setState({
        savedDatabases: await this.connections.saveDatabase(
          this.state.connectionName,
          this.state.databasePath
        )
      });
    } catch (e) {
      this.setState({ errorMessage: e });
    }
  };

  handleConnect = async (e?: SyntheticEvent<>) => {
    if (e) {
      e.preventDefault();
    }
    if (
      (await Connections.validateDatabaseFilePath(this.state.databasePath)) !==
      true
    ) {
      const errorMessage =
        this.state.databasePath === ''
          ? 'Database path is empty'
          : `${this.state.databasePath} isn't a valid sqlite file path`;
      this.setState({ errorMessage });
      return;
    }

    const flag = await Connections.validateConnection(this.state.databasePath);
    if (flag !== true) {
      this.setState({ flag });
      return;
    }

    const path = `/home/${this.state.databasePath.replace(/\//g, '_')}`;
    this.props.history.push(path);
  };

  loadSavedDatabase = (databasePath: string, connectionName: string) => {
    this.setState({ databasePath, connectionName });
  };

  deleteSavedDatabase = (savedDatabase: LoginSavedDatabaseType) => {
    const savedDatabases = this.connections.deleteSavedDatabase(savedDatabase);
    this.setState({ savedDatabases });
  };

  render() {
    const { databasePath } = this.state;
    return (
      <div className="Login">
        <div className="Login--container">
          <div className="row no-gutters">
            <div className="col-12 row-margin text-center">
              <h2 className="Login--header">Create Connection</h2>
              {this.state.errorMessage ? <div className="Login--alert">{this.state.errorMessage}</div> : null}
            </div>
            <div className="col-12">
              <h3 className="text-left Login--input-label">Connection Nickname</h3>
              <input
                placeholder="My first connection"
                value={this.state.connectionName}
                onChange={e => this.setState({ connectionName: e.target.value })}
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

              <button onClick={this.handleDatabasePathSelection}>Choose Path</button>

            </div>
            <div className="col-12 row-margin Login--submit-button-container">
              <div className="Login--submit-button" onClick={this.handleConnect}> Connect</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
