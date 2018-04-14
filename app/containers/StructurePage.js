// @flow
import React, { Component } from 'react';
import ReactTable from 'react-table';
import Select from 'react-select';
import _ from 'lodash';
import Cell from '../components/StructurePageCell';
import TableDefinition from '../components/TableDefinition';

// Taken from https://www.sqlite.org/datatype3.html
// Each columns type options should contain these and its current type
// This is db-browser's behavior
const options = [
  { value: 'TEXT', label: 'TEXT' },
  { value: 'NUMERIC', label: 'NUMERIC' },
  { value: 'REAL', label: 'REAL' },
  { value: 'BLOB', label: 'BLOB' },
  { value: 'INTEGER', label: 'INTEGER' }
];

const tableStyle = {
  color: '#686868',
  backgroundColor: 'white'
};

/** Maps tableData from falcon-core to an obj compatible with react-table */
// @HACK: HARDCODE
// This transformation is specific to SQLite
function convertColumnData(col: TableColumnType) {
  return {
    cid: col.cid,
    dflt_value: col.dflt_value,
    name: col.name,
    notNull: col.notnull === 0,
    isPrimaryKey: col.pk === 1,
    type: col.type
  };
}

type Props = {
  tableColumns: Array<TableColumnType>,
  tableDefinition: string
};

type State = {
  tableColumns: ?TableColumnType
};

export default class StructurePage extends Component<Props, State> {
  state = {
    tableColumns: []
  };

  /** Used to render <Select> for column.type options</Select> */
  renderSelectType = cellInfo => {
    const { tableColumns } = this.state;
    return (
      <span className="number">
        <Select
          name="form-field-name"
          value={cellInfo.value}
          onChange={item => {
            const newTableColumns = _.cloneDeep(this.state.tableColumns);
            if (newTableColumns) {
              newTableColumns[cellInfo.index].type = item.value;
              this.setState({
                tableColumns: newTableColumns
              });
            }
          }}
          clearable={false}
          // Options contain Affinity types + column's current type
          options={_.unionWith(
            options,
            [
              {
                label: tableColumns[cellInfo.index].type,
                value: tableColumns[cellInfo.index].type
              }
            ],
            _.isEqual
          )}
        />
      </span>
    );
  };

  renderSelectBoolean = cellInfo => {
    const columnAccessor = cellInfo.column.id;
    return (
      <span className="number">
        <Select
          name="form-field-name"
          value={cellInfo.value}
          onChange={item => {
            const newTableColumns = _.cloneDeep(this.state.tableColumns);
            if (newTableColumns) {
              newTableColumns[cellInfo.index][columnAccessor] = item.value;
              this.setState({
                tableColumns: newTableColumns
              });
            }
          }}
          clearable={false}
          options={[
            { label: 'TRUE', value: 'true' },
            { label: 'FALSE', value: 'false' }
          ]}
        />
      </span>
    );
  };

  renderEditable = cellInfo => (
    <Cell type={cellInfo.value === null ? null : ''} value={cellInfo.value} />
  );

  async componentDidMount() {
    this.props.setRefreshQueryFn();
    this.setState({
      tableColumns: this.props.tableColumns.map(convertColumnData)
    });
  }

  async componentWillReceiveProps(nextProps: Props) {
    const { tableColumns } = await nextProps;
    this.props.setRefreshQueryFn();
    this.setState({ tableColumns: tableColumns.map(convertColumnData) });
  }

  render() {
    if (!this.state.tableColumns) return <div />;

    const { tableColumns } = this.state;
    const columns = [
      {
        accessor: 'cid',
        Header: 'ID',
        Cell: this.renderEditable
      },
      {
        accessor: 'name',
        Header: 'Name',
        Cell: this.renderEditable
      },
      {
        accessor: 'dflt_value',
        Header: 'Default',
        Cell: this.renderEditable
      },
      {
        accessor: 'notNull',
        Header: 'Not Null',
        Cell: this.renderSelectBoolean
      },
      {
        accessor: 'isPrimaryKey',
        Header: 'Primary Key',
        Cell: this.renderSelectBoolean
      },
      {
        Header: 'Type',
        accessor: 'type',
        Cell: this.renderSelectType
      }
    ];
    return (
      <div className="Structure col-offset-2">
        <ReactTable
          data={tableColumns}
          style={tableStyle}
          columns={columns}
          showPageJump={false}
          minRows={tableColumns.length}
          showPagination={false}
        />
        <TableDefinition tableDefinition={this.props.tableDefinition} />
      </div>
    );
  }
}
