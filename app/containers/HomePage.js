// @flow
import React, { Component } from 'react';
import { ResizableBox } from 'react-resizable';
import type { Children } from 'react';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
// import Tabs from '../components/Tabs';
import { Switch, Route } from 'react-router';
import ContentPage from './ContentPage';
import StructurePage from './StructurePage';
import QueryPage from './QueryPage';
import GraphPage from './GraphPage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import { Database, getDatabases, getTableColumns } from '../api/Database';
import type { DatabaseType } from '../types/DatabaseType';
import type { TableType } from '../types/TableType';

type Props = {
  children: Children,
  databasePath: ?string
};

type State = {
  widthSidebar: number, // 200
  widthGrid: number, // window.innerWidth - 200
  databaseName: ?string,
  tables: ?Array<TableType>,
  selectedTable: ?TableType,
  databaseApi: Database
  // siderCollapsed: boolean
};

class HomePage extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      // @TODO: See LoginPage line 131 for why replace'_' with '/'
      widthSidebar: 200,
      widthGrid: window.innerWidth - 200,
      databaseApi: new Database(this.props.databasePath),
      databaseName: null,
      tables: null,
      selectedTable: null,
    };
    // ipcRenderer.on(OPEN_FILE_CHANNEL, (event, filePath) => {
    //   this.setDatabaseResults(filePath);
    // });
    // ipcRenderer.on(DELETE_TABLE_CHANNEL, () => {
    //   this.deleteSelectedTable();
    // });
  }

  async componentDidMount() {
    await this.setDatabaseResults(this.props.databasePath);
    await this.state.databaseApi.connect();
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
    window.onresizeFunctions['resize-grid-resize'] = (() => {
      grid.style.height = `${window.innerHeight - height}px`;
      sidebar.style.height = `${window.innerHeight - height + 40}px`;
    });
  }

  // @TODO: Since supporting just SQLite, getDatabases will only return 1 db
  setDatabaseResults = async (filePath: string) => {
    const databasesArr = await getDatabases(filePath);
    const { databaseName, tables } = databasesArr[0];

    this.setState({
      databaseName,
      tables,
      selectedTable:
        this.state.selectedTable || tables[0],
      // @TODO: Use tableName instead of whole table object contents
      // databasePath: filePath
    });
  };


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

  onSelectTable = (selectedTable: TableType) => {
    this.setState({ selectedTable });
  };

  render() {
    console.log(this.props);
    if (!this.state.selectedTable) return <div />;
    return (
      <div className="HomePage container-fluid">
        <div className="row">
          <div className="sticky">
            <Header databaseName={this.state.databaseName} selectedTableName={this.state.selectedTable.tableName} />
            {/**
            <div className="col-sm-12 no-padding">
              <Tabs />
            </div> * */}
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
                <Sidebar databaseName={this.state.databaseName} tables={this.state.tables} onSelectTable={this.onSelectTable} />
              </ResizableBox>
              <div className="Grid" style={{ position: 'relative', width: this.state.widthGrid, overflow: 'scroll' }}>
                <Switch>
                  <Route path="/home/content" render={() => <ContentPage table={this.state.selectedTable} />} />
                  <Route path="/home/structure" render={() => <StructurePage tablePromise={getTableColumns(this.props.databasePath, this.state.selectedTable.tableName)} />} />
                  <Route path="/home/query" component={QueryPage} />
                  <Route path="/home/graph" render={() => <GraphPage databasePath={this.props.databasePath} />} />
                </Switch>
              </div>
              <Footer offset={this.state.widthSidebar} pathname={this.props.location.pathname} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}


function mapStateToProps(state) {
  return {
    databasePath: state.databasePath,
  };
}

export default connect(mapStateToProps)(HomePage);
