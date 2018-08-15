import * as React from 'react';

type Props = {
  children: React.ReactNode,
  className: string
};

export default class TabList extends React.Component<Props> {
  render = () => (
    <div className={className} role="tablist">
      {children}
    </div>
  );
}
