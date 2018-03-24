// @flow
import path from 'path';
import React, { Component } from 'react';
import { ResizableBox } from 'react-resizable';
import { ipcRenderer } from 'electron';
import { Switch, Route } from 'react-router';
import Loadable from 'react-loadable';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { OPEN_FILE_CHANNEL } from '../types/channels';
import type { TableType } from '../types/TableType';

// @NOTE: This duplication is necessary. It makes webpack lazily load the chunks
const ContentPage = Loadable({
  loader: () => import('./ContentPage'),
  loading: () => <div>Loading...</div>
});
const LoginPage = Loadable({
  loader: () => import('./LoginPage'),
  loading: () => <div>Loading...</div>
});
const StructurePage = Loadable({
  loader: () => import('./StructurePage'),
  loading: () => <div>Loading...</div>
});
const QueryPage = Loadable({
  loader: () => import('./QueryPage'),
  loading: () => <div>Loading...</div>
});
const GraphPage = Loadable({
  loader: () => import('./GraphPage'),
  loading: () => <div>Loading...</div>
});
const LogPage = Loadable({
  loader: () => import('./LogPage'),
  loading: () => <div>Loading...</div>
});

type Props = {
  location: {
    pathname: string
  }
};

type State = {
  widthSidebar: number, // 200
  widthGrid: number, // window.innerWidth - 200
  databaseName: ?string,
  selectedTable: ?TableType,
  selectedConnection: ?connectionType,
  tableColumns: Array<TableColumnType>,
  tableDefinition: string,
  activeConnections: Array<connectionType>,
  connections: Array<connectionType>,
  isLoading: boolean,
  logs: Array<{ query: string, time: string, duration: string }>,
  tables: Array<{
    name: string
  }>
};

export default class HomePage extends Component<Props, State> {
  core: Database;

  state = {
    // @TODO: See LoginPage line 131 for why replace'_' with '/'
    widthSidebar: 200,
    widthGrid: window.innerWidth - 200,
    databaseName: null,
    tables: [],
    // @HACK: HARDCODE
    databaseType: 'SQLite',
    databaseVersion: '',
    selectedTable: null,
    selectedConnection: null,
    tableColumns: [],
    tableDefinition: '',
    rows: [],
    logs: [],
    activeConnections: [],
    connections: [],
    isLoading: true
  };

  ipcConnection = null;

  constructor(props: Props) {
    super(props);
    ipcRenderer.on(OPEN_FILE_CHANNEL, (event, filePath) => {
      this.ipcConnection = {
        database: filePath
      };
    });
    // ipcRenderer.on(DELETE_TABLE_CHANNEL, () => {
    //   this.deleteSelectedTable();
    // });
  }

  /**
   * Uses the database api to set container's state from falcon-core
   * @TODO: Since supporting just SQLite, getDatabases will only return 1 db
   */
  getInitialViewData = async () => {
    const [databases, tableNames, databaseVersion, logs] = await Promise.all([
      this.core.connection.listDatabases(),
      this.core.connection.listTables(),
      this.core.connection.getVersion(),
      this.core.connection.getLogs()
    ]);
    const selectedTable = this.state.selectedTable || {
      name: tableNames[0].name
    };
    const databaseName = path.parse(databases[0]).base;

    await this.onTableSelect(selectedTable);

    this.getLogsInterval = setInterval(async () => {
      this.setState({
        logs: await this.core.connection.getLogs()
      });
    }, 1000);

    this.setState({
      databaseName,
      selectedTable,
      logs,
      databaseVersion,
      isLoading: false,
      tables: tableNames
      // @TODO: Use tableName instead of whole table object contents
      // databasePath: filePath
    });
  };

  async setConnections() {
    const connections = await this.connectionManager.getAll();
    this.setState({
      connections
    });
    // @HACK
    await this.onConnectionSelect(connections[0]);
    return connections;
  }

  async executeQuery(query: string) {
    return this.core.connection.executeQuery(query);
  }

  onResizeGrid = (event, { size }) => {
    this.setState({
      widthGrid: size.width,
      widthSidebar: window.innerWidth - size.width
    });
  };

  onResizeSidebar = (event, { size }) => {
    this.setState({
      widthSidebar: size.width,
      widthGrid: window.innerWidth - size.width
    });
  };

  onConnectionSelect = async (selectedConnection: connectionType) => {
    const a = await import('falcon-core/es/database/provider_clients/SqliteProviderFactory');
    const { default: SqliteProviderFactory } = a;

    this.core.connection = await SqliteProviderFactory(
      selectedConnection,
      selectedConnection
    );
    this.state.selectedTable = undefined;
    await this.getInitialViewData();
    this.setState({
      selectedConnection
    });
  };

  onTableSelect = async (selectedTable: TableType) => {
    this.setState({
      selectedTable,
      isLoading: true
    });

    const [tableDefinition, tableColumns, tableValues] = await Promise.all([
      this.core.connection.getTableCreateScript(selectedTable.name),
      this.core.connection.getTableColumns(selectedTable.name),
      this.core.connection.getTableValues(selectedTable.name)
    ]);

    const rows = tableValues.map((value, index) => ({
      rowID: value[Object.keys(value)[index]],
      value: Object.values(value).filter(e => !(e instanceof Buffer))
    }));

    this.setState({
      tableColumns,
      rows,
      isLoading: false,
      tableDefinition: tableDefinition[0]
      // @TODO: Use tableName instead of whole table object contents
      // databasePath: filePath
    });
  };

  /**
   * Upon mounting, component fetches initial database data and configures
   * grid/sidebar resizing data. Also core
   */
  async componentDidMount() {
    const [a, b] = await Promise.all([
      import('falcon-core/es/database/provider_clients/SqliteProviderFactory'),
      import('falcon-core/es/config/ConnectionManager')
    ]);

    const { default: SqliteProviderFactory } = a;
    const { default: ConnectionManager } = b;

    // @HACK: This is a temporary way if improving require performance.
    //        The API itself in falcon-core needs to be changed to reflect this
    this.core = {};
    this.connectionManager = new ConnectionManager();
    this.setConnections()
      .then(async connections => {
        if (connections.length) {
          // @HACK: Temporarily connect to the first conenction in the connections
          //        array
          this.core.connection = await SqliteProviderFactory(
            this.ipcConnection || connections[0],
            this.ipcConnection || connections[0]
          );
          await this.getInitialViewData();
          this.props.history.push('/content');
        } else {
          this.props.history.push('/login');
        }
        return connections;
      })
      .catch(console.log);

    // View/DOM related logic
    window.onresizeFunctions['sidebar-resize-set-state'] = () => {
      this.setState({
        widthSidebar: this.state.widthSidebar,
        widthGrid: window.innerWidth - this.state.widthSidebar
      });
    };
    const grid = document.querySelector('.HomePage .Grid');
    const sidebar = document.querySelector('.Sidebar');
    if (grid && sidebar) {
      const height = 32 + 10 + 21 + 15;
      grid.style.height = `${window.innerHeight - height}px`;
      sidebar.style.height = `${window.innerHeight - height + 40}px`;
      // If the window is resized, change the height of the grid repsectively
      window.onresizeFunctions['resize-grid-resize'] = () => {
        grid.style.height = `${window.innerHeight - height}px`;
        sidebar.style.height = `${window.innerHeight - height + 40}px`;
      };
    }
    // Preload other pages when the browser's main thread isn't busy
    requestIdleCallback(() => {
      ContentPage.preload();
      StructurePage.preload();
      QueryPage.preload();
      GraphPage.preload();
      LogPage.preload();
    });
  }

  componentWillUnmount() {
    clearInterval(this.getLogsInterval);
  }

  render() {
    return (
      <div className="HomePage container-fluid">
        <div className="row">
          <div className="sticky">
            <Header
              history={this.props.history}
              isLoading={this.state.isLoading}
              selectedTable={this.state.selectedTable}
              databaseType={this.state.databaseType}
              databaseName={this.state.databaseName}
              databaseVersion={this.state.databaseVersion}
            />
            <div className="row no-margin">
              <ResizableBox
                width={this.state.widthSidebar}
                height={100}
                minConstraints={[100, 200]}
                maxConstraints={[400, 400]}
                onResize={this.onResizeSidebar}
                handleSize={[100, 100]}
                axis="x"
              >
                {/* Currently only supports one database file at a time (since using SQLite only) */}
                <Sidebar
                  pathname={this.props.location.pathname}
                  databaseName={this.state.databaseName}
                  tables={this.state.tables}
                  onTableSelect={this.onTableSelect}
                  onConnectionSelect={this.onConnectionSelect}
                  selectedTable={this.state.selectedTable}
                  connections={this.state.connections}
                  activeConnections={this.state.activeConnections}
                />
              </ResizableBox>
              <div
                className="Grid"
                style={{
                  position: 'relative',
                  width: this.state.widthGrid,
                  overflow: 'scroll'
                }}
              >
                <Switch>
                  <Route
                    exact
                    strict
                    path="/login"
                    render={() => (
                      <LoginPage
                        connectionManager={this.connectionManager}
                        onSuccess={() => {
                          this.setConnections();
                          this.props.history.push('/content');
                        }}
                      />
                    )}
                  />
                  <Route
                    exact
                    strict
                    path="/content"
                    render={() =>
                      this.state.selectedTable ? (
                        <ContentPage
                          table={{
                            name: this.state.selectedTable.name,
                            columns: this.state.tableColumns,
                            rows: this.state.rows
                          }}
                        />
                      ) : null
                    }
                  />
                  <Route
                    exact
                    strict
                    path="/structure"
                    render={() => (
                      <StructurePage
                        tableColumns={this.state.tableColumns}
                        tableDefinition={this.state.tableDefinition}
                      />
                    )}
                  />
                  <Route
                    exact
                    strict
                    path="/query"
                    render={() => (
                      <QueryPage
                        tableColumns={this.state.tableColumns}
                        executeQuery={e => this.executeQuery(e)}
                      />
                    )}
                  />
                  <Route
                    exact
                    strict
                    path="/graph"
                    render={() =>
                      this.core &&
                      this.core.connection &&
                      this.state.selectedConnection &&
                      this.state.selectedConnection.database ? (
                        <GraphPage
                          databasePath={this.state.selectedConnection.database}
                          connection={this.core.connection}
                        />
                      ) : null
                    }
                  />
                  <Route
                    exact
                    strict
                    path="/logs"
                    render={() => <LogPage logs={this.state.logs} />}
                  />
                </Switch>
              </div>
              <Footer
                offset={this.state.widthSidebar}
                pathname={this.props.location.pathname}
                hasActiveConnection={
                  this.state.activeConnections.length !== 0 ||
                  this.state.connections.length !== 0
                }
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
