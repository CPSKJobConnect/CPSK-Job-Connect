const { execSync } = require("child_process");

function run(command, options = {}) {
  execSync(command, {
    stdio: "inherit",
    shell: true,
    ...options,
  });
}

try {
  run("npx prisma generate");
} catch (error) {
  console.error("Failed to run prisma generate during postinstall.");
  throw error;
}

const isCi = Boolean(process.env.CI);
const isProduction = process.env.NODE_ENV === "production";

if (isCi || isProduction) {
  console.log("Skipping Cypress binary installation in CI/production.");
  return;
}

try {
  console.log("Installing Cypress binary for local development...");
  run("npx cypress install", {
    env: {
      ...process.env,
      CYPRESS_INSTALL_BINARY: "1",
    },
  });
} catch (error) {
  console.warn("Unable to install Cypress binary automatically.");
  console.warn("Run `npx cypress install` manually if you need it locally.");
}
