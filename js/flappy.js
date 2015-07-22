var stateActions = { preload: preload, create: create, update: update };
$("#greeting-form").on("submit", function(event_details) {
    var new_score={name:document.getElementById("fullName").value,score:document.getElementById("score").value};
    $("#greeting").hide();
    $.post("/score",new_score);
    event_details.preventDefault();
    restart();
});


function setScoreboard(scores){
    scores=sortScores(scores);
    document.getElementById("scoreBoard").innerHTML="";
    for (var i = 0; i < scores.length; i++) {
        $("#scoreBoard").append(
            "<li>" +
            scores[i].name + ": " + scores[i].score +
            "</li>");
    }
}
function sortScores(scores){
    var scorers={},score_;
    for (var i=0;i<scores.length;i++){
        score_=parseInt(scores[i].score);
        if (scorers[scores[i].name]!=undefined){
            if(scorers[scores[i].name]<score_)
                scorers[scores[i].name]=score_;
        }else{
            scorers[scores[i].name]=score_;
        }
    }
    var highestScorers = _.sortBy(_.pairs(scorers),function(score_){
        return -score_[1];
    });
    scores=[];
    for(var scr=0;scr<highestScorers.length;scr++){
        scores.push({name:highestScorers[scr][0],score:highestScorers[scr][1]});
    }
    return scores;
}
//Initialize constants
console.log("Initializing constants");
var w=650,h=400,maxLiftSpeed=-300,gravity=800,angleRatio=0.5,initialVelocity=150,
    pipeSpeed=-150,assetPath="../assets/",GoKey=Phaser.Keyboard.SPACEBAR;
//Initialize graphical components
console.log("Initializing graphics");
var logo,background,scoreLabel;
//Initialize flags
console.log("Initializing flags");
var hit_centre=0,game_started=0,dying=0,dead= 0,in_space=0;
//Initialize lists
console.log("Initializing lists");
var bounds=[],pipes=[],point_lines=[];
//Initialize timed events
console.log("Initializing timed events");
var pipeGenerator,asteroidGenerator;
//Initialize game vars
console.log("Initializing game vars");
var score = 0;
var player,rocket;
//Initialize game
console.log("Initializing game");
var game = new Phaser.Game(w, h, Phaser.AUTO, 'game',null,true,true);
game.state.add("Game",stateActions);
game.state.start("Game");

function preload(){
    //Loading images
    console.log("Loading image resources");
    var back=game.rnd.pick(["morning.png","night.png"])
    game.load.image("Background",assetPath+back);
    var bird=game.rnd.pick(["Birds/Red/","Birds/Blue/","Birds/Yellow/"]);
    game.load.image("Flappy-Neutral",assetPath+bird+"neutral.png");
    game.load.image("Flappy-Up",assetPath+bird+"down2.png");
    game.load.image("Flappy-Down",assetPath+bird+"down1.png");
    game.load.image("Floor",assetPath+"floor.png");
    var pipe=game.rnd.pick(["Pipes/Green/","Pipes/Red/"]);
    game.load.image("PipeTop",assetPath+pipe+"end.png");
    game.load.image("PipePiece",assetPath+pipe+"block.png");
    game.load.image("Logo",assetPath+"logo2.png");
    game.load.image("SpaceRocket",assetPath+"Space/rocket.png");
    game.load.image("SpaceBackground",assetPath+"Space/background.png");
    game.load.image("SpaceBoss",assetPath+"Space/boss.jpg");
    game.load.image("SpaceAsteroid",assetPath+"Space/asteroid.png");
    game.load.image("SpaceDeath",assetPath+"Space/death.png");
    //Loading audio
    console.log("Loading audio");
    game.load.audio("Score",assetPath+"sfx_point.ogg");
    game.load.audio("Flap",assetPath+"sfx_wing.ogg");
    game.load.audio("Die",assetPath+"sfx_hit.ogg");
    game.load.audio("Missile", assetPath+"/Space/missile.mp3");
    game.load.audio("Takeoff", assetPath+"/Space/comet.mp3");
}

function create() {
    //Create bits
    console.log("Creating");
    resetGame();
    game.physics.startSystem(Phaser.Physics.ARCADE);
    console.log("Creating background");
    background=game.add.tileSprite(0, 0,w,h, "Background");
    console.log("Creating logo");
    logo=game.add.sprite(w/2,h*0.25,"Logo");
    logo.anchor.setTo(0.5,0.5);
    game.physics.arcade.enable(logo);
    console.log("Creating walls");
    createWalls();
    console.log("Creating callbacks");
    //Mouse Click
    game.input.onDown.add(Jump);
    game.input.onUp.add(EndJump);
    //Spacebar
    game.input.keyboard.addKey(GoKey).onDown.add(Jump);
    game.input.keyboard.addKey(GoKey).onUp.add(EndJump);
    //Rocket Shortcut
    game.input.keyboard.addKey(Phaser.Keyboard.R).onDown.add(spawnRocket);

}
function startGame(){
    game_started=1;
    createPlayer(0,h/2);
    scoreLabel=game.add.text(20, 20, score.toString());
}
function resetGame() {
    delete(player);
    game_started = 0;
    hit_centre = 0;
    score = 0;
    delete(scoreLabel);
    pipes = [];
    point_lines = [];
    dying=0;
    dead=0;
    in_space=0;
    $.get("/score", setScoreboard);
}
function restart(){
    game.state.start("Game");
}
function createPlayer(x,y){
    player=game.add.sprite(x,y,"Flappy-Neutral");
    player.anchor.setTo(0.5,0.5);
    player.scale.setTo(2.5,2.5);
    game.physics.arcade.enableBody(player);
    player.body.gravity.y=gravity;
    player.body.velocity.x=initialVelocity;
}
function createWalls(){
    var Ceiling=game.add.tileSprite(0,-5,w,4,"Floor");
    game.physics.arcade.enable(Ceiling);
    Ceiling.body.immovable=true;
    var Floor=game.add.tileSprite(0,h-30,w,30,"Floor");
    game.physics.arcade.enable(Floor);
    Floor.body.immovable=true;
    bounds=[Ceiling,Floor];
}
function Jump(){
    if(!game_started)
        startGame();
    else if(!dying) {
        player.loadTexture("Flappy-Down");
        game.sound.play("Flap");
        player.body.velocity.y = maxLiftSpeed;
    }
}
function EndJump(){
    player.loadTexture("Flappy-Up");
    game.time.events.add(0.1*Phaser.Timer.SECOND, function(){player.loadTexture("Flappy-Neutral");});
}
function addPoint(){
    score++;
    scoreLabel.setText(score.toString());
    game.world.bringToTop(scoreLabel);
    game.sound.play("Score");
    if((score>=10&&game.rnd.integerInRange(0,5)==3)||score==15)
        spawnRocket();
}
function hitPipe(){
    deathY=player.y;
    game.sound.play("Die");
    dying=1;
    delete(logo);
    pipes.forEach(function(part){part.body.velocity.x=0;});
    game.time.events.remove(pipeGenerator);
    background.stopScroll();
    bounds[1].stopScroll();
    player.body.velocity.x=initialVelocity;
    player.body.velocity.y=1.5*maxLiftSpeed;
    player.body.angularVelocity=1.5;
    game.world.bringToTop(player);
}
function die(){
    dead=1;
    $("#score").val(score.toString());
    $("#greeting").show();
}
function generateRandomPipeSet(){
    var start_y=game.rnd.integerInRange(100,h-100);
    createPipeSet(start_y);
}
function createPipeSet(safe_y){
    var pipe1=createPipe(safe_y-75,-1);
    var pipe2=createPipe(safe_y+75,1);
    var pipeSet=pipe1.concat(pipe2);
    for (var i=0;i<pipeSet.length;i++){
        pipeSet[i].anchor.setTo(0.5,0.5);
        game.physics.arcade.enable(pipeSet[i]);
        pipeSet[i].body.velocity.x=pipeSpeed;
    }
    pipes=pipes.concat(pipeSet);
    point_lines.push(w+50);
}
function createPipe(start_y,direction){
    var pipe=[game.add.sprite(w+25,start_y,"PipeTop")];
    pipe[0].scale.y*=direction;
    var dist=(h*(direction>0))-(start_y+(25*direction));
    var number_of_pieces=Math.max(Math.abs(dist)/50)+1;
    for (var i=0;i<number_of_pieces;i++){
        var part=game.add.sprite(w+25,start_y+(25+(i*50))*direction,"PipePiece");
        pipe.push(part);
    }
    game.world.bringToTop(pipe[0]);

    return pipe;
}
function updatePlayer() {
    player.rotation = -Math.atan((player.body.velocity.y / maxLiftSpeed));
    if (player.x >= w / 2 && !hit_centre) {
        player.body.velocity.x = 0;
        background.autoScroll(-initialVelocity / 2, 0);
        bounds[1].autoScroll(-initialVelocity, 0);
        if (!in_space)
            pipeGenerator = game.time.events.loop(1.75 * Phaser.Timer.SECOND, generateRandomPipeSet);
        logo.body.velocity.x = -initialVelocity;
        hit_centre = 1;
    }
    game.physics.arcade.collide(player, bounds);
    if (!in_space)
        game.physics.arcade.overlap(player, rocket, goToSpace, rotatedRectInObject);

}
function updatePipes(){
    for(var i=0;i<pipes.length;i++){
        if (pipes[i].x+pipes[i].width<0) {
            pipes[i]=null;
            pipes.splice(i, 1);
        }
    }
    for (i=0;i<point_lines.length;i++){
        point_lines[i]+=pipeSpeed*game.time.elapsed/1000;
        if(point_lines[i]<=player.x){
            delete(point_lines[i]);
            point_lines.splice(i,1);
            addPoint();
        }
    }
    game.physics.arcade.overlap(player,pipes,hitPipe,rotatedRectInObject);

}
function updateDyingPlayer(){
    player.angle+=15;
    game.physics.arcade.overlap(player,bounds[1],die);
}
function updateAsteroids(){
    for(var i=0;i<pipes.length;i++){
        if (pipes[i].x+pipes[i].width<0) {
            pipes[i]=null;
            pipes.splice(i, 1);
        }
    }
    game.physics.arcade.overlap(player,pipes,hitPipe,rotatedRectInCircle);
}
function update() {
    if (game_started&&!dying) {
        updatePlayer();
        if (in_space) updateAsteroids();
        else updatePipes();
    }
    if (dying&&!dead){
        updateDyingPlayer();
    }
}
function rotatedRectInObject(rotRect,object){
    var corners=getCorners(rotRect);
    var overlapping=0;
    for (var i=0; i<4;i++)
        overlapping=overlapping||pointInRectObject(corners[i],object);
    return overlapping;
}
function rotatedRectInCircle(rotRect,object){
    var corners=getCorners(rotRect);
    var overlapping=0;
    for (var i=0; i<4;i++)
        overlapping=overlapping||pointInCircleObject(corners[i],object);
    return overlapping;
}
function getCorners(object){
    var corners=[];
    for(var i=0;i<4;i++){
        var corner=getCorner(object,i);
        corners.push(corner);
    }
    return corners;
}
function getCorner(object,id){
    var x,y;
    if (inArray(id,[1,2])) x=object.width; else x=0;
    if (inArray(id,[2,3])) y=object.height; else y=0;
    var rotX=x*Math.cos(object.angle)-y*Math.sin(object.angle);
    var rotY=x*Math.sin(object.angle)+y*Math.cos(object.angle);
    return [rotX+object.x,rotY+object.y];
}
function pointInRectObject(point,obj){
    return ((obj.x<point[0]<obj.x+obj.width)&&(obj.y<point[1]<obj.y+obj.height));
}
function pointInCircleObject(point,obj){
    return Math.sqrt( (point[0]-obj.x)*(point[0]-obj.x) + (point[1]-obj.y)*(point[1]-obj.y) );
}
function inArray(obj,array){
    for(var i=0;i<array.length;i++){
        if (array[i]==obj) return true;
    }
    return false;
}
function spawnRocket(){
    game.time.events.stop(true);
    rocket=game.add.sprite(w+150,h/2,"SpaceRocket");
    rocket.anchor.setTo(0.5,0.5);
    game.physics.arcade.enable(rocket);
    rocket.body.velocity.x=-initialVelocity;
}
function goToSpace(){
    in_space=1;
    pipes.forEach(function(part){part=null;console.log(part)});
    pipes.length=0;
    background.loadTexture("SpaceBackground");
    bounds[1].loadTexture("SpaceBackground");
    bounds[1].y=h;
    rocket.x=0;
    rocket.body.velocity.y=-500;
    player.x=20;
    player.body.velocity.x=initialVelocity;
    hit_centre=0;
    game.time.events.start();
    pipeGenerator=game.time.events.loop(Phaser.Timer.SECOND, generateAsteroid);
}
function generateAsteroid(){
    var y=game.rnd.pick([game.rnd.integerInRange(0,player.y-50),game.rnd.integerInRange(player.y+25,h)]);
    var asteroid=game.add.sprite(w+20,y,"SpaceAsteroid");
    game.physics.arcade.enable(asteroid);
    asteroid.body.velocity.x=-initialVelocity;
    asteroid.radius=asteroid.width/2;
    pipes.push(asteroid);
}