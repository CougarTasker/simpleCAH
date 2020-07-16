$( document ).ready(()=>{
	ws.open(()=>{
		locals.white.addSetHandel((whites)=>{
			$("#bottom").empty()
			whites.get().forEach(function(card){
				card = $("<div></div>").text(card.text).addClass("card").addClass("white").prop("card-id",card.id);
				$("#bottom").append(card);
			});
		});
		globals.comb.addSetHandel((comb)=>{
			$(".comb").remove();
			comb.get().forEach(function(card){
				card = $("<div></div>").html(card.text).addClass("card").addClass("comb").prop("card-id",card.id);
				$("#top").append(card);
			});
		});
		globals.black.addSetHandel((black)=>{
			$(".black").remove();
			if(black.get()){
				card = black.get()
				card = $("<div></div>").text(card.text).addClass("card").addClass("black").prop("card-id",card.id);
				$("#top").append(card);
			}
		});
		locals.whiteActive.addSetHandel((whiteActive)=>{
			if(whiteActive.get()){
				$("#bottom").removeClass("grey");
				$(".white").click((e)=>{
					id = $(e.currentTarget).addClass("selected").prop("card-id");
					for(card of locals.white.get()){
						if(card.id == id){
							if(locals.selected.get()){
								locals.selected.push(card);
							}else{
								locals.selected.set([card]);
							}
							
						}
					}
				});
			}else{
				$(".white").off("click");
				$("#bottom").addClass("grey");
				
			}
		});
		locals.combActive.addSetHandel((combActive)=>{
			if(combActive.get()){
				$("#top").removeClass("grey");
				$(".comb").click((e)=>{
					winner = $(e.currentTarget).prop("card-id");
					for(card of globals.comb.get()){
						if(card.id == winner){
							ws.send("selectWinner",card);
						}
					}
				});
			}else{
				$("#top").addClass("grey");
				$(".comb").off("click");
			}
		});
		globals.gameState.addSetHandel(()=>{
			$("#top").removeClass("hidden");
		},2);
		globals.gameState.addSetHandel(()=>{
			$("#top").addClass("hidden");
		},1);
		ws.addReceiveHandel("win",()=>{return true},()=>{
			confetti.start();
			setTimeout(()=>{confetti.stop()},1000);
		});
		$("#submitName").click(()=>{
			locals.name.set($("input").val());
		});
		if(localStorage.getItem('id')){
			locals.id.set(Number(localStorage.getItem('id')));
		}else{
			$(".outer").addClass("shown");
		}
		locals.id.addSetHandel((value)=>{
			if(Number(localStorage.getItem('id'))!=value.get()){
				$(".outer").addClass("shown");
			}
			console.log(value.get());
			localStorage.setItem('id', value.get());
		});
		locals.name.addSetHandel((value)=>{
			if(!value.get()){
				$(".outer").addClass("shown");
				$("input").addClass("invalid");
				$("input").removeClass("valid");
			}else{
				
				$("input").addClass("valid");
				$("input").removeClass("invalid");
				$(".outer").removeClass("shown");
			}
		});
	});
});