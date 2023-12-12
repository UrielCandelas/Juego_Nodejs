import { Server } from "socket.io";

const players = [];
const enemies = [];

var time = 0;
var dificultSetter = 0;

const widthScreen = 1280;
const heightScreen = 720;

///Clases (Naves, malos y balas).
class ship {
  constructor(id, x, y, vel, size, color, name) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vel = vel;
    this.active = true;

    this.cooldown = 0;
    this.beams = [];
    this.score = 0;
    this.life = 3;
    this.name = name;

    this.size = size;
    this.color = color;
    this.pressedKeys = {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false,
    };
  }

  update() {
    this.cooldown++;
    if (this.pressedKeys.up && this.y > 30) {
      this.y -= this.vel;
    }
    if (this.pressedKeys.left && this.x > 30) {
      this.x -= this.vel;
    }
    if (this.pressedKeys.down && this.y < heightScreen - 30) {
      this.y += this.vel;
    }
    if (this.pressedKeys.right && this.x < widthScreen - 30) {
      this.x += this.vel;
    }
    if (this.pressedKeys.shoot && this.cooldown >= 24) {
      this.beams.push(new beam(this.x, this.y, 15, 10, "yellow"));
      this.cooldown = 0;
    }
  }
}

class beam {
  constructor(x, y, vel, size, color) {
    this.x = x;
    this.y = y;
    this.vel = vel;

    this.size = size;
    this.color = color;
  }

  update() {
    this.x += this.vel;
  }
}

class enemy {
  constructor(x, y, vel, size, color) {
    this.x = x;
    this.y = y;
    this.vel = vel;

    this.size = size;
    this.color = color;
  }

  update() {
    this.x -= this.vel;
  }
}

export const socketEmitter = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("Sombody has connected");

    socket.on("disconnect", () => {
      console.log("User Disconnected");
      players.forEach((player, index) => {
        if (player.id == socket.id) players.splice(index, 1);
      });
    });

    socket.on("initGame", (object) => {
      players.push(new ship(socket.id, 30, 90, 7, 30, "blue", object.nick));
    });

    socket.on("retry", () => {
      players.forEach(player => {
        if(socket.id == player.id){
          player.active = true;
          player.color = "blue";
          player.life = 3;
          player.score = 0;
        }
      });
    });

    socket.on("updateKeyboard", (object) => {
      players.forEach((element) => {
        if (element.id == socket.id) {
          element.pressedKeys = object.pressedKeys;
        }
      });
    });
  });

  setInterval(() => {
    if (dificultSetter > 60) dificultSetter = 60;
    if (time <= 75 - (Math.floor(dificultSetter / 5) + 1) * 5) {
      time++;
    } else {
      enemies.push(
        new enemy(
          widthScreen,
          Math.random() * (heightScreen - 60) + 30,
          9,
          30,
          "purple"
        )
      );
      time = 0;
    }

    dificultSetter = 0;

    players.forEach((player) => {
      if (player.active) {
        player.update();

        if (player.score < 90) {
          dificultSetter += Math.floor(player.score / 2);
        }
      }

      player.beams.forEach((value, index) => {
        value.update();
        if (value.x > 1280) player.beams.splice(index, 1);
      });
    });

    enemies.forEach((valueE, indexE) => {
      valueE.update();
      if (valueE.x < 0) {
        enemies.splice(indexE, 1);
      }

      players.forEach((player) => {
        if (player.active) {
          player.beams.forEach((valueB, indexB) => {
            const d = Math.hypot(valueB.x - valueE.x, valueB.y - valueE.y);
            if (d < valueB.size + valueE.size) {
              player.beams.splice(indexB, 1);
              enemies.splice(indexE, 1);
              player.score++;
            }
          });

          const d = Math.hypot(valueE.x - player.x, valueE.y - player.y);
          if (d < valueE.size + player.size) {
            enemies.splice(indexE, 1);
            player.life--;
            player.score++;
          }
          if (player.life <= 0) {
            player.active = false;
            player.color = "red";
          }
        }
      });
    });

    io.emit("update", { players, enemies });
  }, 15);
};
