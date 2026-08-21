import { defineAgent } from "eve";

export default defineAgent({
  model: "zai/glm-5.2",
  build: {
    externalDependencies: ["@vercel/connect"],
  },
});
