import * as THREE from '//cdn.skypack.dev/three@0.130.1/build/three.module.js';
import { GLTFLoader } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/controls/OrbitControls.js';
import { BufferGeometryUtils } from '//cdn.skypack.dev/three@0.130.1/examples/jsm/utils/BufferGeometryUtils.js';

// Core geometry/shader imports (local files)
import { OutsideEdgesGeometry } from './OutsideEdgesGeometry.js';
import { ConditionalEdgesGeometry } from './ConditionalEdgesGeometry.js';
import { ConditionalEdgesShader } from './ConditionalEdgesShader.js';
import { ConditionalLineSegmentsGeometry } from './ConditionalLineSegmentsGeometry.js';
import { ConditionalLineMaterial } from './ConditionalLineMaterial.js';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(40, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 3);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
light.castShadow = true;
scene.add(light);

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ opacity: 0.2 })
);
floor.rotation.x = - Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Load GLB
const loader = new GLTFLoader();
loader.load('model.glb', gltf => {
  const merged = mergeGLTFScene(gltf.scene);
  setupEdges(merged);
});

// Helper: Merge meshes
function mergeGLTFScene(group) {
  const meshes = [];
  group.traverse(c => c.isMesh && meshes.push(c));
  const geoms = meshes.map(m => {
    m.updateMatrixWorld();
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    return BufferGeometryUtils.mergeVertices(g.toNonIndexed());
  });
  const combined = BufferGeometryUtils.mergeBufferGeometries(geoms);
  combined.center();
  const mesh = new THREE.Mesh(combined);
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

// Setup edges
function setupEdges(mesh) {
  const geom = mesh.geometry;
  const condGeom = new ConditionalEdgesGeometry(geom);
  const mat = new THREE.ShaderMaterial(ConditionalEdgesShader);
  mat.uniforms.diffuse.value.set(0x000000);
  const lines = new THREE.LineSegments(condGeom, mat);
  scene.add(lines);

  const thickGeom = new ConditionalLineSegmentsGeometry().fromConditionalEdgesGeometry(condGeom);
  const thickLines = new THREE.LineSegments2(thickGeom, new ConditionalLineMaterial({ color:0x000000, linewidth:2 }));
  scene.add(thickLines);
}

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Animation
(function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
})();
