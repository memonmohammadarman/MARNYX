export type HealthResponse = {
  status: string;
  service: string;
  version: string;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type AuthResponse = {
  user: User;
  session: Session;
};

type ApiErrorResponse = {
  error?: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => null)) as
    | (T & ApiErrorResponse)
    | null;

  if (!response.ok) {
    throw new Error(
      data && typeof data.error === "string"
        ? data.error
        : `API request failed with status ${response.status}`,
    );
  }

  return data as T;
}

export function getHealth(): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health");
}

export function getCurrentUser(): Promise<{ user: User }> {
  return request<{ user: User }>("/api/auth/me");
}

export function register(
  email: string,
  password: string,
  name: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      name: name.trim() || undefined,
    }),
  });
}

export function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function logout(): Promise<void> {
  return request<void>("/api/auth/logout", {
    method: "POST",
  });
}
