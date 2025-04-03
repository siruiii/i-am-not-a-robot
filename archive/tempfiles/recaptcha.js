    var successfulCaptchas = 0; // Counter for successful CAPTCHAs
    var requiredCaptchas = 21; // Number of required CAPTCHA completions

    function verifyCallback(response) {
    successfulCaptchas++;
    if (successfulCaptchas >= requiredCaptchas) {
        document.getElementById('verifyButton').disabled = false;
    }
    }

    function onloadCallback() {
    for (let i = 1; i <= requiredCaptchas; i++) {
        let captchaDiv = document.createElement("div");
        captchaDiv.id = "captcha" + i;
        document.getElementById("captcha-container").appendChild(captchaDiv);
        grecaptcha.render(captchaDiv.id, {
        'sitekey': '6Le2tuYqAAAAAAeR7iAH6OPAodsA5UzzQ_0xoOSa',
        'callback': verifyCallback,
        'theme': 'light'
        });
    }
    }

    function verifyUser() {
    alert('Verification successful!');
    }