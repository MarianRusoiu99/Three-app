import './style/main.css'
import * as THREE from 'three'
import {
  createNoise3D
} from "simplex-noise"
import "./controls.js"

var noise = new createNoise3D();


var bgColor = "#171717";
var ballColor = "#EDEDED";

var vizInit = function () {

  var btnPlay = document.getElementById('play');
  var btnStop = document.getElementById('stop');
  var file = document.getElementById("thefile");
  var audio = document.getElementById("audio");

  var fileLabel = document.querySelector("label.file");

  file.onchange = function () {
    muteIconContainer.textContent="Mute"
    muteIconContainer.classList.add("active")
    fileLabel.classList.add('normal');
    audio.classList.add('active');
    document.getElementById('but').style.display = "none"
    var files = this.files;
    whilePlaying()
    btnPlay.classList.remove("active")
    btnStop.classList.add("active")
    audio.src = URL.createObjectURL(files[0]);
    audio.preload = "metadata"

    audio.load();
    audio.play();
    play();
  }
  // play()
  function play() {
    var context = new AudioContext();
    var src = context.createMediaElementSource(audio);
    var analyser = context.createAnalyser();
    src.connect(analyser);
   
    analyser.connect(context.destination);
    console.log(audio.src)
    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

//scene setup
    var scene = new THREE.Scene();
    var group = new THREE.Group();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);
    scene.add(camera);
    scene.background = new THREE.Color(bgColor);



//render
    var renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

//shape

    var icosahedronGeometry = new THREE.IcosahedronGeometry(9, 4);
    var lambertMaterial = new THREE.MeshLambertMaterial({
      color: ballColor,
      wireframe: true
    });

    var ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(0, 5, 0);
    group.add(ball);


//light
    var ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    // var spotLight = new THREE.SpotLight(0xffffff);
    // spotLight.intensity = 2;
    // spotLight.position.set(-10, 40, 20);
    // spotLight.lookAt(ball);
    // spotLight.castShadow = true;
    // scene.add(spotLight);

    scene.add(group);

    document.getElementById('out').appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    render();
//render
    function render() {
     
      analyser.getByteFrequencyData(dataArray);

      var lowerHalfArray = dataArray.slice(0, (dataArray.length / 2) - 1);
      var upperHalfArray = dataArray.slice((dataArray.length / 2) - 1, dataArray.length - 1);

      var overallAvg = avg(dataArray);
      var lowerMax = max(lowerHalfArray);
      var lowerAvg = avg(lowerHalfArray);
      var upperMax = max(upperHalfArray);
      var upperAvg = avg(upperHalfArray);

      var lowerMaxFr = lowerMax / lowerHalfArray.length;
      var lowerAvgFr = lowerAvg / lowerHalfArray.length;
      var upperMaxFr = upperMax / upperHalfArray.length;
      var upperAvgFr = upperAvg / upperHalfArray.length;

      makeRoughBall(ball, modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));

      group.rotation.y += 0.008;
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function makeRoughBall(mesh, bassFr, treFr) {
      mesh.geometry.vertices.forEach(function (vertex, i) {
        var offset = mesh.geometry.parameters.radius;
        var amp = 3;
        var time = window.performance.now();
        vertex.normalize();
        var rf = 0.00001;
        var distance = (offset + bassFr) + noise(vertex.x + time * rf * 7, vertex.y + time * rf * 8, vertex.z + time * rf * 9) * amp * treFr;
        vertex.multiplyScalar(distance);
      });
      mesh.geometry.verticesNeedUpdate = true;
      mesh.geometry.normalsNeedUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeFaceNormals();
    }

    audio.play();
  };
}

window.onload = vizInit();

function fractionate(val, minVal, maxVal) {
  return (val - minVal) / (maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
  var fr = fractionate(val, minVal, maxVal);
  var delta = outMax - outMin;
  return outMin + (fr * delta);
}

function avg(arr) {
  var total = arr.reduce(function (sum, b) {
    return sum + b;
  });
  return (total / arr.length);
}

function max(arr) {
  return arr.reduce(function (a, b) {
    return Math.max(a, b);
  })
}



//preloader

var preloader = document.getElementById("preloader");
window.addEventListener("load", function () {
  preloader.style.display = "none";
})

//controls
var btnPlay = document.getElementById('play');
var btnStop = document.getElementById('stop');
const audioPlayerContainer = document.getElementById('audio-player-container');
const seekSlider = document.getElementById('seek-slider');
const volumeSlider = document.getElementById('volume-slider');
var muteIconContainer = document.getElementById('mute-icon');
const durationContainer = document.getElementById('duration');
const currentTimeContainer = document.getElementById('current-time');
const outputContainer = document.getElementById('volume-output');
let raf = null;
let muteState = 'unmute';

muteIconContainer.addEventListener('click', () => {
  if (muteState === 'unmute') {
    muteIconContainer.textContent="Unmute";
    audio.muted = true;
    muteState = 'mute';
  } else {
    muteIconContainer.textContent="Mute";
    audio.muted = false;
    muteState = 'unmute';
  }
});
const showRangeProgress = (rangeInput) => {
  if (rangeInput === seekSlider) audioPlayerContainer.style.setProperty('--seek-before-width', rangeInput.value / rangeInput.max * 100 + '%');
  else audioPlayerContainer.style.setProperty('--volume-before-width', rangeInput.value / rangeInput.max * 100 + '%');
}

seekSlider.addEventListener('input', (e) => {
  showRangeProgress(e.target);
});
volumeSlider.addEventListener('input', (e) => {
  showRangeProgress(e.target);
});


btnPlay.addEventListener("click", function () {
  
  audio.play();
  btnPlay.classList.remove("active")
  btnStop.classList.add("active")
})

btnStop.addEventListener("click", function () {

  audio.pause();
  btnPlay.classList.add("active")
  btnStop.classList.remove("active")
})



const calculateTime = (secs) => {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${returnedSeconds}`;
}

const displayDuration = () => {
  durationContainer.textContent = calculateTime(audio.duration);
}

const setSliderMax = () => {
  seekSlider.max = Math.floor(audio.duration);
}

const displayBufferedAmount = () => {
  const bufferedAmount = Math.floor(audio.buffered.end(audio.buffered.length - 1));
  audioPlayerContainer.style.setProperty('--buffered-width', `${(bufferedAmount / seekSlider.max) * 100}%`);
}

var whilePlaying = () => {
  seekSlider.value = Math.floor(audio.currentTime);
  currentTimeContainer.textContent = calculateTime(seekSlider.value);
  audioPlayerContainer.style.setProperty('--seek-before-width', `${seekSlider.value / seekSlider.max * 100}%`);
  raf = requestAnimationFrame(whilePlaying);
}

if (audio.readyState > 0) {
  displayDuration();
  setSliderMax();
  displayBufferedAmount();
} else {
  audio.addEventListener('loadedmetadata', () => {
    displayDuration();
    setSliderMax();
    displayBufferedAmount();
  });
}

audio.addEventListener('progress', displayBufferedAmount);

seekSlider.addEventListener('input', () => {
  currentTimeContainer.textContent = calculateTime(seekSlider.value);
  if (!audio.paused) {
    cancelAnimationFrame(raf);
  }
});

seekSlider.addEventListener('change', () => {
  audio.currentTime = seekSlider.value;
  if (!audio.paused) {
    requestAnimationFrame(whilePlaying);
  }
});

volumeSlider.addEventListener('input', (e) => {
  const value = e.target.value;

  outputContainer.textContent = value;
  audio.volume = value / 100;
});