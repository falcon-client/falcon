import * as React from 'react';

type Props = {
  children: React.ReactNode,
  className: string,
  id: PropTypes.string, // private
  selected: PropTypes.bool, // private
  selectedClassName: PropTypes.string,
  tabId: PropTypes.string // private
};

export default class TabPanel extends React.Component<Props> {
  render() {
    return <div />;
  }
}
