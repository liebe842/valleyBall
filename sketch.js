// Main sketch - p5.js setup and draw loop
let video;
let poseNet;
let poses = [];
let game;
let isModelReady = false;
let ballImage;

function preload() {
    // Load ball image
    ballImage = loadImage('ball.png');
}

function setup() {
    // Create canvas
    const canvas = createCanvas(800, 600);
    canvas.parent('canvas-container');

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
    game = new Game();
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

    // Draw FPS counter and debug info
    drawFPS();
    drawDebugInfo();
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
