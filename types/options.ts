export enum StageEnvironment {
    DEV = 'Dev',
    QA = 'Qa',
    STAGING = 'Staging',
    PROD = 'Prod',
    LOCAL = 'Local',
}

export type Options = {
    defaultRegion: string,
    stackNamePrefix: string,
    stackName: string,
    codeCommitAccount: string,
    toolsAccount: string,
    reposName: string,
    devAccount: string,
    qaAccount: string,
    stagingAccount: string,
    productionAccount: string,
    cdkBootstrapQualifier: string,
    pipelineName: string,
};