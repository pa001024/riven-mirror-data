import * as fs from "fs-extra";
import { TMP_PREFIX, TARGET_PREFIX } from "./var";

export default async () => {
  await fs.remove(TMP_PREFIX);
  await fs.remove(TARGET_PREFIX);
  console.log("[clean] All Finished");
};
