export type User = {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
};

export type Token = {
  access_token: string;
  token_type: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  full_name: string;
};

