export interface GitPullRequest {
  url: string;
  id: number;
  number: number;
  state: "open" | "closed" | "merged";
  title: string;
  locked: boolean;
  node_id: string;
}
