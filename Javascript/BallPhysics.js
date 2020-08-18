function Ball(x, y, radius, e, mass, colour){
    this.position = {x: x, y: y}; // the position where the ball is generated
    this.velocity = {x: 0, y: 0}; // speed
    this.e = -e;
    this.mass = mass; // mass
    this.radius = radius; // ball's radius
    this.colour = colour;
    this.area = (Math.PI * radius * radius) / 10000; //m^2
}
var canvas = null;
var ctx = null;
var fps = 1/60; // animation fluidity
var dt = fps * 1000;
var timer = false;
var Cd = 0.47;
var rho = 1.22; // kg/m^3
var mouse = {x: 0, y:0, isDown: false};
var ag = 9.81; // the acceleration based on Earth's gravity = 9.81 m/s^2.
var width = 0;
var height = 0;
var balls = [];

var setup = function(){
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;

    //cursor's movements
    canvas.onmousedown = mouseDown;
    canvas.onmouseup = mouseUp;
    canvas.onmousemove = getMousePosition;
    timer = setInterval(loop, dt);
}

// functions used to implement the drag action so that the ball can be launched in the opposite direction
var mouseDown = function(e){
    if(e.which == 1){
        getMousePosition(e);
        mouse.isDown = true;
        var max = 255;
        var min = 20;
        var r = 75 + Math.floor(Math.random() * (max - min) - min);
        var g = 75 + Math.floor(Math.random() * (max - min) - min);
        var b = 75 + Math.floor(Math.random() * (max - min) - min);
        balls.push(new Ball(mouse.x, mouse.y, 10, 0.7,10, "rgb(" + r + "," + g + "," + b + ")"));
    }
}

var mouseUp = function(e){
    if(e.which == 1){
        mouse.isDown = false;
        balls[balls.length - 1].velocity.x = (balls[balls.length - 1].position.x - mouse.x) / 10;
        balls[balls.length - 1].velocity.y = (balls[balls.length - 1].position.y - mouse.y) / 10;
    }
}

function getMousePosition(e){
    mouse.x = e.pageX - canvas.offsetLeft;
    mouse.y = e.pageY - canvas.offsetTop;
}
// a loop function is used to make sure that the animation and everything are continuously working
function loop(){
    // implementing the gravity, density and the friction
    var gravity = document.getElementById("gravity");
    var density = document.getElementById("density");
    var drag = document.getElementById("drag");

    // refreshing the animation with each frame
    ctx.clearRect(0, 0, width, height);
    for(var i = 0; i < balls.length; i++){
        if(!mouse.isDown || i != balls.length - 1){
            // calculating the aerodynamic of the dragging action
            // -0.5 * Cd * A * v^2 * rho
            var fx = -0.5 * drag.value * density.value * balls[i].area * balls[i].velocity.x * balls[i].velocity.x * (balls[i].velocity.x / Math.abs(balls[i].velocity.x));
            var fy = -0.5 * drag.value * density.value * balls[i].area * balls[i].velocity.y * balls[i].velocity.y * (balls[i].velocity.y / Math.abs(balls[i].velocity.y));

            fx = (isNaN(fx)? 0 : fx);
            fy = (isNaN(fy)? 0 : fy);
            console.log(fx);
            // calculating the ball's acceleration
            //F = ma or a = F/m
            var ax = fx / balls[i].mass;
            var ay = (ag * gravity.value) + (fy / balls[i].mass);

            // ball's speed
            balls[i].velocity.x += ax * fps;
            balls[i].velocity.y += ay * fps;

            // ball's positioning
            balls[i].position.x += balls[i].velocity.x * fps * 100;
            balls[i].position.y += balls[i].velocity.y * fps * 100;
        }

        // rendering the ball
        ctx.beginPath();
        ctx.fillStyle = balls[i].colour;
        ctx.arc(balls[i].position.x, balls[i].position.y, balls[i].radius, 0, 2 * Math.PI, true);
        ctx.fill();
        ctx.closePath();

        if(mouse.isDown){
            ctx.beginPath();
            ctx.strokeStyle = "rgb(0,255,0)";
            ctx.moveTo(balls[balls.length - 1].position.x, balls[balls.length - 1].position.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
            ctx.closePath();
        }
        // taking care of the collision between each ball
        collisionBall(balls[i]);
        collisionWall(balls[i]);
    }


}
// the collision with the "walls"
function collisionWall(ball){
    if(ball.position.x > width - ball.radius){
        ball.velocity.x *= ball.e;
        ball.position.x = width - ball.radius;
    }
    if(ball.position.y > height - ball.radius){
        ball.velocity.y *= ball.e;
        ball.position.y = height - ball.radius;
    }
    if(ball.position.x < ball.radius){
        ball.velocity.x *= ball.e;
        ball.position.x = ball.radius;
    }
    if(ball.position.y < ball.radius){
        ball.velocity.y *= ball.e;
        ball.position.y = ball.radius;
    }
}
function collisionBall(b1){
    for(var i = 0; i < balls.length; i++){
        var b2 = balls[i];
        if(b1.position.x != b2.position.x && b1.position.y != b2.position.y){
            // checking for potential collisions using AABBs
            if(b1.position.x + b1.radius + b2.radius > b2.position.x
                && b1.position.x < b2.position.x + b1.radius + b2.radius
                && b1.position.y + b1.radius + b2.radius > b2.position.y
                && b1.position.y < b2.position.y + b1.radius + b2.radius){

                //pitagora
                var distX = b1.position.x - b2.position.x;
                var distY = b1.position.y - b2.position.y;
                var d = Math.sqrt((distX) * (distX) + (distY) * (distY));

                // checking the collision between circles
                if(d < b1.radius + b2.radius){
                    var nx = (b2.position.x - b1.position.x) / d;
                    var ny = (b2.position.y - b1.position.y) / d;
                    var p = 2 * (b1.velocity.x * nx + b1.velocity.y * ny - b2.velocity.x * nx - b2.velocity.y * ny) / (b1.mass + b2.mass);

                    // calculating the collision point
                    var colPointX = ((b1.position.x * b2.radius) + (b2.position.x * b1.radius)) / (b1.radius + b2.radius);
                    var colPointY = ((b1.position.y * b2.radius) + (b2.position.y * b1.radius)) / (b1.radius + b2.radius);

                    // making sure that the balls are not overlapping
                    b1.position.x = colPointX + b1.radius * (b1.position.x - b2.position.x) / d;
                    b1.position.y = colPointY + b1.radius * (b1.position.y - b2.position.y) / d;
                    b2.position.x = colPointX + b2.radius * (b2.position.x - b1.position.x) / d;
                    b2.position.y = colPointY + b2.radius * (b2.position.y - b1.position.y) / d;

                    // updating the ball's speed after a collision
                    b1.velocity.x -= p * b1.mass * nx;
                    b1.velocity.y -= p * b1.mass * ny;
                    b2.velocity.x += p * b2.mass * nx;
                    b2.velocity.y += p * b2.mass * ny;
                }
            }
        }
    }
}