import { useCommonFrontend } from "./build-common-frontend";
import { useSharedComponents } from "./publish-shared-components";
import { loadSettings } from "./utilities";

async function main() {
  const { upVersionNpmPackageJson } = useSharedComponents();
  const { buildImageCommonFrontendAsync } = useCommonFrontend();
  upVersionNpmPackageJson();
  await buildImageCommonFrontendAsync();
}

main();
