export interface AppSettings {
  branchForDeploy: {
    commonFrontend: string;
    sharedComponents: string;
  };
  githubAccessToken: string;
  githubOwner: string;
  commonFrontend: {
    sourceCode: string;
  };
  sharedComponents: {
    sourceCode: string;
    workflowPublishNpm: string;
    repository: string;
  };
}
