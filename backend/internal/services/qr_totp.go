package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strconv"
	"strings"
	"time"
)

const QRTimeStepSeconds = 30

// GenerateDynamicQRToken generates a time-based HMAC-SHA256 token
func GenerateDynamicQRToken(deptCode, secretKey string) (token string, remainingSeconds int) {
	nowUnix := time.Now().Unix()
	step := nowUnix / QRTimeStepSeconds
	remainingSeconds = int(QRTimeStepSeconds - (nowUnix % QRTimeStepSeconds))

	message := fmt.Sprintf("%s:%d", deptCode, step)
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte(message))
	signature := hex.EncodeToString(mac.Sum(nil))

	// Format: PKQR:<DEPT_CODE>:<STEP>:<SIGNATURE_PREFIX_32>
	token = fmt.Sprintf("PKQR:%s:%d:%s", deptCode, step, signature[:32])
	return token, remainingSeconds
}

// VerifyDynamicQRToken verifies if scanned QR token is valid and not expired
func VerifyDynamicQRToken(token, deptCode, secretKey string) bool {
	parts := strings.Split(token, ":")
	if len(parts) != 4 || parts[0] != "PKQR" {
		return false
	}

	scannedDeptCode := parts[1]
	if scannedDeptCode != deptCode {
		return false
	}

	scannedStep, err := strconv.ParseInt(parts[2], 10, 64)
	if err != nil {
		return false
	}

	scannedSignature := parts[3]

	// Current step
	currentStep := time.Now().Unix() / QRTimeStepSeconds

	// Allow current step and 1 step before (30s drift tolerance)
	validSteps := []int64{currentStep, currentStep - 1}

	for _, step := range validSteps {
		if scannedStep == step {
			message := fmt.Sprintf("%s:%d", deptCode, step)
			mac := hmac.New(sha256.New, []byte(secretKey))
			mac.Write([]byte(message))
			expectedSig := hex.EncodeToString(mac.Sum(nil))[:32]

			if hmac.Equal([]byte(scannedSignature), []byte(expectedSig)) {
				return true
			}
		}
	}

	return false
}
