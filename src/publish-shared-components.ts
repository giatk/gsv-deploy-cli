import { readSettings } from "./utilities";
import { execSync } from "child_process";
import * as fs from "fs";
import path from "path";

const setting = readSettings();

const getLatestTagVersion = () => {
  const tagsOutput = execSync(
    `cd "${setting.sourceCode.sharedComponents}" && git pull && git tag`,
    {
      encoding: "utf-8",
    }
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
  const currentBranch = execSync(
    `cd "${setting.sourceCode.sharedComponents}" && git rev-parse --abbrev-ref HEAD`,
    { encoding: "utf-8" }
  );
  if (currentBranch.trim() !== setting.branchForDeploy.sharedComponents) {
    console.log(`Current branch is \'${currentBranch.trim()}\'`);
    execSync(
      `cd "${setting.sourceCode.sharedComponents}" && git checkout "${setting.branchForDeploy.sharedComponents}"`
    );
  }

  const packageJsonPath = path.join(
    setting.sourceCode.sharedComponents,
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

  execSync(
    `cd "${setting.sourceCode.sharedComponents}"
        && git add package.json
        && git commit -m "[Up version] ${nextVersion}"
        && git push && git tag ${nextVersion}
        && git push origin ${nextVersion}`.replaceAll("\n", " "),
    { encoding: "utf-8" }
  );
};

upVersionNpmPackageJson();
