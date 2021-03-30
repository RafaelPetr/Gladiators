socket.on('joinCancel',function(data) {
    menuOpened = 'CancelJoin';
    joinCancelText = data.txt;
    joinCancelX = data.x;
})

socket.on('defineLobby',function(data) { //When client receives data to define the lobby he is in
    clientLobbyId = data;
})

socket.on('update',function(placeholder,lobbiesUsed,socketId) { //When client receives data to update game state
    ctx.clearRect(0,0,800,500);

    if (clientPlayer != undefined) {
        clientLobbyId = clientPlayer.lobbyId;
    }

    

    if (lobbiesUsed[clientLobbyId] != undefined) {
        if (lobbiesUsed[clientLobbyId].playersOnLobby > 0) {
            clientLobby = lobbiesUsed[clientLobbyId];
            clientLobby.playerList = lobbiesUsed[clientLobbyId].pack.player;
            clientLobby.bulletList = lobbiesUsed[clientLobbyId].pack.bullet;
        }
    }

    if (clientLobby != undefined) {

        var clientPlayer = undefined;

        for (var i in clientLobby.playerList) {
            if (clientLobby.playerList[i].id == socketId) {
                clientPlayer = clientLobby.playerList[i];
            }
        }

        if (clientPlayer == undefined) {
            menuOpened = 'DefeatScreen';
            clientLobby = undefined;
            clientLobbyId = undefined;
            clientPlayer = undefined;
        }
        
        else {
            SceneDraw(clientLobby.scene);
            ObstaclesDraw(clientLobby.obstacles,clientLobby.sceneChange);
            PlayerDraw(clientPlayer,clientLobby.playerList,clientLobby.phase);
            BulletDraw(clientPlayer,clientLobby.bulletList,clientLobby.playerList,clientLobby.phase);
            PlaySound(clientPlayer,clientLobby.playerList,clientLobby.phase,clientLobby.scene,clientLobby.sceneChange);
            HUDdraw(clientPlayer,clientLobby.playerList,clientLobby.phase);

            if (clientLobby.finishMatch == true) {
                menuOpened = 'VictoryScreen';
                socket.emit('finishMatch',clientLobby.i);
                clientLobby = undefined;
                clientLobbyId = undefined;
                clientPlayer = undefined;
            }
        }    
    }

    else {
        SceneDraw(placeholder.scene);
        ObstaclesDraw(placeholder.obstacles,placeholder.sceneChange); 
        MenuDraw();   
    }
})

function Command(cmd) {
    socket.emit('command',cmd,clientLobby.i);
}