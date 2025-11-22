// Ball class - handles ball physics and rendering
class Ball {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(random(-3, -1.8), -6); // Initial serve velocity (0.6배 감소)
        this.radius = 36.4; // 28 * 1.3 = 36.4 (30% 증가)
        this.gravity = 0.4; // 중력 감소 (더 천천히 떨어짐)
        this.bounceCoefficient = 0.75; // 바운스 증가
        this.maxSpeed = 19.5; // 최고 속도 제한 (15 * 1.3 = 19.5)
    }

    // Apply physics
    update() {
        // Apply gravity
        this.vel.y += this.gravity;

        // 최고 속도 제한
        const speed = this.vel.mag();
        if (speed > this.maxSpeed) {
            this.vel.setMag(this.maxSpeed);
        }

        // Update position
        this.pos.add(this.vel);

        // Check floor collision
        if (this.pos.y + this.radius >= height - 50) {
            return this.handleFloorCollision();
        }

        // Check ceiling collision
        if (this.pos.y - this.radius <= 0) {
            this.pos.y = this.radius;
            this.vel.y *= -this.bounceCoefficient;
        }

        // Check side walls (prevent out of bounds)
        if (this.pos.x - this.radius <= 0) {
            this.pos.x = this.radius;
            this.vel.x *= -1;
        }
        if (this.pos.x + this.radius >= width) {
            this.pos.x = width - this.radius;
            this.vel.x *= -1;
        }

        return null; // No score
    }

    // Handle floor collision and return which player scored
    handleFloorCollision() {
        this.pos.y = height - 50 - this.radius;
        this.vel.y *= -this.bounceCoefficient;

        // Determine which side the ball landed on
        if (this.pos.x < width / 2) {
            return 2; // Player 2 scores (ball landed on left side)
        } else {
            return 1; // Player 1 scores (ball landed on right side)
        }
    }

    // Check collision with net
    checkNetCollision() {
        const netX = width / 2;
        const netWidth = 20; // 네트 두께
        const netHeight = 240; // 200 * 1.2 = 240 (20% 증가)

        // If ball is passing through net area
        if (abs(this.pos.x - netX) < this.radius + netWidth / 2) {
            if (this.pos.y > height - 50 - netHeight) {
                // Ball hits net - bounce back
                this.vel.x *= -0.8; // x 방향 반전 (80% 속도로)

                // 네트 중심에서 밀어냄
                if (this.pos.x < netX) {
                    this.pos.x = netX - this.radius - netWidth / 2 - 5; // 왼쪽으로 밀어냄
                } else {
                    this.pos.x = netX + this.radius + netWidth / 2 + 5; // 오른쪽으로 밀어냄
                }

                // y 속도 약간 감소 (마찰 효과)
                this.vel.y *= 0.9;
            }
        }
    }

    // Check collision with player hands
    checkHandCollision(player1Hands, player2Hands) {
        // 동적 충돌 거리 계산: 플레이어 반지름(42) + 공 반지름(36.4) = 78.4
        const playerRadius = 42; // 플레이어 점 지름 84px / 2
        const collisionDistance = playerRadius + this.radius; // 42 + 36.4 = 78.4

        // Check Player 1 hands (left side)
        for (let hand of player1Hands) {
            const d = dist(this.pos.x, this.pos.y, hand.x, hand.y);
            if (d < collisionDistance) {
                this.hitByHand(hand.x);
                return;
            }
        }

        // Check Player 2 hands (right side)
        for (let hand of player2Hands) {
            const d = dist(this.pos.x, this.pos.y, hand.x, hand.y);
            if (d < collisionDistance) {
                this.hitByHand(hand.x);
                return;
            }
        }
    }

    // Ball hit by hand
    hitByHand(handX) {
        // Reverse x direction with some randomness
        const multiplier = random(1.2, 1.5);
        this.vel.x *= -multiplier;

        // Fixed upward velocity (더 강하게)
        this.vel.y = -10;

        // Add horizontal component based on hand position
        if (handX < width / 2) {
            // Left player hit - push right
            this.vel.x = abs(this.vel.x);
        } else {
            // Right player hit - push left
            this.vel.x = -abs(this.vel.x);
        }
    }

    // Serve the ball from specified side
    serve(fromRight = false) {
        if (fromRight) {
            this.pos = createVector(width * 0.75, 100);
            this.vel = createVector(random(-5, -3), -8);
        } else {
            this.pos = createVector(width * 0.25, 100);
            this.vel = createVector(random(3, 5), -8);
        }
    }

    // Draw the ball
    display() {
        push();
        // Shadow
        fill(0, 0, 0, 50);
        noStroke();
        ellipse(this.pos.x + 5, this.pos.y + 5, this.radius * 2);

        // Ball image
        imageMode(CENTER);
        image(ballImage, this.pos.x, this.pos.y, this.radius * 2, this.radius * 2);
        pop();
    }

    // Reset ball to serve position
    reset(fromRight = false) {
        this.serve(fromRight);
    }
}
