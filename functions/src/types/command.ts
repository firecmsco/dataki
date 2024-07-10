export interface CommandRequest {
  command: string;
  history?: Array<CommandMessage>;
}

export interface CommandMessage {
  text: string;
  user: "SYSTEM" | "USER";
}

