import * as _ from "lodash";
import { WarframeData } from "./warframe.i";
import { purge } from "@/util";

const translateDEWarframe = (w: DEWarframe["ExportWarframes"][number]) => {
  const dst = {} as WarframeData;
  dst.id = _.startCase(w.name.toLowerCase());
  dst.health = w.health;
  dst.shield = w.shield;
  dst.armor = w.armor;
  dst.energy = w.power;
  dst.sprint = +w.sprintSpeed.toFixed(3);
  dst.abilities = w.abilities.map(v => v.abilityName);
  return dst;
};
const translateWIKIWarframe = (w: WikiWarframe["Warframes"][string]) => {
  const dst = {} as WarframeData;
  enum PolTable {
    V = "r",
    Bar = "-",
    D = "d",
    U = "w",
  }
  dst.id = w.Name;
  dst.health = w.Health;
  dst.shield = w.Shield;
  dst.armor = w.Armor;
  dst.energy = w.Energy;
  dst.masteryReq = w.Mastery;
  dst.aura = PolTable[w.AuraPolarity];
  dst.polarities = w.Polarities.map(v => PolTable[v]).join("");
  return dst;
};

export const convertWarframe = (deWarframes: DEWarframe, wikiWarframes: WikiWarframe, patch: Dict<WarframeData>) => {
  const warframeDE = deWarframes.ExportWarframes.map(translateDEWarframe);
  const warframeMapDE = warframeDE.reduce((rst, warframe) => ((rst[warframe.id] = warframe), rst), {} as Dict<WarframeData>);
  const warframeMapWIKI = _.merge(
    _.map(wikiWarframes.Warframes, v => {
      // 作为variants输出
      let rst: WarframeData = translateWIKIWarframe(v);
      if (!rst) return null;
      if (warframeWIKI[v.Name + " (Atmosphere)"]) {
        rst.variants = [translateWIKIWarframe(wikiWarframes.Warframes[v.Name + " (Atmosphere)"], true)];
      }
      return purge(rst);
    }).reduce(
      (rst, warframe) => {
        if (!warframe) return rst;
        if (warframe.tags.includes("Gear")) return rst;
        rst[warframe.id] = { ...warframe };
        return rst;
      },
      {} as Dict<WarframeData>
    ),
    patch
  );
  const warframeNames = Object.keys(warframeMapWIKI).sort();
  const warframeWIKI = _.map(wikiWarframes.Warframes, translateWIKIWarframe);
  let warframeNamesDE = Object.keys(warframeMapDE);

  if (warframeNamesDE.length) {
    console.warn("Follow is missing in DE file");
    console.warn(warframeNamesDE.join("\n"));
  }
};
