import axios from "axios";
import {
  formatElapsed,
  waitUntilAsync,
  loadSettings,
  printElapsedTime,
  sleepAsync,
} from "./utilities";
import { useSharedComponents } from "./publish-shared-components";
import { execSync } from "child_process";
import { GitWorkflowRun } from "./models";
import { GitPullRequest } from "./models/git-pull-request.model";
import { GitHubService } from "./github.service";
import path from "path";
import * as fs from "fs";

const useCommonFrontend = () => {
  const githubService = new GitHubService();
  const setting = loadSettings();
  const { getLatestTagVersion, getSharedComponentsName } =
    useSharedComponents();

  const getSharedComponentLatestWorkflowRunAsync = async () => {
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

  const getLatestForDeployWorkflowRunNumberAsync = async () => {
    const { stopPrintElapsedTime } = printElapsedTime({
      withMessage: (seconds) =>
        `Waiting to common-frontend is built to docker image (${formatElapsed(
          seconds * 1000
        )})... `,
    });
    const latestRun = await waitUntilAsync({
      duration: setting.pollingTime,
      runAsync: async () => {
        const workflowRuns = await githubService.getWorkflowRunsAsync({
          repository: setting.commonFrontend.repository,
          workflowId: setting.commonFrontend.workflowBuildDockerImage,
        });

        let forDeployWorkflows = workflowRuns.filter(
          (x) => x.head_branch === setting.branchForDeploy.commonFrontend
        );
        forDeployWorkflows = forDeployWorkflows.sort(
          (a, b) => b.run_number - a.run_number
        );

        const latestRun = forDeployWorkflows[0];

        if (latestRun.status === "completed") {
          return latestRun.run_number;
        }
      },
    });
    stopPrintElapsedTime();
    return latestRun;
  };

  const getCommonFrontendVersion = () => {
    const packageJsonPath = path.join(
      setting.commonFrontend.sourceCode,
      "package.json"
    );
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, "utf-8")
    ) as {
      version: string;
    };
    return packageJson.version;
  };

  const waitUntilPublishedSharedComponentAsync = async () => {
    const { stopPrintElapsedTime } = printElapsedTime({
      withMessage: (seconds) =>
        `Waiting to shared-components is published in npm package (${formatElapsed(
          seconds * 1000
        )})...`,
    });
    const publishedVersion = await waitUntilAsync({
      duration: setting.pollingTime,
      timeout: 30 * 60 * 1000,
      runAsync: async () => {
        const currentRun = await getSharedComponentLatestWorkflowRunAsync();
        const isPublished = currentRun?.status === "completed";
        if (isPublished) {
          return currentRun?.head_branch;
        }
      },
      whenTimeout: () => {
        console.log(
          `Waiting to shared-components is published in npm package (TIMEOUT)... `
        );
      },
    });

    stopPrintElapsedTime();
    return publishedVersion;
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

    console.log(
      `Convert to draft & Ready for review in branch '${setting.branchForDeploy.commonFrontend}'`
    );
    await githubService.convertToDraftAndReadyForReviewAsync({
      pullRequestNodeId: forDeployPr.node_id,
    });
    await sleepAsync(10 * 1000);
    const commonFrontendMajorVersion = getCommonFrontendVersion();
    const commonFrontendDevVersion =
      await getLatestForDeployWorkflowRunNumberAsync();

    console.log("---");
    console.log(
      `[Build] common-frontend ${commonFrontendMajorVersion}-dev-${commonFrontendDevVersion}`
    );
  };

  return {
    buildImageCommonFrontendAsync,
    getForDeployPullRequestAsync,
    getLatestForDeployWorkflowRunNumberAsync,
  };
};

export { useCommonFrontend };
