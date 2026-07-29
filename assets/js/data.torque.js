/* ==========================================================================
   data.torque.js
   Tightening torques for the KTM 250/300 EXC family, 2026 model year.

   SOURCE: KTM Owner's Manual 2026, item no. 3240239en, sections 24.6.1
   (engine) and 24.6.2 (chassis). Values are reproduced as published.
   Where the manual splits a value between "all standard models" and
   "all special models", both are listed and flagged, because the manual
   does not state which bucket HARDENDURO falls into for those fasteners.

   Every entry is a plain fact transcribed from the manufacturer's data
   table. Nothing in this file is inferred or estimated.

   Field reference:
     id        stable slug, used for deep links
     name      fastener as named by the manufacturer
     thread    thread size / fastener standard
     nm        torque in newton metres
     sys       subsystem key (see TorqueData.subsystems)
     locker    "243" | "2701" | null
     flag      optional caveat rendered next to the row
   ========================================================================== */

window.TorqueData = (function () {
  'use strict';

  var subsystems = [
    { key: 'engine',     label: 'Engine' },
    { key: 'clutch',     label: 'Clutch' },
    { key: 'exhaustctl', label: 'Exhaust control' },
    { key: 'cooling',    label: 'Cooling' },
    { key: 'fuel',       label: 'Fuel & intake' },
    { key: 'drivetrain', label: 'Drivetrain' },
    { key: 'brakes',     label: 'Brakes' },
    { key: 'wheels',     label: 'Wheels' },
    { key: 'suspension', label: 'Suspension' },
    { key: 'steering',   label: 'Steering & controls' },
    { key: 'frame',      label: 'Frame & bodywork' },
    { key: 'electrical', label: 'Electrical' }
  ];

  var rows = [
    /* ---- Engine internals ------------------------------------------------ */
    { id: 'eng-cyl-head',      name: 'Cylinder head screw',            thread: 'M8',        nm: 27,  sys: 'engine', locker: null },
    { id: 'eng-cyl-base-nut',  name: 'Cylinder base nut',              thread: 'M10',       nm: 35,  sys: 'engine', locker: null },
    { id: 'eng-cyl-base-stud', name: 'Cylinder base stud',             thread: 'M10',       nm: 12,  sys: 'engine', locker: null },
    { id: 'eng-crank-nut',     name: 'Crankshaft nut',                 thread: 'M12 LH x 1',nm: 60,  sys: 'engine', locker: null, flag: 'Left-hand thread' },
    { id: 'eng-balancer',      name: 'Balancer shaft screw',           thread: 'M8',        nm: 30,  sys: 'engine', locker: '243' },
    { id: 'eng-case',          name: 'Engine case screw',              thread: 'M6',        nm: 10,  sys: 'engine', locker: null },
    { id: 'eng-interflange',   name: 'Intermediate flange screw',      thread: 'M6',        nm: 8,   sys: 'engine', locker: null },
    { id: 'eng-ign-cover',     name: 'Ignition cover screw',           thread: 'M6',        nm: 8,   sys: 'engine', locker: null },
    { id: 'eng-cps',           name: 'Crankshaft position sensor screw',thread: 'M5',       nm: 6,   sys: 'engine', locker: '243' },
    { id: 'eng-stator',        name: 'Stator screw',                   thread: 'M5',        nm: 6,   sys: 'engine', locker: '2701' },
    { id: 'eng-shift-star',    name: 'Shift star screw',               thread: 'M6',        nm: 10,  sys: 'engine', locker: '243' },
    { id: 'eng-shift-lever',   name: 'Shift lever screw',              thread: 'M6',        nm: 14,  sys: 'engine', locker: '243' },
    { id: 'eng-detent-arm',    name: 'Detent arm screw',               thread: 'M5',        nm: 6,   sys: 'engine', locker: '243' },
    { id: 'eng-brg-retainer',  name: 'Bearing retainer screw',         thread: 'M5',        nm: 6,   sys: 'engine', locker: '243' },
    { id: 'eng-drain-plug',    name: 'Transmission drain plug with magnet', thread: 'M12 x 1.5', nm: 20, sys: 'engine', locker: null, flag: 'New sealing ring every time' },
    { id: 'eng-oil-level',     name: 'Gear oil level check screw',     thread: 'M6',        nm: 8,   sys: 'engine', locker: null },
    { id: 'eng-spark-plug',    name: 'Spark plug',                     thread: 'M14 x 1.25',nm: 25,  sys: 'engine', locker: null },
    { id: 'eng-starter-motor', name: 'Starter motor screw',            thread: 'M6',        nm: 10,  sys: 'engine', locker: null },
    { id: 'eng-starter-cover', name: 'Starter motor cover screw',      thread: 'M6',        nm: 8,   sys: 'engine', locker: null },
    { id: 'eng-ecu-cover',     name: 'Control unit cover screw',       thread: 'M5',        nm: 6,   sys: 'engine', locker: null },

    /* ---- Clutch ---------------------------------------------------------- */
    { id: 'clu-hub-nut',       name: 'Inner clutch hub nut',           thread: 'M18 x 1.5', nm: 100, sys: 'clutch', locker: '243' },
    { id: 'clu-primary-nut',   name: 'Primary gear nut',               thread: 'M18 LH x 1.5', nm: 150, sys: 'clutch', locker: '243', flag: 'Left-hand thread' },
    { id: 'clu-spring-ret',    name: 'Clutch spring retainer screw',   thread: 'M5',        nm: 6,   sys: 'clutch', locker: null },
    { id: 'clu-outer-cover',   name: 'Outer clutch cover screw',       thread: 'M6',        nm: 8,   sys: 'clutch', locker: null },
    { id: 'clu-inner-cover',   name: 'Inner clutch cover screw',       thread: 'M6',        nm: 10,  sys: 'clutch', locker: null },

    /* ---- Exhaust control ------------------------------------------------- */
    { id: 'exc-actuator',      name: 'Actuator screw',                 thread: 'M5',        nm: 5,   sys: 'exhaustctl', locker: '243' },
    { id: 'exc-act-cover',     name: 'Actuator cover screw',           thread: 'M5',        nm: 5,   sys: 'exhaustctl', locker: '243' },
    { id: 'exc-act-cover-2',   name: 'Exhaust control actuator cover screw', thread: 'M5',  nm: 5,   sys: 'exhaustctl', locker: '243' },
    { id: 'exc-flap',          name: 'Exhaust control flap screw',     thread: 'M5',        nm: 8,   sys: 'exhaustctl', locker: '243' },
    { id: 'exc-main-shaft',    name: 'Exhaust control main shaft screw',thread: 'M5',       nm: 8,   sys: 'exhaustctl', locker: '243' },
    { id: 'exc-flap-axle-nut', name: 'Control flap axle nut',          thread: 'M5',        nm: 5,   sys: 'exhaustctl', locker: null },
    { id: 'exc-bracket',       name: 'Exhaust control retaining bracket screw', thread: 'M5', nm: 6, sys: 'exhaustctl', locker: '2701' },
    { id: 'exc-manifold',      name: 'Exhaust manifold screw',         thread: 'M8',        nm: 15,  sys: 'exhaustctl', locker: null },

    /* ---- Cooling --------------------------------------------------------- */
    { id: 'cool-pump-cover',   name: 'Water pump cover screw',         thread: 'M6 x 40',   nm: 10,  sys: 'cooling', locker: null },
    { id: 'cool-impeller',     name: 'Water pump impeller cap nut',    thread: 'M6',        nm: 5,   sys: 'cooling', locker: '243' },
    { id: 'cool-bleed',        name: 'Cylinder head bleed screw',      thread: 'M6',        nm: 10,  sys: 'cooling', locker: null },
    { id: 'cool-nozzle',       name: 'Cooling system screw-in nozzle', thread: 'M24 x 1.5', nm: 7.5, sys: 'cooling', locker: '243' },
    { id: 'cool-temp-sensor',  name: 'Water temperature sensor to T-plate', thread: 'M10',  nm: 10,  sys: 'cooling', locker: null },
    { id: 'cool-hose-clip',    name: 'Radiator hose clip screw',       thread: 'Clip',      nm: 2.4, sys: 'cooling', locker: null },

    /* ---- Fuel & intake --------------------------------------------------- */
    { id: 'fue-intake-manifold', name: 'Intake manifold / diaphragm housing screw', thread: 'M6', nm: 6, sys: 'fuel', locker: null },
    { id: 'fue-reed-support',  name: 'Reed valve support plate screw',  thread: 'EJOT DELTA PT 30 x 12', nm: 1, sys: 'fuel', locker: null },
    { id: 'fue-membrane-out',  name: 'Outer membrane sheet screw',      thread: 'EJOT DELTA PT 30 x 6',  nm: 1, sys: 'fuel', locker: null },
    { id: 'fue-membrane-in',   name: 'Inner membrane sheet screw',      thread: 'EJOT DELTA PT 35 x 25', nm: 1, sys: 'fuel', locker: null },
    { id: 'fue-pressure-sensor', name: 'Crankcase pressure sensor screw', thread: 'EJOT PT K60 x 20 AL', nm: 2.5, sys: 'fuel', locker: null },
    { id: 'fue-pump',          name: 'Fuel pump screw',                 thread: 'EJOT PT K60 x 30 Z', nm: 2.3, sys: 'fuel', locker: null },
    { id: 'fue-iat-sensor',    name: 'Intake air temperature sensor screw', thread: 'EJOT DELTA PT K50 x 18', nm: 0.7, sys: 'fuel', locker: null },
    { id: 'fue-tb-cover',      name: 'Throttle body cover screw',       thread: 'M5',       nm: 2.6, sys: 'fuel', locker: null },
    { id: 'fue-inlet-clip',    name: 'Inlet sleeve hose clip screw',    thread: 'Clip',     nm: 2.8, sys: 'fuel', locker: null },
    { id: 'fue-carbon-hose',   name: 'Active carbon filter hose connector', thread: 'Connector', nm: 3.8, sys: 'fuel', locker: null },
    { id: 'fue-oil-tank-frame',name: 'Oil tank on frame screw',         thread: 'M6',       nm: 6,   sys: 'fuel', locker: null },
    { id: 'fue-oil-pump',      name: 'Oil pump screw',                  thread: 'M6',       nm: 6,   sys: 'fuel', locker: null },
    { id: 'fue-oil-pump-holder', name: 'Oil pump holder on oil tank screw', thread: 'M6',   nm: 6,   sys: 'fuel', locker: null },
    { id: 'fue-oil-tank-cap',  name: 'Oil tank cap screw',              thread: 'M6',       nm: 6,   sys: 'fuel', locker: null },
    { id: 'fue-oil-lvl-sensor',name: 'Oil fill level sensor screw',     thread: 'EJOT PT 50 x 18', nm: 2.5, sys: 'fuel', locker: null },

    /* ---- Drivetrain ------------------------------------------------------ */
    { id: 'drv-front-sprocket',name: 'Front sprocket screw',            thread: 'M10',      nm: 60,  sys: 'drivetrain', locker: '2701' },
    { id: 'drv-rear-sprocket', name: 'Rear sprocket nut',               thread: 'M8',       nm: 35,  sys: 'drivetrain', locker: '2701' },
    { id: 'drv-sprocket-cover',name: 'Front sprocket cover screw',      thread: 'M8',       nm: 15,  sys: 'drivetrain', locker: null },
    { id: 'drv-chain-guide',   name: 'Chain guide screw',               thread: 'M6',       nm: 10,  sys: 'drivetrain', locker: null },
    { id: 'drv-chain-slider',  name: 'Chain slider screw',              thread: 'M8',       nm: 15,  sys: 'drivetrain', locker: null },
    { id: 'drv-slider-guard',  name: 'Chain slider guard screw',        thread: 'M6',       nm: 6,   sys: 'drivetrain', locker: '243' },

    /* ---- Brakes ---------------------------------------------------------- */
    { id: 'brk-front-caliper', name: 'Front brake caliper screw',       thread: 'M8',       nm: 25,  sys: 'brakes', locker: '243' },
    { id: 'brk-rear-caliper',  name: 'Brake caliper on caliper bracket screw', thread: 'M10', nm: 45, sys: 'brakes', locker: '243' },
    { id: 'brk-front-disc',    name: 'Front brake disc screw',          thread: 'M6',       nm: 14,  sys: 'brakes', locker: '243' },
    { id: 'brk-rear-disc',     name: 'Rear brake disc screw',           thread: 'M6',       nm: 14,  sys: 'brakes', locker: '243' },
    { id: 'brk-lever',         name: 'Hand brake lever screw',          thread: 'M6',       nm: 5,   sys: 'brakes', locker: null },
    { id: 'brk-pushrod',       name: 'Push rod ball joint on rear brake cylinder', thread: 'M6', nm: 10, sys: 'brakes', locker: '243' },
    { id: 'brk-pedal-stop',    name: 'Brake pedal stop nut',            thread: 'M8',       nm: 25,  sys: 'brakes', locker: null },
    { id: 'brk-pedal-bushing', name: 'Foot brake lever bushing',        thread: 'M10',      nm: 45,  sys: 'brakes', locker: null },
    { id: 'brk-line-guide',    name: 'Brake line guide for link fork screw', thread: 'M6',  nm: 4.5, sys: 'brakes', locker: '243' },

    /* ---- Wheels ---------------------------------------------------------- */
    { id: 'whl-front-spindle', name: 'Front wheel spindle screw',       thread: 'M20 x 1.5',nm: 35,  sys: 'wheels', locker: null },
    { id: 'whl-rear-spindle',  name: 'Rear wheel spindle nut',          thread: 'M22 x 1.5',nm: 80,  sys: 'wheels', locker: null },
    { id: 'whl-fork-shoe',     name: 'Fork shoe screw (axle clamp)',    thread: 'M8',       nm: 15,  sys: 'wheels', locker: null },
    { id: 'whl-spoke-front',   name: 'Front wheel spoke nipple',        thread: 'M4.5',     nm: 6,   sys: 'wheels', locker: null },
    { id: 'whl-spoke-rear',    name: 'Rear wheel spoke nipple',         thread: 'M4.5',     nm: 6,   sys: 'wheels', locker: null },
    { id: 'whl-rim-lock',      name: 'Rim lock nut',                    thread: 'M8',       nm: 12,  sys: 'wheels', locker: null },
    { id: 'whl-speed-sensor',  name: 'Wheel speed sensor on axle clamp screw', thread: 'M8', nm: 4.5, sys: 'wheels', locker: null },

    /* ---- Suspension ------------------------------------------------------ */
    { id: 'sus-shock-top',     name: 'Shock absorber top screw',        thread: 'M12',      nm: 80,  sys: 'suspension', locker: '2701' },
    { id: 'sus-shock-bottom',  name: 'Shock absorber bottom screw',     thread: 'M12',      nm: 80,  sys: 'suspension', locker: '2701' },
    { id: 'sus-swingarm',      name: 'Swingarm pivot nut',              thread: 'M16 x 1.5',nm: 100, sys: 'suspension', locker: null },
    { id: 'sus-adj-ring',      name: 'Shock absorber adjusting ring screw', thread: 'M5',   nm: 5,   sys: 'suspension', locker: null },
    { id: 'sus-clamp-top-std', name: 'Top triple clamp screw (standard models)',  thread: 'M8', nm: 20, sys: 'suspension', locker: null, flag: 'Standard models' },
    { id: 'sus-clamp-top-spc', name: 'Top triple clamp screw (special models)',   thread: 'M8', nm: 17, sys: 'suspension', locker: null, flag: 'Special models' },
    { id: 'sus-clamp-bot-std', name: 'Bottom triple clamp screw (standard models)', thread: 'M8', nm: 15, sys: 'suspension', locker: null, flag: 'Standard models' },
    { id: 'sus-clamp-bot-spc', name: 'Bottom triple clamp screw (special models)',  thread: 'M8', nm: 12, sys: 'suspension', locker: null, flag: 'Special models' },
    { id: 'sus-stem-upper',    name: 'Upper steering stem screw',       thread: 'M8',       nm: 20,  sys: 'suspension', locker: '243', flag: 'Standard models' },
    { id: 'sus-steer-head-top',name: 'Top steering head screw',         thread: 'M20 x 1.5',nm: 12,  sys: 'suspension', locker: null },

    /* ---- Steering & controls --------------------------------------------- */
    { id: 'str-bar-clamp',     name: 'Handlebar clamp screw',           thread: 'M8',       nm: 20,  sys: 'steering', locker: null },
    { id: 'str-bar-mount',     name: 'Handlebar mount screw',           thread: 'M10',      nm: 40,  sys: 'steering', locker: '243' },
    { id: 'str-fixed-grip',    name: 'Fixed grip screw',                thread: 'M4',       nm: 5,   sys: 'steering', locker: '243' },
    { id: 'str-twist-grip',    name: 'Throttle twist grip screw',       thread: 'M6',       nm: 5,   sys: 'steering', locker: null },
    { id: 'str-throttle-nut',  name: 'Throttle cable nut on throttle body', thread: 'M6',   nm: 3,   sys: 'steering', locker: null },
    { id: 'str-clutch-lever',  name: 'Clutch lever screw',              thread: 'M6',       nm: 5,   sys: 'steering', locker: null },

    /* ---- Frame & bodywork ------------------------------------------------ */
    { id: 'frm-engine-bracket',name: 'Engine bracket screw',            thread: 'M10',      nm: 60,  sys: 'frame', locker: null },
    { id: 'frm-engine-brace',  name: 'Engine brace screw',              thread: 'M8 x 20',  nm: 25,  sys: 'frame', locker: '243' },
    { id: 'frm-subframe-top',  name: 'Subframe screw, top',             thread: 'M8',       nm: 35,  sys: 'frame', locker: '243' },
    { id: 'frm-subframe-bot',  name: 'Subframe screw, bottom',          thread: 'M8',       nm: 30,  sys: 'frame', locker: '2701' },
    { id: 'frm-subframe-box',  name: 'Subframe with filter box screw',  thread: 'EJOT PT K60 x 20 AL', nm: 5, sys: 'frame', locker: null },
    { id: 'frm-sidestand',     name: 'Side stand attachment screw',     thread: 'M8 x 26',  nm: 33,  sys: 'frame', locker: '2701' },
    { id: 'frm-seat',          name: 'Seat installation screw',         thread: 'M6',       nm: 8,   sys: 'frame', locker: null },
    { id: 'frm-fender',        name: 'Front fender to triple clamp screw', thread: 'M6',    nm: 12,  sys: 'frame', locker: null },
    { id: 'frm-tank-spoiler',  name: 'Fuel tank spoiler on radiator screw', thread: 'M6',   nm: 6,   sys: 'frame', locker: null },
    { id: 'frm-frame-prot',    name: 'Frame protector screw',           thread: 'M5',       nm: 3,   sys: 'frame', locker: null },
    { id: 'frm-mushroom',      name: 'Mushroom head screw, spoiler and seat', thread: 'Mushroom head', nm: 2.5, sys: 'frame', locker: null },
    { id: 'frm-gen-m5-s',      name: 'Remaining screws on chassis',     thread: 'M5',       nm: 5,   sys: 'frame', locker: null, flag: 'Generic fallback' },
    { id: 'frm-gen-m5-n',      name: 'Remaining nuts on chassis',       thread: 'M5',       nm: 5,   sys: 'frame', locker: null, flag: 'Generic fallback' },
    { id: 'frm-gen-m6-s',      name: 'Remaining screws on chassis',     thread: 'M6',       nm: 10,  sys: 'frame', locker: null, flag: 'Generic fallback' },
    { id: 'frm-gen-m6-n',      name: 'Remaining nuts on chassis',       thread: 'M6',       nm: 10,  sys: 'frame', locker: null, flag: 'Generic fallback' },
    { id: 'frm-gen-m8-s',      name: 'Remaining screws on chassis',     thread: 'M8',       nm: 25,  sys: 'frame', locker: null, flag: 'Generic fallback' },
    { id: 'frm-gen-m8-n',      name: 'Remaining nuts on chassis',       thread: 'M8',       nm: 25,  sys: 'frame', locker: null, flag: 'Generic fallback' },
    { id: 'frm-gen-m10-s',     name: 'Remaining screws on chassis',     thread: 'M10',      nm: 45,  sys: 'frame', locker: null, flag: 'Generic fallback' },
    { id: 'frm-gen-m10-n',     name: 'Remaining nuts on chassis',       thread: 'M10',      nm: 45,  sys: 'frame', locker: null, flag: 'Generic fallback' },
    { id: 'frm-gen-ejot',      name: 'Remaining screws on chassis',     thread: 'EJOT PT K60 x 25 Z', nm: 2, sys: 'frame', locker: null, flag: 'Generic fallback' },

    /* ---- Electrical ------------------------------------------------------ */
    { id: 'ele-battery-term',  name: 'Battery terminal screw',          thread: 'M5',       nm: 2.5, sys: 'electrical', locker: null },
    { id: 'ele-battery-brkt',  name: 'Battery holding bracket screw',   thread: 'M6',       nm: 6,   sys: 'electrical', locker: null },
    { id: 'ele-starter-relay', name: 'Cable on starter relay screw',    thread: 'M6',       nm: 6,   sys: 'electrical', locker: null },
    { id: 'ele-ground-tail',   name: 'Ground wire in tail section screw',thread: 'M6',      nm: 10,  sys: 'electrical', locker: null },
    { id: 'ele-connector-brd', name: 'Connector board incl. instrument screw', thread: 'M6', nm: 5,  sys: 'electrical', locker: null },
    { id: 'ele-start-kill',    name: 'Start / kill button screw',       thread: 'EJOT PT K50 x 18', nm: 2, sys: 'electrical', locker: null },
    { id: 'ele-light-switch',  name: 'Light switch screw',              thread: 'M5',       nm: 1,   sys: 'electrical', locker: null, flag: 'Non-US models' },
    { id: 'ele-turn-switch',   name: 'Turn signal switch screw',        thread: 'M5',       nm: 1,   sys: 'electrical', locker: null },
    { id: 'ele-pull-switch',   name: 'Pull switch nut',                 thread: 'M8',       nm: 0.8, sys: 'electrical', locker: null, flag: 'XC-W models' }
  ];

  /**
   * Newton metres to pound-feet, matching the rounding KTM publishes.
   *
   * The manual's convention is one more decimal place than the metric value
   * carries: 25 Nm prints as 18.4 ft-lbf, while 2.5 Nm prints as 1.84. Every
   * conversion this produces has been checked against the printed table, so
   * the imperial column agrees with the book rather than approximating it.
   */
  function toLbFt(nm) {
    var decimals = String(nm).indexOf('.') === -1 ? 1 : 2;
    return (nm * 0.737562).toFixed(decimals);
  }

  function labelFor(key) {
    for (var i = 0; i < subsystems.length; i++) {
      if (subsystems[i].key === key) return subsystems[i].label;
    }
    return key;
  }

  function find(id) {
    for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
    return null;
  }

  return {
    rows: rows,
    subsystems: subsystems,
    toLbFt: toLbFt,
    labelFor: labelFor,
    find: find
  };
})();
