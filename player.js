// Player class - handles player nose tracking and rendering
class Player {
    constructor(playerNumber, noseImage) {
        this.playerNumber = playerNumber; // 1 or 2
        this.hands = []; // Array of tracking positions {x, y}
        this.position = null; // 플레이어 중심 위치 {x, y}
        this.color = playerNumber === 1 ? color(66, 133, 244) : color(234, 67, 53); // Blue or Red
        this.isDetected = false;
        this.lastKnownPosition = null; // 마지막으로 인식된 위치
        this.noseImage = noseImage; // 코 이미지
        this.charSize = 168; // 기본 캐릭터 크기 (스케일 전)
        this.collisionRadius = 65; // 충돌 반지름 (스케일 전)
    }

    // Update position from pose data (using nose)
    updateFromPose(pose) {
        this.hands = [];

        if (!pose || !pose.keypoints) {
            // 포즈가 없으면 마지막 위치 사용
            if (this.lastKnownPosition) {
                this.hands.push(this.lastKnownPosition);
                this.position = this.lastKnownPosition;
                this.isDetected = true;
            } else {
                this.isDetected = false;
                this.position = null;
            }
            return;
        }

        // Find nose keypoint
        const nose = pose.keypoints.find(kp => kp.part === 'nose');

        // Add nose position if confidence is high enough
        if (nose && nose.score > 0.3) {
            const position = { x: nose.position.x, y: nose.position.y };
            this.hands.push(position);
            this.position = position; // 중심 위치 설정
            this.lastKnownPosition = position; // 마지막 위치 저장
            this.isDetected = true;
        } else if (this.lastKnownPosition) {
            // 인식 실패 시 마지막 위치 사용
            this.hands.push(this.lastKnownPosition);
            this.position = this.lastKnownPosition;
            this.isDetected = true;
        } else {
            this.isDetected = false;
            this.position = null;
        }
    }

    // Draw player tracking point
    display() {
        if (!this.isDetected || !this.noseImage) return;

        push();

        // Draw each tracking point as an image
        const charSize = this.charSize * gameScale; // 스케일 적용
        for (let hand of this.hands) {
            imageMode(CENTER);
            // 모든 플레이어 이미지 그대로 표시 (좌우 반전 없음)
            image(this.noseImage, hand.x, hand.y, charSize, charSize);
        }

        // Draw player label
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(16 * gameScale); // 스케일 적용
        textStyle(BOLD);

        if (this.hands.length > 0) {
            const avgX = this.hands.reduce((sum, h) => sum + h.x, 0) / this.hands.length;
            const avgY = this.hands.reduce((sum, h) => sum + h.y, 0) / this.hands.length;
            text(`P${this.playerNumber}`, avgX, avgY - 60 * gameScale); // 스케일 적용
        }

        pop();
    }

    // Get hands for collision detection
    getHands() {
        return this.hands;
    }

    // Get collision radius
    getRadius() {
        return this.collisionRadius * gameScale;
    }

    // Check if player is detected
    detected() {
        return this.isDetected;
    }
}
