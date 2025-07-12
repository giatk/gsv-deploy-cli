import { useCommonFrontend } from "./build-common-frontend";
import { GitHubService } from "./github.service";
import { useSharedComponents } from "./publish-shared-components";
import { loadSettings } from "./utilities";

async function main() {
  const { upVersionNpmPackageJson } = useSharedComponents();
  const { buildImageCommonFrontendAsync, getForDeployPullRequestAsync } =
    useCommonFrontend();
  // upVersionNpmPackageJson();
  // await buildImageCommonFrontendAsync();
  const pr = await getForDeployPullRequestAsync();
  const service = new GitHubService();
  const _setting = loadSettings();
  await service.convertToDraftAndReadyForReviewAsync({
    pullRequestNodeId: pr.node_id,
  });
}

main();
