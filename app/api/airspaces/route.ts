// Server-side proxy for OpenAIP API — avoids CORS issues.
// The API key stays on the server and is never exposed to the browser.
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENAIP_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAIP API key not configured (OPENAIP_API_KEY)' },
      { status: 500 },
    );
  }

  const typeParams = [1, 2, 3, 4, 8].map((t) => `type[]=${t}`).join('&');
  const url =
    `https://api.openaip.net/api/airspaces?apiKey=${apiKey}` +
    `&page=1&limit=1000&country=CZ&${typeParams}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'x-openaip-api-key': apiKey },
    });
  } catch {
    return NextResponse.json(
      { error: 'Nepodařilo se připojit k OpenAIP API.' },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `OpenAIP error: ${res.status}` },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
