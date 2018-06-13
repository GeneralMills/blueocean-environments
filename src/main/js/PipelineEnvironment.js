export class PipelineEnvironment {
    constructor(stage, branch, run, startTime, momentDifference, url, commit) {
        this.stageName = stage;
        this.branch = branch;
        this.run = run;
        this.startTime = startTime;
        this.momentDifference = momentDifference;
        this.url = url;
        this.commit = commit;
    }

    stageName;
    branch;
    run;
    startTime;
    momentDifference;
    url;
    commit;
}