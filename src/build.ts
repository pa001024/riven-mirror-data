import * as fs from "fs-extra";
import { TMP_PREFIX, TARGET_PREFIX, PROTO_PREFIX, PATCH_PREFIX } from "./var";
import { convertMods } from "./parser/mod";
import { LuaFileConverter } from "./lib/lua2json";
import { convertWeapons, MainTag, TYPES } from "./parser/weapon";
import * as prettier from "prettier";
import * as protobuf from "protobufjs";
import { convertCN } from "./parser/cn";
import * as _ from "lodash";
import * as chalk from "chalk";

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

const mergeRivenPatch = (str: string, table: [string, number, number][]) => {
  const lines = str.split(/\r?\n/);
  const reg = /(.+): (\d+(?:\.\d+)?)->(\d+(?:\.\d+)?)/;
  const rivenMap = lines.reduce((r, v) => {
    if (!v || v.startsWith("#")) return r;
    const [m, name, old, newv] = v.match(reg);
    r[name] = [+old, +newv];
    return r;
  }, {} as { [key: string]: [number, number] });
  return table
    .map(([name, typ, val]) => {
      const imp = rivenMap[name];
      if (imp) {
        const [ov, nv] = imp;
        if (ov === val) {
          val = nv;
        } else {
          if (nv !== val) console.warn(chalk.red("[error]"), `${name}: ${val} != ${ov} -> ${nv} `);
          val = nv;
        }
      }
      return [name, typ, val] as [string, number, number];
    })
    .sort((a, b) => {
      return TYPES[MainTag[a[1]]] - TYPES[MainTag[b[1]]] || b[2] - a[2] || a[0].localeCompare(b[0]);
    });
};

const _BASE62_ST = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// 新浪微博base62编码
export function base62(src: number): string {
  let rst = "",
    negative = src < 0;
  if (negative) src = -src;
  while (1) {
    let a = ~~src % 62;
    rst = _BASE62_ST[a] + rst;
    src = ~~(src / 62);
    if (src <= 0) {
      break;
    }
  }
  return negative ? "-" + rst : rst;
}

// 新浪微博base62解码
export function debase62(src: string): number {
  let rst = 0,
    negative = src[0] === "-";
  if (negative) src = src.substr(1);
  for (let i = 0; i < src.length; i++) {
    const a = _BASE62_ST.indexOf(src[i]);
    if (a < 0) {
      continue;
    }
    rst = rst * 62 + a;
  }
  return negative ? -rst : rst;
}

// 转换格式
const customJSONFormat = async () => {
  // TODO
  const fl = await fs.readdir(TMP_PREFIX);

  return await Promise.all(
    fl.map(async fn => {
      switch (fn) {
        case "de-Mods.json": {
          const rawmods = JSON.parse(await fs.readFile(TMP_PREFIX + fn, "utf-8"));
          const rawwfs = JSON.parse(await fs.readFile(TMP_PREFIX + "de-Warframes.json", "utf-8"));
          const [result, props] = convertMods(rawmods, rawwfs);
          await fs.outputFile(TARGET_PREFIX + "mods.json", formatJSON(result));
          await fs.outputFile(TMP_PREFIX + "collectedProps.json", formatJSON(props));
          const allmods = (await import("../../src/warframe/codex/mod.data")).default;
          const names = new Set(allmods.map(v => v[1]));

          const pvpmods = new Set(
            `Naramon Transmute Core
Vazarin Transmute Core
Madurai Transmute Core
Archgun Ace

Afterburn
Antimatter Mine
Deceptive Bond
Defiled Reckoning
Discharge Strike
Hysterical Fixation
Ice Wave Impedance
Iron Shrapnel
Kinetic Collision
Mesa's Waltz
Power of Three
Prism Guard
Purging Slash
Purifying Flames
Push & Pull
Recharge Barrier
Rumbled
Sapping Reach
Shield Overload
Signal Flare
Singularity
Tear Gas
Ward Recovery
Adept Surge
Adrenaline Boost
Air Thrusters
Anticipation
Anti-Flak Plating
Armored Acrobatics
Armored Evade
Armored Recovery
Calculated Spring
Final Act
Follow Through
Hastened Steps
Heightened Reflexes
No Current Leap
Overcharge Detectors
Overcharged
Quick Charge
Rime Vault
Rising Skill
Searing Leap
Surplus Diverters
Tactical Retreat
Tempered Bound
Venomous Rise
Vital Systems Bypass
Voltaic Lance

Ambush Optics
Brain Storm
Directed Convergence
Double Tap
Draining Gloom
Final Tap
Focused Acceleration
Gorgon Frenzy
Grinloked
Measured Burst
Precision Munition
Shrapnel Rounds
Skull Shots
Spring-Loaded Broadhead
Static Alacrity
Sudden Justice
Thundermiter
Triple Tap

Agile Aim
Apex Predator
Comet Rounds
Deft Tempo
Gun Glide
Hydraulic Gauge
Loose Hatch
Lucky Shot
Maximum Capacity
Overview
Recover
Ripper Rounds
Serrated Rounds
Tactical Reload
Twitch
Vanquished Prey

Bounty Hunter
Broad Eye
Crash Shot
Double-Barrel Drift
Flak Shot
Hydraulic Chamber
Kill Switch
Loaded Capacity
Lock and Load
Loose Chamber
Momentary Pause
Prize Kill
Shred Shot
Snap Shot
Soft Hands

Emergent Aftermath
Lie In Wait

Feathered Arrows
Plan B
Soaring Strike

Air Recon
Blind Shot
Calculated Victory
Eject Magazine
Full Capacity
Heavy Warhead
Hydraulic Barrel
Impaler Munitions
Loose Magazine
Meteor Munitions
Night Stalker
Razor Munitions
Recuperate
Reflex Draw
Secondary Wind
Spry Sights
Strafing Slide

Counterweight
Explosive Demise
Heartseeker
Impenetrable Offense
Martial Fury
Mortal Conduct
Relentless Assault
Serrated Edges
Sharpened Blade
Stand Ground
Sword Alone

Argent Scourge
Biting Piranha
Celestial Nightfall
Crashing Havoc
Crashing Timber
Cunning Aspect
Dividing Blades
Fateful Truth
Lashing Coil
Last Herald
Mafic Rain
Noble Cadence
Piercing Fury
Quaking Hand
Rending Wind
Rising Steel
Scarlet Hurricane
Shadow Harvest
Star Divide
Tainted Hydra
Vicious Approach`.split("\n")
          );

          const missMods = _.orderBy(
            result.filter(v => !names.has(v.name) && !pvpmods.has(v.name) && v.type != "---" && v.type != "STANCE"),
            ["type"]
          ).map((v, i) =>
            [
              base62(debase62("10") + i),
              v.name,
              v.props.map(p => [p.key, p.value].filter(Boolean)),
              _.startCase(v.type.toLowerCase()),
              v.polarity,
              v.rarity,
              v.baseDrain,
              v.fusionLimit === 5 ? null : v.fusionLimit,
            ].filter(v => v != null)
          );

          await fs.outputFile(TMP_PREFIX + "missMods.json", JSON.stringify(missMods));
          return;
        }
        case "wikia-Weapons.json": {
          const wikiWeapons = JSON.parse((await fs.readFile(TMP_PREFIX + "wikia-Weapons.json", "utf-8")).replace(/\bInfinity\b/g, "9999"));
          const patch = JSON.parse(await fs.readFile(PATCH_PREFIX + "weapons.json", "utf-8"));
          const patchWiki = JSON.parse(await fs.readFile(PATCH_PREFIX + "weapons.wiki.json", "utf-8"));
          const patchRiven = await fs.readFile(PATCH_PREFIX + "riven-disposition-updates.txt", "utf-8");
          const [unpatch, result, disposition] = convertWeapons({ ExportWeapons: [] }, _.merge(wikiWeapons, patchWiki), patch);
          const riven = mergeRivenPatch(patchRiven, disposition);
          const rm = riven.reduce((r, v) => {
            r[v[0]] = v[2];
            return r;
          }, {});
          const weapons = result.map(v => {
            if (v.name in rm) v.disposition = rm[v.name];
            if (v.variants)
              v.variants = v.variants.map(v => {
                if (v.name in rm) v.disposition = rm[v.name];
                return v;
              });
            return v;
          });
          await fs.outputFile(TARGET_PREFIX + "weapons.unpatch.json", formatJSON(unpatch));
          await fs.outputFile(TARGET_PREFIX + "weapons.json", formatJSON(result));
          await fs.outputFile(TARGET_PREFIX + "disposition.json", formatJSON(riven));

          // i18n zh-Hans.json
          try {
            const cn = JSON.parse(await fs.readFile(TMP_PREFIX + "huiji-UserDict.json", "utf-8"));
            const oldcn = JSON.parse(await fs.readFile("../src/i18n/lang/zh-Hans.json", "utf-8"));
            const cnNames = riven.reduce((r, [name]) => ({ ...r, [_.camelCase(name)]: cn.Text[name] }), {});
            await fs.outputFile(TARGET_PREFIX + "zh-Hans.json", formatJSON(_.merge(oldcn.messages, cnNames)));
          } catch (e) {
            console.error("i18n zh-Hans.json", e);
          }

          return;
        }
        case "huiji-CYDict.json": {
          const cn = JSON.parse(await fs.readFile(TMP_PREFIX + "huiji-UserDict.json", "utf-8"));
          const cy = JSON.parse(await fs.readFile(TMP_PREFIX + "huiji-CYDict.json", "utf-8"));
          const result = convertCN(cn, cy);
          await fs.outputFile(TARGET_PREFIX + "zh-CY.json", formatJSON(result));
          return;
        }
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
