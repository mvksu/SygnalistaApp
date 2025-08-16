import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname),
		},
	},
	test: {
		environment: "node",
		include: [
			"lib/**/*.test.{ts,tsx}",
			"src/**/*.test.{ts,tsx}",
			"tests/**/*.spec.{ts,tsx}",
		],
		coverage: {
			reporter: ["text", "html"],
			provider: "v8",
		},
	},
})



