import { Schema, MapSchema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") character: string = "warrior"; // warrior, mage, rogue, archer
  @type("number") position: number = 0; // 0-64
  @type("boolean") isReady: boolean = false;
  @type("boolean") hasFinished: boolean = false;
  @type("number") finishTime: number = 0; // timestamp when player finishes
  @type("number") completionDuration: number = 0; // seconds to complete
  @type("string") formattedTime: string = ""; // MM:SS format
  @type("number") finishPosition: number = 0; // 1st, 2nd, 3rd, etc.
  @type("number") totalQuestions: number = 0; // จำนวนคำถามที่ตอบทั้งหมด
  @type("number") correctAnswers: number = 0; // จำนวนคำถามที่ตอบถูก
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("boolean") gameStarted: boolean = false;
  @type("boolean") isSinglePlayer: boolean = false;
  @type("string") winner: string = ""; // First place winner
  @type("number") gameStartTime: number = 0;
  @type("number") finishedPlayersCount: number = 0;
  @type("boolean") raceCompleted: boolean = false; // When all players finish or timeout
}
