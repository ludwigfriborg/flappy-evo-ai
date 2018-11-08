// Ludwig Friborg
// 2018 october

var learn_vec = 2.5;
var threshhold = 100;

function Agent() {
  this.bestScore = 0;
  this.dead = 0;

  //weights to determine if jump
  this.gap_w = 0.5; //next pipeunder y
  this.gap2_w = 0.1; //next next pipeunder y
  this.vel_w = 1;
  this.ypos_w = 0.2;

  //generates one new bird with tweaked network
  this.evolve = function () {
    var child = new Agent();
    child.bestScore = 0;
    child.dead = 0;
    child.gap2_w = this.gap2_w + (Math.random() * learn_vec - (learn_vec/2));
    child.gap_w = this.gap_w + (Math.random() * learn_vec - (learn_vec/2));
    child.vel_w = this.vel_w + (Math.random() * learn_vec - (learn_vec/2));
    child.ypos_w = this.ypos_w + (Math.random() * learn_vec - (learn_vec/2));
    return child;
  }

  // returns true if agent is ready for jump in this state.
  this.jump = function (state) {
    return (this.gap2_w * state.gap2 +
            this.gap_w * state.gap +
            this.vel_w * state.vel +
            this.ypos_w * state.ypos) > threshhold;
  }
}


//misc
function clone(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null == obj || "object" != typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
      copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
          copy[i] = clone(obj[i]);
      }
      return copy;
  }

  // Handle Object
  if (obj instanceof Object) {
      copy = {};
      for (var attr in obj) {
          if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
      }
      return copy;
  }

  throw new Error("Unable to copy obj! Its type isn't supported.");
}