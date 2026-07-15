const API_URL = import.meta.env.VITE_API_URL ?? "/api";

export type AuthUser = {
  id: number;
  email: string;
  full_name: string;
  role: string;
};

export type AuthSession = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export async function getHealth(): Promise<{ status: string; service: string }> {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("API healthcheck failed");
  }

  return response.json();
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Credenciales invalidas");
  }

  return response.json();
}
