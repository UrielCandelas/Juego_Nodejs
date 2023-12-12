///Configuración de la pantalla.
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const modalForm = document.getElementById("nick");
const modalGameOver = document.querySelector("section");
const form = document.querySelector("form");
const name = document.querySelector("input");
const retry = document.getElementById("retry");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 5;

var MyPlayer = {};
const pressedKeys = {
  up: false,
  down: false,
  left: false,
  right: false,
  shoot: false,
};
var active = false;
var myPlayers = [];
var myEnemies = [];

const socket = io();

form.addEventListener("submit", (evt) => {
  const nick = name.value;
  if (nick == "" || nick == " ") {
    return alert("Inserte un nombre");
  }
  modalForm.style.display = "none";
  socket.emit("initGame", { nick });
  evt.preventDefault();
});

retry.addEventListener("click", () => {
  socket.emit("retry");
});

///Configuración de botones.
addEventListener("keydown", (evt) => {
  const key = evt.key.toLowerCase();
  switch (key) {
    case "w":
      pressedKeys.up = true;
      break;
    case "a":
      pressedKeys.left = true;
      break;
    case "s":
      pressedKeys.down = true;
      break;
    case "d":
      pressedKeys.right = true;
      break;
    case " ":
      pressedKeys.shoot = true;
      break;
  }

  socket.emit("updateKeyboard", { pressedKeys });
});

addEventListener("keyup", (evt) => {
  const key = evt.key.toLowerCase();
  switch (key) {
    case "w":
      pressedKeys.up = false;
      break;
    case "a":
      pressedKeys.left = false;
      break;
    case "s":
      pressedKeys.down = false;
      break;
    case "d":
      pressedKeys.right = false;
      break;
    case " ":
      pressedKeys.shoot = false;
      break;
  }

  socket.emit("updateKeyboard", { pressedKeys });
});

///Dibujar en pantalla.
function draw(object) {
  ctx.beginPath();
  ctx.arc(object.x, object.y, object.size, 0, Math.PI * 2, false);
  ctx.fillStyle = object.color;
  ctx.fill();

  if(object.name){
    ctx.fillStyle = "white";
    ctx.fillText(object.name, object.x - 15, object.y, 30)
  }
}

function animateCoOp() {
  requestAnimationFrame(animateCoOp);
  ctx.beginPath();
  ctx.rect(0, 0, innerWidth, innerHeight);
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fill();

  ctx.font = "30px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(`SCORE: ${MyPlayer.score}`, 0, 30);
  ctx.fillText(`LIFE: `, canvas.width - 210, 30);

  ctx.beginPath();
  ctx.rect(canvas.width - 135, 5, 30 * MyPlayer.life, 27);
  ctx.fillStyle = "red";
  ctx.fill();

  myPlayers.forEach((element) => {
    draw(element);
    element.beams.forEach((beam) => {
      draw(beam);
    });
  });

  myEnemies.forEach((element) => {
    draw(element);
  });
}

animateCoOp();

socket.on("update", ({ players, enemies }) => {
  players.forEach((player) => {
    if (player.id == socket.id) {
      MyPlayer = player;

      active = MyPlayer.active;
      modalGameOver.style.display = active ? "none" : "flex";
    }
  });

  myPlayers = players;
  myEnemies = enemies;
});
