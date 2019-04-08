import * as fs from "fs-extra";
import { TMP_PREFIX, TARGET_PREFIX } from "./var";
import { convertMods } from "./parser/mod";
import { LuaFileConverter } from "./lib/lua2json";

// 转换Lua到JSON格式
const convertLuaToJSON = async () => {
  const lc = new LuaFileConverter();
  const fl = await fs.readdir(TMP_PREFIX);
  return await Promise.all(
    fl
      .filter(f => f.endsWith(".lua"))
      .map(async fn => {
        let src = await fs.readFile(TMP_PREFIX + fn, "utf-8");
        let json = lc.toJSON(src);
        await fs.outputFile(TMP_PREFIX + fn.substr(0, fn.length - 4) + ".json", json);
      })
  );
};

// 修复DE API导出的\n被转义的问题
const fixDEJSONError = async () => {
  const fl = await fs.readdir(TMP_PREFIX);
  return await Promise.all(
    fl
      .filter(f => f.startsWith("de-"))
      .map(async fn => {
        const data = await fs.readFile(TMP_PREFIX + fn, "utf-8");
        await fs.writeFile(TMP_PREFIX + fn, data.replace(/\n/g, "\\n").replace(/﻿/g, ""));
      })
  );
};

const customJSONFormat = async () => {
  // TODO
  const fl = await fs.readdir(TMP_PREFIX);

  return await Promise.all(
    fl
      .filter(f => f.startsWith("de-"))
      .map(async fn => {
        switch (fn) {
          case "de-Mods.json":
            const rawmods = JSON.parse(await fs.readFile(TMP_PREFIX + fn, "utf-8"));
            const rawwfs = JSON.parse(await fs.readFile(TMP_PREFIX + "de-Warframes.json", "utf-8"));
            await fs.outputFile(TARGET_PREFIX + "mods.json", JSON.stringify(convertMods(rawmods, rawwfs)));
        }
      })
  );
};

export default async () => {
  console.log("[build] STEP1: convertLuaToJSON Start");
  await convertLuaToJSON();
  console.log("[build] STEP2: fixDEJSONError Start");
  await fixDEJSONError();
  console.log("[build] STEP3: customJSONFormat Start");
  await customJSONFormat();
  console.log("[build] All Finished");
};
