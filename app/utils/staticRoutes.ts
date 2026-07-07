// Static informational pages: publicly accessible (no auth) and rendered
// standalone, without the app shell (sidebars / modals / background theme).
// Add a new page's route prefix here to make it public + standalone.
export const staticRoutePrefixes = ['/help', '/about']

export const isStaticRoute = (path: string) =>
  staticRoutePrefixes.some((prefix) => path.startsWith(prefix))
