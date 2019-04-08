import * as fs from "fs-extra";
import * as _ from "lodash";
import { Warframe, Upgrade } from "../exports";
import { TMP_PREFIX } from "../var";
import { propMap, extPropMap, extRexProp } from "./mod.props";

// let polarities = new Set(mods.map(v => v.polarity));
// let rarities = new Set(mods.map(v => v.rarity));

const polarityMap = {
  AP_POWER: "=",
  AP_DEFENSE: "d",
  AP_TACTIC: "-",
  AP_ATTACK: "r",
  AP_WARD: "t",
  AP_UMBRA: "w",
  AP_PRECEPT: "k",
  AP_UNIVERSAL: ""
};

const rarityMap = {
  COMMON: "n",
  UNCOMMON: "c",
  RARE: "r",
  LEGENDARY: "l"
};

const damageTypeMap = {
  DT_POISON: "T",
  DT_SLASH: "S",
  DT_PUNCTURE: "P",
  DT_IMPACT: "I",
  DT_FREEZE: "C",
  DT_FIRE: "H",
  DT_ELECTRICITY: "E",
  DT_RADIATION: "R",
  DT_EXPLOSION: "B",
  DT_SENTIENT: "U"
};

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
  );
};

export const convertMods = (rawmods: any, rawwfs: any) => {
  const mods = (rawmods as Upgrade).ExportUpgrades.filter(mod => !mod.uniqueName.includes("/Randomized/")) // filter riven mods
    .map(mod => ({ ...mod, description: [].concat(...mod.description.map(k => k.split("\r\n"))) as string[] })); // split description by \r\n
  const warframes = (rawwfs as Warframe).ExportWarframes;

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
          v.description.map(v => {
            let m = v.match(/^[\+\-]\d+(?:\.\d+)?(.* .+)/);
            return m ? m[1] : "";
          })
      )
    )
  ).filter(Boolean);
  fs.outputFile(TMP_PREFIX + "collectedProps.json", JSON.stringify(props));

  const converted = mods
    .map(({ name, polarity, rarity, type, subtype, baseDrain, fusionLimit, description }) => ({
      name,
      type: [type, baseToWarframe.get(subtype)].filter(Boolean).join(","),
      props: parseDescription(description),
      polarity: polarityMap[polarity],
      rarity: rarityMap[rarity],
      baseDrain,
      fusionLimit
    }))
    .filter(v => v.polarity);
  return converted;
};
