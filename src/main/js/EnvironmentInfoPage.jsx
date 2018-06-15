import React from 'react';
import moment from 'moment';
import { Link } from 'react-router';
import { observer } from 'mobx-react';
import Extensions from '@jenkins-cd/js-extensions';
import { WeatherIcon, ExpandablePath } from '@jenkins-cd/design-language';
import { Fetch, UrlConfig, capable, ContentPageHeader, pipelineService, Paths} from '@jenkins-cd/blueocean-core-js';
import * as UrlUtils from '@jenkins-cd/blueocean-core-js';
import { Icon } from '@jenkins-cd/react-material-icons'
import { PipelineEnvironment } from './PipelineEnvironment';
import environmentInfoService from './EnvironmentInfoService';
require("babel-core/register");
require("babel-polyfill");
require("browserify-sign");

@observer
export class EnvironmentInfoPage extends React.Component {
    stageEnvironments = [];
    matchedStageEnvironments = [];

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            pipeline: "",
            stagePipelineEnvironments: []
        };
    }

    async componentWillMount() {
        this.stageEnvironments = environmentInfoService.stages.split(",");
        let pipeline = this.props.params.pipeline;

        this.setState({
            activityUrl: `/jenkins/blue/organizations/${this.props.params.organization}/${pipeline}/activity/`,
        });
        const RestPaths = Paths.rest;
        const href = RestPaths.pipeline(this.props.params.organization, pipeline);
        let pipelineResponse = await pipelineService.fetchPipeline(href, { useCache: true, disableCapabilites: false });
        this.setState({
            pipelineObject: pipelineResponse,
            weatherScore: pipelineResponse.weatherScore
        });

        let pipelineRef = {
            organization: this.props.params.organization,
            pipeline: this.state.pipelineObject,
        };
        let baseUrl = UrlUtils.getRestUrl(pipelineRef);
        let typeResponse = await Fetch.fetchJSON(`${baseUrl}`);
        let isMultibranchPipeline = capable(typeResponse, 'io.jenkins.blueocean.rest.model.BlueMultiBranchPipeline');

        // Get the pipeline Runs
        let branchResponse = await Fetch.fetchJSON(`${baseUrl}/branches/`);
        let branchPromises = [];

        for (let branchJob of branchResponse) {
            branchPromises.push(this.evaluateBranch(baseUrl, branchJob, isMultibranchPipeline));
        }

        await Promise.all(branchPromises);

        if (branchResponse.length === 0 || this.matchedStageEnvironments.length === 0) {
            this.setState({
                neverBeenRun: true
            });
        }

        this.setState({
            isLoading: false
        });
    }

    generatePipelineUrl(organization, pipeline, branch, run) {
        let baseUrl = `${UrlConfig.getBlueOceanAppURL()}/organizations/${organization}/`;
        let nestedPipeline = pipeline.split("/");

        baseUrl = `${baseUrl}${nestedPipeline[nestedPipeline.length - 1]}`;
        baseUrl = `${baseUrl}/detail/${branch}/${run}/pipeline/`;

        return baseUrl;
    }

    async evaluateBranch(baseUrl, branchJob, isMultibranchPipeline) {
        let runResponse;
        let nodesResponse;
        let branchExhausted = false;

        for (let i = branchJob.latestRun.id; i > 0 && !branchExhausted; i--) {
            // rest api works differently for multibranch pipelines
            if (isMultibranchPipeline) {
                runResponse = await Fetch.fetchJSON(`${baseUrl}branches/${branchJob.name}/runs/${i}`);
                nodesResponse = await Fetch.fetchJSON(`${baseUrl}branches/${branchJob.name}/runs/${i}/nodes/`);
            }
            else {
                runResponse = await Fetch.fetchJSON(`${baseUrl}runs/${i}/`);
                nodesResponse = await Fetch.fetchJSON(`${baseUrl}runs/${i}/nodes/`);
            }

            this.evaluateRunForEnvironments(runResponse, nodesResponse);

            // Check if we have found a record for all environments
            if (this.matchedStageEnvironments.length === this.state.stagePipelineEnvironments.length) {
                let foundPotentialEnvironment = false;

                for (let stagePipelineEnvironment of this.state.stagePipelineEnvironments) {
                    if (stagePipelineEnvironment.startDateTime < runResponse.startTime) {
                        foundPotentialEnvironment = true;
                    }
                }

                branchExhausted = !foundPotentialEnvironment;
            }
        }
    }

    evaluateRunForEnvironments(run, nodes) {
        let branchName = decodeURIComponent(run.pipeline);
        
        let commit = run.commitId;

        let pipelineUrl = this.generatePipelineUrl(this.props.params.organization, this.props.params.pipeline, encodeURIComponent(branchName), run.id);

        for (let stage of nodes) {
            let stageTime = new Date(stage.startTime);
            stageTime.setMilliseconds(stageTime.getMilliseconds() + stage.durationInMillis);
            let stageTimeFormatted = moment(stageTime, "MM/DD/YYYY HH:mma");
            let now = moment(new Date(), "MM/DD/YYYY HH:mma");
            let difference = moment.duration(now.diff(stageTimeFormatted)).humanize();

            let isDeploymentStage = this.stageEnvironments.includes(stage.displayName.toLowerCase());
            
            if (!this.matchedStageEnvironments.includes(stage.displayName.toLowerCase()) && isDeploymentStage) {
                this.matchedStageEnvironments.push(stage.displayName.toLowerCase());
            }

            if (isDeploymentStage && stage.result === "SUCCESS" && stage.state === "FINISHED") {
                let pipelineEnvironmentStage = new PipelineEnvironment(stage.displayName, 
                                                                       branchName, 
                                                                       run.id, 
                                                                       stageTimeFormatted.format("MM/DD/YYYY HH:mma"), 
                                                                       stageTime,
                                                                       difference, 
                                                                       pipelineUrl, 
                                                                       commit.substring(0, 6));
                
                let filteredEnvs = this.state.stagePipelineEnvironments.filter((stagePipelineEnvironment) => 
                    stagePipelineEnvironment.stageName === stage.displayName
                );

                if (filteredEnvs.length === 0) {
                    let temp = this.state.stagePipelineEnvironments;
                    temp.push(pipelineEnvironmentStage);

                    this.setState({
                        stagePipelineEnvironments: temp
                    });
                }
                else if (filteredEnvs[0].startDateTime < pipelineEnvironmentStage.startDateTime) {
                    let temp = this.state.stagePipelineEnvironments;
                    temp.splice(temp.indexOf(filteredEnvs[0]), 1); // remove old pipeline environment

                    temp.push(pipelineEnvironmentStage);

                    this.setState({
                        stagePipelineEnvironments: temp
                    });
                }
            }
        }
    }

    pipelineEnvironment(pipelineEnvironment) {
        return <a href={pipelineEnvironment.url} target="_blank">
            <div className="header">
                <div>{pipelineEnvironment.stageName}</div>
            </div>
            <div className="body">
                <div className="branchInfo">
                    <span className="mega-octicon octicon-git-branch"></span>
                    <div className="branchName">{pipelineEnvironment.branch}</div>
                    <div className="branchRun">#{pipelineEnvironment.run}</div>
                </div>
                <div className="timeStamp"><span className="mega-octicon octicon-clock deploy-icon"></span>{pipelineEnvironment.startTime} ({pipelineEnvironment.momentDifference} ago)</div>
                {pipelineEnvironment.commit && <div className="commitHash"><span className="mega-octicon octicon-code deploy-icon"></span>commit {pipelineEnvironment.commit}</div>}
                {pipelineEnvironment.url && <div className="pipelineText">View Pipeline</div>}
            </div>
        </a>
    }

    render() {
        const activityUrl = UrlUtils.buildPipelineUrl(this.props.params.organization, this.props.params.pipeline, 'activity');
        const branchesUrl = UrlUtils.buildPipelineUrl(this.props.params.organization, this.props.params.pipeline, 'branches');
        const prUrl = UrlUtils.buildPipelineUrl(this.props.params.organization, this.props.params.pipeline, 'pr');

        const pageTabLinks = [
            <Link to={activityUrl}>Activity</Link>,
            <Link to={branchesUrl}>Branches</Link>,
            <Link to={prUrl}>Pull Requests</Link>,
        ];

        let pipelineRef = {
            organization: this.props.params.organization,
            pipeline: this.state.pipelineObject,
        };

        const baseUrl = UrlUtils.getRestUrl(pipelineRef);

        const classicConfigLink = <a href={UrlUtils.buildClassicConfigUrl(this.state.pipelineObject)} target="_blank"><Icon size={24} icon="settings" style={{ fill: '#fff' }} /></a>;

        const pageHeader = <ContentPageHeader pageTabBase={baseUrl} pageTabLinks={pageTabLinks}>
            <WeatherIcon score={this.state.weatherScore} />
            <h1>
                <Link to={activityUrl} query={location.query}>
                    <ExpandablePath path={this.props.params.pipeline} hideFirst className="dark-theme" iconSize={20} />
                </Link>
            </h1>
            <Extensions.Renderer extensionPoint="jenkins.pipeline.detail.header.action" store={this.context.store} pipeline={this.state.pipelineObject} />
            {classicConfigLink}
        </ContentPageHeader>;

        return (
            <div>
                {pageHeader}
                {this.state.isLoading && <div className="fullscreen blockscreen"></div>}
                {this.state.neverBeenRun && <div className="fullscreen blockscreen">
                    <main className="PlaceholderContent NoRuns u-fill u-fade-bottom mainPopupBox" style={{top:'72px;'}}>
                        <article>
                            <div className="PlaceholderDialog popupBox">
                                <h1 className="title titlePopupBox">This job has not been run</h1>
                                <button className="icon-button dark" onClick={() => location.href = this.state.activityUrl}>Run</button>
                            </div>
                        </article>
                    </main>
                </div>}
                <div className="container">
                    {this.state.stagePipelineEnvironments.map(this.pipelineEnvironment)}
                </div>
            </div>
        );
    }
};

