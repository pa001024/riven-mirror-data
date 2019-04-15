export declare namespace WikiWeapon {
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
    Name: string;
    Class?: string;
    Cost?: Cost;
    NormalAttack?: Attack;
    SecondaryAttack?: Attack;
    ChargedThrowAttack?: Attack;
    ThrowAttack?: Attack;
    ChargeAttack?: Attack;
    AreaAttack?: Attack;
    SecondaryAreaAttack?: Attack;
    BlockResist?: number;
    Conclave?: boolean;
    Disposition?: number;
    Image?: string;
    Introduced?: string;
    JumpAttack?: number;
    Mastery?: number;
    SlideAttack?: number;
    StancePolarity?: string;
    Traits?: string[];
    Type: string;
    Users?: string[];
    WallAttack?: number;
    JumpElement?: string;
    JumpRadius?: number;
    Polarities?: string[];
    Stagger?: string;
    Family?: string;
    Accuracy?: number | string;
    Magazine?: number;
    MaxAmmo?: number;
    NoiseLevel?: string;
    Reload?: number;
    Trigger?: string;
    SlideElement?: string;
    WallElement?: string;
    ChannelCost?: number;
    ChannelMult?: number;
    FinisherDamage?: number;
    FireRate?: number;
    SniperComboReset?: number;
    Zoom?: string[];
    BurstCount?: number;
    BurstFireRate?: number;
    Range?: number;
    SyndicateEffect?: string;
    ComparisonDisplay?: ComparisonDisplay[];
    Spool?: number;
    SniperComboMin?: number;
    AmmoType?: string;
    ReloadStyle?: string;
    IgnoreCategories?: boolean;
    Link?: string;
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
    Accuracy?: number;
    AmmoCost?: number;
    AttackName?: string;
    BurstCount?: number;
    ChargeTime?: number;
    CritChance?: number;
    CritMultiplier?: number;
    Damage: Damage;
    Falloff?: Falloff;
    FireRate?: number;
    NoiseLevel?: string;
    PelletCount?: number;
    PelletName?: string;
    Polarities?: string[];
    PunchThrough?: number;
    Radius?: number;
    Range?: number;
    Reload?: number;
    ShotSpeed?: number | "???";
    ShotType?: string;
    StatusChance?: number;
    Traits?: string[];
    Trigger?: string;
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
  type WikiWeapon = WikiWeapon.Root;
}
