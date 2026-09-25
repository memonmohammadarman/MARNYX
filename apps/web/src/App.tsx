import { useEffect, useState } from "react";
import { getHealth, type HealthResponse } from "./services/api";

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unknown error");
      });
  }, []);

  return (
    <main>
      <h1>MARNYX</h1>

      <p>Frontend is running.</p>

      {health && (
        <p>
          API: {health.status} · {health.service} · v{health.version}
        </p>
      )}

      {error && <p>API error: {error}</p>}
    </main>
  );
}

export default App; 
