import { observable, action } from 'mobx';
import { Fetch, UrlConfig, AppConfig, sseConnection, PipelineService } from '@jenkins-cd/blueocean-core-js';

export class EnvironmentInfoService extends PipelineService {
    @observable
    environments;

    constructor() {

    }

    @action
    setEnvironments(environments) {
        this.environments = environments;
    }

    fetchEnvironmentInfo() {
    }
}

export default new EnvironmentInfoService();
