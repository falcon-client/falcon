// @flow
import React, { Component } from 'react';
import ReactTable from 'react-table';
import Select from 'react-select';
import _ from 'lodash';
import TableColumnType from '../api/Database';

// Taken from https://www.sqlite.org/datatype3.html
// Each columns type options should contain these and its current type
// This is db-browser's behavior
const options = [
  { value: 'TEXT', label: 'TEXT' },
  { value: 'NUMERIC', label: 'NUMERIC' },
  { value: 'REAL', label: 'REAL' },
  { value: 'BLOB', label: 'BLOB' },
  { value: 'INTEGER', label: 'INTEGER' },
];

const cellStyle = {
  display: 'flex',
  alignItems: 'center',
  height: '100%',
  width: '100%',
  fontSize: '110%',
  color: '#686868',
  border: 0
};


const tableStyle = {
  color: '#686868',
  backgroundColor: 'white',
};

// @TODO: Might map tableColumns data passed from falcon-core to this format
const data = [{
  name: 'username',
  autoIncrement: 'false',
  primaryKey: 'false',
  defaultTypeValue: 'TEXT',
  notNull: 'false',
  unique: 'true',
  default: 'foo',
  checkConstraints: 'true',
}, {
  name: 'password',
  autoIncrement: 'false',
  primaryKey: 'false',
  defaultTypeValue: 'TEXT',
  notNull: 'false',
  unique: 'true',
  default: 'bar',
  checkConstraints: 'true',
}];


type Props = {
  tablePromise: Promise<Array<TableColumnType>>
};

type State = {
  tableColumns: ?TableColumnType
};

export default class StructurePage extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      tableColumns: null
    };
  }

  async componentDidMount() {
    const tableColumns = await this.props.tablePromise;
    this.setState({ tableColumns });
  }

  async componentWillReceiveProps(nextProps: Props) {
    const tableColumns = await nextProps.tablePromise;
    this.setState({ tableColumns });
  }

  renderSelect = (cellInfo) => {
    const { tableColumns } = this.state;
    return (
      <span className="number">
        <Select
          name="form-field-name"
          value={tableColumns[cellInfo.index].type}
          onChange={(item) => {
              const newTableColumns = _.cloneDeep(this.state.tableColumns);
              newTableColumns[cellInfo.index].type = item.value;
              this.setState({
                tableColumns: newTableColumns
              });
            }}
          clearable={false}
            // Options contain Affinity types + column's current type
          options={_.unionWith(options, [{ label: tableColumns[cellInfo.index].type, value: tableColumns[cellInfo.index].type }], _.isEqual)}
        />
      </span>
    );
  }

  renderEditable = (cellInfo) => (
    <input style={cellStyle} value={cellInfo.value} />
  )

  render() {
    if (!this.state.tableColumns) return <div />;


    const { tableColumns } = this.state;
    const columns = [{
      accessor: 'cid',
      Header: 'Column ID',
      Cell: this.renderEditable
    }, {
      accessor: 'dflt_value',
      Header: 'Default',
      Cell: this.renderEditable
    }, {
      accessor: 'name',
      Header: 'Name',
      Cell: this.renderEditable
    }, {
      accessor: 'notnull',
      Header: 'Null',
      Cell: this.renderEditable
    },
    {
      accessor: 'pk',
      Header: 'Primary Key',
      Cell: this.renderEditable
    },
    {
      Header: 'Type',
      accessor: 'type',
      Cell: this.renderSelect
    }];
    return (
      <div className="Structure col-offset-2" >
        <ReactTable
          data={tableColumns}
          style={tableStyle}
          columns={columns}
          showPageJump={false}
          minRows={tableColumns.length}
          showPagination={false}
        />
      </div>
    );
  }
}
