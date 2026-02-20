import { Scene } from "phaser";
import { EventBus } from "../EventBus";

/** Project tile size (TinySwords: 64x64) */
const TILE_SIZE = 64;

/** Tilemap display scale: tiles render at 1/6 size on screen (1/3 then ÷2). */
const TILE_DISPLAY_SCALE = 1 / 2;
/** Tile frame index 9 (row 1, col 0 in tilemap) – used for flat ground. */
const FLAT_GROUND_1_SINGLE = 10;
const FLAT_GROUND_1_TOP_LEFT_CORNER = 0;
const FLAT_GROUND_1_TOP_RIGHT_CORNER = 2;
const FLAT_GROUND_1_BOTTOM_LEFT_CORNER = 18;
const FLAT_GROUND_1_BOTTOM_RIGHT_CORNER = 20;
const FLAT_GROUND_1_LEFT_EDGE = 9;
const FLAT_GROUND_1_RIGHT_EDGE = 11;
const FLAT_GROUND_1_TOP_EDGE = 1;
const FLAT_GROUND_1_BOTTOM_EDGE = 19;

/** Flat ground layout: 4 columns × 10 rows of tile 9, centered. */
const FLAT_GROUND_COLS = 20;
const FLAT_GROUND_ROWS = 5;

/** Water Foam spritesheet: 3072×192 total, 16 frames → 192×192 per frame. */
const WATER_FOAM_FRAME_WIDTH = 192;
const WATER_FOAM_FRAME_HEIGHT = 192;
const WATER_FOAM_FRAME_COUNT = 16;
const WATER_FOAM_SCALE = 1.5;

const ELEVATED_GROUND_LEFT_EDGE_GROUND = 32;
const ELEVATED_GROUND_LEFT_EDGE_TERRAIN = 41;
const ELEVATED_GROUND_RIGHT_EDGE_GROUND = 34;
const ELEVATED_GROUND_RIGHT_EDGE_TERRAIN = 43;
const ELEVATED_GROUND_SINGLE_GROUND = 33;
const ELEVATED_GROUND_SINGLE_TERRAIN = 42;

const SHADOW_FRAME_WIDTH = 192;
const SHADOW_FRAME_HEIGHT = 192;

const BLUE_CASTLE_FRAME_WIDTH = 192;
const BLUE_CASTLE_FRAME_HEIGHT = 192;
const RED_CASTLE_FRAME_WIDTH = 192;
const RED_CASTLE_FRAME_HEIGHT = 192;

/** Blue warrior unit sprites (frame size may vary by sheet; 48×48 typical). */
const WARRIOR_FRAME_WIDTH = 192;
const WARRIOR_FRAME_HEIGHT = 192;
const BLUE_WARRIOR_RUN_SPEED = 120;
const RED_WARRIOR_RUN_SPEED = 120;
/** Min distance between warrior x positions so they don’t overlap; also used to resume running when clear. */
const WARRIOR_OVERLAP_THRESHOLD = WARRIOR_FRAME_WIDTH / 5;

const WARRIOR_STATE_RUNNING = "running";
const WARRIOR_STATE_IDLE = "idle";
const WARRIOR_STATE_ATTACKING = "attacking";
/** Random delay (ms) before attack animation starts – min/max for variety. */
const ATTACK_START_DELAY_MS_MIN = 0;
const ATTACK_START_DELAY_MS_MAX = 400;

/** Small health bar: base 320×64 (3 frames: left, middle, right), fill 64×64. */
const SMALL_BAR_BASE_WIDTH = 64;
const SMALL_BAR_BASE_HEIGHT = 64;
/** Base spritesheet frame indices: left, middle, right. Bar = 1 left + 3 middle + 1 right. */
const SMALL_BAR_LEFT_EDGE = 0;
const SMALL_BAR_MIDDLE = 2;
const SMALL_BAR_RIGHT_EDGE = 4;
/** Unit health bar display size (same scale as castle bar). */
const UNIT_BAR_SEGMENT_W = SMALL_BAR_BASE_WIDTH / 3;
const UNIT_BAR_SEGMENT_H = SMALL_BAR_BASE_HEIGHT / 3;
const UNIT_BAR_Y_OFFSET = (TILE_SIZE * TILE_DISPLAY_SCALE) / 2;
/** Extra offset: right and above the unit. */
const UNIT_BAR_X_OFFSET = 10;
const UNIT_BAR_Y_EXTRA = 6;

const WARRIOR_INITIAL_STATS = {
    health: 100,
    attack: 10,
    defense: 5,
    speed: 6,
    attackSpeed: 8,
    attackRange: WARRIOR_OVERLAP_THRESHOLD,
};

export class Game extends Scene {
    private blueWarriorSpawnX = 0;
    private blueWarriorSpawnY = 0;
    private blueCastleX = 0;
    private blueWarriors: Phaser.GameObjects.Sprite[] = [];
    private redWarriorSpawnX = 0;
    private redWarriorSpawnY = 0;
    private redCastleX = 0;
    private redWarriors: Phaser.GameObjects.Sprite[] = [];

    constructor() {
        super("Game");
    }

    preload() {
        this.load.setPath("assets");
        this.load.image("nelson", "nelson.png");
        this.load.image("star", "star.png");
        this.load.image("background", "bg.png");
        this.load.image("logo", "logo.png");
        // Layer 0: BG Color (water) – TinySwords tilemap guide
        this.load.image("water-bg", "Water Background color.png");
        // Layer 1: Water Foam (animated) – assets/Water Foam.png, 192×192, 16 frames
        this.load.spritesheet("water-foam", "Water Foam.png", {
            frameWidth: WATER_FOAM_FRAME_WIDTH,
            frameHeight: WATER_FOAM_FRAME_HEIGHT,
        });
        // Layer 2: Tilemap_color1 (576×384, 9×6 tiles)
        this.load.spritesheet("tilemap_color1", "Tilemap_color1.png", {
            frameWidth: TILE_SIZE,
            frameHeight: TILE_SIZE,
        });
        // Layer 3: Shadow (192×192)
        this.load.spritesheet("shadow", "Shadow.png", {
            frameWidth: SHADOW_FRAME_WIDTH,
            frameHeight: SHADOW_FRAME_HEIGHT,
        });
        // Layer 4: Tilemap_color2 (576×384, 9×6 tiles)
        this.load.spritesheet("tilemap_color2", "Tilemap_color2.png", {
            frameWidth: TILE_SIZE,
            frameHeight: TILE_SIZE,
        });

        // Layer 5: Castle (192×192)
        this.load.spritesheet("blue-castle", "Blue Castle.png", {
            frameWidth: BLUE_CASTLE_FRAME_WIDTH,
            frameHeight: BLUE_CASTLE_FRAME_HEIGHT,
        });
        this.load.spritesheet("red-castle", "Red Castle.png", {
            frameWidth: RED_CASTLE_FRAME_WIDTH,
            frameHeight: RED_CASTLE_FRAME_HEIGHT,
        });
        // Blue warrior unit (blue faction)
        this.load.spritesheet(
            "blue-warrior-attack1",
            "Blue_Warrior_Attack1.png",
            {
                frameWidth: WARRIOR_FRAME_WIDTH,
                frameHeight: WARRIOR_FRAME_HEIGHT,
            },
        );
        this.load.spritesheet(
            "blue-warrior-attack2",
            "Blue_Warrior_Attack2.png",
            {
                frameWidth: WARRIOR_FRAME_WIDTH,
                frameHeight: WARRIOR_FRAME_HEIGHT,
            },
        );
        this.load.spritesheet("blue-warrior-guard", "Blue_Warrior_Guard.png", {
            frameWidth: WARRIOR_FRAME_WIDTH,
            frameHeight: WARRIOR_FRAME_HEIGHT,
        });
        this.load.spritesheet("blue-warrior-idle", "Blue_Warrior_Idle.png", {
            frameWidth: WARRIOR_FRAME_WIDTH,
            frameHeight: WARRIOR_FRAME_HEIGHT,
        });
        this.load.spritesheet("blue-warrior-run", "Blue_Warrior_Run.png", {
            frameWidth: WARRIOR_FRAME_WIDTH,
            frameHeight: WARRIOR_FRAME_HEIGHT,
        });
        // Red warrior unit (red faction, faces left)
        this.load.spritesheet(
            "red-warrior-attack1",
            "Red_Warrior_Attack1.png",
            {
                frameWidth: WARRIOR_FRAME_WIDTH,
                frameHeight: WARRIOR_FRAME_HEIGHT,
            },
        );
        this.load.spritesheet(
            "red-warrior-attack2",
            "Red_Warrior_Attack2.png",
            {
                frameWidth: WARRIOR_FRAME_WIDTH,
                frameHeight: WARRIOR_FRAME_HEIGHT,
            },
        );
        this.load.spritesheet("red-warrior-guard", "Red_Warrior_Guard.png", {
            frameWidth: WARRIOR_FRAME_WIDTH,
            frameHeight: WARRIOR_FRAME_HEIGHT,
        });
        this.load.spritesheet("red-warrior-idle", "Red_Warrior_Idle.png", {
            frameWidth: WARRIOR_FRAME_WIDTH,
            frameHeight: WARRIOR_FRAME_HEIGHT,
        });
        this.load.spritesheet("red-warrior-run", "Red_Warrior_Run.png", {
            frameWidth: WARRIOR_FRAME_WIDTH,
            frameHeight: WARRIOR_FRAME_HEIGHT,
        });
        this.load.spritesheet("small-bar-base", "SmallBar_Base.png", {
            frameWidth: SMALL_BAR_BASE_WIDTH,
            frameHeight: SMALL_BAR_BASE_HEIGHT,
        });
        this.load.spritesheet("small-bar-fill", "SmallBar_Fill.png", {
            frameWidth: SMALL_BAR_BASE_WIDTH,
            frameHeight: SMALL_BAR_BASE_HEIGHT,
        });
        // BGM
        this.load.audio("bgm", "1-10. Floral Life.mp3");
    }

    create() {
        const { width, height } = this.scale;

        // BGM – loop
        this.sound.add("bgm", { loop: true }).play();

        // Layer 0: Water background (BG Color) – fills entire screen
        const waterBg = this.add.image(width / 2, height / 2, "water-bg");
        waterBg.setDisplaySize(width, height);
        waterBg.setDepth(0);

        const tileDisplaySize = TILE_SIZE * TILE_DISPLAY_SCALE;
        const startX =
            width / 2 -
            (FLAT_GROUND_COLS * tileDisplaySize) / 2 +
            tileDisplaySize / 2;
        const startY =
            height / 2 -
            (FLAT_GROUND_ROWS * tileDisplaySize) / 2 +
            tileDisplaySize / 2;
        const lastRow = FLAT_GROUND_ROWS - 1;
        const lastCol = FLAT_GROUND_COLS - 1;

        // Layer 1: Water Foam – one animated sprite behind each ground tile (depth 1)
        if (!this.anims.exists("water-foam")) {
            this.anims.create({
                key: "water-foam",
                frames: this.anims.generateFrameNumbers("water-foam", {
                    start: 0,
                    end: WATER_FOAM_FRAME_COUNT - 1,
                }),
                frameRate: 10,
                repeat: -1,
            });
        }
        const foamDisplayScale =
            WATER_FOAM_SCALE * (TILE_SIZE / WATER_FOAM_FRAME_WIDTH);
        const foamDepth = 1;
        for (let row = 0; row < FLAT_GROUND_ROWS; row++) {
            for (let col = 0; col < FLAT_GROUND_COLS; col++) {
                const foam = this.add.sprite(
                    startX + col * tileDisplaySize,
                    startY + row * tileDisplaySize,
                    "water-foam",
                );
                foam.setDepth(foamDepth).setScale(foamDisplayScale);
                foam.play("water-foam", true);
                foam.anims.setProgress(Phaser.Math.FloatBetween(0, 1));
            }
        }

        // Layer 2: flat ground with corners and edges wrapping the interior (depth 2)
        for (let row = 0; row < FLAT_GROUND_ROWS; row++) {
            for (let col = 0; col < FLAT_GROUND_COLS; col++) {
                let frame: number;
                const isTop = row === 0;
                const isBottom = row === lastRow;
                const isLeft = col === 0;
                const isRight = col === lastCol;
                if (isTop) {
                    frame = isLeft
                        ? FLAT_GROUND_1_TOP_LEFT_CORNER
                        : isRight
                          ? FLAT_GROUND_1_TOP_RIGHT_CORNER
                          : FLAT_GROUND_1_TOP_EDGE;
                } else if (isBottom) {
                    frame = isLeft
                        ? FLAT_GROUND_1_BOTTOM_LEFT_CORNER
                        : isRight
                          ? FLAT_GROUND_1_BOTTOM_RIGHT_CORNER
                          : FLAT_GROUND_1_BOTTOM_EDGE;
                } else {
                    frame = isLeft
                        ? FLAT_GROUND_1_LEFT_EDGE
                        : isRight
                          ? FLAT_GROUND_1_RIGHT_EDGE
                          : FLAT_GROUND_1_SINGLE;
                }
                const tile = this.add.image(
                    startX + col * tileDisplaySize,
                    startY + row * tileDisplaySize,
                    "tilemap_color1",
                    frame,
                );
                tile.setScale(TILE_DISPLAY_SCALE);
                tile.setDepth(2);
            }
        }

        const startingRow = 2,
            startingCol = 1,
            endingRow = 2,
            endingCol = 18;

        // Layer 3: Shadow
        for (let row = startingRow; row <= endingRow; row++) {
            for (let col = startingCol; col <= endingCol; col++) {
                this.add
                    .image(
                        startX + col * tileDisplaySize,
                        startY + row * tileDisplaySize,
                        "shadow",
                    )
                    .setScale(TILE_DISPLAY_SCALE)
                    .setDepth(3);
            }
        }

        // Layer 4: Elevated ground with left and right edges wrapping the interior (depth 3)

        for (let row = startingRow; row <= endingRow; row++) {
            for (let col = startingCol; col <= endingCol; col++) {
                let frame: number;
                if (col === startingCol) {
                    frame = ELEVATED_GROUND_LEFT_EDGE_TERRAIN;
                } else if (col === endingCol) {
                    frame = ELEVATED_GROUND_RIGHT_EDGE_TERRAIN;
                } else {
                    frame = ELEVATED_GROUND_SINGLE_TERRAIN;
                }
                this.add
                    .image(
                        startX + col * tileDisplaySize,
                        startY + row * tileDisplaySize,
                        "tilemap_color2",
                        frame,
                    )
                    .setScale(TILE_DISPLAY_SCALE)
                    .setDepth(4);
            }
        }

        for (let row = startingRow - 1; row <= endingRow - 1; row++) {
            for (let col = startingCol; col <= endingCol; col++) {
                let frame: number;
                if (col === startingCol) {
                    frame = ELEVATED_GROUND_LEFT_EDGE_GROUND;
                } else if (col === endingCol) {
                    frame = ELEVATED_GROUND_RIGHT_EDGE_GROUND;
                } else {
                    frame = ELEVATED_GROUND_SINGLE_GROUND;
                }
                this.add
                    .image(
                        startX + col * tileDisplaySize,
                        startY + row * tileDisplaySize,
                        "tilemap_color2",
                        frame,
                    )
                    .setScale(TILE_DISPLAY_SCALE)
                    .setDepth(4);
            }
        }

        // Layer 5: Game Objects
        const blueCastle = this.add.image(
            startX + 1 * tileDisplaySize,
            startY + 1 * tileDisplaySize - tileDisplaySize / 2,
            "blue-castle",
        );
        blueCastle.setScale(TILE_DISPLAY_SCALE / 2).setDepth(5);
        this.blueCastleX = blueCastle.x;

        const blueWarriorX = blueCastle.x + tileDisplaySize;
        const blueWarriorY = blueCastle.y + tileDisplaySize / 5;
        this.blueWarriorSpawnX = blueWarriorX;
        this.blueWarriorSpawnY = blueWarriorY;

        if (!this.anims.exists("blue-warrior-idle")) {
            this.anims.create({
                key: "blue-warrior-idle",
                frames: this.anims.generateFrameNumbers(
                    "blue-warrior-idle",
                    {},
                ),
                frameRate: 8,
                repeat: -1,
            });
            this.anims.create({
                key: "blue-warrior-run",
                frames: this.anims.generateFrameNumbers("blue-warrior-run", {}),
                frameRate: WARRIOR_INITIAL_STATS.speed,
                repeat: -1,
            });
            this.anims.create({
                key: "blue-warrior-guard",
                frames: this.anims.generateFrameNumbers(
                    "blue-warrior-guard",
                    {},
                ),
                frameRate: WARRIOR_INITIAL_STATS.attackSpeed,
                repeat: -1,
            });
            this.anims.create({
                key: "blue-warrior-attack1",
                frames: this.anims.generateFrameNumbers(
                    "blue-warrior-attack1",
                    {},
                ),
                frameRate: WARRIOR_INITIAL_STATS.attackSpeed,
                repeat: 0,
            });
            this.anims.create({
                key: "blue-warrior-attack2",
                frames: this.anims.generateFrameNumbers(
                    "blue-warrior-attack2",
                    {},
                ),
                frameRate: WARRIOR_INITIAL_STATS.attackSpeed,
                repeat: 0,
            });
        }
        // const blueWarrior = this.add.sprite(
        //     blueWarriorX,
        //     blueWarriorY,
        //     "blue-warrior-idle",
        // );
        // blueWarrior.setScale(TILE_DISPLAY_SCALE).setDepth(6);
        // blueWarrior.play("blue-warrior-idle", true);

        this.input.keyboard?.on("keydown-Q", () => {
            const w = this.add.sprite(
                this.blueWarriorSpawnX,
                this.blueWarriorSpawnY,
                "blue-warrior-run",
            );
            w.setScale(TILE_DISPLAY_SCALE).setDepth(6);
            w.setData("state", WARRIOR_STATE_RUNNING);
            w.setData("faction", "blue");
            w.setData("health", WARRIOR_INITIAL_STATS.health);
            w.setData("maxHealth", WARRIOR_INITIAL_STATS.health);
            w.setData("attack", WARRIOR_INITIAL_STATS.attack);
            w.setData("defense", WARRIOR_INITIAL_STATS.defense);
            w.setData("attackSpeed", WARRIOR_INITIAL_STATS.attackSpeed);
            w.on("animationcomplete", this.onWarriorAttackComplete, this);
            w.play("blue-warrior-run", true);
            this.createUnitHealthBar(w);
            this.blueWarriors.push(w);
        });

        const redCastle = this.add.image(
            startX + 18 * tileDisplaySize,
            startY + 1 * tileDisplaySize - tileDisplaySize / 2,
            "red-castle",
        );
        redCastle.setScale(TILE_DISPLAY_SCALE / 2).setDepth(5);
        this.redCastleX = redCastle.x;

        // Red warrior unit – 1 tile left of red castle, same y, facing left
        const redWarriorX = redCastle.x - tileDisplaySize;
        const redWarriorY = redCastle.y + tileDisplaySize / 5;
        this.redWarriorSpawnX = redWarriorX;
        this.redWarriorSpawnY = redWarriorY;
        if (!this.anims.exists("red-warrior-idle")) {
            this.anims.create({
                key: "red-warrior-idle",
                frames: this.anims.generateFrameNumbers("red-warrior-idle", {}),
                frameRate: 8,
                repeat: -1,
            });
            this.anims.create({
                key: "red-warrior-run",
                frames: this.anims.generateFrameNumbers("red-warrior-run", {}),
                frameRate: WARRIOR_INITIAL_STATS.speed,
                repeat: -1,
            });
            this.anims.create({
                key: "red-warrior-guard",
                frames: this.anims.generateFrameNumbers(
                    "red-warrior-guard",
                    {},
                ),
                frameRate: WARRIOR_INITIAL_STATS.attackSpeed,
                repeat: -1,
            });
            this.anims.create({
                key: "red-warrior-attack1",
                frames: this.anims.generateFrameNumbers(
                    "red-warrior-attack1",
                    {},
                ),
                frameRate: WARRIOR_INITIAL_STATS.attackSpeed,
                repeat: 0,
            });
            this.anims.create({
                key: "red-warrior-attack2",
                frames: this.anims.generateFrameNumbers(
                    "red-warrior-attack2",
                    {},
                ),
                frameRate: WARRIOR_INITIAL_STATS.attackSpeed,
                repeat: 0,
            });
        }
        // const redWarrior = this.add.sprite(
        //     redWarriorX,
        //     redWarriorY,
        //     "red-warrior-idle",
        // );
        // redWarrior
        //     .setScale(TILE_DISPLAY_SCALE)
        //     .setDepth(6)
        //     .setFlipX(true);
        // redWarrior.play("red-warrior-idle", true);

        this.input.keyboard?.on("keydown-P", () => {
            const w = this.add.sprite(
                this.redWarriorSpawnX,
                this.redWarriorSpawnY,
                "red-warrior-run",
            );
            w.setScale(TILE_DISPLAY_SCALE).setDepth(6).setFlipX(true);
            w.setData("state", WARRIOR_STATE_RUNNING);
            w.setData("faction", "red");
            w.setData("health", WARRIOR_INITIAL_STATS.health);
            w.setData("maxHealth", WARRIOR_INITIAL_STATS.health);
            w.setData("attack", WARRIOR_INITIAL_STATS.attack);
            w.setData("defense", WARRIOR_INITIAL_STATS.defense);
            w.setData("attackSpeed", WARRIOR_INITIAL_STATS.attackSpeed);
            w.on("animationcomplete", this.onWarriorAttackComplete, this);
            w.play("red-warrior-run", true);
            this.createUnitHealthBar(w);
            this.redWarriors.push(w);
        });

        EventBus.emit("current-scene-ready", this);
    }

    /** All warrior x positions and castle x (for overlap / movement limit), optionally excluding one sprite. */
    private getAllWarriorX(exclude?: Phaser.GameObjects.Sprite): number[] {
        const x: number[] = [
            this.blueCastleX,
            this.redCastleX,
            ...this.blueWarriors.map((s) => s.x),
            ...this.redWarriors.map((s) => s.x),
        ];
        if (exclude) {
            const idx = x.indexOf(exclude.x);
            if (idx !== -1) x.splice(idx, 1);
        }
        return x;
    }
    /** Creates a small health bar above a unit and stores references so it can follow the unit. */
    private createUnitHealthBar(warrior: Phaser.GameObjects.Sprite): void {
        const barY = warrior.y - UNIT_BAR_Y_OFFSET - UNIT_BAR_Y_EXTRA;
        const barLeftX =
            warrior.x - (UNIT_BAR_SEGMENT_W * 3) / 2 + UNIT_BAR_X_OFFSET;

        const left = this.add
            .image(barLeftX, barY, "small-bar-base", SMALL_BAR_LEFT_EDGE)
            .setDisplaySize(UNIT_BAR_SEGMENT_W, UNIT_BAR_SEGMENT_H)
            .setDepth(7);
        const middle = this.add
            .image(
                barLeftX + UNIT_BAR_SEGMENT_W,
                barY,
                "small-bar-base",
                SMALL_BAR_MIDDLE,
            )
            .setDisplaySize(UNIT_BAR_SEGMENT_W, UNIT_BAR_SEGMENT_H)
            .setDepth(7);
        const right = this.add
            .image(
                barLeftX + UNIT_BAR_SEGMENT_W * 2,
                barY,
                "small-bar-base",
                SMALL_BAR_RIGHT_EDGE,
            )
            .setDisplaySize(UNIT_BAR_SEGMENT_W, UNIT_BAR_SEGMENT_H)
            .setDepth(7);
        const fill = this.add
            .image(barLeftX, barY, "small-bar-fill", 0)
            .setOrigin(0, 0.5)
            .setDisplaySize(UNIT_BAR_SEGMENT_W + 5, UNIT_BAR_SEGMENT_H)
            .setDepth(7);

        warrior.setData("healthBar", { left, middle, right, fill });
        this.updateUnitHealthBarFill(warrior);
    }

    /** Updates health bar fill width from unit's health / maxHealth. */
    private updateUnitHealthBarFill(warrior: Phaser.GameObjects.Sprite): void {
        const bar = warrior.getData("healthBar") as
            | {
                  left: Phaser.GameObjects.Image;
                  middle: Phaser.GameObjects.Image;
                  right: Phaser.GameObjects.Image;
                  fill: Phaser.GameObjects.Image;
              }
            | undefined;
        if (!bar) return;
        const health =
            (warrior.getData("health") as number) ??
            WARRIOR_INITIAL_STATS.health;
        const maxHealth =
            (warrior.getData("maxHealth") as number) ??
            WARRIOR_INITIAL_STATS.health;
        const pct =
            maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;
        const maxFillWidth = UNIT_BAR_SEGMENT_W + 5;
        const fillWidth = maxFillWidth * pct;
        bar.fill.setDisplaySize(Math.max(0, fillWidth), UNIT_BAR_SEGMENT_H);
    }

    /** Updates health bar position to follow the unit. */
    private updateUnitHealthBarPosition(
        warrior: Phaser.GameObjects.Sprite,
    ): void {
        const bar = warrior.getData("healthBar") as
            | {
                  left: Phaser.GameObjects.Image;
                  middle: Phaser.GameObjects.Image;
                  right: Phaser.GameObjects.Image;
                  fill: Phaser.GameObjects.Image;
              }
            | undefined;
        if (!bar) return;
        const barY = warrior.y - UNIT_BAR_Y_OFFSET - UNIT_BAR_Y_EXTRA;
        const barLeftX =
            warrior.x - (UNIT_BAR_SEGMENT_W * 3) / 2 + UNIT_BAR_X_OFFSET;
        bar.left.setPosition(barLeftX, barY);
        bar.middle.setPosition(barLeftX + UNIT_BAR_SEGMENT_W, barY);
        bar.right.setPosition(barLeftX + UNIT_BAR_SEGMENT_W * 2, barY);
        bar.fill.setPosition(barLeftX + 8, barY);
    }

    /** Enemy units within attack range of the given warrior (by faction). */
    private getEnemiesInRange(
        warrior: Phaser.GameObjects.Sprite,
        range: number,
    ): Phaser.GameObjects.Sprite[] {
        const faction = warrior.getData("faction") as string;
        const enemies =
            faction === "blue" ? this.redWarriors : this.blueWarriors;
        return enemies.filter(
            (e) => e.active && Math.abs(warrior.x - e.x) <= range,
        );
    }

    /** Closest enemy unit in range, or undefined if none. */
    private getClosestEnemyInRange(
        warrior: Phaser.GameObjects.Sprite,
        range: number,
    ): Phaser.GameObjects.Sprite | undefined {
        const enemies = this.getEnemiesInRange(warrior, range);
        if (enemies.length === 0) return undefined;
        return enemies.reduce((a, b) =>
            Math.abs(warrior.x - a.x) <= Math.abs(warrior.x - b.x) ? a : b,
        );
    }

    /** Apply one hit from attacker to target: damage = attack - defense (min 0), at attack-speed rate (one hit per animation). */
    private applyDamageToUnit(
        attacker: Phaser.GameObjects.Sprite,
        target: Phaser.GameObjects.Sprite,
    ): void {
        const attack =
            (attacker.getData("attack") as number) ??
            WARRIOR_INITIAL_STATS.attack;
        const defense =
            (target.getData("defense") as number) ??
            WARRIOR_INITIAL_STATS.defense;
        const damage = Math.max(0, attack - defense);
        const health =
            (target.getData("health") as number) ??
            WARRIOR_INITIAL_STATS.health;
        const newHealth = Math.max(0, health - damage);
        target.setData("health", newHealth);
        this.updateUnitHealthBarFill(target);
        if (newHealth <= 0) this.removeWarrior(target);
    }

    /** Remove warrior from game: destroy health bar, sprite, and remove from array. */
    private removeWarrior(warrior: Phaser.GameObjects.Sprite): void {
        const bar = warrior.getData("healthBar") as
            | {
                  left: Phaser.GameObjects.Image;
                  middle: Phaser.GameObjects.Image;
                  right: Phaser.GameObjects.Image;
                  fill: Phaser.GameObjects.Image;
              }
            | undefined;
        if (bar) {
            bar.left.destroy();
            bar.middle.destroy();
            bar.right.destroy();
            bar.fill.destroy();
        }
        const faction = warrior.getData("faction") as string;
        const list = faction === "blue" ? this.blueWarriors : this.redWarriors;
        const idx = list.indexOf(warrior);
        if (idx !== -1) list.splice(idx, 1);
        warrior.destroy();
    }

    /** True when warrior is within attack range of the enemy castle (so they should attack it). */
    private isAtEnemyCastle(warrior: Phaser.GameObjects.Sprite): boolean {
        const faction = warrior.getData("faction") as string;
        const castleX = faction === "blue" ? this.redCastleX : this.blueCastleX;
        return (
            Math.abs(warrior.x - castleX) <= WARRIOR_INITIAL_STATS.attackRange
        );
    }

    /** True when warrior has a valid attack target (enemy unit or enemy castle). */
    private hasAttackTarget(
        warrior: Phaser.GameObjects.Sprite,
        range: number,
    ): boolean {
        return (
            this.getEnemiesInRange(warrior, range).length > 0 ||
            this.isAtEnemyCastle(warrior)
        );
    }

    /** Play attack animation for a warrior (variant 1 or 2); starts at a random frame so units don't attack in sync. */
    private playAttackAnimation(
        w: Phaser.GameObjects.Sprite,
        variant: 1 | 2,
    ): void {
        const faction = w.getData("faction") as string;
        const key =
            faction === "blue"
                ? `blue-warrior-attack${variant}`
                : `red-warrior-attack${variant}`;
        w.setData("attackVariant", variant);
        w.setTexture(key, 0);
        w.play({ key, randomFrame: true });
    }

    /** Schedule attack to start after a random delay; warrior shows idle until then. */
    private scheduleAttackStart(
        w: Phaser.GameObjects.Sprite,
        time: number,
    ): void {
        const faction = w.getData("faction") as string;
        const idleKey =
            faction === "blue" ? "blue-warrior-idle" : "red-warrior-idle";
        w.anims.stop();
        w.setTexture(idleKey, 0);
        w.play(idleKey, true);
        w.setData(
            "attackStartAt",
            time +
                Phaser.Math.Between(
                    ATTACK_START_DELAY_MS_MIN,
                    ATTACK_START_DELAY_MS_MAX,
                ),
        );
        w.setData("state", WARRIOR_STATE_ATTACKING);
    }

    /** On attack animation complete: apply damage to closest enemy in range (attack - defense, at attack-speed rate), then loop attack. */
    private onWarriorAttackComplete(
        _anim: Phaser.Animations.Animation,
        _frame: Phaser.Animations.AnimationFrame,
        sprite: Phaser.GameObjects.GameObject,
    ): void {
        const w = sprite as Phaser.GameObjects.Sprite;
        if (w.getData("state") !== WARRIOR_STATE_ATTACKING) return;
        if (!this.hasAttackTarget(w, WARRIOR_INITIAL_STATS.attackRange)) return;
        const target = this.getClosestEnemyInRange(
            w,
            WARRIOR_INITIAL_STATS.attackRange,
        );
        if (target?.active) this.applyDamageToUnit(w, target);
        const next = w.getData("attackVariant") === 1 ? 2 : 1;
        this.playAttackAnimation(w, next as 1 | 2);
    }

    update(_time: number, delta: number) {
        const blueMove = (BLUE_WARRIOR_RUN_SPEED * delta) / 1000;
        for (const w of this.blueWarriors) {
            if (!w.active) continue;
            const state = w.getData("state") as string;

            if (state === WARRIOR_STATE_ATTACKING) {
                if (
                    !this.hasAttackTarget(w, WARRIOR_INITIAL_STATS.attackRange)
                ) {
                    w.data.remove("attackStartAt");
                    w.setTexture("blue-warrior-idle", 0);
                    w.play("blue-warrior-idle", true);
                    w.setData("state", WARRIOR_STATE_IDLE);
                    continue;
                }
                const attackStartAt = w.getData("attackStartAt") as
                    | number
                    | undefined;
                if (attackStartAt != null) {
                    if (_time >= attackStartAt) {
                        w.data.remove("attackStartAt");
                        this.playAttackAnimation(
                            w,
                            Phaser.Math.Between(1, 2) as 1 | 2,
                        );
                    }
                    continue;
                }
                continue;
            }

            if (state === WARRIOR_STATE_RUNNING) {
                const othersX = this.getAllWarriorX(w);
                const toRight = othersX.filter((ox) => ox > w.x);
                const maxXFromOthers =
                    toRight.length > 0
                        ? Math.min(...toRight) - WARRIOR_OVERLAP_THRESHOLD
                        : this.redCastleX;
                const maxX = Math.max(
                    this.blueWarriorSpawnX,
                    Math.min(this.redCastleX, maxXFromOthers),
                );
                const nextX = Math.min(w.x + blueMove, maxX);
                const shouldStop = nextX <= w.x || nextX >= maxX;

                w.x = nextX;
                if (shouldStop) {
                    const atCastle = this.isAtEnemyCastle(w);
                    const enemiesAtStop = this.getEnemiesInRange(
                        w,
                        WARRIOR_INITIAL_STATS.attackRange,
                    );
                    if (enemiesAtStop.length > 0 || atCastle) {
                        this.scheduleAttackStart(w, _time);
                    } else {
                        w.anims.stop();
                        w.setTexture("blue-warrior-idle", 0);
                        w.play("blue-warrior-idle", true);
                        w.setData("state", WARRIOR_STATE_IDLE);
                    }
                }
            } else {
                if (
                    this.hasAttackTarget(w, WARRIOR_INITIAL_STATS.attackRange)
                ) {
                    this.scheduleAttackStart(w, _time);
                    continue;
                }
                w.play("blue-warrior-idle", true);
                if (w.x >= this.redCastleX - WARRIOR_OVERLAP_THRESHOLD)
                    continue;
                const othersX = this.getAllWarriorX(w).filter((ox) => {
                    if (ox === this.blueCastleX) return false;
                    if (
                        Math.abs(w.x - this.blueWarriorSpawnX) < 2 &&
                        Math.abs(ox - this.blueWarriorSpawnX) < 2
                    )
                        return false;
                    return true;
                });
                // Only blocked by someone ahead (to the right); ally behind shouldn't stop us from running
                const blockedAhead = othersX.some(
                    (ox) => ox > w.x && ox - w.x < WARRIOR_OVERLAP_THRESHOLD,
                );
                if (!blockedAhead) {
                    w.setTexture("blue-warrior-run", 0);
                    w.play("blue-warrior-run", true);
                    w.setData("state", WARRIOR_STATE_RUNNING);
                }
            }
        }
        const redMove = (RED_WARRIOR_RUN_SPEED * delta) / 1000;
        for (const w of this.redWarriors) {
            if (!w.active) continue;
            const state = w.getData("state") as string;

            if (state === WARRIOR_STATE_ATTACKING) {
                if (
                    !this.hasAttackTarget(w, WARRIOR_INITIAL_STATS.attackRange)
                ) {
                    w.data.remove("attackStartAt");
                    w.setTexture("red-warrior-idle", 0);
                    w.play("red-warrior-idle", true);
                    w.setData("state", WARRIOR_STATE_IDLE);
                    continue;
                }
                const attackStartAt = w.getData("attackStartAt") as
                    | number
                    | undefined;
                if (attackStartAt != null) {
                    if (_time >= attackStartAt) {
                        w.data.remove("attackStartAt");
                        this.playAttackAnimation(
                            w,
                            Phaser.Math.Between(1, 2) as 1 | 2,
                        );
                    }
                    continue;
                }
                continue;
            }

            if (state === WARRIOR_STATE_RUNNING) {
                const othersX = this.getAllWarriorX(w);
                const toLeft = othersX.filter((ox) => ox < w.x);
                const minXFromOthers =
                    toLeft.length > 0
                        ? Math.max(...toLeft) + WARRIOR_OVERLAP_THRESHOLD
                        : this.blueCastleX;
                const minX = Math.min(
                    this.redWarriorSpawnX,
                    Math.max(this.blueCastleX, minXFromOthers),
                );
                const nextX = Math.max(w.x - redMove, minX);
                const shouldStop = nextX >= w.x || nextX <= minX;
                w.x = nextX;
                if (shouldStop) {
                    const atCastle = this.isAtEnemyCastle(w);
                    const enemiesAtStop = this.getEnemiesInRange(
                        w,
                        WARRIOR_INITIAL_STATS.attackRange,
                    );
                    if (enemiesAtStop.length > 0 || atCastle) {
                        this.scheduleAttackStart(w, _time);
                    } else {
                        w.anims.stop();
                        w.setTexture("red-warrior-idle", 0);
                        w.play("red-warrior-idle", true);
                        w.setData("state", WARRIOR_STATE_IDLE);
                    }
                }
            } else {
                if (
                    this.hasAttackTarget(w, WARRIOR_INITIAL_STATS.attackRange)
                ) {
                    this.scheduleAttackStart(w, _time);
                    continue;
                }
                w.play("red-warrior-idle", true);
                if (w.x <= this.blueCastleX + WARRIOR_OVERLAP_THRESHOLD)
                    continue;
                const othersX = this.getAllWarriorX(w).filter((ox) => {
                    if (ox === this.redCastleX) return false;
                    if (
                        Math.abs(w.x - this.redWarriorSpawnX) < 2 &&
                        Math.abs(ox - this.redWarriorSpawnX) < 2
                    )
                        return false;
                    return true;
                });
                // Only blocked by someone ahead (to the left); ally behind shouldn't stop us from running
                const blockedAhead = othersX.some(
                    (ox) => ox < w.x && w.x - ox < WARRIOR_OVERLAP_THRESHOLD,
                );
                if (!blockedAhead) {
                    w.setTexture("red-warrior-run", 0);
                    w.play("red-warrior-run", true);
                    w.setData("state", WARRIOR_STATE_RUNNING);
                }
            }
        }

        // Keep unit health bars following their warriors
        for (const w of this.blueWarriors) {
            if (w.active) this.updateUnitHealthBarPosition(w);
        }
        for (const w of this.redWarriors) {
            if (w.active) this.updateUnitHealthBarPosition(w);
        }
    }
}

