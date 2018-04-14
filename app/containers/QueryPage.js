// @flow
import React, { Component } from 'react';
import { ResizableBox } from 'react-resizable';
import Editor from '../components/Editor';
import Content from '../components/Content';

type Props = {
  executeQuery: (query: string) => void,
  tableColumns: Array<TableColumnType>,
  sqlFormatter: ((sql: string, numSpaces: number) => string) | (() => {})
};

type State = {
  queryHeight: number,
  queryResultsHeight: number,
  query: string,
  rows: Array<Object>
};

export default class QueryPage extends Component<Props, State> {
  state = {
    queryHeight: (window.innerHeight - 40) / 2,
    queryResultsHeight: (window.innerHeight - 40) / 2 - 40,
    query: 'SELECT * FROM sqlite_master',
    rows: []
  };

  onQueryChangeTimeoutId: number;

  query = 'SELECT * FROM sqlite_master';

  item = null;

  didMount: boolean = false;

  setQuery(query: string) {
    this.query = query;
    this.setState({ query });
  }

  async onQueryChange(query: string, self: QueryPage) {
    try {
      const queryResults = await self.props.executeQuery(query);
      // @HACK: This should be abstracted to falcon-core
      const rows = queryResults[0].rows.map((value, index) => ({
        rowID: value[Object.keys(value)[index]],
        value: Object.values(value).filter(e => !(e instanceof Buffer))
      }));
      self.setState({
        rows
      });
      // Redefine the refresh query every time the query changes
      this.props.setRefreshQueryFn(() => {
        this.setState({
          rows: []
        });
        this.onQueryChange(this.state.query, this);
      });
    } catch (error) {
      console.error(error.message);
    }
  }

  getTableData = (result: queryResponseType) => {
    const tableHeaders = result.fields.map(e => e.name);
    const tableData = result.rows.map(e => {
      const tableRow = {};
      tableHeaders.forEach(header => {
        tableRow[header] = e[header];
      });
      return tableRow;
    });
    return tableData;
  };

  onQueryResize = (event, { size }) => {
    this.setState({
      queryHeight: size.height,
      queryResultsHeight: this.item.offsetHeight - size.height
    });
  };

  componentDidMount() {
    this.didMount = true;
    this.item = document.querySelector('.QueryPage').parentElement;
    window.onresizeFunctions['query-page-resize'] = () => {
      if (this.didMount) {
        this.setState({
          queryResultsHeight: this.item.offsetHeight - this.state.queryHeight
        });
      }
    };
    this.onQueryChange(this.state.query, this);
  }

  componentWillUnmount() {
    this.didMount = false;
  }

  render() {
    return (
      <div className="QueryPage">
        <ResizableBox
          width={10}
          height={this.state.queryHeight}
          axis="y"
          handleSize={[100, 100]}
          style={{ height: `${this.state.queryHeight}px` }}
          onResize={this.onQueryResize}
        >
          <div className="row" style={{ height: '100%' }}>
            <Editor
              className="col-sm-8"
              sql={this.state.query}
              onChange={query => {
                this.setQuery(query);
                if (this.onQueryChangeTimeoutId) {
                  clearTimeout(this.onQueryChangeTimeoutId);
                }
                this.onQueryChangeTimeoutId = setTimeout(() => {
                  this.onQueryChange(query, this);
                }, 500);
              }}
            />
            <div className="col-sm-4 QueryPage--actions-container">
              <div className="QueryPage--actions-container-child">
                <input placeholder="My Query" />
                <button>Save</button>
              </div>
              <div className="QueryPage--actions-container-child">
                <input type="checkbox" checked /> Auto Run
              </div>
              <div className="QueryPage--actions-container-child">
                <select>
                  <option>First saved query</option>
                  <option>second saved query</option>
                </select>
              </div>
              <div
                className="QueryPage--actions-container-child"
                style={{ flex: 1 }}
              >
                <textarea
                  placeholder="Notes here..."
                  style={{ height: '100%' }}
                />
              </div>
            </div>
          </div>
        </ResizableBox>
        <div style={{ height: this.state.queryResultsHeight }}>
          <Content
            table={{
              databaseName: '',
              name: '',
              columns: this.props.tableColumns,
              rows: this.state.rows
            }}
          />
        </div>
      </div>
    );
  }
}
