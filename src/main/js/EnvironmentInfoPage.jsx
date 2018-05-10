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
        let promises = [];
        Fetch.fetchJSON(baseUrl + "/runs/")
            .then(response => {
                for(var i = 0; i < response.length; i++) {
                     let branchName = response[i].pipeline;
                     let run = response[i].id;
                     promises.push(Fetch.fetchJSON(baseUrl + "/branches/" + branchName + "/runs/" + run + "/nodes/"));
                }
                Promise.all(promises).then(pipelines => {
                     let x = 0;
                     for(var j = 0; j < pipelines.length; j++) {
                        let branchName = response[x].pipeline;
                        let run = response[x].id;
                        let commit = response[x].commitId;
                        let startTime = response[x].startTime;
                        let stages = pipelines[j];
                        for(var k = 0; k < stages.length; k++) {
                            let stage = stages[k]
                            if(stage.displayName === "Development" && stage.result === "SUCCESS" && stage.state === "FINISHED") {
                                self.setState({
                                    foundDev: true,
                                    devBranch: branchName,
                                    devRun: run,
                                    devCommit: commit,
                                    devStartTime: startTime,
                                });
                            }
                            if(stage.displayName === "QA" && stage.result === "SUCCESS" && stage.state === "FINISHED") {
                                self.setState({
                                    foundQA: true,
                                    qaBranch: branchName,
                                    qaRun: run,
                                    qaCommit: commit,
                                    qaStartTime: startTime,
                                });
                            }
                            if(stage.displayName === "Production" && stage.result === "SUCCESS" && stage.state === "FINISHED") {
                                self.setState({
                                    foundProd: true,
                                    prodBranch: branchName,
                                    prodRun: run,
                                    prodCommit: commit,
                                    prodStartTime: startTime,
                                });
                            }
                        }
                        x++;
                     }
                }).catch(e => {
                    console.log(e);
                });
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