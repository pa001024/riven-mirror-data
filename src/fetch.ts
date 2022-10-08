import $ from "axios";
import * as fs from "fs-extra";
import { TMP_PREFIX } from "./var";
import * as chalk from "chalk";

const fetchTargets = [
  {
    src:
      "https://warframe.fandom.com/api.php?action=scribunto-console&format=json&title=Module%3AWeapons&content=return%20require(%27Module%3AWeapons%2Fdata%27)&question=%3Dp&clear=1",
    dist: "wikia-Weapons.lua",
    mapper: (data: any) => {
      return JSON.parse(data).return;
    },
  },
  {
    src: "https://warframe.fandom.com/wiki/Module:Warframes/data?action=raw",
    dist: "wikia-Warframes.lua",
  },
  {
    src: "https://warframe.fandom.com/wiki/Module:Ability/data?action=raw",
    dist: "wikia-Ability.lua",
  },
  {
    src: "https://warframe.fandom.com/wiki/Module:Mods/data?action=raw",
    dist: "wikia-Mods.lua",
  },
  // {
  //   src: "http://content.warframe.com/PublicExport/Manifest/ExportUpgrades.json",
  //   dist: "de-Mods.json",
  // },
  // {
  //   src: "http://content.warframe.com/PublicExport/Manifest/ExportWeapons.json",
  //   dist: "de-Weapons.json",
  // },
  // {
  //   src: "http://content.warframe.com/PublicExport/Manifest/ExportWarframes.json",
  //   dist: "de-Warframes.json",
  // },
  {
    src: "https://warframe.huijiwiki.com/wiki/Data:UserDict.json?action=raw",
    dist: "huiji-UserDict.json",
  },
  {
    src: "https://warframe.huijiwiki.com/index.php?title=Data:DictCY.tab&action=raw",
    dist: "huiji-CYDict.json",
  },
];

const fetchTasks = fetchTargets.map(v => {
  return async () => {
    try {
      const rst = await $.get(v.src, {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36",
        },
        timeout: 10e3,
      });
      let data = typeof rst.data === "string" ? rst.data : JSON.stringify(rst.data);
      if (v.mapper) data = v.mapper(data);
      await fs.outputFile(TMP_PREFIX + v.dist, data);
      console.log(chalk.blue("[fetch] Download"), TMP_PREFIX + v.dist, "from", v.src);
    } catch (e) {
      console.error(`File ${v.src} download failed, please download manually`, e.message);
    }
  };
});

export default async () => {
  await Promise.all(fetchTasks.map(v => v()));
  console.log("[fetch] All Finished");
};
