 window.addEventListener('load', () => {
            const canvas = document.getElementById('drawing-canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // --- STATE VARIABLES ---
            let drawableObjects = []; 
            let isDrawing = false;
            let currentPath = null; 
            let pathPoints = []; 
            let startPoint = { x: 0, y: 0 };

            // --- TOOLBAR SETTINGS ---
            let currentTool = 'brush';
            let currentColor = '#50fa7b';
            let currentSize = 5;
            let baseVelocity = 1;

            // --- SETUP ---
            function setCanvasSize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            setCanvasSize();
            window.addEventListener('resize', setCanvasSize);

            // --- DRAWABLE OBJECT CLASS ---
            class DrawableObject {
                constructor({ id, path, color, size, isFilled, startX, startY, width, height }) {
                    this.id = id;
                    this.path = path;
                    this.color = color;
                    this.size = size;
                    this.isFilled = isFilled;
                    this.x = startX;
                    this.y = startY;
                    this.width = width;
                    this.height = height;
                    this.vx = (Math.random() - 0.5) * baseVelocity * 2;
                    this.vy = (Math.random() - 0.5) * baseVelocity * 2;
                }

                update() {
                    this.x += this.vx;
                    this.y += this.vy;
                    
                    // --- IMPROVED WALL COLLISION ---
                    // Clamp position to stay within bounds and reverse velocity
                    if (this.x <= 0) {
                        this.x = 0;
                        this.vx *= -1;
                    } else if (this.x + this.width >= canvas.width) {
                        this.x = canvas.width - this.width;
                        this.vx *= -1;
                    }

                    if (this.y <= 0) {
                        this.y = 0;
                        this.vy *= -1;
                    } else if (this.y + this.height >= canvas.height) {
                        this.y = canvas.height - this.height;
                        this.vy *= -1;
                    }
                }

                draw() {
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.lineWidth = this.size;
                    ctx.strokeStyle = this.color;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.shadowColor = this.color;
                    ctx.shadowBlur = 10;
                    ctx.stroke(this.path);
                    if (this.isFilled) {
                        ctx.fillStyle = this.color;
                        ctx.fill(this.path);
                    }
                    ctx.restore();
                }
            }

            // --- PERFECT ELASTIC COLLISION RESOLUTION ---
            function resolveCollision(obj1, obj2) {
                const dx = (obj1.x + obj1.width / 2) - (obj2.x + obj2.width / 2);
                const dy = (obj1.y + obj1.height / 2) - (obj2.y + obj2.height / 2);
                const combinedHalfWidths = obj1.width / 2 + obj2.width / 2;
                const combinedHalfHeights = obj1.height / 2 + obj2.height / 2;

                if (Math.abs(dx) < combinedHalfWidths && Math.abs(dy) < combinedHalfHeights) {
                    
                    const overlapX = combinedHalfWidths - Math.abs(dx);
                    const overlapY = combinedHalfHeights - Math.abs(dy);

                    if (overlapX < overlapY) {
                        if (dx > 0) {
                            obj1.x += overlapX / 2;
                            obj2.x -= overlapX / 2;
                        } else {
                            obj1.x -= overlapX / 2;
                            obj2.x += overlapX / 2;
                        }
                    } else {
                        if (dy > 0) {
                            obj1.y += overlapY / 2;
                            obj2.y -= overlapY / 2;
                        } else {
                            obj1.y -= overlapY / 2;
                            obj2.y += overlapY / 2;
                        }
                    }
                    
                    const collisionNormalX = obj2.x - obj1.x;
                    const collisionNormalY = obj2.y - obj1.y;

                    const distance = Math.sqrt(collisionNormalX * collisionNormalX + collisionNormalY * collisionNormalY) || 1;
                    const unitNormalX = collisionNormalX / distance;
                    const unitNormalY = collisionNormalY / distance;
                    const unitTangentX = -unitNormalY;
                    const unitTangentY = unitNormalX;

                    const v1n = obj1.vx * unitNormalX + obj1.vy * unitNormalY;
                    const v1t = obj1.vx * unitTangentX + obj1.vy * unitTangentY;
                    const v2n = obj2.vx * unitNormalX + obj2.vy * unitNormalY;
                    const v2t = obj2.vx * unitTangentX + obj2.vy * unitTangentY;

                    const v1n_new = v2n;
                    const v2n_new = v1n;

                    obj1.vx = v1n_new * unitNormalX + v1t * unitTangentX;
                    obj1.vy = v1n_new * unitNormalY + v1t * unitTangentY;
                    obj2.vx = v2n_new * unitNormalX + v2t * unitTangentX;
                    obj2.vy = v2n_new * unitNormalY + v2t * unitTangentY;
                }
            }

            // --- ANIMATION LOOP ---
            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                drawableObjects.forEach((obj, index) => {
                    obj.update();
                    for (let i = index + 1; i < drawableObjects.length; i++) {
                        resolveCollision(obj, drawableObjects[i]);
                    }
                });
                
                drawableObjects.forEach(obj => { obj.draw(); });

                if (isDrawing && currentPath) {
                     ctx.lineWidth = currentSize;
                     ctx.strokeStyle = (currentTool === 'eraser') ? '#FFFFFF' : currentColor;
                     ctx.lineCap = 'round';
                     ctx.lineJoin = 'round';
                     ctx.stroke(currentPath);
                }
                requestAnimationFrame(animate);
            }
            animate();

            // --- EVENT LISTENERS ---
            function getMousePos(e) { return { x: e.clientX, y: e.clientY }; }

            function startDrawing(e) {
                isDrawing = true;
                const pos = getMousePos(e);
                startPoint = pos;
                pathPoints = [pos];
                currentPath = new Path2D();
                currentPath.moveTo(pos.x, pos.y);
            }

            function draw(e) {
                if (!isDrawing) return;
                const pos = getMousePos(e);
                if (currentTool === 'brush' || currentTool === 'eraser') {
                    pathPoints.push(pos);
                    currentPath.lineTo(pos.x, pos.y);
                } else {
                    const width = pos.x - startPoint.x;
                    const height = pos.y - startPoint.y;
                    currentPath = new Path2D();
                    if (currentTool === 'rectangle') {
                        currentPath.rect(startPoint.x, startPoint.y, width, height);
                    } else if (currentTool === 'circle') {
                        const radius = Math.sqrt(width**2 + height**2);
                        currentPath.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
                    } else if (currentTool === 'triangle') {
                        currentPath.moveTo(startPoint.x + width / 2, startPoint.y);
                        currentPath.lineTo(startPoint.x, startPoint.y + height);
                        currentPath.lineTo(startPoint.x + width, startPoint.y + height);
                        currentPath.closePath();
                    }
                }
            }

            function stopDrawing(e) {
                if (!isDrawing) return;
                isDrawing = false;
                const pos = getMousePos(e);

                let finalPath = new Path2D();
                let objStartX = startPoint.x;
                let objStartY = startPoint.y;
                let objWidth = Math.abs(pos.x - startPoint.x);
                let objHeight = Math.abs(pos.y - startPoint.y);
                
                if (currentTool === 'brush' || currentTool === 'eraser') {
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    pathPoints.forEach(p => {
                        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
                        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
                    });
                    const strokeOffset = currentSize / 2;
                    objStartX = minX - strokeOffset;
                    objStartY = minY - strokeOffset;
                    objWidth = (maxX - minX) + currentSize;
                    objHeight = (maxY - minY) + currentSize;

                    const relativePath = new Path2D();
                    relativePath.moveTo(pathPoints[0].x - objStartX, pathPoints[0].y - objStartY);
                    pathPoints.forEach(p => { relativePath.lineTo(p.x - objStartX, p.y - objStartY); });
                    finalPath = relativePath;
                    pathPoints = [];
                } else {
                    const width = pos.x - startPoint.x;
                    const height = pos.y - startPoint.y;
                    if (currentTool === 'rectangle') {
                        finalPath.rect(0, 0, width, height);
                        if (width < 0) objStartX = pos.x;
                        if (height < 0) objStartY = pos.y;
                    } else if (currentTool === 'circle') {
                        const radius = Math.sqrt(width**2 + height**2);
                        finalPath.arc(radius, radius, radius, 0, Math.PI * 2);
                        objWidth = objHeight = radius * 2;
                        objStartX -= radius; objStartY -= radius;
                    } else if (currentTool === 'triangle') {
                        finalPath.moveTo(objWidth/2, 0);
                        finalPath.lineTo(0, objHeight);
                        finalPath.lineTo(objWidth, objHeight);
                        finalPath.closePath();
                    }
                }
                
                if (objWidth < 1 && objHeight < 1) return;

                const newObject = new DrawableObject({
                    id: Date.now(),
                    path: finalPath,
                    color: currentTool === 'eraser' ? '#0d0f1a' : currentColor,
                    size: currentTool === 'eraser' ? currentSize * 3 : currentSize,
                    isFilled: false,
                    startX: objStartX, startY: objStartY,
                    width: objWidth, height: objHeight,
                });
                drawableObjects.push(newObject);
                currentPath = null;
            }

            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);

            // --- TOOLBAR CONTROLS ---
            document.querySelector('.bottom-controls').addEventListener('click', (e) => {
                const toolBtn = e.target.closest('.tool-btn');
                if (toolBtn) {
                    document.querySelector('.tool-btn.active').classList.remove('active');
                    toolBtn.classList.add('active');
                    currentTool = toolBtn.dataset.tool;
                }
                const colorSwatch = e.target.closest('.color-swatch');
                if (colorSwatch) {
                    document.querySelector('.color-swatch.selected').classList.remove('selected');
                    colorSwatch.classList.add('selected');
                    currentColor = colorSwatch.dataset.color;
                }
            });

            document.getElementById('size-slider').addEventListener('input', (e) => { currentSize = e.target.value; });
            document.getElementById('velocity-slider').addEventListener('input', (e) => {
                baseVelocity = e.target.value;
                document.getElementById('velocity-value').textContent = parseFloat(baseVelocity).toFixed(1);
            });
            document.getElementById('clear-canvas').addEventListener('click', () => { drawableObjects = []; });
            
        });