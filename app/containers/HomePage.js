// @flow
import path from 'path';
import React, { Component } from 'react';
import { ResizableBox } from 'react-resizable';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Switch, Route } from 'react-router';
import Loadable from 'react-loadable';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { setDatabasePath } from '../actions/index';
import type { TableType } from '../types/TableType';
import { OPEN_FILE_CHANNEL } from '../types/channels';

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

type Props = {
  databasePath: ?string,
  setDatabasePath: string => null,
  location: {
    pathname: string
  }
};

type State = {
  widthSidebar: number, // 200
  widthGrid: number, // window.innerWidth - 200
  databaseName: ?string,
  selectedTable: ?TableType,
  tableColumns: Array<TableColumnType>,
  tableDefinition: string,
  connections: Array<connectionType>,
  isLoading: boolean,
  tables: Array<{
    name: string
  }>
};

class HomePage extends Component<Props, State> {
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
    tableColumns: [],
    tableDefinition: '',
    rows: [],
    connections: [],
    isLoading: true
  };

  constructor(props: Props) {
    super(props);

    ipcRenderer.on(OPEN_FILE_CHANNEL, (event, filePath) => {
      this.props.setDatabasePath(filePath);
    });

    // ipcRenderer.on(DELETE_TABLE_CHANNEL, () => {
    //   this.deleteSelectedTable();
    // });
  }

  /**
   * Uses the database api to set container's state from falcon-core
   * @TODO: Since supporting just SQLite, getDatabases will only return 1 db
   */
  getInitialViewData = async (filePath: string) => {
    const [databases, tableNames] = await Promise.all([
      this.core.connection.listDatabases(),
      // @HACK: HARDCODE. SQLITE ONLY
      this.core.connection.listTables()
    ]);

    const selectedTable = this.state.selectedTable || {
      name: tableNames[0].name
    };
    const databaseName = path.parse(databases[0]).base;

    await this.onTableSelect(selectedTable);

    this.setState({
      databaseName,
      selectedTable,
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
      value: Object.values(value)
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
      import('falcon-core/lib/database/provider_clients/SqliteProviderFactory'),
      import('falcon-core/lib/config/ConnectionManager')
    ]);

    const { default: SqliteProviderFactory } = a;
    const { default: ConnectionManager } = b;

    // @HACK: This is a temporary way if improving require performance.
    //        The API itself in falcon-core needs to be changed to reflect this
    this.core = {};
    this.core.connection = await SqliteProviderFactory(
      {
        database: this.props.databasePath
      },
      {
        database: this.props.databasePath
      }
    );
    this.connectionManager = new ConnectionManager();

    await this.getInitialViewData(this.props.databasePath);
    const databaseVersion = await this.core.connection.getVersion();

    this.setState({
      databaseVersion
    });

    window.onresizeFunctions['sidebar-resize-set-state'] = () => {
      this.setState({
        widthSidebar: this.state.widthSidebar,
        widthGrid: window.innerWidth - this.state.widthSidebar
      });
    };

    const grid = document.querySelector('.HomePage .Grid');
    const sidebar = document.querySelector('.Sidebar');
    const height = 32 + 10 + 21 + 15;
    grid.style.height = `${window.innerHeight - height}px`;
    sidebar.style.height = `${window.innerHeight - height + 40}px`;

    // If the window is resized, change the height of the grid repsectively
    window.onresizeFunctions['resize-grid-resize'] = () => {
      grid.style.height = `${window.innerHeight - height}px`;
      sidebar.style.height = `${window.innerHeight - height + 40}px`;
    };

    // Preload other pages when the browser's main thread isn't busy
    requestIdleCallback(() => {
      ContentPage.preload();
      StructurePage.preload();
      QueryPage.preload();
      GraphPage.preload();
    });
  }

  render() {
    if (!this.state.selectedTable) return <div />;

    return (
      <div className="HomePage container-fluid">
        <div className="row">
          <div className="sticky">
            <Header
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
                  databaseName={this.state.databaseName}
                  tables={this.state.tables}
                  onTableSelect={this.onTableSelect}
                  selectedTable={this.state.selectedTable}
                  connections={this.state.connections}
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
                  <Route exact strict path="/" render={() => <LoginPage />} />
                  <Route
                    exact
                    strict
                    path="/login"
                    render={() => <LoginPage />}
                  />
                  <Route
                    exact
                    strict
                    path="/content"
                    render={() => (
                      <ContentPage
                        table={{
                          name: this.state.selectedTable.name,
                          columns: this.state.tableColumns,
                          rows: this.state.rows
                        }}
                      />
                    )}
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
                    render={() => (
                      <GraphPage
                        databasePath={this.props.databasePath}
                        connection={this.core.connection}
                      />
                    )}
                  />
                </Switch>
              </div>
              <Footer
                offset={this.state.widthSidebar}
                pathname={this.props.location.pathname}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    // @HACK: HARDCODE. The concept of 'paths' are specific to sqlite
    databasePath: state.databasePath
  };
}

export default connect(mapStateToProps, { setDatabasePath })(HomePage);
