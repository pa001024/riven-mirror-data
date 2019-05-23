import * as _ from "lodash";
import { WikiWeapons } from "@/wiki";
import { DEWeapons } from "@/de";
import { ProtoWeapon, WeaponMode, Zoom, Weapon } from "./weapon.i";

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
  const WEAPON_PREFIX = /^MK1-|^(?:Prisma|Mara|Dex|Secura|Rakta|Telos|Synoid|Sancti|Vaykor) /;
  const WEAPON_SUBFIX = / (?:Prime|Wraith|Vandal)$/;
  const WEAPON_SINGLE = ["Euphona Prime", "Dex Dakra", "Reaper Prime", "Dakra Prime"];
  if (WEAPON_SINGLE.includes(name)) return name;
  if (WEAPON_PREFIX.test(name)) return name.replace(WEAPON_PREFIX, "");
  if (WEAPON_SUBFIX.test(name)) return name.replace(WEAPON_SUBFIX, "");
  return name;
};

// 删除target中与ref重复的部分
const merge = <T extends {}>(target: T, ref: T) => {
  return _.mapValues(target, (v, i) => (ref[i] !== v ? v : undefined)) as T;
};

const polarityMap = {
  D: "d",
  Bar: "-",
  V: "r",
  Q: "w",
  Ability: "=",
  R: "t",
};

const toAttackWiki = (type: string, attack: WikiWeapons.Attack): WeaponMode => {
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
  const damage = Damage; //_.map(Damage, (v, i) => [i, v] as [string, number]);
  return {
    type,
    name: (!["Uncharged Shot", "Charged Shot", "Buckshot", "Normal Shot"].includes(AttackName) && AttackName) || undefined,
    damage,
    fireRate: FireRate && +(FireRate * 60).toFixed(0),
    accuracy: Accuracy,
    critChance: CritChance,
    critMul: CritMultiplier,
    procChance: StatusChance,
    punchThrough: PunchThrough,
    pellets: PelletCount,
    radius: Radius,
    range: Range,
    ammoCost: AmmoCost,
    chargeTime: ChargeTime,
    trigger: Trigger,
    burstCount: BurstCount,
    falloff: Falloff && [Falloff.StartRange, Falloff.EndRange, Falloff.Reduction],
    prjSpeed: (ShotSpeed !== "???" && +ShotSpeed) || undefined,
  };
};

const tagsMap = {
  "Sniper Rifle": ["Rifle", "Sniper"],
  "Dual Pistols": ["Pistol", "Dual Pistols"],
  Thrown: ["Pistol", "Thrown"],
  "Shotgun Sidearm": ["Pistol", "Shotgun Sidearm"],
  "Dual Shotguns": ["Pistol", "Dual Shotguns"],
  Launcher: ["Rifle", "Assault Rifle", "Launcher"],
  Crossbow: ["Rifle", "Bow", "Crossbow"],
  Bow: ["Rifle", "Bow"],
  Speargun: ["Rifle", "Speargun"],
  Rifle: ["Rifle", "Assault Rifle"],
};

const toTags = (type: string, clas: string): string[] => {
  if (clas === "Crossbow" && type === "Secondary") return [type, "Pistol", "Crossbow"];
  if (clas === "Glaive" && type === "Robotic") return [type, "Melee", clas];
  return clas ? [type, ...(tagsMap[clas] || [clas])] : [type];
};

const toZoom = (src: string) => {
  const rex = /(\d+(?:\.\d+)?)x(?: [Zz]oom)?(?: \((.+)\))?/;
  const rst = rex.exec(src).slice(1);
  if (!rst) {
    console.warn("unknown zoom:", src);
  }
  const props =
    rst[1] &&
    rst[1].split(",").reduce((r, v) => {
      const rex = /([-+]\d+(?:\.\d+)?)%? (.+)/;
      if (v) {
        const [_, vv, vn] = rex.exec(v);
        const vnMap = {
          "Critical Chance": "i0",
          "Critical multiplier": "i1",
          "Headshot Damage": "hm",
        };
        if (vnMap[vn]) r[vnMap[vn]] = +vv;
        else console.warn("unknown prop:", v);
      }
      return r;
    }, {});

  return {
    ratio: +rst[0],
    props,
  } as Zoom;
};

const toWeaponWiki = (raw: WikiWeapons.Weapon, noproto = false): ProtoWeapon => {
  const normal = toAttackWiki(undefined, raw.NormalAttack) || toAttackWiki("charge", raw.ChargeAttack);
  if (!normal) return null;
  const totalDamage = ~~_.reduce(normal.damage, (a, b) => a + b);
  return {
    name: raw.Name,
    tags: toTags(raw.Type, raw.Class),
    traits: raw.Traits,
    mastery: raw.Mastery || undefined,
    disposition: noproto ? undefined : raw.Disposition,
    fireRate: raw.FireRate && +(raw.FireRate * 60).toFixed(0),
    polarities: (raw.Polarities && raw.Polarities.map(v => polarityMap[v]).join("")) || undefined,
    accuracy: +(raw.Accuracy + "").split(" ")[0] || undefined,
    range: raw.Range,
    silent: raw.NoiseLevel === "Silent" || undefined,
    trigger: raw.Trigger,
    reload: raw.Reload,
    magazine: raw.Magazine,
    maxAmmo: raw.MaxAmmo,
    zoom: raw.Zoom && raw.Zoom.map(toZoom),
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
      merge(toAttackWiki(undefined, raw.NormalAttack), { fireRate: raw.FireRate && +(raw.FireRate * 60).toFixed(0) } as WeaponMode),
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
    tags: undefined,
    traits: undefined,
    mastery: +raw.masteryReq.toFixed(0) || undefined,
    disposition: +raw.omegaAttenuation.toFixed(3),
    fireRate: (raw.fireRate && +(raw.fireRate * 60).toFixed(0)) || undefined,
    realFirerate:
      (raw.fireRate && +(raw.fireRate * 60).toFixed(0) !== +((raw.damagePerSecond * 60) / raw.totalDamage).toFixed(0) && +((raw.damagePerSecond * 60) / raw.totalDamage).toFixed(0)) || undefined,
    polarities: undefined,

    // gun
    accuracy: (raw.trigger !== "MELEE" && +raw.accuracy.toFixed(1)) || undefined,
    range: undefined,
    silent: raw.noise === "SILENT" && raw.trigger !== "MELEE" ? true : undefined,
    trigger: undefined,
    reload: +raw.reloadTime.toFixed(3) || undefined,
    magazine: +raw.magazineSize.toFixed(0) || undefined,
    maxAmmo: undefined,
    zoom: undefined,
    spool: undefined,
    burstCount: undefined,
    burstFireRate: undefined,
    sniperComboMin: undefined,
    sniperComboReset: undefined,
    reloadStyle: undefined,

    // melee
    stancePolarity: undefined,
    blockResist: undefined,
    finisherDamage: undefined,
    channelCost: undefined,
    channelMult: undefined,
    // chargeAttack: +raw.chargeAttack.toFixed(2) || undefined,
    // spinAttack: +(raw.spinAttack / raw.totalDamage).toFixed(2) || undefined,
    // jumpAttack: undefined,
    // leapAttack: +(raw.leapAttack / raw.totalDamage).toFixed(2) || undefined,
    // wallAttack: +(raw.wallAttack / raw.totalDamage).toFixed(2) || undefined,
    spinAttack: undefined,
    jumpAttack: undefined,
    leapAttack: undefined,
    wallAttack: undefined,
    // slot,
    // sentinel: raw.sentinel || undefined,
    modes: [
      {
        name: undefined,
        damage: undefined, //raw.damagePerShot.map((v, i) => [DMG_NAMES[i], +v.toFixed(2)]).filter(([_, v]) => v),
        fireRate: undefined,
        critChance: +raw.criticalChance.toFixed(3),
        critMul: +raw.criticalMultiplier.toFixed(2),
        procChance: +raw.procChance.toFixed(3),
      } as WeaponMode,
    ],
  } as Weapon);

const diffKeys = "mastery,disposition,fireRate,critChance,critMul,procChance".split(",");
const diff = (name: string, a, b) => {
  return diffKeys.map(key => {
    if (key in a && key in b) {
      if (a[key] !== b[key]) {
        if (!(key === "fireRate" && !a[key])) console.log(`conflict in ${name}.${key}: DE:${a[key]} WIKI:${b[key]}`);
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

const diffAndDelete = <T>(ori: T, diff: T, keys: (keyof T)[]) => {
  keys.forEach(key => {
    if (ori[key] === diff[key]) delete ori[key];
  });
  return ori;
};

type Pair<T> = { [key: string]: T };

// 转换武器
export const convertWeapons = (deWeapons: DEWeapon, wikiWeapons: WikiWeapon, patch: any) => {
  const DE = deWeapons.ExportWeapons.filter(v => typeof v.omegaAttenuation !== "undefined");
  const WIKI = _.merge(
    _.map(wikiWeapons.Weapons, v => {
      if (v.Type.endsWith(" (Atmosphere)")) return null;
      let rst: Weapon = toWeaponWiki(v);
      if (!rst || v.IgnoreCategories) return null;
      if (v.Name === "Dark Split-Sword (Dual Swords)") rst.name = "Dark Split-Sword";
      if (wikiWeapons.Weapons[v.Name + " (Atmosphere)"]) {
        rst.variants = [toWeaponWiki(wikiWeapons.Weapons[v.Name + " (Atmosphere)"], true)];
      }
      return purge(rst);
    }).reduce(
      (rst, weapon) => {
        if (!weapon) return rst;
        rst[weapon.name] = { ...weapon };
        return rst;
      },
      {} as Pair<ProtoWeapon>
    ),
    patch
  );

  const convertedDE = DE.map(toWeaponDE);

  const bases = convertedDE.reduce(
    (rst, weapon) => {
      const baseName = getBaseName(weapon.name),
        variants = weapon.name.replace(baseName, "").trim(),
        extra = WIKI[baseName];
      if (!variants) rst[baseName] = { ...weapon, ...extra };
      return rst;
    },
    {} as Pair<ProtoWeapon>
  );

  const all = convertedDE.reduce((rst, weapon_de) => {
    const baseName = getBaseName(weapon_de.name),
      variant = weapon_de.name.replace(baseName, "").trim();
    const { modes: wikimodes, ...extra } = WIKI[weapon_de.name];
    !extra && console.log("miss wiki weapon", weapon_de.name);
    diff(weapon_de.name, weapon_de, extra);
    const wikimode = wikimodes.find(v => typeof v.critChance !== "undefined");
    diff(weapon_de.name, weapon_de.modes[0], wikimode || wikimodes[0]);
    if (!wikimode) console.log(weapon_de.name);

    // 同紫卡武器
    if (variant) {
      const { disposition, ...thisVariant } = {
        ...merge(weapon_de, bases[baseName]),
        ...extra,
        modes: !wikimodes[0].type && [
          {
            ...weapon_de.modes[0],
            ...purge(wikimodes[0]),
          },
          ...wikimodes.slice(1),
        ],
      } as ProtoWeapon;

      // console.log(extra, "!!!!!!!!!merge!!!!!!!", merge(extra, weapon));

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

  enum TYPES {
    Rifle,
    Shotgun,
    Pistol,
    Kitgun = 2,
    Melee,
    Zaw = 3,
    "Arch-Gun",
    "Arch-Melee",
  }

  // 输出倾向性表
  const disposition = _.map(all, v => {
    const mode = v.tags.find(v => ["Arch-Gun", "Arch-Melee", "Melee", "Glaive", "Shotgun", "Rifle", "Pistol"].includes(v));
    if (!mode) console.warn("no mode found", v.tags);
    return [
      v.name, //
      mode ? mode.replace("Glaive", "Melee") : "Rifle",
      v.disposition,
    ] as [string, string, number];
  })
    .concat([
      // kitguns
      ["Gaze", "Kitgun", 1],
      ["Rattleguts", "Kitgun", 0.9],
      ["Tombfinger", "Kitgun", 0.85],
      ["Catchmoon", "Kitgun", 0.8],
      // zaw
      ["Balla", "Zaw", 1],
      ["Cyath", "Zaw", 1],
      ["Dehtat", "Zaw", 1],
      ["Dokrahm", "Zaw", 1],
      ["Rabvee", "Zaw", 1],
      ["Mewan", "Zaw", 1],
      ["Kronsh", "Zaw", 1],
      ["Ooltha", "Zaw", 1],
      ["Sepfahn", "Zaw", 1],
      ["Plague Keewar", "Zaw", 1],
      ["Plague Kripath", "Zaw", 1],
    ])
    .sort((a, b) => {
      return TYPES[a[1]] - TYPES[b[1]] || b[2] - a[2] || a[0].localeCompare(b[0]);
    });

  const weapons = Object.keys(all)
    .sort()
    .map(i => all[i]);
  return [all, weapons, disposition];
};
