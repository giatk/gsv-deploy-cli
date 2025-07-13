import { loadSettings, processExecSync } from "./utilities";
import * as fs from "fs";
import path from "path";

export const useSharedComponents = () => {
  const setting = loadSettings();

  const getLatestTagVersion = () => {
    const tagsOutput = processExecSync(
      `cd "${setting.sharedComponents.sourceCode}" && git pull && git tag`,
      { skipConsoleLog: true }
    );

    const tagPattern = /\d+\.\d+\.\d+\-next\.\d+/i;

    const tags = tagsOutput
      .split("\n")
      .filter((text) => tagPattern.test(text.trim()))
      .sort((a, b) => {
        //TODO: Update sort
        return (
          +a.split(".")[a.split(".").length - 1] -
          +b.split(".")[b.split(".").length - 1]
        );
      })
      .reverse();
    return tags[0].trim() ?? "1.0.0-next.1";
  };

  const getNextVersion = () => {
    const latestTag = getLatestTagVersion();
    const tagStr = latestTag.split(".");

    tagStr[tagStr.length - 1] = +tagStr[tagStr.length - 1] + 1 + "";

    return tagStr.join(".");
  };

  const upVersionNpmPackageJson = () => {
    const currentBranch = processExecSync(
      `cd "${setting.sharedComponents.sourceCode}" && git rev-parse --abbrev-ref HEAD`
    );
    if (currentBranch.trim() !== setting.branchForDeploy.sharedComponents) {
      console.log(
        `Current branch of 'shared-components' is \'${currentBranch.trim()}\'`
      );
      processExecSync(
        `cd "${setting.sharedComponents.sourceCode}" && git checkout "${setting.branchForDeploy.sharedComponents}"`
      );
    }

    processExecSync(`cd "${setting.sharedComponents.sourceCode}" && git pull`);

    const packageJsonPath = path.join(
      setting.sharedComponents.sourceCode,
      "package.json"
    );
    const packageJson = fs.readFileSync(packageJsonPath, "utf-8").split("\n");

    const versionIdx = packageJson.findIndex((s) =>
      s.trim().startsWith('"version":')
    );

    const nextVersion = getNextVersion();
    packageJson[versionIdx] = `  "version": "${nextVersion}",`;

    fs.writeFileSync(packageJsonPath, packageJson.join("\n"), "utf-8");

    console.log(`Upgrading shared-components to version \'${nextVersion}\'`);

    processExecSync(
      `cd "${setting.sharedComponents.sourceCode}"
            && git add package.json
            && git commit -m "[Up version] ${nextVersion}"
            && git push && git tag ${nextVersion}
            && git push origin ${nextVersion}`
    );
  };

  const getSharedComponentsName = () => {
    const packageJsonPath = path.join(
      setting.sharedComponents.sourceCode,
      "package.json"
    );
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, "utf-8")
    ) as {
      name: string;
    };

    return packageJson.name;
  };

  return {
    getLatestTagVersion,
    upVersionNpmPackageJson,
    getSharedComponentsName,
  };
};
