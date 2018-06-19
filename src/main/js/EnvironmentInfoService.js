import { observable, action } from 'mobx';
import { Fetch, UrlConfig, AppConfig } from '@jenkins-cd/blueocean-core-js';

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

    fetchEnvironmentInfo() {
        Fetch.fetchJSON(`${UrlConfig.getRestBaseURL()}/organizations/${AppConfig.getOrganizationName()}/environments/`).then((response) => {
            this.setStages(response.environments[0]);
        });
    }
}

export default new EnvironmentInfoService();
