function SceneDraw(scene) {
    scenario.src = '/client/img/'+ scene + '.png';
    ctx.drawImage(scenario,0,0,800,500,0,0,800,500);
}

function ObstaclesDraw(obstacles,sceneChange) {
    defineObstaclesImgs(obstacles,sceneChange);
    for (var i in obstacles) {
        var prop = obstacles[i];
        if (prop.img != '') { //If img src is defined
            ctx.drawImage(obstaclesImgs[i],prop.srcX,prop.srcY,prop.width,prop.height,prop.x,prop.y,prop.width,prop.height);
        }
        else {
            if (prop.color != undefined) {
                ctx.fillStyle = prop.color;
                ctx.fillRect(prop.x,prop.y,prop.width,prop.height); //Draw a backup rectangle
            }
        }
    }
}

function defineObstaclesImgs(obstacles,sceneChange) {
    if (obstacles != undefined) {
        //If oobstacles imgs needs to reset
        if (sceneChange == true || (obstaclesImgs.length == 0 && obstacles.length > 0) || (obstaclesImgs[0].src != obstacles[0].img)) {
            obstaclesImgs = [];
            for (var i in obstacles) {
                var img = new Image();
                img.src = obstacles[i].img; //Give obstacle's img to img's src
                obstaclesImgs[i] = img;
            }
        }
    }
}