//Setting server

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req,res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static('client'));

serv.listen(process.env.PORT || 2000);
console.log('started')

var SOCKET_LIST = {}; //Sockets connected
var playersConnected = []; //All players connected

//Time for each phase
var timeLimitBuying = '0:50';
var timeLimitBuyingMin = 0;
var timeLimitBuyingSeg = 50;
var timeLimitBattle = '1:30';
var timeLimitBattleMin = 1;
var timeLimitBattleSeg = 30;

var scenes = ['Desert','Rails','Winter','Beach','WarRemains','Desert']; //Scenes in the game
var itemsAdd = ['Pistol','SubmachineGun','Shotgun','Sniper','GrenadeLauncher']; //Items in the game
var maxAmmos = [7,20,6,12,2];
var characterNames = ['Russel','Benny','Kotri','Mirrah','Norman']; //Characters in the game

//Item buying odds
var itemNames = ['Pistol','SubmachineGun','Pistol','Shield','Shotgun','Sniper','GrenadeLauncher','Shield','Shotgun','Sniper','Pistol','SubmachineGun','Shield','Shotgun','Sniper','GrenadeLauncher'];

function Lobby(password,maxPlayers,privacy,i) {
    this.password = password;
    this.i = i; //Position on array "lobbies"
    this.lobbyPlaying = false;

    this.time = timeLimitBuying; 
    this.timer = 0;
    this.segundos = timeLimitBuyingSeg;
    this.minutos = timeLimitBuyingMin;

    this.playersMatch = 0; //Players matched with each other
    this.playersFFAdead = 0;
    this.playersDead = 0; //Players dead in duel
    this.playerstoFinish = 0; //Players to die for phase swap

    this.phase = 'Buying';

    this.playerList = [];
    this.bulletList = [];
    this.obstacles = [];

    this.sceneChange = false;
    this.playersOnLobby = 0;
    this.privacy = privacy;
    this.maxPlayers = maxPlayers;
    this.finishMatch = false;
    this.closeLobby = 0;

    this.sceneI = Math.floor(Math.random()*scenes.length); //Generate random scene index
    this.scene = undefined;

    this.update = function() {

        
        this.updatePack();
        this.updateObstacles();

        this.playersOnLobby = this.pack.player.length;
        
        if (this.pack.player.length >= 2 && this.lobbyPlaying == true) {
            this.updateTime();
            this.updatePhase();
        }

        if (this.playersOnLobby == 1 && this.lobbyPlaying == true) {
            this.finishMatch = true;
        }

        if (this.matchPlayers == true) {
            this.updateMatchmaking();
        }
        
    };

    this.updatePack = function() { //Update lobby, players and bullets package
        
        this.pack = {
            player:Player.update(i).sort(function(a, b){return b.life - a.life}),
            bullet:Bullet.update(i),
        }
        this.sceneChange = false;
    };

    this.updateObstacles = function() {
        for (var j = 0; j < this.obstacles.length; j++) {
            this.obstacles[j].update();
            if (this.obstacles[j].destroyed) {
                this.obstacles.splice(j,1);
            }
        }
    }

    this.updateTime = function() {
        this.timer++; //Update clock timer
        if (this.timer % 25 == 0) { //Every 25 frames
            if (this.segundos == 0) { //When there is a full minute on the clock
                this.segundos = 59;
                this.minutos--;
            }
            else {
                this.segundos--;
            }
        }
        if (this.segundos < 10) {
            this.time = this.minutos + ':0' + this.segundos; //Adds another 0 to the seconds clock
        }
        else {
            this.time = this.minutos + ':' + this.segundos;
        }
    };

    this.updatePhase = function() {
        if (this.phase == 'Buying' && this.time == '0:00') {
            this.phase = 'Battle';

            this.time = timeLimitBattle;
            this.minutos = timeLimitBattleMin;
            this.segundos = timeLimitBattleSeg;

            //Reset Buying related variables from players
            for (var i in this.playerList) {
                this.playerList[i].itemBuying = undefined;
                this.playerList[i].itemSelling = undefined;
    
                for (var j in this.playerList[i].inventory) {
                    this.playerList[i].inventory[j].holding = false;
                    this.playerList[i].inventory[j].switch = false;
                    this.playerList[i].inventory[j].combining = false;
                    
                }
                this.playerList[i].combine = 0;
            }
            
        }
        else if (this.phase == 'Battle' && (this.time == '0:00' || this.playersDead == this.playerstoFinish)) {
            this.phase = 'Buying';
            this.time = timeLimitBuying;

            this.minutos = timeLimitBuyingMin;
            this.segundos = timeLimitBuyingSeg;

            //Reset Battle related variables
            this.playersDead = 0;
            this.playersFFAdead = 0;

            for (var i in this.playerList) {
                this.playerList[i].y = 300;
                this.playerList[i].enemy = undefined;
                this.playerList[i].ffa = false;
                this.playerList[i].hp = this.playerList[i].maxHp;
                this.playerList[i].gold += 100; 
                this.playerList[i].defineitemsBuy();
                
                if (this.playerList[i].buy[this.playerList[i].buy.length-1].price-this.playerList[i].turns*100 > 0) {
                    this.playerList[i].turns++; 
                }

            }
    
            this.obstacles = [];
            var randomScene = Math.floor(Math.random()*scenes.length);
            if (randomScene == this.sceneI) {
                this.sceneI = this.sceneI+1;
            }
            else {
                this.sceneI = randomScene;
            }
            this.updateScene(this.sceneI);
            this.matchPlayers = true;
        }
    };

    this.updateMatchmaking = function() { //Match players on lobby
        var playersArray = [];
        for (var i in this.playerList) {
            playersArray.push(this.playerList[i]);
        }
        playersArray = playersArray.sort(function(a, b){return b.life - a.life});
        playersMatch = playersArray.length;
        this.playerstoFinish = (playersMatch + (playersMatch % 2))/2; //Define players to finish Battle phase
        for (var i in playersArray) {
            if (playersArray.length % 2 == 1 && i >= playersArray.length -3) {
                playersArray[i].ffa = true;
                playersArray[i].enemy = undefined;
            }
            else if (playersArray[i-1] != undefined && i % 2 == 1) {
                playersArray[i].enemy = playersArray[i-1].id;
                playersArray[i-1].enemy = playersArray[i].id;
    
                playersArray[i].ffa = false;
                playersArray[i-1].ffa = false;
            }
        }
        this.matchPlayers = false;
    };

    this.updateScene = function(i) {
        var acceptedScenes = { //Define obstacles for the provided scene

            Desert() {
                var cactus1 = new Obstacle(300,100,'Cactus');
                var cactus2 = new Obstacle(620,180,'Cactus');
                var cactus3 = new Obstacle(120,380,'Cactus');
                var cactus4 = new Obstacle(480,360,'Cactus');
    
                var obstacles = [cactus1,cactus2,cactus3,cactus4];
    
                return obstacles;
    
            },
    
            Rails() {
                
                var sapling1 = new Obstacle(100,110,'Sapling');
                var sapling2 = new Obstacle(700,80,'Sapling');
                var sapling3 = new Obstacle(180,380,'Sapling');
                var train = new Obstacle(-3000,130,'Train');
                
    
                var obstacles = [sapling1,sapling2,sapling3,train];
    
                return obstacles;
            },
    
            Winter() {
                var ice1 = new Obstacle(0,0,'Ice');
                var ice2 = new Obstacle(230,0,'Ice');
                var ice3 = new Obstacle(500,0,'Ice');
                var ice_cube1 = new Obstacle(300,100,'IceCube');
                var ice_cube2 = new Obstacle(200,340,'IceCube');
                var ice_cube3 = new Obstacle(540,150,'IceCube');
                var ice_cube4 = new Obstacle(460,310,'IceCube');
                
                var obstacles = [ice1,ice2,ice3,ice_cube1,ice_cube2,ice_cube3,ice_cube4];
    
                return obstacles;
            },
            Beach() {
                water = new Obstacle(0,427,'Water');
                boat1 = new Obstacle(270,171,'Boat');
                rock1 = new Obstacle(120,321,'Rock');
                rock2 = new Obstacle(650,71,'Rock');
    
                var obstacles = [water,boat1,rock1,rock2];
                return obstacles;
            },
            WarRemains() {
                barricade1 = new Obstacle(218,311,'Barricade');
                barricade2 = new Obstacle(536,311,'Barricade');
                cliff1 = new Obstacle(0,218,'Cliff',169,21);
                cliff2 = new Obstacle(171,197,'Cliff',171,22);
                cliff3 = new Obstacle(345,176,'Cliff',172,23);
                cliff4 = new Obstacle(516,197,'Cliff',176,22);
                cliff5 = new Obstacle(695,216,'Cliff',109,21);
    
                var obstacles = [barricade1,barricade2,cliff1,cliff2,cliff3,cliff4,cliff5];
                return obstacles;
            },
            Desert() {
                var cactus1 = new Obstacle(300,100,'Cactus');
                var cactus2 = new Obstacle(620,180,'Cactus');
                var cactus3 = new Obstacle(120,380,'Cactus');
                var cactus4 = new Obstacle(480,360,'Cactus');
    
                var obstacles = [cactus1,cactus2,cactus3,cactus4];
    
                return obstacles;
    
            },
        }
    
        var sceneFunction = acceptedScenes[scenes[i]];
        
        if (this.obstacles.length == 0) {
            this.obstacles = sceneFunction();
        }
    
        this.scene = scenes[i]; //Set scene for the index provided
        this.sceneChange = true;
    }
    this.updateScene(this.sceneI);
}

var lobbies = [];

for (var i = 0; i < 50; i++) { //Set up 50 default lobbies
    var id = Math.random();
    var lobby = new Lobby(id,8,'Public',i);
    lobbies[i] = lobby;
}

var Entity = function() {
    var self = {
        x:250,
        y:250,
        spdX:0,
        spdY:0,
        id:"",
    }
    self.update = function() {
        self.updatePosition();
    }
    self.updatePosition = function() {
        self.x += self.spdX;
        self.y += self.spdY;
    }

    return self;
}

function Obstacle(x,y,type,width,height) {

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    //Source x and y on img
    this.srcX = 0;
    this.srcY = 0;

    this.spdX = 0;
    this.spdY = 0;

    this.animate = false;
    this.counter = 0; //Animation counter

    //Kill on contact right, left, etc
    this.killR = false;
    this.killL = false;
    this.killU = false;
    this.killD = false;

    this.solid = true; //Solid for player
    this.bulletSolid = true;
    this.slip = false //Slip player
    this.img = '';
    this.destroyed = false;
    
    var acceptedObstacle = { //Define obstacle properties for obstacle provided
        
        Cactus(obstacle) {
            obstacle.width = 50;
            obstacle.height = 60;
            obstacle.animateOnHit = true;
            obstacle.hp = 30;
            obstacle.changeState = 10;
            obstacle.changeOn = 20;
            obstacle.img = '/client/img/Cactus.png';
            obstacle.frames = 4;
            return obstacle;
        },

        Train(obstacle) {
            obstacle.spdX = 20;
            obstacle.srcY = 0;
            obstacle.width = 1200;
            obstacle.height = 145;
            obstacle.animate = true;
            obstacle.frames = 4;
            obstacle.killR = true;
            obstacle.img = '/client/img/Train.png';
            return obstacle;
        },
        Ice(obstacle) {
            obstacle.width = 322;
            obstacle.height = 500;
            obstacle.solid = false;
            obstacle.bulletSolid = false;
            obstacle.img = '/client/img/Ice.png';
            obstacle.slip = true;
            return obstacle;
        },
        Sapling(obstacle) {
            obstacle.width = 50;
            obstacle.height = 45;
            obstacle.frames = 3;
            obstacle.hp = 15;
            obstacle.changeState = 5;
            obstacle.changeOn = 10;
            obstacle.animateOnHit = true;
            obstacle.img = '/client/img/Sapling.png';
            return obstacle;
        },
        IceCube(obstacle) {
            obstacle.width = 50;
            obstacle.height = 50;
            obstacle.frames = 3;
            obstacle.hp = 15;
            obstacle.changeState = 5;
            obstacle.changeOn = 15;
            obstacle.animateOnHit = true;
            obstacle.img = '/client/img/Ice_Cube.png';
            return obstacle;
        },
        Water(obstacle) {
            obstacle.width = 800;
            obstacle.height = 124;
            obstacle.bulletSolid = false;
            obstacle.color = "#4c87c3";
            return obstacle;
        },
        Boat(obstacle) {
            obstacle.width = 239;
            obstacle.height = 99;
            obstacle.frames = 3;
            obstacle.hp = 15;
            obstacle.changeState = 5;
            obstacle.changeOn = 10;
            obstacle.animateOnDestruction = true;
            obstacle.img = '/client/img/Boat.png';
            return obstacle;
        },
        Rock(obstacle) {
            obstacle.width = 60;
            obstacle.height = 43;
            obstacle.frames = 3;
            obstacle.hp = 15;
            obstacle.changeState = 5;
            obstacle.changeOn = 10;
            obstacle.animateOnHit = true;
            obstacle.img = '/client/img/Rock.png';
            return obstacle;
        },
        Atom_Bomb(obstacle) {
            obstacle.width = 66;
            obstacle.height = 64;
            obstacle.img = '/client/img/Atom_Bomb.png';
            return obstacle;
        },
        Barricade(obstacle) {
            obstacle.width = 22;
            obstacle.height = 102;
            obstacle.frames = 3;
            obstacle.hp = 15;
            obstacle.changeState = 5;
            obstacle.changeOn = 10;
            obstacle.animateOnDestruction = true;
            obstacle.img = '/client/img/Barricade.png';
            return obstacle;
        },
        Cliff(obstacle) {
            obstacle.bulletSolid = false;
            return obstacle;
        },
    }

    var obstacleFunction = acceptedObstacle[type];
    obstacleFunction(this);

    this.move = function() {

        this.x += this.spdX;
        this.y += this.spdY;

        if (this.x >= 2000) {
            this.x = -2000;
        }
        if (this.y >= 2000) {
            this.y = -2000;
        }
    };
    this.anima = function() {
        if (this.animate == true) {
            this.counter++;
    
            if (this.counter >= this.frames*this.frames) {
                this.counter = 0;
                if (this.animateOnHit) {
                    this.animate = false;
                    if (this.hp <= 0) {
                        this.destroyed = true;
                    }
                }
                if (this.animateOnDestruction) {
                    this.animate = false;
                    this.destroyed = true;
                }
            }
            
            this.srcX = Math.floor(this.counter/this.frames) * this.width;
        }
    };
    this.update = function() {
        this.move();
        this.anima();
    };
    this.collisionPlayer = function(player) {
        if (this.solid == false) {
                
            if (player.y < this.y + this.height - 7 && player.y + player.height > this.y + 7) {
                if (player.x < this.x + this.width && player.x + player.width > this.x + this.width) {
                    player.slip = this.slip;
                }
                else if (player.x + player.width > this.x && player.x < this.x) {
                    player.slip = this.slip;
                }                            
            }
            if (player.x + player.width > this.x + 7 && player.x < this.width + this.x - 7) {
                if (player.y < this.y + this.height && player.y + player.height > this.y + this.height) {
                    player.slip = this.slip;
                }
                else if (player.y + player.height > this.y && player.y < this.y + this.height) {
                    player.slip = this.slip;
                }
            }               
        }
        else {
            if (player.y < this.y + this.height - 7 && player.y + player.height > this.y + 7) {
                if (player.x < this.x + this.width && player.x + player.width > this.x + this.width) {
                    player.x = this.x + this.width;
                    if (this.killR == true) {
                        var kill = true;
                    }
                }
                else if (player.x + player.width > this.x && player.x < this.x) {
                    player.x = this.x - player.width;
                    if (this.killL == true) {
                        var kill = true;
                    }
                }
            }
            else if (player.x + player.width > this.x + 7 && player.x < this.width + this.x - 7) {
                if (player.y < this.y + this.height && player.y + player.height > this.y + this.height) {
                    player.y = this.y + this.height;
                    if (this.killU == true) {
                        var kill = true;
                    }
                }
                else if (player.y + player.height > this.y && player.y < this.y + this.height) {
                    player.y = this.y - player.height;
                    if (this.killD == true) {
                        var kill = true;
                    }
                }
            }


            if (kill == true && lobbies[player.lobbyId].phase == 'Battle') { //If it is Battle phase and the player needs to be killed
                player.die();
    
                if (player.ffa == false && lobbies[player.lobbyId].playerList[player.enemy] != undefined) { //If it is a duel
                    lobbies[player.lobbyId].playerList[player.enemy].gold += 100 + player.level*50; //Give gold to enemy
                }
                else { //If it is a FFA
                    for (var i in lobbies[player.lobbyId].playerList) {
                        if (lobbies[player.lobbyId].playerList[i].ffa == true && lobbies[player.lobbyId].playerList[i].hp > 0) {
                            lobbies[player.lobbyId].playerList[i].gold += 100 + player.level*50;
                        }
                    }
                }
            }
        }
    }
    this.collisionBullet = function(bullet,phase) {
        if (this.bulletSolid == true) {
            if (bullet.y + 15 > this.y && bullet.y - 16 < this.y + this.height) {
                if (bullet.x + 15 > this.x && bullet.x - 15 < this.x + this.width) {
                    bullet.toRemove = true;
                    if (this.hp != undefined && phase == 'Buying') {
                        this.hp -= bullet.item.dmg;
                        if (this.hp <= this.changeOn) {
                            this.changeOn = this.changeOn - this.changeState;
                            if (this.animateOnHit == true) {
                                this.srcY += this.height;
                            }
                            else if (this.animateOnDestruction == true) {
                                this.srcX += this.width;
                            }
                        }
                        if (this.hp <= 0) {
                            this.counter = 0;
                            this.bulletSolid = false;
                            this.solid = false;
                        }
                    }
                    if (this.animateOnHit) {
                        this.animate = true;
                    }
                    else if (this.animateOnDestruction == true) {
                        if (this.hp <= 0 && this.animate == false) {
                            this.srcX = 0;
                            this.srcY += this.height;
                            this.animate = true;
                        }
                    }
                }
            }
        }
    }
}

function Item(name,rarity,prof) {
    this.name = name;
    this.rarity = rarity; //Rarity (common, uncommon, rare, epic and legendary)
    //x and y position on HUD
    this.x = 0;
    this.y = 0;
    this.holding = false; //"Selected by player" attribute
    this.cooldown = 100;
    this.combining = false; //Combining with other items
    this.switch = false; //Defines if item is marked to swap an equipped item
    this.bulletTimer = 100;

    this.accepteditems = { //Define item properties with item provided
        Pistol(item) {
            item.firerate = 10;
            item.balas = 1; //Bullets per shot
            item.ammo = 7;
            item.dmg = 0.5 + item.rarity/4 + prof/4;
            item.price = 50 + item.rarity*50;
            item.bSpeed = 10 + item.rarity + prof; //Bullet speed
            item.type = 'weapon';
            item.ArrayPos = 0; //Position on weapons added to the game array
            return item;
        },
        SubmachineGun(item) {
            item.firerate = 7 - Math.round(item.rarity/2) - prof;
            item.balas = 1;
            item.ammo = 20;
            item.dmg = 0.25 + item.rarity/4 + prof/4;
            item.price = 100 + item.rarity*75 - prof*25;
            item.bSpeed = 10 + item.rarity + prof;
            item.type = 'weapon';
            item.ArrayPos = 1;
            return item;
        },
        Shotgun(item) {
            item.firerate = 25;
            item.balas = 3 + prof*2;
            item.ammo = 6;
            item.dmg = 1 - prof/4;
            item.price = 150 + item.rarity*100 - prof*50;
            item.bSpeed = 10 + item.rarity;
            item.type = 'weapon';
            item.ArrayPos = 2;
            return item;
        },
        Sniper(item) {
            item.firerate = 30 - item.rarity*2 - prof*3;
            item.balas = 1;
            item.ammo = 12;
            item.dmg = 2 + item.rarity;
            item.price = 200 + item.rarity*150 - prof*100;
            item.bSpeed = 20 + item.rarity*2;
            item.type = 'weapon';
            item.ArrayPos = 3;
            return item;
        },
        GrenadeLauncher(item) {
            item.firerate = 30 - item.rarity - prof*3;
            item.balas = 1;
            item.ammo = 2 + prof*2;
            item.dmg = 0;
            item.price = 350 + item.rarity*150 - prof*100;
            item.bSpeed = 10 + prof*2;
            item.type = 'weapon';
            item.ArrayPos = 4;
            item.bulletTimer = 30;
            return item;
        },
        levelUp(item) {
            item.price = 300 + item.rarity*100;
            item.type = 'level';
            return item;
        },
        reroll(item) {
            item.price = 50;
            item.type = 'reroll';
            return item;
        },
        Shield(item) {
            item.price = 50 + 50*item.rarity;
            item.shield = 1 + 1*item.rarity;
            item.type = 'shield';
            return item;
        }
    }
    var itemFunction = this.accepteditems[this.name];
    itemFunction(this);
    this.maxAmmo = this.ammo; //Max ammo loaded
}

var Player = function(id,nickname,character,lobbyId) {
    
    var self = Entity();
    self.reroll = new Item('reroll',0);
    self.levelUp = new Item('levelUp',0);
    self.width = 46;
    self.height = 63;
    self.id = id;
    self.lobbyId = lobbyId;
    self.nickname = nickname;
    self.character = character;
    self.right = false;
    self.left = false;
    self.up = false;
    self.down = false;
    self.aimright = false;
    self.aimleft = false;
    self.aimup = false;
    self.aimdown = false;
    self.angle = 0; //Shooting angle
    self.balas_counter = 0; //Shot counter
    self.balas_lados = 0; //Bullets on side of shot
    self.emUso = 1; //Item being used (on Items equipped)
    self.hp = 3;
    self.shield = 0;
    self.maxHp = 3;
    self.life = 30; //Ingame life until player loses
    self.gold = 500;

    self.srcX = 0;
    self.srcY = 0;

    self.counter = 0; //Animation counter
    self.stop = 'down'; //Stop player animation on...
    self.shootsound;
    self.hudSFX = [];
    self.explosionSnd = false;
    self.items = []; //Items equipped
    self.inventory = [];
    self.level = 1;
    self.spareAmmos = []; //Spare ammos for each weapon
    self.proficiency = []; //Proficiency on weapons

    for (var i = 0; i < characterNames.length; i++) { //Define Spare Ammmos and proficiency from character
        self.spareAmmos[i] = 0;
        self.proficiency[i] = 0;

        if (characterNames[i] == self.character) {
            self.spareAmmos[i] = maxAmmos[i]+(i==4)*2;
            self.proficiency[i] = 1;
        }
    }
    
    self.itemBuying; //Item selected to buy
    self.itemSelling; //Item selected to sell
    self.enemy = undefined;
    self.combine = 0; //Amount of items being combined by the player
    self.itemsCombined = []; //Array of items being combined by the player
    self.buyHUD = false; //Define if player oppened the buy HUD
    self.inventoryHUD = false;
    self.playersHUD = false;
    self.itemsHUD = false; 
    self.turns = 0; //Turns passed
    self.ffa = false;
    self.slip = false;
    self.execute = ''; //Player executing action

    var super_update = self.update;
    self.update = function() {

        self.updateSpd();
        self.updateCollision();
        self.itemCooldown();
        self.Angle();

        if (self.item != undefined) {
            self.chargeItem();
        }

        self.anima();

        if (self.execute != undefined) {
            var acceptedExecutions = {
                Buy_Sell() {
                    self.Buy_Sell();
                },
                Combination() {
                    self.Combination();
                },
                ItemChange() {
                    self.ItemChange();
                },
                Reload() {
                    self.Reload();
                },
                Unequip() {
                    self.Unequip();
                },
            }
    
            var executionFunction = acceptedExecutions[self.execute];
            if (executionFunction != undefined) {
                executionFunction();
                self.execute = '';
            }
        }

        if (self.life <= 0) {
            lobbies[self.lobbyId].playersOnLobby--;
            delete lobbies[self.lobbyId].playerList[self.id];
            delete playersConnected[self.lobbyId];
        }

        super_update();

    }

    self.itemCooldown = function() { //Update items equipped cooldown
        if (self.item != undefined) {
            if (self.item.ammo <= 0 && self.item.cooldown == 0 && self.spareAmmos[self.item.ArrayPos] > 0) {
                self.item.cooldown = 100;
            }
        }

        for (var i = 0; i < self.items.length; i++) {
            if (self.items[i] != undefined && self.items[i].cooldown == 1 && self.spareAmmos[self.items[i].ArrayPos] > 0) {
                //Reload mechanic, pretty much
                var ammoLeft = (self.items[i].maxAmmo-self.items[i].ammo);
                if (self.spareAmmos[self.items[i].ArrayPos] > 0) {
                    if (ammoLeft <= self.spareAmmos[self.items[i].ArrayPos]) {
                        self.items[i].ammo += ammoLeft;
                        self.spareAmmos[self.items[i].ArrayPos] -= ammoLeft;
                    }
                    else {
                        self.items[i].ammo += self.spareAmmos[self.items[i].ArrayPos];
                        self.spareAmmos[self.items[i].ArrayPos] = 0;
                    }
                    self.items[i].cooldown--;
                    if (self.items[i] == self.item) {
                        self.balas_counter = 0;
                    }
                }
            }
        }        
        
        for (var i = 0; i < self.items.length; i++) {
            if (self.items[i] != undefined && self.items[i].cooldown > 0) {
                self.items[i].cooldown--;
            }
        }
    }

    
    self.chargeItem = function() { //Charging "attack"
        if ((self.aimright || self.aimdown || self.aimup || self.aimleft) && self.hp > 0) {
            self.balas_counter++;
            if (self.balas_counter == self.item.firerate && self.item.ammo > 0 && self.item.cooldown == 0) {
                if (self.item.balas > 1) {
                    for (var i = Math.ceil(-self.item.balas/2); i <= Math.floor(self.item.balas/2); i++) {
                        self.shootBullet(i *10 + self.angle,i);
                    }
                }
                else {
                    self.shootBullet(self.angle);
                }
                
                self.balas_counter = 0;
                self.shootsound = true;
                self.item.ammo--;
            }
            else {
                self.shootsound = false;
            }
        }
        else {
            self.shootsound = false;
            self.balas_counter = 0;
        }
    }
    self.Angle = function() { //Define angle of shooting
        self.angle = 0;
        if (self.aimright == true) {
            self.angle = 360 + (self.aimup || -self.aimdown) * 45*(self.angle>0);
        }
        else if (self.aimleft == true) {
            self.angle = 180 + (-self.aimup || self.aimdown) * 45*(self.angle>0);
        }
        if (self.aimdown == true) {
            self.angle = 90 + (-self.aimright || self.aimleft) * 45*(self.angle>0);
        }
        else if (self.aimup == true) {
            self.angle = 270 + (self.aimright || -self.aimleft) * 45*(self.angle>0);
        }
    }

    self.countSrc = function(srcY,maxCount,fps) { //Define source for animation
        if (self.srcY != srcY) {
            self.srcX = 0;
            self.srcY = srcY;
            self.counter = 0;
        }
        if (self.spdX != 0 || self.spdY != 0) {
            self.counter++;
        }
        else {
            if (self.angle != 0) {
                self.counter = 0;
            }
        }
        if (self.counter >= maxCount) {
            self.counter = 0; 
        }
        
        self.srcX = Math.floor(self.counter/fps) * self.width;
    }

    self.anima = function() { //Animate player
        if ((self.up == true && self.angle == 0) || ((self.angle > 180 && self.angle < 360) && self.angle != 0)) {
            self.countSrc(441,9,3);
        }
        else if ((self.right == true && self.angle == 0) || ((self.angle > 270 || self.angle < 90) && self.angle != 0)) {
            self.countSrc(378,9,3);
        }
        else if ((self.down == true && self.angle == 0) || ((self.angle > 0 && self.angle < 180) && self.angle != 0)) {
            self.countSrc(252,9,3);
        }
        else if ((self.left == true && self.angle == 0) || ((self.angle < 270 && self.angle > 90) && self.angle != 0)) {
            self.countSrc(315,9,3);
        }

        else {
            self.counter++;
            switch (self.stop) {
                case 'up': 
                    self.countSrc(189,16,4);
                    break;
                case 'right':
                    self.countSrc(126,16,4);
                    break;
                case 'down':
                    self.countSrc(0,16,4);
                    break;
                case 'left':
                    self.countSrc(63,16,4);
                    break;
            }
        }
    }

    self.shootBullet = function(angle,i) { //Define and create bullet on provided angle
        var b = Bullet(self.id,angle,self.item,self.lobbyId);

        if (i != undefined) {
            if (i > 0) {
                angle = angle-10*i;
            }
            else {
                angle = angle+10*(-i);
            }
        }
        
        if (angle > 180 && angle < 360) {
            b.y = self.y;
        }
        else if (angle > 0 && angle < 180) {
            b.y = self.y + self.height;
        }
        else {
            b.y = self.y+30;
        }

        if (angle > 270 || angle < 90) {
            b.x = self.x + self.width;
        }
        else if (angle < 270 && angle > 90) {
            b.x = self.x;
        }
        else {
            b.x = self.x+(self.width/2);
        }
    }

    self.updateSpd = function() { //Defines player speed x and y for direction
        if (self.hp > 0) {
            if (self.right == true) {
                self.spdX = 7;
            }
            else if (self.left == true) {
                self.spdX = -7;
            }
            else if (self.slip == false) {
                self.spdX = 0;
            }
            if (self.up == true) {
                self.spdY = -7;
            }
            else if (self.down == true) {
                self.spdY = 7;
            }
            else if (self.slip == false) {
                self.spdY = 0;
            }
        }
    }

    self.defineitemsBuy = function() {
        var item = self.randomItem();
        var item1 = self.randomItem();
        var item2 = self.randomItem();
        self.buy = [item,item1,item2,self.reroll];
        if (self.level < 6) {
            self.buy.push(self.levelUp);
        }
        self.organizeBuy();
    }

    self.organizeInventory = function() {
        var a = -1; //Line variable
        for (var i in self.inventory) {
            if (i%2 == 0) {
                self.inventory[i].x = 670;
                a++;
            }
            else {
                self.inventory[i].x = 740;
            }
            self.inventory[i].y = 70*a+130;
        }
    }

    self.organizeBuy = function() {
        var b = 0; //Column variable
        for (var i in self.buy) {
            var item = self.buy[i];
            item.x = 70*b+10;
            item.y = 10;
            b++;
        }
    }

    self.randomItem = function() { //Generate random item
        var w = Math.floor(Math.random() * (self.level+1)); //Define random item type number
        var r = Math.floor(Math.random() * (self.level+1)); //Define random item rarity number
        if (r > 4) {
            r = 4;
        }
    
        var itemName = itemNames[w];
        var itemRarity = r;
        var prof = self.proficiency[itemsAdd.indexOf(itemName)]; //Get player's proficiency with the item
    
        return new Item(itemName,itemRarity,prof);
    }

    self.die = function() {
        var lobby = lobbies[self.lobbyId];
        if ((self.ffa == true && lobby.playersFFAdead < 2) || (self.ffa == false && lobby.playerList[self.enemy].hp > 0)) {
            self.hp = 0;
            self.life -= self.maxHp; //Reduce his game life by his max health points
            if (self.ffa == true) {
                lobby.playersFFAdead++;
            }
    
            lobby.playersDead++;
        }
        //Generate a random position to respawn
        self.x = Math.floor(Math.random()*600);
        self.y = 300;
    }

    self.takeDamage = function(killer,dmg) {
        if (self.shield > 0) {
            self.shield -= dmg;
            if (self.shield < 0) {
                self.shield = 0;
            }
        }
        else {
            self.shield = 0;
            self.hp -= dmg;
        }
        if (self.hp <= 0) {
            self.die();

            killer.gold += 100 + self.level*50;
        }
    }

    self.Reload = function() {
        if (self.item != undefined && self.item.cooldown == 0 && self.item.ammo != self.item.maxAmmo) {
            if (self.spareAmmos[self.item.ArrayPos] > 0) {
                self.item.cooldown = 100;
            }
        }
    }

    self.Unequip = function() {
        if (lobbies[self.lobbyId].phase == 'Buying') {
            if (self.items[self.emUso-1] != undefined && self.inventory.length < 6) {

                unequippedItem = self.items[self.emUso-1];
                self.item = undefined;
    
                self.items[self.emUso-1] = undefined;
    
                self.inventory.push(unequippedItem);
    
                self.organizeInventory();

                self.hudSFX.push('Swap');
    
            }
        }
        
    }

    self.Combination = function() {
        var combining = 0; //Amount of equal items being combined
        var ammo = 0; //Ammo to be added to spare
        var newItem = self.itemsCombined[0];
        if (self.combine == 3) {
            for (var i = 0; i < self.itemsCombined.length; i++) {
                if (self.itemsCombined[i].name == self.itemsCombined[0].name &&
                    self.itemsCombined[i].rarity == self.itemsCombined[0].rarity) {
                    combining++;
                    ammo += self.itemsCombined[i].ammo;
                }
            }
            if (combining == 3) {
                newItem.rarity = self.itemsCombined[0].rarity+1;
                var itemPush = new Item(newItem.name,newItem.rarity,self.proficiency[newItem.ArrayPos]);
                self.spareAmmos[newItem.ArrayPos] += ammo;
                itemPush.ammo = 0;
                itemPush.combining = false;
                for (var i = 0; i < self.inventory.length; i++) {
                    if (self.inventory[i].combining == true) {
                        self.inventory.splice(i,1);
                        i--;
                    }
                }
                self.itemsCombined = [];
                self.inventory.push(itemPush);
                self.combine = 0;
                self.hudSFX.push('Combine');
                self.organizeInventory();
            }
            self.itemSelling = undefined;
        }
    }

    self.ItemChange = function() { //Swap inventory item with equipped item or change item holding
        if (self.items.length >= 0) {
            if (self.emUso <= 3) {
                for (var a = 0; a < self.inventory.length; a++) {
                    if (self.inventory[a].switch == true) {
                        self.inventory[a].cooldown = 0;
                        var itemswitched = self.items[self.emUso-1];
                        if (itemswitched != undefined) {
                            itemswitched.x = self.inventory[a].x;
                            itemswitched.y = self.inventory[a].y;
                        }

                        self.items[self.emUso-1] = self.inventory[a];
                        self.items[self.emUso-1].holding = false;
                        self.items[self.emUso-1].switch = false;
                        
                        if (itemswitched != undefined) {
                            itemswitched.holding = false;
                            itemswitched.switch = false;
                            self.inventory[a] = itemswitched;
                            itemswitched.cooldown = 0;
                        }
                        else {
                            self.inventory.splice(a,1);
                        }
                        self.itemSelling = undefined;
                    }
                }
            }
            if (self.emUso <= self.items.length) {
                if (self.items[self.emUso-1] != undefined && self.item != self.items[self.emUso-1]) {
                    self.item = self.items[self.emUso-1];
                    self.hudSFX.push('Swap');
                    self.balas_counter = 0;
                }
            }
        }
    }

    self.Buy_Sell = function() {
        if (self.itemBuying != undefined) {
            if (self.gold >= self.itemBuying.price-(self.turns*100) && self.itemBuying.name == 'levelUp') {
                self.level++;
                self.gold -= self.itemBuying.price-(self.turns*100); //(Level's price reduces per turn)
                
                //Level up items (level and reroll)
                self.buy[self.buy.length-1].rarity++;
                self.buy[self.buy.length-2].rarity++;

                self.buy[self.buy.length-1].price = 300 + self.buy[self.buy.length-1].rarity*100;
                self.turns = 0; //Reset turns counter
                if (self.level == 6) {
                    self.buy[self.buy.length-2].rarity--;
                    self.buy.splice(self.itemBuying.i,1);
                }
                self.hudSFX.push('BuySell');
                self.itemBuying.holding = false;
                self.itemBuying = undefined;
            }
            else if (self.gold >= self.itemBuying.price && self.itemBuying.name == 'reroll') {
                self.itemBuying.holding = false;
                self.gold -= self.itemBuying.price;
                self.defineitemsBuy(); //Define another roll of items
                self.itemBuying = undefined;
                self.hudSFX.push('BuySell');
            }
            else if (self.gold >= self.itemBuying.price && self.itemBuying.name == 'Shield' && self.shield < 5) {
                self.gold -= self.itemBuying.price;
                self.shield += self.itemBuying.shield;
                if (self.shield > 5) {
                    self.shield = 5;
                }
                self.buy.splice(self.itemBuying.i,1);
                self.hudSFX.push('BuySell');
            }
            else {
                if (self.inventory.length < 6 && self.itemBuying.name != 'Shield') { //Buying an weapon
                    if (self.gold >= self.itemBuying.price && self.itemBuying != undefined) {
                        self.inventory.push(self.itemBuying);
                        self.buy.splice(self.itemBuying.i,1);
                        self.gold -= self.itemBuying.price;
                        self.spareAmmos[self.itemBuying.ArrayPos] += self.itemBuying.ammo;
                        self.inventory[self.inventory.length-1].switch = false;
                        self.inventory[self.inventory.length-1].holding = false;
                        self.organizeInventory();
                        self.hudSFX.push('BuySell');
                    }
                }
            }
            self.itemBuying = undefined;
        }
        else if (self.itemSelling != undefined) {
            self.spareAmmos[self.itemSelling.ArrayPos] += self.itemSelling.ammo; //Add loaded ammo to spare
            self.gold += self.itemSelling.price/2;
            self.inventory.splice(self.itemSelling.i,1);
            self.itemSelling = undefined;
            self.organizeInventory();
            self.hudSFX.push('BuySell');
        }
        self.mouse = undefined;
    }

    self.updateCollision = function() {
        if (self.lobbyId != undefined) {
            var lobby = lobbies[self.lobbyId];
            if (self.hp > 0) {
                for (var i in lobby.playerList) {
                    if (lobby.playerList[i].id != self.id) {
                        var p = lobby.playerList[i];
                    }
                    //If player is colliding with another player
                    if (p != undefined && (p.id == self.enemy || (p.ffa == true && self.ffa == true)) && lobby.phase == 'Battle' && p.hp > 0) {
                        if (self.y < p.y + p.height - 7 && self.y + self.height > p.y + 7) {
                            if (self.x < p.x + p.width && self.x + self.width > p.x + p.width && self.spdX != 0) {
                                self.x = p.x + p.width;
                            }
                            else if (self.x + self.width > p.x && self.x < p.x && self.spdX != 0) {
                                self.x = p.x - self.width;
                            }
                        }
                        else if (self.x + self.width > p.x + 7 && self.x < p.width + p.x - 7) {
                            if (self.y < p.y + p.height && self.y + self.height > p.y + p.height && self.spdY != 0) {
                                self.y = p.y + p.height;
                            }
                            else if (self.y + self.height > p.y && self.y < p.y + p.height && self.spdY != 0) {
                                self.y = p.y - p.height;
                            }
                        }
                    }
                }
                //Out of bounds collision
                if (self.x + self.width > 800) {
                    self.x = 800 - self.width;
                }
                if (self.x < 0) {
                    self.x = 0;
                }
                if (self.y < 0) {
                    self.y = 0;
                }
                if (self.y + self.height > 500) {
                    self.y = 500 - self.height;
                }

                self.slip = false;
                
                var obstacles = lobby.obstacles;
                for (var i in obstacles) {
                    obstacles[i].collisionPlayer(self);
                }
                
            }
        }
    }
    var w3 = self.randomItem(); 
    var w4 = self.randomItem();
    var w5 = self.randomItem();
    self.buy = [w3,w4,w5,self.reroll,self.levelUp];
    self.organizeInventory();
    self.organizeBuy();
    playersConnected[id] = self; //Put player on Array of players connected to the game
    lobbies[self.lobbyId].playerList[self.id] = self; //Put player on the lobby
    return self;
}


Player.onConnect = function(socket,nickname,character,lobbyId) {
    var player = Player(socket.id,nickname,character,lobbyId); //Create a player with information provided

    socket.on('keyPress',function(data) {

        var acceptedKeys = { //Define key being pressed
            right(player) {
                player.right = data.state;
                player.stop = 'right';
            },
            left(player) {
                player.left = data.state;
                player.stop = 'left';
            },
            up(player) {
                player.up = data.state;
                player.stop = 'up';
            },
            down(player) {
                player.down = data.state;
                player.stop = 'down';
            },
            aright(player) { //(a stands for aim)
                player.aimright = data.state;
                player.stop = 'right';
            },
            aleft(player) {
                player.aimleft = data.state;
                player.stop = 'left';
            },
            aup(player) {
                player.aimup = data.state;
                player.stop = 'up';
            },
            adown(player) {
                player.aimdown = data.state;
                player.stop = 'down';
            },
            reload(player) {
                player.execute = 'Reload';
            },
            unequip(player) {
                player.execute = 'Unequip';
            },
            combine(player) {
                player.execute = 'Combination';
            },
            buy_sell(player) {
                player.execute = 'Buy_Sell';
            },
            itemChange(player) {
                if (player.items[data.emUso-1] != undefined || player.itemSelling != undefined) {
                    player.execute = 'ItemChange';
                    player.emUso = data.emUso;
                }
            },
        }

        keyFunction = acceptedKeys[data.inputId];
        keyFunction(player);
    })

    socket.on('addCombine',function(data) { //When RightClick data is received from client
        var dontCombine = false //Define variable to cancel combination
        player.mouseCombine = {
            x:data.x,
            y:data.y,
        }
        for (var i in player.inventory) {
            item = player.inventory[i];
            if (player.mouseCombine.x > item.x && player.mouseCombine.x < item.x+50 &&
                player.mouseCombine.y > item.y && player.mouseCombine.y < item.y+50) {
                    for (var a in player.itemsCombined) {
                        if (player.itemsCombined[a] == player.inventory[i] && player.inventory[i].combining == true) {
                            player.itemsCombined.splice(a,1);
                            player.combine--;
                            dontCombine = true;
                        }
                    }
                    player.inventory[i].combining = !player.inventory[i].combining;
                    if (player.inventory[i].switch == true) { 
                        player.inventory[i].switch = false;
                        player.inventory[i].holding = false;
                        if (player.inventory[i] == player.itemSelling) {
                            player.itemSelling = undefined;
                        }
                        player.mouse = undefined;
                    }
                    if (player.combine == 3) {
                        if (player.inventory[i].combining == true) {
                            player.inventory[i].combining = false;
                        }
                    }
                    if (player.combine < 3 && player.inventory[i].combining == true && dontCombine == false) {
                        player.combine++;
                        player.itemsCombined.push(player.inventory[i]);
                    }
                                
            }
        }
    })
    socket.on('mouseMove',function(data) {
        player.mouseNeutral = { //Update position for a neutral variable of player's mouse
            x:data.x,
            y:data.y,
        }
    }) 
    socket.on('mouse',function(data) { //When LeftClick data is received from client
        if (data.x != undefined) {
            player.mouse = { //Update position for mouse variable (switch, buying and selling)
                x:data.x,
                y:data.y,
            }
            player.itemBuying = undefined;
            player.itemSelling = undefined;

            if (player.buyHUD == true) {
                for (var i = 0; i < player.buy.length; i++) {
                    var item = player.buy[i];
                    player.buy[i].holding = false;
                    if (player.mouse.x > item.x && player.mouse.x < item.x+50 &&
                        player.mouse.y > item.y && player.mouse.y < item.y+50) {
                            player.buy[i].holding = true;
                            player.itemBuying = item;
                            player.itemBuying.i = i; //Define item buying's position on HUD
                        }
                }
            }
                

            if (player.inventoryHUD == true) {
                for (var i = 0; i < player.inventory.length; i++) {
                    var item = player.inventory[i];
                    player.inventory[i].holding = false; 
                    player.inventory[i].switch = false;
                    if (player.mouse.x > item.x && player.mouse.x < item.x+50 &&
                        player.mouse.y > item.y && player.mouse.y < item.y+50) {
                            player.inventory[i].holding = true;
                            player.inventory[i].switch = true;
                            if (player.inventory[i].combining == true) {
                                player.inventory[i].combining = false;
                                player.combine--;
                            }
                            player.itemSelling = player.inventory[i];
                            player.itemSelling.i = i;
                    }
                }
            }
        }
    })

    socket.on('hud',function(data) { //When HUD (de)activation data is received from client
        var acceptedPlaces = { //Define hud for place provided
            inv() {
                player.inventoryHUD = data.state;
            },
            buy() {
                player.buyHUD = data.state;
            },
            players() {
                player.playersHUD = data.state;
            },
            items() {
                player.itemsHUD = data.state;
            },
        }
        placeFunction = acceptedPlaces[data.place];
        if (placeFunction != undefined) {
            placeFunction();
        }
    })

    socket.on('cancelSound',function() { //When HUD (de)activation data is received from client
        player.explosionSnd = false;
    })

    socket.on('finishMatch',function(i) {
        lobbies[i].playerList = [];
        lobbies[i].playersOnLobby = 0;
        lobbies[i].lobbyPlaying = false;
        lobbies[i].finishMatch = false;
        if (i >= 50) {
            delete lobbies[i];
        }
        delete playersConnected[player.id];
    })
}
Player.onDisconnect = function(socket) {
    if (playersConnected[socket.id] != undefined) { //If this player is connected
        var lobbyId = playersConnected[socket.id].lobbyId; //Define player's lobby
        lobbies[lobbyId].playersOnLobby--;
        delete lobbies[lobbyId].playerList[socket.id];
        delete playersConnected[socket.id];
        if (lobbies[lobbyId].playersOnLobby == 0 && lobbyId >= 50) {
            delete lobbies[lobbyId];
        }
        else {
            lobbies[lobbyId].matchPlayers = true; //Activate lobby's matchmaking
        }
    }
    
}

Player.update = function(lobbyId) { //Update player's pack
    var pack = [];
    for (var i in lobbies[lobbyId].playerList) {
        var player = lobbies[lobbyId].playerList[i];
        player.update();
        pack.push({ //Push data to package
            x:player.x,
            y:player.y,
            width:player.width,
            height:player.height,
            number:player.number,
            id:player.id,
            nickname:player.nickname,
            item:player.item,
            items:player.items,
            inventory:player.inventory,
            buy:player.buy,
            gold:player.gold,
            hp:player.hp,
            shield:player.shield,
            life:player.life,
            srcX:player.srcX,
            srcY:player.srcY,
            counter:player.counter,
            shootsound:player.shootsound,
            explosionSnd:player.explosionSnd,
            emUso:player.emUso,
            mouse:player.mouse,
            mouseNeutral:player.mouseNeutral,
            enemy:player.enemy,
            level:player.level,
            itemsCombined:player.itemsCombined,
            buyHUD:player.buyHUD,
            inventoryHUD:player.inventoryHUD,
            playersHUD:player.playersHUD,
            itemsHUD:player.itemsHUD,
            ffa:player.ffa,
            spareAmmos:player.spareAmmos,
            itemBuying:player.itemBuying,
            itemSelling:player.itemSelling,
            right:player.right,
            left:player.left,
            up:player.up,
            down:player.down,
            character:player.character,
            hudSFX:player.hudSFX,
            turns:player.turns,
            lobbyId:player.lobbyId,
        })
        player.hudSFX = [];
    }
    return pack;
}

var Bullet = function(parent,angle,item,lobbyId) {
    var self = Entity();
    self.id = Math.random();

    self.spdX = Math.cos(angle/180 *Math.PI) *item.bSpeed;
    self.spdY = Math.sin(angle/180 *Math.PI) *item.bSpeed;

    self.parent = parent; //Define player that shot
    self.item = item;
    self.dmg = item.dmg;
    self.lobbyId = lobbyId; //Define its lobby

    self.timer = 0; //Duration timer
    self.maxTimer = item.bulletTimer; //Time until bullet expires
    self.toRemove = false; //"Remove from game" variable
    var super_update = self.update;

    self.damagePlayer = function() {
        for (var i in lobbies[self.lobbyId].playerList) {
            var players = lobbies[self.lobbyId].playerList;
            var p = players[i];
            if (p.hp > 0 && lobbies[self.lobbyId].phase == 'Battle' && p.id != self.parent) {
                if (p.enemy == self.parent || (players[p.id].ffa == true && players[self.parent].ffa == true)) {
                    if (self.y < p.y + p.height && self.y > p.y-p.height+50) {
                        if (self.x < p.x + p.width && self.x > p.x) {
                            self.toRemove = true;
                            p.takeDamage(players[self.parent],self.dmg);
                        }
                        else if (self.x > p.x && self.x < p.x +p.width) {
                            self.toRemove = true;
                            p.takeDamage(players[self.parent],self.dmg);
                        }
                    }
                }
            }
        }
    }
    self.updateCollision = function() {
        var obstacles = lobbies[self.lobbyId].obstacles;
        for (var i in obstacles) {
            obstacles[i].collisionBullet(self,lobbies[self.lobbyId].phase);
        }
    }

    self.update = function() {
        if (self.timer++ > self.maxTimer) {
            self.toRemove = true;
        }
        super_update();

        self.damagePlayer();
        self.updateCollision();
    }
    lobbies[lobbyId].bulletList[self.id] = self; //Put bullet on lobby
    return self;
}


Bullet.update = function(lobbyId) {
    
    var pack = [];
    for (var i in lobbies[lobbyId].bulletList) {
        var bullet = lobbies[lobbyId].bulletList[i];
        bullet.update();
        if (bullet.toRemove) {
            if (bullet.item.name == 'GrenadeLauncher') {
                var angle = 30;
                var weapon = new Item('Pistol',1,0);
                for (var a = 0; a <= 11; a++) {
                    var b = Bullet(bullet.parent,angle,weapon,bullet.lobbyId);
                    b.x = bullet.x+5;
                    b.y = bullet.y+5;
                    angle += 30;
                    playersConnected[bullet.parent].explosionSnd = true;
                }
            }
            delete lobbies[lobbyId].bulletList[i];
        }
        else {
            pack.push ({ //Update bullets' package
                x:bullet.x,
                y:bullet.y,
                id:bullet.id,
                parent:bullet.parent,
            })
        }
    }
    return pack;
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection',function(socket) {
    socket.id = Math.random().toFixed(16);
    SOCKET_LIST[socket.id] = socket;

    socket.on('entrar',function(data) { //When "client entering game" data is received from client
        if (data.password != "") { //If password informed isn't empty
            var lobby = undefined;
            for (var i in lobbies) {
                if (lobbies[i].password == data.password) {
                    lobby = lobbies[i];
                    break;
                }
            }
            if (lobby != undefined) {
                if (lobby.playersOnLobby < lobby.maxPlayers) {
                    Player.onConnect(socket,data.nick,data.char,lobby.i);
                    lobby.playersOnLobby++;
                    lobby.matchPlayers = true; //Activate matchmaking
                    socket.emit('defineLobby',lobby.i); //Send data for lobby that client connected
                }
            }
            else {
                socket.emit('joinCancel',{txt:'Lobby expired',x:242});
            }
        }
        else {
            if (data.id != undefined) {
                if (lobbies[data.id] != undefined) {
                    Player.onConnect(socket,data.nick,data.char,data.id);
                    lobbies[data.id].playersOnLobby++;
                    lobbies[data.id].matchPlayers = true;
                }
                else {
                    socket.emit('joinCancel',{txt:'Lobby expired',x:242});
                }
                
            }
            else {
                for (var i in lobbies) {
                    if (lobbies[i] != undefined) {
                        if (lobbies[i].playersOnLobby < lobbies[i].maxPlayers && lobbies[i].privacy == 'Public') {
                            Player.onConnect(socket,data.nick,data.char,i);
                            lobbies[i].playersOnLobby++;
                            lobbies[i].matchPlayers = true;
                            socket.emit('defineLobby',i);
                            break;
                        }
                    }
                }
            }
        }
    })

    socket.on('ValidateEnter',function(data) {
        for (var i in lobbies) {
            if (lobbies[i] != undefined && lobbies[i].password == data.pass) {
                var lobby = lobbies[i];
                break;
            }
        }
        if (lobby == undefined) {
            socket.emit('joinCancel',{txt:"This lobby doesn't exist",x:242}); //Send data for error on connection
        }
        else {
            if (lobbies[i].playersOnLobby == lobbies[i].maxPlayers) {
                socket.emit('joinCancel',{txt:"This lobby is full",x:275});
            }
        }
    })

    socket.on('createLobby',function(password,maxPlayers,privacy) { //When lobby creation data is received from client
        if (lobbies.length < 100) {
            if (privacy == 'Public') {
                var lobby = new Lobby(Math.random(),maxPlayers,privacy,lobbies.length);
            }
            else {
                var create = true;
                for (var i in lobbies) {
                    if (lobbies[i].password == password) {
                        create = false;
                    }
                }
                if (create == true) {
                    var lobby = new Lobby(password,maxPlayers,privacy,lobbies.length);
                }
                else {
                    socket.emit('joinCancel',{txt:"This lobby already exist",x:275});
                }
            }
            socket.emit('defineLobby',lobbies.length);
            lobbies.push(lobby);
        }
    })

    socket.on('command',function(cmd,lobbyId) { //When command data is received from client
        var lobby = lobbies[lobbyId];
        var text = "Valid Command: " + "'" + cmd + "'";

        acceptedCommands = { //Search for a valid command
            '/strt9128371'() {
                if (lobby.playersOnLobby > 1) {
                    lobby.lobbyPlaying = true;
                }
                text += ", game started";
            },
            '/pase1746327'() {
                lobby.lobbyPlaying = false;
                text += ", game paused";
            },
            '/pids5372890'() {
                var textIds = '';
                for (var i in lobby.playerList) {
                    textIds += '\n' + i + ', ' + lobby.playerList[i].nickname;
                }
                text += ", ids list returned";
                console.log(textIds);
            },
            '/give6781238'() {
                var players = lobby.playerList
                var type = cmd.substring(13,17); //(Command section that defines the type of give)
                var playerId = cmd.substring(18,36); //(Command section that informs the player's id to give him the "item")
                var giveSpecs = cmd.substring(37,cmd.length); //(Command section that informs what exactly is being given)

                if (type == 'item') {
                    var regex = /[0-9.]{18}[ ][0-9]{1}[ ][A-Za-z]+/g;
                    if (regex.test(playerId+' '+giveSpecs)) {
                        if (players[playerId] != undefined) {
                            var itemName = giveSpecs.substring(2,giveSpecs.length);
                            if (itemsAdd.indexOf(itemName) != -1) {
                                var itemRarity = parseInt(giveSpecs.substring(0,1)); //(Command section that informs rarity)
                                var prof = players[playerId].proficiency[itemsAdd.indexOf(itemName)];
                                var giveItem = new Item(itemName,itemRarity,prof);
                                if (players[playerId].inventory.length < 6) {
                                    players[playerId].inventory.push(giveItem);
                                    players[playerId].organizeInventory();
                                    text += ', ' + playerId + ' got a ' + itemName + ' level ' + itemRarity;
                                }
                            }
                        }
                    }
                }    

                else if (type == 'gold') {
                    if (isNaN(parseFloat(giveSpecs)) == false) {
                        if (lobbies[lobbyId].playerList[playerId] != undefined) {
                            lobbies[lobbyId].playerList[playerId].gold += parseFloat(giveSpecs);
                            text += ', ' + playerId + ' got ' + giveSpecs + ' gold';
                        }
                    }
                }

                else if (type == 'levl') {
                    if (isNaN(parseInt(giveSpecs)) == false && parseInt(giveSpecs) <= 6 && parseInt(giveSpecs) >= 1) {
                        if (lobbies[lobbyId].playerList[playerId] != undefined) {
                            lobbies[lobbyId].playerList[playerId].level = parseInt(giveSpecs);
                            lobbies[lobbyId].playerList[playerId].defineitemsBuy();

                            //Update level and reroll rarities
                            lobbies[lobbyId].playerList[playerId].buy[lobbies[lobbyId].playerList[playerId].buy.length-1].rarity = parseInt(giveSpecs)-1-(parseInt(giveSpecs) == 6);
                            lobbies[lobbyId].playerList[playerId].buy[lobbies[lobbyId].playerList[playerId].buy.length-2].rarity = parseInt(giveSpecs)-1-(parseInt(giveSpecs) == 6);
                            
                            text += ', ' + playerId + ' got to level ' + giveSpecs;
                        }
                    }
                }

                if (text == "Valid Command: " + "'" + cmd + "'") {
                    text = "Invalid Command: " + "'" + cmd + "'";
                }
            },
            '/scne9231457'() {
                var scene = cmd.substring(13,cmd.length);
                var indexScene = scenes.indexOf(scene);
                if (indexScene != -1) {
                    lobby.obstacles = [];
                    lobby.updateScene(indexScene);
                    text += ', change scene to ' + scene;
                }
                else {
                    text = "Invalid Command: " + "'" + cmd + "'";
                }
            },
        }

        executeCmd = acceptedCommands[cmd.substr(0,12)];
        if (executeCmd != undefined) {
            executeCmd();
        }
        else {
            text = "Invalid Command: " + "'" + cmd + "', the command doesn't exist";
        }
    
        console.log(text);
    })

    socket.on('disconnect',function() {
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    })
})

setInterval(function() {
    var lobbiesUsed = []; //Define variable for lobbies being used 
    var placeholder = lobbies[0];
    for (var i in lobbies) {
        if (lobbies[i] != undefined && lobbies[i].playersOnLobby > 0) {
            lobbiesUsed[i] = lobbies[i];
        }
        else {
            if (i >= 50) {
                lobbies[i].closeLobby++;
                if (lobbies[i].closeLobby == 100) {
                    delete lobbies[i];
                }
            }
        }
    }
    for (var i in lobbiesUsed) {
        lobbiesUsed[i].update();
    }
    if (placeholder.playersOnLobby == 0) {
        placeholder.updateObstacles();
    }
    for (var j in SOCKET_LIST) {
        var socket = SOCKET_LIST[j];
        socket.emit('update', placeholder,lobbiesUsed,socket.id);
    }
}, 1000/25)