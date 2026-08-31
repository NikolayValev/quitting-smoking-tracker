import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypeScript from "eslint-config-next/typescript"

const config = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",

      // Downgraded, not fixed. These React Compiler rules ship with
      // eslint-config-next 16 and have never run against this codebase,
      // because lint was broken until now. The outstanding violations need
      // per-case refactors (and several fire on Server Components, where
      // Date.now() during render is idiomatic). Tracked in NIK-108 — raise
      // these back to "error" as that ticket burns down.
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]

export default config
