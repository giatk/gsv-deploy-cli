import { useCommonFrontend } from "../use-common-frontend";

async function main() {
  const { buildImageCommonFrontendAsync } = useCommonFrontend();

  await buildImageCommonFrontendAsync();
}

main();
