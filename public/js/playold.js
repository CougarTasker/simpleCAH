var name = "<%- name %>";
								let socket
								if(location.protocol == 'https:'){
									 socket = new WebSocket("wss://"+location.host);
								}else{
									socket = new WebSocket("ws://"+location.host);
								}
					

				socket.onopen = function(e) {
					var resp = {
									update:true,
									name:name}
					socket.send(JSON.stringify(resp));
					//socket.send("My name is John");
				};
				
				var cardsneeded = 0;
				socket.onmessage = function(event) {
					var data = JSON.parse(event.data);
					if(data.update){
						var resp = {update:true,name:name};
						socket.send(JSON.stringify(resp));
					}else{
						//add cards 
						if(data.white&&data.game!=0){
							$("#bottom").empty()
										data.white.forEach(function(card){
							card = $("<div></div>").text(card.text).addClass("card").addClass("white").prop("card-id",card.id);
							$("#bottom").append(card);
								});
						}
			

						if(data.black&&data.game!=0){
							$(".black").remove();
							data.black.forEach(function(card){
								cardsneeded = card.spaces;
							card = $("<div></div>").text(card.text).addClass("card").addClass("black").prop("card-id",card.id);
								$("#top").append(card);
							});
						}
						if(data.comb&&data.game!=0){
							$(".comb").remove();
							data.comb.forEach(function(card){
								card = $("<div></div>").html(card.text).addClass("card").addClass("comb").prop("card-name",card.name);
								$("#top").append(card);
							});
						}
						if(data.win){
							confetti.start();
							setTimeout(()=>{confetti.stop()},1000);
						}
						if(data.score){
							$("#score tbody").empty();
							data.score.sort(function(a, b){return b.score - a.score});
							data.score.forEach(function(score){
								scoreName = $("<td></td>").text(score.name);
								scoreValue = $("<td></td>").text(score.score);
								icon= $("<span></span>").addClass("material-icons");
								if(score.done){
									icon.text("done");
								}else{
									icon.text("hourglass_empty");
								}
								statuss = $("<td></td>").append(icon)
								row= $("<tr></tr>").append(scoreName).append(scoreValue).append(statuss);
								$("#score tbody").append(row);
							});
						}
						
						setGameStateG(data.old);
						if(data.game!=data.old){
							window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{
								setGameStateG(data.game);
								setGameStateE(data.game);
							});});
						}else{
							setGameStateE(data.game);
						}
						
						
					}
				};

				socket.onclose = function(event) {

				};

				socket.onerror = function(error) {

				};
				var selectedCards =[];
				function setGameStateE(game){
					$(".card").off("click");
					if(game==0){
						selectedCards=[];
					}else if(game== 1){

						$(".white").click((e)=>{
								id = $(e.currentTarget).addClass("selected").prop("card-id")
								if(!selectedCards.includes(id)){
									selectedCards.push(id);
									console.log("click");
									console.log(selectedCards);

								}
								if(cardsneeded == selectedCards.length){
									var resp = {
										update:false,
										name:name,
										white:selectedCards
									};
									socket.send(JSON.stringify(resp));
									console.log("send")
									console.log(resp);
									selectedCards=[];
								}
						});
					}else if(game== 2){
						selectedCards=[];
					}else if(game== 3){
					}else if(game== 4){
						$(".comb").click((e)=>{
							winner = $(e.currentTarget).prop("card-name");
							 var resp = {
												update:false,
												name:name,
												comb:winner
											};
								socket.send(JSON.stringify(resp));
						});
					}
				}
				function setGameStateG(game){
					if(game==0){
						$("#message").text("please wait for the game to start");
						$(".white").addClass("grey");
						$(".comb").addClass("hidden").addClass("grey");
					}else if(game== 1){
						$(".white").removeClass("grey");
						$(".comb").addClass("hidden").addClass("grey");
						if(cardsneeded==1){
							$("#message").text("please select the card that fits the gap");
						}else{
							$("#message").text("please select the cards that fit the gaps");
						}
						$(".white").each((index)=>{
							if(selectedCards.includes($(this).prop("card-id"))){
								$(this).addClass("selected");
							}
						});
					}else if(game== 2){
						$(".white").addClass("grey");
						$(".comb").addClass("hidden").addClass("grey");
						$("#message").text("please wait for all the players to select their cards");
					}else if(game== 3){
						$(".white").addClass("grey");
						$(".comb").removeClass("hidden").addClass("grey");
						$("#message").text("please wait while the winner is picked");
					}else if(game== 4){
						$(".white").addClass("grey");
						$(".comb").removeClass("hidden").removeClass("grey");
						$("#message").text("please select the winner");
					}
				}