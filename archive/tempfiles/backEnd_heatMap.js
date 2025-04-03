let otherX = 0;
let otherY = 0;

let ssp;
let heatmap;
let gridSize = 20; // Smaller grid size for more detailed heatmap
let cols, rows;

function setup() {
  createCanvas(1280, 800); // Increased canvas size
  cols = width / gridSize;
  rows = height / gridSize;
  heatmap = new Array(cols).fill(0).map(() => new Array(rows).fill(0));

  p5lm = new p5LiveMedia(this, "DATA", null, "123qwe");
  p5lm.on('data', gotData);
}

function draw() {
  background(255);
  drawHeatmap();
  
  fill(255,0,0, 150);
  ellipse(otherX,otherY,10,10); 
}

function gotData(data, id) {
  print(id + ":" + data);
  let d = JSON.parse(data);
  otherX = d.x;
  otherY = d.y;
  updateOtherHeatmap();
}

function mouseMoved() {
  let dataToSend = {x: mouseX, y: mouseY};
  p5lm.send(JSON.stringify(dataToSend));
}

function mousePressed() {
  let col = floor(mouseX / gridSize);
  let row = floor(mouseY / gridSize);
  if (col >= 0 && col < cols && row >= 0 && row < rows) {
    heatmap[col][row]++;
  }
}

function updateOtherHeatmap() {
  let col = floor(otherX / gridSize);
  let row = floor(otherY / gridSize);
  if (col >= 0 && col < cols && row >= 0 && row < rows) {
    heatmap[col][row]++;
  }
}

function drawHeatmap() {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let intensity = heatmap[i][j];
      if (intensity > 0) {
        let alpha = map(intensity, 0, 50, 20, 255); // Adjusted for better visibility
        fill(255, 0, 0, alpha);
        noStroke();
        rect(i * gridSize, j * gridSize, gridSize, gridSize);
      }
    }
  }
}