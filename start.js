const express = require('express');
const app = express();
const gameLogic = require('./gameLogic.js');
app.use(express.static('public'));
app.get("/start",function(req,res){
    	gameLogic.start();
    	res.send("done");
});
app.get("/stop",function(req,res){

    	gameLogic.stop();
    	res.send("done");
});
var port = process.env.PORT || 80;
app.listen(port);

