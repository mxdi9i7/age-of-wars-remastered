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

export class Game extends Scene {
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
    }

    create() {
        const { width, height } = this.scale;

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
        const redCastle = this.add.image(
            startX + 18 * tileDisplaySize,
            startY + 1 * tileDisplaySize - tileDisplaySize / 2,
            "red-castle",
        );
        redCastle.setScale(TILE_DISPLAY_SCALE / 2).setDepth(5);
        EventBus.emit("current-scene-ready", this);
    }

    update(_time: number, delta: number) {}
}

