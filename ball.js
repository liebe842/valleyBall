// Ball class - handles ball physics and rendering
class Ball {
    constructor(x, y) {
        this.pos = createVector(x, y);
        // Initial serve velocity - 스케일 적용하여 초기화
        this.vel = createVector(random(-3, -1.8) * gameScale, -6 * gameScale);
        this.radius = 36.4; // 28 * 1.3 = 36.4 (30% 증가) - 기준값
        this.gravity = 0.4; // 중력 기준값 (update에서 gameScale 적용)
        this.bounceCoefficient = 0.75; // 바운스 증가
        this.maxSpeed = 21; // 최고 속도 제한 기준값 (update에서 gameScale 적용)
        this.trail = []; // 잔상 저장 배열
        this.maxTrailLength = 8; // 최대 잔상 개수
        this.crashEffects = []; // 충돌 이펙트 배열
        this.lastCollisionTime = 0; // 마지막 충돌 시간 (쿨다운용)
        this.collisionCooldown = 200; // 충돌 쿨다운 시간 (ms)
        this.isServing = false; // 서브 대기 상태
        this.serveSide = 0; // 0: none, 1: left, 2: right
        this.servePos = null; // 서브 위치
    }

    // Apply physics
    update() {
        // 충돌 이펙트 업데이트 (시간 경과로 페이드 아웃)
        for (let i = this.crashEffects.length - 1; i >= 0; i--) {
            this.crashEffects[i].timer--;
            if (this.crashEffects[i].timer <= 0) {
                this.crashEffects.splice(i, 1); // 시간 지난 이펙트 제거
            }
        }

        // 서브 대기 중이면 물리 엔진 적용 안함
        if (this.isServing) {
            // 서브 위치에 공 고정
            if (this.servePos) {
                this.pos = this.servePos.copy();
            }
            return null;
        }

        // 현재 위치를 잔상 배열에 추가
        this.trail.push(createVector(this.pos.x, this.pos.y));

        // 잔상 길이 제한
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift(); // 가장 오래된 잔상 제거
        }

        // Apply gravity (스케일 적용)
        this.vel.y += this.gravity * gameScale;

        // 최고 속도 제한 (스케일 적용)
        const speed = this.vel.mag();
        if (speed > this.maxSpeed * gameScale) {
            this.vel.setMag(this.maxSpeed * gameScale);
        }

        // Update position
        this.pos.add(this.vel);

        // Check floor collision (스케일 적용)
        const floorY = height - 50 * gameScale;
        if (this.pos.y + this.radius * gameScale >= floorY) {
            return this.handleFloorCollision();
        }

        // Check ceiling collision (스케일 적용)
        if (this.pos.y - this.radius * gameScale <= 0) {
            this.pos.y = this.radius * gameScale;
            this.vel.y *= -this.bounceCoefficient;
        }

        // Check side walls (스케일 적용)
        if (this.pos.x - this.radius * gameScale <= 0) {
            this.pos.x = this.radius * gameScale;
            this.vel.x *= -1;
        }
        if (this.pos.x + this.radius * gameScale >= width) {
            this.pos.x = width - this.radius * gameScale;
            this.vel.x *= -1;
        }

        return null; // No score
    }

    // Handle floor collision and return which player scored
    handleFloorCollision() {
        const floorY = height - 50 * gameScale;
        this.pos.y = floorY - this.radius * gameScale;
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
        const netWidth = 20 * gameScale; // 네트 두께 (스케일 적용)
        const netHeight = 240 * gameScale; // 네트 높이 (스케일 적용)
        const floorOffset = 50 * gameScale; // 바닥 오프셋 (스케일 적용)

        // If ball is passing through net area
        if (abs(this.pos.x - netX) < this.radius * gameScale + netWidth / 2) {
            if (this.pos.y > height - floorOffset - netHeight) {
                // Ball hits net - bounce back
                this.vel.x *= -0.8; // x 방향 반전 (80% 속도로)

                // 네트 중심에서 밀어냄
                if (this.pos.x < netX) {
                    this.pos.x = netX - this.radius * gameScale - netWidth / 2 - 5 * gameScale; // 왼쪽으로 밀어냄
                } else {
                    this.pos.x = netX + this.radius * gameScale + netWidth / 2 + 5 * gameScale; // 오른쪽으로 밀어냄
                }

                // y 속도 약간 감소 (마찰 효과)
                this.vel.y *= 0.9;
            }
        }
    }

    // Check collision with player hands
    checkHandCollision(player1Hands, player2Hands, player1, player2) {
        // Check Player 1 hands (left side)
        const player1Radius = player1.getRadius();
        const collisionDistance1 = player1Radius + this.radius * gameScale;

        for (let hand of player1Hands) {
            const d = dist(this.pos.x, this.pos.y, hand.x, hand.y);
            if (d < collisionDistance1) {
                this.hitByHand(hand.x);
                return;
            }
        }

        // Check Player 2 hands (right side)
        const player2Radius = player2.getRadius();
        const collisionDistance2 = player2Radius + this.radius * gameScale;

        for (let hand of player2Hands) {
            const d = dist(this.pos.x, this.pos.y, hand.x, hand.y);
            if (d < collisionDistance2) {
                this.hitByHand(hand.x);
                return;
            }
        }
    }

    // Ball hit by hand
    hitByHand(handX) {
        // 쿨다운 체크 - 마지막 충돌로부터 200ms 이상 경과했는지 확인
        const currentTime = millis();
        if (currentTime - this.lastCollisionTime < this.collisionCooldown) {
            return; // 쿨다운 중이면 충돌 처리 안함
        }

        // 쿨다운 타이머 갱신
        this.lastCollisionTime = currentTime;

        // Play crash sound
        if (crashSound) {
            crashSound.play();
        }

        // 충돌 이펙트 추가
        this.crashEffects.push({
            x: this.pos.x,
            y: this.pos.y,
            timer: 20, // 20 프레임 동안 표시 (약 0.33초)
            maxTimer: 20
        });

        // 서브 대기 중이면 서브 시작
        if (this.isServing) {
            this.isServing = false;

            // 서브 방향 결정
            if (this.serveSide === 1) {
                // 왼쪽 플레이어 서브 - 오른쪽으로
                this.vel.x = random(3, 5) * gameScale;
                this.vel.y = -8 * gameScale;
            } else if (this.serveSide === 2) {
                // 오른쪽 플레이어 서브 - 왼쪽으로
                this.vel.x = random(-5, -3) * gameScale;
                this.vel.y = -8 * gameScale;
            }

            // 잔상 초기화
            this.trail = [];
            return;
        }

        // Fixed upward velocity (스케일 적용)
        this.vel.y = -10 * gameScale;

        // 공의 위치와 손의 위치를 비교하여 방향 결정
        const ballRelativeToHand = this.pos.x - handX;

        if (ballRelativeToHand > 0) {
            // 공이 손보다 오른쪽에 있음 - 오른쪽으로 튕김
            this.vel.x = abs(this.vel.x) * random(1.2, 1.5);
        } else {
            // 공이 손보다 왼쪽에 있음 - 왼쪽으로 튕김
            this.vel.x = -abs(this.vel.x) * random(1.2, 1.5);
        }
    }

    // Serve the ball from specified side
    serve(fromRight = false) {
        // 서브 대기 상태로 설정
        this.isServing = true;
        this.vel = createVector(0, 0); // 속도 초기화

        if (fromRight) {
            // 오른쪽 플레이어 서브 위치
            this.serveSide = 2;
            this.servePos = createVector(width * 0.75, height * 0.35); // 높이 조정 (0.5 -> 0.35)
            this.pos = this.servePos.copy();
        } else {
            // 왼쪽 플레이어 서브 위치
            this.serveSide = 1;
            this.servePos = createVector(width * 0.25, height * 0.35); // 높이 조정 (0.5 -> 0.35)
            this.pos = this.servePos.copy();
        }
        // 서브 시 잔상 초기화
        this.trail = [];
    }

    // Draw the ball
    display() {
        push();

        // Draw crash effects (충돌 이펙트)
        for (let effect of this.crashEffects) {
            const alpha = map(effect.timer, 0, effect.maxTimer, 0, 255); // 시간에 따라 페이드 아웃
            const size = map(effect.timer, effect.maxTimer, 0, 80 * gameScale, 120 * gameScale); // 스케일 적용

            tint(255, alpha);
            imageMode(CENTER);
            image(crashImage, effect.x, effect.y, size, size);
        }

        noTint(); // tint 리셋

        // Draw trail (잔상)
        for (let i = 0; i < this.trail.length; i++) {
            const alpha = map(i, 0, this.trail.length - 1, 0, 150); // 투명도 점진적 증가
            const size = map(i, 0, this.trail.length - 1, this.radius * 0.5 * gameScale, this.radius * 2 * gameScale); // 스케일 적용

            tint(255, alpha); // 투명도 적용
            imageMode(CENTER);
            image(ballImage, this.trail[i].x, this.trail[i].y, size, size);
        }

        noTint(); // tint 리셋

        // Shadow
        fill(0, 0, 0, 50);
        noStroke();
        ellipse(this.pos.x + 5 * gameScale, this.pos.y + 5 * gameScale, this.radius * 2 * gameScale); // 스케일 적용

        // Ball image (현재 위치)
        imageMode(CENTER);
        image(ballImage, this.pos.x, this.pos.y, this.radius * 2 * gameScale, this.radius * 2 * gameScale); // 스케일 적용
        pop();
    }

    // Reset ball to serve position
    reset(fromRight = false) {
        this.serve(fromRight);
    }
}
