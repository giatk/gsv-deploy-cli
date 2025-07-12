import axios from "axios";
import { loadSettings, sleepAsync } from "./utilities";
import { useSharedComponents } from "./publish-shared-components";
import { execSync } from "child_process";
import { GitWorkflowRun } from "./models";
import { GitPullRequest } from "./models/git-pull-request.model";
import { GitHubService } from "./github.service";

const useCommonFrontend = () => {
  const githubService = new GitHubService();
  const setting = loadSettings();
  const { getLatestTagVersion, getSharedComponentsName } =
    useSharedComponents();

  const getSharedComponentWorkflowRunAsync = async () => {
    const workflowRuns = await githubService.getWorkflowRunsAsync({
      repository: setting.sharedComponents.repository,
      workflowId: setting.sharedComponents.workflowPublishNpm,
    });
    const latestVersion = getLatestTagVersion();
    const currentRun = workflowRuns.find(
      (r) => r.head_branch === latestVersion
    );
    return currentRun;
  };

  const waitUntilPublishedSharedComponentAsync = async () => {
    let isPublished = false;
    const TIME_OUT = 30; //minutes
    let minuteCount = 0;
    do {
      console.log(
        `Waiting to shared-components is published in npm package (${minuteCount} minutes)... `
      );
      const currentRun = await getSharedComponentWorkflowRunAsync();
      isPublished = currentRun?.status === "completed";

      if (isPublished) {
        return currentRun?.head_branch;
      }
      minuteCount++;
      await sleepAsync(1000 * 60);
    } while (!isPublished && minuteCount < TIME_OUT);
    console.log(
      `Waiting to shared-components is published in npm package (TIMEOUT)... `
    );
    return undefined;
  };

  const upVersionSharedComponentInCommonFrontend = async (
    sharedComponentVersion: string
  ) => {
    const currentBranch = execSync(
      `cd "${setting.commonFrontend.sourceCode}" && git rev-parse --abbrev-ref HEAD`,
      { encoding: "utf-8" }
    );
    if (currentBranch.trim() !== setting.branchForDeploy.commonFrontend) {
      console.log(
        `Current branch of 'common-frontend' is \'${currentBranch.trim()}\'`
      );
      execSync(
        `cd "${setting.commonFrontend.sourceCode}" && git checkout "${setting.branchForDeploy.commonFrontend}"`
      );
    }

    execSync(`cd "${setting.commonFrontend.sourceCode}" && git pull`);

    const sharedComponentsName = getSharedComponentsName();

    const installSharedComponentsCmd = `cd "${setting.commonFrontend.sourceCode}" && npm i ${sharedComponentsName}@${sharedComponentVersion}`;
    console.log(installSharedComponentsCmd);
    execSync(installSharedComponentsCmd);

    const gitPushCmd = `cd "${setting.commonFrontend.sourceCode}"
              && git add package.json
              && git add package-lock.json
              && git commit -m "[Up version shared-components] ${sharedComponentVersion}"
              && git push`
      .replaceAll(/\s+/g, " ")
      .trim();
    console.log(gitPushCmd);
    execSync(gitPushCmd, { encoding: "utf-8" });
  };

  const getForDeployPullRequestAsync = async () => {
    return await githubService.getForDeployPullRequestAsync({
      repository: setting.commonFrontend.repository,
      branch: setting.branchForDeploy.commonFrontend,
    });
  };

  const buildImageCommonFrontendAsync = async () => {
    const sharedVersion = await waitUntilPublishedSharedComponentAsync();
    if (!sharedVersion) {
      console.error(
        "Something went wrong! Not found shared-components new version."
      );
      return;
    }

    await upVersionSharedComponentInCommonFrontend(sharedVersion);
    const forDeployPr = await githubService.getForDeployPullRequestAsync({
      branch: setting.branchForDeploy.commonFrontend,
      repository: setting.commonFrontend.repository,
    });
    await githubService.convertToDraftAndReadyForReviewAsync({
      pullRequestNodeId: forDeployPr.node_id,
    });
  };

  return {
    buildImageCommonFrontendAsync,
    getForDeployPullRequestAsync,
  };
};

export { useCommonFrontend };
