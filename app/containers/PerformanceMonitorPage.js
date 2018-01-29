// @flow
import React, { Component } from 'react';
import { withScreenSize } from '@vx/responsive';
import Background from '../components/performance_monitor/background';
import BitcoinPrice from '../components/performance_monitor/bitcoinprice';

type Props = {
  screenHeight: number,
  screenWidth: number
};

type State = {};

class PerformanceMonitorPage extends Component<Props, State> {
  state = {
    data: {}
  }

  componentDidMount() {
    fetch('https://api.coindesk.com/v1/bpi/historical/close.json')
      .then(res => res.json())
      .then(json => this.setState({
        data: json
      }))
      .catch(console.log);
  }
  render() {
    const { screenWidth, screenHeight } = this.props;
    const { data } = this.state;
    return (
      <BitcoinPrice
        width={screenWidth}
        height={screenHeight}
        data={data}
        width={screenWidth}
        height={screenHeight}
      />
    );
  }
}

export default withScreenSize(PerformanceMonitorPage);
