let htmlMouseX = 0;
let htmlMouseY = 0;

function setup() {
  document.addEventListener("mousemove", function(event) {
    htmlMouseX = event.clientX; // Get mouse X position from HTML
    htmlMouseY = event.clientY; // Get mouse Y position from HTML
  });

  p5lm = new p5LiveMedia(this, "DATA", null, "123qwe");
}

function draw() {
  let dataToSend = { x: htmlMouseX, y: htmlMouseY };
  p5lm.send(JSON.stringify(dataToSend));
}

document.addEventListener("DOMContentLoaded", function() {
  const captchaContainer = document.getElementById("captcha-container");

  captchaContainer.addEventListener("mouseenter", function() {
      console.log(htmlMouseX);
      // Optionally, send a message when mouse enters the CAPTCHA
      let dataToSend = {x: htmlMouseX, y: htmlMouseX };
      p5lm.send(JSON.stringify(dataToSend));
  });

  captchaContainer.addEventListener("mouseleave", function() {
      console.log("Mouse left the reCAPTCHA area");
  });
});

