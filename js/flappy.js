// the Game object used by the phaser.io library
var stateActions = { preload: preload, create: create, update: update };
$("#greeting-form").on("submit", function() {
    //$("#scoreBoard").append( "<li>" +
    //document.getElementById("fullName").value + ": " + document.getElementById("score").value +
    //"</li>");
    scores.push({name:document.getElementById("fullName").value,score:document.getElementById("score").value});
    setScoreboard(scores);
    $("#greeting").hide();
    restart();

});

$.get("/score", setScoreboard);
function setScoreboard(scores_){
    scores=scores_;
    sortScores();
    document.getElementById("scoreBoard").innerHTML="";
    for (var i = 0; i < scores.length; i++) {
        $("#scoreBoard").append(
            "<li>" +
            scores[i].name + ": " + scores[i].score +
            "</li>");
    }
}
function sortScores(){
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
}
// Phaser parameters:
// - game width
// - game height
// - renderer (go for Phaser.AUTO)
// - element where the game will be drawn ('game')
// - actions on the game state (or null for nothing)
var w=650,h=400;
var game = new Phaser.Game(w, h, Phaser.AUTO, 'game',null,true,true);//, stateActions);
game.state.add("Game",stateActions);
game.state.start("Game");
var logo,background;
var score = 0,scoreLabel;
var GoKey=Phaser.Keyboard.SPACEBAR;
var assetPath="../assets/";
var player,maxLiftSpeed=-300,gravity=800,angleRatio=0.5,initialVelocity=150,pipeSpeed=-150;
var bounds=[],pipes=[],point_lines=[];
var hit_centre=0,game_started=0,dying=0,dead=0;
var pipeGenerator;
var scores=[];
/*
 * Loads all resources for the game and gives them names.
 */
function preload() {
    var back_bool=game.rnd.integerInRange(0,1);
    if(back_bool)
        game.load.image("Background",assetPath+"morning.png");
    else
        game.load.image("Background",assetPath+"night.png");
    var birds=["Red/","Blue/","Yellow/"];
    var bird=birds[game.rnd.integerInRange(0,2)];
    game.load.image("Flappy-Neutral",assetPath+"Birds/"+bird+"neutral.png");
    game.load.image("Flappy-Up",assetPath+"Birds/"+bird+"down2.png");
    game.load.image("Flappy-Down",assetPath+"Birds/"+bird+"down1.png");
    game.load.image("Floor",assetPath+"floor.png");
    var pipes=["Green/","Red/"];
    var pipe=pipes[game.rnd.integerInRange(0,1)];
    game.load.image("PipeTop",assetPath+"Pipes/"+pipe+"end.png");
    game.load.image("PipePiece",assetPath+"Pipes/"+pipe+"block.png");
    game.load.image("Logo",assetPath+"logo2.png");
    game.load.audio("Score",assetPath+"point.ogg");
}
/*
 * Initialises the game. This function is only called once.
 */
function create() {
    resetGame();
    game.physics.startSystem(Phaser.Physics.ARCADE);
    background=game.add.tileSprite(0, 0,w,h, "Background");
    logo=game.add.sprite(w/2,h*0.25,"Logo");
    logo.anchor.setTo(0.5,0.5);
    game.physics.arcade.enable(logo);
    createWalls();
    game.input.keyboard.addKey(GoKey).onDown.add(Jump);
    game.input.keyboard.addKey(GoKey).onUp.add(EndJump);

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
}
function restart(){
    game.state.start("Game");
}
function createPlayer(x,y){
    player=game.add.sprite(x,y,"Flappy-Neutral");
    player.anchor.setTo(0.5,0.5);
    player.scale.setTo(2.5,2.5);
    game.physics.arcade.enable(player);
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
    player.loadTexture("Flappy-Down");
    player.body.velocity.y = maxLiftSpeed;

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
}
function hitBounds(){
    angleRatio=0.4;
}
function hitPipe(){
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
    $("#score").val(score.toString());//Submit Score
    $("#greeting").show();
}
function generateRandomPipeSet(){
    var start_y=game.rnd.integerInRange(100,h-100);
    createPipeSet(start_y);
}
function createPipeSet(safe_y){
    //Have 50px either side of safe_y for player to navigate
    var pipe1=createPipe(safe_y-75,-1);//Create top pipe
    var pipe2=createPipe(safe_y+75,1);//Create bottom pipe
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
function updatePlayer(){
    player.rotation = -Math.atan((player.body.velocity.y / maxLiftSpeed));
    if (player.x>=w/2&&!hit_centre) {
        player.body.velocity.x = 0;
        background.autoScroll(-initialVelocity/2,0);
        bounds[1].autoScroll(-initialVelocity, 0);
        pipeGenerator=game.time.events.loop(1.75 * Phaser.Timer.SECOND, generateRandomPipeSet);
        logo.body.velocity.x=-initialVelocity;
        hit_centre = 1;
    }
    game.physics.arcade.collide(player,bounds,hitBounds);
}
function updatePipes(){
    for(var i=0;i<pipes.length;i++){
        if (pipes[i].x+pipes[i].width<0)
            pipes.splice(i,1);
    }
    for (i=0;i<point_lines.length;i++){
        point_lines[i]+=pipeSpeed*game.time.elapsed/1000;
        if(point_lines[i]<=player.x){
            delete(point_lines[i]);
            point_lines.splice(i,1);
            addPoint();
        }
    }
    game.physics.arcade.overlap(player,pipes,hitPipe);
}
function updateDyingPlayer(){
    player.angle+=15;
    game.physics.arcade.overlap(player,bounds[1],die);
}
function update() {
    if (game_started&&!dying) {
        updatePlayer();
        updatePipes();
    }
    if (dying&&!dead){
        updateDyingPlayer();
    }
}
