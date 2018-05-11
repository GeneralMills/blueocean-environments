import { observable, action } from 'mobx';
import { Fetch, UrlConfig, AppConfig } from '@jenkins-cd/blueocean-core-js';

export class EnvironmentInfoService{
    @observable
    devStages;
    @observable
    qaStages;
    @observable
    prodStages;

    constructor() {
        this.fetchEnvironmentInfo();
    }

    @action
    setDevStages(devStages) {
        this.devStages = devStages;
    }

    @action
    setQaStages(qaStages) {
        this.qaStages = qaStages;
    }

    @action
    setProdStages(prodStages) {
        this.prodStages = prodStages;
    }

    fetchEnvironmentInfo() {
        Fetch.fetchJSON(`${UrlConfig.getRestBaseURL()}/organizations/${AppConfig.getOrganizationName()}/environments/`)
        .then(response => {
            this.setDevStages(response.environments[0]);
            this.setQaStages(response.environments[1]);
            this.setProdStages(response.environments[2]);
        });
    }
}

export default new EnvironmentInfoService();
