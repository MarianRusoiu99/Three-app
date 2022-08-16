import './style/main.css'
import * as THREE from 'three'
import {createNoise3D} from "simplex-noise"
import "./controls.js"

var noise = new createNoise3D();
console.log("asdfsdf")

var bgColor = "#171717";
var ballColor = "#EDEDED";








var vizInit = function (){
  
  var btnPlay = document.getElementById('play');
  var btnStop = document.getElementById('stop');
  var file = document.getElementById("thefile");
  var audio = document.getElementById("audio");
  
  var fileLabel = document.querySelector("label.file");
  // console.log(btnPlay)
//   btnPlay.addEventListener("click",function(){
//     console.log("sdfsfd")
//     audio.play();
// })
  document.onload = function(e){
    audio.src = ""
    // console.log(e);
    audio.play();
    play();
  }
  console.log(window.AudioContext)
  file.onchange = function(){
    fileLabel.classList.add('normal');
    audio.classList.add('active');
    var files = this.files;
    
    btnPlay.classList.remove("active")
    btnStop.classList.add("active")
    // audio.disconnect(window.AudioContext.destination)
    audio.src = URL.createObjectURL(files[0]);
    audio.preload = "metadata"

    audio.load();
    audio.play();
    play();
  }
  play()
function play() {
    var context = new AudioContext();
    var src = context.createMediaElementSource(audio);
    var analyser = context.createAnalyser();
    src.connect(analyser);
  
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);
    
   
    
    // console.log(dataArray)
    var scene = new THREE.Scene();
    var group = new THREE.Group();
    var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0,0,100);
    camera.lookAt(scene.position);
    scene.add(camera);
    scene.background = new THREE.Color( bgColor );


    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

   

    var icosahedronGeometry = new THREE.IcosahedronGeometry(9, 4);
    var lambertMaterial = new THREE.MeshLambertMaterial({
        color: ballColor,
        wireframe: true
    });

    var ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(0, 0, 0);
    group.add(ball);



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

    function render() {
      analyser.getByteFrequencyData(dataArray);

      var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
      var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

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

      group.rotation.y += 0.005;
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
            var amp = 7;
            var time = window.performance.now();
            vertex.normalize();
            var rf = 0.00001;
            var distance = (offset + bassFr ) + noise(vertex.x + time *rf*7, vertex.y +  time*rf*8, vertex.z + time*rf*9) * amp * treFr;
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

// document.body.addEventListener('touchend', function(ev) { context.resume(); });





function fractionate(val, minVal, maxVal) {
    return (val - minVal)/(maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
    var fr = fractionate(val, minVal, maxVal);
    var delta = outMax - outMin;
    return outMin + (fr * delta);
}

function avg(arr){
    var total = arr.reduce(function(sum, b) { return sum + b; });
    return (total / arr.length);
}

function max(arr){
    return arr.reduce(function(a, b){ return Math.max(a, b); })
}




//controls

var preloader = document.getElementById("preloader");
window.addEventListener("load",function(){
  preloader.style.display="none";
})
var btnPlay = document.getElementById('play');
var btnStop = document.getElementById('stop');
const durationContainer = document.getElementById('duration');
const seekSlider = document.getElementById('seek-slider');
var track = document.getElementById("track")
// track.textContent= audio.

  btnPlay.addEventListener("click",function(){
    console.log("sdfsfd")
    audio.play();
    btnPlay.classList.remove("active")
    btnStop.classList.add("active")
})

btnStop.addEventListener("click",function(){
  
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
if (audio.readyState > 0) {
  displayDuration();
} else {
  audio.addEventListener('loadedmetadata', () => {
    displayDuration();
  });
}
console.log(audio.fileName)