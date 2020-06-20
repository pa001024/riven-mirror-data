import * as chalk from "chalk";
import { TMP_PREFIX, TARGET_PREFIX, PROTO_PREFIX, PATCH_PREFIX } from "./var";
import * as _ from "lodash";
import * as fs from "fs-extra";
import { convertObjectToLua } from "./util";

const pvps = `Afterburn
Antimatter Mine
Deceptive Bond
Defiled Reckoning
Discharge Strike
Hysterical Fixation
Ice Wave Impedance
Iron Shrapnel
Kinetic Collision
Mesa's Waltz
Power of Three
Prism Guard
Purging Slash
Purifying Flames
Push & Pull
Recharge Barrier
Rumbled
Sapping Reach
Shield Overload
Signal Flare
Singularity
Tear Gas
Ward Recovery
Adept Surge
Adrenaline Boost
Air Thrusters
Anticipation
Anti-Flak Plating
Armored Acrobatics
Armored Evade
Armored Recovery
Calculated Spring
Final Act
Follow Through
Hastened Steps
Heightened Reflexes
No Current Leap
Overcharge Detectors
Overcharged
Quick Charge
Rime Vault
Rising Skill
Searing Leap
Surplus Diverters
Tactical Retreat
Tempered Bound
Venomous Rise
Vital Systems Bypass
Voltaic Lance
Ambush Optics
Brain Storm
Directed Convergence
Double Tap
Draining Gloom
Final Tap
Focused Acceleration
Gorgon Frenzy
Grinloked
Measured Burst
Precision Munition
Shrapnel Rounds
Skull Shots
Spring-Loaded Broadhead
Static Alacrity
Sudden Justice
Thundermiter
Triple Tap
Agile Aim
Apex Predator
Comet Rounds
Deft Tempo
Gun Glide
Hydraulic Gauge
Loose Hatch
Lucky Shot
Maximum Capacity
Overview
Recover
Ripper Rounds
Serrated Rounds
Tactical Reload
Twitch
Vanquished Prey
Bounty Hunter
Broad Eye
Crash Shot
Double-Barrel Drift
Flak Shot
Hydraulic Chamber
Kill Switch
Loaded Capacity
Lock and Load
Loose Chamber
Momentary Pause
Prize Kill
Shred Shot
Snap Shot
Soft Hands
Emergent Aftermath
Lie In Wait
Feathered Arrows
Plan B
Soaring Strike
Air Recon
Blind Shot
Calculated Victory
Eject Magazine
Full Capacity
Heavy Warhead
Hydraulic Barrel
Impaler Munitions
Loose Magazine
Meteor Munitions
Night Stalker
Razor Munitions
Recuperate
Reflex Draw
Secondary Wind
Spry Sights
Strafing Slide
Counterweight
Explosive Demise
Heartseeker
Impenetrable Offense
Martial Fury
Mortal Conduct
Relentless Assault
Serrated Edges
Sharpened Blade
Stand Ground
Sword Alone
Argent Scourge
Biting Piranha
Celestial Nightfall
Crashing Havoc
Crashing Timber
Cunning Aspect
Dividing Blades
Fateful Truth
Lashing Coil
Last Herald
Mafic Rain
Noble Cadence
Piercing Fury
Quaking Hand
Rending Wind
Rising Steel
Scarlet Hurricane
Shadow Harvest
Star Divide
Tainted Hydra
Vicious Approach`.split("\n");

const job = async () => {
  const pvemods = (await import("../../src/warframe/codex/mod.data")).default;
  let allmods = pvemods.reduce((r, v) => {
    r[v[1]] = {
      useBy: v[3],
      pve: true,
      pvp: false,
    };
    return r;
  }, {});

  pvps.forEach(v => {
    if (allmods[v]) allmods[v].pvp = true;
    else allmods[v] = { pve: false, pvp: true };
  });
  await fs.outputFile(TMP_PREFIX + "mod-exdata.json", JSON.stringify(allmods));
  await fs.outputFile(TMP_PREFIX + "mod-exdata.lua", convertObjectToLua(allmods, "Mods"));
  console.log(chalk.green("[build]"), "All Finished");
};

job();
