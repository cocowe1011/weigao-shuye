<template>
  <div style="width: 100%;height: 100%;">
    <div class="canvas-container">
      <canvas ref="factoryCanvas"></canvas>
    </div>
  </div>
</template>
<script>
import * as THREE from "three";
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle'; // 引入节流函数
export default {
  name: "SmartFactory",
  components: {},
  props: {},
  data() {
    return {
      renderer: null,  // 渲染器
      scene: null,     // Three.js 场景
      camera: null,    // 相机
      heatingBlocks: [], // 加热区块
      isRunBelt: false,
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      overlays: [], // 存储所有浮层引用的数组
      scanners: [
        { id: 1, position: { x: -35, y: 12, z: 69 }, active: false },   // 调整到更下方的位置
      ],
      scannerMeshes: [], // 存储光电机器的3D对象
      motors: [
        { id: 1, position: { x: -30, y: 12, z: 69 }, active: false },  // 与光电扫描器保持同一高度
      ],
      motorMeshes: [], // 存储电机的3D对象
    };
  },
  created() {},
  mounted() {
    this.initScene();       // 初始化 Three.js 场景
    this.startAnimation();  // 启动动画循环
    window.addEventListener("resize", this.debouncedOnWindowResize);
    this.$refs.factoryCanvas.addEventListener('mousemove', this.throttledOnMouseMove);
    this.$refs.factoryCanvas.addEventListener('mouseleave', this.onMouseLeave); // 添加鼠标移出事件
    this.$refs.factoryCanvas.addEventListener('click', this.onOverlayClick);
    this.createScanners();
    this.createMotors();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.debouncedOnWindowResize);
    this.$refs.factoryCanvas.removeEventListener('mousemove', this.throttledOnMouseMove);
    this.$refs.factoryCanvas.removeEventListener('mouseleave', this.onMouseLeave);
    this.$refs.factoryCanvas.removeEventListener('click', this.onOverlayClick);
  },
  methods: {
    initScene(){
      // 初始化Three.js场景
      // 获取 canvas 元素
      const canvas = this.$refs.factoryCanvas;
      const canvasContainer = this.$el.querySelector('.canvas-container');
      // 创建 WebGLRenderer 渲染器
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      this.renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
      this.renderer.setClearColor(0x2c5364); // 更加工业化风格的背景色
      this.renderer.setPixelRatio(window.devicePixelRatio);
      // 创建场景和相机
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(55, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
      this.camera.position.set(0, 90, 100); // 相机初始位置
      this.camera.lookAt(0, 0, 0); // 相机看向原点

      // 添加光源
      const ambientLight = new THREE.AmbientLight(0x666666, 2.5); // 非常强的环境光
      this.scene.add(ambientLight);

      // 定向光（用于模拟太阳光）
      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.8);
      directionalLight.position.set(20, 50, 30); // 光源位置
      directionalLight.castShadow = true; // 开启阴影
      this.scene.add(directionalLight);

      // 工厂基础
      const factoryBaseGeometry = new THREE.PlaneGeometry(190, 190);
      const factoryBaseMaterial = new THREE.MeshStandardMaterial({ color: 0xe8f7ff, metalness: 0.3, roughness: 0.8 });
      const factoryBase = new THREE.Mesh(factoryBaseGeometry, factoryBaseMaterial);
      factoryBase.rotation.x = -Math.PI / 2;
      this.scene.add(factoryBase);

      // 添加传送带和功能区块
      this.addConveyorBelts();
      this.addFunctionalBlocks();
      // 添加预热房标识
      this.createLabel('预热房', -58, 10, 40, '#ffc800','100');

      // 添加灭菌区标识
      this.createLabel('灭菌区', -61, 10, -20, '#960505', '135');
    },
    createLabel(text, x, y, z, color, textSize) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      // 设置画布大小，确保足够大以保持文字清晰
      canvas.width = 512;
      canvas.height = 256;
      // 设置文本样式
      context.font = 'Bold ' + textSize + 'px Arial';
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      // 绘制水平文字
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      // 创建纹理并用于材质
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      // 创建材质和几何体
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const planeGeometry = new THREE.PlaneGeometry(20, 10); // 调整几何体的大小使文字合适
      const labelMesh = new THREE.Mesh(planeGeometry, material);
      // 设置位置和旋转，让文字平躺并与其他元素保持一致
      labelMesh.position.set(x, y, z);
      labelMesh.rotation.x = -Math.PI / 2; // 使文字平躺
      // 将标签添加到场景中
      this.scene.add(labelMesh);
    },
    // 创建传送带路径
    // position 位置（x,y,z）
    // length 长度
    // width 宽度
    // height 高度
    // rotation = [0, 0, 0] 旋转
    // beltSegments 滚轮数
    createConveyorBelt(position, length, width, height, rotation = [0, 0, 0], beltSegments, direction = 'left') {
      const conveyorBeltGroup = new THREE.Group();

      // 储存传送带的链条段
      conveyorBeltGroup.chainSegments = [];

      // 保存传送带的滚动方向
      conveyorBeltGroup.userData.direction = direction;

      // 材质设置
      const rollerMaterial = new THREE.MeshStandardMaterial({ color: 0x8b8b8b, metalness: 0.6, roughness: 0.3 });
      const chainMaterial = new THREE.MeshStandardMaterial({ color: 0x708090, metalness: 0.5, roughness: 0.4 });
      const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x3b3b3b, metalness: 0.4, roughness: 0.6 });
      const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x505050, metalness: 0.4, roughness: 0.5 }); // 包围框材质

      // 计算每段的长度
      const segmentLength = length / beltSegments;

      for (let i = 0; i < beltSegments; i++) {
        // 创建链条段
        const segmentGeometry = new THREE.BoxGeometry(segmentLength - 0.2, height / 10, width + 0.5);
        const segment = new THREE.Mesh(segmentGeometry, chainMaterial);
        const offset = -length / 2 + segmentLength * i + segmentLength / 2;
        segment.position.set(offset, height / 2 + 0.5, 0);
        conveyorBeltGroup.add(segment);

        // 将链条段添加到传送带的链条数组中
        if (direction !== '') {
          conveyorBeltGroup.chainSegments.push(segment);
        }
        // 创建滚轮
          const rollerRadius = height / 3; // 滚轮的半径
          const rollerHeight = width + 0.85; // 使用固定的高度，确保所有滚轮一致
        const rollerGeometry = new THREE.CylinderGeometry(rollerRadius, rollerRadius, rollerHeight, 32);
        const roller = new THREE.Mesh(rollerGeometry, rollerMaterial);
          roller.rotation.x = Math.PI / 2; // 使滚轮竖向放置，与链条段方向一致
          roller.position.set(offset, rollerRadius, 0); // 滚轮位置与链条段对齐
        conveyorBeltGroup.add(roller);

          // 创建滚轮底座平面
        const baseGeometry = new THREE.BoxGeometry(segmentLength, height / 20, width + 1);
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
          base.position.set(offset, rollerRadius - height / 3 - height / 20, 0); // 将底座放在滚轮的正下方，不交叉
        conveyorBeltGroup.add(base);
      }

      // 添加传送带侧边包围
      const sideHeight = height - 0.4; // 包围框高度（比传送带高一点）
      const sideThickness = 0.2; // 包围框厚度

      // 左侧包围框
      const leftSideGeometry = new THREE.BoxGeometry(length, sideHeight, sideThickness);
      const leftSide = new THREE.Mesh(leftSideGeometry, frameMaterial);
      leftSide.position.set(0, sideHeight / 2, -(width / 2 + sideThickness / 2 + 0.2)); // 放置在传送带左侧
      conveyorBeltGroup.add(leftSide);

      // 右侧包围框
      const rightSideGeometry = new THREE.BoxGeometry(length, sideHeight, sideThickness);
      const rightSide = new THREE.Mesh(rightSideGeometry, frameMaterial);
      rightSide.position.set(0, sideHeight / 2, width / 2 + sideThickness / 2 + 0.2); // 放置在传送带右侧
      conveyorBeltGroup.add(rightSide);

      // 保存传送带的其他属性
      conveyorBeltGroup.beltLength = length;

      // 设置传送带的位置和旋转
      conveyorBeltGroup.position.set(...position);
      conveyorBeltGroup.rotation.set(rotation[0] * Math.PI / 180, rotation[1] * Math.PI / 180, rotation[2] * Math.PI / 180);

      // 设置传送带为一个特殊的用户数据，用于动画控制
      conveyorBeltGroup.userData.isConveyorBelt = true;

      // 添加透明浮层
      const overlayGeometry = new THREE.BoxGeometry(length, 0.1, width);
      const overlayMaterial = new THREE.MeshStandardMaterial({
        color: 0xadd8e6, // 初始化为白色
        transparent: true,
        opacity: 0, // 初始不透明
        side: THREE.DoubleSide
      });
      const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
      overlay.position.set(0, height - 0.5, 0);  // 适当调整浮层的高度
      conveyorBeltGroup.add(overlay);
      overlay.userData.type = 'conveyorBeltOverlay';
      this.overlays.push(overlay); // 将浮层添加到数组中

      // 将传送带添加到场景
      this.scene.add(conveyorBeltGroup);
    },
    // 创建功能区块（预热区和消毒区）
    createFunctionalBlock(position, length, width, height, color, label, textColor) {
      // 创建功能性方块
      const blockGeometry = new THREE.BoxGeometry(length, height, width);
      const blockMaterial = new THREE.MeshStandardMaterial({ color: color });
      const functionalBlock = new THREE.Mesh(blockGeometry, blockMaterial);
      functionalBlock.position.set(...position);
      this.scene.add(functionalBlock);

      // 检查是否为加热区块
      if (label.match(/^\d+#$/)) {
        this.heatingBlocks.push(functionalBlock);
      }

      // 创建标签 (使用动态大小的平面)
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      // 设置画布大小，根据传入的长和宽调整
      canvas.width = length * 20;  // 使用适当的比例来转换长和宽，这里用 20 作为比例因子，您可以根据需要进行调整
      canvas.height = width * 10;  // 使用适当的比例来转换长和宽

        // 设置背景颜色
        // context.fillStyle = 'rgba(0, 0, 0, 0.5)'; // 设置背景颜色为半透明的黑色 (您可以更改颜色和透明度)
        // context.fillRect(0, 0, canvas.width, canvas.height); // 绘制矩形，覆盖整个画布

        // 设置文本样式
      context.font = 'Bold 150px Arial';
      context.fillStyle = textColor;  // 文字颜色为红色
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(label, canvas.width / 2, canvas.height / 2);  // 在画布上绘制文本

      // 创建纹理并用于材质
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
            transparent: true, // 使背景透明
            side: THREE.DoubleSide, // 让标签的两面都可见
      });

      // 创建平面几何体作为标签
      const planeGeometry = new THREE.PlaneGeometry(length, width / 2); // 使用与立方体相匹配的长和适当比例的宽
      const plane = new THREE.Mesh(planeGeometry, material);

      // 让平面躺下
      plane.rotation.x = -Math.PI / 2; // 沿 X 轴旋转 90 度，使其平躺

      // 设置平面的位置
      plane.position.set(position[0], position[1] + height / 2 + 0.1, position[2]); // 标签在立方体顶部稍微偏移一点高度

      // 将标签添加到场景中
      this.scene.add(plane);
      functionalBlock.userData.type = 'functionalBlock';
      functionalBlock.userData.color = color;
      this.overlays.push(functionalBlock); // 将功能块本身也添加到overlays
    },
    addConveyorBelts() {
      // 添加传送带-最下方
      this.createConveyorBelt([0, 5, 60], 100, 6, 3, [0, 0, 0], 100,'left');
      // 中间
      this.createConveyorBelt([-1, 5, 10], 100, 8, 3, [0, 0, 0], 95,'left');
      // 最上方
      this.createConveyorBelt([-2, 5, -60], 102.2, 11, 3, [0, 0, 0], 90,'right');
      // 右侧竖着的
      this.createConveyorBelt([54, 5, 43.5], 40, 7, 3, [90, -90, 90], 60,'right');
      // 右侧上货区
      this.createConveyorBelt([64.5, 5, 27.5], 13, 7, 3, [0, 0, 0], 18,'left');
      // 下货区竖着的
      this.createConveyorBelt([54, 5, -52], 30, 9, 3, [90, -90, 90], 15,'');

      // this.createConveyorBelt([0, 5, 60], 100, 6, 3, [0, 0, 0], 100,'left');
      // // 中间
      // this.createConveyorBelt([-1, 5, 10], 100, 8, 3, [0, 0, 0], 90,'left');
      // // 最上方
      // this.createConveyorBelt([-2, 5, -60], 102.2, 11, 3, [0, 0, 0], 80,'right');
      // // 右侧竖着的
      // this.createConveyorBelt([54, 5, 43.5], 40, 7, 3, [90, -90, 90], 60,'right');
      // // 右侧上货区
      // this.createConveyorBelt([64.5, 5, 27.5], 13, 7, 3, [0, 0, 0], 15,'left');
      // // 下货区竖着的
      // this.createConveyorBelt([54, 5, -52], 30, 9, 3, [90, -90, 90], 15,'');
    },
    addFunctionalBlocks() {
      const wordArr = ['G', 'F', 'E', 'D', 'C', 'B', 'A']
      // 添加预热区（黄色-下区域块）
      const preheatBlocksCount = 7;
        const preheatBlockWidth = 19;
        const preheatBlockHeight = 2;
        const preheatBlockLength = 12;
        for (let i = 0; i < preheatBlocksCount; i++) {
            const xOffset = -46 + i * (preheatBlockLength + 3); // 调整偏移量使其更加整齐
            this.createFunctionalBlock([xOffset, 2.4, 43.9], preheatBlockLength, preheatBlockWidth, preheatBlockHeight, 0xFFD580, wordArr[i] + "1", 'white');
        }

        // 添加预热区（黄色-上区域块）
        const preheatBlocksCount2 = 7;
        const preheatBlockWidth2 = 19;
        const preheatBlockHeight2 = 2;
        const preheatBlockLength2 = 12;
        for (let i = 0; i < preheatBlocksCount2; i++) {
            const xOffset = -46 + i * (preheatBlockLength2 + 3); // 调整偏移量使其更加整齐
            this.createFunctionalBlock([xOffset, 2.4, 23.2], preheatBlockLength2, preheatBlockWidth2, preheatBlockHeight2, 0xFFD580, wordArr[i] + "2",'white');
        }


        // 添加消毒区（红色区域）
      const disinfectionBlocksCount2 = 7;
      const disinfectionBlockWidth2 = 54;
      const disinfectionBlockHeight2 = 2;
      const disinfectionBlockLength2 = 12;
      for (let i = 0; i < disinfectionBlocksCount2; i++) {
            const xOffset = -47 + i * (disinfectionBlockLength2 + 3); // 调整偏移量使其更加整齐
        this.createFunctionalBlock([xOffset, 2, -29.5], disinfectionBlockLength2, disinfectionBlockWidth2, disinfectionBlockHeight2, 0xff4500, i + 1 + "#", 'white');
      }
    },
    onWindowResize() {
      const canvasContainer = this.$el.querySelector('.canvas-container');
      // 处理窗口大小调整
      if (this.renderer && this.camera) {
        this.renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
        this.camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
        this.camera.updateProjectionMatrix();
      }
    },
    // 动画渲染
    startAnimation() {
      const animate = () => {
        requestAnimationFrame(animate);
        // this.animateHeatingBlocks(); // 加热区块动画
        this.animateConveyorBelt();  // 传送带链条动画
        this.renderer.render(this.scene, this.camera);
      };
      animate();
    },
    animateHeatingBlocks() {
      this.heatingBlocks.forEach((block) => {
        const color = new THREE.Color(0xB22222);
        const emissiveColor = new THREE.Color(0xff4500);
        const intensity = (Math.sin(Date.now() * 0.002) + 1) / 2; // 双次振荡作用来回收线性动画
        block.material.color.lerpColors(color, emissiveColor, intensity);
      });
    },
    runbelt(flag) {
      this.isRunBelt = flag
    },
    animateConveyorBelt() {
      if (!this.isRunBelt) {
        return
      }
      // 遍历场景中的每个传送带对象，找到带有链条段的传送带
      this.scene.children.forEach(child => {
        if (child.userData && child.userData.isConveyorBelt) {  // 如果是传送带
          child.chainSegments.forEach((segment) => {
            const speed = 0.02;  // 设置链条的移动速度
            const direction = child.userData.direction;

            // 根据传送带的方向决定移动的方向
            if (direction === 'left') {
              segment.position.x -= speed;
            } else if (direction === 'right') {
              segment.position.x += speed;
            }

            // 如果链条段超出了传送带的长度范围，则重置其位置
            if (segment.position.x < -child.beltLength / 2) {
              segment.position.x = child.beltLength / 2;
            }
            if (segment.position.x > child.beltLength / 2) {
              segment.position.x = -child.beltLength / 2;
            }
          });
        }
      });
    },
    onMouseMove(event) {
      // 为每个浮层处理鼠标移动事件
      const rect = this.$refs.factoryCanvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      let isHovered, scanner, motor;  // 添加 motor 变量
      const intersects = this.raycaster.intersectObjects(this.overlays);
      this.overlays.forEach(overlay => {
        if (overlay.userData.type) {
          switch (overlay.userData.type) {
            case 'conveyorBeltOverlay':
              overlay.material.opacity = intersects.find(intersect => intersect.object === overlay) ? 0.5 : 0;
              break;
            case 'functionalBlock':
              overlay.material.color.set(intersects.find(intersect => intersect.object === overlay) ? 0xadd8e6 : overlay.userData.color);
              break;
            case 'scanner':
              isHovered = intersects.find(intersect => intersect.object === overlay);
              scanner = this.scannerMeshes.find(s => s.inner === overlay);
              if (scanner) {
                overlay.material.emissive.setHex(isHovered ? 0x00ff00 : 0x666666);
                overlay.material.emissiveIntensity = isHovered ? 1.0 : 0.5;
                scanner.glow.material.opacity = isHovered ? 0.4 : 0.2;
              }
              break;
            case 'motor':
              isHovered = intersects.find(intersect => intersect.object === overlay);
              motor = this.motorMeshes.find(m => m.inner === overlay);
              if (motor) {
                overlay.material.emissive.setHex(isHovered ? 0x0000ff : 0x666666);
                overlay.material.emissiveIntensity = isHovered ? 1.0 : 0.5;
                motor.glow.material.opacity = isHovered ? 0.4 : 0.2;
              }
              break;
          }
        }
      });
    },
    onMouseLeave(event) {
      let scanner, motor;  // 添加 motor 变量
      this.overlays.forEach(overlay => {
        if (overlay.userData.type) {
          switch (overlay.userData.type) {
            case 'conveyorBeltOverlay':
              overlay.material.opacity = 0;
              break;
            case 'functionalBlock':
              overlay.material.color.set(overlay.userData.color);
              break;
            case 'scanner':
              scanner = this.scannerMeshes.find(s => s.inner === overlay);
              if (scanner) {
                overlay.material.emissive.setHex(0x666666);
                overlay.material.emissiveIntensity = 0.5;
                scanner.glow.material.opacity = 0.2;
              }
              break;
            case 'motor':
              motor = this.motorMeshes.find(m => m.inner === overlay);
              if (motor) {
                overlay.material.emissive.setHex(0x666666);
                overlay.material.emissiveIntensity = 0.5;
                motor.glow.material.opacity = 0.2;
              }
              break;
          }
        }
      });
    },
    onOverlayClick(event) {
      // 处理点击事件
      this.raycaster.setFromCamera(this.mouse, this.camera);
      this.overlays.forEach(overlay => {
        const intersects = this.raycaster.intersectObject(overlay);
        if (intersects.length > 0) {
          console.log('Overlay clicked!', overlay);
        }
      });
    },
    createScanners() {
      this.scanners.forEach((scanner, index) => {
        // 创建文字标签
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 2560;
        canvas.height = 2560;
        context.font = 'Bold 600px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.shadowColor = 'rgba(0, 0, 0, 0.5)';
        context.shadowBlur = 30;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.fillText(`${String.fromCharCode(65 + index)}`, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const labelGeometry = new THREE.PlaneGeometry(8, 8);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(scanner.position.x - 2, scanner.position.y, scanner.position.z);
        label.rotation.order = 'YXZ';
        label.rotation.x = -Math.PI / 2;
        label.rotation.y = 0;
        label.rotation.z = 0;
        this.scene.add(label);

        // 创建外圈
        const ringGeometry = new THREE.RingGeometry(0.6, 0.8, 32);
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.8,
          roughness: 0.2,
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        // 创建内部发光圆
        const innerGeometry = new THREE.CircleGeometry(0.5, 32);
        const innerMaterial = new THREE.MeshStandardMaterial({
          color: 0x222222,
          metalness: 0.7,
          roughness: 0.3,
          emissive: 0x666666,
          emissiveIntensity: 0.5
        });
        const inner = new THREE.Mesh(innerGeometry, innerMaterial);
        inner.position.z = 0.01;

        // 创建发光效果
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide
        });
        const glowGeometry = new THREE.CircleGeometry(1.0, 32);
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.01;

        // 创建光电扫描器组
        const scannerGroup = new THREE.Group();
        scannerGroup.add(ring);
        scannerGroup.add(inner);
        scannerGroup.add(glow);
        
        scannerGroup.rotation.x = -Math.PI / 2;
        scannerGroup.position.set(scanner.position.x, scanner.position.y, scanner.position.z);
        
        this.scene.add(scannerGroup);
        inner.userData.type = 'scanner';
        inner.userData.active = scanner.active;
        this.overlays.push(inner);
        
        this.scannerMeshes.push({
          inner,
          glow: glow,
          active: scanner.active
        });
      });
    },
    createMotors() {
      this.motors.forEach((motor, index) => {
        // 创建文字标签
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 2560;
        canvas.height = 2560;
        context.font = 'Bold 600px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.shadowColor = 'rgba(0, 0, 0, 0.5)';
        context.shadowBlur = 30;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.fillText('M', canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const labelMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const labelGeometry = new THREE.PlaneGeometry(8, 8);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(motor.position.x - 2, motor.position.y, motor.position.z);
        label.rotation.x = -Math.PI / 2;
        this.scene.add(label);

        // 创建六边形外框
        const hexagonShape = new THREE.Shape();
        const size = 0.8;
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const x = size * Math.cos(angle);
          const y = size * Math.sin(angle);
          if (i === 0) {
            hexagonShape.moveTo(x, y);
          } else {
            hexagonShape.lineTo(x, y);
          }
        }
        hexagonShape.closePath();
        
        const hexGeometry = new THREE.ShapeGeometry(hexagonShape);
        const ringMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.8,
          roughness: 0.2,
          side: THREE.DoubleSide
        });
        const hexagon = new THREE.Mesh(hexGeometry, ringMaterial);
        
        // 创建内部发光圆
        const innerHexagonShape = new THREE.Shape();
        const innerSize = 0.6;
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const x = innerSize * Math.cos(angle);
          const y = innerSize * Math.sin(angle);
          if (i === 0) {
            innerHexagonShape.moveTo(x, y);
          } else {
            innerHexagonShape.lineTo(x, y);
          }
        }
        innerHexagonShape.closePath();
        const innerGeometry = new THREE.ShapeGeometry(innerHexagonShape);
        const innerMaterial = new THREE.MeshStandardMaterial({
          color: 0x222222,
          metalness: 0.7,
          roughness: 0.3,
          emissive: 0x666666,
          emissiveIntensity: 0.5
        });
        const inner = new THREE.Mesh(innerGeometry, innerMaterial);
        inner.position.z = 0.01;

        // 创建发光效果
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0x0000ff,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide
        });
        // 创建更大的六边形作为发光效果
        const glowShape = new THREE.Shape();
        const glowSize = 1.0;
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const x = glowSize * Math.cos(angle);
          const y = glowSize * Math.sin(angle);
          if (i === 0) {
            glowShape.moveTo(x, y);
          } else {
            glowShape.lineTo(x, y);
          }
        }
        glowShape.closePath();
        const glowGeometry = new THREE.ShapeGeometry(glowShape);
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.z = -0.01;

        const motorGroup = new THREE.Group();
        motorGroup.add(hexagon);
        motorGroup.add(inner);
        motorGroup.add(glow);
        
        motorGroup.rotation.x = -Math.PI / 2;
        motorGroup.position.set(motor.position.x, motor.position.y, motor.position.z);
        
        this.scene.add(motorGroup);
        inner.userData.type = 'motor';
        inner.userData.active = motor.active;
        this.overlays.push(inner);
        
        this.motorMeshes.push({
          inner,
          glow: glow,
          active: motor.active
        });
      });
    }
  },
  computed: {
    debouncedOnWindowResize() {
      return debounce(this.onWindowResize, 100);
    },
    throttledOnMouseMove() {
      return throttle(this.onMouseMove, 100);
    }
  }
};
</script>
<style lang="less" scoped>
body {
  margin: 0;
  font-family: "Roboto", sans-serif;
  background-color: #1a1a1a;
  overflow: hidden;
  color: #e0e0e0;
}
.canvas-container {
  height: 100%;
  width: 100%;
  position: relative;
}
</style>