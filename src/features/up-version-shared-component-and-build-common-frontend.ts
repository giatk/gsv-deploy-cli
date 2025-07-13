import { useCommonFrontend } from "../use-common-frontend";
import { GitHubService } from "../github.service";
import { useSharedComponents } from "../use-shared-components";
import { loadSettings, sleepAsync } from "../utilities";

async function main() {
  const { upVersionNpmPackageJson } = useSharedComponents();
  const {
    buildImageCommonFrontendAsync,
    upVersionSharedComponentInCommonFrontend,
  } = useCommonFrontend();
  upVersionNpmPackageJson();
  await sleepAsync(10 * 1000); //wait 10s to npm package build success.
  await upVersionSharedComponentInCommonFrontend();
  await buildImageCommonFrontendAsync();
}

main();
