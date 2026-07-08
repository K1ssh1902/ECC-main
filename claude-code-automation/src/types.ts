export interface AutomationTask {
  id: string;
  prompt: string;
  scheduledTime: string; // HH:mm format (military time)
  projectDirectory: string;
  enabled: boolean;
  lastRunDate?: string; // YYYY-MM-DD
}
