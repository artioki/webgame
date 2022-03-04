import * as THREE from './libs/three.module.js';
import { FBXLoader } from './libs/FBXLoader.js';

var camera, renderer, goal,follow, scene , keys,keys2;
var dir = new THREE.Vector3;
var a = new THREE.Vector3;
var b = new THREE.Vector3;
var coronaSafetyDistance = 0.3;
var velocity = 0.0;
var speed = 0.0;

init();

var players_ = {}
var mainPlayer = null;
var mainId = null;
var bool_m = null;
var socket;

var loader;
var mixers_ ={};
var clocks_ = {};
var actions_ = {};
var actionsF_ ={};



function init() {
  if(!loader) loader = new FBXLoader();

  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
  camera.position.set( 0, .2, 0 );
  
  scene = new THREE.Scene();

  camera.lookAt( scene.position );

  var gridHelper = new THREE.GridHelper( 40, 40 );
  scene.add( gridHelper );
  scene.add( new THREE.AxesHelper() );
  scene.background = new THREE.Color( 0xa0a0a0 );
  scene.fog = new THREE.Fog( 0xa0a0a0, 2, 10 );

  goal = new THREE.Object3D;
  follow = new THREE.Object3D;
  goal.position.z = -coronaSafetyDistance;
  goal.add( camera );

  //load_p()

  if(true){ 
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
      hemiLight.position.set(0, 20, 0);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff);
      dirLight.position.set(0, 20, 10);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024*2;
      dirLight.shadow.mapSize.height = 1024*2;
      dirLight.shadow.camera.top = 18;
      dirLight.shadow.camera.bottom = - 10;
      dirLight.shadow.camera.left = - 12;
      dirLight.shadow.camera.right = 12;
      dirLight.shadow.camera.far = 30;
       
      scene.add(dirLight);
  }



  socket = io();
  socket.on("pos", (d) => {
    const [id,pos,rotationY,objId,action_bool] = d
    
    if(!(id in players_)){
      create_mesh(d)
      console.log(`Пока идет загрузка,${players_[id]} модель пуста` )
    }
    if(players_[id] !== undefined){
      players_[id].position.set(...pos);
      players_[id].rotation.set(0,rotationY,0)
      actionsF_[id] = action_bool;
    }
    
  })

  socket.on("del",(id)=>{
    scene.remove( players_[id] );
    delete players_[id];
    delete mixers_[id];
    delete clocks_[id];
    delete actions_[id];
    delete actionsF_[id];
  })
  event_init()
  
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );



}

//function load_p(){
//  loader.load('models/p.fbx', function (object) {
//    
//    //object.castShadow = true; 
//    //object.receiveShadow = true;
//    object.scale.set(0.001,0.001,0.001)
//    object.position.set(-0.1,-0.1,-0.1); 
//    object.traverse(function (child) {
//      if (child.isMesh) {
//        child.castShadow = true; 
//        child.receiveShadow = true;
//        
//      }
//    })
//    scene.add( object );
//  },
//  (xhr) => {
//      console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
//  },
//  (error) => {
//    console.log(error)
//  })
//}
function create_mesh(info){
  const [id,pos,rotationY,objId,action_bool] = info
  switch (objId) {
    case "zombi":
      loader.load('models/Samba Dancing.fbx', function (object) {
        scene.add( object );
        players_[id] = object;
        mixers_[id] = new THREE.AnimationMixer(object);
        actions_[id]= mixers_[id].clipAction(object.animations[0]);
        clocks_[id] = new THREE.Clock();
        actionsF_[id] = false;
        players_[id].scale.set(0.001,0.001,0.001)
        players_[id].position.set(...pos); 
       
        players_[id].rotation.set(0,rotationY,0)
        players_[id].traverse(function (child) {
          if (child.isMesh) {
            child.castShadow = true; 
            child.receiveShadow = true;
          }
        })
        if(!mainPlayer){
          mainPlayer = players_[id];
          mainId = id;
          animate();
        }
      },(xhr) => {console.log((xhr.loaded / xhr.total) * 100 + '% loaded')},(error) => {console.log(error)})
      break;
  }
}
function event_init(){
  keys = {
    a: false,
    s: false,
    d: false,
    w: false
  };
  document.body.addEventListener( 'keydown', function(e) {
    
    var key = e.code.replace('Key', '').toLowerCase();
    if ( keys[ key ] !== undefined )
      keys[ key ] = true;
    
  });
  document.body.addEventListener( 'keyup', function(e) {
    
    var key = e.code.replace('Key', '').toLowerCase();
    if ( keys[ key ] !== undefined )
      keys[ key ] = false;

  });
  keys2 = {
    m: false
  };
  document.body.addEventListener( 'keydown', function(e) {
    
    var key = e.code.replace('Key', '').toLowerCase();
    if ( keys2[ key ] !== undefined ){

      actionsF_[mainId] = !actionsF_[mainId]
      console.log(actionsF_[mainId])
    }
  });
}

function animate() {
  
  requestAnimationFrame( animate );
  for (let i in mixers_) {
    if(actions_[i].isScheduled() !== actionsF_[i]){
      if(actionsF_[i]){
        actions_[i].play()
        clocks_[i].start()
      }
      else{
        actions_[i].stop()
        clocks_[i].stop()
      }
    }
    if (mixers_[i]) mixers_[i].update(clocks_[i].getDelta() ); //clock.getDelta() берет изменение времени
  } 
  if (mainPlayer !== undefined) {
  speed = 0.0;
  //Отслеживание и изменение объекта на нажатие клавишь
  if ( keys.w )
    speed = 0.01;
  else if ( keys.s )
    speed = -0.01;

  velocity += ( speed - velocity ) * .3;
  mainPlayer.translateZ( velocity );
  if ( keys.a )
    mainPlayer.rotateY(0.05);
  else if ( keys.d )
    mainPlayer.rotateY(-0.05);
    a.lerp(mainPlayer.position, 0.4);
    b.copy(goal.position);
    dir.copy( a ).sub( b ).normalize();
    const dis = a.distanceTo( b ) - coronaSafetyDistance;
    goal.position.addScaledVector( dir, dis );
    camera.lookAt( mainPlayer.position );
    renderer.render( scene, camera );
  socket.emit("res_pos",[mainId,[...mainPlayer.position],mainPlayer.rotation.y,actionsF_[mainId]])
  breakpoint

  }
}