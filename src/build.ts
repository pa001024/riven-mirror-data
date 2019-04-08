import * as fs from "fs-extra";
import { TMP_PREFIX, TARGET_PREFIX } from "./var";
import { convertMods } from "./mod";
const {
  lua: { lua_setfield, lua_pushliteral },
  lauxlib: { luaL_dostring, luaL_newstate, luaL_requiref, luaL_dofile },
  lualib: { luaL_openlibs },
  to_luastring
} = require("fengari");

const { luaopen_js, tojs } = require("fengari-interop");

type LuaVM = any;

class LuaContext {
  private L: LuaVM;
  constructor() {
    process.env["LUA_PATH"] = "src/lua/?.lua;tmp/?.lua";
    const L = luaL_newstate();
    luaL_openlibs(L);
    luaL_requiref(L, to_luastring("js"), luaopen_js, 0);
    this.L = L;
  }

  runCode(code: string) {
    const { L } = this;
    luaL_dostring(L, to_luastring(code));
    return tojs(L, -1);
  }

  setLocal(name: string, value: string) {
    const { L } = this;
    lua_pushliteral(L, value);
    lua_setfield(L, -2, to_luastring(name));
  }
}

class LuaFileConverter {
  luac = new LuaContext();

  toJSON(file: string) {
    // this.luac.setLocal("data", source);
    return this.luac.runCode(`
    local json = require("json")
    local data = require("${file}")
    return json.encode(data)
    `);
  }
}

// 转换Lua到JSON格式
const convertLuaToJSON = async () => {
  const lc = new LuaFileConverter();
  const fl = await fs.readdir(TMP_PREFIX);
  return await Promise.all(
    fl
      .filter(f => f.endsWith(".lua"))
      .map(async fn => {
        fn = fn.substr(0, fn.length - 4);
        let json = lc.toJSON(fn);
        await fs.outputFile(TMP_PREFIX + fn + ".json", json);
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
