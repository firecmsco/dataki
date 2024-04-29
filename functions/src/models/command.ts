export interface CommandRequest {
  command: string;
  useStreaming?: boolean;
  history?: Array<CommandMessage>;
}

export interface CommandMessage {
  text: string;
  user: "SYSTEM" | "USER";
}

export type DataContext = Array<{data: object[], collection: string}>;
