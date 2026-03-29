// Server-side proxy for OpenAIP API — avoids CORS issues.
// The API key stays on the server and is never exposed to the browser.
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENAIP_API_KEY;

  // Debug: visible in Vercel Function Logs
  console.log('OPENAIP key exists:', !!apiKey, 'length:', apiKey?.length);

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 },
    );
  }

  try {
    const typeParams = [1, 2, 3, 4, 8].map((t) => `type[]=${t}`).join('&');
    // Key sent both as query param and as header — OpenAIP supports both
    const url =
      `https://api.openaip.net/api/airspaces?` +
      `apiKey=${apiKey}&page=1&limit=1000&country=CZ&${typeParams}`;

    console.log('Fetching OpenAIP...');

    const res = await fetch(url, {
      headers: {
        'x-openaip-api-key': apiKey,
        'Accept': 'application/json',
      },
    });

    console.log('OpenAIP status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('OpenAIP error body:', errorText);
      return NextResponse.json(
        { error: `OpenAIP ${res.status}`, detail: errorText },
        { status: 502 },
      );
    }

    const data = await res.json();
    console.log('OpenAIP success, items:', data?.items?.length);
    return NextResponse.json(data);

  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 502 },
    );
  }
}
