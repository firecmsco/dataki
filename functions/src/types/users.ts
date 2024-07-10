export type User = {
    id: string;
    email: string;
    name: string;
    picture: string;
    credentials: Credentials;
    roles: string[];
    lastLogin: number;
    createdAt: number;
    updatedAt: number;
}

export type Credentials = {
    refresh_token: string;
    expiry_date: number;
    access_token: string;
    token_type: string;
    id_token: string;
    scope: string;
}
