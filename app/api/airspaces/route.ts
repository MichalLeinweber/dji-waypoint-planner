// Server-side proxy for OpenAIP API — avoids CORS issues.
// The API key stays on the server and is never exposed to the browser.
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENAIP_API_KEY;

  console.log('OPENAIP key exists:', !!apiKey, 'length:', apiKey?.length);

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 },
    );
  }

  try {
    const typeParams = [1, 2, 3, 4, 8].map((t) => `type[]=${t}`).join('&');
    const url =
      `https://api.openaip.net/api/airspaces?` +
      `apiKey=${apiKey}&page=1&limit=1000&country=CZ&${typeParams}`;

    console.log('Fetching OpenAIP...');

    const res = await fetch(url, {
      headers: {
        'x-openaip-api-key': apiKey,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    // Read raw text first so we can log it regardless of content-type
    const responseText = await res.text();
    console.log('OpenAIP status:', res.status);
    console.log('OpenAIP raw response:', responseText.substring(0, 500));

    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenAIP ${res.status}`, detail: responseText },
        { status: 502 },
      );
    }

    const data = JSON.parse(responseText);
    console.log('OpenAIP success, items:', data?.items?.length);
    return NextResponse.json(data);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error && err.cause ? String(err.cause) : 'unknown';
    console.error('Fetch error details:', message, cause);
    return NextResponse.json(
      { error: message, cause },
      { status: 502 },
    );
  }
}
