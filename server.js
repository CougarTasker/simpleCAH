const fs = require("fs");
const express = require('express');
const csv = require("csv-parse");


var bodyParser = require('body-parser');
const app = express()
const expressWs = require('express-ws')(app);

app.use(express.static('public'));

app.set("views","./views");
app.set('view engine', 'ejs');


// for parsing application/json
app.use(bodyParser.json()); 

// for parsing application/xwww-
app.use(bodyParser.urlencoded({ extended: true })); 

function cardMaster(file,done){
	this.whiteCount = 0;
	this.blackCount = 0
	this.white= [];
	this.black = [];

	

	fs.createReadStream(file)
  .pipe(csv())
  .on('data', (row) => {
  	if(row[0] =="Answer"){
  		this.white.push({
  			id:this.whiteCount,
  			text: row[1],
  		});
  		this.whiteCount++;
  	}else{
  		rgx =/(^|.)_+($|.)/g;
  		spc =row[1].match(rgx);
  		if(spc != null){
  			  		this.black.push({
  			id:this.blackCount,
  			text: row[1],
  			spaces:spc.length
  		});
  		this.blackCount++;
  	}
  	}
  }).on("end",done);

  this.pickWhiteCard = ()=>{
  	return this.white[Math.floor(Math.random() * (this.whiteCount-1))];
  };
   this.pickBlackCard = ()=>{
  	return this.black[Math.floor(Math.random() * (this.blackCount-1))];
  };
  this.pickNWhiteCards = (n)=>{
  	out = [];
  	for(i=0;i<n;i++){
  		out.push(this.pickWhiteCard());
  	}
  	return out;
  };

}




function allUpdate(){
	expressWs.getWss().clients.forEach((client)=>{
		update = {update:true}
		client.send(JSON.stringify(update));
	});
}



app.get("/",function(req,res){
	if(req.session.name){
		res.redirect('/play');
	}
});
app.get("/play",function(req,res){
	res.redirect('/');
});

app.post("/play",function(req,res){
	
	console.log(req.body.name);
	res.render("index",{               
    name:req.body.name
        });
});

var currentBlackCard = [];
var cm = new cardMaster("Cards_Against_Humanity.csv",function(){});
var currentCombCards = [];
var gameState = 0;
var players =[];
var picker = 0;
app.get("/start",function(req,res){

    		currentBlackCard = [cm.pickBlackCard()];
    		currentCombCards = [];
    		gameState = 1;
    		var i = 0;
    		console.log(players);
    		for(var key in players) {
  				players[key].white = cm.pickNWhiteCards(10);
  				players[key].score = 0;
  				players[key].pick = (i++ == (picker % Object.keys(players).length));
			}
			
			allUpdate();
    	res.send("done");
});


app.ws('/', (ws, req) => {
	

	// store.all((err,sessions)=>{
	// if(err){

	// }
	// console.log(sessions);
	// });
	//console.log(store);
    ws.on('message', msg => {
    	data = JSON.parse(msg);

    	if(!players[data.name]){
    			players[data.name] = {};
	    		players[data.name].white = [];
	    		players[data.name].name= data.name;
	    		players[data.name].pick = false;
	    		players[data.name].score = 0;
	    		console.log(players);
	    		console.log("player added");
    	}
    	session = players[data.name];

    	if(data.update){

    		console.log("update");
    		updateData={
    			update:false,
    			white:session.white,
    			black:currentBlackCard,
    			comb:currentCombCards,
    			game:gameState,
    			pick:session.pick,
    			score:Object.values(players)
    		}

			ws.send(JSON.stringify(updateData));
    	}else{
    		if(data.white){
    			parts = session.white.filter(function(o){
    				return data.white.includes(o.id);
    			});
    			session.white = session.white.filter(function(o){
    				return !data.white.includes(o.id);
    			});
    			var text = currentBlackCard[0].text;
    			for(i=0;i<parts.length;i++){
		  			text = text.replace(/_+/,function(x){
    				return `<span class="blank">` +parts[i].text + `</span>`;
    			});
    			}
  
    			comb={
    				name:session.name,
    				text:text
    			}
    			currentCombCards.push(comb);
    			console.log(players);
    			if(currentCombCards.length >= Object.keys(players).length -1){
    				gameState = 2
    			}
    		}
    		if(data.comb){
				players[data.comb].score += 1;
	    		currentBlackCard = [cm.pickBlackCard()];
				currentCombCards = [];
				picker +=1;
				gameState = 1;
				var i = 0;
				console.log(players);
	    		for(var key in players) {
	  				players[key].white = players[key].white.concat(cm.pickNWhiteCards(10-players[key].white.length)) ;
	  				players[key].pick = (i++ == (picker% Object.keys(players).length));
				}
    		}

    	allUpdate();
    	}

        //ws.send("hello" + req.session.name)
    });

    ws.on('close', () => {
    	allUpdate();
    });
});

app.listen(80)