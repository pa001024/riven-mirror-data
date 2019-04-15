import * as fs from "fs-extra";
const {
  lua: { lua_setglobal, lua_pushliteral },
  lauxlib: { luaL_dostring, luaL_newstate, luaL_requiref },
  lualib: { luaL_openlibs },
  to_luastring
} = require("fengari");

const { luaopen_js, tojs } = require("fengari-interop");

type LuaVM = any;

export class LuaContext {
  private L: LuaVM;
  constructor() {
    const L = luaL_newstate();
    luaL_openlibs(L);
    luaL_requiref(L, to_luastring("js"), luaopen_js, 0);
    this.L = L;
  }

  /**
   * same as `eval(<code>)`
   */
  runCode(code: string) {
    const { L } = this;
    luaL_dostring(L, to_luastring(code), 0);
    return tojs(L, -1);
  }

  /**
   * same as `<name> = eval(<code>)`
   */
  loadLib(name: string, code: string) {
    const { L } = this;
    luaL_dostring(L, to_luastring(code));
    lua_setglobal(L, to_luastring(name));
  }

  /**
   * same as `<name> = "<value>"`
   */
  setString(name: string, value: string) {
    const { L } = this;
    lua_pushliteral(L, value);
    lua_setglobal(L, to_luastring(name));
  }
}

export class LuaFileConverter {
  luac = new LuaContext();
  constructor() {
    this.luac.loadLib("json", fs.readFileSync("./src/lua/json.lua", "utf-8"));
  }

  /**
   * Converter Lua Table to JSON
   */
  toJSON(src: string) {
    this.luac.loadLib("data", src);
    return this.luac.runCode("return json.encode(data)");
  }
}
