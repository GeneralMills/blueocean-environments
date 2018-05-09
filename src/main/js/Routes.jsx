import React from 'react';
import { Route } from 'react-router';
import { ExecutorInfoPage } from './ExecutorInfoPage';
import { EnvironmentInfoPage } from './EnvironmentInfoPage';

export default (
    <Route>
        <Route path="/organizations/:organization/executor-info" component={ExecutorInfoPage} />
        <Route path="/organizations/:organization/:pipeline/environment-info" component={EnvironmentInfoPage} />
    </Route>
);
