import { error, type Handle } from "@sveltejs/kit";

const MY_API_BASE_URL = "/_vercel/insights";
const PROXY_PATH = "/actions";

const handleApiProxy: Handle = async ({ event }) => {
  const origin = event.request.headers.get("Origin");

  // reject requests that don't come from the webapp, to avoid your proxy being abused.
  if (!origin || new URL(origin).origin !== event.url.origin) {
    throw error(403, "Request Forbidden. Origin is " + origin);
  }

  // strip `/api-proxy` from the request path
  const strippedPath = event.url.pathname.substring(PROXY_PATH.length);

  // build the new URL path with your API base URL, the stripped path and the query string
  const urlPath = `${origin}${MY_API_BASE_URL}${strippedPath}${event.url.search}`;
  const proxiedUrl = new URL(urlPath);

  // Strip off header added by SvelteKit yet forbidden by underlying HTTP request
  // library `undici`.
  // https://github.com/nodejs/undici/issues/1470
  event.request.headers.delete("connection");

  return fetch(proxiedUrl.toString(), {
    // propagate the request method and body
    body: event.request.body,
    method: event.request.method,
    headers: event.request.headers,
    // @ts-ignore
    duplex: "half"
  }).catch((err) => {
    console.log("Could not proxy API request: ", err);
    throw err;
  });
};

export const handle: Handle = async ({ event, resolve }) => {
    // intercept requests to `/api-proxy` and handle them with `handleApiProxy`
    if (event.url.pathname.startsWith(PROXY_PATH)) {
        return await handleApiProxy({ event, resolve });
    }
    const response = await resolve(event);
    return response;
  // ...the rest of your `handle` logic goes here
};