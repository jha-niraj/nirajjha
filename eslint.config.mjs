import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * ESLint flat config.
 *
 * Two things changed together on the Next 16 upgrade: `next lint` was removed,
 * so the `lint` script calls the eslint CLI directly, and eslint-config-next
 * requires ESLint 9, which reads this file rather than `.eslintrc.json`.
 *
 * eslint-config-next 16 exports a real flat config array, so it is imported
 * directly. Running it through FlatCompat, which is what the old shareable
 * format needed, crashes on a circular reference in the plugin object.
 */
const config = [
	{
		// Flat config has no `.eslintignore`. Anything not linted is listed here.
		ignores: [
			".next/**",
			"node_modules/**",
			"out/**",
			"build/**",
			"next-env.d.ts",
		],
	},
	...nextCoreWebVitals,
];

export default config;
