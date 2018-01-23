/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import LoginPage from './containers/LoginPage';
<<<<<<< HEAD
import QueryPage from './containers/QueryPage';
import GraphPage from './containers/GraphPage';
=======
>>>>>>> ContentPage, Content, and Grid are passed state.selectedTable

// Routes to be rendered in root.js
export default () => (
  <App>
    <Switch>
      <Route exact path="/" component={LoginPage} />
      <Route path="/home" component={HomePage} />
    </Switch>
  </App>
);
