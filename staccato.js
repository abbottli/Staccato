var g, canvas; // canvas stuff
var visual; // intervals
var pills, words; // shape storage
var colorFields, color, BGCOLOR; // color options
var colorDef = [ // pretty colors
'#69D2E7',
'#1B676B',
'#BEF202',
'#EBE54D',
'#00CDAC',
'#1693A5',
'#F9D423',
'#FF4E50',
'#E7204E',
'#0CCABA',
'#FF006F'
];
var AMP, SPEED, SPIN, SIZE, SCALE, NUM, DELAY, ALPHA; // init var 
var GROW, DIRECTION, BOUNCE, TYPE, SORT; // selection choices
/* 
AMP: amplitude of cos, determines how much shapes move side to side: the spread
SPEED: how fast it moves 
SPIN: how fast it spins
SIZE: how long the shape is
SCALE: how big the shape is
NUM: number of shapes added per interval
DELAY: delay for adding new shapes
ALPHA: opacity levels: 0 - 1
GROW: show as growing lines or just the shapes
DIRECTION: shapes move up/down/random
BOUNCE: shapes bounce off top/bottom
TYPE: type of shape: pill/word
*/
var idx; // for words array

// audio
var audioCtx, audio, source, analyzer, MP3, dataArray, FILE, MIC, micAudio;
// mic access stuff
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

// audio source from microphone
// doesn't work yet
function AudioMic() {
  if (navigator.getUserMedia) {
    navigator.getUserMedia({audio: true}, function(stream) {
      if (audioCtx == null) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      analyzer = audioCtx.createAnalyser();
      analyzer.fftsize = 512;

      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyzer);
      source.connect(audioCtx.destination);
      analyzer.connect(audioCtx.destination);
      micAudio = new Recorder(audioCtx.createGain());
      micAudio.record();

      dataArray = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(dataArray);
    }, function(e) {
      alert('Give me access pls');
    });
  }
}
var files;
// audio from user inputed file
// click options -> choose file -> start -> wait a little bit for audio to load
// works bests with songs with lots volume variations or snare beats
// or pauses or else it might look like a lot of random pulsing pills
function audioFromFile() {
  document.getElementById('queue').style = 'block';
  document.getElementById('queue').innerHTML = 'Queue: <br>';
 
  files = document.getElementById('files').files;
  index = 0;

  for (let i = 0, file; file = files[i]; i++) {
    document.getElementById('queue').innerHTML +=
      "<span id='song" + i + "' style='color:black'>" + (i + 1) + '. ' + file.name.match(/(.+)\./)[1] + '</span><br>';
  }
  
  playFromFile();
}

// if you press start with a queue playing it overlaps, since previous queue is still active
function playFromFile() {
  var reader = new FileReader();

  if (audioCtx == null) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  analyzer = audioCtx.createAnalyser();
  analyzer.fftsize = 512;
  document.getElementById('loading').style.display = 'block';
  // creates audio source and analyzer from inputed file
  reader.onload = function (e) {
    audioCtx.decodeAudioData(e.target.result, function (buf) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('song' + index).style.color = 'green';
      source = audioCtx.createBufferSource();
      source.connect(analyzer);
      //source.connect(audioCtx.destination); // causes distortion
      analyzer.connect(audioCtx.destination);
      source.buffer = buf;
      source.start(0);
      source.onended = function() {// plays next song if any in queue
        document.getElementById('song' + index).style.color = 'black';

        if (index !== files.length - 1) {
          index++;
          playFromFile();
        }
      };

    })
  };
  reader.readAsArrayBuffer(files[index]);
  
  dataArray = new Uint8Array(analyzer.frequencyBinCount);
  analyzer.getByteFrequencyData(dataArray); // sets audio data
}

function AudioAnalyzer() {
  if (audioCtx == null) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  analyzer = audioCtx.createAnalyser();
  analyzer.fftsize = 512;
  
  audio = new Audio(MP3);
  audio.crossOrigin = 'anonymous'; // for cors access
  audio.controls = true;
  // sets up sources from url
  audio.addEventListener('canplay', function() {
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyzer);
    source.connect(audioCtx.destination);
    analyzer.connect(audioCtx.destination);
  });

  dataArray = new Uint8Array(analyzer.frequencyBinCount);
  analyzer.getByteFrequencyData(dataArray); // sets audio data
}

window.onload = function init() {
  document.getElementById('width').value = window.innerWidth;
  document.getElementById('height').value = window.innerHeight;
  document.getElementById('options').style.height = window.innerHeight - 50;
  colorFields = 0;
  defCond();
  start();
}

window.addEventListener('resize', function(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.getElementById('options').style.height = window.innerHeight - 50;
});

// display word text area on change
document.getElementById('shape').addEventListener('change', function () {
  document.getElementById('wordsOptions').style.display =
  this.value == "Words" ? 'block' : 'none';
});

// switches options to preset values
document.getElementById('preset').addEventListener('change', function () {
  switch(this.value) {
    case "Floaty Snow":
      floatySnow();
      break;
    case "Rain":
      rain();
      break;
    case "Waveform":
      waveform();
      break;
    default:
      defCond();
  }
})

// adds more color options
function addColor() {
  var newColorField = document.createElement('div');
  newColorField.innerHTML = 
  "<input type='color' value='#0000FF' id='color" + colorFields +
  "' /><input type='button' id='button" + colorFields +
  "' value='Remove' onClick='this.parentNode.parentNode.removeChild(this.parentNode);'/>";
  colorFields++;

  document.getElementById('colors').appendChild(newColorField);
}

// start animation
function start() {
  stop(); // stops previous plays so nothing messes up
  document.getElementById('width').value = window.innerWidth;
  document.getElementById('height').value = window.innerHeight;
  document.getElementById('options').style.height = window.innerHeight - 50;
  getCond();
  if (audio == null && !FILE && !MIC) { // audio from url
    AudioAnalyzer();
  }

  if (!FILE && !MIC) { // adds audio player to screen and starts audio
    document.body.appendChild(audio);
    audio.play();
  }

  document.getElementById('canvas').style.background = BGCOLOR;

  // sets words for word shapes; default: butts
  if (TYPE == 'word') {
    words = document.getElementById('words').value != "" ?
    document.getElementById('words').value.split(" ") : ["butts"];
    idx = 0;
  }

  var pill;

  pills = [];

  // init canvas
  canvas = document.getElementById('canvas')
  canvas.width = toNum(document.getElementById('width').value, window.innerWidth);
  canvas.height = toNum(document.getElementById('height').value, window.innerHeight);
  g = canvas.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);

  if (!SORT) {
    addP();
  } else {
    addSorted();
  }

  if (visual == null) {
    draw(); // start drawing
  }
}

function addSorted() {
  var pill, band;
  // offsets starts for smoother entry
  var st = DIRECTION == -1 ? canvas.height + 20 : -20;
  for (var i = 0; i < NUM; i++) {
    pill = new Shape((i / NUM) * canvas.width, canvas.height / 2);
    pill.band = i;
    pills.push(pill);
  }
}

// adds number of shapes to be drawn
function addP() {
  var pill;
  // offsets starts for smoother entry
  var st = DIRECTION == -1 ? canvas.height + 20 : -20;

  for (var i = 0; i < NUM; i++) {
    pill = new Shape(round3(rand(0, canvas.width)), round3(rand(0,st)));
    pills.push(pill);
  }
}

// pauses audio from urls, stops audio from files
function stop() {
  if (!FILE) {
    if (audio != null) {
     audio.pause();
    }
  } else {
    if (source != null) {
      source.stop(0);
    }
  }
}

// hides/shows option menu
function options() {
  document.getElementById("options").style.display =
  document.getElementById("options").style.display == 'none' ? 'block' : 'none';
}

// sets options
function setCond(cond) {
  document.getElementById('amp').value = cond.amp;
  document.getElementById('speedMin').value = cond.speedMin;
  document.getElementById('speedMax').value = cond.speedMax;
  document.getElementById('spinMin').value = cond.spinMin;
  document.getElementById('spinMax').value = cond.spinMax;
  document.getElementById('sizeMin').value = cond.sizeMin;
  document.getElementById('sizeMax').value = cond.sizeMax;
  document.getElementById('scaleMin').value = cond.scaleMin;
  document.getElementById('scaleMax').value = cond.scaleMax;
  document.getElementById('alphaMin').value = cond.alphaMin;
  document.getElementById('alphaMax').value = cond.alphaMax;
  document.getElementById('grow').checked = cond.grow;
  document.getElementById('numShapes').value = cond.numShapes;
  document.getElementById('direction').value = cond.direction;
  document.getElementById('shape').value = cond.shape;
  document.getElementById('words').value = cond.words;
  document.getElementById('bounce').checked = cond.bounce;
  document.getElementById('sort').checked = cond.sort;
  document.getElementById('wordsOptions').style.display = 'none';
  document.getElementById('bgColor').value = cond.bgColor;
  
  document.getElementById('width').value = window.innerWidth;
  document.getElementById('height').value = window.innerHeight;

  document.getElementById('colors').innerHTML = ''; // clears prev colors

  // adds default colors
  colorFields = 0;
  for (var i = 0; i < cond.colors.length; i++) {
    addColor();
    document.getElementById('color' + (colorFields - 1)).value = cond.colors[i];
  }
}

// default settings
function defCond() {
  setCond({
    amp: 250,
    speedMin: .2,
    speedMax: 1,
    spinMin: .001,
    spinMax: .005,
    sizeMin: .5,
    sizeMax: 1.25,
    scaleMin: 5,
    scaleMax: 20,
    alphaMin: .8,
    alphaMax: .9,
    grow: false,
    numShapes: 100,
    direction: "Up",
    shape: "Pill",
    words: "",
    bounce: false,
    bgColor: '#000000',
    colors: colorDef
  });
}

// floaty snow preset settings
function floatySnow() {
  setCond({
    amp: 250,
    speedMin: .1,
    speedMax: 1,
    spinMin: .001,
    spinMax: .005,
    sizeMin: .1,
    sizeMax: .2,
    scaleMin: 1,
    scaleMax: 10,
    alphaMin: .7,
    alphaMax: .9,
    grow: false,
    numShapes: 100,
    direction: "Down",
    shape: "Pill",
    words: "",
    bounce: false,
    bgColor: '#7CD3D8', // blue greyish sky
    colors: ['#FFFFFF'] // white snow
  });
}

// rain preset
function rain() {
  setCond({
    amp: 0,
    speedMin: 10,
    speedMax: 15,
    spinMin: 0,
    spinMax: 0,
    sizeMin: .1,
    sizeMax: .2,
    scaleMin: 1,
    scaleMax: 3,
    alphaMin: .8,
    alphaMax: .9,
    grow: false,
    numShapes: 100,
    direction: "Down",
    shape: "Pill",
    words: "",
    bounce: false,
    bgColor: '#000000', // black
    colors: ['#2B7BDD'] // white snow
  });
}

function waveform() {
  setCond({
    amp: 0,
    speedMin: 0,
    speedMax: 0,
    spinMin: .001,
    spinMax: .005,
    sizeMin: .5,
    sizeMax: 10,
    scaleMin: 5,
    scaleMax: 20,
    alphaMin: .8,
    alphaMax: .9,
    grow: false,
    numShapes: 128,
    direction: "Up",
    shape: "Pill",
    words: "",
    bounce: false,
    sort: true,
    bgColor: '#000000',
    colors: colorDef
  });  
}

// init vars based on settings
function getCond() {
  TYPE = document.getElementById('shape').value == "Words" ? 'word' : 'pill';
  AMP = toNum(document.getElementById('amp').value, 250);
  SPEED = {
    MIN: toNum(document.getElementById('speedMin').value, .2),
    MAX: toNum(document.getElementById('speedMax').value, .5)
  };
  SPIN = {
    MIN: toNum(document.getElementById('spinMin').value, .001),
    MAX: toNum(document.getElementById('spinMax').value, .005)
  };
  SIZE = {
    MIN: toNum(document.getElementById('sizeMin').value, .5),
    MAX: toNum(document.getElementById('sizeMax').value, 2)
  };
  SCALE = {
    MIN: toNum(document.getElementById('scaleMin').value, 1),
    MAX: toNum(document.getElementById('scaleMax').value, 10)
  };
  ALPHA = {
    MIN: toNum(document.getElementById('alphaMin').value, .2),
    MAX: toNum(document.getElementById('alphaMax').value, 1)
  };
  GROW = document.getElementById('grow').checked;
  NUM = toNum(document.getElementById('numShapes').value, 10);
  BOUNCE = document.getElementById('bounce').checked;
  BGCOLOR = document.getElementById('bgColor').value;
  DIRECTION = document.getElementById('direction').value == "Up" ? -1 : 1;
  if (document.getElementById('direction').value == "Random") {
    DIRECTION = 0; // direction modifier doesn't matter for random
  }

  SORT = document.getElementById('sort').checked;
  FILE = false;
  MIC = document.getElementById('mic').checked;

  if (document.getElementById('mp3url').value != '') {
    // uses inputed url as audio source
    // needs url to be actual audio file, tried to circumvent issues with cors
    // by using passing urls through crossorigin.me, but it still doesn't
    // always work.
    MP3 = 'http://crossorigin.me/' + document.getElementById('mp3url').value;
    
    // removes previous audio player if present
    if (document.body.contains(audio)) {
      document.body.removeChild(audio);
      audio = null;
    }
  } else if (document.getElementById('files').value != '') {
    // removes previous audio player if present
    if (document.body.contains(audio)) {
      document.body.removeChild(audio);
      audio = null;
    }

    audioFromFile(); // gets audio source from file
    FILE = true;
  } else if (MIC) { 
    // TODO: makes this work haha
    if (document.body.contains(audio)) {
      document.body.removeChild(audio);
      audio = null;
    }

    AudioMic();
  } else { 
    MP3 = 'http://crossorigin.me/https://s3-us-west-2.amazonaws.com/s.cdpn.io/1715/the_xx_-_intro.mp3';
  }
  
  

  color = [];

  for (var i = 0; i < colorFields; i++) {
    if (document.getElementById('color' + i) != null) {
      color.push(document.getElementById('color' + i).value);
    }
  }
}

// parses s into a num if it contains one, otherwise returns def
function toNum(s, def) {
  return !isNaN(parseFloat(s)) ? parseFloat(s) : def;
}

// returns random number in between range
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// rounds n to 3 places
function round3(n) {
  return Math.round(n * 1000) / 1000;
}

function Shape(x, y) {
  // init vars
  this.x = x;
  this.y = y;
  this.scale = Math.floor(rand(SCALE.MIN, SCALE.MAX));
  this.speed = round3(rand(SPEED.MIN, SPEED.MAX));
  this.color = color[Math.floor(Math.random() * color.length)];
  this.size = round3(rand(SIZE.MIN, SIZE.MAX));
  this.spin = round3(rand(SPIN.MIN, SPIN.MAX));
  this.alpha = round3(rand(ALPHA.MIN, ALPHA.MAX));
  this.band = Math.floor(rand(0, 128));
  this.energy = 0;
  this.decayScale = 0;
  this.decayAlpha = 0;
  this.smoothedScale = 0;
  this.smoothedAlpha = 0;
  //this.alphamod = Math.floor(rand(1,5));

  // sets each shape to different word
  if (TYPE == 'word') {
    this.idx = idx++%words.length;
  }
  if (Math.random() < 0.5) {
    this.spin *= -1;
  }
  this.rotation = round3(rand(0, 2 * Math.PI));
  this.direction = DIRECTION != 0 ? DIRECTION : 1;
  this.random = DIRECTION == 0 ? true : false;
  this.amp = AMP;

  // updates shape's pos
  this.move = function() {
    this.rotation = round3(this.rotation + this.spin);
    this.y = round3(this.y + this.speed * this.direction);
  }

  // draws shape
  this.draw = function() {
    var scale, alpha;

    // changes scale and alpha levels of shapes depending on audio band data
    // decay is so the shapes look like they react to the audio
    // smoothed makes changes in energy levels smoother and not too jittery
    scale = this.scale * Math.exp(this.energy);
    alpha = this.alpha * this.energy * 1.5;
    this.decayScale = Math.max(this.decayScale, scale);
    this.decayAlpha = Math.max(this.decayAlpha, alpha);
    this.smoothedScale = round3(this.smoothedScale + (this.decayScale - this.smoothedScale) * 0.3);
    this.smoothedAlpha = round3(this.smoothedAlpha + (this.decayAlpha - this.smoothedAlpha) * 0.3);
    this.decayScale = round3(this.decayScale * .95);
    this.decayAlpha = round3(this.decayAlpha * .95);

    g.save();
    g.beginPath();

    /* not really random just rotates first so the translation axis is different
    causes shapes to appear randomly, not starting at top/ bottom */  
    if (this.random) {
      g.rotate(this.rotation);
      g.translate(this.x + Math.cos(this.rotation * this.speed) * this.amp, this.y);
    } else {
      g.translate(this.x + Math.cos(this.rotation * this.speed) * this.amp, this.y);
      g.rotate(this.rotation);  
    }
    g.scale(this.smoothedScale, this.smoothedScale);
    g.globalAlpha = this.smoothedAlpha/3;

    // drawing actual shape
    if (TYPE == 'pill') {
      g.moveTo(this.size, 0);
      g.lineTo(this.size * -1, 0);
      g.lineWidth = "5";
      g.lineCap = 'round';
      g.strokeStyle = this.color;
      g.stroke();
    } else if (TYPE == 'word') {
      g.font = '20pt Arial';
      g.fillStyle = this.color;
      g.fillText(words[this.idx], 0, 0);
    }

    g.restore();
  }
}

// clear canvas
function clear() {
  g.clearRect(0, 0, canvas.width, canvas.height);
}

// draws all shapes
function draw() {
  var p;

  visual = requestAnimationFrame(draw); // set draw interval
  analyzer.getByteFrequencyData(dataArray); // update audio data
  
  if (!GROW) // clear screen between each drawing or not
    clear();
  
  for (var i = 0; i < pills.length; i++) {
    p = pills[i];

    p.energy = round3(dataArray[p.band] / 256); // updates energy levels based on audio

    if (p.y < 0 && p.direction == -1 || 
      p.y > canvas.height && p.direction == 1) {
      if (BOUNCE) {
        // checks direction so starting offset doesn't make it bounce
        // swaps direction, doesn't function properly with random direction
        p.direction *= -1; 
      } else {
        // resets shape
        var st = p.direction == -1 ? canvas.height + 20 : -20;
        p = new Shape(round3(rand(0, canvas.width)), st);
        pills[i] = p;
      }
    }
    // updates and redraws shape when done
    if (p.y >= 0 || p.y <= canvas.height || BOUNCE) {
      p.move();
      p.draw();
    }
  }  
}
