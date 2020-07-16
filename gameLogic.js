session = require("./session.js");
const cm = require("./cm.js").get();
session.setNewHandler((ws)=>{
	lobby.push(new Limbo(ws));
});

var globals = {};
globals.black 		= new session.Value("black");
globals.comb 		= new session.Value("comb");
globals.score 		= new session.Value("score");
globals.gameState 	= new session.Value("gameState");
players=[];
lobby = [];
left=[];
function Limbo(ws){
	this.ws = ws;
	this.locals = {white:[],selected:[],name:null,regular:true,combActive:false,whiteActive:false,regularCount:0,id:genid(),score:0};
	ws.addReceiveHandel("id",()=>{return true},(data)=>{
		for(key in left){
			if(left[key].id == data){
				this.locals = left[key]
			}
		}
		left = left.filter((locals)=>{return locals.id != data});
		ws.send("id",this.locals.id);
	});
	ws.addReceiveHandel("name",()=>{return true},(data)=>{
		found = false
		for(player of players){
			if(player.locals.name.get() == data){
				found = true;
				break;
			}
		}
		for(player of lobby){
			if(player.locals.name == data){
				found = true;
				break;
			}
		}
		if(!found){
			this.locals.name = data;
		}
		ws.send("name",this.locals.name);
	});
}
function Player(globals,locals,ws){
	this.globals= globals;
	this.locals = {};
	this.ws = ws;
	
	for(key in locals){
		this.locals[key] = new session.Value(key);
		this.locals[key].set(locals[key]);
	}
	this.getLocals = function(){
		out = {};
		for(key in this.locals){
		 out[key] = this.locals[key].get();
		}
		return out;
	}
	wsBind(ws,Object.values(this.globals).concat(Object.values(this.locals)));
	ws.addReceiveHandel("selectWinner",(data)=>{
		return this.globals.gameState.get() == 2 && !this.locals.regular.get() && idCheck(this.globals.comb,[data]);
	},(data)=>{
		data = sanitise(this.globals.comb,[data]);
		setWinner(data.id);
	});
	ws.addReceiveHandel("close",()=>{return true},()=>{
		left.push(this.getLocals());
		players = players.filter((player)=>{return player.id != this.locals.id.get()});
	});
	logic(this.globals,this.locals);
}
function genid(){
	return Math.floor(Date.now()*1000+Math.random()*1000)%(10**12);
}
function idCheck(vals,subset){
	subid = subset.reduce((out,now)=>{out.push(now.id)},[]);
	valid = val.reduce((out,now)=>{out.push(now.id)},[]);
	for(id of subid){
		if(!vals.includes(id)){
			return false
		}
	}
	return true;
}
function sanitise(vals,subset){
	subid = subset.reduce((out,now)=>{out.push(now.id)},[]);
	var out = [];
	for(val of vals){
		if(subid.includes(val.id)){
			out.push(val);
			subid.remove(val.id);
		}
	}
	return out;
}
function setWinner(id){
	for(player of players){
		if(player.locals.id.get()==id){
			player.score.set(player.score.get()+1);
			player.ws.send("win",null);
		}
	}
	globals.gameState.set(1);
}
function wsBind(ws,values){
 	for(value of values){
 		ws.addValueReceiveHandel(()=>{return true},value);
 		ws.addValueSendHandel(value);
 		ws.sendValue(value);
 	}
 	ws.addReceiveHandel("update",()=>{return true},()=>{
 		for(value of values){
 			ws.sendValue(value);
 		}
 	});

}

globals.gameState.addSetHandel((gameState)=>{
	globals.black.set(null);
	globals.score.set([]);
	globals.comb.set([]);
	
},0);
globals.gameState.addSetHandel((gameState)=>{
	var move = [];
	for(person of lobby){
		if(person.locals.name != null){
			person.ws.removeReceiveHandels();
			move.push(person.locals.id);
			players.push(new Player(globals,person.locals,person.ws))
		}
	}
	lobby = lobby.filter((person)=>{return !move.includes(person.id)});
	globals.black.set(cm.pickBlackCard());
	globals.comb.set([]);
	var max=-1;
	var picker =null;
	for(player of players){
		if(player.locals.regularCount.get()>max){
			max = player.locals.regularCount.get()
			picker = player;
		}
	}
	for(player of players){
		player.locals.regular.set((player != picker))
	}
	scr = globals.score.get();
	for(score of scr){
		score.status = 0;
	}
	globals.score.set(scr);
},1);
globals.gameState.addSetHandel((gameState)=>{


},2);
globals.comb.addSetHandel((value)=>{
	if(globals.gameState.get() == 1 &&value.get().length == globals.score.get().length-1){
		globals.gameState.set(2);
	}
});
function logic(globals,locals){
	locals.regular.addSetHandel((value)=>{
		locals.regularCount.set(locals.regularCount.get()+1);
	},true);
	globals.gameState.addSetHandel((value)=>{
		remaining = locals.white.get();
		locals.combActive.set(false);
		console.log("setWhite");
		locals.white.set(remaining.concat(cm.pickNWhiteCards(10-remaining.length,remaining)));
		console.log(locals.white.get());
		if(locals.regular.get()){
			locals.whiteActive.set(true);
		}else{
			locals.whiteActive.set(false);
		}
	},1);
	locals.name.addSetHandel((value)=>{
		scr = globals.score.get();
		for(score of scr){
			if(score.id == locals.id.get()){
				score.name = value.get();
			}
		}
		globals.score.set(scr);
	});
	locals.regular.addSetHandel(()=>{
		scr = globals.score.get();
		for(score of scr){
			if(score.id == locals.id.get()){
				score.status=2;
			}
		}
		globals.score.set(scr);
	},false);
	locals.whiteActive.addSetHandel(value=>{
		scr = globals.score.get();
		for(score of scr){
			if(score.id == locals.id.get()){
				if(value.get()){
					score.status=1;
				}else{
					score.status=0;
				}
			}
		}
		globals.score.set(scr);
	});
	locals.selected.addSetHandel((value)=>{
		if(value.get().length==globals.black.get().spaces){
			comb = {text:combine(globals.black.get(),value.get()),id:locals.id.get()}
			globals.comb.push(comb);
			locals.whiteActive.set(false);
			locals.white.set(locals.white.get().filter(function(o){
				return !value.get().includes(o);
			}));
			value.set([]);
		}
	});
	globals.gameState.addSetHandel((value)=>{
		if(!locals.regular.get()){
			locals.combActive.set(true);
		}
	},2);
	locals.name.addSetHandel((value)=>{
		globals.score.push({
			id:locals.id.get(),
			name:value.get(),
			score:0
		});
		
	});
}
function combine(black,whites){
		text = black.text.split(/_+/);
		for(i=0;i<whites.length;i++){
			sep =`<span class="blank">` +whites[i].text + `</span>`
  			text.splice(2*i+1,0,sep);
		
		}
		text = text.join('');
		return text
}
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}


exports.start = ()=>{
	globals.gameState.set(1);
}
exports.stop = ()=>{
	globals.gameState.set(0);
}
globals.gameState.set(0);