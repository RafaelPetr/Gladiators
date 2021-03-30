function BulletDraw(player,bullets,players,phase) {
    for (var i = 0; i < bullets.length; i++) {
        if (phase == 'Buying') {
            if (bullets[i].parent == player.id) { //If bullet was shot by client
                ctx.fillRect(bullets[i].x-5,bullets[i].y-5,10,10);
            }
        }
        else {
            if (bullets[i].parent == player.id) {
                ctx.fillRect(bullets[i].x-5,bullets[i].y-5,10,10);
            }
            for (var j in players) {
                if ((players[j].enemy == player.id || (player.ffa == true && players[j].ffa == true)) 
                && players[j].id == bullets[i].parent) { //If player #2 is player #1's enemy
                    ctx.fillRect(bullets[i].x-5,bullets[i].y-5,10,10);
                }
            }
        }
    }
}