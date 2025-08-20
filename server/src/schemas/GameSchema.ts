import { Schema, MapSchema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") character: string = "warrior"; // warrior, mage, rogue, archer
  @type("number") position: number = 0; // 0-64
  @type("boolean") isReady: boolean = false;
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("boolean") gameStarted: boolean = false;
  @type("boolean") isSinglePlayer: boolean = false;
  @type("number") currentPlayerIndex: number = 0;
  @type("number") turnTimeLeft: number = 30;
  @type("string") winner: string = "";
}
