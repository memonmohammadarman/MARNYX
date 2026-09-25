export type HealthResponse = {
  status: string;
  service: string;
  version: string;
};

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/health");

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}
