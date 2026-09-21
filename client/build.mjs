// Bundles client/src/app.jsx (React + all the site's JSX, formerly loaded as
// separate <script type="text/babel"> blocks transpiled live in the browser)
// into one plain-JS, minified static file: ../site/app.js.
import { build } from "esbuild";

await build({
  entryPoints: ["src/app.jsx"],
  outfile: "../site/app.js",
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ["es2020"],
  jsx: "transform",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  logLevel: "info",
});
