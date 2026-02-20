"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";
const TOKEN_KEY = "exam-token";

function isValidIpAddress(ip) {
  const ipv4 =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  const ipv6 =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::1|::|([0-9a-fA-F]{1,4}:){1,7}:|:([0-9a-fA-F]{1,4}:){1,7})$/;

  return ipv4.test(ip) || ipv6.test(ip);
}

async function apiRequest(endpoint, options = {}, token) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.message || body?.errors?.ip?.[0] || "Request failed.");
  }

  return body;
}

export default function Page() {
  const [token, setToken] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const [email, setEmail] = useState("exam.user@example.com");
  const [password, setPassword] = useState("Password123!");

  const [user, setUser] = useState(null);
  const [geo, setGeo] = useState(null);
  const [searchIp, setSearchIp] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  function showToast(message, type = "error") {
    setToast({ message, type });
  }

  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      setIsBooting(false);
      return;
    }

    void (async () => {
      try {
        const meResponse = await apiRequest("/me", { method: "GET" }, storedToken);

        setToken(storedToken);
        setUser(meResponse.user);
        await Promise.all([loadGeo(storedToken), loadHistory(storedToken)]);
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsBooting(false);
      }
    })();
  }, []);

  const mapLocation = useMemo(() => {
    if (!geo?.loc) {
      return null;
    }

    const [lat, lng] = geo.loc.split(",");
    if (!lat || !lng) {
      return null;
    }

    return { lat, lng };
  }, [geo]);

  async function loadGeo(currentToken, ip) {
    const geoResponse = await apiRequest(
      `/geo${ip ? `?ip=${encodeURIComponent(ip)}` : ""}`,
      { method: "GET" },
      currentToken,
    );
    setGeo(geoResponse.data);
  }

  async function loadHistory(currentToken) {
    const historyResponse = await apiRequest("/history", { method: "GET" }, currentToken);
    setHistory(historyResponse.history);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setToast(null);
    setIsBusy(true);

    try {
      const loginResponse = await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      window.localStorage.setItem(TOKEN_KEY, loginResponse.token);
      setToken(loginResponse.token);
      setUser(loginResponse.user);
      setSearchIp("");
      await Promise.all([loadGeo(loginResponse.token), loadHistory(loginResponse.token)]);
    } catch (caughtError) {
      showToast(caughtError instanceof Error ? caughtError.message : "Login failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSearch(event) {
    event.preventDefault();

    if (!token) {
      return;
    }

    const trimmedIp = searchIp.trim();

    if (!trimmedIp || !isValidIpAddress(trimmedIp)) {
      showToast("Please enter a valid IPv4 or IPv6 address.");
      return;
    }

    setToast(null);
    setIsBusy(true);

    try {
      await loadGeo(token, trimmedIp);
      await loadHistory(token);
    } catch (caughtError) {
      showToast(caughtError instanceof Error ? caughtError.message : "Search failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleClearSearch() {
    if (!token) {
      return;
    }

    setSearchIp("");
    setToast(null);
    setIsBusy(true);

    try {
      await loadGeo(token);
    } catch (caughtError) {
      showToast(caughtError instanceof Error ? caughtError.message : "Unable to clear search.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogout() {
    if (!token) {
      return;
    }

    try {
      await apiRequest("/logout", { method: "POST" }, token);
    } catch {
    }

    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setGeo(null);
    setHistory([]);
    setSelectedHistoryIds([]);
    setSearchIp("");
    setToast(null);
  }

  async function handleBulkDeleteHistory() {
    if (!token || selectedHistoryIds.length === 0) {
      return;
    }

    setIsBusy(true);
    setToast(null);

    try {
      await apiRequest(
        "/history",
        {
          method: "DELETE",
          body: JSON.stringify({ ids: selectedHistoryIds }),
        },
        token,
      );

      setSelectedHistoryIds([]);
      await loadHistory(token);
      showToast("Selected history deleted.", "success");
    } catch (caughtError) {
      showToast(caughtError instanceof Error ? caughtError.message : "Unable to delete history.");
    } finally {
      setIsBusy(false);
    }
  }

  function handleHistoryClick(item) {
    setGeo(item.payload);
    setSearchIp(item.ip);
    setToast(null);
  }

  function toggleHistorySelection(id) {
    setSelectedHistoryIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  if (isBooting) {
    return (
      <>
        {toast ? (
          <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-lg border border-rose-300/50 bg-rose-950/90 px-4 py-2 text-sm text-rose-100 shadow-lg backdrop-blur">
            {toast.message}
          </div>
        ) : null}
        <main className="min-h-screen px-6 py-10 text-slate-100">
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-300/20 bg-slate-900/60 p-8 backdrop-blur">
            Checking session...
          </div>
        </main>
      </>
    );
  }

  if (!token || !user) {
    return (
      <>
        {toast ? (
          <div
            className={`fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-lg border px-4 py-2 text-sm shadow-lg backdrop-blur ${
              toast.type === "error"
                ? "border-rose-300/50 bg-rose-950/90 text-rose-100"
                : "border-emerald-300/50 bg-emerald-950/90 text-emerald-100"
            }`}
          >
            {toast.message}
          </div>
        ) : null}
        <main className="min-h-screen px-6 py-10 text-slate-100">
          <section className="mx-auto mt-16 w-full max-w-md rounded-2xl border border-slate-300/20 bg-slate-900/65 p-8 shadow-2xl backdrop-blur">
            <h1 className="text-2xl font-semibold">Starry Geo Login</h1>
            <p className="mt-2 text-sm text-slate-300">
              Sign in to view your IP geolocation and run IP-based lookups.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleLogin}>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-200">Email</span>
                <input
                  className="w-full rounded-lg border border-slate-300/30 bg-slate-950/70 px-3 py-2 outline-none ring-0 focus:border-cyan-300"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-slate-200">Password</span>
                <input
                  className="w-full rounded-lg border border-slate-300/30 bg-slate-950/70 px-3 py-2 outline-none ring-0 focus:border-cyan-300"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <button
                className="w-full rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isBusy}
              >
                {isBusy ? "Signing in..." : "Login"}
              </button>
            </form>

            <p className="mt-4 text-xs text-slate-300">
              Seeder credentials: <strong>exam.user@example.com / Password123!</strong>
            </p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      {toast ? (
        <div
          className={`fixed left-1/2 top-5 z-50 -translate-x-1/2 rounded-lg border px-4 py-2 text-sm shadow-lg backdrop-blur ${
            toast.type === "error"
              ? "border-rose-300/50 bg-rose-950/90 text-rose-100"
              : "border-emerald-300/50 bg-emerald-950/90 text-emerald-100"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
      <main className="min-h-screen px-6 py-8 text-slate-100">
        <section className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-300/20 bg-slate-900/65 p-6 backdrop-blur">
          <header className="flex flex-col gap-3 border-b border-slate-300/20 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Starry Geo Dashboard</h1>
              <p className="text-sm text-slate-300">Logged in as {user.email}</p>
            </div>
            <button
              className="rounded-lg border border-slate-300/40 px-4 py-2 text-sm hover:bg-slate-800/70"
              onClick={() => void handleLogout()}
              type="button"
            >
              Logout
            </button>
          </header>

          <form className="mt-5 flex flex-col gap-3 md:flex-row" onSubmit={handleSearch}>
            <input
              className="w-full rounded-lg border border-slate-300/30 bg-slate-950/70 px-3 py-2 outline-none focus:border-cyan-300"
              placeholder="Enter IPv4 or IPv6 address"
              value={searchIp}
              onChange={(event) => setSearchIp(event.target.value)}
            />
            <div className="flex gap-3">
              <button
                className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={isBusy}
              >
                Search
              </button>
              <button
                className="rounded-lg border border-slate-300/40 px-4 py-2 hover:bg-slate-800/70"
                onClick={() => void handleClearSearch()}
                type="button"
                disabled={isBusy}
              >
                Clear
              </button>
            </div>
          </form>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <article className="rounded-xl border border-slate-300/20 bg-slate-950/55 p-4">
              <h2 className="mb-3 text-lg font-semibold">Geolocation</h2>
              {geo ? (
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-slate-400">IP</dt>
                  <dd>{geo.ip ?? "-"}</dd>
                  <dt className="text-slate-400">City</dt>
                  <dd>{geo.city ?? "-"}</dd>
                  <dt className="text-slate-400">Region</dt>
                  <dd>{geo.region ?? "-"}</dd>
                  <dt className="text-slate-400">Country</dt>
                  <dd>{geo.country ?? "-"}</dd>
                  <dt className="text-slate-400">Coordinates</dt>
                  <dd>{geo.loc ?? "-"}</dd>
                  <dt className="text-slate-400">Org</dt>
                  <dd className="truncate">{geo.org ?? "-"}</dd>
                  <dt className="text-slate-400">Postal</dt>
                  <dd>{geo.postal ?? "-"}</dd>
                  <dt className="text-slate-400">Timezone</dt>
                  <dd>{geo.timezone ?? "-"}</dd>
                </dl>
              ) : (
                <p className="text-sm text-slate-300">No data loaded yet.</p>
              )}
            </article>

            <article className="rounded-xl border border-slate-300/20 bg-slate-950/55 p-4">
              <h2 className="mb-3 text-lg font-semibold">Map</h2>
              {mapLocation ? (
                <iframe
                  title="IP location map"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(mapLocation.lng) - 0.15}%2C${Number(mapLocation.lat) - 0.15}%2C${Number(mapLocation.lng) + 0.15}%2C${Number(mapLocation.lat) + 0.15}&layer=mapnik&marker=${mapLocation.lat}%2C${mapLocation.lng}`}
                  className="h-64 w-full rounded-lg border border-slate-300/20"
                />
              ) : (
                <p className="text-sm text-slate-300">
                  Search an IP with valid coordinates to pin a location.
                </p>
              )}
            </article>
          </div>

          <section className="mt-6 rounded-xl border border-slate-300/20 bg-slate-950/55 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Search History</h2>
              <button
                className="rounded-lg border border-rose-300/50 px-3 py-1 text-sm text-rose-200 hover:bg-rose-950/40 disabled:opacity-40"
                type="button"
                disabled={selectedHistoryIds.length === 0 || isBusy}
                onClick={() => void handleBulkDeleteHistory()}
              >
                Delete Selected
              </button>
            </div>

            {history.length === 0 ? (
              <p className="text-sm text-slate-300">No search history yet.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto pr-1">
                <ul className="space-y-2">
                  {history.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-slate-300/20 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedHistoryIds.includes(item.id)}
                          onChange={() => toggleHistorySelection(item.id)}
                        />
                        <button
                          className="text-left hover:text-cyan-300"
                          type="button"
                          onClick={() => handleHistoryClick(item)}
                        >
                          <div className="text-sm font-medium">{item.ip}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(item.created_at).toLocaleString()} • {item.payload.city ?? "Unknown"},{" "}
                            {item.payload.country ?? "--"}
                          </div>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}
