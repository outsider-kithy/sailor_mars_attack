window.addEventListener('DOMContentLoaded', function(){
    
    const webacamCanvas = document.getElementById("webacamCanvas");
    const webcamCtx = webacamCanvas.getContext("2d");
    const video = document.getElementById('video');
    const webGLCanvas = document.getElementById("webgl");

    const imgWidth = 960;
    const imgHeight = 640;
    const zOffset = -100;

    //Three.js
    let scene, camera, renderer, cylinder, texture;
    let centerX, centerY;

    //シーンの初期設定
    function threeSetup(canvas, imgWidth, imgHeight){
        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({
            antialias:true,
            alpha:true,
        });
        renderer.setSize(imgWidth, imgHeight);
        canvas.appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight ,1 ,1000);
        camera.position.set(0, 0, zOffset);
        camera.lookAt(0, 0, 0)
        
        let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        let directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        scene.add(directionalLight);

        //canvasからテクスチャを作成
        let textureCanvas = document.getElementById('uv');
        let textureCanvasctx = textureCanvas.getContext('2d');
        //console.log(ctx);
        
        let fontSize = 24;
        textureCanvasctx.font = `bold ${fontSize}px serif`;
        textureCanvasctx.fillStyle = `#ff0000`;
        textureCanvasctx.fillText('臨 兵 闘 者 皆 陣 列 在 前', 10, fontSize * 3);
        textureCanvasctx.textBaseline = 'middle';

        texture = new THREE.CanvasTexture(textureCanvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        //マテリアル
        let material = new THREE.MeshStandardMaterial({
            map:texture,
            transparent:true,
            color: new THREE.Color(0xfc1c03), 
            emissive: new THREE.Color(0xfc1c03),
            side: THREE.DoubleSide,
            depthWrite:false, //これ大事!
        });

        //円柱
        let geo = new THREE.CylinderGeometry(fontSize, fontSize, fontSize * 2, 32, 32, true);
        cylinder = new THREE.Mesh(geo, material);
        scene.add(cylinder);

        renderer.autoClear = false;

        return scene, camera, renderer;
    }
    //アニメーション
    function threeDraw(centerX, centerY){
        renderer.render(scene, camera);
        cylinder.rotation.y -= 0.1;
        cylinder.position.x = centerX;
        cylinder.position.y = centerY;
    }

    threeSetup(webGLCanvas, imgWidth, imgHeight);

    //検出した器官にマーカーを描く
    function detectAndDraw(net) {
        webcamCtx.drawImage(video, 0, 0, imgWidth, imgHeight);
        net
        .estimateSinglePose(video, {
            flipHorizontal: false
        })
        .then(function (pose) {
            moveBoxByNose(pose);
        });
    }


    //鼻の位置にcylinderを連動させる
    function moveBoxByNose(pose) {
        for (let j = 0; j < pose.keypoints.length; j++) {
        let keypoint = pose.keypoints[j];
        if(keypoint.part == "rightWrist"){
              let x = keypoint.position.x;
              let y = keypoint.position.y;
              //console.log(x, y);
              centerX = (-1 * (x - imgWidth / 2) / (imgWidth / 2)) * zOffset;
              centerY = ((y - imgHeight / 2) / (imgHeight / 2)) * zOffset;
              threeDraw(centerX, centerY);
          }
        }
    }

    //デバイスのカメラからの映像を取得する
    navigator.mediaDevices.getUserMedia({ audio: false, video: true })
    .then(function (mediaStream) {
        // videoタグのsrcObjectにセット
        video.srcObject = mediaStream;
        video.onloadedmetadata = function (e) {
        video.play();
        };
        //PoseNetモデルの読み込み
        return posenet.load();
    })

    //カメラからの映像の読み込みが完了したら、アニメーションを開始
    .then(function (net) {
        setInterval(function () { 
            detectAndDraw(net); }, 100);
    })
    .catch(function (err) {
        console.log("An error occured! " + err);
    });
});