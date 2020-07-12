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

function cardMaster(file){
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
  });
  //.on("end",()=>{console.log(this.white)});

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
function multiCardMaster(cma,cmb,fact){
	this.cma= cma;
	this.cmb = cmb;
	this.fact = fact
	

	
  this.pickWhiteCard = ()=>{
  	if(Math.random() > fact){
  		return cma.pickWhiteCard();
  	}else{
  		return cmb.pickWhiteCard();
  	}
  };
   this.pickBlackCard = ()=>{
  	if(Math.random() > fact){
  		return cma.pickBlackCard();
  	}else{
  		return cmb.pickBlackCard();
  	}
  };
  this.pickNWhiteCards = (n)=>{
  	out = [];
  	for(i=0;i<n;i++){
  		out.push(this.pickWhiteCard());
  	}
  	return out;
  };

}
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
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
	
	res.render("index",{               
    name:req.body.name
        });
});
var currentBlackCard = [];
var cm = new multiCardMaster(new cardMaster("cust.csv"),new cardMaster("Cards_Against_Humanity.csv"),0.5);
var currentCombCards = [];
var players =[];
var picker = 0;
app.get("/start",function(req,res){

    	startRound();
    	allUpdate();
    	res.send("done");
});
app.get("/stop",function(req,res){

    	stop();
    	allUpdate();
    	res.send("done");
});
function startRound(){
	currentBlackCard = [cm.pickBlackCard()];
   	currentCombCards = [];
	var i = 0;
	picker = picker % Object.keys(players).length;
	for(var key in players) {
			players[key].white = players[key].white.concat(cm.pickNWhiteCards(10-players[key].white.length));
			players[key].pick = (i++ == picker);
			if(players[key].pick){
				players[key].gameState =2;
			}else{
				players[key].gameState =1;
			}
	}
	picker+=1;
}
function stop(){
	players =[];
	currentCombCards = [];
	currentBlackCard = [];
}
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
	    		players[data.name].gameState =0;
	    		allUpdate();
    	}
    	session = players[data.name];

    	if(data.update){

    		updateData={
    			update:false,
    			white:session.white,
    			black:currentBlackCard,
    			comb:currentCombCards,
    			game:session.gameState,
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
    			shuffle(currentCombCards);
    			session.gameState = 2;
    			if(currentCombCards.length >= Object.keys(players).length -1){
					for(var key in players) {
						if(players[key].pick){
							players[key].gameState =4;
						}else{
							players[key].gameState =3;
						}
					}
    			}
    		}
    		if(data.comb){
				players[data.comb].score += 1;
				startRound();
    		}

    	allUpdate();
    	}

        //ws.send("hello" + req.session.name)
    });

    ws.on('close', () => {
    	allUpdate();
    });
});
var port = process.env.PORT || 80;
app.listen(port);