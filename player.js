// Player class - handles player nose tracking and rendering
class Player {
    constructor(playerNumber) {
        this.playerNumber = playerNumber; // 1 or 2
        this.hands = []; // Array of tracking positions {x, y}
        this.color = playerNumber === 1 ? color(66, 133, 244) : color(234, 67, 53); // Blue or Red
        this.isDetected = false;
        this.lastKnownPosition = null; // 마지막으로 인식된 위치
    }

    // Update position from pose data (using nose)
    updateFromPose(pose) {
        this.hands = [];

        if (!pose || !pose.keypoints) {
            // 포즈가 없으면 마지막 위치 사용
            if (this.lastKnownPosition) {
                this.hands.push(this.lastKnownPosition);
                this.isDetected = true;
            } else {
                this.isDetected = false;
            }
            return;
        }

        // Find nose keypoint
        const nose = pose.keypoints.find(kp => kp.part === 'nose');

        // Add nose position if confidence is high enough
        if (nose && nose.score > 0.3) {
            const position = { x: nose.position.x, y: nose.position.y };
            this.hands.push(position);
            this.lastKnownPosition = position; // 마지막 위치 저장
            this.isDetected = true;
        } else if (this.lastKnownPosition) {
            // 인식 실패 시 마지막 위치 사용
            this.hands.push(this.lastKnownPosition);
            this.isDetected = true;
        } else {
            this.isDetected = false;
        }
    }

    // Draw player tracking point
    display() {
        if (!this.isDetected) return;

        push();
        fill(this.color);
        stroke(255);
        strokeWeight(4);

        // Draw each tracking point as a circle (84px = 120px * 0.7)
        for (let hand of this.hands) {
            ellipse(hand.x, hand.y, 84);
        }

        // Draw player label
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(16);
        textStyle(BOLD);

        if (this.hands.length > 0) {
            const avgX = this.hands.reduce((sum, h) => sum + h.x, 0) / this.hands.length;
            const avgY = this.hands.reduce((sum, h) => sum + h.y, 0) / this.hands.length;
            text(`P${this.playerNumber}`, avgX, avgY - 30);
        }

        pop();
    }

    // Get hands for collision detection
    getHands() {
        return this.hands;
    }

    // Check if player is detected
    detected() {
        return this.isDetected;
    }
}
