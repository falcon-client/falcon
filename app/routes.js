/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';

// Routes to be rendered in root.js
export default () => (
  <App>
    <Switch>
      <Route exact strict component={HomePage} />
    </Switch>
  </App>
);
