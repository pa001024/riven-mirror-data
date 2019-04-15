import $ from "axios";
import * as fs from "fs-extra";
import { TMP_PREFIX } from "./var";

const fetchTargets = [
  {
    src: "https://warframe.fandom.com/wiki/Module:Weapons/data?action=raw",
    dist: "wikia-Weapons.lua"
  },
  {
    src: "https://warframe.fandom.com/wiki/Module:Warframes/data?action=raw",
    dist: "wikia-Warframes.lua"
  },
  {
    src: "https://warframe.fandom.com/wiki/Module:Ability/data?action=raw",
    dist: "wikia-Ability.lua"
  },
  {
    src: "https://warframe.fandom.com/wiki/Module:Mods/data?action=raw",
    dist: "wikia-Mods.lua"
  },
  {
    src: "http://content.warframe.com/MobileExport/Manifest/ExportUpgrades.json",
    dist: "de-Mods.json"
  },
  {
    src: "http://content.warframe.com/MobileExport/Manifest/ExportWeapons.json",
    dist: "de-Weapons.json"
  },
  {
    src: "http://content.warframe.com/MobileExport/Manifest/ExportWarframes.json",
    dist: "de-Warframes.json"
  },
  {
    src: "https://warframe.huijiwiki.com/index.php?title=UserDict&action=raw",
    dist: "huiji-UserDict.json"
  }
];


const fetchTasks = fetchTargets.map(v => {
  return async () => {
    try {
      const rst = await $.get(v.src);
      await fs.outputFile(TMP_PREFIX + v.dist, rst.data);
      console.log("[fetch] Download", TMP_PREFIX + v.dist, "from", v.src);
    } catch (e) {
      console.error(e);
    }
  };
});

export default async () => {
  await Promise.all(fetchTasks.map(v => v()));
  console.log("[fetch] All Finished");
};
