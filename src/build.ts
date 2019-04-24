import * as fs from "fs-extra";
import { TMP_PREFIX, TARGET_PREFIX, PROTO_PREFIX } from "./var";
import { convertMods } from "./parser/mod";
import { LuaFileConverter } from "./lib/lua2json";
import { convertWeapons } from "./parser/weapon";
import * as prettier from "prettier";
import * as protobuf from "protobufjs";

const formatJSON = (src: any) => {
  return prettier.format(typeof src === "string" ? src : JSON.stringify(src), { parser: "json" });
};

// 转换Lua到JSON格式
const convertLuaToJSON = async () => {
  const lc = new LuaFileConverter();
  const fl = await fs.readdir(TMP_PREFIX);
  return await Promise.all(
    fl
      .filter(f => f.endsWith(".lua"))
      .map(async fn => {
        const src = await fs.readFile(TMP_PREFIX + fn, "utf-8");
        const result = lc.toJSON(src);
        await fs.outputFile(TMP_PREFIX + fn.replace(".lua", ".json"), formatJSON(result));
      })
  );
};

// 修复DE API导出的\n被转义以及迷之字符的问题
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

// 转换格式
const customJSONFormat = async () => {
  // TODO
  const fl = await fs.readdir(TMP_PREFIX);

  return await Promise.all(
    fl
      .filter(f => f.startsWith("de-"))
      .map(async fn => {
        switch (fn) {
          case "de-Mods.json":
            {
              const rawmods = JSON.parse(await fs.readFile(TMP_PREFIX + fn, "utf-8"));
              const rawwfs = JSON.parse(await fs.readFile(TMP_PREFIX + "de-Warframes.json", "utf-8"));
              const result = convertMods(rawmods, rawwfs);
              await fs.outputFile(TARGET_PREFIX + "mods.json", formatJSON(result));
            }
            return;
          case "de-Weapons.json":
            {
              const deWeapons = JSON.parse(await fs.readFile(TMP_PREFIX + fn, "utf-8"));
              const wikiWeapons = JSON.parse(await fs.readFile(TMP_PREFIX + "wikia-Weapons.json", "utf-8"));
              const [result, disposition] = convertWeapons(deWeapons, wikiWeapons);
              await fs.outputFile(TARGET_PREFIX + "weapons.json", formatJSON(result));
              await fs.outputFile(TARGET_PREFIX + "disposition.json", formatJSON(disposition));
            }
            return;
        }
      })
  );
};

const outputTSFormat = false;

const formatTS = async () => {
  const files = await fs.readdir(TARGET_PREFIX);
  console.log(files);
  const works = files
    .filter(file => file.endsWith(".json"))
    .map(async file => {
      if (outputTSFormat) {
        const target = TARGET_PREFIX + file;
        const source = await fs.readFile(target, "utf-8");
        const pre = "export default ";
        const tsTarget = TARGET_PREFIX + file.replace(".json", ".ts");
        const tsFormated = prettier.format(pre + source, { parser: "babel" });
        await fs.outputFile(tsTarget, tsFormated);
      }
    });
  await Promise.all(works);
};

const convertProtoBuff = async () => {
  protobuf.load(PROTO_PREFIX + "weapon.proto", async (err, root) => {
    if (err) {
      console.error(err);
      return;
    }
    const Weapons = root.lookupType("im.riven.Weapons");
    const target = TARGET_PREFIX + "weapons.json";
    const source = await fs.readFile(target, "utf-8");
    var payload = JSON.parse(source).map((v: any) => Weapons.lookupType("Weapon").create(v));
    var message = Weapons.create({ weapons: payload });
    var buffer = Weapons.encode(message).finish();
    console.log(JSON.stringify(Weapons.toObject(message)));
    await fs.writeFile(TARGET_PREFIX + "weapons.bin", buffer);
  });
};

export default async (fast = true) => {
  if (fast && ["wikia-Warframes.json", "wikia-Weapons.json"].every(v => fs.existsSync(TMP_PREFIX + v))) {
    console.log("[build] STEP1: convertLuaToJSON Skipped");
  } else {
    console.log("[build] STEP1: convertLuaToJSON Start");
    await convertLuaToJSON();
  }
  console.log("[build] STEP2: fixDEJSONError Start");
  await fixDEJSONError();
  console.log("[build] STEP3: customJSONFormat Start");
  await customJSONFormat();
  console.log("[build] STEP4: convertProtoBuff Start");
  await convertProtoBuff();
  console.log("[build] All Finished");
};
