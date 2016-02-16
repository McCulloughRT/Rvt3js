/* Modified from original code by Jeremy Tammik's vA3C plugin */

var selMaterial;
var lastMeshMaterial, lastMeshID, lastObjectMaterial, lastObjectID;
var targetList = [];

var material, mesh;
lastMeshMaterial = -1;
lastMeshID = -1;
lastObjectMaterial = -1;
lastObjectID = -1;

function computeNormalsAndFaces() {
  for (var i = 0; i < scene.children.length; i++) {
    if (scene.children[i].hasOwnProperty("geometry")) {
      scene.children[i].geometry.computeFaceNormals();
      targetList.push(scene.children[i]);
    }
    if (scene.children[i].children.length > 0) {
      for (var k = 0; k < scene.children[i].children.length; k++) {
        if (scene.children[i].children[k].hasOwnProperty("geometry")) {
          targetList.push(scene.children[i].children[k]);
        }
      }
    }
  }
}

function displayAttributes(obj) {
  msg.innerHTML = '';
  var arr = Object.keys(obj);
  for (var i = 0, len = arr.length; i < len; i++) {
    if (obj[arr[i]] != undefined) {
      if (obj[arr[i]].indexOf('http') == 0) {
        msg.innerHTML += '<a href="' + obj[arr[i]] + '">Click here</a><br>';
      } else {
        msg.innerHTML += arr[i] + ': ' + obj[arr[i]] + '<br>';
      }
    }
  }
}


function clickHandler(event) {
  // console.log( event );
  event.preventDefault();
  if (event.which == 2) {
    console.log('middle press');
  }

  selMaterial = new THREE.MeshBasicMaterial({
    color: 'red',
    side: '2'
  }); //color for selected mesh element

  //When clicking without selecting object, replace temp material for meshes and object3D
  if (lastMeshMaterial != -1) {
    //reset last material for last lastMeshID
    for (var i = 0; i < scene.children.length; i++) {
      if (scene.children[i].id == lastMeshID) {
        scene.children[i].material = lastMeshMaterial;
      }
    }
  }

  if (lastObjectMaterial != -1) {
    //reset last material for last lastObjectID
    for (var i = 0; i < scene.children.length; i++) {
      if (scene.children[i].id == lastObjectID) {
        for (var ii = 0; ii < scene.children[i].children.length; ii++) {
          scene.children[i].children[ii].material = lastObjectMaterial;
        }

      }
    }
  }


  var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -
    (event.clientY / window.innerHeight) * 2 + 1, 0.5);
  //projector.unprojectVector( vector, camera );
  vector.unproject(camera);

  var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position)
    .normalize());
  //var raycaster = new THREE.Raycaster( camera.position, vector.sub( ).normalize() );

  var intersects = raycaster.intersectObjects(targetList);
  //var intersects = raycaster.intersectObjects( scene.children.geometry );

  if (intersects.length > 0) {

    //   intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
    //console.log(intersects[0].object.userData);
    //console.log(intersects);
    var j = 0;
    while (j < intersects.length) {
      //FOR MESHES:
      if (!$.isEmptyObject(intersects[j].object.userData)) {
        console.log(intersects[j].object.userData);


        if (lastMeshMaterial != -1) {
          //reset last material for last lastMeshID
          for (var i = 0; i < scene.children.length; i++) {
            if (scene.children[i].id == lastMeshID) {
              scene.children[i].material = lastMeshMaterial;
            }
          }
        }

        //set lastMaterial
        lastMeshMaterial = intersects[j].object.material;

        //set lastMeshID
        lastMeshID = intersects[j].object.id;

        //apply SelMaterial
        intersects[j].object.material = selMaterial;


        displayAttributes(intersects[j].object.userData);

        break;
      }
      //FOR OBJECT3D
      if (!$.isEmptyObject(intersects[j].object.parent.userData)) {
        console.log(intersects[j].object.parent.userData);

        if (lastObjectMaterial != -1) {
          //reset last material for last lastObjectID
          for (var i = 0; i < scene.children.length; i++) {
            if (scene.children[i].id == lastObjectID) {
              for (var ii = 0; ii < scene.children[i].children.length; ii++) {
                scene.children[i].children[ii].material = lastObjectMaterial;
              }

            }
          }
        }

        //set lastMaterial
        lastObjectMaterial = intersects[j].object.material;

        //set lastObjectID
        lastObjectID = intersects[j].object.parent.id;

        //apply SelMaterial
        intersects[j].object.material = selMaterial;

        displayAttributes(intersects[j].object.parent.userData);
        break;
      }
      j++;
      msg.innerHTML = '';
    } // end of while loop

  } else {
    msg.innerHTML = '';
  }
  if(animLoop == false) {render();}
}
