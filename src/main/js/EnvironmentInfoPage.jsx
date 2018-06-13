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

@observer
export class EnvironmentInfoPage extends React.Component {

    stageEnvironments = [];

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            pipeline: "",
            stagePipelineEnvironments: []
        };
    }

    generatePipelineUrl(organization, pipeline, branch, run) {
        let baseUrl = `${UrlConfig.getBlueOceanAppURL()}/organizations/${organization}/`;
        let nestedPipeline = pipeline.split("/");

        baseUrl = `${baseUrl}${nestedPipeline[nestedPipeline.length - 1]}`;
        baseUrl = `${baseUrl}/detail/${branch}/${run}/pipeline/`;

        return baseUrl;
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
        
        for (let branchJob of branchResponse) {
            let runResponse;
            let nodesResponse;

            for (let i = branchJob.latestRun.id; i > 0; i--) {
                // rest api works differently for multibranch pipelines
                if (isMultibranchPipeline) {
                    runResponse = await Fetch.fetchJSON(`${baseUrl}/branches/${branchJob.name}/runs/${i}`);
                    nodesResponse = await Fetch.fetchJSON(`${baseUrl}/branches/${branchJob.name}/runs/${i}/nodes/`);
                }
                else {
                    runResponse = await Fetch.fetchJSON(`${baseUrl}/runs/${i}/`);
                    nodesResponse = await Fetch.fetchJSON(`${baseUrl}/runs/${i}/nodes/`);
                }
    
                this.evaluateRunForEnvironments(runResponse, nodesResponse);
            }
        }

        if (branchResponse.length === 0) {
            this.setState({
                neverBeenRun: true
            });
        }

        this.setState({
            isLoading: false
        });
    }

    evaluateRunForEnvironments(run, stages) {
        let branchName = decodeURIComponent(run.name);
        
        let commit = run.commitId;
        let startTime = moment(new Date(run.startTime), "MM/DD/YYYY HH:mma");
        let now = moment(new Date(), "MM/DD/YYYY HH:mma");
        let difference = moment.duration(now.diff(startTime)).humanize();
        
        let pipelineUrl = this.generatePipelineUrl(this.props.params.organization, run.pipeline, encodeURIComponent(branchName), run.id);

        for (let stage of stages) {
            if (this.stageEnvironments.includes(stage.displayName.toLowerCase()) && stage.result === "SUCCESS" && stage.state === "FINISHED") {
                let pipelineEnvironmentStage = new PipelineEnvironment(stage.displayName, branchName, run, startTime.format("MM/DD/YYYY HH:mma"), difference, pipelineUrl, commit.substring(0, 6));
                
                let filteredEnvs = this.state.stagePipelineEnvironments.filter((stagePipelineEnvironment) => 
                    stagePipelineEnvironment.stageName == stage.displayName
                );

                if (filteredEnvs.length == 0) {
                    let temp = this.state.stagePipelineEnvironments;
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
                    <div className="branchRun"># {pipelineEnvironment.run}</div>
                </div>
                <div className="timeStamp"><span className="mega-octicon octicon-clock"></span>{pipelineEnvironment.startTime} ({pipelineEnvironment.difference} ago)</div>
                {pipelineEnvironment.commit && <div className="commitHash"><span className="mega-octicon octicon-code"></span>commit {pipelineEnvironment.commit}</div>}
                {pipelineEnvironment.url && <div className="pipelineText">View Pipeline</div>}
            </div>
        </a>
    }

    render() {
        const pipeline = this.props.params.pipeline;
        const organization = this.props.params.organization;
        const activityUrl = UrlUtils.buildPipelineUrl(this.props.params.organization, pipeline, 'activity');
        const branchesUrl = UrlUtils.buildPipelineUrl(this.props.params.organization, pipeline, 'branches');
        const prUrl = UrlUtils.buildPipelineUrl(this.props.params.organization, pipeline, 'pr');

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
                    <ExpandablePath path={pipeline} hideFirst className="dark-theme" iconSize={20} />
                </Link>
            </h1>
            <Extensions.Renderer extensionPoint="jenkins.pipeline.detail.header.action" store={this.context.store} pipeline={pipeline} />
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

