// Main sketch - p5.js setup and draw loop
let video;
let poseNet;
let poses = [];
let game;
let isModelReady = false;
let ballImage;
let noseImage;
let noseImage2;
let crashImage;
let crashSound;
let pointSound;
let gameoverSound;
let gameScale = 1; // 게임 스케일 (기준: 800x600)

function preload() {
    // Load ball image
    ballImage = loadImage('ball.png');
    // Load nose images
    noseImage = loadImage('해로.png');
    noseImage2 = loadImage('해로1.png');
    // Load crash image
    crashImage = loadImage('crash.png');
    // Load crash sound
    crashSound = loadSound('crash.mp3');
    // Load point sound
    pointSound = loadSound('point.mp3');
    // Load gameover sound
    gameoverSound = loadSound('gameover.mp3');
}

function setup() {
    // Create responsive canvas with aspect ratio 4:3
    const aspectRatio = 4 / 3;
    let canvasWidth, canvasHeight;

    if (windowWidth / windowHeight > aspectRatio) {
        // 창이 더 넓음 - 높이 기준으로 맞춤
        canvasHeight = windowHeight;
        canvasWidth = canvasHeight * aspectRatio;
    } else {
        // 창이 더 좁음 - 너비 기준으로 맞춤
        canvasWidth = windowWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }

    const canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');

    // Calculate game scale (base width: 800)
    gameScale = canvasWidth / 800;

    // Create video capture
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();

    // Initialize PoseNet
    const options = {
        imageScaleFactor: 0.3,
        outputStride: 16,
        flipHorizontal: true,
        minConfidence: 0.5,
        maxPoseDetections: 2,
        scoreThreshold: 0.5,
        nmsRadius: 20
    };

    poseNet = ml5.poseNet(video, options, modelReady);
    poseNet.on('pose', gotPoses);

    // Initialize game
    game = new Game(noseImage, noseImage2);
}

function modelReady() {
    isModelReady = true;
    console.log('PoseNet model loaded!');
}

function gotPoses(results) {
    poses = results;
    // 디버그: 포즈 감지 확인
    if (results && results.length > 0) {
        console.log('Poses detected:', results.length);
    }
}

function draw() {
    // Draw video background (mirrored)
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();

    // Semi-transparent overlay for better visibility
    fill(0, 0, 0, 100);
    rect(0, 0, width, height);

    if (!isModelReady) {
        drawLoadingScreen();
        return;
    }

    // Update game with detected poses
    game.updatePoses(poses);

    // Update and display game
    game.update();
    game.display();
}

function drawLoadingScreen() {
    push();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    textStyle(BOLD);
    text('Loading PoseNet Model...', width / 2, height / 2);

    // Loading animation
    textSize(48);
    const dots = '.'.repeat((frameCount % 60) / 15 + 1);
    text(dots, width / 2, height / 2 + 50);
    pop();
}

function drawFPS() {
    push();
    fill(255, 255, 0);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(16);
    text(`FPS: ${Math.round(frameRate())}`, 10, 10);
    pop();
}

function drawDebugInfo() {
    push();
    fill(0, 255, 0);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(14);
    let y = 30;

    text(`Poses detected: ${poses.length}`, 10, y);
    y += 20;
    text(`Model ready: ${isModelReady}`, 10, y);
    y += 20;
    text(`P1 hands: ${game.player1.hands.length}`, 10, y);
    y += 20;
    text(`P2 hands: ${game.player2.hands.length}`, 10, y);
    y += 20;

    // 각 포즈의 키포인트 정보
    if (poses.length > 0) {
        text(`--- Pose Details ---`, 10, y);
        y += 20;
        poses.forEach((poseObj, i) => {
            const pose = poseObj.pose;
            const nose = pose.keypoints.find(kp => kp.part === 'nose');
            const leftWrist = pose.keypoints.find(kp => kp.part === 'leftWrist');
            const rightWrist = pose.keypoints.find(kp => kp.part === 'rightWrist');

            if (nose) {
                text(`Pose ${i}: x=${Math.round(nose.position.x)}, conf=${nose.score.toFixed(2)}`, 10, y);
                y += 20;
            }

            // 손목 정보 표시
            if (leftWrist) {
                text(`  LWrist: conf=${leftWrist.score.toFixed(2)}`, 10, y);
                y += 20;
            }
            if (rightWrist) {
                text(`  RWrist: conf=${rightWrist.score.toFixed(2)}`, 10, y);
                y += 20;
            }
        });
    }

    pop();
}

// Keyboard controls for testing (optional)
function keyPressed() {
    if (key === 'r' || key === 'R') {
        // Reset game
        game.reset();
    }
    if (key === 'd' || key === 'D') {
        // Toggle debug mode (show FPS)
        // You can add more debug features here
        console.log('Player 1 detected:', game.player1.detected());
        console.log('Player 2 detected:', game.player2.detected());
        console.log('Game state:', game.state);
        console.log('Scores:', game.player1Score, '-', game.player2Score);
    }
}

// Window resize handler
function windowResized() {
    // Maintain aspect ratio 4:3
    const aspectRatio = 4 / 3;
    let canvasWidth, canvasHeight;

    if (windowWidth / windowHeight > aspectRatio) {
        // 창이 더 넓음 - 높이 기준으로 맞춤
        canvasHeight = windowHeight;
        canvasWidth = canvasHeight * aspectRatio;
    } else {
        // 창이 더 좁음 - 너비 기준으로 맞춤
        canvasWidth = windowWidth;
        canvasHeight = canvasWidth / aspectRatio;
    }

    resizeCanvas(canvasWidth, canvasHeight);
    video.size(width, height);

    // Recalculate game scale
    gameScale = canvasWidth / 800;

    // Update game zones with new scale
    if (game) {
        game.startZone1.radius = 100 * gameScale;
        game.startZone2.radius = 100 * gameScale;
    }
}
