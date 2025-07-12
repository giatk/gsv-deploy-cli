import axios from "axios";
import { loadSettings } from "./utilities";
import { GitPullRequest } from "./models/git-pull-request.model";
import request, { gql, GraphQLClient } from "graphql-request";
import { GitWorkflowRun } from "./models";

export class GitHubService {
  private _setting = loadSettings();
  private readonly GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

  constructor() {
    axios.defaults.baseURL = "https://api.github.com";
    axios.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${this._setting.githubAccessToken}`;
      config.headers.Accept = "application/vnd.github+json";
      return config;
    });
  }

  getForDeployPullRequestAsync = async ({
    repository,
    branch,
    base = "develop",
  }: {
    repository: string;
    branch: string;
    base?: string;
  }) => {
    const { githubOwner } = this._setting;
    const url = `/repos/${githubOwner}/${repository}/pulls?state=open&head=${githubOwner}:${branch}&base=${base}`;
    const response = await axios.get(url, {
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    const pulls = response.data as GitPullRequest[];

    return pulls[0];
  };

  convertToDraftAndReadyForReviewAsync = async ({
    pullRequestNodeId,
  }: {
    pullRequestNodeId: string;
  }) => {
    const client = new GraphQLClient(this.GRAPHQL_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${this._setting.githubAccessToken}`,
      },
    });

    const convertToDraftMutation = gql`
      mutation {
        convertPullRequestToDraft(input: { pullRequestId: "${pullRequestNodeId}" }) {
          pullRequest {
            id
            isDraft
          }
        }
      }
    `;

    await client.request(convertToDraftMutation);

    const readyToReviewMutation = gql`
      mutation {
        markPullRequestReadyForReview(input: {
          pullRequestId: "${pullRequestNodeId}"
        }) {
          pullRequest {
            id
            isDraft
          }
        }
      }
    `;

    await client.request(readyToReviewMutation);
  };

  getWorkflowRunsAsync = async ({
    repository,
    workflowId,
  }: {
    repository: string;
    workflowId: string;
  }) => {
    const url = `/repos/${this._setting.githubOwner}/${repository}/actions/workflows/${workflowId}/runs`;
    const response = await axios.get(url);
    const workflowRuns = response.data.workflow_runs as GitWorkflowRun[];
    return workflowRuns;
  };
}
