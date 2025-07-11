export interface GitWorkflowRun {
  id: number;
  name: string;
  node_id: string;
  head_branch: string;
  display_title: string;
  run_number: number;
  event: string;
  status: "completed" | "pending";
  conclusion: "success" | "error";
  workflow_id: number;
  url: string;
  html_url: string;
}
