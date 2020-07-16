const fs = require("fs");
const csv = require("csv-parse");
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
  this.pickNWhiteCards = (n,cards=[])=>{
  	out = [];
  	for(i=0;i<n;i++){
  		out.push(this.pickWhiteCard(cards));
  	}
  	return out;
  };

}

function effg(){
  this.k = false;
}

module.exports.get = ()=>{return new multiCardMaster(new cardMaster("cust.csv"),new cardMaster("Cards_Against_Humanity.csv"),0.5);}