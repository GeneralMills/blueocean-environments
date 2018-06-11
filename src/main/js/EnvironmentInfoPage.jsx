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
        let organization = this.props.params.organization;
        let stageEnvironments = environmentInfoService.stages.split(",");
        let pipeline = this.props.params.pipeline;
        let promises = [];
        this.setState({
            activityUrl: `/jenkins/blue/organizations/${organization}/${pipeline}/activity/`,
        });
        const RestPaths = Paths.rest;
        const href = RestPaths.pipeline(organization, pipeline);
        let pipelineResponse = await pipelineService.fetchPipeline(href, { useCache: true, disableCapabilites: false });
        this.setState({
            pipelineObject: pipelineResponse,
            weatherScore: pipelineResponse.weatherScore
        });

        let pipelineRef = {
            organization: organization,
            pipeline: this.state.pipelineObject,
        };
        let baseUrl = UrlUtils.getRestUrl(pipelineRef);
        let typeResponse = await Fetch.fetchJSON(`${baseUrl}`);
        let isMultibranchPipeline = capable(typeResponse, 'io.jenkins.blueocean.rest.model.BlueMultiBranchPipeline');

        // Get the pipeline Runs
        let runResponse = await Fetch.fetchJSON(`${baseUrl}/runs/`);
        
        for (let run of runResponse) {
            // rest api works differently for multibranch pipelines
            if (isMultibranchPipeline) {
                promises.push(Fetch.fetchJSON(`${baseUrl}/branches/${run.pipeline}/runs/${run.id}/nodes/`));
            }
            else {
                promises.push(Fetch.fetchJSON(`${baseUrl}/runs/${run.id}/nodes/`));
            }
        }

        if (runResponse.length === 0) {
            this.setState({
                neverBeenRun: true
            });
        }

        // Get the stages of each run
        let pipelines = await Promise.all(promises);
        let x = 0;
        
        for (let stages of pipelines) {
            let branchName = decodeURIComponent(runResponse[x].pipeline);
            let run = runResponse[x].id;
            let commit = runResponse[x].commitId;
            let startTime = moment(new Date(runResponse[x].startTime), "MM/DD/YYYY HH:mma");
            let now = moment(new Date(), "MM/DD/YYYY HH:mma");
            let difference = moment.duration(now.diff(startTime)).humanize();
            
            let pipelineUrl = this.generatePipelineUrl(organization, pipelineResponse.fullName, encodeURIComponent(branchName), run);

            for (let stage of stages) {
                if (stageEnvironments.includes(stage.displayName.toLowerCase()) && stage.result === "SUCCESS" && stage.state === "FINISHED") {
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
            x++;
        }
        this.setState({
            isLoading: false
        });
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
                <div className="timeStamp">{pipelineEnvironment.startTime} ({pipelineEnvironment.difference} ago)</div>
                {pipelineEnvironment.commit && <div className="commitHash">commit {pipelineEnvironment.commit}</div>}
                {pipelineEnvironment.url && <div className="pipelineText">View Pipeline</div>}
            </div>
        </a>
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

        let pipelineRef = {
            organization: organization,
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

