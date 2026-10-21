package services

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

type CloudinaryResponse struct {
	SecureURL string `json:"secure_url"`
	PublicID  string `json:"public_id"`
	Error     struct {
		Message string `json:"message"`
	} `json:"error"`
}

// UploadSelfieToCloudinary mengunggah foto base64 selfie ke CDN Cloudinary
func UploadSelfieToCloudinary(imageBase64, cloudName, apiKey, apiSecret, uploadPreset string) (string, error) {
	if cloudName == "" {
		// Ambil dari environment jika parameter kosong
		cloudName = os.Getenv("CLOUDINARY_CLOUD_NAME")
		apiKey = os.Getenv("CLOUDINARY_API_KEY")
		apiSecret = os.Getenv("CLOUDINARY_API_SECRET")
		uploadPreset = os.Getenv("CLOUDINARY_UPLOAD_PRESET")
	}

	if cloudName == "" {
		return "", fmt.Errorf("cloudinary cloud_name belum dikonfigurasi")
	}

	// Pastikan format data URI base64 valid
	var fileParam string
	if strings.HasPrefix(imageBase64, "data:image") {
		fileParam = imageBase64
	} else {
		fileParam = "data:image/jpeg;base64," + imageBase64
	}

	url := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", cloudName)

	pipeReader, pipeWriter := io.Pipe()
	writer := multipart.NewWriter(pipeWriter)

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)

	go func() {
		defer pipeWriter.Close()
		defer writer.Close()

		_ = writer.WriteField("file", fileParam)

		if uploadPreset != "" {
			_ = writer.WriteField("upload_preset", uploadPreset)
		} else if apiKey != "" && apiSecret != "" {
			_ = writer.WriteField("api_key", apiKey)
			_ = writer.WriteField("timestamp", timestamp)
			// Buat signature SHA-1: timestamp=...<api_secret>
			sigToHash := fmt.Sprintf("timestamp=%s%s", timestamp, apiSecret)
			hasher := sha1.New()
			hasher.Write([]byte(sigToHash))
			signature := hex.EncodeToString(hasher.Sum(nil))
			_ = writer.WriteField("signature", signature)
		}
	}()

	req, err := http.NewRequest("POST", url, pipeReader)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("koneksi ke Cloudinary gagal: %v", err)
	}
	defer resp.Body.Close()

	var cloudResp CloudinaryResponse
	if err := json.NewDecoder(resp.Body).Decode(&cloudResp); err != nil {
		return "", fmt.Errorf("gagal decode respon Cloudinary: %v", err)
	}

	if cloudResp.Error.Message != "" {
		return "", fmt.Errorf("Cloudinary error: %s", cloudResp.Error.Message)
	}

	if cloudResp.SecureURL == "" {
		return "", fmt.Errorf("Cloudinary tidak mengembalikan secure_url")
	}

	return cloudResp.SecureURL, nil
}
