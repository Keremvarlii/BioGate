export class ApiService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl;
    }

    async verifyOTP(otpCode) {
        // İleride gerçek backend isteği buraya gelecek:
        // const response = await fetch(`${this.baseUrl}/api/verify`, { ... });
        
        return new Promise((resolve) => {
            setTimeout(() => {
                // Şimdilik simülasyon (Backend gelene kadar)
                const isSuccess = (otpCode === "123456"); 
                resolve({ success: isSuccess });
            }, 1000);
        });
    }
}