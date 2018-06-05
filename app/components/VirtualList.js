// @flow
/* eslint no-bitwise: 0, no-mixed-operators: 0 */
import React, { Component } from 'react';

const styleInner = {
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  minHeight: '100%'
};
const styleContent = {
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  width: '100%',
  overflow: 'visible'
};

type Props = {
  data: Array<any>,
  rowHeight: number,
  renderRow: () => void,
  sync: boolean,
  overscanCount: number
};

type State = {
  height: number,
  offset: number
};

/** Virtual list, renders only visible items.
 *	@param {Array<*>} data         List of data items
 *	@param {Function} renderRow    Renders a single row
 *	@param {Number} rowHeight      Static height of a row
 *	@param {Number} overscanCount  Amount of rows to render above and below visible area of the list
 *	@param {Boolean} [sync=false]  true forces synchronous rendering
 *	@example
 *		<VirtualList
 *			data={['a', 'b', 'c']}
 *			renderRow={ row => <div>{row}</div> }
 *			rowHeight={22}
 *			sync
 *		/>
 */
export default class VirtualList extends Component<Props, State> {
  static defaultProps = {
    sync: false
  };

  state = {
    height: 0,
    offset: 0
  };

  resize() {
    if (this.state) {
      if (this.state.height !== this.base.offsetHeight) {
        this.setState({ height: this.base.offsetHeight });
      }
    }
  }

  handleScroll() {
    this.setState({ offset: this.base.scrollTop });
    if (this.props.sync) this.forceUpdate();
  }

  componentDidMount() {
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  componentDidUpdate() {
    this.resize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
  }

  render() {
    const {
      data,
      rowHeight,
      renderRow,
      overscanCount = 10,
      sync,
      ...props
    } = this.props;
    const { offset, height } = this.state;

    // first visible row index
    let start = (offset / rowHeight) | 0;

    // actual number of visible rows (without overscan)
    let visibleRowCount = (height / rowHeight) | 0;

    // Overscan: render blocks of rows modulo an overscan row count
    // This dramatically reduces DOM writes during scrolling
    if (overscanCount) {
      start = Math.max(0, start - (start % overscanCount));
      visibleRowCount += overscanCount;
    }

    // last visible + overscan row index
    const end = start + 1 + visibleRowCount;

    // data slice currently in viewport plus overscan items
    const selection = data.slice(start, end);

    return (
      <div
        ref={input => {
          this.base = input;
        }}
        onScroll={() => this.handleScroll()}
        {...props}
      >
        <div style={{ ...styleInner, height: `${data.length * rowHeight}px` }}>
          <div style={{ ...styleContent, top: `${start * rowHeight}px` }}>
            {selection.map(renderRow)}
          </div>
        </div>
      </div>
    );
  }
}
