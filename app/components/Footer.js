// @flow
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <div className="Footer">
      <div className="FooterButtonContainer">
        <div className="FooterButton FooterButton--active">
          <Link to="/login">Login</Link>
        </div>
        <div className="FooterButton">
          <Link to="/content">Content</Link>
        </div>
        <div className="FooterButton">
          <Link to="/query">Query</Link>
        </div>
        <div className="FooterButton">
          <Link to="/structure">Structure</Link>
        </div>
        <div className="FooterButton">
          <Link to="/graph">Graph</Link>
        </div>
        <div className="FooterButton">
          <Link to="/logs">Logs</Link>
        </div>
      </div>
    </div>
  );
}
