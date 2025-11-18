const canvas = document.getElementById('backgroundCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const balls = [
    { x: 100, y: 100, radius: 25, dx: 3, dy: 2, color: 'orange' },
    { x: 300, y: 200, radius: 30, dx: 2, dy: 3, color: 'lightblue' },
    { x: 500, y: 150, radius: 20, dx: 4, dy: 2, color: 'limegreen' },
    { x: 600, y: 300, radius: 50, dx: 6, dy: 3, color: 'red' },
    { x: 200, y: 50, radius: 70, dx: 3, dy: 3, color: 'violet' }
];

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
        
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.dx *= -1;
        }
        if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
            ball.dy *= -1;
        }
    });
    
    requestAnimationFrame(animate);
}

animate();
