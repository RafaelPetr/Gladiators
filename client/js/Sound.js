function Sound(src,loop,volume) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.loop = loop;
    this.sound.style.display = "none";
    this.sound.volume = volume;
    document.body.appendChild(this.sound);
    
    this.play = function() {
        this.currentTime = 0;
        this.sound.play();
    }
    this.stop = function() {
        this.currentTime = 0;
        this.sound.pause();
    }
}

pistol_snd = new Sound('/client/sound/pistol.mp3',false,0.1);
submachine_snd = new Sound('/client/sound/machine.mp3',false,0.3);
shotgun_snd = new Sound('/client/sound/shotgun.wav',false,0.3);
sniper_snd = new Sound('/client/sound/sniper.wav',false,0.3);
grenade_launcher_snd = new Sound('/client/sound/grenade_launcher.wav',false,0.3);
reload = new Sound('/client/sound/reload.wav',false,0.3);
buysell = new Sound('/client/sound/buysell.wav',false,0.3);
swap = new Sound('/client/sound/swap.wav',false,0.3);
combine_snd = new Sound('/client/sound/combine.wav',false,0.3);
explosion_snd = new Sound('/client/sound/explosion.wav',false,0.3);

desert_msc = new Sound('/client/sound/musics/Desert.mp3',true,0.3);
rails_msc = new Sound('/client/sound/musics/Rails.mp3',true,0.3);
beach_msc = new Sound('/client/sound/musics/Beach.mp3',true,0.3);
winter_msc = new Sound('/client/sound/musics/Winter.mp3',true,0.3);

function PlaySound(player,players,phase,scene,sceneChange) {

    if (audioToggle) {
        PlayHUD_snd(player);
        PlaySFX(player); 
        Item_snd(player,players,phase);
    }
    if (songToggle) {
        Play_Music(scene,sceneChange);
    }
    else {
        for (var i in musicsPlaying) {
            musicsPlaying[i].stop();
        }
        musicsPlaying = [];
        music = undefined;
    }

}

function PlayHUD_snd(player) {
    for (var i in player.hudSFX) {
        var acceptedSounds = {
            BuySell() {
                var sound = new Sound('/client/sound/buysell.wav',false,0.3);
                sound.play();
            },
            Swap() {
                var sound = new Sound('/client/sound/swap.wav',false,0.3);
                sound.play();
            },
            Combine() {
                var sound = new Sound('/client/sound/combine.wav',false,0.3);
                sound.play();
            },
        }

        var sfxFunction = acceptedSounds[player.hudSFX[i]];
        sfxFunction();
    }
}

function PlaySFX(player) {
    for (var a = 0; a < player.items.length; a++) {
        if (player.items[a] != null) {
            var cont = 100 - player.items[a].cooldown; //Make a counter based on cooldown
            if (cont == 99) {
                var sound = new Sound('/client/sound/reload.wav',false,0.3);
                sound.play();
            }
        }
    }
}

function Item_snd(player,players,phase) {
    if (phase == 'Buying') {
        Play_snd(player);
    }
    else {
        Play_snd(player);
        for (var a in players) {
            if (players[a].id == player.enemy || (player.ffa == true && players[a].ffa == true)) {
                Play_snd(players[a]);
            }
        }
    }
}

function Play_snd(player) { //Play item's sound
    if (player.explosionSnd == true) {
        var sound = new Sound('/client/sound/explosion.wav',false,0.3);
        sound.play();
        socket.emit('cancelSound');
    }
    if (player.shootsound == true && player.item != undefined) {
        var defineFunction = defineItem[player.item.name]; //Define item being used
        var sound = defineFunction()[1];
        sound.play();
        player.shootsound = false;
    }
}

function Play_Music(scene,musicChange) {

    var acceptedMusic = {
        'Desert'() {
            return new Sound('/client/sound/musics/Desert.mp3',true,0.3);
        },
        'Rails'() {
            return new Sound('/client/sound/musics/Rails.mp3',true,0.3);
        },
        'Beach'() {
            return new Sound('/client/sound/musics/Beach.mp3',true,0.3);
        },
        'Winter'() {
            return new Sound('/client/sound/musics/Winter.mp3',true,0.3);
        },
        'WarRemains'() {
            return new Sound('/client/sound/musics/Desert.mp3',true,0.3);
        },
    }

    if (music == undefined) {
        music = acceptedMusic[scene]();
        if (musicsPlaying.length == 1) {
            music.sound.volume = 0;
        }
        musicsPlaying.push(music);
        music.play();
    }

    if (fade == true) {
        musicsPlaying[0].sound.volume = (musicsPlaying[0].sound.volume*1000-2)/1000;
        musicsPlaying[1].sound.volume = (musicsPlaying[1].sound.volume*1000+2)/1000;

        if (musicsPlaying[0].sound.volume == 0 || musicsPlaying[1].sound.volume == 0.3) {
            fade = false;
            musicsPlaying[0].stop();
            musicsPlaying.shift();
        }
    }

    if (musicChange == true) {
        music = undefined;
        fade = true;
    }
}