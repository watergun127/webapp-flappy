var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var csv = require('ya-csv');

var app = express();
app.use(express.static(path.join(__dirname, "")));
app.use(bodyParser.urlencoded({extended:true}));

app.get("/", function(request, response){
    response.sendFile(path.join(__dirname, "pages/index.html"));
});
function UrlExists(url)
{
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status!=404;
}
app.get("/score", function (request, response){
        var reader = csv.createCsvFileReader("scores.csv");
        reader.setColumnNames(["name", "score"]);
        var scores = [];
        reader.addListener('data', function (data) {
            scores.push(data);
        });

        reader.addListener('end', function () {
            response.send(scores);
        });
});
app.post('/score', function(request, response){
    var name=request.body.fullName;
    var score=request.body.score;

    var database = csv.createCsvFileWriter("scores.csv", {"flags": "a"});
    var data = [name, score];

    database.writeRecord(data);
    database.writeStream.end();
});

var server = app.listen((process.env.PORT || 5000), function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Bob's Flappy Bird listening at http://%s:%s", host, port);
});
