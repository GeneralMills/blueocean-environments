import React from 'react';
import { Route } from 'react-router';
import { EnvironmentInfoPage } from './EnvironmentInfoPage';

export default (
    <Route>
        <Route path="/organizations/:organization/:pipeline/environment-info" component={EnvironmentInfoPage} />
    </Route>
);
