// weapon schema V1.0-variants

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
  type?: string;
  name?: string;
  damage: Damage;
  /** 衰减 [起始,中止,最大衰减] */
  falloff?: number[];
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
  traits?: string[];
  mastery?: number;
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
  zoom?: Zoom[]; // "3x (+20% Critical Chance)"
  spool?: number;
  // deep extra
  sniperComboMin?: number;
  sniperComboReset?: number;
  reloadStyle?: number; // Normal=0 Regenerate=1 ByRound=2

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
