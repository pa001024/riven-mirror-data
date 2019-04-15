export declare namespace DEUpgrade {
  interface Root {
    ExportUpgrades: ExportUpgrade[];
  }

  interface ExportUpgrade {
    uniqueName: string;
    name: string;
    polarity: string;
    rarity: string;
    codexSecret: boolean;
    baseDrain: number;
    fusionLimit: number;
    description?: string[];
    type?: string;
    subtype?: string;
    upgradeEntries?: UpgradeEntry[];
  }

  interface UpgradeEntry {
    tag: string;
    prefixTag: string;
    suffixTag: string;
    upgradeValues: UpgradeValue[];
  }

  interface UpgradeValue {
    value: number;
    locTag?: string;
  }
}
export declare namespace DEWarframe {
  interface Root {
    ExportWarframes: ExportWarframe[];
  }

  interface ExportWarframe {
    uniqueName: string;
    name: string;
    parentName: string;
    description: string;
    longDescription: string;
    health: number;
    shield: number;
    armor: number;
    stamina: number;
    power: number;
    codexSecret: boolean;
    abilities: Ability[];
    passiveDescription?: string;
  }

  interface Ability {
    abilityUniqueName: string;
    abilityName: string;
    description: string;
  }
}
export declare namespace DEWeapon {
  interface ExportWeapon {
    name: string;
    uniqueName: string;
    codexSecret: boolean;
    secondsPerShot: number;
    damagePerShot: number[];
    magazineSize: number;
    reloadTime: number;
    totalDamage: number;
    damagePerSecond: number;
    trigger: string;
    description: string;
    accuracy: number;
    criticalChance: number;
    criticalMultiplier: number;
    procChance: number;
    fireRate: number;
    chargeAttack: number;
    spinAttack: number;
    leapAttack: number;
    wallAttack: number;
    slot: number;
    noise: string;
    sentinel: boolean;
    masteryReq: number;
    omegaAttenuation: number;
  }

  interface Root {
    ExportWeapons: ExportWeapon[];
  }
}

declare global {
  type DEUpgrade = DEUpgrade.Root;
  type DEWarframe = DEWarframe.Root;
  type DEWeapon = DEWeapon.Root;
}
