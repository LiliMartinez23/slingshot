// Creating engine
let engine = Matter.Engine.create();

// Creating a render and attaching it to html body
let render = Matter.Render.create({
    element: document.body,
    engine: engine,
    options: {
        // Adjusts to all screen sizes
        width: innerWidth,
        height: innerHeight,
        wireframes: false
    }
});

// Platform 1
let ground = Matter.Bodies.rectangle( 870, 440, 230, 20, { isStatic: true} );
// Platform 2
let ground2 = Matter.Bodies.rectangle( 875, 200, 120, 20, { isStatic: true } );

// Ball and Sling
let ball = Matter.Bodies.circle( 300, 500, 20, { label: 'playerBall' } );
let sling = Matter.Constraint.create({
    pointA: { x: 300, y: 500 },
    bodyB: ball,
    stiffness: 0.05
});
// # of shots
const MAX_TRIES = 15;
let shotLeft = MAX_TRIES;
const triesCounter = document.getElementById('triesCounter');
function positionTriesCounter() {
    if (!triesCounter) return;
    triesCounter.style.left = (sling.pointA.x - 150) + 'px';
    triesCounter.style.top = (sling.pointA.y - 250) + 'px';
}
function updateTriesCounter() {
    if (!triesCounter) return;
    triesCounter.textContent = `${shotLeft}`;
}
positionTriesCounter();
updateTriesCounter();

// Reset button
document.getElementById('resetBtn')?.addEventListener('click', () => {
    window.location.reload();
});

// Mouse
let mouse = Matter.Mouse.create( render.canvas );
let mouseConstraint = Matter.MouseConstraint.create( engine, {
    mouse: mouse,
    constraint: {
        render: { visible: false }
    }
});
render.mouse = mouse;

// Stack
let stack = Matter.Composites.stack( 800, 270, 4, 4, 0, 0, function( x, y ) {
    return Matter.Bodies.polygon( x, y, 8, 20 );
});
let stack2 = Matter.Composites.stack( 835, 120, 3, 3, 0, 0, function(x, y) {
    return Matter.Bodies.polygon( x, y, 8, 15 );
});

// Firing
let firing = false;
Matter.Events.on( mouseConstraint, 'enddrag', function( e ) {
    if ( e.body === ball && shotLeft > 0 ) {
        firing = true;
        shotLeft--;
        updateTriesCounter();
    }
});
Matter.Events.on( engine, 'afterUpdate', function() {
    if ( firing && shotLeft > 0 && Math.abs( ball.position.x - 300 ) < 20 && Math.abs( ball.position.y - 500 ) < 20 ) {
        ball = Matter.Bodies.circle( 300, 500, 20, { label: 'playerBall' } );
        Matter.World.add( engine.world, ball );
        sling.bodyB = ball;
        firing = false;
    } else if ( firing && shotLeft === 0 ) {
        firing = false;
    }
});

const gb = ground.bounds;
const groundWidth = gb.max.x - gb.min.x;
// Sensor
const sensor = Matter.Bodies.rectangle(
    (gb.min.x + gb.max.x) / 2,
    gb.min.y - 6,
    groundWidth,
    12,
    {
        isStatic: true,
        isSensor: true,
        render: { visible: false }
    }
);
const gb2 = ground2.bounds;
const ground2Width = gb2.max.x - gb2.min.x;
// Sensor
const sensor2 = Matter.Bodies.rectangle(
    (gb2.min.x + gb2.max.x) / 2,
    gb2.min.y - 6,
    ground2Width,
    12,
    {
        isStatic: true,
        isSensor: true,
        render: { visible: false }
    }
);

const sensors = [ sensor, sensor2 ];
function isSensor( body ) {
    return sensors.includes( body );
}

// Tracker
const targetsOn = new Set();
const ballsOn = new Set();
const targetIds = new Set([
    ...stack.bodies.map( b => b.id),
    ...stack2.bodies.map( b => b.id )
]);

function addIfRelevant( body ) {
    if ( targetIds.has( body.id ) ) targetsOn.add( body.id );
    if ( body.label === 'playerBall' ) ballsOn.add( body.id );
}
function removeIfRelevant( body ) {
    if ( targetIds.has( body.id ) ) targetsOn.delete( body.id );
    if ( body.label === 'playerBall' ) ballsOn.delete( body.id );
}

// Listen for collisions
Matter.Events.on( engine, 'collisionStart', ( evt ) => {
    for ( const pair of evt.pairs ) {
        if ( isSensor(pair.bodyA) ) addIfRelevant( pair.bodyB );
        else if ( isSensor(pair.bodyB) ) addIfRelevant( pair.bodyA );
    }
});
Matter.Events.on( engine, 'collisionEnd', ( evt ) => {
    for ( const pair of evt.pairs ) {
        if ( isSensor(pair.bodyA) ) removeIfRelevant( pair.bodyB );
        else if ( isSensor(pair.bodyB) ) removeIfRelevant( pair.bodyA );
    }
});
Matter.Events.on( engine, 'afterUpdate', function seedOnce() {
    Matter.Events.off( engine, 'afterUpdate', seedOnce );
    const targets = [ ...stack.bodies, ...stack2.bodies ];

    for ( const s of sensors ) {
        const inital = Matter.Query.collides( s, targets );
        for ( const p of inital ) {
            const other = p.bodyA === s ? p.bodyB : p.bodyA;
            addIfRelevant( other );
        }
    }
});

let hasWon = false;
let hasLost = false;

// Winner Modal
function showWinnerModal() {
    const modal = document.getElementById( 'winnerModal' );
    if ( !modal ) return;
    engine.timing.timeScale = 0;
    modal.classList.add( 'show' );

    document.getElementById( 'playAgainBtn' )?.addEventListener( 'click', () => {
        window.location.reload();
    });
    document.getElementById( 'newLevelBtn' )?.addEventListener( 'click', () => {
        window.location.href = 'index.html';
    });
    document.getElementById( 'quitBtn' )?.addEventListener( 'click', () => {
        window.location.href = 'index.html';
    });
}
// Loser Modal
function showLostModal() {
    const modal = document.getElementById( 'lostModal' );
    if ( !modal ) return;
    engine.timing.timeScale = 0;
    modal.classList.add( 'show' );

    modal.querySelector( '#playAgainBtnLost' )?.addEventListener( 'click', () => {
        window.location.reload();
    });
    modal.querySelector( '#newLevelBtnLost' )?.addEventListener( 'click', () => {
        window.location.href = 'index.html';
    });
    modal.querySelector( '#quitBtnLost' )?.addEventListener( 'click', () => {
        window.location.href = 'index.html';
    });
}

// Winner / Loser checks
Matter.Events.on( engine, 'afterUpdate', function () {
    if ( !hasWon ) {
        const isPlatformEmpty = targetsOn.size === 0;
        if ( isPlatformEmpty ) {
            hasWon = true;
            showWinnerModal();
            return;
        }
    }

    if ( !hasLost && !hasWon && shotLeft === 0 ) {
        hasLost = true;
        showLostModal();
    }
});

// Website Display
Matter.World.add( engine.world, 
    [ 
        stack, stack2,
        ground, ground2,
        sensor, sensor2,
        ball, sling,
        mouseConstraint
]);
Matter.Engine.run( engine );
Matter.Render.run( render );