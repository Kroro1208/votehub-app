export interface NotificationType {
  id: number;
  user_id: string;
  type:
    | "nested_post_created"
    | "persuasion_time_started"
    | "vote_deadline_ended"
    | "persuasion_comment_posted"
    | "vote_received";
  title: string;
  message: string;
  post_id: number | null;
  nested_post_id: number | null;
  read: boolean;
  created_at: string;
}

export interface NotificationCreateParams {
  user_id: string;
  type: NotificationType["type"];
  title: string;
  message: string;
  post_id?: number;
  nested_post_id?: number;
}
