// weapon schema V1.0

/** 伤害 */
export interface Damage {
  Impact?: number;
  Puncture?: number;
  Slash?: number;
  Heat?: number;
  Cold?: number;
  Electricity?: number;
  Toxin?: number;
  Blast?: number;
  Radiation?: number;
  Magnetic?: number;
  Gas?: number;
  Viral?: number;
  Corrosive?: number;
  Void?: number;
}

/** 模式 */
export interface WeaponMode {
  damage: Damage;
  /** 衰减 [起始,中止,最大衰减] */
  falloff?: number[];

  type: string;
  name?: string;
  fireRate?: number;
  accuracy?: number;
  procChance?: number;
  critChance?: number;
  critMul?: number;
  punchThrough?: number;
  pellets?: number;
  radius?: number;
  range?: number;
  ammoCost?: number;
  chargeTime?: number;
  trigger?: string;
  burstCount?: number;
  prjSpeed?: number;
}

/** 变焦 */
export interface Zoom {
  ratio: number;
  props: { [key: string]: number };
}

/** 武器 */
export interface Weapon {
  // base
  name: string;
  tags?: string[];
  // class?: string;
  traits?: string[];
  mastery?: number;
  fireRate?: number;
  realFirerate?: number;
  polarities?: string;

  // gun
  accuracy?: number; // xx (100 when aimed)
  range?: number;
  silent?: boolean;
  trigger?: string;
  reload?: number;
  magazine?: number;
  maxAmmo?: number;
  zoom?: Zoom[]; // "3x (+20% Critical Chance)"
  spool?: number;
  burstCount?: number;
  burstFireRate?: number;
  // deep extra
  sniperComboMin?: number;
  sniperComboReset?: number;
  reloadStyle?: "Regenerate" | "ByRound";

  // melee
  stancePolarity?: string;
  blockResist?: number;
  finisherDamage?: number;
  channelCost?: number;
  channelMult?: number;
  spinAttack?: number;
  jumpAttack?: number;
  leapAttack?: number;
  wallAttack?: number;

  // attack
  modes: WeaponMode[];
  variants?: Weapon[];
}

/** 基础 */
export interface ProtoWeapon extends Weapon {
  disposition?: number;
}
