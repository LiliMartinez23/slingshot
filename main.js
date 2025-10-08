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

// Platform
let ground = Matter.Bodies.rectangle( 870, 440, 230, 20, { isStatic: true} );

// Ball and Sling
let ball = Matter.Bodies.circle( 300, 500, 20 );
let sling = Matter.Constraint.create({
    pointA: { x: 300, y: 500 },
    bodyB: ball,
    stiffness: 0.05
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

// Firing
let firing = false;
Matter.Events.on( mouseConstraint, 'enddrag', function( e ) {
    if ( e.body === ball ) firing = true;
});
Matter.Events.on( engine, 'afterUpdate', function() {
    if ( firing && Math.abs( ball.position.x - 300) < 20 && Math.abs( ball.position.y - 500 ) < 20 ) {
        ball = Matter.Bodies.circle( 300, 500, 20 );
        // Adding new ball after firing
        Matter.World.add( engine.world, ball );
        sling.bodyB = ball;
        firing = false;
    }
});

// Website Display
Matter.World.add( engine.world, [ stack, ground, ball, sling, mouseConstraint ] );
Matter.Engine.run( engine );
Matter.Render.run( render );