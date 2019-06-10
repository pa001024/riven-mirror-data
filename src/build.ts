import * as fs from "fs-extra";
import { TMP_PREFIX, TARGET_PREFIX, PROTO_PREFIX, PATCH_PREFIX } from "./var";
import { convertMods } from "./parser/mod";
import { LuaFileConverter } from "./lib/lua2json";
import { convertWeapons } from "./parser/weapon";
import * as prettier from "prettier";
import * as protobuf from "protobufjs";
import { convertCN } from "./parser/cn";
import * as _ from "lodash";
import chalk from "chalk";

const formatJSON = (src: any) => {
  return prettier.format(typeof src === "string" ? src : JSON.stringify(src), { parser: "json" });
};

// 转换Lua到JSON格式
const convertLuaToJSON = async () => {
  const lc = new LuaFileConverter();
  try {
    const fl = await fs.readdir(TMP_PREFIX);
    return await Promise.all(
      fl
        .filter(f => f.endsWith(".lua"))
        .map(async fn => {
          const src = await fs.readFile(TMP_PREFIX + fn, "utf-8");
          const result = lc.toJSON(src);
          console.log("converted lua format to json: ", fn);
          await fs.outputFile(TMP_PREFIX + fn.replace(".lua", ".json"), formatJSON(result));
        })
    );
  } catch (e) {
    console.log("no download data, please run `yarn fetch`");
  }
};

// 修复DE API导出的\n被转义以及迷之字符的问题
const fixDEJSONError = async () => {
  const fl = await fs.readdir(TMP_PREFIX);
  return await Promise.all(
    fl
      .filter(f => f.startsWith("de-"))
      .map(async fn => {
        const data = await fs.readFile(TMP_PREFIX + fn, "utf-8");
        await fs.outputFile(TMP_PREFIX + fn, data.replace(/\n/g, "\\n").replace(/﻿/g, ""));
      })
  );
};

// 转换格式
const customJSONFormat = async () => {
  // TODO
  const fl = await fs.readdir(TMP_PREFIX);

  return await Promise.all(
    fl.map(async fn => {
      switch (fn) {
        case "de-Mods.json":
          {
            const rawmods = JSON.parse(await fs.readFile(TMP_PREFIX + fn, "utf-8"));
            const rawwfs = JSON.parse(await fs.readFile(TMP_PREFIX + "de-Warframes.json", "utf-8"));
            const [result, props] = convertMods(rawmods, rawwfs);
            await fs.outputFile(TARGET_PREFIX + "mods.json", formatJSON(result));
            await fs.outputFile(TMP_PREFIX + "collectedProps.json", formatJSON(props));
          }
          return;
        case "de-Weapons.json":
          {
            const deWeapons = JSON.parse(await fs.readFile(TMP_PREFIX + fn, "utf-8"));
            const wikiWeapons = JSON.parse(await fs.readFile(TMP_PREFIX + "wikia-Weapons.json", "utf-8"));
            const patch = JSON.parse(await fs.readFile(PATCH_PREFIX + "weapons.json", "utf-8"));
            const patchWiki = JSON.parse(await fs.readFile(PATCH_PREFIX + "weapons.wiki.json", "utf-8"));
            const [unpatch, result, disposition] = convertWeapons(deWeapons, _.merge(wikiWeapons, patchWiki), patch);
            await fs.outputFile(TARGET_PREFIX + "weapons.unpatch.json", formatJSON(unpatch));
            await fs.outputFile(TARGET_PREFIX + "weapons.json", formatJSON(result));
            await fs.outputFile(TARGET_PREFIX + "disposition.json", formatJSON(disposition));
          }
          return;
        case "huiji-CYDict.json":
          {
            const cn = JSON.parse(await fs.readFile(TMP_PREFIX + "huiji-UserDict.json", "utf-8"));
            const cy = JSON.parse(await fs.readFile(TMP_PREFIX + "huiji-CYDict.json", "utf-8"));
            const result = convertCN(cn, cy);
            await fs.outputFile(TARGET_PREFIX + "zh-CY.json", formatJSON(result));
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
    const Weapons = root.lookupType("Weapons");
    const target = TARGET_PREFIX + "weapons.json";
    const source = await fs.readFile(target, "utf-8");
    const payload = JSON.parse(source).map((v: any) => Weapons.lookupType("Weapon").create(v));
    const message = Weapons.create({ weapons: payload });
    const buffer = Weapons.encode(message).finish();
    await fs.outputFile(TARGET_PREFIX + "weapons.min.json", JSON.stringify(Weapons.toObject(message).weapons));
    await fs.outputFile(TARGET_PREFIX + "weapons.json", formatJSON(Weapons.toObject(message).weapons));
    await fs.writeFile(TARGET_PREFIX + "weapons.data", buffer);
  });
};

export default async (fast = true) => {
  if (fast && ["wikia-Warframes.json", "wikia-Weapons.json"].every(v => fs.existsSync(TMP_PREFIX + v))) {
    console.log(chalk.green("[build]"), "STEP1: convertLuaToJSON Skipped (use 'yarn clean' to rebuild)");
  } else {
    console.log(chalk.green("[build]"), "STEP1: convertLuaToJSON Start");
    await convertLuaToJSON();
  }
  console.log(chalk.green("[build]"), "STEP2: fixDEJSONError Start");
  await fixDEJSONError();
  console.log(chalk.green("[build]"), "STEP3: customJSONFormat Start");
  await customJSONFormat();
  console.log(chalk.green("[build]"), "STEP4: convertProtoBuff Start");
  await convertProtoBuff();
  console.log(chalk.green("[build]"), "All Finished");
};
