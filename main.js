import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('black');

// Perspective camera for rendering
const camera = new THREE.PerspectiveCamera(
	45, // Field of view
	window.innerWidth / window.innerHeight, // Aspect ratio
	0.1, // Near clipping plane
	100 // Far clipping plane (reduced from 1000)
  );  
camera.position.set(0, 0, 20);
camera.lookAt(0, 0, 0);

// Free navigation camera
const freeCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
freeCamera.position.set(10, 10, 10);

// OrbitControls for both cameras
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enabled = false; // Disable controls for the main camera by default
const freeOrbit = new OrbitControls(freeCamera, renderer.domElement);

// Camera helper
const cameraHelper = new THREE.CameraHelper(camera);
cameraHelper.scale.set(0.00001, 0.00001, 0.00001); // Scale down the helper
scene.add(cameraHelper);

const axesHelperSize = 500; // Same size as the previous grid for consistency
const axesHelper = new THREE.AxesHelper(axesHelperSize);
scene.add(axesHelper);

// Create different LOD geometries
const boxGeometryHigh = new THREE.BoxGeometry(5, 5, 5, 10, 10, 10);
const boxGeometryMedium = new THREE.BoxGeometry(5, 5, 5, 6, 6, 6);
const boxGeometryLow = new THREE.BoxGeometry(5, 5, 5, 3, 3, 3);

// Create a gradient texture
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
canvas.width = 2;
canvas.height = 256;
const gradient = context.createLinearGradient(0, 0, 0, 256);
gradient.addColorStop(0, '#0000ff');
gradient.addColorStop(1, '#00ffff');
context.fillStyle = gradient;
context.fillRect(0, 0, 2, 256);
const gradientTexture = new THREE.CanvasTexture(canvas);

const boxMaterial = new THREE.MeshStandardMaterial({
  map: gradientTexture
});
const box = new THREE.Mesh(boxGeometryHigh, boxMaterial);
scene.add(box);
box.position.set(0, 0, 0);

// Lights
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Raycaster for camera selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Event listener for mouse click
window.addEventListener('mousedown', onMouseClick);

// Adjust LOD on resize
function adjustLOD() {
    const width = renderer.domElement.width;
    const thresholdMedium = 800;
    const thresholdLow = 500;

    if (width < thresholdLow && box.geometry !== boxGeometryLow) {
        box.geometry.dispose();
        box.geometry = boxGeometryLow;
    } else if (width >= thresholdLow && width < thresholdMedium && box.geometry !== boxGeometryMedium) {
        box.geometry.dispose();
        box.geometry = boxGeometryMedium;
    } else if (width >= thresholdMedium && box.geometry !== boxGeometryHigh) {
        box.geometry.dispose();
        box.geometry = boxGeometryHigh;
    }
}

// Window resize event
window.addEventListener('resize', onWindowResize);

// Set the initial LOD adjustment
adjustLOD();

// Start with the freeCamera
let currentCamera = freeCamera;

// Animation loop
renderer.setAnimationLoop(animate);

function animate(time) {
  box.rotation.x = time / 2000;
  box.rotation.y = time / 2000;
  renderer.render(scene, currentCamera);
  cameraHelper.update();
}

// Function to switch between cameras
window.addEventListener('keydown', function (event) {
  if (event.key === 'c') {
    if (currentCamera === freeCamera) {
      currentCamera = camera;
      orbit.enabled = true;
      freeOrbit.enabled = false;
    } else {
      currentCamera = freeCamera;
      orbit.enabled = false;
      freeOrbit.enabled = true;
    }
  }
});

// Function to snap freeCamera to the perspective of the main camera
function snapToCamera() {
	// Copy position and rotation
	freeCamera.position.copy(camera.position);
	freeCamera.rotation.copy(camera.rotation);
  
	// Assuming the main camera is looking at the origin (0, 0, 0),
	// set the freeOrbit target to the origin
	freeOrbit.target.set(0, 0, 0);
  
	// Update the freeOrbit to apply the new target
	freeOrbit.update();
  }

// Function to handle mouse clicks for raycasting
function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, freeCamera);
  const intersects = raycaster.intersectObjects([cameraHelper]);

  if (intersects.length > 0) {
    snapToCamera();
  }
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  freeCamera.aspect = window.innerWidth / window.innerHeight;
  freeCamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  adjustLOD();
}