import React from 'react';
import Extensions from '@jenkins-cd/js-extensions';
import {
    pipelineService,
    Paths,
    Fetch
} from '@jenkins-cd/blueocean-core-js';
import { observer } from 'mobx-react';

@observer
export class EnvironmentInfoPage extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
          foundDev:false,
          foundQA:false,
          foundProd:false,

          devBranch:"",
          devRun:"",
          devCommit:"",
          devStartTime:"",

          qaBranch:"",
          qaRun:"",
          qaCommit:"",
          qaStartTime:"",

          prodBranch:"",
          prodRun:"",
          prodCommit:"",
          prodStartTime:""
        };
    }

    generateApiUrl(organization, pipeline) {
        let baseUrl = "/jenkins/blue/rest/organizations/" + organization;
        let nestedPipeline = pipeline.split("/");
        for(var i = 0; i < nestedPipeline.length; i++) {
            baseUrl = baseUrl + "/pipelines/" + nestedPipeline[i];
        }

        return baseUrl;
    }

    componentDidMount() {
        var self = this;
        let organization = this.props.params.organization;
        let pipeline = this.props.params.pipeline;
        let baseUrl = this.generateApiUrl(organization, pipeline);
        Fetch.fetchJSON(baseUrl + "/runs/")
            .then(response => {
                for(var i = 0; i < response.length; i++) {
                    if(self.state.foundDev && self.state.foundQA && self.state.foundProd) { break; }
                    let branchName = response[i].pipeline;
                    let run = response[i].id;
                    let commit = response[i].commitId;
                    let startTime = response[i].startTime;
                    Fetch.fetchJSON(baseUrl + "/branches/" + branchName + "/runs/" + run + "/nodes/")
                    .then(stages => {
                        for(var j = 0; j < stages.length; j++) {
                            let stage = stages[j]
                            if(stage.displayName === "Development" && stage.result === "SUCCESS" && stage.state === "FINISHED" && !self.state.foundDev) {
                                self.setState({
                                    foundDev: true,
                                    devBranch: branchName,
                                    devRun: run,
                                    devCommit: commit,
                                    devStartTime: startTime,
                                });
                            }
                            if(stage.displayName === "QA" && stage.result === "SUCCESS" && stage.state === "FINISHED" && !self.state.foundQA) {
                                self.setState({
                                    foundQA: true,
                                    qaBranch: branchName,
                                    qaRun: run,
                                    qaCommit: commit,
                                    qaStartTime: startTime,
                                });
                            }
                            if(stage.displayName === "Production" && stage.result === "SUCCESS" && stage.state === "FINISHED" && !self.state.foundProd) {
                                self.setState({
                                    foundProd: true,
                                    prodBranch: branchName,
                                    prodRun: run,
                                    prodCommit: commit,
                                    prodStartTime: startTime,
                                });
                            }
                        }
                    }).catch(e => {
                        console.log(e);
                    });
                }
            }).catch(e => {
                console.log(e);
            });
    }

    render() {
        return (
            <div>
                <div>
                    <h1>Dev</h1>
                    <div>{this.state.devBranch} - {this.state.devRun}</div>
                    <div>{this.state.devCommit}</div>
                    <div>{this.state.devStartTime}</div>
                </div>
                <div>
                    <h1>QA</h1>
                    <div>{this.state.qaBranch} - {this.state.qaRun}</div>
                    <div>{this.state.qaCommit}</div>
                    <div>{this.state.qaStartTime}</div>
                </div>
                <div>
                    <h1>Prod</h1>
                    <div>{this.state.prodBranch} - {this.state.prodRun}</div>
                    <div>{this.state.prodCommit}</div>
                    <div>{this.state.prodStartTime}</div>
                </div>
            </div>
        );
    }
};