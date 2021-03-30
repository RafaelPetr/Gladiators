function inventoryHUDdraw(char) {
    if (char.inventoryHUD == true) {

        Background(630,105,195,240,'black','#424242');

        for (var i = 0; i < char.inventory.length; i++) {
            var item = char.inventory[i];
            
            //Define src x and y
            var srcX = SRC(item.name,item.rarity)[0];
            var srcY = SRC(item.name,item.rarity)[1];
            
            if (item.holding == true) {
                //Draw a red rectangle around the item
                ctx.fillStyle = 'red';
                ctx.fillRect(item.x-5,item.y-5,60,60)
            }
            if (item.combining == true) {
                //Draw a purple rectangle around the item
                ctx.fillStyle = 'purple';
                ctx.fillRect(item.x-5,item.y-5,60,60)
            }

            ctx.drawImage(Img.slots,srcX,srcY,50,50,item.x,item.y,50,50);
        }

        ctx.fillStyle = 'YELLOW'
        if (char.itemBuying != undefined) {
            if (char.itemBuying.item == 'levelUp') { 
                ctx.fillText(char.gold+' - (' + (char.itemBuying.price - char.turns*100) + ')',652,340);
            }
            else {
                ctx.fillText(char.gold+' - (' + char.itemBuying.price +')',652,340);
            }
        }
        else if (char.itemSelling != undefined) {
            ctx.fillText(char.gold+' + (' + char.itemSelling.price/2+')',652,340);
        }
        else {
            ctx.fillText(char.gold,652,340);
        }
        ctx.drawImage(Img.gold,0,0,20,20,630,323,20,20);
    }
}

function buyHUDdraw(char) {
    if (char.buyHUD == true) {
        Background(0,0,360,120,'black','#424242');
        for (var i = 0; i < char.buy.length; i++) {
            var item = char.buy[i];

            var srcX = SRC(item.name,item.rarity)[0];
            var srcY = SRC(item.name,item.rarity)[1];
            
            
            if (item.holding == true) {
                ctx.fillStyle = 'red';
                ctx.fillRect(item.x-5,item.y-5,60,60)
            }

            ctx.drawImage(Img.slots,srcX,srcY,50,50,item.x,item.y,50,50);
        }
    }
}

function itemHUDdraw(char,phase) {
    if (char.itemsHUD == true) {
        if (phase == 'Battle') {
            Background(241,385,300,200,'rgba(0,0,0,0.6)','rgba(68,68,68,0.6)');
        }
        else {
            Background(241,385,300,200,'rgba(0,0,0,1)','rgba(68,68,68,1)');
        }
        
        for (var i = 0; i < char.items.length; i++) {
            if (char.items[i] != null) {
                var item = char.items[i];
                var srcX = SRC(item.name,item.rarity)[0]
                var srcY = SRC(item.name,item.rarity)[1];
                var x = 297+70*i;
                if (char.items[i].cooldown == 0) {
                    if (phase == 'Battle') {
                        if (char.emUso != i+1) {
                            ctx.globalAlpha = 0.2;
                        }
                        else {
                            ctx.globalAlpha = 0.6;
                        }
                    }
                    if (srcX != undefined) {
                        ctx.drawImage(Img.slots,srcX,srcY,50,50,x,450,50,50);
                    }
                    ctx.globalAlpha = 1;
                }
                else {
                    ctx.fillStyle = 'rgba(225,225,225,0.8)';
                    if (phase == 'Battle') {
                        if (char.emUso != i+1) {
                            ctx.globalAlpha = 0.2;
                        }
                        else {
                            ctx.globalAlpha = 0.6;
                        }
                    }
                    ctx.drawImage(Img.slots,srcX,srcY,50,50,x,450,50,50);
                    var cont = 100 - char.items[i].cooldown; //Create a count based on item's cooldown
                    var pos = 454 + cont/2.45; //Define position for rectangle y
                    ctx.fillRect(x+4,pos,42,496-pos); //Draw rectangle with cooldown values
                    
                }
                var pX = 316+70*i;
                if (char.emUso == i+1) {
                    ctx.fillStyle = 'red';
                }
                else {
                    ctx.fillStyle = 'black';
                }
                ctx.fillText(i+1,pX,447);
            }
            
        }
    }
}

function playersHUD(char,players) {
    if (char.playersHUD == true) {
        for (var i = 0; i < players.length; i++) {
            Background(0,0+60*i,130,45,'black','#424242');
        }
        for (var a = 0; a < players.length; a++) {
            var life_posY = 60*a+25;
            ctx.fillStyle = 'black'
            var nickname = players[a].nickname;
            if (nickname.length > 9) {
                nickname = nickname.substr(0,7)+'...'; //Abreviate nickname
            }
            ctx.fillText(nickname,12,life_posY-5);
            ctx.fillStyle = 'red';
            ctx.fillRect(15,life_posY,players[a].life*10/3,10);
        }
    }
}

function valuesDraw(player) {
    ctx.fillStyle = 'black';
    var items = ['Pistol','SubmachineGun','Shotgun','Sniper','GrenadeLauncher']
    if (player.item != undefined) {
        var ammo = player.item.ammo+'/'+player.spareAmmos[items.indexOf(player.item.name)] //Define ammo/spareammos relation
        ctx.fillText(ammo,5,490);
        ctx.globalAlpha = 1/(player.item.cooldown/10); //Make opacity based on item cooldown
        ctx.drawImage(Img.bulletHud,0,0,11,25,5+12*ammo.length,470,11,25);
        ctx.globalAlpha = 1;
    }
    
    ctx.fillStyle = 'black';
    ctx.fillText(clientLobby.time,750,20);
}

function SRC(item,rarity) {
    var src = [];
    src[0] = rarity*50; //Define srcX for img (rarity)

    defineFunction = defineItem[item]; //Define srcY for img (type of item)
    src[1] = defineFunction()[0];

    return src;
}

function Toggle(x,y,movX,movY,axis,st,place) {
    this.x = x;
    this.y = y;
    this.movX = movX;
    this.movY = movY;
    this.srcX = 0;
    this.srcY = 0;
    this.axis = axis;
    this.place = place;
    this.st = st;
    this.color = 'black';

    if (this.axis == 'x') { //If it is vertical
       this.width = 35;
       this.height = 80;
       this.img = Img.toggle_x;
    }
    else { //If it is horizontal
        this.width = 80;
        this.height = 35;
        this.img = Img.toggle_y;
    }

    this.over = function() { //Define srcX for mouse above or away from toggle
        if (clientMouse.x > this.x && clientMouse.x < this.x+this.width &&
            clientMouse.y > this.y && clientMouse.y < this.y+this.height) {
                this.srcX = this.width;
            }

        else {
            this.srcX = 0; //Keep srcX on 0
        }
    }

    this.click = function() { //When client clicks on toggle
        this.srcY = 0 + !this.st*this.height; //Define srcY from its state (activated or deactivated)
        if (clientMouse.clicked == true) {
            if (clientMouse.x > this.x && clientMouse.x < this.x+this.width &&
                clientMouse.y > this.y && clientMouse.y < this.y+this.height) {

                    
                    var acceptedPlaces = {
                        'inventory'(toggle) {
                            socket.emit('hud',{place:'inv',state:toggle.st});
                        },
                        'buy'(toggle) {
                            socket.emit('hud',{place:'buy',state:toggle.st});
                        },
                        'items'(toggle) {
                            socket.emit('hud',{place:'items',state:!toggle.st});
                        },
                        'players'(toggle) {
                            socket.emit('hud',{place:'players',state:!toggle.st});
                        },
                    }

                    var placeFunction = acceptedPlaces[this.place];
                    if (placeFunction != undefined) {
                        placeFunction(this);
                    }

                    this.x += this.movX;
                    this.y += this.movY;
                    this.movX = -this.movX;
                    this.movY = -this.movY;
                    this.st = !this.st;


                }
        }
        
    };

    this.draw = function(phase) {
        if (phase == 'Battle') {
            ctx.globalAlpha = 0.4;
        }

        ctx.drawImage(this.img,this.srcX,this.srcY,this.width,this.height,this.x,this.y,this.width,this.height);
        ctx.globalAlpha = 1;
    };

    this.update = function(phase) {
        this.over();
        this.click();
        this.draw(phase);
    }
}


function HUDdraw(player,players,phase) {
    ctx.font = 'bold 20px Monospace'
    optionsHUDdraw();
    itemHUDdraw(player,phase);
    if (phase == 'Buying') {
        playersHUD(player,players);
        inventoryHUDdraw(player);
        buyHUDdraw(player);
        for (var i = 0; i < toggles.length-1; i++) {
            toggles[i].update(phase);
        } 
    }
    valuesDraw(player);
        
    for (var i = 3; i < toggles.length; i++) {
        toggles[i].update(phase);
    } 
    ctx.drawImage(Img.audioHUD,0+32*!audioToggle,0,32,32,650,10,32,32);
    ctx.drawImage(Img.songHUD,0+21*!songToggle,0,21,28,700,10,21,28);
    if (clientMouse.clicked == true) {
        if (clientMouse.x > 650 && clientMouse.x < 682) {
            if (clientMouse.y > 10 && clientMouse.y < 42) {
                audioToggle = !audioToggle;
                clientMouse.clicked = false;
            }
        }
        if (clientMouse.x > 700 && clientMouse.x < 721) {
            if (clientMouse.y > 10 && clientMouse.y < 38) {
                songToggle = !songToggle;
                clientMouse.clicked = false;
            }
        }
    }
    ctx.font = 'bold 24px Monospace'
}

function optionsHUDdraw() {
    if (options == true) {
        Background(300,400,200,200,'black','#424242')
        for (var i in optionsButtons) {
            optionsButtons[i].update();
        }
    }
}

var toggleInventory = new Toggle(770,180,-145,0,'x',true,'inventory');
var toggleBuy = new Toggle(140,-5,0,95,'y',true,'buy');
var toggleItems = new Toggle(351,470,0,-90,'y',false,'items');
var togglePlayers = new Toggle(-5,180,140,0,'x',false,'players');

var toggles = [toggleInventory,toggleBuy,togglePlayers,toggleItems];
var scenes = ['Desert','Rails','Winter','Beach']; //All existing scenes