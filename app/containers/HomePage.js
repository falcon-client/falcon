// @flow
import path from 'path';
import React, { Component } from 'react';
import { ResizableBox } from 'react-resizable';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Switch, Route } from 'react-router';
import { ConnectionManager } from 'falcon-core';
import ContentPage from './ContentPage';
import LoginPage from './LoginPage';
import StructurePage from './StructurePage';
import QueryPage from './QueryPage';
import GraphPage from './GraphPage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { Database, getVersion } from '../api/Database';
import { setDatabasePath } from '../actions/index';
import type { TableType } from '../types/TableType';
import type { TableColumnType } from '../api/Database';
import { OPEN_FILE_CHANNEL } from '../types/channels';

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
  tables: Array<{
    name: string
  }>,
  selectedTable: ?TableType,
  tableColumns: Array<TableColumnType>,
  tableDefinition: string
};

class HomePage extends Component<Props, State> {
  core: Database;

  connectionManager = new ConnectionManager();

  constructor(props: Props) {
    super(props);
    this.state = {
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
      rows: []
    };

    this.core = new Database(props.databasePath);

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
  setDatabaseResults = async (filePath: string) => {
    const [databases, tableNames] = await Promise.all([
      this.core.connection.listDatabases(),
      // @HACK: HARDCODE. SQLITE ONLY
      this.core.connection.listTables()
    ])

    const selectedTable = this.state.selectedTable || {
      name: tableNames[0].name
    };
    const databaseName = path.parse(databases[0]).base;

    this.onTableSelect(selectedTable);

    this.setState({
      databaseName,
      tables: tableNames,
      selectedTable
      // @TODO: Use tableName instead of whole table object contents
      // databasePath: filePath
    });
  };

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
    const [tableDefinition, tableColumns, tableValues] = await Promise.all([
      this.core.connection.getTableCreateScript(
        selectedTable.name
      ),
      this.core.getTableColumns(selectedTable.name),
      this.core.connection.getTableValues(
        selectedTable.name
      )
    ])

    const rows = tableValues.map((value, index) => ({
      rowID: value[Object.keys(value)[index]],
      value: Object.values(value)
    }));

    this.setState({
      selectedTable,
      tableColumns,
      rows,
      tableDefinition: tableDefinition[0],
      // @TODO: Use tableName instead of whole table object contents
      // databasePath: filePath
    });
  };

  /**
   * Upon mounting, component fetches initial database data and configures
   * grid/sidebar resizing data. Also core
   */
  async componentDidMount() {
    await this.core.connect();
    await this.setDatabaseResults(this.props.databasePath);
    const databaseVersion = await getVersion(this.props.databasePath);

    this.setState({
      databaseVersion,
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
  }

  render() {
    if (!this.state.selectedTable) return <div />;

    return (
      <div className="HomePage container-fluid">
        <div className="row">
          <div className="sticky">
            <Header
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
                  connections={[]}
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
                    path="/home/login"
                    render={() => (
                      <LoginPage />
                    )}
                  />
                  <Route
                    path="/home/content"
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
                    path="/home/structure"
                    render={() => (
                      <StructurePage
                        tableColumns={this.state.tableColumns}
                        tableDefinition={this.state.tableDefinition}
                      />
                    )}
                  />
                  <Route
                    path="/home/query"
                    render={() => (
                      <QueryPage
                        tableColumns={this.state.tableColumns}
                        executeQuery={e => this.executeQuery(e)}
                      />
                    )}
                  />
                  <Route
                    path="/home/graph"
                    render={() => (
                      <GraphPage databasePath={this.props.databasePath} />
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
