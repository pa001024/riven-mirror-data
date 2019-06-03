import * as fs from "fs-extra";
import * as _ from "lodash";
import { TMP_PREFIX } from "../var";
import { propMap, extPropMap, extRexProp } from "./mod.props";

// let polarities = new Set(mods.map(v => v.polarity));
// let rarities = new Set(mods.map(v => v.rarity));

enum polarityMap {
  AP_POWER = "=",
  AP_DEFENSE = "d",
  AP_TACTIC = "-",
  AP_ATTACK = "r",
  AP_WARD = "t",
  AP_UMBRA = "w",
  AP_PRECEPT = "k",
  AP_UNIVERSAL = "",
}

enum rarityMap {
  COMMON = "n",
  UNCOMMON = "c",
  RARE = "r",
  LEGENDARY = "l",
}

enum damageTypeMap {
  DT_POISON = "T",
  DT_SLASH = "S",
  DT_PUNCTURE = "P",
  DT_IMPACT = "I",
  DT_FREEZE = "C",
  DT_FIRE = "H",
  DT_ELECTRICITY = "E",
  DT_RADIATION = "R",
  DT_EXPLOSION = "B",
  DT_SENTIENT = "U",
}

export interface ModProp {
  key: string;
  value: number;
}

export interface Mod {
  name: string;
  type: string;
  props: ModProp[];
  polarity: string;
  rarity: string;
  baseDrain: number;
  fusionLimit: number;
}

const filterProps = [/^\D+$/];

const parseDescription = (desc: string[]) => {
  return (
    desc &&
    desc
      .map(dd => {
        let m = dd.match(/^([\+\-]\d+(?:\.\d+)?)(.* .+)/);
        if (m && propMap[m[2]]) return [propMap[m[2]], +m[1]];
        if (extPropMap[dd]) return [extPropMap[dd]];
        if (extRexProp[dd]) return extRexProp[dd];
        if (filterProps.some(r => !!dd.match(r))) return null;
        else return [dd];
      })
      .filter(Boolean)
      .map(([key, value]) => ({ key, value } as ModProp))
  );
};

export const convertMods = (rawmods: any, rawwfs: any) => {
  const mods = (rawmods as DEUpgrade).ExportUpgrades.filter(mod => !mod.uniqueName.includes("/Randomized/")) // filter riven mods
    .map(mod => ({ ...mod, description: [].concat(...mod.description.map(k => k.split("\r\n"))) as string[] })); // split description by \r\n
  const warframes = (rawwfs as DEWarframe).ExportWarframes;

  const baseToWarframe = new Map(
    warframes
      .map(v => [v.parentName === "/Lotus/Types/Game/PowerSuits/PlayerPowerSuit" ? v.uniqueName : v.parentName, v.name] as [string, string])
      .filter(([, vv]) => !vv.includes("PRIME") && !vv.includes("UMBRA"))
  );
  baseToWarframe.delete("/Lotus/Types/Game/PowerSuits/PlayerPowerSuit");
  let props = _.uniq(
    [].concat(
      ...mods.map(
        v =>
          v.description &&
          v.description.map(desc => {
            let m = desc.match(/^[\+\-]\d+(?:\.\d+)?(.* .+)/);
            return m ? m[1] : desc;
          })
      )
    )
  )
    .filter(Boolean)
    .reduce((rst, next) => {
      rst[next] = "???";
      return rst;
    }, {});

  const converted = mods
    .map(({ name, polarity, rarity, type, subtype, baseDrain, fusionLimit, description }) => {
      const props = parseDescription(description);
      return {
        name,
        type: [type, baseToWarframe.get(subtype)].filter(Boolean).join(","),
        props: props.length > 1 ? props : undefined,
        polarity: polarityMap[polarity],
        rarity: rarityMap[rarity],
        baseDrain,
        fusionLimit,
      } as Mod;
    })
    .filter(v => v.polarity);
  return [converted, props];
};
