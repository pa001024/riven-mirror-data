import * as fs from "fs-extra";
import * as _ from "lodash";
import { TMP_PREFIX } from "../var";

const DMG_NAMES = [
  "Impact", //
  "Puncture",
  "Slash",
  "Heat",
  "Cold",
  "Electricity",
  "Toxin",
  "Blast",
  "Radiation",
  "Magnetic",
  "Gas",
  "Viral",
  "Corrosive",
  "Void"
];

const getBaseName = (name: string) => {
  const WEAPON_PREFIX = /^(?:Prisma|Mara|Dex|MK-1) /;
  const WEAPON_SUBFIX = / (?:Prime|Wraith|Vandal)$/;
  const WEAPON_SINGLE = ["Euphona Prime", "Dex Dakra", "Reaper Prime", "Dakra Prime"];
  if (WEAPON_SINGLE.includes(name)) return name;
  if (WEAPON_PREFIX.test(name)) return name.replace(WEAPON_PREFIX, "");
  if (WEAPON_SUBFIX.test(name)) return name.replace(WEAPON_SUBFIX, "");
  return name;
};

export const convertWeapons = (deWeapons: any, wikiWeapons: any) => {
  const DE = (deWeapons as DEWeapon).ExportWeapons.filter(v => v.omegaAttenuation);
  const WIKI = (wikiWeapons as WikiWeapon).Weapons;

  const converted = DE.map(raw => ({
    name: _.startCase(raw.name.toLowerCase())
      .replace("Mk 1", "MK-1")
      .replace("Split Sword", "Split-Sword"),
    // uniqueName,
    // codexSecret,
    // secondsPerShot,
    dmg: raw.damagePerShot.map((v, i) => [DMG_NAMES[i], +v.toFixed(1)]).filter(([_, v]) => v),
    magazine: +raw.magazineSize.toFixed(0) || undefined,
    reload: +raw.reloadTime.toFixed(0) || undefined,
    trigger: raw.trigger,
    // description,
    accuracy: +raw.accuracy.toFixed(1) || undefined,
    criticalChance: +raw.criticalChance.toFixed(2),
    criticalMultiplier: +raw.criticalMultiplier.toFixed(1),
    procChance: +raw.procChance.toFixed(2),
    fireRate: +(raw.fireRate * 60).toFixed(0),
    realFirerate: +((raw.damagePerSecond * 60) / raw.totalDamage).toFixed(0),
    chargeAttack: +raw.chargeAttack.toFixed(1) || undefined,
    spinAttack: +raw.spinAttack.toFixed(1) || undefined,
    leapAttack: +raw.leapAttack.toFixed(1) || undefined,
    wallAttack: +raw.wallAttack.toFixed(1) || undefined,
    // slot,
    silent: raw.noise === "SILENT" && raw.trigger !== "MELEE" ? true : undefined,
    sentinel: raw.sentinel || undefined,
    masteryReq: +raw.masteryReq.toFixed(0) || undefined,
    omegaAttenuation: +raw.omegaAttenuation.toFixed(1)
  }));

  const bases = converted.reduce((rst, weapon) => {
    const baseName = getBaseName(weapon.name),
      variant = weapon.name.replace(baseName, "").trim();
    if (!variant) rst[baseName] = { ...weapon };
    return rst;
  }, {});

  const all = converted.reduce((rst, weapon) => {
    const baseName = getBaseName(weapon.name),
      variant = weapon.name.replace(baseName, "").trim();
    if (variant) {
      const thisVariant = _.mapValues(weapon, (v, i) => (bases[baseName][i] !== v ? v : undefined));
      rst[baseName] = {
        ...rst[baseName],
        variants: rst[baseName].variants
          ? [
              ...rst[baseName].variants, // -
              thisVariant
            ].sort()
          : [thisVariant]
      };
    }
    return rst;
  }, _.cloneDeep(bases));

  return Object.keys(all)
    .sort()
    .map(i => all[i]);
};
