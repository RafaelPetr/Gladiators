document.onkeydown = function(e) {
    var acceptedDownKeys = {
        a() {
            socket.emit('keyPress',{inputId:'left',state:true});
        },
        d() {
            socket.emit('keyPress',{inputId:'right',state:true});
        },
        w() {
            socket.emit('keyPress',{inputId:'up',state:true});
        },
        s() {
            socket.emit('keyPress',{inputId:'down',state:true});
        },
        j() {
            socket.emit('keyPress',{inputId:'aleft',state:true});
        },
        l() {
            socket.emit('keyPress',{inputId:'aright',state:true});
        },
        i() {
            socket.emit('keyPress',{inputId:'aup',state:true});
        },
        k() {
            socket.emit('keyPress',{inputId:'adown',state:true});
        },
        r() {
            socket.emit('keyPress',{inputId:'reload',state:true});
        },
        c() {
            socket.emit('keyPress',{inputId:'combine'});
        },
        u() {
            socket.emit('keyPress',{inputId:'unequip'});
        },
        enter() {
            socket.emit('keyPress',{inputId:'buy_sell'});
        },
        num1() {
            socket.emit('keyPress',{inputId:'itemChange',emUso:1});
        },
        num2() {
            socket.emit('keyPress',{inputId:'itemChange',emUso:2});
        },
        num3() {
            socket.emit('keyPress',{inputId:'itemChange',emUso:3});
        },
        escape() {
            options = !options;
        },
    }

    var key = e.key.toLowerCase();
    if (isNaN(key) == false) {
        key = 'num' + key; //Put num on front to create a string
    }
    if (acceptedDownKeys[key] != undefined) {
        var keyFunction = acceptedDownKeys[key];
        keyFunction();
    }

    if (inputSelected != undefined) {

        if (e.key.length == 1 || e.key == 'Backspace') {
            inputSelected.write(e.key);
        }

    }
    
}
document.onkeyup = function(e) {
    var acceptedUpKeys = {
        a() {
            socket.emit('keyPress',{inputId:'left',state:false});
        },
        d() {
            socket.emit('keyPress',{inputId:'right',state:false});
        },
        w() {
            socket.emit('keyPress',{inputId:'up',state:false});
        },
        s() {
            socket.emit('keyPress',{inputId:'down',state:false});
        },
        j() {
            socket.emit('keyPress',{inputId:'aleft',state:false});
        },
        l() {
            socket.emit('keyPress',{inputId:'aright',state:false});
        },
        i() {
            socket.emit('keyPress',{inputId:'aup',state:false});
        },
        k() {
            socket.emit('keyPress',{inputId:'adown',state:false});
        },
    }

    var key = e.key.toLowerCase();
    if (isNaN(key) == false) {
        key = 'num' + key;
    }
    if (acceptedUpKeys[key] != undefined) {
        var keyFunction = acceptedUpKeys[key];
        keyFunction();
    }
}

cnv.addEventListener('contextmenu', function(evt) {
    if (evt.button == 2) {
        evt.preventDefault();
        var x = evt.pageX-cnv.offsetLeft;
        var y = evt.pageY-cnv.offsetTop;
        socket.emit('addCombine',{x:x,y:y});
    }
}, false);

cnv.onmousedown = function(evt) {
    if (evt.button == 0) {
        var x = evt.pageX-cnv.offsetLeft;
        var y = evt.pageY-cnv.offsetTop;
        socket.emit('mouse',{x:x,y:y});
        clientMouse.x = x;
        clientMouse.y = y;
        clientMouse.clicked = true;
    }
}

cnv.onmouseup = function(evt) {
    var x = evt.pageX-cnv.offsetLeft;
    var y = evt.pageY-cnv.offsetTop;
    clientMouse.x = x;
    clientMouse.y = y;
    clientMouse.clicked = false;
}

cnv.onmousemove = function(evt) {
    var x = evt.pageX-cnv.offsetLeft;
    var y = evt.pageY-cnv.offsetTop;
    socket.emit('mouseMove',{x:x,y:y});
    clientMouse.x = x;
    clientMouse.y = y;
    clientMouse.clicked = false;
}