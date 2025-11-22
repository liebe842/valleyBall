// Game class - manages game state, scoring, and flow
class Game {
    constructor() {
        this.state = 'WAITING'; // WAITING, READY, PLAYING, WIN
        this.player1Score = 0;
        this.player2Score = 0;
        this.winScore = 15;
        this.ball = null;
        this.player1 = new Player(1);
        this.player2 = new Player(2);
        this.lastScorer = 0; // Who scored last (for serve)
        this.winTimer = 0;
        this.winCountdown = 3; // seconds
        this.readyTimer = 0;
        this.readyCountdown = 3; // seconds for ready screen
        this.gameTimer = 0;
        this.gameTimeLimit = 20 * 60; // 20 seconds at 60fps
        this.hasStartedOnce = false; // 한번이라도 시작했는지 체크

        // 시작 영역 (원)
        this.startZone1 = { x: width * 0.25, y: height / 2, radius: 100 }; // 왼쪽 영역
        this.startZone2 = { x: width * 0.75, y: height / 2, radius: 100 }; // 오른쪽 영역
        this.player1InZone = false;
        this.player2InZone = false;
    }

    // Initialize ball
    init() {
        this.ball = new Ball(width / 2, 100);
        this.ball.serve(random() > 0.5); // Random initial serve
    }

    // Check if player is in start zone
    checkPlayerInZone(player, zone) {
        if (!player.detected() || player.hands.length === 0) return false;
        const hand = player.hands[0];
        const distance = dist(hand.x, hand.y, zone.x, zone.y);
        return distance < zone.radius;
    }

    // Update game state
    update() {
        if (this.state === 'WAITING') {
            // Check if both players are detected
            if (this.player1.detected() && this.player2.detected()) {
                // 시작 영역 체크
                this.player1InZone = this.checkPlayerInZone(this.player1, this.startZone1);
                this.player2InZone = this.checkPlayerInZone(this.player2, this.startZone2);

                // 둘 다 영역 안에 있으면 READY 시작
                if (this.player1InZone && this.player2InZone) {
                    if (!this.hasStartedOnce) {
                        // 처음 시작할 때만 READY 화면
                        this.state = 'READY';
                        this.readyTimer = 0;
                    } else {
                        // 이미 시작한 적 있으면 바로 시작
                        this.startGame();
                    }
                }
            }
        } else if (this.state === 'READY') {
            // Ready 카운트다운
            this.readyTimer++;
            if (this.readyTimer > this.readyCountdown * 60) {
                this.startGame();
            }
        } else if (this.state === 'PLAYING') {
            // 게임 타이머 업데이트
            this.gameTimer++;

            // 20초 경과 시 게임 종료
            if (this.gameTimer >= this.gameTimeLimit) {
                this.endGameByTime();
                return;
            }

            // Update ball physics
            const scorer = this.ball.update();

            // Check net collision
            this.ball.checkNetCollision();

            // Check hand collisions
            this.ball.checkHandCollision(
                this.player1.getHands(),
                this.player2.getHands()
            );

            // Handle scoring
            if (scorer !== null) {
                this.handleScore(scorer);
            }

            // 게임 중에는 인식 끊겨도 계속 진행 (마지막 위치 사용)
            // if (!this.player1.detected() || !this.player2.detected()) {
            //     this.state = 'WAITING';
            // }
        } else if (this.state === 'WIN') {
            // Update win timer
            this.winTimer++;
            if (this.winTimer > this.winCountdown * 60) { // 60 fps * seconds
                this.reset();
            }
        }
    }

    // Start the game
    startGame() {
        this.state = 'PLAYING';
        this.hasStartedOnce = true;
        this.gameTimer = 0; // 타이머 리셋
        if (!this.ball) {
            this.init();
        }
    }

    // End game by time limit
    endGameByTime() {
        this.state = 'WIN';
        this.winTimer = 0;
        // 점수가 높은 사람이 승리, 동점이면 무승부
    }

    // Handle scoring
    handleScore(scorer) {
        if (scorer === 1) {
            this.player1Score++;
            this.lastScorer = 1;
        } else if (scorer === 2) {
            this.player2Score++;
            this.lastScorer = 2;
        }

        // Check for win condition
        if (this.player1Score >= this.winScore) {
            this.state = 'WIN';
            this.winTimer = 0;
        } else if (this.player2Score >= this.winScore) {
            this.state = 'WIN';
            this.winTimer = 0;
        } else {
            // Serve from scorer's side
            this.ball.reset(this.lastScorer === 2);
        }
    }

    // Reset game
    reset() {
        this.player1Score = 0;
        this.player2Score = 0;
        this.lastScorer = 0;
        this.state = 'WAITING';
        this.winTimer = 0;
        this.init();
    }

    // Update player poses
    updatePoses(poses) {
        // Reset detection
        this.player1.isDetected = false;
        this.player2.isDetected = false;

        if (!poses || poses.length === 0) return;

        // Sort poses by x position
        const sortedPoses = poses.sort((a, b) => {
            const aX = a.pose.keypoints[0].position.x;
            const bX = b.pose.keypoints[0].position.x;
            return aX - bX;
        });

        // Assign left pose to player 1, right pose to player 2
        if (sortedPoses.length >= 1) {
            const pose1 = sortedPoses[0].pose;
            if (pose1.keypoints[0].position.x < width / 2) {
                this.player1.updateFromPose(pose1);
            }
        }

        if (sortedPoses.length >= 2) {
            const pose2 = sortedPoses[1].pose;
            if (pose2.keypoints[0].position.x >= width / 2) {
                this.player2.updateFromPose(pose2);
            }
        }

        // Handle single player on right side
        if (sortedPoses.length === 1) {
            const pose = sortedPoses[0].pose;
            if (pose.keypoints[0].position.x >= width / 2) {
                this.player2.updateFromPose(pose);
            }
        }
    }

    // Display game elements
    display() {
        // Draw court background
        this.drawCourt();

        // Draw net
        this.drawNet();

        // Draw floor line
        this.drawFloor();

        // Draw players
        this.player1.display();
        this.player2.display();

        // Draw ball
        if (this.ball && this.state !== 'WAITING') {
            this.ball.display();
        }

        // Draw scoreboard
        this.drawScoreboard();

        // Draw state messages
        if (this.state === 'WAITING') {
            this.drawWaitingScreen();
        } else if (this.state === 'READY') {
            this.drawReadyScreen();
        } else if (this.state === 'WIN') {
            this.drawWinScreen();
        }

        // Draw timer during gameplay
        if (this.state === 'PLAYING') {
            this.drawGameTimer();
        }
    }

    // Draw court
    drawCourt() {
        // Left court
        fill(72, 209, 204, 100);
        noStroke();
        rect(0, 0, width / 2, height);

        // Right court
        fill(255, 165, 0, 100);
        rect(width / 2, 0, width / 2, height);
    }

    // Draw net
    drawNet() {
        push();
        const netHeight = 240; // 200 * 1.2 = 240 (20% 증가)
        const netWidth = 20; // 네트 두께

        // Draw thick net
        fill(255);
        noStroke();
        rect(width / 2 - netWidth / 2, height - 50 - netHeight, netWidth, netHeight);

        // Net pattern
        stroke(100);
        strokeWeight(2);
        for (let i = 0; i < netHeight; i += 20) {
            line(width / 2 - netWidth / 2, height - 50 - i, width / 2 + netWidth / 2, height - 50 - i);
        }
        pop();
    }

    // Draw floor line
    drawFloor() {
        push();
        stroke(255);
        strokeWeight(3);
        line(0, height - 50, width, height - 50);
        pop();
    }

    // Draw scoreboard
    drawScoreboard() {
        push();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(32);
        textStyle(BOLD);
        text(`P1: ${this.player1Score}  |  P2: ${this.player2Score}`, width / 2, 40);
        pop();
    }

    // Draw waiting screen
    drawWaitingScreen() {
        push();
        fill(0, 0, 0, 180);
        rect(0, 0, width, height);

        // Draw start zones (circles)
        strokeWeight(5);
        noFill();

        // Zone 1 (Left)
        if (this.player1InZone) {
            stroke(0, 255, 0); // Green when player inside
            fill(0, 255, 0, 50);
        } else {
            stroke(66, 133, 244); // Blue
            fill(66, 133, 244, 30);
        }
        ellipse(this.startZone1.x, this.startZone1.y, this.startZone1.radius * 2);

        // Zone 2 (Right)
        if (this.player2InZone) {
            stroke(0, 255, 0); // Green when player inside
            fill(0, 255, 0, 50);
        } else {
            stroke(234, 67, 53); // Red
            fill(234, 67, 53, 30);
        }
        ellipse(this.startZone2.x, this.startZone2.y, this.startZone2.radius * 2);

        // Text instructions
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(32);
        textStyle(BOLD);

        const p1Status = this.player1.detected() ? '✓' : '✗';
        const p2Status = this.player2.detected() ? '✓' : '✗';

        text('Enter the Circles!', width / 2, 60);

        textSize(20);
        textStyle(NORMAL);
        text(`Player 1: ${p1Status}`, width / 2, 110);
        text(`Player 2: ${p2Status}`, width / 2, 140);

        // Zone status
        if (this.player1.detected() && this.player2.detected()) {
            textSize(18);
            if (this.player1InZone && this.player2InZone) {
                fill(0, 255, 0);
                text('Both Ready! Starting...', width / 2, height - 60);
            } else {
                fill(255, 255, 0);
                let msg = '';
                if (!this.player1InZone) msg += 'P1 enter left circle  ';
                if (!this.player2InZone) msg += 'P2 enter right circle';
                text(msg, width / 2, height - 60);
            }
        }
        pop();
    }

    // Draw ready screen
    drawReadyScreen() {
        push();
        fill(0, 0, 0, 180);
        rect(0, 0, width, height);

        fill(255, 215, 0);
        textAlign(CENTER, CENTER);
        textSize(64);
        textStyle(BOLD);

        const countdown = Math.ceil(this.readyCountdown - (this.readyTimer / 60));
        if (countdown > 0) {
            text(countdown, width / 2, height / 2);
        } else {
            text('GO!', width / 2, height / 2);
        }

        textSize(24);
        fill(255);
        text('Get Ready!', width / 2, height / 2 - 80);
        pop();
    }

    // Draw game timer
    drawGameTimer() {
        push();
        fill(255, 255, 0);
        textAlign(RIGHT, TOP);
        textSize(20);
        textStyle(BOLD);

        const remainingSeconds = Math.ceil((this.gameTimeLimit - this.gameTimer) / 60);
        text(`Time: ${remainingSeconds}s`, width - 20, 10);
        pop();
    }

    // Draw win screen
    drawWinScreen() {
        push();
        fill(0, 0, 0, 200);
        rect(0, 0, width, height);

        fill(255, 215, 0);
        textAlign(CENTER, CENTER);
        textSize(48);
        textStyle(BOLD);

        // 점수로 승자 결정
        let winner;
        if (this.player1Score > this.player2Score) {
            winner = 1;
        } else if (this.player2Score > this.player1Score) {
            winner = 2;
        } else {
            winner = 0; // 무승부
        }

        if (winner === 0) {
            text('Draw!', width / 2, height / 2 - 40);
        } else {
            text(`Player ${winner} Wins!`, width / 2, height / 2 - 40);
        }

        textSize(24);
        fill(255);
        text(`Final Score: ${this.player1Score} - ${this.player2Score}`, width / 2, height / 2 + 10);

        const countdown = Math.ceil(this.winCountdown - (this.winTimer / 60));
        text(`Restarting in ${countdown}...`, width / 2, height / 2 + 60);
        pop();
    }
}
