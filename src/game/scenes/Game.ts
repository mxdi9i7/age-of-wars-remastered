import { Scene } from "phaser";
import { EventBus } from "../EventBus";

const CASTLE_WIDTH = 60;
const CASTLE_HEIGHT = 120;
const CASTLE_COLOR = 0x4a3728;
const UNIT_WIDTH = 24;
const UNIT_HEIGHT = 40;
const UNIT_COLOR = 0x2d5a27;
const UNIT_SPEED = 200;

export class Game extends Scene {
    private leftCastle!: Phaser.GameObjects.Rectangle;
    private rightCastle!: Phaser.GameObjects.Rectangle;
    private units: Phaser.GameObjects.Rectangle[] = [];
    private unitSpeed = UNIT_SPEED;

    constructor() {
        super("Game");
    }

    preload() {
        this.load.setPath("assets");
        this.load.image("nelson", "nelson.png");
        this.load.image("star", "star.png");
        this.load.image("background", "bg.png");
        this.load.image("logo", "logo.png");
    }

    create() {
        const { width, height } = this.scale;
        const centerY = height / 2;

        // Background (optional - use if asset exists)
        if (this.textures.exists("background")) {
            this.add.image(width / 2, height / 2, "background");
        }

        // Left castle (placeholder rectangle)
        this.leftCastle = this.add.rectangle(
            80,
            centerY,
            CASTLE_WIDTH,
            CASTLE_HEIGHT,
            CASTLE_COLOR
        );
        this.leftCastle.setStrokeStyle(2, 0x2d1f14);

        // Right castle (placeholder rectangle)
        this.rightCastle = this.add.rectangle(
            width - 80,
            centerY,
            CASTLE_WIDTH,
            CASTLE_HEIGHT,
            CASTLE_COLOR
        );
        this.rightCastle.setStrokeStyle(2, 0x2d1f14);

        // Spawn a unit on keypress (Space)
        this.input.keyboard?.on("keydown-SPACE", () => this.spawnUnit());

        EventBus.emit("current-scene-ready", this);
    }

    private spawnUnit() {
        const { height } = this.scale;
        const centerY = height / 2;
        // Spawn at left castle edge, moving right
        const unit = this.add.rectangle(
            80 + CASTLE_WIDTH / 2 + UNIT_WIDTH / 2,
            centerY,
            UNIT_WIDTH,
            UNIT_HEIGHT,
            UNIT_COLOR
        );
        unit.setData("direction", 1); // 1 = right, -1 = left
        this.units.push(unit);
    }

    update(_time: number, delta: number) {
        const { width } = this.scale;
        const moveAmount = (this.unitSpeed * delta) / 1000;

        for (let i = this.units.length - 1; i >= 0; i--) {
            const unit = this.units[i];
            const direction = unit.getData("direction") as number;
            unit.x += moveAmount * direction;

            // Remove if off screen
            if (unit.x < -UNIT_WIDTH || unit.x > width + UNIT_WIDTH) {
                unit.destroy();
                this.units.splice(i, 1);
            }
        }
    }
}
