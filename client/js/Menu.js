
var JoinLobby = function() {

    if (privateSwitcherJ.value == 'Public') {
        pass = '';
        menuOpened = 'EnterLobbyForm';
    }

    else {
        if (password_input_J.value != '') {
            pass = password_input_J.value;
            menuOpened = 'EnterLobbyForm';;
            socket.emit('ValidateEnter',{pass});
        }
    }
    
}

var Enter = function() {
    if (nickname_input.value != '') {
        if (character != undefined) {
            socket.emit('entrar',{nick:nickname_input.value,char:character,password:pass,id:clientLobbyId});
        }
        else {
            errorEnterText = "Choose a character";
            errorEnterX = 285;
        }
    }
    else {
        errorEnterText = "Write a nickname";
        errorEnterX = 295;
    }
}

var JoinForm = function() {
    menuOpened = 'JoinLobbyForm';
}

var CreateForm = function() {
    menuOpened = 'CreateLobbyForm';
}

var Return = function() {
    menuOpened = 'MainMenu';
}

var ValueSwitch = function(parameters) {

    if (parameters[0] != undefined) {
        parameters[0].updateIndex();
    }

    if (parameters[1] != undefined) {
        parameters[1].locked = !parameters[1].locked;
        parameters[1].value = '';
    }
    
}

var CreateLobby = function() {
    pass = password_input_C.value;
    var maxPlayers = playersMax_input.value;
    var privacy = privateSwitcherC.value;
    if (privacy == 'Public') {
        if (maxPlayers != "") {
            socket.emit('createLobby',pass,maxPlayers,privacy); //Send password to server to create a lobby
            menuOpened = 'EnterLobbyForm';
        }
    }
    else {
        if (maxPlayers != "" && pass != "" && pass != password_input_C.placeholder) {
            socket.emit('createLobby',pass,maxPlayers,privacy); //Send password to server to create a lobby
            menuOpened = 'EnterLobbyForm';
        }
    }
}

var Character = function(charName) { //Defines client's character
    character = charName;
    for (var i = 0; i < buttonsEnter.length; i++) {
        if (buttonsEnter[i].value == charName) {
            buttonsEnter[i].opacity = 1.0;
        }
        else {
            buttonsEnter[i].opacity = 0.5;
        }
    }
}

var CloseOptions = function() {
    options = false;
}

function InputField(x,y,width,maxChars,placeholder,type) {
    this.x = x;
    this.y = y;

    this.width = width;
    this.height = 30;

    this.placeholder = placeholder

    this.value = '';
    this.valueShow = ''; //Abbreviation for value
    this.type = type;

    this.maxChars = maxChars;
    this.maxCharsShow = Math.round(this.width/14);
    this.selected = false;
    this.writeIndicator = true; //(Don't) Show the write indicator
    this.writeIndicatorCounter = 0; //Counter to "animate" the write indicator

    this.locked = false;

    this.update = function() {
        this.click();
        this.draw();

        if (inputSelected == this) {
            this.selected = true;
        }
        else {
            this.selected = false;
        }
    }

    this.click = function() {
        if (clientMouse.clicked == true) {
            if (clientMouse.x > this.x && clientMouse.x < this.x + this.width &&
                clientMouse.y > this.y && clientMouse.y < this.y + this.height) {
                clientMouse.clicked = false;
                inputSelected = this;
            }
            else {
                inputSelected = undefined;
            }
        }
    };

    this.draw = function() {
        this.drawInputBox();
        this.drawWriteIndicator();
        this.drawValue();
    };

    this.drawInputBox = function() {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x-5, this.y-5, this.width+10, this.height+10);
        if (this.selected == false) {
            ctx.fillStyle = 'gray';
        }
        else {
            ctx.fillStyle = 'lightgray';
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
    };

    this.drawWriteIndicator = function() {
        if (this.selected == true) {
            this.writeIndicatorCounter++;
            if (this.writeIndicatorCounter == 20) {
                this.writeIndicatorCounter = 0;
                this.writeIndicator = !this.writeIndicator;
            }

            if (this.writeIndicator) {
                ctx.fillStyle = 'black';
                ctx.fillRect(this.x+5+13.25*this.valueShow.length,this.y+5,5,this.height-10)
            }    
        }
    };

    this.drawValue = function() {
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Monospace';
        if (this.valueShow.length == 0 && this.selected == false) {
            var val = this.placeholder;
        }
        else {
            if (this.type == 'password') {
                var val = '*'.repeat(this.valueShow.length);
            }
            else {
                var val = this.valueShow;
            }
        }
        ctx.fillText(val,this.x+5,this.y+22);
    };

    this.write = function(char) {

        if (char == 'Backspace') {
            this.value = this.value.slice(0,-1);
        }
        else {
            if (this.value.length+1 <= this.maxChars) {
                this.value += char;
                if (isNaN(char) == true && this.type == 'number') {
                    this.value = this.value.slice(0,-1);
                }
            }
        }
        this.valueShow = this.value.substring(this.value.length-this.maxCharsShow,this.value.length);

        this.writeIndicatorCounter = 0;
        this.writeIndicator = true;

    }
}

//Join menu Inputs
var password_input_J = new InputField(275,205,252,Infinity,'Write the password','password');
password_input_J.locked = true;
var inputsJoin = [password_input_J]; //Joining lobby

//Create menu Inputs
var playersMax_input = new InputField(490,175,24,1,'','number');
var password_input_C = new InputField(275,233,252,Infinity,'Write the password','password');
password_input_C.locked = true;
var inputsCreate = [playersMax_input,password_input_C]; //Creating Lobby

//Enter Lobby menu Inputs
var nickname_input = new InputField(266,80,266,Infinity,'Write your nickname');
var inputsEnter = [nickname_input]; //Entering lobby

function InputSlider(x,y) {
    this.x = x;
    this.y = y;

    this.width = 80;
    this.height = 10;
    this.sliderX = this.x+(this.width/2)-10;
    this.sliderY = this.y+(this.height/2)-10;
    this.sliderWidth = 20;
    this.sliderHeight = 20;

    this.update = function() {
        this.draw();
    }

    this.draw = function() {
        this.drawBar();
        this.drawSlider();
    };

    this.drawBar = function() {
        Background(this.x,this.y,this.width,this.height,'black','gray');
    }

    this.drawSlider = function() {
        Background(this.sliderX,this.sliderY,this.sliderWidth,this.sliderHeight,'black','gray');
    }
}

var inputSlider1 = new InputSlider(280,210);

function ValueSwitcher(x,y,values) {
    this.x = x;
    this.y = y;

    this.vIndex = 0;
    this.values = values;
    this.value = this.values[0];

    this.update = function() {
        this.draw();
    };

    this.draw = function() {
        ctx.fillText(this.value,this.x,this.y);
    };

    this.updateIndex = function() {
        this.vIndex++;
        if (this.vIndex == this.values.length) {
            this.vIndex = 0;
        }
        this.value = this.values[this.vIndex];
    }
}

//Join Lobby Form Switchers
var privateSwitcherJ = new ValueSwitcher(450,167,['Public','Private']);
var switchersJoin = [privateSwitcherJ];

//Create Lobby Form Switchers
var privateSwitcherC = new ValueSwitcher(450,142,['Public','Private']);
var switchersCreate = [privateSwitcherC];

function GameButton(x,y,width,height,img,text,func,parameters) {
    this.x = x;
    this.y = y;

    this.text = text;
    this.width = width;
    this.height = height;

    this.img = img;
    this.selected = false;
    this.function = func;
    this.value = parameters[0];
    this.parameters = parameters;
    this.opacity = 0.5;
    this.locked = false;

    this.update = function() {
        this.click();
        this.draw();
    }

    this.click = function() {
        this.selected = false;
        if (clientMouse.clicked == true) {
            if (clientMouse.x > this.x && clientMouse.x < this.x + this.width &&
            clientMouse.y > this.y && clientMouse.y < this.y + this.height) {
                this.function(this.parameters);
                this.selected = true;
                clientMouse.clicked = false;
            }
        }
    };

    this.draw = function() {
        this.drawButton();
        if (this.text != '') {
            this.drawText();
        }
    };

    this.drawButton = function() {
        ctx.fillStyle = 'black';

        if (this.img == undefined) {
            ctx.fillRect(this.x-5, this.y-5, this.width+10, this.height+10);
            if (this.selected == false) {
                ctx.fillStyle = 'gray';
            }
            else {
                ctx.fillStyle = 'lightgray';
            }
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        else {
            ctx.globalAlpha = this.opacity;
            ctx.fillRect(this.x-5, this.y-5, this.width+10, this.height+10);
            ctx.drawImage(this.img,0,0,this.width,this.height,this.x,this.y,this.width,this.height);
            ctx.globalAlpha = 1.0;
        }
    };

    this.drawText = function() {
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Monospace';
        ctx.fillText(this.text,this.x+5,this.y+22);
    };
}

//Main menu Buttons
var joinForm_button = new GameButton(230,450,145,30,undefined,'Join Lobby',JoinForm,['']);
var createLobbyForm_button = new GameButton(400,450,170,30,undefined,'Create Lobby',CreateForm,['']);
var buttonsMainMenu = [joinForm_button,createLobbyForm_button]

//Join Lobby Form Buttons
var privateJ_button = new GameButton(275,145,165,30,undefined,'Set Privacy:',ValueSwitch,[privateSwitcherJ,password_input_J]);
var join_button = new GameButton(363,265,65,30,undefined,'Join',JoinLobby,['']);
var returnJ_button = new GameButton(350,325,90,30,undefined,'Return',Return,['']);
var buttonsJoin = [privateJ_button,join_button,returnJ_button];

//Create Lobby Form Buttons
var privateC_button = new GameButton(275,120,165,30,undefined,'Set Privacy:',ValueSwitch,[privateSwitcherC,password_input_C]);
var create_button = new GameButton(350,290,90,30,undefined,'Create',CreateLobby,['']);
var returnC_button = new GameButton(350,350,90,30,undefined,'Return',Return,['']);
var buttonsCreate = [privateC_button,create_button,returnC_button];

//Enter lobby menu Buttons
var russelIcon_button = new GameButton(260,140,50,51,Img.russel_icon,'',Character,['Russel']);
var bennyIcon_button = new GameButton(335,140,50,51,Img.benny_icon,'',Character,['Benny']);
var kotriIcon_button = new GameButton(410,140,50,51,Img.kotri_icon,'',Character,['Kotri']);
var mirrahIcon_button = new GameButton(485,140,50,51,Img.mirrah_icon,'',Character,['Mirrah']);
var normanIcon_button = new GameButton(260,220,50,51,Img.norman_icon,'',Character,['Norman']);
var locked1_button = new GameButton(335,220,50,51,Img.locked_icon,'',Character,[undefined]);
var locked2_button = new GameButton(410,220,50,51,Img.locked_icon,'',Character,[undefined]);
var locked3_button = new GameButton(485,220,50,51,Img.locked_icon,'',Character,[undefined]);
var Enter_button = new GameButton(361,330,78,30,undefined,'Enter',Enter,['']);
var returnE_button = new GameButton(355,390,90,30,undefined,'Return',Return,['']);
var buttonsEnter = [russelIcon_button,bennyIcon_button,kotriIcon_button,mirrahIcon_button,normanIcon_button,
    locked1_button,locked2_button,locked3_button,
    Enter_button,returnE_button]

//Join Cancel lobby menu Buttons
var returnJC_button = new GameButton(355,265,90,30,undefined,'Return',Return,['']);
var buttonsJoinCancel = [returnJC_button]

//Options HUD Buttons
var audioOptions = new GameButton(355,265,90,30,undefined,'Audio',CloseOptions,['']);
var optionsButtons = [audioOptions];

function MenuDraw() {
    var acceptedMenus = {
        'MainMenu'() {
            for (var i = 0; i < buttonsMainMenu.length; i++) {
                buttonsMainMenu[i].update();
            }
        },
        'JoinLobbyForm'() {
            Background(205,120,390,260,'black','#343434');

            for (var i = 0; i < inputsJoin.length; i++) {
                if (inputsJoin[i].locked == false) {
                    inputsJoin[i].update();
                }
            }
    
            for (var i = 0; i < buttonsJoin.length; i++) {
                if (buttonsJoin[i].locked == false) {
                    buttonsJoin[i].update();
                }
            }

            for (var i = 0; i < switchersJoin.length; i++) {
                switchersJoin[i].update();
            }
        },
        'CreateLobbyForm'() {
            Background(205,95,390,310,'black','#343434');

            for (var i = 0; i < inputsCreate.length; i++) {
                if (inputsCreate[i].locked == false) {
                    inputsCreate[i].update();
                }
            }
    
            for (var i = 0; i < buttonsCreate.length; i++) {
                buttonsCreate[i].update();
            }

            for (var i = 0; i < switchersCreate.length; i++) {
                switchersCreate[i].update();
            }
            
            ctx.fillText('Player capacity:',270,197);
        },
        'EnterLobbyForm'() {
            Background(230,55,340,390,'black','#343434');
            for (var i = 0; i < inputsEnter.length; i++) {
                inputsEnter[i].update();
            }
            for (var i = 0; i < buttonsEnter.length; i++) {
                buttonsEnter[i].update();
            }
            ctx.fillStyle = 'red';
            ctx.fillText(errorEnterText,errorEnterX,307)
            ctx.fillStyle = 'black';
        },
        'CancelJoin'() {
            Background(230,205,340,110,'black','#343434');
            for (var i = 0; i < buttonsJoinCancel.length; i++) {
                buttonsJoinCancel[i].update();
            }
            ctx.fillStyle = 'red';
            ctx.fillText(joinCancelText,joinCancelX,240)
            ctx.fillStyle = 'black';
        },
        'DefeatScreen'() {
            switchMenuCounter++;
            if (switchMenuCounter == 150) {
                switchMenuCounter = 0;
                menuOpened = 'MainMenu';
            }
            Background(330,210,151,50,'black','#343434');
            ctx.font = 'bold 40px Monospace';
            ctx.fillText('Defeat',340,247);
        },
        'VictoryScreen'() {
            switchMenuCounter++;
            if (switchMenuCounter == 150) {
                switchMenuCounter = 0;
                menuOpened = 'MainMenu';
            }
            Background(310,210,172,50,'black','#343434');
            ctx.font = 'bold 40px Monospace';
            ctx.fillText('Victory',320,247);
            ctx.font = 'bold 24px Monospace';
        },
    } 


    var drawMenu = acceptedMenus[menuOpened];
    if (drawMenu != undefined) {
        drawMenu();
    }
}

function Background(x,y,width,height,borderColor,color) {
    ctx.fillStyle = borderColor;
    ctx.fillRect(x-5,y-5,width+10,height+10);
    ctx.fillStyle = color;
    ctx.fillRect(x,y,width,height);
    ctx.fillStyle = 'black';
}