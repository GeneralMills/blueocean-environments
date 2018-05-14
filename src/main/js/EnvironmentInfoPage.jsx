import React from 'react';
import environmentInfoService from './EnvironmentInfoService';
import moment from 'moment';
import { Fetch, UrlConfig } from '@jenkins-cd/blueocean-core-js';
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
            devUrl:"",

            qaBranch:"",
            qaRun:"",
            qaCommit:"",
            qaStartTime:"",
            qaUrl:"",

            prodBranch:"",
            prodRun:"",
            prodCommit:"",
            prodStartTime:"",
            prodUrl:""
        };
    }

    generateApiUrl(organization, pipeline) {
        let baseUrl = `${UrlConfig.getRestBaseURL()}/organizations/${organization}`;
        let nestedPipeline = pipeline.split("/");
        for(var i = 0; i < nestedPipeline.length; i++) {
            baseUrl = `${baseUrl}/pipelines/${nestedPipeline[i]}`;
        }

        return baseUrl;
    }

    generatePipelineUrl(organization, pipeline, branch, run) {
        let baseUrl = `${UrlConfig.getBlueOceanAppURL()}/organizations/${organization}/`;
        let nestedPipeline = pipeline.split("/");
        for(var i = 0; i < nestedPipeline.length - 1; i++) {
            baseUrl = `${baseUrl}${nestedPipeline[i]}%2F`;
        }
        baseUrl = `${baseUrl}${nestedPipeline[nestedPipeline.length - 1]}`;
        baseUrl = `${baseUrl}/detail/${branch}/${run}/pipeline/`;

        return baseUrl;
    }

    componentDidMount() {
        var self = this;
        let organization = this.props.params.organization;
        let devStages = environmentInfoService.devStages.split(",");
        let qaStages = environmentInfoService.qaStages.split(",");
        let prodStages = environmentInfoService.prodStages.split(",");
        let pipeline = this.props.params.pipeline;
        let baseUrl = this.generateApiUrl(organization, pipeline);
        let promises = [];
        Fetch.fetchJSON(`${baseUrl}/runs/`)
            .then(response => {
                for(var i = 0; i < response.length; i++) {
                     let branchName = response[i].pipeline;
                     let run = response[i].id;
                     promises.push(Fetch.fetchJSON(`${baseUrl}/branches/${branchName}/runs/${run}/nodes/`));
                }
                Promise.all(promises).then(pipelines => {
                     let x = 0;
                     for(var j = 0; j < pipelines.length; j++) {
                        let branchName = response[x].pipeline;
                        let run = response[x].id;
                        let commit = response[x].commitId;
                        let startTime = moment(new Date(response[x].startTime)).format("MM/DD/YYYY HH:mma Z");
                        let stages = pipelines[j];
                        let pipelineUrl = this.generatePipelineUrl(this.props.params.organization, this.props.params.pipeline, branchName, run);
                        for(var k = 0; k < stages.length; k++) {
                            let stage = stages[k]
                            if(devStages.includes(stage.displayName) && stage.result === "SUCCESS" && stage.state === "FINISHED" && !self.state.foundDev) {
                                self.setState({
                                    foundDev: true,
                                    devBranch: branchName,
                                    devRun: run,
                                    devCommit: commit.substring(0, 6),
                                    devStartTime: startTime,
                                    devUrl: pipelineUrl,
                                });
                            }
                            if(qaStages.includes(stage.displayName) && stage.result === "SUCCESS" && stage.state === "FINISHED" && !self.state.foundQA) {
                                self.setState({
                                    foundQA: true,
                                    qaBranch: branchName,
                                    qaRun: run,
                                    qaCommit: commit.substring(0, 6),
                                    qaStartTime: startTime,
                                    qaUrl: pipelineUrl,
                                });
                            }
                            if(prodStages.includes(stage.displayName) && stage.result === "SUCCESS" && stage.state === "FINISHED" && !self.state.foundProd) {
                                self.setState({
                                    foundProd: true,
                                    prodBranch: branchName,
                                    prodRun: run,
                                    prodCommit: commit.substring(0, 6),
                                    prodStartTime: startTime,
                                    prodUrl: pipelineUrl,
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
            <div className="container">
                <div>
                    <div className="header">
                        <div>Development</div>
                    </div>
                    <a href={`${this.state.devUrl}`} target="_blank">
                        <div className="body">
                            <div className="branch">{this.state.devBranch} {this.state.devRun}</div>
                            <div className="time">{this.state.devStartTime}</div>
                            <div className="commit">commit {this.state.devCommit}</div>
                            <div className="pipelineText">View Pipeline</div>
                        </div>
                    </a>
                </div>
                <div>
                    <div className="header">
                        <div>QA</div>
                    </div>
                    <a href={`${this.state.qaUrl}`} target="_blank">
                        <div className="body">
                            <div className="branch">{this.state.qaBranch} {this.state.qaRun}</div>
                            <div className="time">{this.state.qaStartTime}</div>
                            <div className="commit">commit {this.state.qaCommit}</div>
                            <div className="pipelineText">View Pipeline</div>
                        </div>
                    </a>
                </div>
                <div>
                    <div className="header">
                        <div>Production</div>
                    </div>
                    <a href={`${this.state.prodUrl}`} target="_blank">
                        <div className="body">
                            <div className="branch">{this.state.prodBranch} {this.state.prodRun}</div>
                            <div className="time">{this.state.prodStartTime}</div>
                            <div className="commit">commit {this.state.prodCommit}</div>
                            <div className="pipelineText">View Pipeline</div>
                        </div>
                    </a>
                </div>
            </div>
        );
    }
};