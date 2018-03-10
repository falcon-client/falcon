// @flow
import React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  pathname: string,
  offset: number
};

// @TODO: Clean this up with <NavLink>
const activeFooterButton = 'FooterButton FooterButton--active';
const footerButton = 'FooterButton';

export default function Footer(props: Props) {
  return (
    <div className="Footer" style={{ left: props.offset }}>
      <div className="FooterButtonContainer">
        <div
          className={
            props.pathname === '/login' ? activeFooterButton : footerButton
          }
        >
          <Link to="/login">Login</Link>
        </div>
        <div
          className={
            props.pathname === '/content' ? activeFooterButton : footerButton
          }
        >
          <Link to="/content">Content</Link>
        </div>
        <div
          className={
            props.pathname === '/query' ? activeFooterButton : footerButton
          }
        >
          <Link to="/query">Query</Link>
        </div>
        <div
          className={
            props.pathname === '/structure' ? activeFooterButton : footerButton
          }
        >
          <Link to="/structure">Structure</Link>
        </div>
        <div
          className={
            props.pathname === '/graph' ? activeFooterButton : footerButton
          }
        >
          <Link to="/graph">Graph</Link>
        </div>
      </div>
    </div>
  );
}
