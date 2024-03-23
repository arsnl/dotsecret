import { bugs, description, name, version } from "@root/package.json";

const distTag = version.includes("next") ? "next" : "latest";

export default { description, name, version, bugs, distTag };
