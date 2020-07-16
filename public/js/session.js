let socket
if(location.protocol == 'https:'){
	 socket = new WebSocket("wss://"+location.host+":8080");
}else{
	socket = new WebSocket("ws://"+location.host+":8080");
}

ws= new WsWrapper(socket);

function Value(name){
	this.state;
	this.name=name;
	this.handels=[];
	this.get= ()=>{
		return this.state;
	}
	this.push = (val,fromConn=false)=>{
		this.state.push(val);
		for(handel of this.handels){
			if(!handel.rest || handel.value == this.get()){
				handel.callback(this,fromConn);
			}
		}
	}
	this.set = (state,fromConn=false)=>{
		this.state = state
		for(handel of this.handels){
			if(!handel.rest || handel.value == this.get()){
				handel.callback(this,fromConn);
			}
		}
	}
	this.addSetHandel = (callback,value="*")=>{
		this.handels.push({callback:callback,rest:value!="*",value:value});
	}
}

var globals = {};
globals.black 		= new Value("black");
globals.comb 		= new Value("comb");
globals.score 		= new Value("score");
globals.gameState 	= new Value("gameState");
var locals = {};
locals.white 		= new Value("white");
locals.selected 	= new Value("selected");
locals.name 		= new Value("name");
locals.id			= new Value("id")
locals.regular 		= new Value("regular");
locals.whiteActive 	= new Value("whiteActive");
locals.combActive	= new Value("combActive");
locals.regularCount = new Value("regularCount");


wsBind(ws,Object.values(this.globals).concat(Object.values(this.locals)));


function WsWrapper(ws){
	this.handels = [];
	this.send = (name,data)=>{
		ws.send(JSON.stringify({name:name,data:data}));
	};
	this.addValueSendHandel = (value)=>{
		value.addSetHandel((val,fromConn)=>{
			if(!fromConn){
				this.sendValue(val);
			}
		});
	};
	this.sendValue= (value) =>{
		this.send(value.name,value.get());
	};
	this.addValueReceiveHandel = (state,value)=>{
		this.addReceiveHandel(value.name,state,(data)=>{
			value.set(data,true);
		})
	};
	this.addReceiveHandel = (name,state,callback)=>{
		this.handels.push({name:name,state:state,callback:callback});
	};
	this.ws = ws;
	ws.onmessage = (event)=>{
		msg = JSON.parse(event.data);
		this.handels.forEach((handel)=>{
			if(handel.name == msg.name && handel.state(msg.data)){
				handel.callback(msg.data);
			}
		});
	};
	this.open = (callback)=>{
		if(ws.readyState == 1){
		 	callback();
		}else{
			this.addReceiveHandel("open",()=>{return true},callback);
		}
	}
	ws.onopen = ()=>{
		this.handels.forEach((handel)=>{
			if(handel.name == "open"){
				handel.callback();
			}
		});
	}
	ws.onclose = ()=>{
		this.handels.forEach((handel)=>{
			if(handel.name == "close"){
				handel.callback();
			}
		});
	}

}
function wsBind(ws,values){
 	for(value of values){
 		ws.addValueReceiveHandel(()=>{return true},value);
 		ws.addValueSendHandel(value);
 	}
}


