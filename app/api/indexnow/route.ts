import { NextResponse } from "next/server";

const BASE_URL    = "https://www.leashly.dev";
const INDEXNOW_KEY = "bb149e02314a49ef97036b68d89ffd79";
const KEY_LOCATION = `${BASE_URL}/${INDEXNOW_KEY}.txt`;

const URLS_TO_SUBMIT = [
  BASE_URL,
  `${BASE_URL}/docs`,
  `${BASE_URL}/register`,
  `${BASE_URL}/login`,
  `${BASE_URL}/privacy`,
  `${BASE_URL}/terms`,
];

// Submit to both Bing and IndexNow (Yandex, Seznam, Naver all use same endpoint)
const ENGINES = [
  "https://www.bing.com/indexnow",
  "https://api.indexnow.org/indexnow",
];

export async function POST() {
  const body = {
    host:        "www.leashly.dev",
    key:         INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList:     URLS_TO_SUBMIT,
  };

  const results = await Promise.allSettled(
    ENGINES.map(engine =>
      fetch(engine, {
        method:  "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body:    JSON.stringify(body),
      }).then(r => ({ engine, status: r.status }))
    )
  );

  const summary = results.map((r, i) =>
    r.status === "fulfilled"
      ? { engine: ENGINES[i], status: r.value.status }
      : { engine: ENGINES[i], error: String((r as PromiseRejectedResult).reason) }
  );

  return NextResponse.json({ submitted: URLS_TO_SUBMIT.length, results: summary });
}

// GET — just returns current status / info
export async function GET() {
  return NextResponse.json({
    key:         INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urls:        URLS_TO_SUBMIT,
    engines:     ENGINES,
    usage:       "POST /api/indexnow to submit all pages to Bing + IndexNow",
  });
}
