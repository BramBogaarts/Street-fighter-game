const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

canvas.width = window.innerWidth
canvas.height = window.innerHeight

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
})

c.fillRect(0, 0, canvas.width, canvas.height)

const gravity = 0.7

const groundLevel = canvas.height - 300

const chosenChar = localStorage.getItem('character') || 'mn'
const chosenMap  = localStorage.getItem('map') || 'map1'

const background = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    imageSrc: chosenMap === 'map1' ? './img/map.png' : './img/map2.png'
})

// Geluidseffecten
const hitSound = new Howl({
    src: ['./sounds/hit.mp3'],
    volume: 0.8
})

const backgroundMusic = new Howl({
    src: ['./sounds/background-music.mp3'],
    volume: 0.4,
    loop: true
})

const player = new Fighter({
    position: {
        x: 0,
        y: canvas.height - 300
    },
    velocity: {
        x: 0,
        y: 0
    },
    offset: {
        x: -10,
        y: 0
    },
    imageSrc: chosenChar === 'mn' ? './img/macho-nacho.svg' : './img/evil-nacho.svg',
    width: 150,
    height: 300
})

const enemy = new Fighter({
    position: {
        x: canvas.width - 150,
        y: canvas.height - 300
    },
    velocity: {
        x: 0,
        y: 0
    },
    offset: {
        x: 10,
        y: 0
    },
    imageSrc: chosenChar === 'mn' ? './img/evil-nacho.svg' : './img/macho-nacho.svg',
    width: 150,
    height: 300
})

console.log(player)

const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowLeft: {
        pressed: false
    }
}

let lastKey

function rectangularCollision({rectangle1, rectangle2}) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= 
        rectangle2.position.x &&
        rectangle1.attackBox.position.x <=
        rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >=
        rectangle2.position.y && 
        rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height &&
        rectangle1.isAttacking
    )
}

function determineWinner({player, enemy, timerId}) {
    clearTimeout(timerId)
    gameOver = true
    backgroundMusic.stop()

    const tieEl = document.querySelector('.tie')
    tieEl.style.display = 'flex'

    if(player.health === enemy.health) {
        tieEl.innerHTML = 'Tie'
    } else if (player.health > enemy.health) {
        tieEl.innerHTML = 'Player 1 wins'
    } else if (player.health < enemy.health) {
        tieEl.innerHTML = 'Player 2 wins'
    }
}

let timer = 60
let timerId
let gameOver = false

function decreaseTimer() {
    if (timer > 0) {
        timerId = setTimeout(decreaseTimer, 1000)
        timer--
        document.querySelector('.timer').innerHTML = timer
    }

    if (timer === 0) {
        determineWinner({player, enemy, timerId})
    }
}

decreaseTimer()

// Muziek starten zodra de game pagina geladen is
window.addEventListener('load', () => {
    Howler.ctx.resume()
    backgroundMusic.play()
})

// PS5 DualSense controller support
// Gamepad object eigenschappen:
//   id        → naam/merk van de controller (tekst)
//   index     → uniek nummer per controller (0, 1, 2, 3...)
//   connected → true als controller verbonden is
//   timestamp → DOMHighResTimeStamp - tijdstip van laatste update (ms sinds pagina geladen)
//   mapping   → "standard" = W3C standaard layout, "" = aangepaste layout
//   axes      → joystick posities: X-as (-1 = links, 1 = rechts), Y-as (-1 = omhoog, 1 = omlaag)
//   buttons   → array van GamepadButton objecten { pressed, touched, value }
//
// Button object eigenschappen:
//   pressed → true als knop volledig ingedrukt is
//   touched → true als knop wordt aangeraakt (drukgevoelige knoppen)
//   value   → getal 0 t/m 1: hoe hard de knop ingedrukt is (handig voor triggers LT/RT)
//
// Button layout PS5 DualSense:
//   0 = Cross (×)    → aanvallen
//   2 = Square (□)   → springen
//   14 = D-pad links
//   15 = D-pad rechts

// Gamepadconnected event: luistert naar het moment dat een controller wordt aangesloten
// event.gamepad geeft toegang tot het gamepad object van de aangesloten controller
window.addEventListener("gamepadconnected", (event) => {
    console.log("Gamepad verbonden!")
    console.log("ID:", event.gamepad.id)
    console.log("Index:", event.gamepad.index)
    console.log("Aantal knoppen:", event.gamepad.buttons.length)
    console.log("Aantal assen:", event.gamepad.axes.length)
})

// Polling loop: wordt elke frame aangeroepen vanuit animate()
// Minimaal nodig: getGamepads() + staat checken + herhalen via requestAnimationFrame
function handleGamepads() {
    // Haal alle aangesloten controllers op
    const gamepads = navigator.getGamepads()

    // --- Speler 1 (gamepad 0) ---
    // Controleer of de controller daadwerkelijk bestaat
    const gp1 = gamepads[0]
    if (gp1) {
        // axes[0] = X-as linker stick: -1 (links) tot 1 (rechts)
        const axisX1 = gp1.axes[0]
        // buttons[14].pressed → true als D-pad links ingedrukt is
        const dpadLeft1  = gp1.buttons[14]?.pressed
        const dpadRight1 = gp1.buttons[15]?.pressed

        // Bewegen via linker stick (deadzone 0.3 om drift te voorkomen) OF d-pad
        if (axisX1 < -0.3 || dpadLeft1) {
            player.velocity.x = -5
            player.lastKey = 'a'
        } else if (axisX1 > 0.3 || dpadRight1) {
            player.velocity.x = 5
            player.lastKey = 'd'
        }

        // kruisje  = springen — pressed: true als knop volledig ingedrukt
        // _jumpPressed voorkomt dat springen blijft triggeren zolang knop ingedrukt is
        if (gp1.buttons[1].pressed && !gp1._jumpPressed) {
            player.velocity.y = -20
            Howler.ctx.resume()
        }
        gp1._jumpPressed = gp1.buttons[1].pressed

        // vierkant = aanvallen
        // _attackPressed voorkomt dat aanvallen blijft triggeren zolang knop ingedrukt is
        if (gp1.buttons[0].pressed && !gp1._attackPressed) {
            player.attack()
            Howler.ctx.resume()
        }
        gp1._attackPressed = gp1.buttons[0].pressed
    }

    // --- Speler 2 (gamepad 1) ---
    const gp2 = gamepads[1]
    if (gp2) {
        // axes[0] = X-as linker stick: -1 (links) tot 1 (rechts)
        const axisX2 = gp2.axes[0]
        const dpadLeft2  = gp2.buttons[14]?.pressed
        const dpadRight2 = gp2.buttons[15]?.pressed

        // Bewegen via linker stick OF d-pad
        if (axisX2 < -0.3 || dpadLeft2) {
            enemy.velocity.x = -5
            enemy.lastKey = 'ArrowLeft'
        } else if (axisX2 > 0.3 || dpadRight2) {
            enemy.velocity.x = 5
            enemy.lastKey = 'ArrowRight'
        }

        // kruisje = springen
        if (gp2.buttons[1].pressed && !gp2._jumpPressed) {
            enemy.velocity.y = -20
        }
        gp2._jumpPressed = gp2.buttons[1].pressed

        // vierkant = aanvallen
        if (gp2.buttons[0].pressed && !gp2._attackPressed) {
            enemy.attack()
        }
        gp2._attackPressed = gp2.buttons[0].pressed
    }
}

function animate() {
    window.requestAnimationFrame(animate)
    c.fillStyle = 'black'
    c.fillRect(0, 0, canvas.width, canvas.height)
    background.update()
    player.update()
    enemy.update()

    player.velocity.x = 0
    enemy.velocity.x = 0

    // Controller input verwerken
    handleGamepads()
    
    // player (keyboard)
    if (keys.a.pressed && player.lastKey === 'a') {
        player.velocity.x = -5
    } else if (keys.d.pressed && player.lastKey === 'd') {
        player.velocity.x = 5
    }

    // enemy (keyboard)
    if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
        enemy.velocity.x = -5
    } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
        enemy.velocity.x = 5
    }

    // zoekt voor aanraking
    if (
        rectangularCollision({
            rectangle1: player,
            rectangle2: enemy
        }) &&
        !gameOver
    ) {
        player.isAttacking = false
        enemy.health -= 20
        document.querySelector('.enemy2').style.width = enemy.health + '%'
        hitSound.play()
        console.log('Player hit enemy!');
    }

    if (
        rectangularCollision({
            rectangle1: enemy,
            rectangle2: player
        }) &&
        enemy.isAttacking &&
        !gameOver
    ) {
        enemy.isAttacking = false
        player.health -= 20
        document.querySelector('.player2').style.width = player.health + '%'
        hitSound.play()
        console.log('enemy hit player');
    }

    if ((enemy.health <= 0 || player.health <= 0) && !gameOver) {
        determineWinner({player, enemy, timerId})
    }
} 
       
animate()

window.addEventListener('keydown', (event) => {
    if (gameOver) return

    switch (event.key) {
        case 'd':
            keys.d.pressed = true
            player.lastKey = 'd' 
            break
        case 'a':
            keys.a.pressed = true
            player.lastKey = 'a' 
            break
        case 'w':
            player.velocity.y = -20
            break
        case ' ':
            player.attack()
            break
        case 'ArrowRight':
            keys.ArrowRight.pressed = true
            enemy.lastKey = 'ArrowRight'
            break
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = true
            enemy.lastKey = 'ArrowLeft'
            break
        case 'ArrowUp':
            enemy.velocity.y = -20
            break
        case 'Enter':
            enemy.attack()
            break
    }
    console.log(event.key);
})

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = false
            break
        case 'a':
            keys.a.pressed = false
            break
        case 'ArrowRight':
            keys.ArrowRight.pressed = false
            break
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false
            break
    }
    console.log(event.key)
})