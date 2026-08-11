export interface ValidateTokenResult {
  accessToken: string;
  user: {
    id: number;
    name: string;
    role: string;
    tenant: string;
  };
}
