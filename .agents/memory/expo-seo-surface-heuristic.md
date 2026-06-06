# Expo SEO surface heuristic

When scanning an Expo or React Native codebase for SEO, do not assume the app routes are the primary crawl surface. First check whether the project deploys a custom HTML landing page, static asset server, or manifest endpoint for web visitors. In these repos, SEO issues often concentrate in that landing template and its crawlability files rather than in native route components.
