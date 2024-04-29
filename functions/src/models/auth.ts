export interface DecodedToken {
  [key: string]: any;
  aud: string; // this is the project id
  auth_time?: number;
  email?: string;
  email_verified?: boolean;
  exp: number;
  iat: number;
  iss: string;
  phone_number?: string;
  picture?: string;
  sub: string;
  uid: string;
}

export interface ServiceAccount {
  type: string,
  project_id: string,
  private_key_id: string,
  private_key: string,
  client_email: string,
  client_id: string,
  auth_uri: string,
  token_uri: string,
  auth_provider_x509_cert_url: string,
  client_x509_cert_url: string,
  universe_domain: string
}
