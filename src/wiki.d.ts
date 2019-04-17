export declare namespace WikiWeapons {
  interface Root {
    IgnoreInCount: string[];
    Weapons: { [key: string]: Weapon };
    Stances: Stance[];
    Augments: Augment[];
  }

  interface Augment {
    Name: string;
    Category: string;
    Source: string;
    Weapons: string[];
  }

  interface Stance {
    Name: string;
    Class: string;
    Polarity?: string;
    Image: string;
    PvP?: boolean;
    Weapon?: string;
    Link?: string;
  }

  interface Weapon {
    // base
    Name: string;
    Family?: string;
    Class?: string;
    Mastery?: number;
    Disposition?: number;
    Type: string;
    FireRate?: number;
    Polarities?: string[];

    // gun
    Accuracy?: number | string; // xx (100 when aimed)
    Range?: number;
    NoiseLevel?: string;
    Trigger?: string;
    Reload?: number;
    Magazine?: number;
    MaxAmmo?: number;
    Zoom?: string[]; // "3x (+20% Critical Chance)"
    Spool?: number;

    // melee
    StancePolarity?: string;
    BlockResist?: number;
    FinisherDamage?: number;
    ChannelCost?: number;
    ChannelMult?: number;

    // burst
    BurstCount?: number;
    BurstFireRate?: number;

    // attack
    SlideAttack?: number;
    JumpAttack?: number;
    WallAttack?: number;
    NormalAttack?: Attack;
    SecondaryAttack?: Attack;
    ChargedThrowAttack?: Attack;
    ThrowAttack?: Attack;
    ChargeAttack?: Attack;
    AreaAttack?: Attack;
    SecondaryAreaAttack?: Attack;

    // deep extra
    SniperComboMin?: number;
    SniperComboReset?: number;
    ReloadStyle?: "Regenerate" | "ByRound";

    // neutral extra
    Traits?: string[];
    SyndicateEffect?: string;
    Introduced?: string;
    Conclave?: boolean;
    AmmoType?: string;

    // wiki extra
    Link?: string;
    Image?: string;
    Cost?: Cost;
    ComparisonDisplay?: ComparisonDisplay[];
    Users?: string[];
    IgnoreCategories?: boolean;

    // useless
    SlideElement?: string;
    WallElement?: string;
    JumpElement?: string;
    JumpRadius?: number;
    Stagger?: string;
  }

  interface Damage {
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

  interface ComparisonDisplay {
    Name: string;
    Attacks: string[];
  }

  interface Attack {
    AttackName?: string;
    Damage: Damage;
    FireRate?: number;
    Accuracy?: number;
    StatusChance?: number;
    CritChance?: number;
    CritMultiplier?: number;
    PunchThrough?: number;
    PelletCount?: number;
    Falloff?: Falloff;
    Radius?: number;
    Range?: number;
    AmmoCost?: number;
    ChargeTime?: number;
    Trigger?: string;
    BurstCount?: number;
    ShotSpeed?: number | "???";

    // useless
    Reload?: number; // ???
    NoiseLevel?: string;
    PelletName?: string;
    ShotType?: string;
    Traits?: string[];
  }

  interface Falloff {
    StartRange: number;
    EndRange: number;
    Reduction?: number;
  }

  interface Cost {
    Credits?: number;
    BPCost?: number;
    MarketCost?: number | string;
    Rush?: number;
    Time?: number;
    Parts?: Part[];
    BPStanding?: number;
    Syndicate?: string;
    Reputation?: number;
    Rank?: number;
  }

  interface Part {
    Name: string;
    Type: string;
    Count: number;
  }
}

declare global {
  type WikiWeapon = WikiWeapons.Root;
}
