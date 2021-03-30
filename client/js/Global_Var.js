var socket = io();

var cnv = document.getElementById('canvas');
var ctx = cnv.getContext('2d'); 
ctx.font = 'bold 24px Monospace';

var clientLobby = undefined;
var clientLobbyId = undefined; //Index of client's lobby
var inputSelected = undefined;
var switchMenuCounter = 0;

var nickname = undefined;
var character = undefined;
var pass = '';
var menuOpened = 'MainMenu';
var options = false;
var errorEnterText = '';
var errorEnterX = 0;
var joinCancelText = '';
var joinCancelX = 0;

var characters = ['Russel','Benny','Kotri','Mirrah','Norman']; //All existing characters

var obstacles = undefined;
var obstaclesImgs = [];
var scenario = new Image();

var music = undefined;
var fade = false;
var musicsPlaying = [];

var songToggle = true;
var audioToggle = true;

var defineItem = { //Define item's srcY img and sound based on information
    Pistol() {
        src1 = 0;
        var values = [src1,pistol_snd];
        return values;
    },
    SubmachineGun() {
        src1 = 100;
        var values = [src1,submachine_snd];
        return values;
    },
    Shotgun() {
        src1 = 50;
        var values = [src1,shotgun_snd];
        return values;
    },
    Sniper() {
        src1 = 150;
        var values = [src1,sniper_snd]
        return values;
    },
    GrenadeLauncher() {
        src1 = 200;
        var values = [src1,grenade_launcher_snd];
        return values;
    },
    Shield() {
        src1 = 250;
        var values = [src1];
        return values;
    },
    levelUp() {
        src1 = 300;
        var values = [src1]
        return values;
    },
    reroll() {
        src1 = 350;
        var values = [src1];
        return values;
    },
}

var clientMouse = {
    x:0,
    y:0,
    clicked:false,
}

var cooldown = 0;

var Img = {} //Bunch of images...
Img.russel = new Image();
Img.russel.src = '/client/img/Russel.png';
Img.mirrah = new Image();
Img.mirrah.src = '/client/img/Mirrah.png';
Img.slots = new Image();
Img.slots.src = '/client/img/weapon_slots.png';
Img.toggle_x = new Image();
Img.toggle_x.src = '/client/img/toggle_x.png';
Img.toggle_y = new Image();
Img.toggle_y.src = '/client/img/toggle_y.png';
Img.gold = new Image();
Img.gold.src = '/client/img/Gold.png';
Img.bulletHud = new Image();
Img.bulletHud.src = '/client/img/Bullet.png';
Img.obstacle = new Image();
Img.russel_icon = new Image();
Img.russel_icon.src = '/client/img/Russel_Icon.png';
Img.benny_icon = new Image();
Img.benny_icon.src = '/client/img/Benny_Icon.png';
Img.kotri_icon = new Image();
Img.kotri_icon.src = '/client/img/Kotri_Icon.png';
Img.mirrah_icon = new Image();
Img.mirrah_icon.src = '/client/img/Mirrah_Icon.png';
Img.norman_icon = new Image();
Img.norman_icon.src = '/client/img/Norman_Icon.png';
Img.locked_icon = new Image();
Img.locked_icon.src = '/client/img/Locked_Icon.png';
Img.songHUD = new Image();
Img.songHUD.src = '/client/img/SongHUD.png';
Img.audioHUD = new Image();
Img.audioHUD.src = '/client/img/AudioHUD.png';