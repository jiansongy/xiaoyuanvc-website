const CANONICAL_RESOURCES_PATH = "/resources/";

export function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === "/resources" || url.search) {
    url.pathname = CANONICAL_RESOURCES_PATH;
    url.search = "";
    url.hash = "";
    return Response.redirect(url.toString(), 301);
  }

  return context.env.ASSETS.fetch(context.request);
}
