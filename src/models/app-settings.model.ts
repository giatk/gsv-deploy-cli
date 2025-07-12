export interface AppSettings {
  branchForDeploy: {
    commonFrontend: string;
    sharedComponents: string;
  };
  githubAccessToken: string;
  githubOwner: string;
  commonFrontend: {
    sourceCode: string;
    repository: string;
    workflowBuildDockerImage: string;
  };
  sharedComponents: {
    sourceCode: string;
    workflowPublishNpm: string;
    repository: string;
  };
}
