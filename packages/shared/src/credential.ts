export interface Credential {
  id: string;
  name: string;
  type: string; // e.g. "httpBasicAuth", "openAiApi"
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialWithData extends Credential {
  data: Record<string, unknown>;
}
