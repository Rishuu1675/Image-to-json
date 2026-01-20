import { useEffect, useMemo, useRef, useState } from "react";

function isImageFile(file) {
  return Boolean(file?.type?.startsWith("image/"));
}

function App() {
  const fileInputRef = useRef(null);
  const pendingAutoSubmitRef = useRef(false);
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [responseJson, setResponseJson] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showFullResponse, setShowFullResponse] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onPickFile = (picked) => {
    setError("");
    setResponseJson(null);
    setCopied(false);
    setShowFullResponse(false);

    if (!picked) {
      setFile(null);
      return;
    }

    if (!isImageFile(picked)) {
      setFile(null);
      setError("Please select an image file (jpg/png/webp/etc).");
      return;
    }

    const maxBytes = 10 * 1024 * 1024;
    if (picked.size > maxBytes) {
      setFile(null);
      setError("Image is too large. Please choose a file under 10MB.");
      return;
    }

    setFile(picked);
  };

  const onSubmit = async (pickedFile) => {
    const fileToUpload = pickedFile || file;
    if (!fileToUpload || isLoading) return;

    setIsLoading(true);
    setError("");
    setResponseJson(null);
    setCopied(false);
    setShowFullResponse(false);

    try {
      const formData = new FormData();
      formData.append("image", fileToUpload);

      const base = apiBaseUrl.replace(/\/$/, "");
      const url = base ? `${base}/api/image` : "/api/image";

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          json?.error || json?.message || `Request failed (${response.status})`;
        setError(message);
        setResponseJson(json);
        return;
      }

      setResponseJson(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const extractOrPick = () => {
    if (isLoading) return;

    if (!file) {
      pendingAutoSubmitRef.current = true;
      fileInputRef.current?.click();
      return;
    }

    onSubmit(file);
  };

  const copyJson = async () => {
    if (!responseJson) return;
    try {
      const payload =
        responseJson?.data ?? responseJson?.raw_text ?? responseJson;
      const textToCopy =
        typeof payload === "string"
          ? payload
          : JSON.stringify(payload, null, 2);
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const copyFullResponse = async () => {
    if (!responseJson) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(responseJson, null, 2),
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Gemini Image → JSON Extractor
          </h1>
          <p className="text-pretty text-sm text-slate-300 sm:text-base">
            Upload an image, send it to your backend, and render the JSON
            response.
            <span className="ml-2 text-slate-400">
              Endpoint: POST /api/image
            </span>
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Upload</h2>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const picked = e.target.files?.[0] || null;
                  onPickFile(picked);

                  if (
                    pendingAutoSubmitRef.current &&
                    picked &&
                    isImageFile(picked)
                  ) {
                    pendingAutoSubmitRef.current = false;
                    onSubmit(picked);
                  } else {
                    pendingAutoSubmitRef.current = false;
                  }
                }}
              />
            </div>

            <div
              className={[
                "mt-4 rounded-2xl border border-dashed p-5 transition",
                isDragging
                  ? "border-indigo-400 bg-indigo-500/10"
                  : "border-slate-700 bg-slate-950/20",
              ].join(" ")}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                onPickFile(dropped || null);
              }}
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  fileInputRef.current?.click();
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-slate-100">
                    Drag & drop your image here
                  </p>
                  <p className="text-xs text-slate-400">
                    or click to browse (max 10MB)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    extractOrPick();
                  }}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading
                    ? "Extracting…"
                    : file
                      ? "Extract JSON"
                      : "Choose image & Extract"}
                </button>
              </div>

              {file ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onPickFile(null);
                    }}
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>

            {previewUrl ? (
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-200">
                    Preview
                  </h3>
                  <span className="text-xs text-slate-500">Local preview</span>
                </div>
                <div className="mt-2 overflow-hidden rounded-2xl border border-slate-800 bg-black/30">
                  <img
                    src={previewUrl}
                    alt="Selected preview"
                    className="h-72 w-full object-contain sm:h-80"
                    draggable={false}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/20 p-4 text-sm text-slate-400">
                Select an image to see a preview.
              </div>
            )}

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">Response</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyJson}
                  disabled={!responseJson}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950/20 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {copied ? "Copied" : "Copy output"}
                </button>
              </div>
            </div>

            <div className="mt-4">
              {!responseJson ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-6 text-sm text-slate-400">
                  Upload an image and click “Extract JSON” to see the backend
                  response.
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/30">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={[
                          "rounded-full px-2 py-1 text-xs font-semibold",
                          responseJson?.success
                            ? "bg-emerald-500/15 text-emerald-200"
                            : "bg-slate-700/50 text-slate-200",
                        ].join(" ")}
                      >
                        {responseJson?.success ? "Success" : "Response"}
                      </span>
                      <p className="truncate text-sm text-slate-300">
                        {responseJson?.message || "Output"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFullResponse((v) => !v)}
                      className="rounded-xl border border-slate-700 bg-slate-950/20 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                    >
                      {showFullResponse
                        ? "Hide full response"
                        : "Show full response"}
                    </button>
                  </div>

                  <div className="p-4">
                    {responseJson?.data ? (
                      <>
                        <p className="mb-2 text-xs font-medium tracking-wide text-slate-400">
                          EXTRACTED DATA
                        </p>
                        <pre className="max-h-128 overflow-auto rounded-xl border border-slate-800 bg-black/20 p-3 text-xs leading-relaxed text-slate-200 sm:text-sm">
                          {JSON.stringify(responseJson.data, null, 2)}
                        </pre>
                      </>
                    ) : responseJson?.raw_text ? (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="text-xs font-medium tracking-wide text-amber-200">
                          RAW TEXT (PARSING FAILED)
                        </p>
                        <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-amber-100">
                          {String(responseJson.raw_text)}
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="mb-2 text-xs font-medium tracking-wide text-slate-400">
                          OUTPUT
                        </p>
                        <pre className="max-h-128 overflow-auto rounded-xl border border-slate-800 bg-black/20 p-3 text-xs leading-relaxed text-slate-200 sm:text-sm">
                          {JSON.stringify(responseJson, null, 2)}
                        </pre>
                      </>
                    )}

                    {showFullResponse ? (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-xs font-medium tracking-wide text-slate-400">
                            FULL RESPONSE
                          </p>
                          <button
                            type="button"
                            onClick={copyFullResponse}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800"
                          >
                            Copy full
                          </button>
                        </div>
                        <pre className="max-h-128 overflow-auto rounded-xl border border-slate-800 bg-black/20 p-3 text-xs leading-relaxed text-slate-200 sm:text-sm">
                          {JSON.stringify(responseJson, null, 2)}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Dev tip: this frontend calls{" "}
              <span className="font-mono">/api</span> which is proxied to
              <span className="font-mono"> http://localhost:3000</span>.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
