import * as _ from "lodash";
import { WikiWeapons } from "@/wiki";
import { DEWeapons } from "@/de";

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
  "Void",
];

const getBaseName = (name: string) => {
  const WEAPON_PREFIX = /^(?:Prisma |Mara |Dex |MK1-)/;
  const WEAPON_SUBFIX = / (?:Prime|Wraith|Vandal)$/;
  const WEAPON_SINGLE = ["Euphona Prime", "Dex Dakra", "Reaper Prime", "Dakra Prime"];
  if (WEAPON_SINGLE.includes(name)) return name;
  if (WEAPON_PREFIX.test(name)) return name.replace(WEAPON_PREFIX, "");
  if (WEAPON_SUBFIX.test(name)) return name.replace(WEAPON_SUBFIX, "");
  return name;
};

interface Attack {
  damage: [string, number][];
  falloff?: number[];

  type: string;
  name?: string;
  fireRate?: number;
  accuracy?: number;
  procChance?: number;
  critChance?: number;
  critMultiplier?: number;
  punchThrough?: number;
  pellets?: number;
  radius?: number;
  range?: number;
  ammoCost?: number;
  chargeTime?: number;
  trigger?: string;
  burstCount?: number;
  shotSpeed?: number;
}
interface Weapon {
  // base
  name: string;
  type: string;
  family?: string;
  class?: string;
  mastery?: number;
  disposition?: number;
  fireRate?: number;
  polarities?: string;

  // gun
  accuracy?: number; // xx (100 when aimed)
  range?: number;
  silent?: boolean;
  trigger?: string;
  reload?: number;
  magazine?: number;
  maxAmmo?: number;
  zoom?: string[]; // "3x (+20% Critical Chance)"
  spool?: number;

  // melee
  stancePolarity?: string;
  blockResist?: number;
  finisherDamage?: number;
  channelCost?: number;
  channelMult?: number;

  // burst
  burstCount?: number;
  burstFireRate?: number;

  // attack
  spinAttack?: number;
  jumpAttack?: number;
  leapAttack?: number;
  wallAttack?: number;
  modes: Attack[];

  // deep extra
  sniperComboMin?: number;
  sniperComboReset?: number;
  reloadStyle?: "Regenerate" | "ByRound";

  // neutral extra
  traits?: string[];

  variants?: Weapon[];
}

const polarityMap = {
  D: "d",
  Bar: "-",
  V: "r",
  Q: "w",
  Ability: "=",
  R: "t",
};

const toAttackWiki = (type: string, attack: WikiWeapons.Attack): Attack => {
  if (!attack) return undefined;
  const {
    Damage,
    AttackName,
    FireRate,
    Accuracy,
    StatusChance,
    CritChance,
    CritMultiplier,
    PunchThrough,
    PelletCount,
    Falloff,
    Radius,
    Range,
    AmmoCost,
    ChargeTime,
    Trigger,
    BurstCount,
    ShotSpeed,
  } = attack;
  const damage = _.map(Damage, (v, i) => [i, v] as [string, number]);
  return {
    type,
    name: AttackName,
    damage,
    fireRate: FireRate && +(FireRate * 60).toFixed(0),
    accuracy: Accuracy,
    critChance: CritChance,
    critMultiplier: CritMultiplier,
    procChance: StatusChance,
    punchThrough: PunchThrough,
    pellets: PelletCount,
    falloff: Falloff && [Falloff.StartRange, Falloff.EndRange, Falloff.Reduction],
    radius: Radius,
    range: Range,
    ammoCost: AmmoCost,
    chargeTime: ChargeTime,
    trigger: Trigger,
    burstCount: BurstCount,
    shotSpeed: (ShotSpeed !== "???" && ShotSpeed) || undefined,
  };
};

const toWeaponWiki = (raw: WikiWeapons.Weapon): Weapon => {
  const normal = toAttackWiki(undefined, raw.NormalAttack) || toAttackWiki("charge", raw.ChargeAttack);
  if (!normal) return null;
  const totalDamage = ~~normal.damage.reduce((a, b) => a + b[1], 0);
  return {
    name: raw.Name,
    family: raw.Family,
    class: raw.Class,
    mastery: raw.Mastery || undefined,
    disposition: raw.Disposition,
    type: raw.Type,
    fireRate: raw.FireRate && +(raw.FireRate * 60).toFixed(0),
    polarities: raw.Polarities && raw.Polarities.map(v => polarityMap[v]).join(""),
    accuracy: +(raw.Accuracy + "").split(" ")[0] || undefined,
    range: raw.Range,
    silent: raw.NoiseLevel === "Silent" || undefined,
    trigger: raw.Trigger,
    reload: raw.Reload,
    magazine: raw.Magazine,
    maxAmmo: raw.MaxAmmo,
    zoom: raw.Zoom,
    spool: raw.Spool,
    stancePolarity: raw.StancePolarity && polarityMap[raw.StancePolarity],
    blockResist: raw.BlockResist,
    finisherDamage: raw.FinisherDamage,
    channelCost: raw.ChannelCost,
    channelMult: raw.ChannelMult,
    burstCount: raw.BurstCount,
    burstFireRate: raw.BurstFireRate,
    spinAttack: +(raw.SlideAttack / totalDamage).toFixed(2) || undefined,
    jumpAttack: +(raw.JumpAttack / totalDamage).toFixed(2) || undefined,
    wallAttack: +(raw.WallAttack / totalDamage).toFixed(2) || undefined,
    sniperComboMin: raw.SniperComboMin,
    sniperComboReset: raw.SniperComboReset,
    reloadStyle: raw.ReloadStyle,
    modes: [
      toAttackWiki(undefined, raw.NormalAttack),
      toAttackWiki("charge", raw.ChargeAttack),
      toAttackWiki("secondary", raw.SecondaryAttack),
      toAttackWiki("chargedThrow", raw.ChargedThrowAttack),
      toAttackWiki("throw", raw.ThrowAttack),
      toAttackWiki("area", raw.AreaAttack),
      toAttackWiki("secondaryArea", raw.SecondaryAreaAttack),
    ].filter(Boolean),
  };
};

const toWeaponDE = (raw: DEWeapons.ExportWeapon) =>
  ({
    name: raw.name
      .replace(/\w+/g, v => v.substr(0, 1) + v.substr(1).toLowerCase())
      .replace("Mk1-", "MK1-")
      .replace("<Archwing> ", ""),
    type: raw.uniqueName
      .replace("/Lotus/Weapons/", "")
      .replace("Syndicates/", "")
      .replace("Archwing/", "Archwing")
      .split("/")
      .slice(0, 2)
      .join(" ")
      .replace("Pistol/", "Pistol")
      .replace("LongGuns/", "Rifle"),
    // uniqueName,
    // codexSecret,
    // secondsPerShot,
    magazine: +raw.magazineSize.toFixed(0) || undefined,
    reload: +raw.reloadTime.toFixed(3) || undefined,
    trigger: (raw.trigger !== "MELEE" && raw.trigger) || undefined,
    // description,
    accuracy: (raw.trigger !== "MELEE" && +raw.accuracy.toFixed(1)) || undefined,
    fireRate: raw.fireRate && +(raw.fireRate * 60).toFixed(0),
    realFirerate: +((raw.damagePerSecond * 60) / raw.totalDamage).toFixed(0),
    chargeAttack: +raw.chargeAttack.toFixed(2) || undefined,
    spinAttack: +(raw.spinAttack / raw.totalDamage).toFixed(2) || undefined,
    leapAttack: +(raw.leapAttack / raw.totalDamage).toFixed(2) || undefined,
    wallAttack: +(raw.wallAttack / raw.totalDamage).toFixed(2) || undefined,
    // slot,
    silent: raw.noise === "SILENT" && raw.trigger !== "MELEE" ? true : undefined,
    // sentinel: raw.sentinel || undefined,
    mastery: +raw.masteryReq.toFixed(0) || undefined,
    disposition: +raw.omegaAttenuation.toFixed(3),
    modes: [
      {
        damage: raw.damagePerShot.map((v, i) => [DMG_NAMES[i], +v.toFixed(2)]).filter(([_, v]) => v),
        critChance: +raw.criticalChance.toFixed(3),
        critMultiplier: +raw.criticalMultiplier.toFixed(2),
        procChance: +raw.procChance.toFixed(3),
      } as Attack,
    ],
  } as Weapon);

const diffKeys = "mastery,disposition,magazine,silent,range,reload,accuracy,fireRate,critChance,critMultiplier,procChance".split(",");
const diff = (name: string, a, b) => {
  return diffKeys.map(key => {
    if (key in a && key in b) {
      if (a[key] !== b[key]) {
        console.log(`conflict in ${name}.${key}: DE:${a[key]} WIKI:${b[key]}`);
        return [key, false];
      }
    }
    return [key, true];
  });
};

const purge = <T>(a: T) => {
  Object.keys(a).forEach(v => typeof a[v] === "undefined" && delete a[v]);
  return a;
};

export const convertWeapons = (deWeapons: any, wikiWeapons: any) => {
  const DE = (deWeapons as DEWeapon).ExportWeapons.filter(v => v.omegaAttenuation);
  const rawWIKI = (wikiWeapons as WikiWeapon).Weapons;
  const WIKI = _.map(rawWIKI, v => {
    if (v.Type.endsWith(" (Atmosphere)")) return null;
    let rst: Weapon = toWeaponWiki(v);
    if (!rst || v.IgnoreCategories) return null;
    if (v.Name === "Dark Split-Sword (Dual Swords)") rst.name = "Dark Split-Sword";
    if (rawWIKI[v.Name + " (Atmosphere)"]) {
      rst.variants = [toWeaponWiki(rawWIKI[v.Name + " (Atmosphere)"])];
    }
    return purge(rst);
  }).reduce((rst, weapon) => {
    if (!weapon) return rst;
    rst[weapon.name] = { ...weapon };
    return rst;
  }, {});

  const convertedDE = DE.map(toWeaponDE).map(purge);

  const bases = convertedDE.reduce(
    (rst, weapon) => {
      const baseName = getBaseName(weapon.name),
        variants = weapon.name.replace(baseName, "").trim(),
        extra = WIKI[baseName];
      if (!variants) rst[baseName] = { ...weapon, ...extra };
      return rst;
    },
    {} as { [key: string]: Weapon }
  );

  const all = convertedDE.reduce((rst, weapon) => {
    const baseName = getBaseName(weapon.name),
      variant = weapon.name.replace(baseName, "").trim();
    const extra = WIKI[weapon.name];
    !extra && console.log(weapon.name);
    diff(weapon.name, weapon, extra);
    diff(weapon.name, weapon.modes[0], extra.modes[0]);
    if (variant) {
      const { disposition, ...thisVariant } = { ..._.mapValues(weapon, (v, i) => (bases[baseName][i] !== v ? v : undefined)), ...extra } as Weapon;
      rst[baseName] = {
        ...rst[baseName],
        variants: rst[baseName].variants
          ? [
              ...rst[baseName].variants, // -
              thisVariant,
            ].sort()
          : [thisVariant],
      };
    }
    return rst;
  }, _.cloneDeep(bases));

  const allMerged = all.re;

  return Object.keys(all)
    .sort()
    .map(i => all[i]);
};
