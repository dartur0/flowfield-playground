let rows, cols;
let gridSize = 15;
let xOffset = 0;
let yOffset = 0;
let hueOffset = 0;
let zOffset = 0;
let maxSpeed = 4;
let noiseScale = 0.08;
let flowfield = [];
let particles = [];
let blobs = [];
let numParticles = 1200;

let displayMode = 'particles';

const themes = {
    aurora:   { hue: 200, hueSpread: 70, sat: 55, bright: 92, bgHue: 240, bgSat: 30, bgBright: 6 },
    sunset:   { hue: 50,  hueSpread: 15, sat: 80, bright: 96, bgHue: 20,  bgSat: 32, bgBright: 7 },
    graphite: { hue: 210, hueSpread: 15, sat: 10, bright: 92, bgHue: 220, bgSat: 10, bgBright: 6 }
};

let currentTheme = themes.aurora;

function wrapHue(h) {
    return ((h % 360) + 360) % 360;
}

class FluidBlob {
    constructor(x, y, r) {
        this.pos = createVector(x || random(width), y || random(height));
        this.targetPos = this.pos.copy();
        this.vel = createVector(0, 0);
        this.radius = r || random(70, 150);
        this.hueSeed = random(-1, 1); 
        this.noiseSeed = random(1000);
        this.deformSpeed = random(0.003, 0.008);
        this.burst = createVector(0, 0); 
    }

    update() {
        let nX = noise(this.noiseSeed + zOffset * 0.5) - 0.5;
        let nY = noise(this.noiseSeed + 500 + zOffset * 0.5) - 0.5;
        let drift = createVector(nX, nY).mult(1.5);
        this.vel.add(drift);

        let mouse = createVector(mouseX, mouseY);
        let d = p5.Vector.dist(this.pos, mouse);

        if (d < 250) {
            if (mouseIsPressed) {
                let pull = p5.Vector.sub(mouse, this.pos).mult(0.02);
                this.vel.add(pull);
            } else {
                let push = p5.Vector.sub(this.pos, mouse).normalize().mult((250 - d) * 0.03);
                this.vel.add(push);
            }
        }

        this.vel.mult(0.95);
        this.pos.add(this.vel);
        this.pos.add(this.burst);
        this.burst.mult(0.85);

        if (this.pos.x < -100) this.pos.x = width + 100;
        if (this.pos.x > width + 100) this.pos.x = -100;
        if (this.pos.y < -100) this.pos.y = height + 100;
        if (this.pos.y > height + 100) this.pos.y = -100;
    }

    show() {
        noStroke();
        let h = wrapHue(currentTheme.hue + this.hueSeed * currentTheme.hueSpread + hueOffset);

        let layers = 12;
        for (let i = layers; i > 0; i--) {
            let rFraction = i / layers;
            let currentR = this.radius * rFraction;
            let alpha = map(i, 1, layers, 0.8, 12);

            fill(h, currentTheme.sat, currentTheme.bright, alpha);

            beginShape();
            let steps = 30;
            for (let a = 0; a < TWO_PI; a += TWO_PI / steps) {
                let xoff = map(cos(a), -1, 1, 0, 1.5) + this.noiseSeed;
                let yoff = map(sin(a), -1, 1, 0, 1.5) + zOffset * this.deformSpeed * 100;
                let offset = map(noise(xoff, yoff), 0, 1, -this.radius * 0.2, this.radius * 0.2);

                let rDynamic = currentR + offset * rFraction;
                let x = this.pos.x + rDynamic * cos(a);
                let y = this.pos.y + rDynamic * sin(a);
                curveVertex(x, y);
            }
            endShape(CLOSE);
        }
    }
}

class Particle {
    constructor() {
        this.pos = createVector(random(width), random(height));
        this.prevPos = this.pos.copy();
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);

        this.weight = random(0.8, 2.2);
        this.speedMult = random(0.7, 1.3);
        this.alpha = random(35, 80);
        this.angle = 0;
        this.burst = createVector(0, 0); 
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(maxSpeed * this.speedMult);

        this.prevPos = this.pos.copy();
        this.pos.add(this.vel);
        this.pos.add(this.burst);
        this.burst.mult(0.85); 
        this.acc.mult(0);
    }

    show() {
        let hue = wrapHue(currentTheme.hue + map(this.angle, -PI, PI, -1, 1) * currentTheme.hueSpread + hueOffset);
        stroke(hue, currentTheme.sat, currentTheme.bright, this.alpha * 0.7);
        strokeWeight(this.weight);
        line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
    }

    follow(flowfield) {
        let x = floor(this.pos.x / gridSize);
        let y = floor(this.pos.y / gridSize);
        x = constrain(x, 0, cols - 1);
        y = constrain(y, 0, rows - 1);
        let index = x + y * cols;

        let force = flowfield[index];
        if (force) {
            this.acc.add(force);
            this.angle = force.heading();
        }
    }

    edges() {
        let edgeHit = false;
        if (this.pos.x > width)  { this.pos.x = 0; edgeHit = true; }
        if (this.pos.x < 0)      { this.pos.x = width; edgeHit = true; }
        if (this.pos.y > height) { this.pos.y = 0; edgeHit = true; }
        if (this.pos.y < 0)      { this.pos.y = height; edgeHit = true; }

        if (edgeHit) {
            this.prevPos = this.pos.copy();
        }
    }

    interactMouse() {
        let mouse = createVector(mouseX, mouseY);
        let dir = p5.Vector.sub(this.pos, mouse);
        let distance = dir.mag();

        if (distance < 160) {
            dir.normalize();
            if (mouseIsPressed) {
                dir.rotate(HALF_PI);
                dir.mult(3.5);
                this.acc.sub(dir);
            } else {
                let force = (160 - distance) / 160;
                dir.mult(force * 2.2);
                this.acc.add(dir);
            }
        }
    }
}

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 100);
    resetBackground();

    cols = floor(width / gridSize);
    rows = floor(height / gridSize);

    blobs = [];
    for (let i = 0; i < 10; i++) {
        blobs.push(new FluidBlob());
    }

    updateParticleCount(numParticles);
}

function resetBackground() {
    background(currentTheme.bgHue, currentTheme.bgSat, currentTheme.bgBright);
}

function draw() {
    noStroke();
    let fadeAlpha = (displayMode === 'blobs') ? 15 : 7;
    fill(currentTheme.bgHue, currentTheme.bgSat, currentTheme.bgBright, fadeAlpha);
    rect(0, 0, width, height);

    if (displayMode === 'blobs') {
        for (let blob of blobs) {
            blob.update();
            blob.show();
        }
    }

    if (displayMode === 'particles') {
        flowfield = new Array(cols * rows);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                let index = x + y * cols;
                let angle = noise(x * noiseScale + xOffset, y * noiseScale + yOffset, zOffset) * TWO_PI * 2;
                let v = p5.Vector.fromAngle(angle);
                v.setMag(0.5);
                flowfield[index] = v;
            }
        }

        for (const p of particles) {
            p.follow(flowfield);
            p.interactMouse();
            p.update();
            p.edges();
            p.show();
        }
    }

    zOffset += 0.002;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    cols = floor(width / gridSize);
    rows = floor(height / gridSize);
    resetBackground();
}

function updateParticleCount(newCount) {
    numParticles = newCount;
    if (particles.length < numParticles) {
        let toAdd = numParticles - particles.length;
        for (let i = 0; i < toAdd; i++) {
            particles.push(new Particle());
        }
    } else if (particles.length > numParticles) {
        particles.splice(numParticles);
    }
}

document.getElementById('modeSelect').addEventListener('change', function() {
    displayMode = this.value;
    resetBackground();

    const pCtrl = document.getElementById('particleControl');
    pCtrl.classList.toggle('is-disabled', displayMode === 'blobs');
});

document.getElementById('themeSelect').addEventListener('change', function() {
    currentTheme = themes[this.value] || themes.pastel;
    resetBackground();
});

document.getElementById('speedSlider').addEventListener('input', function() {
    maxSpeed = parseFloat(this.value);
    document.getElementById('speedValue').textContent = maxSpeed;
});

document.getElementById('scaleSlider').addEventListener('input', function() {
    noiseScale = parseFloat(this.value);
    document.getElementById('scaleValue').textContent = noiseScale;
});

document.getElementById('randomizeBtn').addEventListener('click', function() {
    xOffset = random(1000);
    yOffset = random(1000);
    hueOffset = random(360);

    blobs = [];
    for (let i = 0; i < 10; i++) {
        blobs.push(new FluidBlob());
    }
    resetBackground();
});

document.getElementById('countSlider').addEventListener('input', function() {
    let newCount = parseInt(this.value);
    document.getElementById('countValue').textContent = newCount;
    updateParticleCount(newCount);
});