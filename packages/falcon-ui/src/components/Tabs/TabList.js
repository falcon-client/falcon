import * as React from 'react';

type Props = {
  children: React.ReactNode,
  // className: string,
  // id: string, // private
  // selected: boolean, // private
  // selectedClassName: string,
  clientWidth: number,
  minTabWidth: number,
  maxTabWidth: number,
  tabOverlapDistance: number
  // tabId: string // private
};

export default class TabList extends React.Component<Props> {
  getTabWidth = (): number => {
    console.log('In get tabWidth');
    const tabsContentWidth =
      this.props.clientWidth - this.props.tabOverlapDistance;
    const width =
      tabsContentWidth / this.tabEls.length + this.props.tabOverlapDistance;
    return Math.max(
      this.props.minTabWidth,
      Math.min(this.props.maxTabWidth, width)
    );
  };

  getTabEffectiveWidth = () =>
    this.getTabWidth() - this.props.tabOverlapDistance;

  getTabPositions = () => {
    console.log('In getTabPositions');
    const tabEffectiveWidth = this.getTabEffectiveWidth();
    let left = 0;
    const positions = [];

    this.tabEls.forEach((tabEl, i) => {
      positions.push(left);
      left += tabEffectiveWidth;
    });
    return positions;
  };

  renderChildren = () =>
    React.Children.map(this.props.children, child => {
      console.log('In TabList.js');
      console.dir(child);
      return React.cloneElement(child, {});
    });

  render() {
    return (
      <div className="chrome-tabs">
        <div className="chrome-tabs-content">{this.renderChildren()}</div>
        <div className="chrome-tabs-bottom-bar" />
      </div>
    );
  }
}
