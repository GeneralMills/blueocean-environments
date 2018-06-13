import { observable, action } from 'mobx';
import { Fetch, UrlConfig, AppConfig } from '@jenkins-cd/blueocean-core-js';
require("babel-core/register");
require("babel-polyfill");

export class EnvironmentInfoService{
    @observable
    stages;

    constructor() {
        this.fetchEnvironmentInfo();
    }

    @action
    setStages(stages) {
        this.stages = stages;
    }

    async fetchEnvironmentInfo() {
        let response = await Fetch.fetchJSON(`${UrlConfig.getRestBaseURL()}/organizations/${AppConfig.getOrganizationName()}/environments/`);

        this.setStages(response.environments[0]);
    }
}

export default new EnvironmentInfoService();
