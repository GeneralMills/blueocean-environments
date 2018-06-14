export class PipelineEnvironment {
    constructor(stage, branch, run, startTime, startDateTime, momentDifference, url, commit) {
        this.stageName = stage;
        this.branch = branch;
        this.run = run;
        this.startTime = startTime;
        this.startDateTime = startDateTime;
        this.momentDifference = momentDifference;
        this.url = url;
        this.commit = commit;
    }

    stageName;
    branch;
    run;
    startTime;
    startDateTime;
    momentDifference;
    url;
    commit;
}