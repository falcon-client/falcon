// @flow
import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  pathname: string,
  offset: number,
  hasActiveConnection?: boolean
};

// @TODO: Clean this up with <NavLink>
const activeFooterButton = 'FooterButton FooterButton--active';
const footerButton = 'FooterButton';

const footerStyles = {
  // display: 'flex',
  // justifyContent: 'space-between'
};

export default function Footer(props: Props) {
  if (!props.hasActiveConnection) {
    return <div />;
  }
  return (
    <div className="Footer" style={{ ...footerStyles, left: props.offset }}>
      <div className="FooterButtonContainer">
        <div
          className={
            props.pathname === '/content' ? activeFooterButton : footerButton
          }
        >
          <Link to="/content">Content</Link>
        </div>
        <div
          className={
            props.pathname === '/structure' ? activeFooterButton : footerButton
          }
        >
          <Link to="/structure">Structure</Link>
        </div>
      </div>
      <div
        className="FooterButtonContainer"
        style={{ ...footerStyles, left: props.offset }}
      >
        <div
          className={
            props.pathname === '/query' ? activeFooterButton : footerButton
          }
        >
          <Link to="/query">Query</Link>
        </div>
        <div
          className={
            props.pathname === '/graph' ? activeFooterButton : footerButton
          }
        >
          <Link to="/graph">Graph</Link>
        </div>
        <div
          className={
            props.pathname === '/logs' ? activeFooterButton : footerButton
          }
        >
          <Link to="/logs">Logs</Link>
        </div>
      </div>
    </div>
  );
}

Footer.defaultProps = {
  hasActiveConnection: false
};
