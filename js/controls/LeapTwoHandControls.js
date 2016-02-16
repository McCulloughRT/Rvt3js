/* 
 * Leap Eye Look Controls
 * Author: @Nashira
 *
 * http://github.com/leapmotion/Leap-Three-Camera-Controls/    
 *    
 * Copyright 2014 LeapMotion, Inc    
 *    
 * Licensed under the Apache License, Version 2.0 (the "License");    
 * you may not use this file except in compliance with the License.    
 * You may obtain a copy of the License at    
 *    
 *     http://www.apache.org/licenses/LICENSE-2.0    
 *    
 * Unless required by applicable law or agreed to in writing, software    
 * distributed under the License is distributed on an "AS IS" BASIS,    
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.    
 * See the License for the specific language governing permissions and    
 * limitations under the License.    
 *    
 */    

THREE.LeapTwoHandControls = (function () {
  
  var PI_2 = Math.PI * 2;
  var X_AXIS = new THREE.Vector3(1, 0, 0);
  var Y_AXIS = new THREE.Vector3(0, 1, 0);
  var Z_AXIS = new THREE.Vector3(0, 0, 1);
  
  var LeapTwoHandControls = function (object, controller, invert) {
    this.object = object;
    this.controller = controller;
    this.invert = (invert === undefined ? true : invert);
    this.anchorDelta = 1;
    
    this.translationSpeed = 20;
    this.translationDecay = 0.3;
    this.scaleDecay = 0.5;
    this.rotationSlerp = 0.8;
    this.rotationSpeed = 4;
    this.pinchThreshold = 0.5;
    this.transSmoothing = 0.5;
    this.rotationSmoothing = 0.2;
    
    this.vector = new THREE.Vector3();
    this.vector2 = new THREE.Vector3();
    this.matrix = new THREE.Matrix4();
    this.quaternion = new THREE.Quaternion();
    this.rotationMomentum = new THREE.Quaternion();
    this.translationMomentum = new THREE.Vector3();
    this.scaleMomentum = new THREE.Vector3(1, 1, 1);
    this.rotationMomentum = this.object.quaternion.clone();

    this.transLP = [
        new LowPassFilter(this.transSmoothing),
        new LowPassFilter(this.transSmoothing),
        new LowPassFilter(this.transSmoothing)];

    this.rotLP = [
        new LowPassFilter(this.rotationSmoothing),
        new LowPassFilter(this.rotationSmoothing),
        new LowPassFilter(this.rotationSmoothing)];
  }
  
  LeapTwoHandControls.prototype.update = function() {
    
    // Just incase this is overwritten somewhere else in the code
    this.object.matrixAutoUpdate = true;
    
    var self = this;
    var frame = this.controller.frame();
    var anchorFrame = this.controller.frame(this.anchorDelta);

    // do we have a frame
    if (!frame || !frame.valid || !anchorFrame || !anchorFrame.valid) {
      return;
    }
    
    // match hands to anchors
    // remove hands that have disappeared
    // add hands that have appeared
    var rawHands = frame.hands;
    var rawAnchorHands = anchorFrame.hands;
    
    var hands = [];
    var anchorHands = [];
    
    rawHands.forEach(function (hand, hIdx) {
      var anchorHand = anchorFrame.hand(hand.id);
      if (anchorHand.valid) {
        hands.push(hand);
        anchorHands.push(anchorHand);
      }
    });
    
    if (hands.length) {
      // translation
      if (this.shouldTranslate(anchorHands, hands)) {
        this.applyTranslation(anchorHands, hands);
      }
      
      // rotation
      if (this.shouldRotate(anchorHands, hands)) {
        this.applyRotation(anchorHands, hands);
      }
      
      // scale
      if (this.shouldScale(anchorHands, hands)) {
        this.applyScale(anchorHands, hands);
      }
    }
    
    this.object.position.add(this.translationMomentum);
    this.translationMomentum.multiplyScalar(this.translationDecay);

    this.object.quaternion.slerp(this.rotationMomentum, this.rotationSlerp);
    this.object.quaternion.normalize();

    this.object.scale.lerp(this.scaleMomentum, this.scaleDecay);
  }
  
  LeapTwoHandControls.prototype.shouldTranslate = function (anchorHands, hands) {
    var isEngaged = this.isEngaged.bind(this);
    return hands.some(isEngaged);
  }
  
  LeapTwoHandControls.prototype.shouldScale = function (anchorHands, hands) {
    var isEngaged = this.isEngaged.bind(this);
    return anchorHands.every(isEngaged) && hands.every(isEngaged);
  }
  
  LeapTwoHandControls.prototype.shouldRotate = function (anchorHands, hands) {
    var isEngaged = this.isEngaged.bind(this);
    return anchorHands.length > 1
        && hands.length > 1
        && anchorHands.every(isEngaged)
        && hands.every(isEngaged);
  }
  
  LeapTwoHandControls.prototype.applyTranslation = function (anchorHands, hands) {
    var isEngaged = this.isEngaged.bind(this);
    var translation = this.getTranslation(
                                anchorHands.filter(isEngaged),
                                hands.filter(isEngaged));
    
    translation[0] = this.transLP[0].sample(translation[0]);
    translation[1] = this.transLP[1].sample(translation[1]);
    translation[2] = this.transLP[2].sample(translation[2]);
    
    this.vector.fromArray(translation);
    if (this.invert) {
      this.vector.negate();
    }
    this.vector.multiplyScalar(this.translationSpeed);
    this.vector.applyQuaternion(this.object.quaternion);
    this.translationMomentum.add(this.vector);
  }
  
  LeapTwoHandControls.prototype.applyRotation = function (anchorHands, hands) {
    var rotation = this.getRotation(anchorHands, hands);
    rotation[0] = this.rotLP[0].sample(rotation[0]);
    rotation[1] = this.rotLP[1].sample(rotation[1]);
    rotation[2] = this.rotLP[2].sample(rotation[2]);
    this.vector.fromArray(rotation);
    this.vector.multiplyScalar(this.rotationSpeed);
    if (this.invert) {
      this.vector.negate();
    }

    this.quaternion.setFromAxisAngle(X_AXIS, this.vector.x);
    this.rotationMomentum.multiply(this.quaternion);
    this.quaternion.setFromAxisAngle(Y_AXIS, this.vector.y);
    this.rotationMomentum.multiply(this.quaternion);
    this.quaternion.setFromAxisAngle(Z_AXIS, this.vector.z);
    this.rotationMomentum.multiply(this.quaternion);
  
    this.rotationMomentum.normalize();
  }
  
  LeapTwoHandControls.prototype.applyScale = function (anchorHands, hands) {
    var scale = this.getScale(anchorHands, hands);
    this.scaleMomentum.multiplyScalar(scale[3]);
  }
  
  LeapTwoHandControls.prototype.getTranslation = function(anchorHands, hands) {
    if (anchorHands.length != hands.length) {
      return [0, 0, 0];
    }
    var centerAnchor = getCenter(anchorHands);
    var centerCurrent = getCenter(hands);
    return [
      centerCurrent[0] - centerAnchor[0],
      centerCurrent[1] - centerAnchor[1],
      centerCurrent[2] - centerAnchor[2]
    ];
  }
  
  LeapTwoHandControls.prototype.getScale = function(anchorHands, hands) {
    if (hands.length < 2 || anchorHands.length < 2) {
      return [1, 1, 1, 1];
    }
    
    var centerAnchor = getCenter(anchorHands);
    var centerCurrent = getCenter(hands);
    var aveRadiusAnchor = aveDistance(centerAnchor, anchorHands);
    var aveRadiusCurrent = aveDistance(centerCurrent, hands);
    
    // scale of current over previous
    return [
      aveRadiusCurrent[0] / aveRadiusAnchor[0],
      aveRadiusCurrent[1] / aveRadiusAnchor[1],
      aveRadiusCurrent[2] / aveRadiusAnchor[2],
      length(aveRadiusCurrent) / length(aveRadiusAnchor)
    ];
  }
  
  LeapTwoHandControls.prototype.getRotation = function(anchorHands, hands) {
    if (hands.length < 1 || anchorHands.length < 1
        || hands.length != anchorHands.length) {
      return [0, 0, 0];
    }

    var am = getAxisMag(hands);
    if (am[3] < 6000) {
      return [0, 0, 0];
    }
    var mi = 1 / am[3];
    am[0]*=mi;
    am[1]*=mi;
    am[2]*=mi;
  
    var anchorAngles = getAngles(anchorHands);
    var angles = getAngles(hands);
  
    var dx = angles[0] - anchorAngles[0];
    var dy = angles[1] - anchorAngles[1];
    var dz = angles[2] - anchorAngles[2];
  
    if (dx > Math.PI) dx = dx - PI_2;
    else if (dx < -Math.PI) dx = dx + PI_2;
    if (dy > Math.PI) dy = dy - PI_2;
    else if (dy < -Math.PI) dy = dy + PI_2;
    if (dz > Math.PI) dz = dz - PI_2;
    else if (dz < -Math.PI) dz = dz + PI_2;

    return [dx * am[0], dy * am[1], dz * am[2]];
  }
  

  LeapTwoHandControls.prototype.isEngaged = function(h) {
    return h && (h.pinchStrength > this.pinchThreshold);
  }
  
  function getCenter(hands) {
    var l = hands.length;
    if (l == 0) {
      return [0, 0, 0];
    } else if (l == 1) {
      return hands[0].palmPosition;
    }
    
    var x = y = z = 0;
    hands.forEach(function (hand, i) {
      x += hand.palmPosition[0];
      y += hand.palmPosition[1];
      z += hand.palmPosition[2];
    });
    return [x/l, y/l, z/l];
  }

  function getAngles(hands) {
    if (hands.length == 0) {
      return [0, 0, 0];
    }
  
    var pos1;
    var hand = hands[0];
    if (hands.length > 1) {
      pos1 = hands[1].palmPosition;
    } else {
      pos1 = hand.frame.interactionBox.center;
    }
  
    var pos2 = hand.palmPosition;
  
    var dx = pos2[0] - pos1[0];
    var dy = pos2[1] - pos1[1];
    var dz = pos2[2] - pos1[2];

    var ax = Math.atan2(dy, dz);
    var ay = Math.atan2(dx, dz);
    var az = Math.atan2(dy, dx);
    return [ax, ay, az];
  }

  function getAxisMag(hands) {
    if (hands.length == 0) {
      return [0, 0, 0, 0];
    }
  
    var pos1;
    var hand = hands[0];
    if (hands.length > 1) {
      pos1 = hands[1].palmPosition;
    } else {
      pos1 = hand.frame.interactionBox.center;
    }
  
    var pos2 = hand.palmPosition;
  
    var dx = pos2[0] - pos1[0];
    var dy = pos2[1] - pos1[1];
    var dz = pos2[2] - pos1[2];
    var mag = dx * dx + dy * dy + dz * dz;
  
    var ax = dy * dy + dz * dz;
    var ay = dx * dx + dz * dz;
    var az = dy * dy + dx * dx;
  
    return [ax, ay, az, mag];
  }
  
  function aveDistance(center, hands) {
    var aveDistance = [0, 0, 0];
    hands.forEach(function (hand) {
      var p = hand.palmPosition;
      aveDistance[0] += Math.abs(p[0] - center[0]);
      aveDistance[1] += Math.abs(p[1] - center[1]);
      aveDistance[2] += Math.abs(p[2] - center[2]);
    });
    aveDistance[0] /= hands.length;
    aveDistance[1] /= hands.length;
    aveDistance[2] /= hands.length;
    return aveDistance;
  }
  
  function length(arr) {
    var sum = 0;
    arr.forEach(function (v) {
      sum += v * v;
    });
    return Math.sqrt(sum);
  }
  
  function dist(arr1, arr2) {
    var sum = 0;
    arr1.forEach(function (v, i) {
      var d = v - arr2[i];
      sum += d * d;
    });
    return Math.sqrt(sum);
  }


  function LowPassFilter(cutoff) {
    var accumulator = 0;
  
    this.setCutoff = function (value) {
      cutoff = value;
    };
  
    this.sample = function(sample) {
      accumulator += (sample - accumulator) * cutoff;
      return accumulator;
    }
  }
  
  return LeapTwoHandControls;
}());
