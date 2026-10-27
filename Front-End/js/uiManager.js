export class UIManager {
    constructor() {
        this.inputs = document.querySelectorAll('.otp-inputs input');
        this.statusMessage = document.getElementById('status-message');
        this.submitBtn = document.getElementById('submit-btn');
        this.setupInputBehaviors();
    }

    setupInputBehaviors() {
        this.inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, ''); // Sadece rakam
                if (e.target.value !== '' && index < this.inputs.length - 1) {
                    this.inputs[index + 1].disabled = false;
                    this.inputs[index + 1].focus();
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                    this.inputs[index - 1].focus();
                    this.inputs[index - 1].value = '';
                }
            });
        });
    }

    getOTPValue() {
        let otp = '';
        this.inputs.forEach(input => otp += input.value);
        return otp;
    }

    showLoading() {
        this.statusMessage.textContent = "Doğrulanıyor...";
        this.statusMessage.className = "status-message";
        this.submitBtn.disabled = true;
    }

    showSuccess(message) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = "status-message success";
        this.submitBtn.disabled = false;
    }

    showError(message) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = "status-message error";
        this.submitBtn.disabled = false;
        this.resetInputs();
    }

    resetInputs() {
        this.inputs.forEach(input => {
            input.value = '';
            input.disabled = true;
        });
        this.inputs[0].disabled = false;
        this.inputs[0].focus();
    }
}