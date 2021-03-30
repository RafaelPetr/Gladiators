function PlayerDraw(player,players,phase) { //Do conditionals to draw player
    if (phase == 'Buying') {
        drawCharacter(player);
    }
    else {
        drawCharacter(player);
        for (var a in players) {
            if (players[a].id == player.enemy || (players[a].ffa == true && player.ffa == true)) { //If player is client's enemy
                drawCharacter(players[a]);
            }
        }
    }
}

function drawCharacter(player) { //Define src and draw player
    if (player.hp > 0) {
        var playerImage = new Image();
        playerImage.src = '/client/img/' + player.character + '.png';
        ctx.drawImage(playerImage,player.srcX,player.srcY,player.width,player.height,player.x,player.y,player.width,player.height);

        //Draw hp and shield counters rectangles
        ctx.fillStyle = 'red';
        ctx.fillRect(player.x,player.y-9,15*player.hp,4);
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x,player.y-14,9*player.shield,4);
        ctx.fillStyle = 'red';
    }
    
}