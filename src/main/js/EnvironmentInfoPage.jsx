import React from 'react';
import moment from 'moment';
import { Link } from 'react-router';
import { observer } from 'mobx-react';
import Extensions from '@jenkins-cd/js-extensions';
import { TabLink, WeatherIcon, ExpandablePath } from '@jenkins-cd/design-language';
import { Fetch, AppConfig, UrlConfig, capable, ContentPageHeader, Security, pipelineService, Paths} from '@jenkins-cd/blueocean-core-js';
import environmentInfoService from './EnvironmentInfoService';
import * as UrlUtils from '@jenkins-cd/blueocean-core-js';
import { Icon } from '@jenkins-cd/react-material-icons'

@observer
export class EnvironmentInfoPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
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

    isMultibranchPipeline(organization, pipeline)
    {
        let baseUrl = this.generateApiUrl(organization, pipeline);
        Fetch.fetchJSON(baseUrl).then(response => {
            return response.class;
        });
        return false;
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
        self.setState({
            activityUrl: `/jenkins/blue/organizations/${organization}/${pipeline}/activity/`,
        });

        const RestPaths = Paths.rest;
        const href = RestPaths.pipeline(organization, pipeline);
        pipelineService.fetchPipeline(href, { useCache: true, disableCapabilites: false }).then(pipeline => {
                  this.setState({
                        pipelineObject: pipeline});
          }).catch(e => {
            console.log(e);
          });

        //Get the pipeline object as a whole
        Fetch.fetchJSON(`${baseUrl}`)
            .then(response => {
                let isMultibranchPipeline = capable(response, 'io.jenkins.blueocean.rest.model.BlueMultiBranchPipeline');

                //Get the pipeline Runs
                Fetch.fetchJSON(`${baseUrl}/runs/`)
                    .then(response => {
                        for(var i = 0; i < response.length; i++) {
                            let branchName = response[i].pipeline;
                            let run = response[i].id;

                            //rest api works differently for multibranch pipelines
                            if(isMultibranchPipeline) {
                                promises.push(Fetch.fetchJSON(`${baseUrl}/branches/${branchName}/runs/${run}/nodes/`));
                            }
                            else {
                                promises.push(Fetch.fetchJSON(`${baseUrl}/runs/${run}/nodes/`));
                            }
                        }

                        if(response.length === 0) {
                            self.setState({
                                neverBeenRun: true
                            });
                        }

                        //Get the stages of each run
                        Promise.all(promises).then(pipelines => {
                             let x = 0;
                             for(var j = 0; j < pipelines.length; j++) {
                                if(self.state.foundDev && self.state.foundQA && self.state.foundProd) {
                                    self.setState({
                                        isLoading: false
                                    });
                                    return;
                                }
                                let branchName = response[x].pipeline;
                                let run = response[x].id;
                                let commit = response[x].commitId;
                                let startTime = moment(new Date(response[x].startTime)).format("MM/DD/YYYY HH:mma Z");
                                let stages = pipelines[j];
                                let pipelineUrl = this.generatePipelineUrl(this.props.params.organization, this.props.params.pipeline, branchName, run);
                                for(var k = 0; k < stages.length; k++) {
                                    let stage = stages[k]
                                    if(devStages.includes(stage.displayName.toLowerCase()) && stage.result === "SUCCESS" && stage.state === "FINISHED" && !self.state.foundDev) {
                                        self.setState({
                                            foundDev: true,
                                            devBranch: branchName,
                                            devRun: run,
                                            devStartTime: startTime,
                                            devUrl: pipelineUrl,
                                        });

                                        //Non multibranch pipelines don't keep track of commits
                                        if(commit) {
                                            self.setState({
                                                devCommit: commit.substring(0, 6)
                                            });
                                        }
                                    }
                                    if(qaStages.includes(stage.displayName.toLowerCase()) && stage.result === "SUCCESS" && stage.state === "FINISHED" && !self.state.foundQA) {
                                        self.setState({
                                            foundQA: true,
                                            qaBranch: branchName,
                                            qaRun: run,
                                            qaStartTime: startTime,
                                            qaUrl: pipelineUrl,
                                        });

                                        if(commit) {
                                            self.setState({
                                                qaCommit: commit.substring(0, 6)
                                            });
                                        }
                                    }
                                    if(prodStages.includes(stage.displayName.toLowerCase()) && stage.result === "SUCCESS" && stage.state === "FINISHED" && !self.state.foundProd) {
                                        self.setState({
                                            foundProd: true,
                                            prodBranch: branchName,
                                            prodRun: run,
                                            prodStartTime: startTime,
                                            prodUrl: pipelineUrl,
                                        });

                                        if(commit) {
                                            self.setState({
                                                prodCommit: commit.substring(0, 6)
                                            });
                                        }
                                    }
                                }
                                x++;
                             }
                             self.setState({
                                 isLoading: false
                             });
                        }).catch(e => {
                            console.log(e);
                            self.setState({
                                isLoading: false
                            });
                        });
                    }).catch(e => {
                        console.log(e);
                        self.setState({
                            isLoading: false
                        });
                    });
                }).catch(e => {
                    console.log(e);
                    self.setState({
                        isLoading: false
                    });
                });
    }

    render() {
        const pipeline = this.props.params.pipeline;
        const organization = this.props.params.organization;
        const activityUrl = UrlUtils.buildPipelineUrl(organization, pipeline, 'activity');
        const branchesUrl = UrlUtils.buildPipelineUrl(organization, pipeline, 'branches');
        const prUrl = UrlUtils.buildPipelineUrl(organization, pipeline, 'pr');

        const pageTabLinks = [
            <Link to={activityUrl}>Activity</Link>,
            <Link to={branchesUrl}>Branches</Link>,
            <Link to={prUrl}>Pull Requests</Link>,
        ];
        const baseUrl = this.generatePipelineUrl(organization, pipeline);

        const classicConfigLink = <a href={UrlUtils.buildClassicConfigUrl(this.state.pipelineObject)} target="_blank"><Icon size={24} icon="settings" style={{ fill: '#fff' }} /></a>;


        const pageHeader =
            <ContentPageHeader pageTabBase={baseUrl} pageTabLinks={pageTabLinks}>
                <WeatherIcon score={this.state.pipeline.weatherScore} />
                <h1>
                    <Link to={activityUrl} query={location.query}>
                        <ExpandablePath path={pipeline} hideFirst className="dark-theme" iconSize={20} />
                    </Link>
                </h1>
               <Extensions.Renderer extensionPoint="jenkins.pipeline.detail.header.action" store={this.context.store} pipeline={pipeline} />
               {classicConfigLink}
           </ContentPageHeader>

        return (
            <div>
                {pageHeader}
                {this.state.isLoading ? <div className="fullscreen blockscreen"></div> : null}
                {this.state.neverBeenRun ? <div className="fullscreen blockscreen">
                    <main className="PlaceholderContent NoRuns u-fill u-fade-bottom mainPopupBox" style={{top:'72px;'}}>
                        <article>
                            <div className="PlaceholderDialog popupBox">
                                <h1 className="title titlePopupBox">This job has not been run</h1>
                                <button className="icon-button dark" onClick={() => location.href = this.state.activityUrl}>Run</button>
                            </div>
                        </article>
                    </main>
                </div> : null}
                <div className="container">
                    <div>
                         <a href={`${this.state.devUrl}`} target="_blank">
                            <div className="header">
                                <div>Development</div>
                            </div>
                            <div className="body">
                                <div className="branchName">{this.state.devBranch} {this.state.devRun}</div>
                                <div className="timeStamp">{this.state.devStartTime}</div>
                                {this.state.devCommit ? <div className="commitHash">commit {this.state.devCommit}</div> : null}
                                {this.state.devUrl ? <div className="pipelineText">View Pipeline</div> : null}
                            </div>
                         </a>
                    </div>
                    <div>
                        <a href={`${this.state.qaUrl}`} target="_blank">
                            <div className="header">
                                <div>QA</div>
                            </div>
                            <div className="body">
                                <div className="branchName">{this.state.qaBranch} {this.state.qaRun}</div>
                                <div className="timeStamp">{this.state.qaStartTime}</div>
                                {this.state.qaCommit ? <div className="commitHash">commit {this.state.qaCommit}</div> : null}
                                {this.state.qaUrl ? <div className="pipelineText">View Pipeline</div> : null}
                            </div>
                        </a>
                    </div>
                    <div>
                        <a href={`${this.state.prodUrl}`} target="_blank">
                            <div className="header">
                                <div>Production</div>
                            </div>
                            <div className="body">
                                <div className="branchName">{this.state.prodBranch} {this.state.prodRun}</div>
                                <div className="timeStamp">{this.state.prodStartTime}</div>
                                {this.state.prodCommit ? <div className="commitHash">commit {this.state.prodCommit}</div> : null}
                                {this.state.prodUrl ? <div className="pipelineText">View Pipeline</div> : null}
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        );
    }
};

