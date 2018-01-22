/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import ContentPage from './containers/ContentPage';
import StructurePage from './containers/StructurePage';
import LoginPage from './containers/LoginPage';
import QueryPage from './containers/QueryPage';
import GraphPage from './containers/GraphPage';

export default () => (
    <App>
      <Switch>
        <Route path="/content" component={ContentPage} />
        <Route path="/structure" component={StructurePage} />
        <Route path="/query" component={QueryPage} />
        <Route path="/graph" component={GraphPage} />
        <Route path="/" component={LoginPage}/>
      </Switch>
    </App>
);
