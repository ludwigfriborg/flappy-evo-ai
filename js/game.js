// Ludwig Friborg
// 2018 october

(function (window, document) {
  'use strict';

  var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
  var isIE = /*@cc_on!@*/false || !!document.documentMode;
  var oldAgent = new Agent();


  //Gap entity, consisting of two pipes with a gap.
  function Gap (game, xPos) {
    this.height = 70;
    this.width = 50;

    this.game = game;
    this.xPos = xPos;
    this.yPos = Math.floor(Math.random() * (game.screenHeight - this.height)) + this.height / 2;
    this.xSpeed = 1.5;
    this.counted = false;

    this.move = function () { this.xPos -= this.xSpeed; };

    this.collisionWith = function (thing) {
      if (thing.xPos - thing.width / 2 > this.xPos + this.width / 2 ||
          thing.xPos + thing.width / 2 < this.xPos - this.width / 2) {
        return false;
      } else if (thing.yPos - thing.height / 2 > this.yPos - this.height / 2 &&
                 thing.yPos + thing.height / 2 < this.yPos + this.height / 2) {
        return false;
      } else {
        return true;
      }
    };

    this.render = function () {
      this.game.ctx.globalCompositeOperation = "destination--over";
      this.game.ctx.drawImage(this.pipeImage, (this.xPos - this.width / 2), (this.yPos + (this.height / 2)), 50, 154);
      this.game.ctx.save();
      this.game.ctx.scale(1, -1);
      this.game.ctx.drawImage(this.pipeImage, (this.xPos - this.width / 2), -(this.yPos - (this.height / 2)), 50, 154);
      this.game.ctx.restore();
    };

    this.pipeImage = new Image();
    this.pipeImage.addEventListener("load", function () { Gap.ready = true; });
    this.pipeImage.src = "images/pipe.png";
  }


  //Bird entity
  function Bird (game, agent) {
    this.width = 30;
    this.height = 21;

    this.game = game;
    this.xPos = this.width / 2;
    this.yPos = game.screenHeight / 2;
    this.xSpeed = 1.5;
    this.ySpeed = 0;
    this.agent = agent;
    this.score = 0;

    this.keydownHandler = function (event) {
      if (event.keyCode === 13) {
        this.ySpeed = 5;
        //this.sound.play();
      }
    }.bind(this);

    this.die = function () {
      this.agent.dead = 1;
      this.agent.bestScore = this.score;
      this.game.deadAgents++;
    };

    this.fly = function () {
      this.xPos = this.xPos + this.xSpeed;
      this.yPos = this.yPos - this.ySpeed;

      if (this.xPos + this.width / 2 > this.game.screenWidth / 2) {
        this.xPos = this.game.screenWidth / 2 - this.width / 2;
        this.xSpeed = 0;
      }

      if (this.yPos - this.height / 2 <= 0) {
        this.yPos = this.height / 2;
        this.ySpeed = 0;
      }

      if (this.yPos + this.height / 2 >= this.game.screenHeight) {
        this.yPos = this.game.screenHeight - this.height / 2;
        this.die();
      }

      this.ySpeed -= 0.5;
    };

    this.isAtScreenCenter = function () {
      return this.xPos + this.width / 2 === this.game.screenWidth / 2;
    };

    this.render = function () {
      this.game.ctx.globalCompositeOperation = "destination-over";
      this.game.ctx.globalAlpha = this.agent.dead ? 0.5 : 1;
      this.game.ctx.drawImage(this.image, this.xPos - this.width / 2, this.yPos - this.height / 2, this.width, this.height);
      this.game.ctx.globalAlpha = 1;
    };

    this.image = new Image();
    this.image.addEventListener("load", function () { Bird.ready = true; });
    this.image.src = "images/bird.png";
  }




  function Game (elementID) {
    var game = this;
    var canvas = document.getElementById(elementID);
    game.generation = 0;

    game.ctx = canvas.getContext('2d');
    game.screenWidth = canvas.scrollWidth;
    game.screenHeight = 200;
    game.score = 0;
    game.highScore = 0;
    game.onlyOldAgent = false;

    game.keydownHandler = function (event) {
      if (event.keyCode === 13) {
        game.killAll();
      }

      if (event.keyCode === 69) {
        game.onlyOldAgent = !game.onlyOldAgent;
        game.killAll();
      }
    };

    game.drawWelcomePage = function () {
      game.clearScreen();

      game.ctx.font = "25pt Arial";
      game.ctx.fillText("Press enter to start...", 100, 100);
      game.ctx.fillRect(0, 200, game.screenWidth, 200);
    };

    game.initRun = function() {
      game.birds = [];
      game.deadAgents = 0;

      if (!game.onlyOldAgent) {
        var generationSize = 100;
        //Generates birds with agents (uncomment for training)
        for (let index = 0; index < generationSize; index++) {
          game.birds.push(new Bird(game, oldAgent.evolve()));
        }
      }
      //adds previous winner
      game.birds.push(new Bird(game, clone(oldAgent)))

      game.gaps = [250, 400, 550, 700, 850].map(function (xPos) {
        return new Gap(game, xPos);
      });

      game.gaps.destroied = 0;

      game.score = 0;
    }

    game.killAll = function () {
      game.birds.forEach(function (bird) { bird.die(); });
      game.deadAgents = game.birds.length;
    }

    game.tick = function () {
      if (game.deadAgents == game.birds.length) {
        var bestAgent = game.birds.reduce(function(acc, cur) {
          return cur.score > acc.score ? cur : acc;
        }).agent;

        game.highScore = game.score > game.highScore ? game.score : game.highScore;

        if (oldAgent.bestScore < bestAgent.bestScore) {
          console.log('new best agent!', bestAgent);
          oldAgent = bestAgent;
        }

        oldAgent.dead = 0;

        console.log('new run!');
        if (!game.onlyOldAgent) {
          game.generation++;
        }

        game.initRun();
      }

      game.clearScreen();
      var closestGap = undefined;
      var nextClosestGap = undefined;

      game.gaps.forEach(function (gap) {
        gap.move();

        if (!gap.counted && gap.xPos + gap.width / 2 < game.screenWidth / 2) {
          game.score++;
          gap.counted = true;
        }

        if (gap.xPos + gap.width / 2 <= 0) {
          game.gaps.shift();
          game.gaps.destroied++;
          game.gaps.push(new Gap(game, game.gaps[game.gaps.length - 1].xPos + 150));
        }

        game.birds.forEach(function (bird) {
          if (bird.agent.dead == 1) {
            return;
          }

          if (closestGap == undefined && gap.xPos + gap.width / 2 > bird.xPos - bird.width / 2) {
            closestGap = gap;
          }

          if (nextClosestGap == undefined && closestGap && gap.xPos + gap.width / 2 > bird.xPos - bird.width / 2) {
            nextClosestGap = gap;
          }

          if (gap.collisionWith(bird)) {
            bird.score = game.score;
            bird.die();
          }
        });
      });

      game.birds.forEach(function (bird) {
        //console.log(bird.agent);
        if (bird.agent.dead == 1) {
          return;
        }

        if (bird.agent.jump({
          vel: bird.ySpeed,
          ypos: bird.yPos,
          gap: closestGap.yPos,
          gap2: nextClosestGap.yPos
        })) {
          bird.ySpeed = 5;
        }

        bird.fly();
      });

      game.render();
    }


    game.render = function () {
      game.drawAgentInfo();

      game.birds.forEach(function (bird) {
        if (bird.agent.dead != 1) { bird.render(); }
      });

      game.gaps.forEach(function (gap) {
        gap.render();
      });
    }

    game.drawAgentInfo = function () {
      game.ctx.clearRect(0, 200, game.screenWidth, 160);

      game.ctx.font="16px monospace";
      game.ctx.fillText("Generation: " + game.generation, 10, game.screenHeight + 30);
      game.ctx.fillText("Best Score: " + game.highScore, 10, game.screenHeight + 50);
      game.ctx.fillText("Score: " + game.score, 10, game.screenHeight + 70);
      game.ctx.font="9px monospace";
      game.ctx.fillText("Press ENTER to kill the birds.", 10, game.screenHeight + 135);
      game.ctx.fillText("Press E for demo run with current best fit.", 10, game.screenHeight + 150);

      var agent_w_sum = Math.abs(oldAgent.gap2_w) +
       Math.abs(oldAgent.gap_w) +
       Math.abs(oldAgent.vel_w) +
       Math.abs(oldAgent.ypos_w);

      //jump
      game.ctx.beginPath();
      game.ctx.arc(game.screenWidth - 80, game.screenHeight + 80, 15, 0, 2 * Math.PI, false);
      game.ctx.fill();

      //vel
      game.ctx.beginPath();
      game.ctx.arc(game.screenWidth - 150, game.screenHeight + 40, 10, 0, 2 * Math.PI);
      game.ctx.lineTo(game.screenWidth - 80, game.screenHeight + 80);
      game.ctx.lineWidth = (Math.abs(oldAgent.vel_w)/agent_w_sum) * 5;
      game.ctx.fillText((Math.abs(oldAgent.vel_w)/agent_w_sum).toFixed(6), game.screenWidth - 205, game.screenHeight + 32);
      game.ctx.stroke();
      game.ctx.fill();

      //gap
      game.ctx.beginPath();
      game.ctx.arc(game.screenWidth - 170, game.screenHeight + 70, 10, 0, 2 * Math.PI, false);
      game.ctx.lineTo(game.screenWidth - 80, game.screenHeight + 80);
      game.ctx.lineWidth = (Math.abs(oldAgent.gap_w)/agent_w_sum) * 5;
      game.ctx.fillText((Math.abs(oldAgent.gap_w)/agent_w_sum).toFixed(6), game.screenWidth - 225, game.screenHeight + 62);
      game.ctx.stroke();
      game.ctx.fill();

      //gap2
      game.ctx.beginPath();
      game.ctx.arc(game.screenWidth - 170, game.screenHeight + 105, 10, 0, 2 * Math.PI, false);
      game.ctx.lineTo(game.screenWidth - 80, game.screenHeight + 80);
      game.ctx.lineWidth = (Math.abs(oldAgent.gap2_w)/agent_w_sum) * 5;
      game.ctx.fillText((Math.abs(oldAgent.gap2_w)/agent_w_sum).toFixed(6), game.screenWidth - 225, game.screenHeight + 102);
      game.ctx.stroke();
      game.ctx.fill();

      //ypos
      game.ctx.beginPath();
      game.ctx.arc(game.screenWidth - 150, game.screenHeight + 135, 10, 0, 2 * Math.PI, false);
      game.ctx.lineTo(game.screenWidth - 80, game.screenHeight + 80);
      game.ctx.lineWidth = (Math.abs(oldAgent.ypos_w)/agent_w_sum) * 5;
      game.ctx.fillText((Math.abs(oldAgent.ypos_w)/agent_w_sum).toFixed(6), game.screenWidth - 205, game.screenHeight + 132);
      game.ctx.stroke();
      game.ctx.fill();

      game.ctx.fillStyle = '#000';
      game.ctx.strokeStyle = '#000';
      game.ctx.fillRect(0, 200, game.screenWidth, 160);
      game.ctx.fillStyle = '#fff';
      game.ctx.strokeStyle = '#fff';
    }

    game.start = function () {
      var game = this;
      game.initRun();

      game.intervalID = setInterval(game.tick, 20);
    };

    game.gameover = function () {
      clearInterval(game.intervalID);

      game.ctx.save();
      game.ctx.font = "40pt Arial";
      game.ctx.fillText("PAUSE", 75, 100);
      game.ctx.font = "15pt Arial";
      game.ctx.fillText("Press enter to play again!", 130, 150);
      game.ctx.restore();
      window.addEventListener("keydown", game.keydownHandler, false);
    };

    game.clearScreen = function () {
      game.ctx.clearRect(0, 0, game.screenWidth, game.screenHeight);
    };

    game.drawWelcomePage();
    game.start();

    window.addEventListener("keydown", game.keydownHandler, false);
  }

  new Game("playground");
})(window, window.document);