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
	this.pblack = []

	
  this.pickWhiteCard = (cards)=>{
  	var card;
  	do{
	  	if(Math.random() > this.fact){
	  		card= cma.pickWhiteCard();
	  	}else{
	  		card= cmb.pickWhiteCard();
	  	}
	  }while(cards.includes(card));
	  return card;
  };
   this.pickBlackCard = ()=>{
  	var card;
  	do{
	  	if(Math.random() > this.fact){
	  		card= cma.pickBlackCard();
	  	}else{
	  		card= cmb.pickBlackCard();
	  	}
	  }while(this.pblack.includes(card));
	  if(this.pblack.length>=15){
	  	this.pblack.shift();
	  }
	  this.pblack.push(card);
	  return card;
  };
  this.pickNWhiteCards = (n,cards)=>{
  	out = [];
  	for(i=0;i<n;i++){
  		out.push(this.pickWhiteCard(cards));
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
	var start = Date.now();
	expressWs.getWss().clients.forEach((client)=>{
		update = {update:true}
		client.send(JSON.stringify(update));
	});
	//console.log("time start;");
	var length = 30*1000
	setTimeout(()=>{
		reset = false;
		// console.log(players);
		for(var key in players){
		// 	console.log(key);
			if (players[key].active<start-1000){
				// console.log("del");
				delete players[key];
				delete scoreBord[key];
				reset= true;
			}
		 }
		if(reset){
			startRound();
    		allUpdate();
		}
	},length)
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
var roundPlayerCount = 0;
var scoreBord = [];
var autoNext;
app.get("/start",function(req,res){

    	startRound();
    	res.send("done");
});
app.get("/stop",function(req,res){

    	stop();
    	res.send("done");
});
function startWinnerPicking(){
	if(currentCombCards.length != 0){
		clearTimeout(autoNext);
		for(var key in players) {
			if(players[key].pick){
				players[key].gameState =4;
			}else{
				players[key].gameState =3;
			}
		}
		autoNext = setTimeout(()=>{
			for(card of currentCombCards){
			    players[card.name].win = true;
				scoreBord[card.name].score += 1;
			}
			startRound();
		},1*60*1000);
	}else{
		startRound();
	}
	
}
function startRound(){
	clearTimeout(autoNext);
	currentBlackCard = [cm.pickBlackCard()];
   	currentCombCards = [];
	var i = 0;
	picker = picker % Object.keys(players).length;
	for(var key in players) {
			players[key].white = players[key].white.concat(cm.pickNWhiteCards(10-players[key].white.length,players[key].white));
			players[key].pick = (i++ == picker);
			if(players[key].pick){
				players[key].gameState =2;
			}else{
				players[key].gameState =1;
			}
			scoreBord[key].done = false;
	}
	picker+=1;
	roundPlayerCount = Object.keys(players).length;
	autoNext = setTimeout(()=>{
		startWinnerPicking();
		allUpdate();
	},(currentBlackCard[0].spaces + 1)*30*1000);
	allUpdate();
}
app.post("/players",function(req,res){
    	res.send(JSON.stringify(Object.keys(players)));
});
function stop(){
	players =[];
	clearTimeout(autoNext);
	currentCombCards = [];
	currentBlackCard = [];
	scoreBord=[];
	allUpdate();
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
	    		scoreBord[data.name]= {name:data.name,score:0,done:false};
	    		players[data.name].active = Date.now();
	    		players[data.name].gameState =0;
	    		players[data.name].old =0;
	    		players[data.name].win = false;
	    		allUpdate();
    	}
    	session = players[data.name];
    	session.active = Date.now();
    	if(data.update){
    		updateData={
    			update:false,
    			white:session.white,
    			black:currentBlackCard,
    			comb:currentCombCards,
    			game:session.gameState,
    			old:session.old,
    			score:Object.values(scoreBord),
    			win:session.win
    		}
    		session.old = session.gameState
    		session.win = false;
			ws.send(JSON.stringify(updateData));
    	}else{
    		if(data.white){
    			parts = session.white.filter(function(o){
    				return data.white.includes(o.id);
    			});
    			parts.sort(function(a,b){
    				return data.white.indexOf(a)-data.white.indexOf(b)
    			});
    			session.white = session.white.filter(function(o){
    				return !data.white.includes(o.id);
    			});
    			var text = currentBlackCard[0].text;
    			text = text.split(/_+/);
    			for(i=0;i<parts.length;i++){
    				sep =`<span class="blank">` +parts[i].text + `</span>`
		  			text.splice(2*i+1,0,sep);
    			
    			}
    			text = text.join('');
    			comb={
    				name:session.name,
    				text:text
    			}
    			currentCombCards.push(comb);
    			shuffle(currentCombCards);
    			session.gameState = 2;
    			scoreBord[data.name].done = true;
    			if(currentCombCards.length >= roundPlayerCount -1){
    				startWinnerPicking();
    			}
    			allUpdate();
    		}
    		if(data.comb){
    			scoreBord[data.name].done = true;
    			players[data.comb].win = true;
				scoreBord[data.comb].score += 1;
				startRound();
    		}

    	}

        //ws.send("hello" + req.session.name)
    });

    ws.on('close', () => {
    	allUpdate();
    });
});
var port = process.env.PORT || 80;
app.listen(port);