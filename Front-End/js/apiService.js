export class ApiService {
    constructor(baseUrl = 'http://localhost:5001') {
        this.baseUrl = baseUrl;
    }

    async verifyOTP(email, otpCode) {
        try {
            const response = await fetch(`${this.baseUrl}/api/otp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otpCode })
            });
            
            // Backend'den dönen { success: true/false, message: "..." } formatındaki JSON
            return await response.json(); 
        } catch (error) {
            console.error("API Bağlantı Hatası:", error);
            throw error;
        }
    }
}