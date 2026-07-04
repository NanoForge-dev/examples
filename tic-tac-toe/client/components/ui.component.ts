import {Group, Rect, Text} from '@nanoforge-dev/graphics-2d';
import {layer} from "../main";

export class TurnText {
    name = this.constructor.name
    text: Text;

    constructor(x: number, y: number) {
        this.text = new Text({
            x,
            y,
            text: "Player 1's turn",
            fontSize: 24,
            fontStyle: "bold",
            fill: "#c5b6d6",
            align: "center",
        });
        this.text.x(x - this.text.width() / 2);

        layer.add(this.text);
    }

    update(isFirstPlayerTurn: boolean) {
        this.text.text(
            isFirstPlayerTurn
                ? "Player 1's turn"
                : "Player 2's turn",
        )
    }
}

export class EndGamePopup {
    name = this.constructor.name;
    overlay: Rect;
    panel: Rect;
    title: Text;
    restartGroup: Group;
    restartButton: Rect;
    restartText: Text;
    restartPressed: boolean = false;

    constructor(text: string) {
        this.overlay = new Rect({
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            fill: '#000000',
            opacity: 0.6
        });

        const panelWidth = 450;
        const panelHeight = 250;

        this.panel = new Rect({
            x: (window.innerWidth - panelWidth) / 2,
            y: (window.innerHeight - panelHeight) / 2,
            width: panelWidth,
            height: panelHeight,
            cornerRadius: 15,
            fill: "#23233A",
            shadowBlur: 20,
            shadowOpacity: 0.4
        });

        this.title = new Text({
            x: this.panel.x(),
            y: this.panel.y() + 40,
            width: panelWidth,
            align: "center",
            text,
            fontSize: 28,
            fontStyle: "bold",
            fill: "#FFFFFF",
        })

        this.restartGroup = new Group();

        this.restartButton = new Rect({
            x: this.panel.x() + this.panel.width() / 2 - 60,
            y: this.panel.y() + 160,
            width: 120,
            height: 60,
            cornerRadius: 10,
            fill: "#7644aa",
        })

        this.restartText = new Text({
            x: this.restartButton.x(),
            y: this.restartButton.y(),
            width: this.restartButton.width(),
            height: this.restartButton.height(),
            align: "center",
            verticalAlign: "middle",
            text: "Restart",
            fontSize: 24,
            fontStyle: "bold",
            fill: "#FFFFFF",
        })

        this.restartGroup.add(this.restartButton);
        this.restartGroup.add(this.restartText);

        this.restartGroup.on("mouseover", (e) => {
            e.target.getStage()!.container().style.cursor = 'pointer';
        })

        this.restartGroup.on("mouseout", (e) => {
            e.target.getStage()!.container().style.cursor = 'default';
        })

        this.restartGroup.on('mousedown', () => {
            this.restartPressed = true;
        })

        this.restartGroup.on('mouseup', () => {
            this.restartPressed = false;
        })

        layer.add(this.overlay);
        layer.add(this.panel);
        layer.add(this.title);
        layer.add(this.restartGroup);
    }
}