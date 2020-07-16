const WebSocket = require('ws');


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
	this.removeReceiveHandels = ()=>{
		this.handels = [];
	}
	ws.on("close",()=>{
		this.handels.forEach((handel)=>{
			if(handel.name == "close"){
				handel.callback();
			}
		});
	})
	this.ws = ws;
	ws.on("message",(msg)=>{
		msg = JSON.parse(msg);
		this.handels.forEach((handel)=>{
			if(handel.name == msg.name && handel.state(msg.data)){
				handel.callback(msg.data);
			}
		});
	});
}


const wss = new WebSocket.Server({ port: 8080 });


wss.on('connection', function connection(ws) {
 	wsw = new WsWrapper(ws);
 	newhan(wsw);
});

var newhan;
exports.setNewHandler = (callback)=>{
	newhan = callback;
};
exports.Value = Value;